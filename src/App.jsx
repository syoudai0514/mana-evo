import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SUBJECTS } from './study/questions.js'
import {
  answerQuestion,
  createStudyState,
  normalizeStudyState,
  pickFreeStudyQuestion
} from './study/engine.js'
import {
  EXTRA_PASS_CORRECT,
  EXTRA_QUESTION_COUNT,
  buildExtraPlan,
  completeMissionSlot,
  ensureKidsQuestMission,
  extraTicketReward,
  missionProgress,
  nextMissionQuestion
} from './study/kidsQuestMission.js'
import { dayNumber } from './study/srs.js'
import { availableTicketCount, createGameState, grantLearningReward, normalizeGameState } from './game/progression.js'
import { speciesOf } from './game/content.js'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { AdventureFlow, MonsterScreen } from './game/GameScreens.jsx'
import HowToPlay from './HowToPlay.jsx'

const SAVE_KEY = 'mana-evo-save-v1'
const DONT_KNOW = '__MANA_EVO_DONT_KNOW__'

function loadSave() {
  const today = dayNumber()
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    return {
      study: ensureKidsQuestMission(normalizeStudyState(parsed?.study || createStudyState(), today), today),
      game: normalizeGameState(parsed?.game || createGameState(), today)
    }
  } catch {
    return {
      study: ensureKidsQuestMission(normalizeStudyState(createStudyState(), today), today),
      game: createGameState()
    }
  }
}

function subjectOf(id) {
  return SUBJECTS.find((subject) => subject.id === id)
}

function StatusBar({ game, today }) {
  const tickets = availableTicketCount(game, today)
  return <div className="status-bar"><span>🎫 {tickets}</span><span>💎 {game.mana}</span><span>⭐ {game.captureItems?.star || 0}</span></div>
}

function Home({ study, game, go, today }) {
  const progress = missionProgress(study, today)
  const dailyCompleted = !!progress?.completed
  const doneTasks = progress?.completedTasks || 0
  const totalTasks = progress?.tasks.length || 5
  const leftTasks = Math.max(0, totalTasks - doneTasks)
  const ticketCount = availableTicketCount(game, today)
  const monster = game.box[game.activeMonsterId]
  const species = monster ? speciesOf(monster.speciesId) : null
  const canAdventure = dailyCompleted && ticketCount > 0

  return (
    <main className="screen home-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow">きょうの まなび</p>
          <h1>{dailyCompleted ? 'クリア！' : `あと ${leftTasks} きょうか！`}</h1>
          <div className="progress-dots">
            {Array.from({ length: totalTasks }, (_, index) => <span key={index} className={index < doneTasks ? 'done' : ''} />)}
          </div>
          <p className="kid-note">1きょうか 4〜5もん。すきな じゅんばんで えらべるよ！</p>
          <button className="primary" onClick={() => go(dailyCompleted ? 'free' : 'daily')}>{dailyCompleted ? 'じゆうべんきょう' : 'まなぶ！'}</button>
        </div>
        {monster && <PlaceholderMonster speciesId={monster.speciesId} excited={dailyCompleted} />}
      </section>

      <section className={`adventure-card ${!canAdventure ? 'locked' : ''}`}>
        <div>
          <p className="eyebrow">ぼうけん</p>
          {!dailyCompleted && <><h2>🎫 {ticketCount}まい もってるよ</h2><p>でも、新しいバトルは きょうの 5きょうかを おわらせてから！</p></>}
          {dailyCompleted && <><h2>{ticketCount > 0 ? `あと ${ticketCount} かい ぼうけん！` : 'チケットが ないよ'}</h2><p>{ticketCount > 0 ? 'マップで敵を見つけて、バトル・捕獲・育成！' : 'ついかチャレンジ 3もん中2もんで 🎫+1！'}</p></>}
        </div>
        <button className={canAdventure ? 'battle' : 'secondary'} onClick={() => go(canAdventure ? 'adventure' : dailyCompleted ? 'extra' : 'daily')}>
          {canAdventure ? 'マップへ！' : dailyCompleted ? '3もん チャレンジ！' : '5きょうか やる！'}
        </button>
      </section>

      <section className="grid-two">
        <button className="menu-card" onClick={() => go('free')}><strong>📚 じゆうべんきょう</strong><span>すきな きょうか。チケットは でないよ</span></button>
        <button className="menu-card" onClick={() => go(dailyCompleted ? 'extra' : 'daily')}><strong>🎯 ついかチャレンジ</strong><span>{dailyCompleted ? '3もん中2もんで 🎫+1' : '5きょうかクリアで あそべる'}</span></button>
      </section>

      <button className="menu-card" onClick={() => go('monsters')}><strong>🐾 モンスター</strong><span>{species?.name || '相棒'} Lv.{monster?.level || 1}</span></button>
      <button className="howto-home-card" onClick={() => go('howto')}><strong>❓ あそびかた</strong><span>シンカと アイテムの もらいかた →</span></button>

      <section className="home-loop-card">
        <strong>Kids Quest と おなじ「ちゃんと学んでから遊ぶ」！</strong>
        <span>5きょうか（1きょうか4〜5もん） → 🎫×3＋⭐×3 → ぼうけん → ついか3もんで 🎫をふやす</span>
      </section>
    </main>
  )
}

function QuestionCard({ question, onAnswer, onQuit, title = null, retryWrong = true }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [dontKnow, setDontKnow] = useState(false)
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

  const submitDontKnow = () => {
    if (result) return
    setDontKnow(true)
    setSelected(null)
    setResult(onAnswer(DONT_KNOW, Date.now() - startedAt.current))
  }

  const needsRetry = result && !result.correct && retryWrong && result.needsRemediation !== false
  return (
    <section className="question-card">
      {title && <div className="challenge-banner">{title}</div>}
      <div className="question-top"><span className="pill">{subjectOf(question.subject)?.label}</span><span className="difficulty">{'★'.repeat(question.difficulty)}</span></div>
      {question.hard && <div className="challenge-banner">🔥 むずかしい</div>}
      <h2>{question.prompt}</h2>
      {question.speak && <button className="listen" onClick={speak}>🔊 もう一度きく</button>}
      <div className="choices">
        {question.choices.map((choice) => (
          <button
            key={choice}
            disabled={!!result}
            className={`${selected === choice ? 'selected' : ''} ${result && choice === question.answer ? 'correct' : ''}`}
            onClick={() => submit(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      {result && (
        <div className={`answer-box ${result.correct ? 'good' : 'retry'}`}>
          <strong>{result.correct ? 'せいかい！ 🎉' : dontKnow ? 'いっしょに おぼえよう' : 'おしい！ ここを おぼえよう'}</strong>
          <p>{question.explanation}</p>
          {result.ticketDelta > 0 && <p className="reward">🎫 バトルチケット +{result.ticketDelta}</p>}
          {(result.captureItemDelta?.star || 0) > 0 && <p className="reward">⭐ ほしのわ +{result.captureItemDelta.star}</p>}
        </div>
      )}
      {result ? (
        needsRetry
          ? <button className="primary" onClick={result.remediate}>かいせつを みた！ もういちど</button>
          : <button className="primary" onClick={result.next}>{result.nextLabel || 'つぎへ'}</button>
      ) : (
        <>
          <button className="secondary" onClick={submitDontKnow}>🤔 わからない（こたえを みる）</button>
          <button className="text-button" onClick={onQuit}>やめる</button>
        </>
      )}
    </section>
  )
}

function SubjectPicker({ progress, onPick, onQuit }) {
  return (
    <main className="screen">
      <button className="back" onClick={onQuit}>← ホーム</button>
      <div className="screen-title-row"><div><p className="eyebrow">きょうの ミッション</p><h1>どの きょうかから やる？</h1></div></div>
      <p className="kid-note">じゅんばんは じぶんで えらべるよ。ぜんぶ おわると 🎫×3 と ⭐×3！</p>
      <div className="subject-row">
        {progress.tasks.map((task) => {
          const subject = subjectOf(task.subject)
          return (
            <button key={task.taskId} className={task.done ? 'active' : ''} disabled={task.done} onClick={() => onPick(task.taskId)}>
              <strong>{subject?.icon} {subject?.label}</strong><br />
              <span>{task.done ? 'クリア！' : `あと ${task.remaining}もん / ${task.slots.length}もん`}</span>
            </button>
          )
        })}
      </div>
    </main>
  )
}

function DailyStudy({ study, setStudy, setGame, go }) {
  const today = dayNumber()
  const initialMission = useMemo(() => ensureKidsQuestMission(normalizeStudyState(study, today), today), [])
  const [taskId, setTaskId] = useState(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const source = study.daily?.kidsQuestMission?.day === today ? study : initialMission
  const progress = missionProgress(source, today)

  useEffect(() => { setStudy(initialMission) }, [])

  if (!progress) return null
  if (progress.completed) {
    return (
      <main className="screen">
        <section className="celebration">
          <h1>きょうの 5きょうか クリア！</h1>
          <p>🎫×3 と ⭐ほしのわ×3！ もっと バトルしたいときは「ついかチャレンジ」へ！</p>
          <PlaceholderMonster speciesId="starter-fire-1" excited />
          <button className="primary" onClick={() => go('adventure')}>ぼうけんへ！</button>
          <button className="secondary" onClick={() => go('extra')}>🎯 ついか3もん</button>
        </section>
      </main>
    )
  }

  if (!taskId) return <SubjectPicker progress={progress} onPick={setTaskId} onQuit={() => go('home')} />

  const task = progress.tasks.find((entry) => entry.taskId === taskId)
  const question = nextMissionQuestion(source, today, taskId)
  if (!task || !question) {
    return <SubjectPicker progress={progress} onPick={setTaskId} onQuit={() => go('home')} />
  }

  const handleAnswer = (choice, elapsedMs) => {
    const before = source.units?.[question.unitId]
    const outcome = answerQuestion(source, question, choice, { context: 'mission', today, elapsedMs })
    const newlyMastered = !before?.mastered && outcome.unit.mastered

    if (!outcome.correct) {
      setStudy(outcome.state)
      return {
        correct: false,
        needsRemediation: true,
        ticketDelta: 0,
        captureItemDelta: { star: 0 },
        remediate: () => setRetryNonce((value) => value + 1)
      }
    }

    const missionOutcome = completeMissionSlot(outcome.state, today, question.missionSlotId)
    const afterProgress = missionProgress(missionOutcome.state, today)
    const taskDone = afterProgress?.tasks.find((entry) => entry.taskId === taskId)?.done
    setStudy(missionOutcome.state)
    setGame((game) => grantLearningReward(game, {
      ticketDelta: missionOutcome.ticketDelta,
      captureItemDelta: missionOutcome.captureItemDelta,
      unitMastered: newlyMastered,
      today
    }))

    return {
      correct: true,
      needsRemediation: false,
      ticketDelta: missionOutcome.ticketDelta,
      captureItemDelta: missionOutcome.captureItemDelta,
      nextLabel: missionOutcome.justCompleted ? '🎉 クリア！' : taskDone ? 'つぎの きょうかへ' : 'つぎへ',
      next: () => {
        if (missionOutcome.justCompleted) go('home')
        else if (taskDone) setTaskId(null)
        setRetryNonce((value) => value + 1)
      }
    }
  }

  return (
    <main className="screen">
      <p className="counter">{subjectOf(task.subject)?.label} {question.missionPosition}/{question.missionQuestionCount}</p>
      <QuestionCard key={`${question.missionSlotId}-${retryNonce}`} question={question} onAnswer={handleAnswer} onQuit={() => setTaskId(null)} />
    </main>
  )
}

const FREE_MODES = [['recommended', '✨ おすすめ'], ['weak', '💪 苦手を克服'], ['strong', '🚀 得意を伸ばす'], ['challenge', '🔥 チャレンジ']]

function FreeStudy({ study, setStudy, setGame, go }) {
  const [mode, setMode] = useState('recommended')
  const [subject, setSubject] = useState(null)
  const [questionNonce, setQuestionNonce] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
  const question = useMemo(() => pickFreeStudyQuestion(study, { mode, subject }), [mode, subject, questionNonce])

  if (!question) return <main className="screen"><button className="back" onClick={() => go('home')}>← もどる</button><p>このコースの問題は まだ準備中です。</p></main>

  const handleAnswer = (choice, elapsedMs) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'practice', today: dayNumber(), elapsedMs })
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    const newlyHard = !before?.hardMastered && outcome.unit.hardMastered
    setStudy(outcome.state)
    if (outcome.correct) {
      setGame((game) => grantLearningReward(game, {
        ticketDelta: 0,
        captureItemDelta: { star: 0 },
        unitMastered: newlyMastered,
        hardMastered: newlyHard,
        today: outcome.state.daily.day
      }))
    }
    return {
      correct: outcome.correct,
      needsRemediation: !outcome.correct,
      ticketDelta: 0,
      captureItemDelta: { star: 0 },
      remediate: !outcome.correct ? () => setRetryNonce((value) => value + 1) : null,
      next: () => setQuestionNonce((value) => value + 1)
    }
  }

  return (
    <main className="screen">
      <button className="back" onClick={() => go('home')}>← ホーム</button>
      <div className="screen-title-row"><div><p className="eyebrow">すきなだけ まなべる</p><h1>じゆうべんきょう</h1></div></div>
      <p className="kid-note">すきな きょうかを えらべるよ。Kids Quest とおなじで、ここでは バトルチケットは でないよ。</p>
      <div className="mode-row">{FREE_MODES.map(([id, label]) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => { setMode(id); setQuestionNonce((value) => value + 1) }}>{label}</button>)}</div>
      <div className="subject-row"><button className={!subject ? 'active' : ''} onClick={() => { setSubject(null); setQuestionNonce((value) => value + 1) }}>ぜんぶ</button>{SUBJECTS.map((entry) => <button key={entry.id} className={subject === entry.id ? 'active' : ''} onClick={() => { setSubject(entry.id); setQuestionNonce((value) => value + 1) }}>{entry.icon}</button>)}</div>
      <QuestionCard key={`${question.id}-${questionNonce}-${retryNonce}`} question={question} onAnswer={handleAnswer} onQuit={() => go('home')} />
    </main>
  )
}

function ExtraStudy({ study, setStudy, setGame, go }) {
  const today = dayNumber()
  const progress = missionProgress(study, today)
  const [subject, setSubject] = useState(null)
  const [plan, setPlan] = useState([])
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [batchReward, setBatchReward] = useState(0)

  if (!progress?.completed) {
    return <main className="screen"><section className="celebration"><h1>まず 5きょうか！</h1><p>ついかチャレンジは、きょうの ミッションを ぜんぶ おわらせてから。</p><button className="primary" onClick={() => go('daily')}>まなぶ！</button></section></main>
  }

  const start = (subjectId) => {
    setSubject(subjectId)
    setPlan(buildExtraPlan(study, today, subjectId))
    setIndex(0)
    setCorrectCount(0)
    setFinished(false)
    setBatchReward(0)
  }

  if (!subject) {
    return (
      <main className="screen">
        <button className="back" onClick={() => go('home')}>← ホーム</button>
        <div className="screen-title-row"><div><p className="eyebrow">バトルチケットを ふやす</p><h1>ついか 3もんチャレンジ</h1></div></div>
        <p className="kid-note">3もん中 2もん できたら 🎫+1。1もんだけで 1まいは もらえないよ！</p>
        <div className="subject-row">{SUBJECTS.map((entry) => <button key={entry.id} onClick={() => start(entry.id)}>{entry.icon} {entry.label}</button>)}</div>
      </main>
    )
  }

  if (finished || !plan[index]) {
    const passed = correctCount >= EXTRA_PASS_CORRECT
    return (
      <main className="screen">
        <section className="celebration">
          <h1>{passed ? 'チャレンジ クリア！' : 'もういっかい ちょうせん！'}</h1>
          <p>{EXTRA_QUESTION_COUNT}もん中 {correctCount}もん せいかい！ {passed ? '🎫 バトルチケット +1' : `あと ${EXTRA_PASS_CORRECT - correctCount}もん せいかいで チケットだったよ。`}</p>
          {batchReward > 0 && <p className="reward">🎫 +{batchReward}</p>}
          <button className="primary" onClick={() => { setSubject(null); setPlan([]); setFinished(false) }}>もう1かい！</button>
          <button className="secondary" onClick={() => go('home')}>ホームへ</button>
        </section>
      </main>
    )
  }

  const question = plan[index]
  const handleAnswer = (choice, elapsedMs) => {
    const before = study.units?.[question.unitId]
    const outcome = answerQuestion(study, question, choice, { context: 'extra', today, elapsedMs })
    const newlyMastered = !before?.mastered && outcome.unit.mastered
    const nextCorrect = correctCount + (outcome.correct ? 1 : 0)
    const isLast = index >= EXTRA_QUESTION_COUNT - 1
    const reward = isLast ? extraTicketReward(nextCorrect, EXTRA_QUESTION_COUNT) : 0

    setStudy(outcome.state)
    setCorrectCount(nextCorrect)
    if (reward > 0 || newlyMastered) {
      setGame((game) => grantLearningReward(game, {
        ticketDelta: reward,
        captureItemDelta: { star: 0 },
        unitMastered: newlyMastered,
        today
      }))
    }
    if (isLast) setBatchReward(reward)

    return {
      correct: outcome.correct,
      needsRemediation: false,
      ticketDelta: reward,
      captureItemDelta: { star: 0 },
      nextLabel: isLast ? 'けっかを みる' : 'つぎへ',
      next: () => isLast ? setFinished(true) : setIndex((value) => value + 1)
    }
  }

  return (
    <main className="screen">
      <p className="counter">ついかチャレンジ {index + 1}/{EXTRA_QUESTION_COUNT} ・ いま {correctCount}もん せいかい</p>
      <QuestionCard key={`${question.extraSlotId}-${index}`} question={question} title="🎯 3もん中2もんで 🎫+1" retryWrong={false} onAnswer={handleAnswer} onQuit={() => go('home')} />
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
        setStudy((current) => ensureKidsQuestMission(normalizeStudyState(current, nextDay), nextDay))
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

  const progress = missionProgress(study, today)
  const dailyCompleted = !!progress?.completed
  const navigationLocked = !!game.activeBattle
  return (
    <div className="app-shell">
      <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} today={today} /></header>
      {view === 'home' && <Home study={study} game={game} go={go} today={today} />}
      {view === 'daily' && <DailyStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'free' && <FreeStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'extra' && <ExtraStudy study={study} setStudy={setStudy} setGame={setGame} go={go} />}
      {view === 'adventure' && <AdventureFlow game={game} setGame={setGame} dailyCompleted={dailyCompleted} dailyDay={study.daily?.day} today={today} goHome={() => go('home')} goStudy={() => go(dailyCompleted ? 'extra' : 'daily')} />}
      {view === 'monsters' && <MonsterScreen game={game} setGame={setGame} goHome={() => go('home')} />}
      {view === 'howto' && <HowToPlay game={game} today={today} goHome={() => go('home')} goAdventure={() => go(dailyCompleted ? 'adventure' : 'daily')} goMonsters={() => go('monsters')} goStudy={() => go(dailyCompleted ? 'extra' : 'daily')} />}
      {!['daily', 'free', 'extra'].includes(view) && !navigationLocked && <nav><button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}>🏠<span>ホーム</span></button><button className={view === 'adventure' ? 'active' : ''} onClick={() => go(dailyCompleted ? 'adventure' : 'daily')}>🗺️<span>ぼうけん</span></button><button className={view === 'monsters' ? 'active' : ''} onClick={() => go('monsters')}>🐾<span>モンスター</span></button><button onClick={() => go(dailyCompleted ? 'free' : 'daily')}>📚<span>まなぶ</span></button></nav>}
    </div>
  )
}
