import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SUBJECTS } from './study/questions.js'
import {
  acknowledgeExplanation,
  answerQuestion,
  answerReinforcementQuestion,
  createStudyState,
  normalizeStudyState,
  pickFreeStudyQuestion,
  reinforcementQuestionFor,
  remainingDailyQuestions,
  startDailySession
} from './study/engine.js'
import { dayNumber } from './study/srs.js'
import { availableTicketCount, createGameState, grantLearningReward, normalizeGameState } from './game/progression.js'
import { speciesOf } from './game/content.js'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { AdventureFlow, MonsterScreen } from './game/GameScreens.jsx'
import HowToPlay from './HowToPlay.jsx'

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

function StatusBar({ game, today }) {
  const tickets = availableTicketCount(game, today)
  return <div className="status-bar"><span>🎫 {tickets}</span><span>💎 {game.mana}</span><span>⭐ {game.captureItems?.star || 0}</span></div>
}

function Home({ study, game, go, today }) {
  const isToday = study.daily?.day === today
  const dailyCompleted = isToday && !!study.daily?.completed
  const doneCount = isToday ? (study.daily?.completedQuestionIds?.length ?? study.daily?.answered ?? 0) : 0
  const left = Math.max(0, 5 - doneCount)
  const ticketCount = availableTicketCount(game, today)
  const monster = game.box[game.activeMonsterId]
  const species = monster ? speciesOf(monster.speciesId) : null
  const canAdventure = dailyCompleted && ticketCount > 0
  return (
    <main className="screen home-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow">きょうの まなび</p>
          <h1>{dailyCompleted ? 'クリア！' : `あと ${left} もん！`}</h1>
          <div className="progress-dots">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < doneCount ? 'done' : ''} />)}</div>
          <button className="primary" onClick={() => go(dailyCompleted ? 'free' : 'daily')}>{dailyCompleted ? 'もっと まなぶ' : 'まなぶ！'}</button>
        </div>
        {monster && <PlaceholderMonster speciesId={monster.speciesId} excited={dailyCompleted} />}
      </section>

      <section className={`adventure-card ${!canAdventure ? 'locked' : ''}`}>
        <div>
          <p className="eyebrow">ぼうけん</p>
          {!dailyCompleted && <><h2>🎫 {ticketCount}まい もってるよ</h2><p>でも、新しいバトルはまず今日の基本5問を終えてから！</p></>}
          {dailyCompleted && <><h2>{ticketCount > 0 ? `あと ${ticketCount} かい ぼうけん！` : 'チケットが ないよ'}</h2><p>{ticketCount > 0 ? 'マップで敵を見つけて、バトル・捕獲・育成！' : '追加で1もん正解すると、バトルチケット +1！'}</p></>}
        </div>
        <button className={canAdventure ? 'battle' : 'secondary'} onClick={() => go(canAdventure ? 'adventure' : dailyCompleted ? 'free' : 'daily')}>{canAdventure ? 'マップへ！' : dailyCompleted ? 'もう1もん！' : '基本5もん！'}</button>
      </section>

      <section className="grid-two">
        <button className="menu-card" onClick={() => go('free')}><strong>📚 自由学習</strong><span>{dailyCompleted ? '正解1問で 🎫+1' : '基本5問まではチケットなし'}</span></button>
        <button className="menu-card" onClick={() => go('monsters')}><strong>🐾 モンスター</strong><span>{species?.name || '相棒'} Lv.{monster?.level || 1}</span></button>
      </section>

      <button className="howto-home-card" onClick={() => go('howto')}><strong>❓ あそびかた</strong><span>シンカと アイテムの もらいかた →</span></button>

      <section className="home-loop-card">
        <strong>「もっと遊びたい」が勉強につながる！</strong>
        <span>基本5問 → 🎫×3＋⭐ほしのわ×3 → 冒険 → 追加学習でさらに報酬</span>
      </section>
    </main>
  )
}

function QuestionCard({ question, onAnswer, onQuit, title = null }) {
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

  return (
    <section className="question-card">
      {title && <div className="challenge-banner">{title}</div>}
      <div className="question-top"><span className="pill">{SUBJECTS.find((s) => s.id === question.subject)?.label}</span><span className="difficulty">{'★'.repeat(question.difficulty)}</span></div>
      {question.hard && <div className="challenge-banner">🔥 むずかしい</div>}
      <h2>{question.prompt}</h2>
      {question.speak && <button className="listen" onClick={speak}>🔊 もう一度きく</button>}
      <div className="choices">{question.choices.map((choice) => <button key={choice} className={`${selected === choice ? 'selected' : ''} ${result && choice === question.answer ? 'correct' : ''}`} onClick={() => submit(choice)}>{choice}</button>)}</div>
      {result && <div className={`answer-box ${result.correct ? 'good' : 'retry'}`}><strong>{result.correct ? 'せいかい！ 🎉' : 'おしい！ ここを おぼえよう'}</strong><p>{question.explanation}</p>{result.ticketDelta > 0 && <p className="reward">🎫 バトルチケット +{result.ticketDelta}</p>}{(result.captureItemDelta?.star || 0) > 0 && <p className="reward">⭐ ほしのわ +{result.captureItemDelta.star}</p>}</div>}
      {result ? (result.needsRemediation ? <button className="primary" onClick={result.remediate}>かいせつを みた！ もういちど</button> : <button className="primary" onClick={result.next}>{result.nextLabel || 'つぎへ'}</button>) : <button className="text-button" onClick={onQuit}>やめる</button>}
    </section>
  )
}

function DailyStudy({ study, setStudy, setGame, go }) {
  const initialSession = useMemo(() => startDailySession(study), [])
  const [queue] = useState(() => remainingDailyQuestions(initialSession.state))
  const [index, setIndex] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
  const [reinforcementFor, setReinforcementFor] = useState(null)
  const [earnedReward, setEarnedReward] = useState(false)
  const question = queue[index]

  useEffect(() => { setStudy(initialSession.state) }, [])

  if (!question) return <main className="screen"><section className="celebration"><h1>きょうの まなび クリア！</h1><p>{earnedReward ? '🎫×3 と ⭐ほしのわ×3 をゲット！' : '基本5問は もうクリアしているよ。もっと学ぶとチケットを増やせるよ！'}</p><PlaceholderMonster speciesId="starter-fire-1" excited /><button className="primary" onClick={() => go(earnedReward ? 'adventure' : 'free')}>{earnedReward ? 'ぼうけんへ！' : 'もっと まなぶ'}</button></section></main>

  const applyGameReward = (outcome, newlyMastered = false, newlyHard = false) => {
    setGame((game) => grantLearningReward(game, {
      ticketDelta: outcome.ticketDelta,
      captureItemDelta: outcome.captureItemDelta,
      unitMastered: newlyMastered,
      hardMastered: newlyHard,
      today: outcome.state.daily.day
    }))
    if (outcome.ticketDelta > 0) setEarnedReward(true)
  }

  if (reinforcementFor) {
    const original = queue.find((q) => q.id === reinforcementFor) || question
    const check = reinforcementQuestionFor(study, original)
    const handleReinforcement = (choice, elapsedMs) => {
      const before = study.units?.[check.unitId]
      const outcome = answerReinforcementQuestion(study, original, check, choice, { today: study.daily.day, elapsedMs })
      const newlyMastered = !before?.mastered && outcome.state.units?.[check.unitId]?.mastered
      setStudy(outcome.state)
      applyGameReward(outcome, newlyMastered)
      return {
        correct: outcome.correct,
        needsRemediation: !outcome.correct,
        ticketDelta: outcome.ticketDelta,
        captureItemDelta: outcome.captureItemDelta,
        remediate: !outcome.correct ? () => setRetryNonce((n) => n + 1) : null,
        next: () => { setReinforcementFor(null); setIndex((i) => i + 1); setRetryNonce((n) => n + 1) }
      }
    }
    return <main className="screen"><p className="counter">しっかり かくにん！</p><QuestionCard key={`reinforce-${original.id}-${check.id}-${retryNonce}`} question={check} title="🔁 かくにん問題" onAnswer={handleReinforcement} onQuit={() => go('home')} /></main>
  }

  const handleAnswer = (choice, elapsedMs) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'daily', elapsedMs })
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    setStudy(outcome.state)
    applyGameReward(outcome, newlyMastered)
    return {
      correct: outcome.correct,
      needsRemediation: outcome.needsRemediation,
      ticketDelta: outcome.ticketDelta,
      captureItemDelta: outcome.captureItemDelta,
      nextLabel: outcome.needsReinforcement ? 'もう1もん かくにん！' : 'つぎへ',
      next: () => {
        if (outcome.needsReinforcement) setReinforcementFor(question.id)
        else setIndex((i) => i + 1)
        setRetryNonce((n) => n + 1)
      },
      remediate: outcome.needsRemediation ? () => {
        const ack = acknowledgeExplanation(outcome.state, question, { context: 'daily', today: outcome.state.daily.day })
        setStudy(ack.state)
        setRetryNonce((n) => n + 1)
      } : null
    }
  }

  return <main className="screen"><p className="counter">きょうの基本 {Math.min(5, (study.daily.completedQuestionIds?.length || 0) + 1)}/5</p><QuestionCard key={`${question.id}-${retryNonce}`} question={question} onAnswer={handleAnswer} onQuit={() => go('home')} /></main>
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
    setGame((game) => grantLearningReward(game, {
      ticketDelta: outcome.ticketDelta,
      captureItemDelta: outcome.captureItemDelta,
      unitMastered: newlyMastered,
      hardMastered: newlyHard,
      today: outcome.state.daily.day
    }))
    return { correct: outcome.correct, ticketDelta: outcome.ticketDelta, captureItemDelta: outcome.captureItemDelta, next: () => setNonce((n) => n + 1) }
  }

  return (
    <main className="screen">
      <button className="back" onClick={() => go('home')}>← ホーム</button>
      <div className="screen-title-row"><div><p className="eyebrow">もっと遊びたいときも</p><h1>自由学習</h1></div></div>
      <p className="kid-note">{study.daily.completed ? '正解1問で 🎫+1。追加3問正解ごとに ⭐ほしのわ+1。MASTERでは上位の「わ」も！' : '自由に勉強はできるよ。まず今日の基本5問を終えるまでは、バトルチケットは増えないよ。'}</p>
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
  const initialDay = dayNumber()
  const dayRef = useRef(initialDay)
  const [today, setToday] = useState(initialDay)
  const go = setView

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ study, game }))
  }, [study, game])

  useEffect(() => {
    let timer = null
    const refreshDay = () => {
      const nextDay = dayNumber()
      if (nextDay !== dayRef.current) {
        dayRef.current = nextDay
        setToday(nextDay)
        setStudy((current) => normalizeStudyState(current, nextDay))
        setGame((current) => normalizeGameState(current, nextDay))
      }
    }
    const scheduleMidnightRefresh = () => {
      if (timer) clearTimeout(timer)
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(() => {
        refreshDay()
        scheduleMidnightRefresh()
      }, Math.max(1000, nextMidnight.getTime() - now.getTime() + 250))
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshDay() }
    window.addEventListener('focus', refreshDay)
    document.addEventListener('visibilitychange', onVisibility)
    scheduleMidnightRefresh()
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('focus', refreshDay)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const dailyCompleted = study.daily?.day === today && !!study.daily?.completed
  const navigationLocked = !!game.activeBattle
  return (
    <div className="app-shell">
      <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} today={today} /></header>
      {view === 'home' && <Home study={study} game={game} go={go} today={today} />}
      {view === 'daily' && <DailyStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'free' && <FreeStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'adventure' && <AdventureFlow game={game} setGame={setGame} dailyCompleted={dailyCompleted} dailyDay={study.daily?.day} today={today} goHome={() => go('home')} goStudy={() => go(dailyCompleted ? 'free' : 'daily')} />}
      {view === 'monsters' && <MonsterScreen game={game} setGame={setGame} goHome={() => go('home')} />}
      {view === 'howto' && <HowToPlay game={game} today={today} goHome={() => go('home')} goAdventure={() => go(dailyCompleted ? 'adventure' : 'daily')} goMonsters={() => go('monsters')} goStudy={() => go(dailyCompleted ? 'free' : 'daily')} />}
      {!['daily', 'free'].includes(view) && !navigationLocked && <nav><button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}>🏠<span>ホーム</span></button><button className={view === 'adventure' ? 'active' : ''} onClick={() => go(dailyCompleted ? 'adventure' : 'daily')}>🗺️<span>ぼうけん</span></button><button className={view === 'monsters' ? 'active' : ''} onClick={() => go('monsters')}>🐾<span>モンスター</span></button><button onClick={() => go(dailyCompleted ? 'free' : 'daily')}>📚<span>まなぶ</span></button></nav>}
    </div>
  )
}