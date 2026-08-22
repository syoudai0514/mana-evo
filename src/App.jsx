import React, { useEffect, useMemo, useState } from 'react'
import { SUBJECTS } from './study/questions.js'
import {
  answerQuestion,
  createStudyState,
  normalizeStudyState,
  pickDailyQuestions,
  pickFreeStudyQuestion,
  unitMastery
} from './study/engine.js'
import {
  battleOnce,
  createGameState,
  evolutionEligibility,
  grantLearningReward
} from './game/progression.js'

const SAVE_KEY = 'mana-evo-save-v1'

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    return {
      study: normalizeStudyState(parsed?.study || createStudyState()),
      game: parsed?.game || createGameState()
    }
  } catch {
    return { study: createStudyState(), game: createGameState() }
  }
}

function PlaceholderMonster({ stage = 1, excited = false }) {
  return (
    <div className={`placeholder-monster stage-${stage} ${excited ? 'excited' : ''}`} aria-label="仮キャラクター">
      <div className="monster-ear left" />
      <div className="monster-ear right" />
      <div className="monster-face">
        <span className="eye">●</span><span className="eye">●</span>
        <span className="mouth">⌣</span>
      </div>
      <div className="monster-gem">◆</div>
      <small>仮画像</small>
    </div>
  )
}

function StatusBar({ game }) {
  return (
    <div className="status-bar">
      <span>🎫 {game.tickets}</span>
      <span>💎 {game.mana}</span>
      <span>⭐ {game.starShards}</span>
      <span>🔷 {game.gigaStones}</span>
    </div>
  )
}

function Home({ study, game, onStartDaily, onFreeStudy, onBattle }) {
  const left = Math.max(0, 5 - (study.daily?.answered || 0))
  const monster = game.monsters[game.activeMonsterId]
  return (
    <main className="screen home-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow">きょうの まなび</p>
          <h1>{study.daily.completed ? 'クリア！' : `あと ${left} もん！`}</h1>
          <div className="progress-dots">
            {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < (study.daily.answered || 0) ? 'done' : ''} />)}
          </div>
          <button className="primary" onClick={onStartDaily}>{study.daily.completed ? 'もういちど みる' : 'まなぶ！'}</button>
        </div>
        <PlaceholderMonster stage={monster.stage} excited={study.daily.completed} />
      </section>

      <section className={`adventure-card ${game.tickets < 1 ? 'locked' : ''}`}>
        <div>
          <p className="eyebrow">ぼうけん</p>
          <h2>{game.tickets > 0 ? `あと ${game.tickets} かい あそべる！` : 'チケットが ないよ'}</h2>
          <p>{game.tickets > 0 ? 'バトルで なかまを そだてよう。' : '追加で1もん正解すると、バトルチケット +1！'}</p>
        </div>
        {game.tickets > 0 ? <button className="battle" onClick={onBattle}>バトルへ！</button> : <button className="secondary" onClick={onFreeStudy}>もう1もん！</button>}
      </section>

      <section className="grid-two">
        <button className="menu-card" onClick={onFreeStudy}><strong>📚 自由学習</strong><span>苦手・得意・先取り</span></button>
        <div className="menu-card"><strong>🌟 育成</strong><span>{monster.name} Lv.{monster.level}</span></div>
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
    const answer = onAnswer(choice)
    setResult(answer)
  }

  return (
    <section className="question-card">
      <div className="question-top">
        <span className="pill">{SUBJECTS.find((s) => s.id === question.subject)?.label}</span>
        <span className="difficulty">{'★'.repeat(question.difficulty)}</span>
      </div>
      {question.hard && <div className="challenge-banner">🔥 むずかしい</div>}
      <h2>{question.prompt}</h2>
      {question.speak && <button className="listen" onClick={speak}>🔊 もう一度きく</button>}
      <div className="choices">
        {question.choices.map((choice) => (
          <button
            key={choice}
            className={`${selected === choice ? 'selected' : ''} ${result && choice === question.answer ? 'correct' : ''}`}
            onClick={() => submit(choice)}
          >{choice}</button>
        ))}
      </div>
      {result && (
        <div className={`answer-box ${result.correct ? 'good' : 'retry'}`}>
          <strong>{result.correct ? 'せいかい！ 🎉' : 'おしい！'}</strong>
          <p>{question.explanation}</p>
          {result.ticketDelta > 0 && <p className="reward">🎫 バトルチケット +{result.ticketDelta}</p>}
        </div>
      )}
      {result ? <button className="primary" onClick={result.next}>つぎへ</button> : <button className="text-button" onClick={onQuit}>やめる</button>}
    </section>
  )
}

function DailyStudy({ study, setStudy, setGame, onDone, onQuit }) {
  const [queue] = useState(() => pickDailyQuestions(study))
  const [index, setIndex] = useState(0)
  const question = queue[index]

  if (!question) {
    return <main className="screen"><section className="celebration"><h1>きょうの まなび クリア！</h1><p>🎫 バトルチケットを 3まいゲット！</p><PlaceholderMonster excited /><button className="primary" onClick={onDone}>ぼうけんへ！</button></section></main>
  }

  const handleAnswer = (choice) => {
    const outcome = answerQuestion(study, question, choice, { context: 'daily' })
    setStudy(outcome.state)
    setGame((game) => grantLearningReward(game, { ticketDelta: outcome.ticketDelta, unitMastered: outcome.unit.mastered }))
    return {
      correct: outcome.correct,
      ticketDelta: outcome.ticketDelta,
      next: () => setIndex((i) => i + 1)
    }
  }

  return <main className="screen"><p className="counter">もんだい {index + 1}/{queue.length}</p><QuestionCard key={question.id} question={question} onAnswer={handleAnswer} onQuit={onQuit} /></main>
}

const FREE_MODES = [
  ['recommended', '✨ おすすめ'],
  ['weak', '💪 苦手を克服'],
  ['strong', '🚀 得意を伸ばす'],
  ['challenge', '🔥 チャレンジ']
]

function FreeStudy({ study, setStudy, setGame, onQuit }) {
  const [mode, setMode] = useState('recommended')
  const [subject, setSubject] = useState(null)
  const [nonce, setNonce] = useState(0)
  const question = useMemo(() => pickFreeStudyQuestion(study, { mode, subject }), [study, mode, subject, nonce])

  if (!question) return <main className="screen"><button className="back" onClick={onQuit}>← もどる</button><p>このコースの問題は まだ準備中です。</p></main>

  const handleAnswer = (choice) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'free' })
    setStudy(outcome.state)
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    const newlyHard = !before?.hardMastered && outcome.unit.hardMastered
    setGame((game) => grantLearningReward(game, { ticketDelta: outcome.ticketDelta, unitMastered: newlyMastered, hardMastered: newlyHard }))
    return {
      correct: outcome.correct,
      ticketDelta: outcome.ticketDelta,
      next: () => setNonce((n) => n + 1)
    }
  }

  return (
    <main className="screen">
      <button className="back" onClick={onQuit}>← ホーム</button>
      <h1>自由学習</h1>
      <div className="mode-row">{FREE_MODES.map(([id, label]) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}>{label}</button>)}</div>
      <div className="subject-row"><button className={!subject ? 'active' : ''} onClick={() => setSubject(null)}>ぜんぶ</button>{SUBJECTS.map((s) => <button key={s.id} className={subject === s.id ? 'active' : ''} onClick={() => setSubject(s.id)}>{s.icon}</button>)}</div>
      <QuestionCard key={`${question.id}-${nonce}`} question={question} onAnswer={handleAnswer} onQuit={onQuit} />
    </main>
  )
}

function Battle({ game, setGame, onStudy, onQuit }) {
  const monster = game.monsters[game.activeMonsterId]
  const fight = () => {
    const result = battleOnce(game)
    if (result.ok) setGame(result.game)
  }
  return (
    <main className="screen battle-screen">
      <button className="back" onClick={onQuit}>← ホーム</button>
      <div className="battle-field">
        <div className="enemy"><span>やせいの モンスター（仮）</span><PlaceholderMonster stage={1} /></div>
        <div className="player"><PlaceholderMonster stage={monster.stage} /><strong>{monster.name} Lv.{monster.level}</strong><small>XP {monster.xp}/{monster.level * 40}</small></div>
      </div>
      {game.tickets > 0 ? <button className="battle huge" onClick={fight}>⚔️ たたかう　🎫×1</button> : <div className="no-ticket"><h2>チケットが なくなったよ…</h2><p>あと1もん正解すると、もう1回あそべる！</p><button className="primary" onClick={onStudy}>もう1もん！</button></div>}
    </main>
  )
}

function Growth({ study, game }) {
  const monster = game.monsters[game.activeMonsterId]
  const eligibility = evolutionEligibility(monster, game, study)
  const units = Object.entries(study.units || {})
  return (
    <main className="screen">
      <h1>育成・進化</h1>
      <section className="monster-profile"><PlaceholderMonster stage={monster.stage} /><div><h2>{monster.name}</h2><p>Lv.{monster.level} / 進化段階 {monster.stage}</p><p>キャラクター画像はあとから差し替えます。</p></div></section>
      <section className="evolution-list">
        <div><strong>⭐ スター覚醒</strong><span>{eligibility.star ? '解放OK！' : 'Lv.25・単元MASTER・むずかしいMASTER・かけら×3'}</span></div>
        <div><strong>🔷 ギガ進化</strong><span>{eligibility.giga ? '解放OK！' : '最終進化・Lv.40・章むずかしいMASTER・ギガストーン'}</span></div>
        <div><strong>💥 キョダイバースト</strong><span>{eligibility.burst ? '解放OK！' : '科目/学年MASTER・バーストコア・対応モンスター'}</span></div>
      </section>
      <h2>単元のしゅうとく</h2>
      <div className="unit-list">{units.length ? units.map(([id, unit]) => { const m = unitMastery(unit); return <div key={id} className="unit"><strong>{id}</strong><span>{m.mastered ? 'MASTER ⭐' : `挑戦 ${unit.attempts}/4・初回正解 ${unit.firstTryCorrect}/3・別日 ${unit.days.length}/2・種類 ${unit.itemKeys.length}/2`}</span></div> }) : <p>まだ学習記録がありません。</p>}</div>
    </main>
  )
}

export default function App() {
  const initial = useMemo(loadSave, [])
  const [study, setStudy] = useState(initial.study)
  const [game, setGame] = useState(initial.game)
  const [view, setView] = useState('home')

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ study, game }))
  }, [study, game])

  return (
    <div className="app-shell">
      <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} /></header>
      {view === 'home' && <Home study={study} game={game} onStartDaily={() => setView('daily')} onFreeStudy={() => setView('free')} onBattle={() => setView('battle')} />}
      {view === 'daily' && <DailyStudy study={study} setStudy={setStudy} setGame={setGame} onDone={() => setView('battle')} onQuit={() => setView('home')} />}
      {view === 'free' && <FreeStudy study={study} setStudy={setStudy} setGame={setGame} onQuit={() => setView('home')} />}
      {view === 'battle' && <Battle game={game} setGame={setGame} onStudy={() => setView('free')} onQuit={() => setView('home')} />}
      {view === 'growth' && <Growth study={study} game={game} />}
      {!['daily', 'free'].includes(view) && <nav><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>🏠<span>ホーム</span></button><button className={view === 'battle' ? 'active' : ''} onClick={() => setView('battle')}>⚔️<span>ぼうけん</span></button><button className={view === 'growth' ? 'active' return false : ''} onClick={() => setView('growth')}>⭐<span>モンスター</span></button><button onClick={() => setView('free')}>📚<span>まなぶ</span></button></nav>}
    </div>
  )
}
