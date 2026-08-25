import React, { useMemo, useState } from 'react'
import { dayNumber } from '../study/srs.js'
import PlaceholderMonster from './PlaceholderMonster.jsx'
import {
  AREA_META,
  CAPTURE_CONFIG,
  EVOLUTION_ITEMS,
  SPECIES,
  STAGES,
  TYPES,
  effectivenessLabel,
  moveOf,
  pickDailyEncounterStages,
  speciesOf,
  stageKindLabel,
  typeEffectiveness,
  typeLabel
} from './content.js'
import {
  MAX_CAPTURE_ATTEMPTS,
  abandonBattle,
  activateBurst,
  activateGiga,
  attemptCapture,
  availableBattleMoveIds,
  canAttemptCapture,
  canNormalEvolve,
  canUseProtect,
  captureChance,
  clearFinishedBattle,
  currentPlayerHp,
  currentPlayerMaxHp,
  describeEvolutionCondition,
  evolveInstance,
  adventureZoneProgress,
  isAdventureZoneUnlocked,
  isStageUnlocked,
  levelsUntilEvolution,
  setTeam,
  stageById,
  startBattle,
  statsFor,
  switchBattleMonster,
  useMove,
  useProtect,
  xpToNext
} from './engine.js'
import { CAPTURE_ITEM_IDS, availableTicketCount, equipHeldItem, specialProgressionStatus } from './progression.js'
import './game.css'

const CAPTURE_META = CAPTURE_CONFIG

function TypePills({ types = [] }) {
  return <div className="type-pills">{types.map((type) => <span key={type}>{typeLabel(type)}</span>)}</div>
}

function HpBar({ value, max }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return <div className="hp-wrap"><div className="hp-fill" style={{ width: `${ratio * 100}%` }} /></div>
}

function unlockReason(game, stage) {
  const cleared = new Set(game.stagesCleared || [])
  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return 'まえの エリアボスを たおそう'
  if (stage.requiresAllAreasCleared) return '4つの エリアを クリアしよう'
  const zoneProgress = stage.zoneId ? adventureZoneProgress(game, stage.adventureArea || stage.area, stage.zoneId) : null
  if (zoneProgress && !zoneProgress.unlocked) return `${zoneProgress.previousZoneName}で あと ${zoneProgress.remaining}かい クリアしよう`
  if (stage.requiresEvolutionDiscoverySpeciesId && !game.evolutionDiscoveries?.[stage.requiresEvolutionDiscoverySpeciesId]) {
    const required = speciesOf(stage.requiresEvolutionDiscoverySpeciesId)
    return `まず ${required?.name || 'このすがた'}へ じぶんで シンカさせよう`
  }
  if (stage.requiresOwnedSpeciesId && !game.dex?.caught?.[stage.requiresOwnedSpeciesId]) {
    const required = speciesOf(stage.requiresOwnedSpeciesId)
    return `${required?.name || '対象'}を GETしよう`
  }
  if (stage.minAreaClears) return `このエリアで ${stage.minAreaClears}かい クリアしよう`
  return 'まだ あいていないよ'
}

function StageMap({ game, onStart, goStudy, goHome, dailyCompleted, today, location, onLocationChange }) {
  const ticketCount = availableTicketCount(game, today)
  const cleared = new Set(game.stagesCleared || [])
  const highestArea = AREA_META.reduce((best, meta) => {
    const gate = meta.area === 1 || cleared.has(`a${meta.area - 1}-boss`)
    return gate ? Math.max(best, meta.area) : best
  }, 1)
  const requestedArea = Number(location?.area)
  const area = requestedArea >= 1 && requestedArea <= 5 ? requestedArea : highestArea
  const areaMeta = area <= 4 ? AREA_META.find((meta) => meta.area === area) : null
  const defaultZoneId = areaMeta?.zones?.[0]?.id || 'ex'
  const requestedZoneId = areaMeta?.zones?.some((zone) => zone.id === location?.zoneId) ? location.zoneId : defaultZoneId
  const zoneId = areaMeta && !isAdventureZoneUnlocked(game, area, requestedZoneId) ? defaultZoneId : requestedZoneId
  const activeZone = areaMeta?.zones?.find((zone) => zone.id === zoneId) || null
  const [kind, setKind] = useState('all')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const teamLevels = (game.team || []).map((id) => Number(game.box?.[id]?.level) || 1).filter(Boolean)
  const teamLevel = teamLevels.length ? Math.round(teamLevels.reduce((sum, level) => sum + level, 0) / teamLevels.length) : 1
  const areaUnlocked = (areaNo) => areaNo === 1 || cleared.has(`a${areaNo - 1}-boss`)
  const exUnlocked = [1, 2, 3, 4].every((areaNo) => cleared.has(`a${areaNo}-boss`))

  const selectArea = (nextArea) => {
    const meta = AREA_META.find((item) => item.area === nextArea)
    onLocationChange?.({ area: nextArea, zoneId: meta?.zones?.[0]?.id || 'ex' })
    setKind('all')
    setSearch('')
    setShowAll(false)
  }
  const selectZone = (nextZoneId) => {
    if (areaMeta && !isAdventureZoneUnlocked(game, area, nextZoneId)) return
    onLocationChange?.({ area, zoneId: nextZoneId })
    setKind('all')
    setSearch('')
    setShowAll(false)
  }

  const filteredStages = useMemo(() => STAGES.filter((stage) => {
    if (stage.legacy || stage.hidden) return false
    if (area <= 4 && (stage.adventureArea || stage.area) !== area) return false
    if (area === 5 && !['event', 'ex'].includes(stage.kind)) return false
    if (area <= 4 && stage.zoneId !== zoneId) return false
    if (kind === 'wild' && stage.kind !== 'wild') return false
    if (kind === 'evo' && stage.kind !== 'evolution-trial') return false
    if (kind === 'special' && !['giga-challenge', 'burst-challenge'].includes(stage.kind)) return false
    if (kind === 'boss' && !['boss', 'ex'].includes(stage.kind)) return false
    if (search.trim()) {
      const enemy = speciesOf(stage.enemySpeciesId)
      const needle = search.trim().toLowerCase()
      const hay = `${stage.label} ${enemy?.name || ''} ${enemy?.no || ''}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  }), [area, zoneId, kind, search])

  const dailyMode = area <= 4 && kind === 'all' && !search.trim() && !showAll
  const visibleStages = useMemo(() => {
    if (!dailyMode) return filteredStages
    return pickDailyEncounterStages(filteredStages, {
      day: today,
      limit: 5,
      isUnlocked: (stage) => isStageUnlocked(game, stage),
      isCaught: (stage) => stage.kind === 'wild' ? !!game.dex?.caught?.[stage.enemySpeciesId] : false,
      isCleared: (stage) => cleared.has(stage.id),
      priority: (stage) => stage.kind === 'boss' ? 0 : stage.kind === 'evolution-trial' ? 1 : ['giga-challenge', 'burst-challenge'].includes(stage.kind) ? 2 : stage.kind === 'wild' ? 3 : 4
    })
  }, [filteredStages, dailyMode, today, game, cleared])

  return (
    <main className="screen adventure-map">
      <button className="back" onClick={goHome}>← ホーム</button>
      <div className="screen-title-row"><div><p className="eyebrow">ぼうけんマップ</p><h1>{area <= 4 ? AREA_META.find((item) => item.area === area)?.name : 'スペシャルエリア'}</h1>{area <= 4 && <p className="area-level-band">📍 いまのエリア　{AREA_META.find((item) => item.area === area)?.levelLabel}</p>}</div><strong>🎫 {ticketCount}</strong></div>
      <p className="kid-note">{dailyCompleted ? 'きょうの まなびクリア！ エリアと ゾーンで てきの強さが ちがうよ。そだてた強さを ためしてみよう！' : 'チケットを持っていても、きょうの まなびを終えてからバトルへ。'}</p>

      <section className="world-overview-card">
        <div className="world-overview-heading"><div><p className="eyebrow">せかいを ぼうけん</p><h2>シンカの ちからを ひらこう！</h2></div><span>📍 エリア{area}{activeZone ? '・' + activeZone.name : ''}</span></div>
        <div className="world-area-route">{AREA_META.map((meta) => { const unlocked = areaUnlocked(meta.area); return <button key={meta.area} disabled={!unlocked} className={'world-area-node ' + (area === meta.area ? 'current' : '') + (unlocked ? ' unlocked' : ' locked')} onClick={() => selectArea(meta.area)}><span>{unlocked ? meta.icon : '🔒'}</span><b>エリア{meta.area}</b><small>{area === meta.area ? 'いまここ' : unlocked ? 'いける' : 'まだ'}</small></button> })}</div>
      </section>

      <div className="area-tabs world-area-tabs">
        {AREA_META.map((meta) => { const unlocked = areaUnlocked(meta.area); return <button key={meta.area} disabled={!unlocked} className={area === meta.area ? 'active' : ''} onClick={() => selectArea(meta.area)}>{unlocked ? meta.icon : '🔒'} エリア{meta.area}</button> })}
        <button disabled={!exUnlocked} className={area === 5 ? 'active' : ''} onClick={() => selectArea(5)}>{exUnlocked ? '🌀' : '🔒'} EX</button>
      </div>

      {areaMeta && <section className={`zone-map area-zone-map area-${area}`}>
        <div className="zone-map-title"><div><p className="eyebrow">エリア{area}の ぼうけん</p><h2>どこへ いく？</h2></div><span>チームの めやす Lv.{teamLevel}</span></div>
        <div className="zone-grid">{areaMeta.zones.map((zone, index) => {
          const danger = teamLevel < zone.minLevel
          const progress = adventureZoneProgress(game, area, zone.id)
          const locked = !progress.unlocked
          return <button key={zone.id} disabled={locked} className={`${zoneId === zone.id ? 'active' : ''} ${danger ? 'danger' : 'ready'} ${locked ? 'zone-locked' : ''}`} onClick={() => selectZone(zone.id)}>
            <span className="zone-path-dot">{locked ? '🔒' : zoneId === zone.id ? '📍' : index + 1}</span><b>{zone.icon} {zone.name}</b><small>Lv.{zone.minLevel}〜{zone.maxLevel}</small><em>{locked ? progress.previousZoneName + ' あと' + progress.remaining + 'かい' : danger ? '⚠️ かなり つよい' : zoneId === zone.id ? 'いま ここ！' : 'いけるよ'}</em>
          </button>
        })}</div>
      </section>}

      <div className="stage-filters">
        {[['all','ぜんぶ'],['wild','たんさく'],['evo','シンカ'],['special','とくべつ'],['boss','ボス']].map(([id,label]) => <button key={id} className={kind === id ? 'active' : ''} onClick={() => setKind(id)}>{label}</button>)}
      </div>
      <input className="monster-search" value={search} onChange={(event) => { setSearch(event.target.value); if (event.target.value) setShowAll(true) }} placeholder="なまえ・No.で さがす" />

      {dailyMode && <section className="daily-ticket-summary"><div><span>🎫</span><small>1にち</small><strong>3チケット</strong></div><i/><div><span>⭐</span><small>おすすめ</small><strong>{visibleStages.length}けん</strong></div></section>}
      {area <= 4 && <div className="encounter-heading"><div><p className="eyebrow">{dailyMode ? 'きょう みつかっている' : 'このゾーンの モンスター'}</p><h2>{activeZone?.icon} {activeZone?.name}</h2><small>{dailyMode ? '野生・シンカ・ボスから、いま意味のある であいを5つまで えらぶよ。' : 'ずかんのように ぜんぶ さがせるよ。'}</small></div><button className="secondary compact" onClick={() => { setShowAll((value) => !value); setKind('all'); setSearch('') }}>{showAll ? 'きょうの であいへ' : 'ほかも さがす'}</button></div>}

      <div className="stage-list full-master-stage-list">
        {visibleStages.map((stage, index) => {
          const unlocked = isStageUnlocked(game, stage)
          const isCleared = cleared.has(stage.id)
          const enemy = speciesOf(stage.enemySpeciesId)
          const canStart = unlocked && dailyCompleted && ticketCount > 0
          const recommendationTag = stage.kind === 'boss' ? (isCleared ? '再戦' : 'おすすめ') : stage.kind === 'evolution-trial' ? (isCleared ? '取得済' : '未GET') : ['giga-challenge', 'burst-challenge'].includes(stage.kind) ? (isCleared ? '再挑戦' : '初回') : stage.kind === 'wild' ? (game.dex?.caught?.[stage.enemySpeciesId] ? '育成向け' : '未GET') : index === 0 ? 'おすすめ' : '挑戦'
          return (
            <article key={stage.id} className={`stage-card formal-stage-card area-${stage.adventureArea || stage.area} zone-${stage.zoneId || 'special'} ${!unlocked ? 'locked' : ''}`}>
              <div className="stage-number">{dailyMode ? <b>{index + 1}</b> : isCleared ? '✅' : unlocked ? stage.kind === 'boss' ? '👑' : '⚔️' : '🔒'}</div><span className={'recommendation-tag kind-' + stage.kind}>{recommendationTag}</span>
              <PlaceholderMonster speciesId={stage.enemySpeciesId} compact />
              <div className="stage-copy">
                <small>{stage.zoneIcon || '🗺️'} {stage.zoneName || stageKindLabel(stage.kind)}　・　{stageKindLabel(stage.kind)}　{enemy?.no ? `No.${enemy.no}` : ''}</small>
                <strong>{stage.label}</strong>
                <span>{enemy?.name}　{stage.bossRank ? `BOSS ${stage.bossRank}` : stage.levelLabel || `Lv.${stage.enemyLevel || 1}`}</span>
                <TypePills types={enemy?.types} />
                {!unlocked && <em>{unlockReason(game, stage)}</em>}
              </div>
              <div className="stage-actions">
                <span>🎫×1</span>
                {stage.evolutionReward && <small>🎁 シンカアイテム</small>}
                {stage.id === 'a1-boss' && <small>🔷 はじめてなら ギガキー</small>}
                {stage.specialReward?.type === 'giga' && <small>🔷 ギガコア</small>}
                {stage.specialReward?.type === 'burst' && <small>💥 バーストのしるし</small>}
                <button disabled={!canStart} aria-label={isCleared ? 'もういちど' : 'バトル！'} onClick={() => onStart(stage.id, false)}>{isCleared ? 'もういちど' : 'いく！'}</button>
                {stage.bossRank && isCleared && <button className="challenge" disabled={!canStart} onClick={() => onStart(stage.id, true)}>チャレンジ</button>}
              </div>
            </article>
          )
        })}
      </div>
      {!visibleStages.length && <section className="no-ticket"><h2>この じょうけんの ステージは ないよ</h2><p>フィルターや けんさくを かえてみよう。</p></section>}
      {!dailyCompleted && <section className="no-ticket"><h2>まず きょうの まなび！</h2><p>🎫を{ticketCount}まい持っていても、今日の基本学習を終えると新しいバトルが開くよ。</p><button className="primary" onClick={goStudy}>まなぶ！</button></section>}
      {dailyCompleted && ticketCount < 1 && <section className="no-ticket"><h2>チケットが ないよ</h2><p>ついかチャレンジで 🎫をふやそう！</p><button className="primary" onClick={goStudy}>まなぶ！</button></section>}
    </main>
  )
}

function BattleView({ game, setGame, onExitToMap, goStudy }) {
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
  const captureHpReady = battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5
  const captureAttemptsLeft = Math.max(0, MAX_CAPTURE_ATTEMPTS - (battle.captureAttempts || 0))
  const [battleEvolutionReveal, setBattleEvolutionReveal] = useState(null)
  const readyEvolutionMonster = finished && battle.status !== 'lost'
    ? (battle.teamAtStart || []).map((id) => game.box?.[id]).find((monster) => monster && canNormalEvolve(monster, game))
    : null

  const act = (moveId) => {
    const result = useMove(game, battle, moveId)
    if (result.ok) setGame(result.game)
  }
  const protect = () => {
    const result = useProtect(game, battle)
    if (result.ok) setGame(result.game)
  }
  const specialAct = (type) => {
    const result = type === 'giga' ? activateGiga(game, battle) : activateBurst(game, battle)
    if (result.ok) setGame(result.game)
  }
  const capture = (itemType) => {
    const result = attemptCapture(game, battle, null, itemType)
    if (result.ok) setGame(result.game)
  }
  const swap = (instanceId) => {
    const result = switchBattleMonster(game, battle, instanceId)
    if (result.ok) setGame(result.game)
  }
  const exit = () => {
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

  const evolveReadyMonster = () => {
    if (!readyEvolutionMonster) return
    const fromId = readyEvolutionMonster.speciesId
    const level = readyEvolutionMonster.level
    const result = evolveInstance(game, readyEvolutionMonster.instanceId)
    if (!result.ok) return
    setGame(result.game)
    setBattleEvolutionReveal({ fromId, toId: result.to, level })
  }

  const battleMoves = availableBattleMoveIds(game, battle)
  return (
    <main className={`screen battle-screen-v2 area-theme-${stage?.adventureArea || stage?.area || 5}`}>
      <EvolutionCelebration reveal={battleEvolutionReveal} onClose={() => setBattleEvolutionReveal(null)} />
      <div className="battle-head"><button className="back" onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button><strong>{stage?.zoneName ? `${stage.zoneName}｜${stage.label}` : stage?.label}</strong><span>TURN {battle.turn}</span></div>
      {battle.challenge && <div className="challenge-banner">🔥 チャレンジモード：いまの強さで再調整</div>}
      {battle.bossTelegraphed && !finished && <div className="boss-warning"><strong>⚠️ つぎに おおわざ！</strong><span>まもるなら いま！</span></div>}
      {battle.playerSpecial && <div className={`special-active ${battle.playerSpecial.type}`}><strong>{battle.playerSpecial.type === 'giga' ? '🔷 ギガシンカ中！' : '💥 キョダイバースト中！'}</strong>{battle.playerSpecial.type === 'burst' && <span>あと {battle.playerSpecial.turnsLeft}ターン</span>}</div>}

      <section className="battle-arena-v2">
        <div className="fighter enemy-fighter">
          <div className="fighter-info"><strong>No.{enemySpecies.no} {enemySpecies.name}</strong><span>Lv.{battle.enemy.level}</span><TypePills types={enemySpecies.types} /><HpBar value={battle.enemy.hp} max={battle.enemy.maxHp} /><small>HP {battle.enemy.hp}/{battle.enemy.maxHp}</small></div>
          <PlaceholderMonster speciesId={battle.enemy.speciesId} />
        </div>
        <div className="fighter player-fighter">
          <PlaceholderMonster speciesId={active.speciesId} />
          <div className="fighter-info"><strong>No.{playerSpecies.no} {playerSpecies.name}</strong><span>Lv.{active.level}</span><TypePills types={playerSpecies.types} /><HpBar value={playerHp} max={playerMax} /><small>HP {playerHp}/{playerMax}</small></div>
        </div>
      </section>

      <section className="battle-log">{battle.log.slice(-5).map((line, i) => <p key={`${line}-${i}`}>{line}</p>)}</section>

      {!finished && !forcedSwitch && <>
        <section className="move-grid">
          {battleMoves.map((moveId) => {
            const move = moveOf(moveId)
            const factor = move.effect?.type === 'damage' ? typeEffectiveness(move.type, enemySpecies.types) : 1
            return <button key={moveId} className={move.role === 'burst' ? 'burst-move' : move.role === 'heal' ? 'heal-move' : ''} onClick={() => act(moveId)}>
              <strong>{move.name}</strong>
              <span>{typeLabel(move.type)}　{move.effect?.type === 'heal' ? 'HP 20%かいふく' : `威力 ${move.power}`}　命中 {move.accuracy}</span>
              {move.effect?.type === 'damage' && <em className={`effect effect-${String(factor).replace('.', '-')}`}>{effectivenessLabel(factor)}</em>}
              <small>{move.role === 'heal' ? '1バトル1かい' : move.role === 'coverage' ? '相性をねらう技' : move.role === 'finisher' ? '大きな一撃' : move.role === 'burst' ? 'バーストせんよう！' : ''}</small>
            </button>
          })}
        </section>
        <div className="battle-action-row">
          <button className={`protect-action ${battle.bossTelegraphed ? 'recommended' : ''}`} disabled={!canUseProtect(battle)} onClick={protect}>🛡️ まもる<small>{canUseProtect(battle) ? 'ダメージを ふせぐ' : 'れんぞくでは つかえない'}</small></button>
          {!battle.specialUsed && special.giga.activatable && <button className="giga-action" onClick={() => specialAct('giga')}>🔷 ギガシンカ<small>このバトル中 ぜんのうりょく×1.35</small></button>}
          {!battle.specialUsed && special.burst.activatable && <button className="burst-action" onClick={() => specialAct('burst')}>💥 キョダイバースト<small>3ターン・HP×2 / こうげき×1.2</small></button>}
        </div>

        {!stage?.captureDisabled ? <section className={`battle-tools capture-panel ${captureHpReady ? 'capture-open' : 'capture-locked'}`}>
          <div className={'capture-main-cta ' + (captureHpReady && captureAttemptsLeft > 0 ? 'ready' : 'locked')}><span>⭕</span><strong>わを なげる</strong><small>{captureHpReady ? 'いま なげられる！' : 'HPを はんぶんいかに！'}</small></div>
          <div className="capture-stars" aria-label="捕獲4段階">{Array.from({ length: 4 }, (_, i) => <span key={i}>{i < battle.captureStars ? '★' : '☆'}</span>)}</div>
          <h2>{captureAttemptsLeft <= 0 ? '「わ」は 3かい なげたよ' : captureHpReady ? '⭐ 「わ」を なげる！' : '🔒 「わ」を なげるには HPを はんぶんいかに！'}</h2>
          <p>{captureAttemptsLeft <= 0 ? 'このバトルでは もう「わ」を なげられないよ。たおすか、バトルを つづけよう。' : captureHpReady ? `いま なげられるよ！ のこり ${captureAttemptsLeft}かい。つかう「わ」を えらぼう。` : `あいての HPを ${Math.floor(battle.enemy.maxHp / 2)} いかまで へらそう。いまは ${battle.enemy.hp}。`}</p>
          <div className="capture-item-grid">{CAPTURE_ITEM_IDS.map((id) => {
            const meta = CAPTURE_META[id]
            const ready = canAttemptCapture(game, battle, id)
            const chance = captureChance(battle, id)
            const owned = game.captureItems?.[id] || 0
            return <button key={id} className={ready ? 'capture-ready' : ''} disabled={!ready} onClick={() => capture(id)}><strong>{meta.icon} {meta.label}を なげる</strong><small>もってる：{owned}こ　{captureHpReady && captureAttemptsLeft > 0 && owned > 0 ? `GET ${Math.round(chance * 100)}%` : 'いまは なげられない'}</small></button>
          })}</div>
        </section> : <section className="battle-tools"><strong>👑 このバトルでは GETできないよ</strong><p>「わ」は なげられない バトルだよ。たおして、クリアほうしゅうを ねらおう！</p></section>}
        <section className="battle-point-guide"><h3>🛡️ バトルのポイント</h3><div><p><span>❤️</span>HPが <b>50%いか</b> だと つかまえやすい</p><p><span>⭕</span>わ は 1バトル <b>3かい</b>まで</p><p><span>🐾</span>チームは <b>3たい</b>まで</p><p><span>⭐</span>しょうりで <b>けいけんちGET</b></p></div></section>
      </>}

      {forcedSwitch && <section className="battle-result-card"><h2>つぎの なかまを えらぼう！</h2><p>まだ元気な仲間がいるから、バトルは続けられるよ。</p></section>}

      {!finished && <section className="team-switch"><h3>{forcedSwitch ? 'こうたい ひっす' : 'こうたい（相手も1回こうげき）'}</h3><div>{game.team.map((id) => {
        const member = game.box[id]
        const sp = speciesOf(member.speciesId)
        const hp = battle.partyHp?.[id] || 0
        const max = currentPlayerMaxHp(game, battle, id)
        return <button key={id} disabled={id === battle.activeInstanceId || hp <= 0} onClick={() => swap(id)}><PlaceholderMonster speciesId={member.speciesId} compact /><span>{sp.name}<small>Lv.{member.level}　HP {hp}/{max}</small><TypePills types={sp.types} /></span></button>
      })}</div></section>}

      {finished && <section className="battle-result-card">
        <h2>{battle.status === 'won' ? 'かち！ 🎉' : battle.status === 'caught' ? 'ゲット！ ★★★★' : 'まけちゃった…'}</h2>
        {battle.status === 'won' && stage?.evolutionReward && <p>🎁 初回クリアなら シンカアイテムをGET！</p>}
        {battle.status === 'won' && stage?.id === 'a1-boss' && <p>🔷 はじめてのクリアで ギガキーが ひらいた！</p>}
        {battle.status === 'won' && stage?.specialReward?.type === 'giga' && <p>🔷 {enemySpecies.name}のギガコアを解放！</p>}
        {battle.status === 'won' && stage?.specialReward?.type === 'burst' && <p>💥 {enemySpecies.name}のバーストのしるしを解放！</p>}
        {battle.status === 'caught' && <p>「わ」が 4つ ひかって GET！ 新しい仲間はボックスに入ったよ。手持ちが2体以下なら自動でチーム入り！</p>}
        {battle.status === 'lost' && <p>{battle.ticketRefunded ? '🎫は1まい返ってきたよ。仲間を育てて再挑戦しよう！' : '🎫は期限をすぎていたので戻らなかったよ。もう一度学んで挑戦しよう！'}</p>}
        {readyEvolutionMonster && <div className="battle-evolution-ready"><strong>✨ {speciesOf(readyEvolutionMonster.speciesId)?.name}が シンカできるよ！</strong><span>バトルで そだった いまが チャンス！</span><button className="evolve-now" onClick={evolveReadyMonster}>✨ いま シンカする！</button></div>}
        <button className="primary" onClick={exit}>マップへ</button>
        {availableTicketCount(game, dayNumber()) < 1 && <button className="secondary" onClick={goStudy}>まなぶ！</button>}
      </section>}
    </main>
  )
}

export function AdventureFlow({ game, setGame, goHome, goStudy, dailyCompleted, dailyDay, today }) {
  const start = (stageId, challenge = false) => {
    const liveToday = dayNumber()
    const liveDailyCompleted = dailyCompleted && dailyDay === liveToday
    const result = startBattle(game, stageId, { dailyCompleted: liveDailyCompleted, dailyDay: liveToday, today: liveToday, challenge })
    if (!result.ok) {
      if (['NO_TICKET', 'DAILY_NOT_COMPLETED'].includes(result.reason)) goStudy()
      return
    }
    setGame(result.game)
  }
  const setMapLocation = (nextLocation) => setGame((current) => ({ ...current, adventureLocation: nextLocation }))
  if (game.activeBattle) return <BattleView game={game} setGame={setGame} onExitToMap={() => {}} goStudy={goStudy} />
  return <StageMap game={game} onStart={start} goStudy={goStudy} goHome={goHome} dailyCompleted={dailyCompleted} today={today} location={game.adventureLocation} onLocationChange={setMapLocation} />
}

function MonsterRow({ monster, game, setGame, selected, setSelected }) {
  const species = speciesOf(monster.speciesId)
  const inTeam = game.team.includes(monster.instanceId)
  const evoLeft = levelsUntilEvolution(monster)
  const addToTeam = () => {
    if (inTeam || game.team.length >= 3) return
    const result = setTeam(game, [...game.team, monster.instanceId])
    if (result.ok) setGame(result.game)
  }
  const removeFromTeam = () => {
    if (!inTeam || game.team.length <= 1) return
    const result = setTeam(game, game.team.filter((id) => id !== monster.instanceId))
    if (result.ok) setGame(result.game)
  }
  return <article className={`monster-row ${selected ? 'selected' : ''}`} onClick={() => setSelected(monster.instanceId)}>
    <PlaceholderMonster speciesId={monster.speciesId} compact />
    <div className="monster-row-main"><strong>No.{species.no} {species.name}</strong><span>Lv.{monster.level}　XP {monster.xp}/{xpToNext(monster.level)}</span><TypePills types={species.types} /><small>{!species.evolution ? '通常進化：最終形' : evoLeft === 0 ? '✨ いま進化できる！' : evoLeft == null ? describeEvolutionCondition(monster) : `進化まで あと ${evoLeft} レベル`}</small></div>
    <div className="team-actions">{inTeam ? <button disabled={game.team.length <= 1} onClick={(e) => { e.stopPropagation(); removeFromTeam() }}>手持ちから外す</button> : <button disabled={game.team.length >= 3} onClick={(e) => { e.stopPropagation(); addToTeam() }}>手持ちに入れる</button>}</div>
  </article>
}


function EvolutionCelebration({ reveal, onClose }) {
  if (!reveal) return null
  const from = speciesOf(reveal.fromId)
  const to = speciesOf(reveal.toId)
  const before = statsFor(reveal.fromId, reveal.level)
  const after = statsFor(reveal.toId, reveal.level)
  const gain = (key) => Math.max(0, (after?.[key] || 0) - (before?.[key] || 0))
  return <div className="evolution-overlay" role="dialog" aria-modal="true" aria-label="シンカ！">
    <div className="evolution-stars">✦　✧　✦　✧　✦</div>
    <section className="evolution-celebration-card">
      <p className="evolution-kicker">✨ シンカ！ ✨</p>
      <div className="evolution-pair"><div className="evolution-old"><PlaceholderMonster speciesId={reveal.fromId} /><strong>{from?.name}</strong></div><span className="evolution-arrow">→</span><div className="evolution-new"><div className="evolution-glow"/><PlaceholderMonster speciesId={reveal.toId} /><strong>{to?.name}</strong></div></div>
      <h2>{from?.name} は<br/><b>{to?.name}</b> に シンカした！</h2>
      <p>じぶんで そだてたから たどりついた すがただよ！</p>
      <div className="evolution-stat-gains"><span>HP <b>+{gain('hp')}</b></span><span>こうげき <b>+{gain('attack')}</b></span><span>ぼうぎょ <b>+{gain('defense')}</b></span><span>すばやさ <b>+{gain('speed')}</b></span></div>
      <div className="evolution-unlock-note">🗺️ この すがたが ずかんに とうろく！<br/>こうレベルの おくちで であえる ばしょも あるよ。</div>
      <button className="primary huge" onClick={onClose}>つづける！</button>
    </section>
  </div>
}

function DetailPanel({ game, setGame, instanceId, onEvolution }) {
  const monster = game.box[instanceId]
  if (!monster) return null
  const species = speciesOf(monster.speciesId)
  const stats = statsFor(monster.speciesId, monster.level)
  const special = specialProgressionStatus(monster, game)
  const evolve = () => {
    const fromId = monster.speciesId
    const level = monster.level
    const result = evolveInstance(game, instanceId)
    if (result.ok) {
      setGame(result.game)
      onEvolution?.({ fromId, toId: result.to, level })
    }
  }
  const equipRequiredItem = () => {
    const itemId = species.evolution?.heldItemId
    if (!itemId) return
    const result = equipHeldItem(game, instanceId, itemId)
    if (result.ok) setGame(result.game)
  }
  const nextSpecies = species.evolution ? speciesOf(species.evolution.to) : null
  return <section className="monster-detail-v2">
    <div className="monster-detail-hero"><PlaceholderMonster speciesId={monster.speciesId} /><div><p className="eyebrow">No.{species.no} / {species.family}</p><h2>{species.name}</h2><p>Lv.{monster.level} / 進化段階 {species.stage}/{species.maxStage}</p><TypePills types={species.types} /></div></div>
    <p className="monster-description">{species.description}</p>
    <div className="stat-grid"><span>HP <b>{stats.hp}</b></span><span>こうげき <b>{stats.attack}</b></span><span>ぼうぎょ <b>{stats.defense}</b></span><span>すばやさ <b>{stats.speed}</b></span></div>
    <section className="formal-moves"><h3>わざ</h3>{species.moves.map((moveId) => { const move = moveOf(moveId); return <div key={moveId}><strong>{move.name}</strong><span>{typeLabel(move.type)}</span><small>{move.effect?.type === 'heal' ? 'HP20%かいふく・1バトル1回' : `威力${move.power} / 命中${move.accuracy} / ${move.role}`}</small></div> })}</section>
    <div className="evo-progress"><strong>通常進化</strong>{species.evolution ? <><p>次：No.{nextSpecies?.no} {nextSpecies?.name}</p><p>{canNormalEvolve(monster, game) ? '✨ 条件達成！' : describeEvolutionCondition(monster)}</p>{species.evolution.method === 'stone' && <small>所持：{EVOLUTION_ITEMS.stones[species.evolution.itemId]?.name} ×{game.evolutionItems?.stones?.[species.evolution.itemId] || 0}</small>}{species.evolution.method === 'held_item_levelup' && <><small>所持：{EVOLUTION_ITEMS.heldItems[species.evolution.heldItemId]?.name} ×{game.evolutionItems?.heldItems?.[species.evolution.heldItemId] || 0} ／ 装備：{monster.heldItemId === species.evolution.heldItemId ? '済み' : 'なし'}</small>{monster.heldItemId !== species.evolution.heldItemId && (game.evolutionItems?.heldItems?.[species.evolution.heldItemId] || 0) > 0 && <button className="secondary" onClick={equipRequiredItem}>必要なもちものを持たせる</button>}</>}<button className="primary" disabled={!canNormalEvolve(monster, game)} onClick={evolve}>✨ いま シンカする！</button></> : <p>最終進化まで到達！</p>}</div>
    <section className="evolution-method-guide"><h3>⭐ シンカの ほうほう</h3><div><span>⬆️<b>レベルで シンカ</b></span><span>💎<b>いしで シンカ</b></span><span>🎒<b>もちもの + つぎのレベル</b></span></div></section>
    <section className="evolution-explain-card"><h3>📖 シンカの せつめい</h3><p>🚫 つかまえたあと すぐの シンカは できない</p><p>🌱 そだてて <b>じぶんで シンカ</b>するのが だいじ</p><p>✨ じぶんで シンカすると <b>第2けいたいの ばしょ</b>が ひらく</p><p>⚔️ シンカできると バトルけっかから そのまま すすめる</p></section>
    <div className="special-cards">
      <article className={special.giga.eligibleSpecies ? 'eligible' : ''}><strong>🔷 ギガシンカ</strong><p>{!special.giga.isFinal ? 'まずは最終進化をめざそう！' : !special.giga.eligibleSpecies ? 'このモンスターは対象外' : special.giga.activatable ? '✅ バトルで発動できる！' : !special.giga.hasKey ? 'まずエリア1ボスで ギガキーを ひらこう' : '専用ギガしれんをクリアして ギガコアをGETしよう'}</p><small>対象12体。全能力×1.35。{special.giga.registered ? '図鑑にギガのすがた登録済み。' : ''}</small></article>
      <article className={special.burst.eligibleSpecies ? 'eligible' : ''}><strong>💥 キョダイバースト</strong><p>{!special.burst.isFinal ? 'まずは最終進化をめざそう！' : !special.burst.eligibleSpecies ? 'このモンスターは対象外' : special.burst.activatable ? '✅ バトルで発動できる！' : '専用バーストしれんをクリアして しるしをGETしよう'}</p><small>対象8体。3ターン、HP×2・こうげき×1.2・主力技が専用技に変化。{special.burst.registered ? '図鑑にバーストのすがた登録済み。' : ''}</small></article>
    </div>
  </section>
}

function DexGrid({ game }) {
  const [area, setArea] = useState(0)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const speciesList = useMemo(() => Object.values(SPECIES).sort((a, b) => Number(a.no) - Number(b.no)).filter((species) => {
    if (area && species.area !== area) return false
    if (type !== 'all' && !species.types.includes(type)) return false
    if (search.trim()) {
      const needle = search.trim().toLowerCase()
      if (!`${species.no} ${species.name} ${species.family}`.toLowerCase().includes(needle)) return false
    }
    return true
  }), [area, type, search])
  const seen = game.dex?.seen || {}
  const caught = game.dex?.caught || {}
  return <>
    <div className="dex-filters">
      <select value={area} onChange={(event) => setArea(Number(event.target.value))}><option value={0}>ぜんエリア</option>{AREA_META.map((meta) => <option key={meta.area} value={meta.area}>エリア{meta.area} {meta.name}</option>)}</select>
      <select value={type} onChange={(event) => setType(event.target.value)}><option value="all">ぜんタイプ</option>{TYPES.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.label}</option>)}</select>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="なまえ・No.で さがす" />
    </div>
    <div className="dex-grid">{speciesList.map((species) => <div key={species.id} className={seen[species.id] ? 'seen' : 'unknown'}><small>No.{species.no}</small>{seen[species.id] ? <PlaceholderMonster speciesId={species.id} compact /> : <div className="silhouette">?</div>}<strong>{seen[species.id] ? species.name : '？？？'}</strong><span>{caught[species.id] ? '✅ GET' : seen[species.id] ? '👀 発見' : '未発見'}{game.specialDex?.giga?.[species.id] ? '　🔷ギガ登録' : ''}{game.specialDex?.burst?.[species.id] ? '　💥バースト登録' : ''}</span></div>)}</div>
  </>
}

export function MonsterScreen({ game, setGame, goHome }) {
  const [tab, setTab] = useState('team')
  const [selected, setSelected] = useState(game.activeMonsterId)
  const [evolutionReveal, setEvolutionReveal] = useState(null)
  const box = useMemo(() => Object.values(game.box || {}).sort((a, b) => b.level - a.level), [game.box])
  const team = game.team.map((id) => game.box[id]).filter(Boolean)
  const caughtCount = Object.keys(game.dex?.caught || {}).length
  const seenCount = Object.keys(game.dex?.seen || {}).length

  return <main className="screen monster-screen-v2">
    {evolutionReveal && <EvolutionCelebration reveal={evolutionReveal} onClose={() => setEvolutionReveal(null)} />}
    <button className="back" onClick={goHome}>← ホーム</button>
    <div className="screen-title-row"><div><p className="eyebrow">モンスター</p><h1>そだてる・シンカ</h1></div><span>GET {caughtCount}/238　発見 {seenCount}/238</span></div>
    <div className="monster-tabs"><button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>手持ち {team.length}/3</button><button className={tab === 'box' ? 'active' : ''} onClick={() => setTab('box')}>ボックス {box.length}</button><button className={tab === 'dex' ? 'active' : ''} onClick={() => setTab('dex')}>図鑑 238</button></div>
    {tab === 'team' && <><div className="monster-list">{team.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}
    {tab === 'box' && <><p className="kid-note">手持ちは3体まで。タイプのちがう仲間を組み合わせよう！</p><div className="monster-list">{box.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}
    {tab === 'dex' && <><p className="kid-note">No.001〜238の正式マスターで動いているよ。登録済みの正式画像はそのまま表示し、まだ画像ファイルがない個体だけ専用の準備中表示になるよ。ギガ/バーストを初めて使うと同じ図鑑枠に登録マークがつくよ。</p><DexGrid game={game} /></>}
  </main>
}
