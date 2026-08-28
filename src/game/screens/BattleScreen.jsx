import React, { useEffect, useRef, useState } from 'react'
import { dayNumber } from '../../kids-quest-study/engine/srs.js'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { effectivenessLabel, moveOf, speciesOf, typeEffectiveness, typeLabel } from '../content.js'
import { GROWTH_SHARD_RULE } from '../captureDomain.js'
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
import { EvolutionCelebration } from './EvolutionOverlay.jsx'
import { HpBar, TypePills } from './GameScreenPrimitives.jsx'
import '../battle-v6.css'

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
  const special = specialProgressionStatus(active, game)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [captureSequence, setCaptureSequence] = useState(null)
  const [evolutionQueue, setEvolutionQueue] = useState([])
  const [shardResult, setShardResult] = useState(null)
  const [turnCue, setTurnCue] = useState(null)
  const seenEvolutionKeys = useRef(new Set())
  const turnTimers = useRef([])

  useEffect(() => () => {
    turnTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const captureResolutionId = battle.rewardResolutionId ? `${battle.rewardResolutionId}:capture` : null
  const captureSettlement = captureResolutionId ? game.captureDomain?.settlements?.[captureResolutionId] : null
  const duplicatePending = captureSettlement?.status === 'pending_duplicate_choice'
  const captureEligible = !forcedSwitch && CAPTURE_ITEM_IDS.some((id) => canAttemptCapture(game, battle, id))
  const postKoCaptureEligible = battle.status === 'won' && captureEligible
  const activeEvolutionReveal = !captureSequence && !duplicatePending ? evolutionQueue[0] || null : null
  const resolvingTurn = !!turnCue

  const enqueueEvolutions = (evolutionsByInstance, nextGame) => {
    const reveals = []
    for (const [instanceId, evolution] of Object.entries(evolutionsByInstance || {})) {
      if (!evolution?.from || !evolution?.to) continue
      const key = `${instanceId}:${evolution.from}->${evolution.to}`
      if (seenEvolutionKeys.current.has(key)) continue
      seenEvolutionKeys.current.add(key)
      const monster = nextGame?.box?.[instanceId]
      reveals.push({
        fromId: evolution.from,
        toId: evolution.to,
        level: monster?.level || 1,
        firstEvolutionDiscovery: !!evolution.firstEvolutionDiscovery
      })
    }
    if (reveals.length) setEvolutionQueue((queue) => [...queue, ...reveals])
  }

  const playTurnPresentation = (presentation) => {
    turnTimers.current.forEach((timer) => window.clearTimeout(timer))
    turnTimers.current = []
    if (!presentation) { setTurnCue(null); return }

    const steps = []
    if (presentation.enemyFirst) {
      steps.push({ phase: 'enemy-lunge', text: `⚡ ${presentation.enemyName}のほうが はやい！` })
      if (presentation.playerDamage > 0) steps.push({ phase: 'player-hit', text: `${presentation.playerName}に ${presentation.playerDamage} ダメージ！` })
      if (presentation.playerFainted) {
        steps.push({ phase: 'player-fainted', text: 'こうげきするまえに たおされた！' })
      } else {
        steps.push({ phase: 'player-lunge', text: `${presentation.playerName}の こうげき！` })
        if (presentation.enemyDamage > 0) steps.push({ phase: presentation.enemyFainted ? 'enemy-fainted' : 'enemy-hit', text: `${presentation.enemyName}に ${presentation.enemyDamage} ダメージ！` })
      }
    } else {
      steps.push({ phase: 'player-lunge', text: `${presentation.playerName}が さきに こうげき！` })
      if (presentation.enemyDamage > 0) steps.push({ phase: presentation.enemyFainted ? 'enemy-fainted' : 'enemy-hit', text: `${presentation.enemyName}に ${presentation.enemyDamage} ダメージ！` })
      if (!presentation.enemyFainted) {
        steps.push({ phase: 'enemy-lunge', text: `${presentation.enemyName}の はんげき！` })
        if (presentation.playerDamage > 0) steps.push({ phase: presentation.playerFainted ? 'player-fainted' : 'player-hit', text: `${presentation.playerName}に ${presentation.playerDamage} ダメージ！` })
      }
    }
    if (!steps.length) return
    setTurnCue(steps[0])
    steps.slice(1).forEach((step, index) => {
      turnTimers.current.push(window.setTimeout(() => setTurnCue(step), (index + 1) * 430))
    })
    turnTimers.current.push(window.setTimeout(() => setTurnCue(null), Math.max(900, steps.length * 430 + 280)))
  }

  const act = (moveId) => {
    if (resolvingTurn) return
    const result = useMove(game, battle, moveId)
    if (!result.ok) return
    enqueueEvolutions(result.rewards?.evolutionsByInstance, result.game)
    setGame(result.game)
    setCaptureOpen(false)
    setSwitchOpen(false)
    playTurnPresentation(result.battle?.turnPresentation)
  }
  const protect = () => {
    if (resolvingTurn) return
    const result = useProtect(game, battle)
    if (result.ok) setGame(result.game)
  }
  const specialAct = (type) => {
    if (resolvingTurn) return
    const result = type === 'giga' ? activateGiga(game, battle) : activateBurst(game, battle)
    if (result.ok) setGame(result.game)
  }
  const capture = (itemType) => {
    const result = attemptCapture(game, battle, null, itemType)
    if (!result.ok) return
    const frames = result.capturePresentation?.frames || result.battle?.capturePresentation || []
    if (Array.isArray(frames) && frames.length) {
      setCaptureSequence({
        id: `${result.battle?.battleId || result.battle?.stageId || 'capture'}:${result.battle?.captureAttempts || 0}`,
        frames,
        itemType,
        speciesId: battle.enemy.speciesId
      })
    }
    enqueueEvolutions(result.evolutionsByInstance || result.rewards?.evolutionsByInstance, result.game)
    setGame(result.game)
    setCaptureOpen(false)
  }
  const swap = (instanceId) => {
    if (resolvingTurn) return
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
    if (choice === 'support') setShardResult({ kind: 'support', text: `そだちのかけら ${result.game.growthShards || 0}こ` })
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
    setShardResult({ kind: 'redeem', text: `${speciesOf(after?.speciesId || before?.speciesId)?.name || 'なかま'}に XP +${xp}！ Lv.${before?.level || 1} → Lv.${after?.level || before?.level || 1}` })
    if (result.evolution) enqueueEvolutions({ [instanceId]: result.evolution }, result.game)
  }
  const exit = () => {
    if (duplicatePending || captureSequence || resolvingTurn) return
    const today = dayNumber()
    if (finished) {
      const result = clearFinishedBattle(game, { today })
      if (result.ok) setGame(result.game)
      onExitToMap()
      return
    }
    const message = 'バトルを やめる？ このバトルでは チケット1まいを つかうよ。'
    if (typeof window !== 'undefined' && !window.confirm(message)) return
    const result = abandonBattle(game, { today })
    if (result.ok) setGame(result.game)
    onExitToMap()
  }

  const battleMoves = availableBattleMoveIds(game, battle)
  const showNormalCommands = !finished && !forcedSwitch && !captureOpen && !switchOpen && !captureSequence
  const showTeamChoice = !finished && !captureSequence && (forcedSwitch || switchOpen)
  const showShardTools = finished && battle.status !== 'lost' && !duplicatePending && ((game.growthShards || 0) > 0 || captureSettlement?.choice === 'support')
  const playerArtClass = turnCue?.phase === 'player-lunge' ? 'v6-player-lunge' : turnCue?.phase === 'player-hit' ? 'v6-hit' : turnCue?.phase === 'player-fainted' ? 'v6-fainted' : ''
  const enemyArtClass = turnCue?.phase === 'enemy-lunge' ? 'v6-enemy-lunge' : turnCue?.phase === 'enemy-hit' ? 'v6-hit' : turnCue?.phase === 'enemy-fainted' ? 'v6-fainted' : ''

  return <main className={`screen battle-screen-v2 area-theme-${stage?.adventureArea || stage?.area || 5}`}>
    <EvolutionCelebration reveal={activeEvolutionReveal} onClose={() => setEvolutionQueue((queue) => queue.slice(1))} />
    <CapturePresentation sequence={captureSequence} onComplete={() => setCaptureSequence(null)} />

    <div className="battle-head">
      <button className="back" disabled={!!captureSequence || duplicatePending || resolvingTurn} onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button>
      <div className="battle-head-title"><small>{stage?.zoneName || 'ぼうけん'}</small><strong>{stage?.label}</strong></div>
      <span>TURN <b>{battle.turn}</b></span>
    </div>
    {turnCue && <div className="battle-turn-cue-v6" role="status" aria-live="assertive">{turnCue.text}</div>}
    {battle.challenge && <div className="challenge-banner">🔥 チャレンジモード：いまの強さで再調整</div>}
    {battle.bossTelegraphed && !finished && <div className="boss-warning"><strong>⚠️ つぎに おおわざ！</strong><span>まもるなら いま！</span></div>}
    {battle.playerSpecial && <div className={`special-active ${battle.playerSpecial.type}`}><strong>{battle.playerSpecial.type === 'giga' ? '🔷 ギガシンカ中！' : '💥 キョダイバースト中！'}</strong>{battle.playerSpecial.type === 'burst' && <span>あと {battle.playerSpecial.turnsLeft}ターン</span>}</div>}

    <section className="battle-arena-v2" aria-label="バトルフィールド">
      <div className="battle-arena-glow enemy-glow" aria-hidden="true" />
      <div className="battle-arena-glow player-glow" aria-hidden="true" />
      <div className="fighter enemy-fighter">
        <div className="fighter-info"><div className="fighter-name"><strong>{enemySpecies.name}</strong><span>Lv.{battle.enemy.level}</span></div><TypePills types={enemySpecies.types} /><HpBar value={battle.enemy.hp} max={battle.enemy.maxHp} /><small>HP {battle.enemy.hp}/{battle.enemy.maxHp}</small></div>
        <div className={`fighter-art ${enemyArtClass}`}><PlaceholderMonster speciesId={battle.enemy.speciesId} size={140} /></div>
      </div>
      <div className="battle-versus" aria-hidden="true">VS</div>
      <div className="fighter player-fighter">
        <div className={`fighter-art ${playerArtClass}`}><PlaceholderMonster speciesId={active.speciesId} size={140} /></div>
        <div className="fighter-info"><div className="fighter-name"><strong>{playerSpecies.name}</strong><span>Lv.{active.level}</span></div><TypePills types={playerSpecies.types} /><HpBar value={playerHp} max={playerMax} /><small>HP {playerHp}/{playerMax}</small></div>
      </div>
    </section>

    <section className="battle-log"><span className="battle-log-label">BATTLE LOG</span>{battle.log.slice(-2).map((line, i) => <p key={`${line}-${i}`}>{line}</p>)}</section>

    {showNormalCommands && <section className={`battle-command-deck${resolvingTurn ? ' is-resolving' : ''}`}>
      <div className="battle-command-title"><div><small>YOUR TURN</small><strong>どうする？</strong></div>{captureEligible && <span className="get-ready-badge">✨ GETできる！</span>}</div>
      <section className="move-grid">
        {battleMoves.map((moveId) => {
          const move = moveOf(moveId)
          const factor = move.effect?.type === 'damage' ? typeEffectiveness(move.type, enemySpecies.types) : 1
          const moveClasses = [move.role === 'burst' ? 'burst-move' : '', move.role === 'heal' ? 'heal-move' : '', move.effect?.type === 'damage' && factor >= 2 ? 'recommended-move' : '', move.effect?.type === 'damage' && factor === 0 ? 'ineffective-move' : ''].filter(Boolean).join(' ')
          return <button key={moveId} disabled={resolvingTurn} className={moveClasses} data-move-type={move.type} onClick={() => act(moveId)}>
            <div className="move-name-row"><strong>{move.name}</strong>{move.effect?.type === 'damage' && <em className={`effect effect-${String(factor).replace('.', '-')}`}>{effectivenessLabel(factor)}</em>}</div>
            <span>{typeLabel(move.type)}　{move.effect?.type === 'heal' ? 'HP 20%かいふく' : `威力 ${move.power}`}　命中 {move.accuracy}</span>
            <small>{move.role === 'heal' ? '1バトル1かい' : move.role === 'coverage' ? '相性をねらう技' : move.role === 'finisher' ? '大きな一撃' : move.role === 'burst' ? 'バーストせんよう！' : factor >= 2 ? 'いま こうかばつぐん！' : ''}</small>
          </button>
        })}
      </section>
      <div className="battle-action-row">
        <button className={`protect-action ${battle.bossTelegraphed ? 'recommended' : ''}`} disabled={resolvingTurn || !canUseProtect(battle)} onClick={protect}>🛡️ まもる<small>{canUseProtect(battle) ? 'ダメージを ふせぐ' : 'れんぞくでは つかえない'}</small></button>
        {game.team.some((id) => id !== battle.activeInstanceId && (battle.partyHp?.[id] || 0) > 0) && <button className="secondary" disabled={resolvingTurn} onClick={() => setSwitchOpen(true)}>🔁 こうたい<small>なかまを えらぶ</small></button>}
        {captureEligible && <button className="capture-main-cta ready" disabled={resolvingTurn} onClick={() => setCaptureOpen(true)}><span className="mini-capture-ball" aria-hidden="true"/>ボールを なげる<small>HPは はんぶんいか！</small></button>}
        {!battle.specialUsed && special.giga.activatable && <button className="giga-action" disabled={resolvingTurn} onClick={() => specialAct('giga')}>🔷 ギガシンカ<small>このバトル中 ぜんのうりょく×1.35</small></button>}
        {!battle.specialUsed && special.burst.activatable && <button className="burst-action" disabled={resolvingTurn} onClick={() => specialAct('burst')}>💥 キョダイバースト<small>3ターン・HP×2 / こうげき×1.2</small></button>}
      </div>
    </section>}

    {captureEligible && !forcedSwitch && captureOpen && !captureSequence && <CapturePanel game={game} battle={battle} captureDisabled={stage?.captureDisabled} onCapture={capture} onCancel={() => setCaptureOpen(false)} />}

    {forcedSwitch && !captureSequence && <section className="battle-result-card"><h2>つぎの なかまを えらぼう！</h2><p>まだ元気な仲間がいるから、バトルは続けられるよ。</p></section>}

    {showTeamChoice && <section className="team-switch"><h3>{forcedSwitch ? 'こうたい ひっす' : 'こうたいする なかまを えらぼう'}</h3><div>{game.team.map((id) => {
      const member = game.box[id]
      const sp = speciesOf(member.speciesId)
      const hp = battle.partyHp?.[id] || 0
      const max = currentPlayerMaxHp(game, battle, id)
      return <button key={id} disabled={id === battle.activeInstanceId || hp <= 0} onClick={() => swap(id)}><PlaceholderMonster speciesId={member.speciesId} compact /><span>{sp.name}<small>Lv.{member.level}　HP {hp}/{max}</small><TypePills types={sp.types} /></span></button>
    })}</div>{!forcedSwitch && <button className="secondary" onClick={() => setSwitchOpen(false)}>もどる</button>}</section>}

    {finished && duplicatePending && !captureSequence && <section className="battle-result-card duplicate-choice-card" aria-label="つかまえたモンスターをどうする？">
      <h2>もう いる なかまだ！</h2><p>{enemySpecies.name}を どうする？ どちらか 1つを えらぼう。</p>
      <div className="battle-action-row"><button className="primary" onClick={() => resolveDuplicate('keep')}>なかまにする<small>べつの1たいとして ボックスへ</small></button><button className="secondary" onClick={() => resolveDuplicate('support')}>おうえんにかえる<small>そだちのかけら +1</small></button></div>
    </section>}

    {postKoCaptureEligible && !duplicatePending && !captureOpen && !captureSequence && <section className="battle-result-card post-ko-capture-card">
      <h2>たおした！ 🎉</h2>
      <p>{enemySpecies.name}は もう こうげきしてこないよ。いまなら ボールを なげて GETを ねらえる！</p>
      <button className="capture-main-cta ready" onClick={() => setCaptureOpen(true)}><span className="mini-capture-ball" aria-hidden="true"/>ボールを なげる！<small>たおしたあとも GETチャンス</small></button>
      <button className="secondary" onClick={exit}>GETせず マップへ</button>
    </section>}

    {finished && !duplicatePending && !postKoCaptureEligible && !captureSequence && <section className="battle-result-card">
      <h2>{battle.status === 'won' ? 'かち！ 🎉' : battle.status === 'caught' ? 'ゲット！ ★★★★' : 'まけちゃった…'}</h2>
      {battle.status === 'won' && stage?.id === 'a1-boss' && <p>🔷 はじめてのクリアで ギガキーが ひらいた！</p>}
      {battle.status === 'won' && stage?.specialReward?.type === 'giga' && <p>🔷 {enemySpecies.name}のギガコアを解放！</p>}
      {battle.status === 'won' && stage?.specialReward?.type === 'burst' && <p>💥 {enemySpecies.name}のバーストのしるしを解放！</p>}
      {battle.status === 'caught' && !captureSettlement?.duplicate && <p>新しいなかまは、べつの1たいとして ボックスに入ったよ。チームは「モンスター」で えらべるよ。</p>}
      {battle.status === 'caught' && captureSettlement?.duplicate && captureSettlement.choice === 'keep' && <p>もう1たいの {enemySpecies.name}が、べつの1たいとして ボックスに入ったよ。</p>}
      {battle.status === 'caught' && captureSettlement?.duplicate && captureSettlement.choice === 'support' && <p>{enemySpecies.name}の おうえんで、そだちのかけらが ふえたよ！</p>}
      {battle.status === 'lost' && <p>🎫 このバトルで チケットを1まい つかったよ。相性や仲間を見直して、また学んで挑戦しよう！</p>}

      {showShardTools && <div className="growth-shard-tools"><strong>✨ そだちのかけら {game.growthShards || 0}こ</strong>{shardResult?.text && <p aria-live="polite">{shardResult.text}</p>}{(game.growthShards || 0) >= GROWTH_SHARD_RULE.shardsPerUse && <><p>{GROWTH_SHARD_RULE.shardsPerUse}こで、いまのチームの1たいに XP +{GROWTH_SHARD_RULE.xpPerUse}！</p><div className="growth-shard-targets">{game.team.map((instanceId) => { const member = game.box?.[instanceId]; if (!member) return null; return <button key={instanceId} onClick={() => redeemShard(instanceId)}><strong>{speciesOf(member.speciesId)?.name}</strong><small>Lv.{member.level}　この子に つかう</small></button> })}</div></>}</div>}

      <button className="primary" onClick={exit}>マップへ</button>
      {availableTicketCount(game, dayNumber()) < 1 && <button className="secondary" onClick={goStudy}>まなぶ！</button>}
    </section>}
  </main>
}
