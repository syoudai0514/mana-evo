import React, { useEffect, useMemo, useState } from 'react'
import { SUBJECTS } from './study/questions.js'
import {
  answerQuestion,
  createStudyState,
  normalizeStudyState,
  pickDailyQuestions,
  pickFreeStudyQuestion
} from './study/engine.js'
import { createGameState, grantLearningReward, normalizeGameState } from './game/progression.js'
import { speciesOf } from './game/content.js'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { AdventureFlow, MonsterScreen } from './game/GameScreens.jsx'

const SAVE_KEY = 'mana-evo-save-v1'

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    return {
      study: normalizeStudyState(parsed?.study || createStudyState()),
      game: normalizeGameState(parsed?.game || createGameState())
    }
  } catch {
    return { study: createStudyState(), game: createGameState() }
  }
}

function StatusBar({ game }) {
  return <div className="status-bar"><span>🎫 {game.tickets}</span><span>💎 {game.mana}</span><span>⭕ {game.captureRings}</span></div>
}

function Home({ study, game, go }) {
  const left = Math.max(0, 5 - (study.daily?.answered || 0))
  const monster = game.box[game.activeMonsterId]
  const species = monster ? speciesOf(monster.speciesId) : null
  return (
    <main className="screen home-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow">きょうの まなび</p>
          <h1>{study.daily.completed ? 'クリア！' : `あと ${left} もん！`}</h1>
          <div className="progress-dots">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < (study.daily.answered || 0) ? 'done' : ''} />)}</div>
          <button className="primary" onClick={() => go('daily')}>{study.daily.completed ? 'もういちど まなぶ' : 'まなぶ！'}</button>
        </div>
        {monster && <PlaceholderMonster speciesId={monster.speciesId} excited={study.daily.completed} />}
      </section>

      <section className={`adventure-card ${game.tickets < 1 ? 'locked' : ''}`}>
        <div>
          <p className="eyebrow">ぼうけん</p>
          <h2>{game.tickets > 0 ? `あと ${game.tickets} かい ぼうけん！` : 'チケットが ないよ'}</h2>
          <p>{game.tickets > 0 ? 'マップで敵を見つけて、バトル・捕獲・育成！' : '追加で1もん正解すると、バトルチケット +1！'}</p>
        </div>
        <button className={game.tickets > 0 ? 'battle' : 'secondary'} onClick={() => go(game.tickets > 0 ? 'adventure' : 'free')}>{game.tickets > 0 ? 'マップへ！' : 'もう1もん！'}</button>
      </section>

      <section className="grid-two">
        <button className="menu-card" onClick={() => go('free')}><strong>📚 自由学習</strong><span>苦手・得意・チャレンジ</span></button>
        <button className="menu-card" onClick={() => go('monsters')}><strong>🐾 モンスター</strong><span>{species?.name || '相棒'} Lv.{monster?.level || 1}</span></button>
      </section>

      <section className="home-loop-card">
        <strong>「もっと遊びたい」が勉強につながる！</strong>
        <span>基本5問 → 🎫×3 → 冒険 → もっと遊ぶなら追加1問 → 🎫+1</span>
      </section>
    </main>
  )
}

function QuestionCard({ question, onAnswer, onQuit }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)

  const speak = () => {
    if (!question.speak || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question.speak)
    utterance.lang = 'en-US'
    utterance.rate = 0.82
    speechSynthesis.speak(utterance)
  }

  const submit = (choice) => {
    if (result) return
    setSelected(choice)
    setResult(onAnswer(choice))
  }

  return (
    <section className="question-card">
      <div className="question-top"><span className="pill">{SUBJECTS.find((s) => s.id === question.subject)?.label}</span><span className="difficulty">{'★'.repeat(question.difficulty)}</span></div>
      {question.hard && <div className="challenge-banner">🔥 むずかしい</div>}
      <h2>{question.prompt}</h2>
      {question.speak && <button className="listen" onClick={speak}>🔊 もう一度きく</button>}
      <div className="choices">{question.choices.map((choice) => <button key={choice} className={`${selected === choice ? 'selected' : ''} ${result && choice === question.answer ? 'correct' : ''}`} onClick={() => submit(choice)}>{choice}</button>)}</div>
      {result && <div className={`answer-box ${result.correct ? 'good' : 'retry'}`}><strong>{result.correct ? 'せいかい！ 🎉' : 'おしい！'}</strong><p>{question.explanation}</p>{result.ticketDelta > 0 && <p className="reward">🎫 バトルチケット +{result.ticketDelta}</p>}</div>}
      {result ? <button className="primary" onClick={result.next}>つぎへ</button> : <button className="text-button" onClick={onQuit}>やめる</button>}
    </section>
  )
}

function DailyStudy({ study, setStudy, setGame, go }) {
  const [queue] = useState(() => pickDailyQuestions(study))
  const [index, setIndex] = useState(0)
  const question = queue[index]

  if (!question) return <main className="screen"><section className="celebration"><h1>きょうの まなび クリア！</h1><p>🎫 バトルチケットを 3まいゲット！</p><PlaceholderMonster speciesId="starter-fire-1" excited /><button className="primary" onClick={() => go('adventure')}>ぼうけんへ！</button></section></main>

  const handleAnswer = (choice) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'daily' })
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    setStudy(outcome.state)
    setGame((game) => grantLearningReward(game, { ticketDelta: outcome.ticketDelta, unitMastered: newlyMastered }))
    return { correct: outcome.correct, ticketDelta: outcome.ticketDelta, next: () => setIndex((i) => i + 1) }
  }

  return <main className="screen"><p className="counter">もんだい {index + 1}/{queue.length}</p><QuestionCard key={question.id} question={question} onAnswer={handleAnswer} onQuit={() => go('home')} /></main>
}

const FREE_MODES = [['recommended', '✨ おすすめ'], ['weak', '💪 苦手を克服'], ['strong', '🚀 得意を伸ばす'], ['challenge', '🔥 チャレンジ']]

function FreeStudy({ study, setStudy, setGame, go }) {
  const [mode, setMode] = useState('recommended')
  const [subject, setSubject] = useState(null)
  const [nonce, setNonce] = useState(0)
  const question = useMemo(() => pickFreeStudyQuestion(study, { mode, subject }), [study, mode, subject, nonce])

  if (!question) return <main className="screen"><button className="back" onClick={() => go('home')}>← もどる</button><p>このコースの問題は まだ準備中です。</p></main>

  const handleAnswer = (choice) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'free' })
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    const newlyHard = !before?.hardMastered && outcome.unit.hardMastered
    setStudy(outcome.state)
    setGame((game) => grantLearningReward(game, { ticketDelta: outcome.ticketDelta, unitMastered: newlyMastered, hardMastered: newlyHard }))
    return { correct: outcome.correct, ticketDelta: outcome.ticketDelta, next: () => setNonce((n) => n + 1) }
  }

  return (
    <main className="screen">
      <button className="back" onClick={() => go('home')}>← ホーム</button>
      <div className="screen-title-row"><div><p className="eyebrow">もっと遊びたいときも</p><h1>自由学習</h1></div></div>
      <p className="kid-note">どれを選んでも、正解1問で 🎫+1。得意だけを続けると Kids Quest の難易度調整で少しずつ難しくなるよ。</p>
      <div className="mode-row">{FREE_MODES.map(([id, label]) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}>{label}</button>)}</div>
      <div className="subject-row"><button className={!subject ? 'active' : ''} onClick={() => setSubject(null)}>ぜんぶ</button>{SUBJECTS.map((s) => <button key={s.id} className={subject === s.id ? 'active' : ''} onClick={() => setSubject(s.id)}>{s.icon}</button>)}</div>
      <QuestionCard key={`${question.id}-${nonce}`} question={question} onAnswer={handleAnswer} onQuit={() => go('home')} />
    </main>
  )
}

export default function App() {
  const initial = useMemo(loadSave, [])
  const [study, setStudy] = useState(initial.study)
  const [game, setGame] = useState(initial.game)
  const [view, setView] = useState('home')
  const go = setView

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ study, game }))
  }, [study, game])

  return (
    <div className="app-shell">
      <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} /></header>
      {view === 'home' && <Home study={study} game={game} go={go} />}
      {view === 'daily' && <DailyStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'free' && <FreeStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'adventure' && <AdventureFlow game={game} setGame={setGame} goHome={() => go('home')} goStudy={() => go('free')} />}
      {view === 'monsters' && <MonsterScreen game={game} setGame={setGame} goHome={() => go('home')} />}
      {!['daily', 'free'].includes(view) && <nav><button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}>🏠<span>ホーム</span></button><button className={view === 'adventure' ? 'active' : ''} onClick={() => go('adventure')}>🗺️<span>ぼうけん</span></button><button className={view === 'monsters' ? 'active' : ''} onClick={() => go('monsters')}>🐾<span>モンスター</span></button><button onClick={() => go('free')}>📚<span>まなぶ</span></button></nav>}
    </div>
  )
}
