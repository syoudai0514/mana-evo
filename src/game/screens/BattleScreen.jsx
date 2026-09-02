import React, { useEffect, useRef, useState } from 'react'
import { dayNumber } from '../../kids-quest-study/engine/srs.js'
import { sfx } from '../../kids-quest-study/engine/sfx.js'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { effectivenessLabel, moveOf, speciesOf, typeEffectiveness, typeLabel } from '../content.js'
import { GROWTH_SHARD_RULE } from '../captureDomain.js'
import { confirmEvolution } from '../evolutionDomain.js'
import {
  abandonBattle,
  activateBurst,
  activateGiga,
  attemptCapture,
  availableBattleMoveIds,
  canAttemptCapture,
  canUseProtect,
  clearFinishedBattle,
  currentPlayerHp,
  currentPlayerMaxHp,
  redeemGrowthShardXp,
  resolveDuplicateCaptureChoice,
  stageById,
  switchBattleMonster,
  useMove,
  useProtect
} from '../engine.js'
import { availableTicketCount, CAPTURE_ITEM_IDS, specialProgressionStatus } from '../progression.js'
import { CapturePanel, CapturePresentation } from './CapturePanel.jsx'
import { EvolutionCelebration, EvolutionPrompt } from './EvolutionOverlay.jsx'
import { HpBar, TypePills } from './GameScreenPrimitives.jsx'

function eventDuration(event) {
  if (!event) return 0
  if (event.kind === 'move') return 300
  if (event.kind === 'damage' || event.kind === 'status-damage') return 440
  if (event.kind === 'heal' || event.kind === 'protect' || event.kind === 'protect-impact') return 400
  if (event.kind === 'defeat') return 720
  if (event.kind === 'reward-marker') return 500
  return 330
}

function presentationCue(event) {
  if (!event) return ''
  if (event.kind === 'defeat') return event.target === 'enemy' ? 'たおした！' : 'たおれた！'
  if (event.kind === 'heal') return 'HP かいふく！'
  if (event.kind === 'protect') return 'まもる！'
  if (event.kind === 'protect-impact') return 'こうげきを ふせいだ！'
  if (event.kind === 'miss') return 'はずれた！'
  if (event.kind === 'status-damage') return 'じょうたいの ダメージ！'
  if (event.kind !== 'damage') return ''
  if (event.critical) return 'きゅうしょ！'
  if (Number(event.effectiveness) === 0) return 'きかない！'
  if (Number(event.effectiveness) >= 2) return 'こうかばつぐん！'
  if (Number(event.effectiveness) < 1) return 'いまひとつ'
  return ''
}

function visualHp(trace, target, fallback) {
  if (!trace?.events?.length) return fallback
  let hp = target === 'enemy' ? trace.initialEnemyHp : trace.initialPlayerHp
  const end = Math.min(trace.index, trace.events.length - 1)
  for (let index = 0; index <= end; index += 1) {
    const event = trace.events[index]
    if (event?.target === target && Number.isFinite(Number(event.hpAfter))) hp = Math.max(0, Number(event.hpAfter))
  }
  return hp
}

function crySeed(speciesId) {
  const match = /m(\d+)/.exec(String(speciesId || ''))
  return match ? Number(match[1]) : String(speciesId || '').length
}

export function BattleView({ game, setGame, onExitToMap, goStudy }) {
  const battle = game.activeBattle
  const stage = stageById(battle.stageId)
  const active = game.box[battle.activeInstanceId]
  const playerSpecies = speciesOf(active.speciesId)
  const enemySpecies = speciesOf(battle.enemy.speciesId)
  const playerMax = currentPlayerMaxHp(game, battle)
  const playerHp = currentPlayerHp(battle)
  const finished = ['won', 'lost', 'caught'].includes(battle.status)
  const forcedSwitch = battle.status === 'needs_switch'
  const postWinCapture = battle.status === 'won' && battle.enemy.hp <= 0
  const special = specialProgressionStatus(active, game)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [captureSequence, setCaptureSequence] = useState(null)
  const [presentationTrace, setPresentationTrace] = useState(null)
  const [entryActive, setEntryActive] = useState(true)
  const [evolutionPromptQueue, setEvolutionPromptQueue] = useState([])
  const [evolutionReveal, setEvolutionReveal] = useState(null)
  const [shardResult, setShardResult] = useState(null)
  const seenQualificationIds = useRef(new Set())
  const actionLockRef = useRef(false)

  const captureResolutionId = battle.rewardResolutionId ? `${battle.rewardResolutionId}:capture` : null
  const captureSettlement = captureResolutionId ? game.captureDomain?.settlements?.[captureResolutionId] : null
  const duplicatePending = captureSettlement?.status === 'pending_duplicate_choice'
  const captureEligible = !forcedSwitch && (battle.status === 'fighting' || postWinCapture) && CAPTURE_ITEM_IDS.some((id) => canAttemptCapture(game, battle, id))
  const presentationActive = !!presentationTrace?.events?.length
  const activePresentationEvent = presentationActive ? presentationTrace.events[presentationTrace.index] || null : null
  const activeEvolutionPrompt = !presentationActive && !entryActive && !captureSequence && !duplicatePending && !captureOpen && !forcedSwitch && !evolutionReveal
    ? evolutionPromptQueue[0] || null
    : null
  const shownPlayerHp = visualHp(presentationTrace, 'player', playerHp)
  const shownEnemyHp = visualHp(presentationTrace, 'enemy', battle.enemy.hp)
  const presentationTarget = activePresentationEvent?.target
  const presentationActor = activePresentationEvent?.actor
  const presentationKind = activePresentationEvent?.kind || ''
  const cue = presentationCue(activePresentationEvent)

  useEffect(() => {
    setEntryActive(true)
    sfx.cry(crySeed(battle.enemy.speciesId))
    const timer = window.setTimeout(() => setEntryActive(false), 760)
    return () => window.clearTimeout(timer)
  }, [battle.battleId])

  useEffect(() => {
    if (!activePresentationEvent) {
      if (presentationTrace) {
        setPresentationTrace(null)
        actionLockRef.current = false
      }
      return undefined
    }

    if (activePresentationEvent.kind === 'move') sfx.swoosh()
    else if (activePresentationEvent.kind === 'damage') {
      if (activePresentationEvent.critical || Number(activePresentationEvent.effectiveness) >= 2) sfx.hitBig()
      else sfx.hit()
    } else if (activePresentationEvent.kind === 'status-damage' || activePresentationEvent.kind === 'protect-impact') sfx.hit()
    else if (activePresentationEvent.kind === 'heal' || activePresentationEvent.kind === 'reward-marker') sfx.reward()
    else if (activePresentationEvent.kind === 'protect') sfx.swoosh()
    else if (activePresentationEvent.kind === 'defeat' && activePresentationEvent.target === 'enemy') sfx.fanfare()

    const timer = window.setTimeout(() => {
      setPresentationTrace((current) => {
        if (!current?.events?.length || current.events[current.index]?.eventId !== activePresentationEvent.eventId) return current
        if (current.index >= current.events.length - 1) {
          actionLockRef.current = false
          return null
        }
        return { ...current, index: current.index + 1 }
      })
    }, eventDuration(activePresentationEvent))
    return () => window.clearTimeout(timer)
  }, [activePresentationEvent?.eventId])

  const enqueuePendingEvolutions = (pendingByInstance, nextGame) => {
    const prompts = []
    for (const [instanceId, supplied] of Object.entries(pendingByInstance || {}).sort(([a], [b]) => a.localeCompare(b))) {
      const pending = supplied?.qualificationId ? supplied : nextGame?.box?.[instanceId]?.pendingEvolution
      if (!pending?.qualificationId || seenQualificationIds.current.has(pending.qualificationId)) continue
      seenQualificationIds.current.add(pending.qualificationId)
      prompts.push({ instanceId, pendingEvolution: pending, level: nextGame?.box?.[instanceId]?.level || pending.qualifiedAtLevel || 1 })
    }
    if (prompts.length) setEvolutionPromptQueue((queue) => [...queue, ...prompts])
  }

  const startTrace = (events, beforeBattle = battle) => {
    if (!Array.isArray(events) || !events.length) {
      actionLockRef.current = false
      return
    }
    setPresentationTrace({
      events,
      index: 0,
      initialPlayerHp: currentPlayerHp(beforeBattle),
      initialEnemyHp: Math.max(0, Number(beforeBattle.enemy?.hp) || 0)
    })
  }

  const act = (moveId) => {
    if (actionLockRef.current) return
    actionLockRef.current = true
    const beforeBattle = battle
    const result = useMove(game, battle, moveId)
    if (!result.ok) {
      actionLockRef.current = false
      return
    }
    setGame(result.game)
    enqueuePendingEvolutions(result.rewards?.pendingEvolutionsByInstance, result.game)
    startTrace(result.presentationEvents, beforeBattle)
    setCaptureOpen(false)
    setSwitchOpen(false)
  }

  const protect = () => {
    if (actionLockRef.current) return
    actionLockRef.current = true
    const beforeBattle = battle
    const result = useProtect(game, battle)
    if (!result.ok) {
      actionLockRef.current = false
      return
    }
    setGame(result.game)
    startTrace(result.presentationEvents, beforeBattle)
  }

  const specialAct = (type) => {
    if (actionLockRef.current) return
    const result = type === 'giga' ? activateGiga(game, battle) : activateBurst(game, battle)
    if (result.ok) {
      sfx.reward()
      setGame(result.game)
    }
  }

  const capture = (itemType) => {
    if (actionLockRef.current) return
    const result = attemptCapture(game, battle, null, itemType)
    if (!result.ok) return
    const frames = result.capturePresentation?.frames || result.battle?.capturePresentation || []
    if (Array.isArray(frames) && frames.length) {
      setCaptureSequence({
        id: `${result.battle?.battleId || result.battle?.stageId || 'capture'}:${result.battle?.captureAttempts || 0}`,
        frames,
        itemType,
        speciesId: battle.enemy.speciesId,
        postWin: battle.status === 'won'
      })
    }
    enqueuePendingEvolutions(result.pendingEvolutionsByInstance, result.game)
    setGame(result.game)
    setCaptureOpen(false)
  }

  const confirmPendingEvolution = (prompt) => {
    const pending = prompt?.pendingEvolution
    if (!prompt?.instanceId || !pending?.qualificationId) return
    const result = confirmEvolution(game, {
      instanceId: prompt.instanceId,
      qualificationId: pending.qualificationId
    })
    if (!result.ok) return
    setEvolutionPromptQueue((queue) => queue.filter((entry) => entry.pendingEvolution?.qualificationId !== pending.qualificationId))
    if (result.alreadyApplied) {
      setGame(result.game)
      return
    }
    setGame(result.game)
    sfx.levelUp()
    setEvolutionReveal({
      fromId: result.fromSpeciesId,
      toId: result.toSpeciesId,
      level: result.game?.box?.[prompt.instanceId]?.level || prompt.level || 1,
      firstEvolutionDiscovery: result.firstEvolutionDiscovery === true
    })
    if (result.nextPendingEvolution?.qualificationId) {
      enqueuePendingEvolutions({ [prompt.instanceId]: result.nextPendingEvolution }, result.game)
    }
  }

  const deferPendingEvolution = (prompt) => {
    const qualificationId = prompt?.pendingEvolution?.qualificationId
    setEvolutionPromptQueue((queue) => qualificationId
      ? queue.filter((entry) => entry.pendingEvolution?.qualificationId !== qualificationId)
      : queue.slice(1))
  }

  const swap = (instanceId) => {
    const result = switchBattleMonster(game, battle, instanceId)
    if (!result.ok) return
    setGame(result.game)
    setSwitchOpen(false)
  }

  const resolveDuplicate = (choice) => {
    if (!captureResolutionId) return
    const result = resolveDuplicateCaptureChoice(game, captureResolutionId, choice)
    if (!result.ok) return
    setGame(result.game)
    if (choice === 'support') {
      setShardResult({ kind: 'support', text: `そだちのかけら ${result.game.growthShards || 0}こ` })
    }
  }

  const redeemShard = (instanceId) => {
    const redemptionIndex = Object.keys(game.captureDomain?.shardRedemptions || {}).length + 1
    const redemptionId = `${battle.battleId || battle.stageId}:growth-shard:${instanceId}:${redemptionIndex}`
    const before = game.box?.[instanceId]
    const result = redeemGrowthShardXp(game, { redemptionId, instanceId })
    if (!result.ok) return
    const after = result.game.box?.[instanceId]
    setGame(result.game)
    const xp = result.redemption?.xp || GROWTH_SHARD_RULE.xpPerUse
    setShardResult({
      kind: 'redeem',
      text: `${speciesOf(after?.speciesId || before?.speciesId)?.name || 'なかま'}に XP +${xp}！ Lv.${before?.level || 1} → Lv.${after?.level || before?.level || 1}`
    })
    if (result.pendingEvolution) enqueuePendingEvolutions({ [instanceId]: result.pendingEvolution }, result.game)
  }

  const exit = () => {
    if (duplicatePending || captureSequence || presentationActive || activeEvolutionPrompt || evolutionReveal) return
    const today = dayNumber()
    if (finished) {
      const result = clearFinishedBattle(game, { today })
      if (result.ok) setGame(result.game)
      onExitToMap()
      return
    }
    const refundable = !battle.ticketRefunded && battle.ticketSource && battle.ticketSource.expiresDay > today
    const message = refundable ? 'バトルを やめる？ チケット1まいは もどるよ。' : 'バトルを やめる？ チケットは期限をすぎているので もどらないよ。'
    if (typeof window !== 'undefined' && !window.confirm(message)) return
    const result = abandonBattle(game, { today })
    if (result.ok) setGame(result.game)
    onExitToMap()
  }

  const battleMoves = availableBattleMoveIds(game, battle)
  const showNormalCommands = !finished && !forcedSwitch && !captureOpen && !switchOpen && !captureSequence && !presentationActive && !entryActive && !activeEvolutionPrompt && !evolutionReveal
  const showTeamChoice = !finished && !captureSequence && !presentationActive && !entryActive && (forcedSwitch || switchOpen)
  const showShardTools = finished && battle.status !== 'lost' && !duplicatePending && !presentationActive && !captureSequence && ((game.growthShards || 0) > 0 || captureSettlement?.choice === 'support')
  const showFinishedCard = finished && !presentationActive && !entryActive
  const arenaClasses = [
    'battle-arena-v2',
    entryActive ? 'battle-entry-active' : '',
    presentationActive ? 'battle-presentation-active' : '',
    presentationActor ? `presentation-actor-${presentationActor}` : '',
    presentationTarget ? `presentation-target-${presentationTarget}` : '',
    presentationKind ? `presentation-kind-${presentationKind}` : ''
  ].filter(Boolean).join(' ')

  return <main className={`screen battle-screen-v2 area-theme-${stage?.adventureArea || stage?.area || 5}`}>
    <EvolutionCelebration reveal={evolutionReveal} onClose={() => setEvolutionReveal(null)} />
    <EvolutionPrompt prompt={activeEvolutionPrompt} onConfirm={confirmPendingEvolution} onLater={deferPendingEvolution} />
    <CapturePresentation sequence={captureSequence} onComplete={() => setCaptureSequence(null)} />

    <div className="battle-head">
      <button className="back" disabled={!!captureSequence || duplicatePending || presentationActive || !!activeEvolutionPrompt || !!evolutionReveal} onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button>
      <div className="battle-head-title"><small>{stage?.zoneName || 'ぼうけん'}</small><strong>{stage?.label}</strong></div>
      <span>TURN <b>{battle.turn}</b></span>
    </div>
    {battle.challenge && <div className="challenge-banner">🔥 チャレンジモード：いまの強さで再調整</div>}
    {battle.bossTelegraphed && !finished && <div className="boss-warning"><strong>⚠️ つぎに おおわざ！</strong><span>まもるなら いま！</span></div>}
    {battle.playerSpecial && <div className={`special-active ${battle.playerSpecial.type}`}><strong>{battle.playerSpecial.type === 'giga' ? '🔷 ギガシンカ中！' : '💥 キョダイバースト中！'}</strong>{battle.playerSpecial.type === 'burst' && <span>あと {battle.playerSpecial.turnsLeft}ターン</span>}</div>}

    <section className={arenaClasses} aria-label="バトルフィールド">
      <div className="battle-arena-glow enemy-glow" aria-hidden="true" />
      <div className="battle-arena-glow player-glow" aria-hidden="true" />
      {entryActive && <div className="battle-entry-cue" aria-live="polite">{enemySpecies.name}が あらわれた！</div>}
      {cue && <div className={`battle-presentation-cue cue-${presentationKind}`} aria-live="polite">{cue}</div>}
      <div className={`fighter enemy-fighter ${presentationTarget === 'enemy' && ['damage', 'status-damage', 'defeat'].includes(presentationKind) ? 'is-hit' : ''} ${presentationActor === 'enemy' && presentationKind === 'move' ? 'is-attacking' : ''}`}>
        <div className="fighter-info"><div className="fighter-name"><strong>{enemySpecies.name}</strong><span>Lv.{battle.enemy.level}</span></div><TypePills types={enemySpecies.types} /><HpBar value={shownEnemyHp} max={battle.enemy.maxHp} /><small>HP {shownEnemyHp}/{battle.enemy.maxHp}</small></div>
        <div className="fighter-art"><PlaceholderMonster speciesId={battle.enemy.speciesId} size={140} /></div>
      </div>
      <div className="battle-versus" aria-hidden="true">VS</div>
      <div className={`fighter player-fighter ${presentationTarget === 'player' && ['damage', 'status-damage', 'defeat', 'protect-impact'].includes(presentationKind) ? 'is-hit' : ''} ${presentationActor === 'player' && presentationKind === 'move' ? 'is-attacking' : ''} ${presentationKind === 'heal' ? 'is-healing' : ''} ${presentationKind === 'protect' || presentationKind === 'protect-impact' ? 'is-protecting' : ''}`}>
        <div className="fighter-art"><PlaceholderMonster speciesId={active.speciesId} size={140} /></div>
        <div className="fighter-info"><div className="fighter-name"><strong>{playerSpecies.name}</strong><span>Lv.{active.level}</span></div><TypePills types={playerSpecies.types} /><HpBar value={shownPlayerHp} max={playerMax} /><small>HP {shownPlayerHp}/{playerMax}</small></div>
      </div>
    </section>

    <section className="battle-log"><span className="battle-log-label">BATTLE LOG</span>{battle.log.slice(-2).map((line, i) => <p key={`${line}-${i}`}>{line}</p>)}</section>

    {showNormalCommands && <section className="battle-command-deck">
      <div className="battle-command-title"><div><small>YOUR TURN</small><strong>どうする？</strong></div>{captureEligible && <span className="get-ready-badge">✨ GETできる！</span>}</div>
      <section className="move-grid">
        {battleMoves.map((moveId) => {
          const move = moveOf(moveId)
          const factor = move.effect?.type === 'damage' ? typeEffectiveness(move.type, enemySpecies.types) : 1
          const moveClasses = [
            move.role === 'burst' ? 'burst-move' : '',
            move.role === 'heal' ? 'heal-move' : '',
            move.effect?.type === 'damage' && factor >= 2 ? 'recommended-move' : '',
            move.effect?.type === 'damage' && factor === 0 ? 'ineffective-move' : ''
          ].filter(Boolean).join(' ')
          return <button key={moveId} className={moveClasses} data-move-type={move.type} onClick={() => act(moveId)}>
            <div className="move-name-row"><strong>{move.name}</strong>{move.effect?.type === 'damage' && <em className={`effect effect-${String(factor).replace('.', '-')}`}>{effectivenessLabel(factor)}</em>}</div>
            <span>{typeLabel(move.type)}　{move.effect?.type === 'heal' ? 'HP 20%かいふく' : `威力 ${move.power}`}　命中 {move.accuracy}</span>
            <small>{move.role === 'heal' ? '1バトル1かい' : move.role === 'coverage' ? '相性をねらう技' : move.role === 'finisher' ? '大きな一撃' : move.role === 'burst' ? 'バーストせんよう！' : factor >= 2 ? 'いま こうかばつぐん！' : ''}</small>
          </button>
        })}
      </section>
      <div className="battle-action-row">
        <button className={`protect-action ${battle.bossTelegraphed ? 'recommended' : ''}`} disabled={!canUseProtect(battle)} onClick={protect}>🛡️ まもる<small>{canUseProtect(battle) ? 'ダメージを ふせぐ' : 'れんぞくでは つかえない'}</small></button>
        {game.team.some((id) => id !== battle.activeInstanceId && (battle.partyHp?.[id] || 0) > 0) && <button className="secondary" onClick={() => setSwitchOpen(true)}>🔁 こうたい<small>なかまを えらぶ</small></button>}
        {captureEligible && <button className="capture-main-cta ready" onClick={() => setCaptureOpen(true)}><span className="mini-capture-ball" aria-hidden="true"/>ボールを なげる<small>HPは はんぶんいか！</small></button>}
        {!battle.specialUsed && special.giga.activatable && <button className="giga-action" onClick={() => specialAct('giga')}>🔷 ギガシンカ<small>このバトル中 ぜんのうりょく×1.35</small></button>}
        {!battle.specialUsed && special.burst.activatable && <button className="burst-action" onClick={() => specialAct('burst')}>💥 キョダイバースト<small>3ターン・HP×2 / こうげき×1.2</small></button>}
      </div>
    </section>}

    {!forcedSwitch && captureEligible && captureOpen && !captureSequence && !presentationActive && <CapturePanel game={game} battle={battle} captureDisabled={stage?.captureDisabled} onCapture={capture} onCancel={() => setCaptureOpen(false)} />}

    {forcedSwitch && !captureSequence && !presentationActive && <section className="battle-result-card"><h2>つぎの なかまを えらぼう！</h2><p>まだ元気な仲間がいるから、バトルは続けられるよ。</p></section>}

    {showTeamChoice && <section className="team-switch"><h3>{forcedSwitch ? 'こうたい ひっす' : 'こうたいする なかまを えらぼう'}</h3><div>{game.team.map((id) => {
      const member = game.box[id]
      const sp = speciesOf(member.speciesId)
      const hp = battle.partyHp?.[id] || 0
      const max = currentPlayerMaxHp(game, battle, id)
      return <button key={id} disabled={id === battle.activeInstanceId || hp <= 0} onClick={() => swap(id)}><PlaceholderMonster speciesId={member.speciesId} compact /><span>{sp.name}<small>Lv.{member.level}　HP {hp}/{max}</small><TypePills types={sp.types} /></span></button>
    })}</div>{!forcedSwitch && <button className="secondary" onClick={() => setSwitchOpen(false)}>もどる</button>}</section>}

    {showFinishedCard && duplicatePending && !captureSequence && <section className="battle-result-card duplicate-choice-card" aria-label="つかまえたモンスターをどうする？">
      <h2>もう いる なかまだ！</h2>
      <p>{enemySpecies.name}を どうする？ どちらか 1つを えらぼう。</p>
      <div className="battle-action-row">
        <button className="primary" onClick={() => resolveDuplicate('keep')}>なかまにする<small>べつの1たいとして ボックスへ</small></button>
        <button className="secondary" onClick={() => resolveDuplicate('support')}>おうえんにかえる<small>そだちのかけら +1</small></button>
      </div>
    </section>}

    {showFinishedCard && !duplicatePending && !captureOpen && <section className="battle-result-card">
      <h2>{battle.status === 'won' ? 'かち！ 🎉' : battle.status === 'caught' ? 'ゲット！ ★★★★' : 'まけちゃった…'}</h2>
      {battle.status === 'won' && stage?.id === 'a1-boss' && <p>🔷 はじめてのクリアで ギガキーが ひらいた！</p>}
      {battle.status === 'won' && stage?.specialReward?.type === 'giga' && <p>🔷 {enemySpecies.name}のギガコアを解放！</p>}
      {battle.status === 'won' && stage?.specialReward?.type === 'burst' && <p>💥 {enemySpecies.name}のバーストのしるしを解放！</p>}
      {battle.status === 'won' && captureEligible && <>
        <p>たおしたあとでも、ボールを なげて GETを ねらえるよ！</p>
        <button className="capture-main-cta ready" onClick={() => setCaptureOpen(true)}><span className="mini-capture-ball" aria-hidden="true"/>ボールを なげる<small>たおしたあとでも GETできる！</small></button>
      </>}
      {battle.status === 'caught' && !captureSettlement?.duplicate && <p>新しいなかまは、べつの1たいとして ボックスに入ったよ。チームは「モンスター」で えらべるよ。</p>}
      {battle.status === 'caught' && captureSettlement?.duplicate && captureSettlement.choice === 'keep' && <p>もう1たいの {enemySpecies.name}が、べつの1たいとして ボックスに入ったよ。</p>}
      {battle.status === 'caught' && captureSettlement?.duplicate && captureSettlement.choice === 'support' && <p>{enemySpecies.name}の おうえんで、そだちのかけらが ふえたよ！</p>}
      {battle.status === 'lost' && <p>{battle.ticketRefunded ? '🎫は1まい返ってきたよ。仲間を育てて再挑戦しよう！' : '🎫は期限をすぎていたので戻らなかったよ。もう一度学んで挑戦しよう！'}</p>}

      {showShardTools && <div className="growth-shard-tools">
        <strong>✨ そだちのかけら {game.growthShards || 0}こ</strong>
        {shardResult?.text && <p aria-live="polite">{shardResult.text}</p>}
        {(game.growthShards || 0) >= GROWTH_SHARD_RULE.shardsPerUse && <>
          <p>{GROWTH_SHARD_RULE.shardsPerUse}こで、いまのチームの1たいに XP +{GROWTH_SHARD_RULE.xpPerUse}！</p>
          <div className="growth-shard-targets">{game.team.map((instanceId) => {
            const member = game.box?.[instanceId]
            if (!member) return null
            return <button key={instanceId} onClick={() => redeemShard(instanceId)}><strong>{speciesOf(member.speciesId)?.name}</strong><small>Lv.{member.level}　この子に つかう</small></button>
          })}</div>
        </>}
      </div>}

      <button className="primary" onClick={exit}>マップへ</button>
      {availableTicketCount(game, dayNumber()) < 1 && <button className="secondary" onClick={goStudy}>まなぶ！</button>}
    </section>}
  </main>
}
