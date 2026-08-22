import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SUBJECTS } from './study/questions.js'
import {
  answerQuestion,
  completeRemediation,
  createStudyState,
  normalizeStudyState,
  pickFreeStudyQuestion,
  remainingDailyQuestions,
  startDailySession
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
  return <div className="status-bar"><span>🎫 {game.tickets}</span><span>💎 {game.mana}</span><span>⭐ {game.captureItems?.star || 0}</span></div>
}

function Home({ study, game, go }) {
  const doneCount = study.daily?.completedQuestionIds?.length ?? study.daily?.answered ?? 0
  const left = Math.max(0, 5 - doneCount)
  const monster = game.box[game.activeMonsterId]
  const species = monster ? speciesOf(monster.speciesId) : null
  const noTicketTarget = study.daily.completed ? 'free' : 'daily'
  return (
    <main className="screen home-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow">きょうの まなび</p>
          <h1>{study.daily.completed ? 'クリア！' : `あと ${left} もん！`}</h1>
          <div className="progress-dots">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < doneCount ? 'done' : ''} />)}</div>
          <button className="primary" onClick={() => go(study.daily.completed ? 'free' : 'daily')}>{study.daily.completed ? 'もっと まなぶ' : 'まなぶ！'}</button>
        </div>
        {monster && <PlaceholderMonster speciesId={monster.speciesId} excited={study.daily.completed} />}
      </section>

      <section className={`adventure-card ${game.tickets < 1 ? 'locked' : ''}`}>
        <div>
          <p className="eyebrow">ぼうけん</p>
          <h2>{game.tickets > 0 ? `あと ${game.tickets} かい ぼうけん！` : 'チケットが ないよ'}</h2>
          <p>{game.tickets > 0 ? 'マップで敵を見つけて、バトル・捕獲・育成！' : study.daily.completed ? '追加で1もん正解すると、バトルチケット +1！' : 'まず今日の基本5問を終えると、バトルチケット×3！'}</p>
        </div>
        <button className={game.tickets > 0 ? 'battle' : 'secondary'} onClick={() => go(game.tickets > 0 ? 'adventure' : noTicketTarget)}>{game.tickets > 0 ? 'マップへ！' : study.daily.completed ? 'もう1もん！' : '基本5もん！'}</button>
      </section>

      <section className="grid-two">
        <button className="menu-card" onClick={() => go('free')}><strong>📚 自由学習</strong><span>{study.daily.completed ? '正解1問で 🎫+1' : '基本5問まではチケットなし'}</span></button>
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
  const startedAt = useRef(Date.now())

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
    setResult(onAnswer(choice, Date.now() - startedAt.current))
  }

  const finishRemediation = () => {
    if (!result?.remediate) return
    result.remediate()
  }

  return (
    <section className="question-card">
      <div className="question-top"><span className="pill">{SUBJECTS.find((s) => s.id === question.subject)?.label}</span><span className="difficulty">{'★'.repeat(question.difficulty)}</span></div>
      {question.hard && <div className="challenge-banner">🔥 むずかしい</div>}
      <h2>{question.prompt}</h2>
      {question.speak && <button className="listen" onClick={speak}>🔊 もう一度きく</button>}
      <div className="choices">{question.choices.map((choice) => <button key={choice} className={`${selected === choice ? 'selected' : ''} ${result && choice === question.answer ? 'correct' : ''}`} onClick={() => submit(choice)}>{choice}</button>)}</div>
      {result && <div className={`answer-box ${result.correct ? 'good' : 'retry'}`}><strong>{result.correct ? 'せいかい！ 🎉' : 'おしい！ ここを おぼえよう'}</strong><p>{question.explanation}</p>{result.ticketDelta > 0 && <p className="reward">🎫 バトルチケット +{result.ticketDelta}</p>}</div>}
      {result ? (result.needsRemediation ? <button className="primary" onClick={finishRemediation}>わかった！ つぎへ</button> : <button className="primary" onClick={result.next}>つぎへ</button>) : <button className="text-button" onClick={onQuit}>やめる</button>}
    </section>
  )
}

function DailyStudy({ study, setStudy, setGame, go }) {
  const initialSession = useMemo(() => startDailySession(study), [])
  const [queue] = useState(() => remainingDailyQuestions(initialSession.state))
  const [index, setIndex] = useState(0)
  const [earnedReward, setEarnedReward] = useState(false)
  const question = queue[index]

  useEffect(() => { setStudy(initialSession.state) }, [])

  if (!question) return <main className="screen"><section className="celebration"><h1>きょうの まなび クリア！</h1><p>{earnedReward ? '🎫 バトルチケットを 3まいゲット！' : '基本5問は もうクリアしているよ。もっと学ぶとチケットを増やせるよ！'}</p><PlaceholderMonster speciesId="starter-fire-1" excited /><button className="primary" onClick={() => go(earnedReward ? 'adventure' : 'free')}>{earnedReward ? 'ぼうけんへ！' : 'もっと まなぶ'}</button></section></main>

  const handleAnswer = (choice, elapsedMs) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'daily', elapsedMs })
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    setStudy(outcome.state)
    setGame((game) => grantLearningReward(game, { ticketDelta: outcome.ticketDelta, unitMastered: newlyMastered }))
    if (outcome.ticketDelta > 0) setEarnedReward(true)
    return {
      correct: outcome.correct,
      needsRemediation: outcome.needsRemediation,
      ticketDelta: outcome.ticketDelta,
      next: () => setIndex((i) => i + 1),
      remediate: outcome.needsRemediation ? () => {
        const remediation = completeRemediation(outcome.state, question, { context: 'daily' })
        setStudy(remediation.state)
        setGame((game) => grantLearningReward(game, { ticketDelta: remediation.ticketDelta }))
        if (remediation.ticketDelta > 0) setEarnedReward(true)
        setIndex((i) => i + 1)
      } : null
    }
  }

  return <main className="screen"><p className="counter">きょうの基本 {Math.min(5, (study.daily.completedQuestionIds?.length || 0) + 1)}/5</p><QuestionCard key={question.id} question={question} onAnswer={handleAnswer} onQuit={() => go('home')} /></main>
}

const FREE_MODES = [['recommended', '✨ おすすめ'], ['weak', '💪 苦手を克服'], ['strong', '🚀 得意を伸ばす'], ['challenge', '🔥 チャレンジ']]

function FreeStudy({ study, setStudy, setGame, go }) {
  const [mode, setMode] = useState('recommended')
  const [subject, setSubject] = useState(null)
  const [nonce, setNonce] = useState(0)
  const question = useMemo(() => pickFreeStudyQuestion(study, { mode, subject }), [study, mode, subject, nonce])

  if (!question) return <main className="screen"><button className="back" onClick={() => go('home')}>← もどる</button><p>このコースの問題は まだ準備中です。</p></main>

  const handleAnswer = (choice, elapsedMs) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'free', elapsedMs })
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
      <p className="kid-note">{study.daily.completed ? '正解1問で 🎫+1。得意を続けると難易度も少しずつ上がるよ。' : '自由に勉強はできるよ。まず今日の基本5問を終えるまでは、バトルチケットは増えないよ。'}</p>
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
  const [view, setView] = useState(initial.game.activeBattle ? 'adventure' : 'home')
  const go = setView

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ study, game }))
  }, [study, game])

  const navigationLocked = !!game.activeBattle
  return (
    <div className="app-shell">
      <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} /></header>
      {view === 'home' && <Home study={study} game={game} go={go} />}
      {view === 'daily' && <DailyStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'free' && <FreeStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'adventure' && <AdventureFlow game={game} setGame={setGame} goHome={() => go('home')} goStudy={() => go(study.daily.completed ? 'free' : 'daily')} />}
      {view === 'monsters' && <MonsterScreen game={game} setGame={setGame} goHome={() => go('home')} />}
      {!['daily', 'free'].includes(view) && !navigationLocked && <nav><button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}>🏠<span>ホーム</span></button><button className={view === 'adventure' ? 'active' : ''} onClick={() => go('adventure')}>🗺️<span>ぼうけん</span></button><button className={view === 'monsters' ? 'active' : ''} onClick={() => go('monsters')}>🐾<span>モンスター</span></button><button onClick={() => go(study.daily.completed ? 'free' : 'daily')}>📚<span>まなぶ</span></button></nav>}
    </div>
  )
}
