import React, { useEffect, useMemo, useRef, useState } from 'react'
import { availableTicketCount, createGameState, grantLearningReward, normalizeGameState } from './game/progression.js'
import { speciesOf } from './game/content.js'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { AdventureFlow, MonsterScreen } from './game/GameScreens.jsx'
import HowToPlay from './HowToPlay.jsx'
import ParentGate from './parent/ParentGate.jsx'

import { useGame as useLearningGame, missedCount, masteryProgress } from './kids-quest-study/state/GameContext.jsx'
import { DOMAIN_BY_ID, domainName } from './kids-quest-study/engine/activities.js'
import { buildExtraTask, buildOkawariTask, OKAWARI_MAX } from './kids-quest-study/engine/missions.js'
import { dayNumber } from './kids-quest-study/engine/srs.js'
import { gradeOf } from './kids-quest-study/data/grades.js'
import { trialUnlocked } from './kids-quest-study/engine/learningUnits.js'
import ActivityPlayer from './kids-quest-study/screens/ActivityPlayer.jsx'
import FreeStudyScreen from './kids-quest-study/screens/FreeStudyScreen.jsx'
import ReviewScreen from './kids-quest-study/screens/ReviewScreen.jsx'
import ChapterTestScreen from './kids-quest-study/screens/ChapterTestScreen.jsx'
import EnglishDictionaryScreen from './kids-quest-study/screens/EnglishDictionaryScreen.jsx'
import { setTtsEnabled, setTtsPreferences, unlockTts } from './kids-quest-study/engine/tts.js'
import { setSfxEnabled, unlockSfx, sfx } from './kids-quest-study/engine/sfx.js'

const SAVE_KEY = 'mana-evo-save-v1'

function loadGameSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    return {
      game: normalizeGameState(parsed?.game || createGameState()),
      legacyStudy: parsed?.study || null
    }
  } catch {
    return { game: createGameState(), legacyStudy: null }
  }
}

function StatusBar({ game, today }) {
  return <div className="status-bar"><span>🎫 {availableTicketCount(game, today)}</span><span>💎 {game.mana}</span><span>⭐ {game.captureItems?.star || 0}</span></div>
}

function Home({ learning, game, go, today }) {
  const dailyCompleted = learning.daily?.coreDone === true
  const doneTasks = learning.daily?.coreIndex || 0
  const totalTasks = learning.daily?.coreTasks?.length || 5
  const leftTasks = Math.max(0, totalTasks - doneTasks)
  const ticketCount = availableTicketCount(game, today)
  const monster = game.box[game.activeMonsterId]
  const species = monster ? speciesOf(monster.speciesId) : null
  const canAdventure = dailyCompleted && ticketCount > 0

  return <main className="screen home-screen">
    <section className="hero-card"><div><p className="eyebrow">きょうの まなび</p><h1>{dailyCompleted ? 'クリア！' : `あと ${leftTasks} きょうか！`}</h1><div className="progress-dots">{Array.from({length:totalTasks},(_,i)=><span key={i} className={i<doneTasks?'done':''}/>)}</div><p className="kid-note">{gradeOf(learning.grade).short} ・ 1きょうか 2〜5もん</p><button className="primary" onClick={()=>go('study')}>{dailyCompleted?'もっと まなぶ':'まなぶ！'}</button></div>{monster && <PlaceholderMonster speciesId={monster.speciesId} excited={dailyCompleted}/>}</section>
    <section className={`adventure-card ${!canAdventure?'locked':''}`}><div><p className="eyebrow">ぼうけん</p>{!dailyCompleted ? <><h2>まず きょうの まなび！</h2><p>5つの きょうかが おわると バトルへ いけるよ。マップは いつでも みられるよ。</p></> : <><h2>{ticketCount>0?`あと ${ticketCount} かい ぼうけん！`:'チケットが ないよ'}</h2><p>{ticketCount>0?'マップで敵を見つけて、バトル・ゲット・シンカ！':'ついかチャレンジ 3もん中2もんで 🎫+1！'}</p></>}</div><button className={canAdventure?'battle':'secondary'} onClick={()=>go('adventure')}>{canAdventure?'マップへ！':'マップをみる'}</button></section>
    <section className="grid-two"><button className="menu-card" onClick={()=>go('study')}><strong>📚 学習メニュー</strong><span>じゅぎょう・とっくん・しれん</span></button><button className="menu-card" onClick={()=>go('monsters')}><strong>🐾 モンスター</strong><span>{species?.name||'相棒'} Lv.{monster?.level||1}</span></button></section>
    <button className="parent-home-card" onClick={()=>go('parent')}><span>🔒</span><div><strong>おうちのひと</strong><small>学年・先取り・むずかしさ・つくよみちゃん設定</small></div><b>›</b></button>
    <button className="howto-home-card" onClick={()=>go('howto')}><strong>❓ あそびかた</strong><span>シンカと アイテムの もらいかた →</span></button>
  </main>
}

function StudyHub({ learning, dispatch, onStartTask, go }) {
  const daily = learning.daily
  const remaining = daily.coreTasks.slice(daily.coreIndex)
  const trial = trialUnlocked(learning, learning.grade)
  const mastery = Math.round(masteryProgress(learning)*100)
  const reviewCount = missedCount(learning)

  const startCore = (task, offset) => {
    const index = daily.coreIndex + offset
    if (index !== daily.coreIndex) dispatch({ type:'PICK_CORE_TASK', index })
    sfx.swoosh()
    onStartTask(task)
  }

  return <main className="screen study-hub">
    <button className="back" onClick={()=>go('home')}>← ホーム</button>
    <section className="study-hero"><div><p className="eyebrow">Kids Quest 学習エンジン</p><h1>📚 {gradeOf(learning.grade).name}の まなび</h1><p>単元の順番・復習・ヒントは、学習記録から自動で変わるよ。</p></div><div className="study-master"><strong>{mastery}%</strong><span>しれんの じゅんび</span></div></section>

    <section className="study-grade-locked"><span>🎓</span><div><strong>{gradeOf(learning.grade).name}</strong><small>がくねんと むずかしさは おうちのひとが きめるよ</small></div><span className="lock-mark">🔒</span></section>

    {!daily.coreDone ? <section className="study-section"><h2>🚀 きょうの ミッション</h2><p className="kid-note">あと {remaining.length}きょうか。すきな じゅんばんで えらべるよ。</p><div className="study-task-grid">{remaining.map((task,index)=>{const dom=DOMAIN_BY_ID[task.domainId];return <button key={task.uid} className="study-task" onClick={()=>startCore(task,index)}><span>{dom?.emoji}</span><strong>{domainName(dom,learning.grade)}</strong><small>{task.questionCount}もん</small>{index===0&&<b>つぎ</b>}</button>})}</div></section> : <section className="study-section complete"><h2>🎉 きょうの ミッション クリア！</h2><p>バトルをあそべるよ。もっと学びたいときは自由勉強、おかわり、追加チャレンジへ。</p></section>}

    <section className="study-menu-grid">
      <button onClick={()=>go('free')}><span>📖</span><strong>じゆうべんきょう</strong><small>好きな教科・チケットなし</small></button>
      <button onClick={()=>go('review')}><span>🎯</span><strong>とっくん</strong><small>きょう復習 {reviewCount}こ</small></button>
      <button onClick={()=>go('trial')}><span>🌟</span><strong>ほしのしれん</strong><small>{trial.unlocked?'ちょうせんできる！':`あと ${trial.missing.length}たんげん`}</small></button>
      <button onClick={()=>go('dictionary')}><span>🔤</span><strong>えいごずかん</strong><small>単語・発音・4問練習</small></button>
    </section>

    {learning.gradeMax > learning.grade && <section className="study-section grade-opened"><h2>🎉 つぎの がくねんが ひらいたよ！</h2><p>つぎへ すすむときは、おうちのひとに きいてね。</p></section>}

    {daily.coreDone && <section className="study-section"><h2>🎫 もっとバトルしたい</h2><p className="kid-note">自由勉強ではチケットは増えないよ。チケットはこの3問チャレンジで。</p><button className="primary huge" onClick={()=>onStartTask(buildExtraTask(daily.extraIndex,learning.grade))}>⚡ ついかチャレンジ（3もん中2もん → 🎫+1）</button></section>}
    {daily.coreDone && daily.okawariIndex<OKAWARI_MAX && <section className="study-section"><h2>🍭 おかわり</h2><button className="secondary huge" onClick={()=>onStartTask(buildOkawariTask(daily.okawariIndex,learning.grade))}>もう1タスク べんきょうする（あと {OKAWARI_MAX-daily.okawariIndex}）</button></section>}
  </main>
}

export default function App() {
  const { state: learning, dispatch: learningDispatch } = useLearningGame()
  const initial = useMemo(loadGameSave, [])
  const [game, setGame] = useState(initial.game)
  const legacyStudyRef = useRef(initial.legacyStudy)
  const [view, setView] = useState(initial.game.activeBattle ? 'adventure' : 'home')
  const [activeTask, setActiveTask] = useState(null)
  const today = dayNumber()

  useEffect(()=>{ localStorage.setItem(SAVE_KEY, JSON.stringify({ study: legacyStudyRef.current, game })) },[game])

  useEffect(()=>{
    setTtsEnabled(learning.settings?.tts !== false)
    setTtsPreferences({ rate:learning.settings?.ttsRate, volume:learning.settings?.ttsVolume, voiceStyle:learning.settings?.ttsVoice })
    setSfxEnabled(learning.settings?.sfx !== false)
  },[learning.settings])

  useEffect(()=>{
    const unlock=()=>{unlockTts();unlockSfx()}
    window.addEventListener('pointerdown',unlock,{once:true})
    return ()=>window.removeEventListener('pointerdown',unlock)
  },[])

  useEffect(()=>{
    const rewards=learning.pendingGameRewards || []
    if (!rewards.length) return
    setGame(current=>rewards.reduce((next,reward)=>grantLearningReward(next,{ ticketDelta:reward.ticketDelta||0, captureItemDelta:reward.captureItemDelta||{}, unitMastered:!!reward.unitMastered, hardMastered:!!reward.hardMastered, today }),current))
    learningDispatch({type:'ACK_GAME_REWARDS',ids:rewards.map(r=>r.id)})
  },[learning.pendingGameRewards,learningDispatch,today])

  const startTask=(task)=>{setActiveTask(task);setView('activity')}
  const dailyCompleted=learning.daily?.coreDone===true
  const navigationLocked=!!game.activeBattle
  const focusView=['activity','free','review','trial','dictionary','parent'].includes(view)

  return <div className={`app-shell${focusView?' app-shell--focus':''}`}>
    {!focusView && <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} today={today}/></header>}
    {view==='home' && <Home learning={learning} game={game} go={setView} today={today}/>} 
    {view==='study' && <StudyHub learning={learning} dispatch={learningDispatch} onStartTask={startTask} go={setView}/>} 
    {view==='activity' && activeTask && <ActivityPlayer task={activeTask} onDone={()=>{setActiveTask(null);setView('study')}}/>}
    {view==='free' && <FreeStudyScreen onBack={()=>setView('study')} onStartTask={startTask} onEnglishDictionary={()=>setView('dictionary')}/>} 
    {view==='review' && <ReviewScreen onBack={()=>setView('study')} onStartTask={startTask}/>} 
    {view==='trial' && <ChapterTestScreen onBack={()=>setView('study')}/>} 
    {view==='dictionary' && <EnglishDictionaryScreen onBack={()=>setView('study')} onStartTask={startTask}/>} 
    {view==='parent' && <ParentGate onBack={()=>setView('home')}/>} 
    {view==='adventure' && <AdventureFlow game={game} setGame={setGame} dailyCompleted={dailyCompleted} dailyDay={learning.daily?.date} today={today} goHome={()=>setView('home')} goStudy={()=>setView('study')}/>} 
    {view==='monsters' && <MonsterScreen game={game} setGame={setGame} goHome={()=>setView('home')}/>} 
    {view==='howto' && <HowToPlay game={game} today={today} goHome={()=>setView('home')} goAdventure={()=>setView('adventure')} goMonsters={()=>setView('monsters')} goStudy={()=>setView('study')}/>} 
    {!['activity','free','review','trial','dictionary','parent'].includes(view) && !navigationLocked && <nav><button className={view==='home'?'active':''} onClick={()=>setView('home')}>🏠<span>ホーム</span></button><button className={view==='adventure'?'active':''} onClick={()=>setView('adventure')}>🗺️<span>ぼうけん</span></button><button className={view==='monsters'?'active':''} onClick={()=>setView('monsters')}>🐾<span>モンスター</span></button><button className={view==='study'?'active':''} onClick={()=>setView('study')}>📚<span>まなぶ</span></button></nav>}
  </div>
}
