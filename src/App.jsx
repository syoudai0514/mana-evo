import React, { useEffect, useMemo, useRef, useState } from 'react'
import { availableTicketCount } from './game/progression.js'
import { applyLearningQueues } from './game/sharedRuntime.js'
import { GAME_SAVE_EVENT, loadGameForProfile, saveGameForProfile } from './game/saveStore.js'
import { AREA_META, speciesOf } from './game/content.js'
import { levelsUntilEvolution } from './game/engine.js'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { AdventureFlow, MonsterScreen } from './game/GameScreens.jsx'
import AppNavigation from './navigation/AppNavigation.jsx'
import { isFocusedAppView, shouldShowTopLevelNavigation } from './navigation/viewOwnership.js'
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

function StatusBar({ game, today }) {
  const tickets = availableTicketCount(game, today)
  const starRings = game.captureItems?.star || 0
  return <div className="status-bar resource-bar" aria-label="もちもの">
    <span className="resource-pill ticket" title="バトルチケット：ぼうけんで1まい使う"><i>🎫</i><strong>{tickets}</strong><small>チケット</small></span>
    <span className="resource-pill mana" title="マナ：まなびでたまる成長のちから"><i>💎</i><strong>{game.mana}</strong><small>マナ</small></span>
    <span className="resource-pill star" title="ほしのわ：モンスターをGETするときに使う"><i>⭐</i><strong>{starRings}</strong><small>ほしのわ</small></span>
  </div>
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
  const nextEvolution = species?.evolution ? speciesOf(species.evolution.to) : null
  const evolutionLeft = monster ? levelsUntilEvolution(monster) : null
  const clearedStages = new Set(game.stagesCleared || [])
  const highestAreaNo = [1, 2, 3, 4].reduce((best, areaNo) => areaNo === 1 || clearedStages.has(`a${areaNo - 1}-boss`) ? Math.max(best, areaNo) : best, 1)
  const requestedAreaNo = Number(game.adventureLocation?.area)
  const requestedAreaUnlocked = requestedAreaNo === 1 || (requestedAreaNo >= 2 && requestedAreaNo <= 4 && clearedStages.has(`a${requestedAreaNo - 1}-boss`))
  const currentAreaNo = requestedAreaUnlocked ? requestedAreaNo : highestAreaNo
  const currentArea = AREA_META.find((meta) => meta.area === currentAreaNo)
  const currentZone = currentArea?.zones?.find((zone) => zone.id === game.adventureLocation?.zoneId) || currentArea?.zones?.[0]

  return <main className="screen home-screen mock-home">
    <section className="manaevo-brand-hero">
      <div className="brand-lockup"><span className="brand-crystal">◆</span><div><h1><b>マナ</b><em>エボ</em></h1><p>まなびが、<strong>進化</strong>になる。</p></div></div>
      {monster && <div className="brand-partner"><PlaceholderMonster speciesId={monster.speciesId} excited={dailyCompleted}/><span>{species?.name} Lv.{monster.level}</span></div>}
    </section>

    <section className="mock-panel home-flow-panel">
      <div className="mock-panel-title"><span>✦</span><h2>きょうの ながれ</h2><small>{dailyCompleted ? 'まなびクリア！' : 'まずは まなぼう！'}</small></div>
      <div className="home-flow-strip">
        {[
          ['1','📖','まなぶ'],['2','🎫','チケットGET'],['3','🗺️','ぼうけん'],['4','⚔️','バトル'],['5','⭕','つかまえる'],['6','✨','そだてる・シンカ']
        ].map(([no,icon,label], index) => <React.Fragment key={no}><div className={'home-flow-step step-' + no}><b>{no}</b><span>{icon}</span><small>{label}</small></div>{index < 5 && <i>›</i>}</React.Fragment>)}
      </div>
    </section>

    <section className="mock-panel home-status-panel">
      <div className="mock-panel-title"><span>🛡️</span><h2>いまの じょうきょう</h2></div>
      <div className="home-status-grid">
        <div><span>きょうのチケット</span><strong>🎫 {ticketCount}<small>まい</small></strong></div>
        <div><span>マナ</span><strong>💎 {game.mana}</strong></div>
        <div className="location-cell"><span>いまのぼうけん</span><strong>エリア{currentAreaNo}・{currentZone?.name}</strong><small>{currentArea?.levelLabel}</small></div>
        <button className="partner-cell" onClick={() => go('monsters')}>{monster && <PlaceholderMonster speciesId={monster.speciesId} compact/>}<span>{species?.name || '相棒'}<small>Lv.{monster?.level || 1}</small></span></button>
      </div>
    </section>

    <section className="mock-panel home-learning-panel">
      <div className="home-learning-copy"><p className="eyebrow">きょうの まなび</p><h2>{dailyCompleted ? '🎉 ミッション クリア！' : 'あと ' + leftTasks + ' きょうか！'}</h2><div className="progress-dots">{Array.from({length:totalTasks},(_,i)=><span key={i} className={i<doneTasks?'done':''}/>)}</div><p>{gradeOf(learning.grade).short} ・ 1きょうか 2〜5もん</p></div>
      <div className="home-primary-actions"><button className="primary" onClick={() => go('study')}>{dailyCompleted ? '📖 もっと まなぶ' : '📖 まなぶ！'}</button><button className={canAdventure ? 'battle' : 'secondary'} aria-label="マップへ！" onClick={()=>go('adventure')}>🗺️ {canAdventure ? 'ぼうけんへ！' : 'マップをみる'}</button></div>
    </section>

    <section className="mock-panel home-guide-panel">
      <div className="mock-panel-title gold"><span>📖</span><h2>ゲームせつめい</h2></div>
      <div className="home-guide-list">
        <p><b>📚</b><span>べんきょうすると <strong className="green">チケット</strong>が もらえる</span></p>
        <p><b>🎫</b><span>チケットで <strong className="orange">ぼうけん</strong>に いける</span></p>
        <p><b>⭕</b><span>モンスターを <strong className="purple">つかまえて</strong> <strong className="teal">そだてる</strong></span></p>
        <p><b>✨</b><span>じぶんで <strong className="blue">シンカ</strong>すると あたらしい ばしょが ひらく</span></p>
      </div>
      <div className="evolution-mini-goal"><strong>{nextEvolution ? (evolutionLeft === 0 ? '✨ いま シンカできる！' : evolutionLeft != null ? 'あと ' + evolutionLeft + 'Lvで ' + nextEvolution.name : 'つぎは ' + nextEvolution.name) : '👑 さいしゅうの すがた！'}</strong><span>{nextEvolution ? 'GETしただけで おわりじゃない。そだてて じぶんで シンカ！' : 'ギガシンカ・キョダイバースト・EXを めざそう！'}</span></div>
    </section>

    <div className="home-small-links"><button className="howto-home-card" onClick={() => go('howto')}><strong>❓ あそびかた</strong><span>ルールと しんかアイテム →</span></button><button className="parent-home-card" onClick={() => go('parent')}><span>🔒</span><div><strong>おうちのひと</strong><small>学年・先取り・むずかしさ・つくよみちゃん設定</small></div><b>›</b></button></div>
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
  const initialProfileId = learning.activeProfileId || 'child-1'
  const initialGame = useMemo(() => loadGameForProfile(initialProfileId), [])
  const [game, setGame] = useState(initialGame)
  const gameProfileRef = useRef(initialProfileId)
  const [view, setView] = useState(initialGame.activeBattle ? 'adventure' : 'home')
  const [activeTask, setActiveTask] = useState(null)
  const today = dayNumber()

  useEffect(() => {
    const profileId = learning.activeProfileId || 'child-1'
    if (gameProfileRef.current !== profileId) {
      saveGameForProfile(gameProfileRef.current, game)
      const next = loadGameForProfile(profileId)
      gameProfileRef.current = profileId
      setGame(next)
      setActiveTask(null)
      setView(next.activeBattle ? 'adventure' : 'home')
      return
    }
    saveGameForProfile(profileId, game)
  }, [game, learning.activeProfileId])

  useEffect(() => {
    const reloadImportedGame = () => {
      const profileId = gameProfileRef.current
      const next = loadGameForProfile(profileId)
      setGame(next)
      setActiveTask(null)
      setView(next.activeBattle ? 'adventure' : 'home')
    }
    window.addEventListener(GAME_SAVE_EVENT, reloadImportedGame)
    return () => window.removeEventListener(GAME_SAVE_EVENT, reloadImportedGame)
  }, [])

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
    const signals=learning.pendingProgressionSignals || []
    if (!rewards.length && !signals.length) return
    const profileId = learning.activeProfileId || 'child-1'
    const current = loadGameForProfile(profileId)
    const applied = applyLearningQueues(current, { rewards, signals, today })
    saveGameForProfile(profileId, applied.game)
    if (gameProfileRef.current === profileId) setGame(applied.game)
    if (rewards.length) learningDispatch({type:'ACK_GAME_REWARDS',ids:rewards.map((reward)=>reward.id)})
    if (signals.length) learningDispatch({type:'ACK_PROGRESSION_SIGNALS',ids:signals.map((signal)=>signal.id)})
  },[learning.pendingGameRewards,learning.pendingProgressionSignals,learning.activeProfileId,learningDispatch,today])

  const startTask=(task)=>{setActiveTask(task);setView('activity')}
  const dailyCompleted=learning.daily?.coreDone===true
  const focusView=isFocusedAppView(view)
  const showTopLevelNavigation=shouldShowTopLevelNavigation(view,{activeBattle:!!game.activeBattle})

  return <div className={`app-shell${focusView?' app-shell--focus':''}`}>
    {!focusView && <header className="game-header"><div className="logo"><span className="logo-gem">◆</span><b>マナ</b><strong>エボ</strong><small>まなびが、進化になる。</small></div><StatusBar game={game} today={today}/></header>}
    {view==='home' && <Home learning={learning} game={game} go={setView} today={today}/>} 
    {view==='study' && <StudyHub learning={learning} dispatch={learningDispatch} onStartTask={startTask} go={setView}/>} 
    {view==='activity' && activeTask && <ActivityPlayer task={activeTask} onDone={()=>{setActiveTask(null);setView('study')}}/>}
    {view==='free' && <FreeStudyScreen onBack={()=>setView('study')} onStartTask={startTask} onEnglishDictionary={()=>setView('dictionary')}/>} 
    {view==='review' && <ReviewScreen onBack={()=>setView('study')} onStartTask={startTask}/>} 
    {view==='trial' && <ChapterTestScreen onBack={()=>setView('study')}/>} 
    {view==='dictionary' && <EnglishDictionaryScreen onBack={()=>setView('study')} onStartTask={startTask}/>} 
    {view==='parent' && <ParentGate onBack={()=>setView('home')}/>} 
    {view==='adventure' && <AdventureFlow game={game} setGame={setGame} dailyCompleted={dailyCompleted} dailyDay={today} today={today} goHome={()=>setView('home')} goStudy={()=>setView('study')}/>} 
    {view==='monsters' && <MonsterScreen game={game} setGame={setGame} goHome={()=>setView('home')}/>} 
    {view==='howto' && <HowToPlay game={game} today={today} goHome={()=>setView('home')} goAdventure={()=>setView('adventure')} goMonsters={()=>setView('monsters')} goStudy={()=>setView('study')}/>} 
    {showTopLevelNavigation && <AppNavigation view={view} onNavigate={setView} />}
  </div>
}
