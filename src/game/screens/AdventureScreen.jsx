import React, { useMemo, useState } from 'react'
import { dayNumber } from '../../study/srs.js'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { AREA_META, EX_AREA_META, STAGES, pickDailyEncounterStages, speciesOf, stageKindLabel } from '../content.js'
import { adventureZoneProgress, isAdventureZoneUnlocked, isStageUnlocked, startBattle } from '../engine.js'
import { EVOLUTION_ITEM_CATALOG } from '../explorationDomain.js'
import { availableTicketCount } from '../progression.js'
import { explorationStatusForGame, performGameExploration } from '../sharedRuntime.js'
import { areaBossEligibility } from '../worldProgression.js'
import { BattleView } from './BattleScreen.jsx'
import { TypePills } from './GameScreenPrimitives.jsx'

function evolutionItemName(itemId) {
  return EVOLUTION_ITEM_CATALOG[itemId]?.name || 'シンカアイテム'
}

function unlockReason(game, stage) {
  const cleared = new Set(game.stagesCleared || [])
  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return 'まえの エリアボスを たおそう'
  if (stage.requiresAllAreasCleared) return '4つの エリアを クリアしよう'
  if (stage.requiresEvolutionDiscoverySpeciesId && !game.evolutionDiscoveries?.[stage.requiresEvolutionDiscoverySpeciesId]) {
    const required = speciesOf(stage.requiresEvolutionDiscoverySpeciesId)
    return `まず ${required?.name || 'このすがた'}へ じぶんで シンカさせよう`
  }
  // D-031 training does not participate in the normal ①→②→③ route gate.
  const zoneProgress = stage.kind !== 'training' && stage.zoneId
    ? adventureZoneProgress(game, stage.adventureArea || stage.area, stage.zoneId)
    : null
  if (zoneProgress && !zoneProgress.unlocked) return `${zoneProgress.previousZoneName}で あと ${zoneProgress.remaining}しゅるい クリアしよう`
  if (stage.kind === 'boss') {
    const progress = areaBossEligibility(game, stage.bossProgressArea || stage.adventureArea || stage.area)
    if (!progress.eligible) {
      const missing = []
      if (progress.missingPoints > 0) missing.push(`まなびポイント あと${progress.missingPoints}`)
      if (progress.missingUniqueSkills > 0) missing.push(`ちがうスキル あと${progress.missingUniqueSkills}`)
      if (missing.length) return `ボスへ：${missing.join('・')}`
    }
  }
  if (stage.requiresOwnedSpeciesId && !game.dex?.caught?.[stage.requiresOwnedSpeciesId]) {
    const required = speciesOf(stage.requiresOwnedSpeciesId)
    return `${required?.name || '対象'}を GETしよう`
  }
  return 'まだ あいていないよ'
}

function explorationResultCopy(result) {
  if (!result) return ''
  if (result.kind === 'material') return '🧺 ふつうの そざいを みつけた！'
  if (result.kind === 'evolution_item') return `✨ ${evolutionItemName(result.itemId)}を みつけた！`
  if (result.reason === 'PITY_CHOICE_REQUIRED') return 'ほしい シンカアイテムを 1つ えらぼう。'
  if (result.reason === 'NOT_ENOUGH_EXPLORATION_POINTS') return 'たんさくポイントが たりないよ。'
  return 'いまは たんさくできないよ。'
}

export function StageMap({ game, onStart, onExplore, goStudy, goHome, dailyCompleted, today, location, onLocationChange }) {
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
  const [explorationChoice, setExplorationChoice] = useState(null)
  const [explorationResult, setExplorationResult] = useState(null)
  const teamLevels = (game.team || []).map((id) => Number(game.box?.[id]?.level) || 1).filter(Boolean)
  const teamLevel = teamLevels.length ? Math.round(teamLevels.reduce((sum, level) => sum + level, 0) / teamLevels.length) : 1
  const areaUnlocked = (areaNo) => areaNo === 1 || cleared.has(`a${areaNo - 1}-boss`)
  const exUnlocked = [1, 2, 3, 4].every((areaNo) => cleared.has(`a${areaNo}-boss`))
  const exploration = area <= 4 ? explorationStatusForGame(game, area) : null

  const selectArea = (nextArea) => {
    const meta = AREA_META.find((item) => item.area === nextArea)
    onLocationChange?.({ area: nextArea, zoneId: meta?.zones?.[0]?.id || 'ex' })
    setKind('all')
    setSearch('')
    setShowAll(false)
    setExplorationChoice(null)
    setExplorationResult(null)
  }
  const selectZone = (nextZoneId) => {
    if (areaMeta && !isAdventureZoneUnlocked(game, area, nextZoneId)) return
    onLocationChange?.({ area, zoneId: nextZoneId })
    setKind('all')
    setSearch('')
    setShowAll(false)
  }
  const runExploration = () => {
    if (!exploration?.canExplore) return
    if (exploration.pityChoiceRequired && !explorationChoice) {
      setExplorationResult({ reason: 'PITY_CHOICE_REQUIRED' })
      return
    }
    const result = onExplore?.(area, exploration.pityChoiceRequired ? explorationChoice : null)
    if (!result) return
    if (!result.ok) {
      setExplorationResult({ reason: result.reason })
      return
    }
    setExplorationChoice(null)
    setExplorationResult(result.result || null)
  }

  const filteredStages = useMemo(() => STAGES.filter((stage) => {
    if (stage.legacy || stage.hidden || stage.kind === 'training') return false
    if (area <= 4 && (stage.adventureArea || stage.area) !== area) return false
    if (area === 5 && !['event', 'ex'].includes(stage.kind)) return false
    if (area <= 4 && stage.zoneId !== zoneId) return false
    if (kind === 'wild' && stage.kind !== 'wild') return false
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

  // D-031: show only self-evolution-unlocked training, separately from normal
  // encounters so it never consumes one of the daily encounter slots or route UI.
  const trainingStages = useMemo(() => STAGES.filter((stage) => {
    if (stage.kind !== 'training' || stage.hidden) return false
    if ((stage.adventureArea || stage.area) !== area) return false
    return isStageUnlocked(game, stage)
  }).sort((a, b) => Number(speciesOf(a.enemySpeciesId)?.no || 0) - Number(speciesOf(b.enemySpeciesId)?.no || 0)), [area, game])

  const dailyMode = area <= 4 && kind === 'all' && !search.trim() && !showAll
  const visibleStages = useMemo(() => {
    if (!dailyMode) return filteredStages
    return pickDailyEncounterStages(filteredStages, {
      day: today,
      limit: 5,
      isUnlocked: (stage) => isStageUnlocked(game, stage),
      isCaught: (stage) => stage.kind === 'wild' ? !!game.dex?.caught?.[stage.enemySpeciesId] : false,
      isCleared: (stage) => cleared.has(stage.id),
      priority: (stage) => stage.kind === 'boss' ? 0 : ['giga-challenge', 'burst-challenge'].includes(stage.kind) ? 1 : stage.kind === 'wild' ? 2 : 3
    })
  }, [filteredStages, dailyMode, today, game, cleared])

  const currentAreaName = area <= 4 ? AREA_META.find((item) => item.area === area)?.name : EX_AREA_META?.name || 'スペシャルエリア'
  const resultCopy = explorationResultCopy(explorationResult)

  return <main className="screen adventure-map">
    <button className="back" onClick={goHome}>← ホーム</button>
    <div className="screen-title-row"><div><p className="eyebrow">ぼうけんマップ</p><h1>{currentAreaName}</h1>{area <= 4 && <p className="area-level-band">📍 いまのエリア　{AREA_META.find((item) => item.area === area)?.levelLabel}</p>}</div><strong>🎫 {ticketCount}</strong></div>
    <p className="kid-note">{dailyCompleted ? 'きょうの まなびクリア！ エリアと ゾーンで てきの強さが ちがうよ。おくへ すすむほど XPも おおいよ！' : 'チケットを持っていても、きょうの まなびを終えてからバトルへ。'}</p>

    {exploration && <section className="no-ticket exploration-card" aria-label="シンカアイテムたんさく">
      <div className="world-overview-heading"><div><p className="eyebrow">たんさくポイント</p><h2>🧭 {exploration.points}pt</h2></div><span>1かい {exploration.cost}pt</span></div>
      <p className="kid-note">まなびで ためたポイントで たんさく！ ふつうは そざい、たまに シンカアイテムが みつかるよ。</p>
      <section className="daily-ticket-summary" aria-label="たんさくのじょうたい"><div><span>🧭</span><small>いま</small><strong>{exploration.points}pt</strong></div><i/><div><span>✨</span><small>シンカアイテムなし</small><strong>{exploration.misses}/5</strong></div></section>
      <p>{exploration.pityChoiceRequired ? '5かい つづけて シンカアイテムなし。つぎは ほしいものを 1つ えらべるよ！' : `あと ${5 - exploration.misses}かい つづくと、つぎは ほしい シンカアイテムを えらべるよ。`}</p>
      {exploration.pityChoiceRequired && <div className="exploration-choice-panel">
        <h3>ほしい シンカアイテムを 1つ えらぼう</h3>
        <div className="stage-filters exploration-choices">{exploration.choices.map((itemId) => <button key={itemId} type="button" aria-pressed={explorationChoice === itemId} className={explorationChoice === itemId ? 'active' : ''} onClick={() => setExplorationChoice(itemId)}>{evolutionItemName(itemId)}</button>)}</div>
      </div>}
      <button className="primary" disabled={!exploration.canExplore || (exploration.pityChoiceRequired && !explorationChoice)} onClick={runExploration}>{exploration.pityChoiceRequired ? 'えらんで たんさく！' : `${exploration.cost}ptで たんさく！`}</button>
      {exploration.points < exploration.cost && <small>あと {exploration.cost - exploration.points}pt ためると たんさくできるよ。</small>}
      {resultCopy && <p className="kid-note" role="status">{resultCopy}</p>}
    </section>}

    <section className={`world-overview-card premium-world-map area-${area}`}>
      <div className="world-overview-heading"><div><p className="eyebrow">せかいを ぼうけん</p><h2>どこへ いく？</h2></div><span>📍 {area <= 4 ? `エリア${area}` : 'EX'}{activeZone ? '・' + activeZone.name : ''}</span></div>
      <div className="world-area-route">
        {AREA_META.map((meta) => { const unlocked = areaUnlocked(meta.area); return <button key={meta.area} disabled={!unlocked} className={'world-area-node ' + (area === meta.area ? 'current' : '') + (unlocked ? ' unlocked' : ' locked')} onClick={() => selectArea(meta.area)}><span>{unlocked ? meta.icon : '🔒'}</span><b>エリア{meta.area}</b><small>{area === meta.area ? 'いまここ' : unlocked ? 'いける' : 'まだ'}</small></button> })}
        <button disabled={!exUnlocked} className={'world-area-node ' + (area === 5 ? 'current' : '') + (exUnlocked ? ' unlocked' : ' locked')} onClick={() => selectArea(5)}><span>{exUnlocked ? EX_AREA_META?.icon || '🌀' : '🔒'}</span><b>EX</b><small>{area === 5 ? 'いまここ' : exUnlocked ? 'いける' : 'まだ'}</small></button>
      </div>
    </section>

    {areaMeta && <section className={`zone-map area-zone-map area-${area}`}>
      <div className="zone-map-title"><div><p className="eyebrow">エリア{area}の ぼうけん</p><h2>どこまで すすむ？</h2></div><span>チームの めやす Lv.{teamLevel}</span></div>
      <div className="zone-grid">{areaMeta.zones.map((zone, index) => {
        const danger = teamLevel < zone.minLevel
        const progress = adventureZoneProgress(game, area, zone.id)
        const locked = !progress.unlocked
        const xpCopy = index === 0 ? 'XP ふつう' : index === 1 ? 'XP ちょい多め' : 'XP たくさん・GETなし'
        return <button key={zone.id} disabled={locked} className={`${zoneId === zone.id ? 'active' : ''} ${danger ? 'danger' : 'ready'} ${locked ? 'zone-locked' : ''}`} onClick={() => selectZone(zone.id)}>
          <span className="zone-path-dot">{locked ? '🔒' : zoneId === zone.id ? '📍' : index + 1}</span><b>{zone.icon} {zone.name}</b><small>Lv.{zone.minLevel}〜{zone.maxLevel} ・ {xpCopy}</small><em>{locked ? progress.previousZoneName + ' あと' + progress.remaining + 'しゅるい' : danger ? '⚠️ かなり つよい' : zoneId === zone.id ? 'いま ここ！' : 'いけるよ'}</em>
        </button>
      })}</div>
    </section>}

    {trainingStages.length > 0 && <section className="no-ticket evolution-training-card" aria-label="シンカしゅぎょう">
      <div className="world-overview-heading"><div><p className="eyebrow">じぶんで シンカしたから かいほう！</p><h2>🥋 シンカしゅぎょう</h2></div><span>XP おおめ</span></div>
      <p className="kid-note">シンカさせた すがたと とっくん！ このバトルでは GETできないけど、いつものバトルより そだちやすいよ。</p>
      <div className="stage-list full-master-stage-list">
        {trainingStages.map((stage) => {
          const enemy = speciesOf(stage.enemySpeciesId)
          const isCleared = cleared.has(stage.id)
          const canStart = dailyCompleted && ticketCount > 0
          return <article key={stage.id} className={`stage-card formal-stage-card area-${stage.adventureArea || stage.area} zone-training`}>
            <div className="stage-number">🥋</div><span className="recommendation-tag kind-training">育成向け</span>
            <div className="encounter-art"><PlaceholderMonster speciesId={stage.enemySpeciesId} size={76} /></div>
            <div className="stage-copy">
              <small>✨ シンカしゅぎょう　{enemy?.no ? `No.${enemy.no}` : ''}</small>
              <strong>{stage.label}</strong>
              <span>{enemy?.name}　{stage.levelLabel || `Lv.${stage.enemyLevel || 1}`}　・　{Number(stage.trainingEvolutionStage) >= 3 ? 'XP ×1.45' : 'XP ×1.35'}</span>
              <TypePills types={enemy?.types} />
            </div>
            <div className="stage-actions"><span>🎫×1</span><small>🚫 GETなし</small><button disabled={!canStart} onClick={() => onStart(stage.id, false)}>{isCleared ? 'もういちど' : 'しゅぎょう！'}</button></div>
          </article>
        })}
      </div>
    </section>}

    {showAll && <section className="encounter-browse-controls" aria-label="であいを さがす">
      <div className="stage-filters">
        {[['all','ぜんぶ'],['wild','やせい'],['special','とくべつ'],['boss','ボス']].map(([id,label]) => <button key={id} className={kind === id ? 'active' : ''} onClick={() => setKind(id)}>{label}</button>)}
      </div>
      <input className="monster-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="なまえ・No.で さがす" />
    </section>}

    {dailyMode && <section className="daily-ticket-summary"><div><span>🎫</span><small>1にち</small><strong>3チケット</strong></div><i/><div><span>⭐</span><small>おすすめ</small><strong>{visibleStages.length}けん</strong></div></section>}
    {area <= 4 && <div className="encounter-heading"><div><p className="eyebrow">{dailyMode ? 'きょう みつかっている' : 'このゾーンの モンスター'}</p><h2>{activeZone?.icon} {activeZone?.name}</h2><small>{dailyMode ? '野生・とくべつ・ボスから、いま意味のある であいを5つまで えらぶよ。' : 'ずかんのように ぜんぶ さがせるよ。'}</small></div><button className="secondary compact" onClick={() => { setShowAll((value) => !value); setKind('all'); setSearch('') }}>{showAll ? 'きょうの であいへ' : 'ほかも さがす'}</button></div>}

    <div className="stage-list full-master-stage-list">
      {visibleStages.map((stage, index) => {
        const unlocked = isStageUnlocked(game, stage)
        const isCleared = cleared.has(stage.id)
        const enemy = speciesOf(stage.enemySpeciesId)
        const canStart = unlocked && dailyCompleted && ticketCount > 0
        const recommendationTag = stage.kind === 'boss'
          ? (isCleared ? '再戦' : 'おすすめ')
          : ['giga-challenge', 'burst-challenge'].includes(stage.kind)
            ? (isCleared ? '再挑戦' : '初回')
            : stage.deepRematch
              ? '育成向け'
              : stage.kind === 'wild'
                ? (game.dex?.caught?.[stage.enemySpeciesId] ? '育成向け' : '未GET')
                : index === 0 ? 'おすすめ' : '挑戦'
        return <article key={stage.id} className={`stage-card formal-stage-card area-${stage.adventureArea || stage.area} zone-${stage.zoneId || 'special'} ${!unlocked ? 'locked' : ''}`}>
          <div className="stage-number">{dailyMode ? <b>{index + 1}</b> : isCleared ? '✅' : unlocked ? stage.kind === 'boss' ? '👑' : '⚔️' : '🔒'}</div><span className={'recommendation-tag kind-' + stage.kind}>{recommendationTag}</span>
          <div className="encounter-art"><PlaceholderMonster speciesId={stage.enemySpeciesId} size={dailyMode ? 96 : 76} /></div>
          <div className="stage-copy">
            <small>{stage.zoneIcon || '🗺️'} {stage.zoneName || stageKindLabel(stage.kind)}　・　{stage.deepRematch ? 'つよいてき・育成' : stageKindLabel(stage.kind)}　{enemy?.no ? `No.${enemy.no}` : ''}</small>
            <strong>{stage.label}</strong>
            <span>{enemy?.name}　{stage.bossRank ? `BOSS ${stage.bossRank}` : stage.levelLabel || `Lv.${stage.enemyLevel || 1}`}</span>
            <TypePills types={enemy?.types} />
            {!unlocked && <em>{unlockReason(game, stage)}</em>}
          </div>
          <div className="stage-actions">
            <span>🎫×1</span>
            {stage.deepRematch && <><small>🔥 XP ×1.30</small><small>🚫 GETなし</small></>}
            {stage.id === 'a1-boss' && <small>🔷 はじめてなら ギガキー</small>}
            {stage.specialReward?.type === 'giga' && <small>🔷 ギガコア</small>}
            {stage.specialReward?.type === 'burst' && <small>💥 バーストのしるし</small>}
            <button disabled={!canStart} aria-label={isCleared ? 'もういちど' : 'バトル！'} onClick={() => onStart(stage.id, false)}>{isCleared ? 'もういちど' : 'いく！'}</button>
            {stage.bossRank && isCleared && <button className="challenge" disabled={!canStart} onClick={() => onStart(stage.id, true)}>チャレンジ</button>}
          </div>
        </article>
      })}
    </div>
    {!visibleStages.length && <section className="no-ticket"><h2>この じょうけんの ステージは ないよ</h2><p>フィルターや けんさくを かえてみよう。</p></section>}
    {!dailyCompleted && <section className="no-ticket"><h2>まず きょうの まなび！</h2><p>🎫を{ticketCount}まい持っていても、今日の基本学習を終えると新しいバトルが開くよ。</p><button className="primary" onClick={goStudy}>まなぶ！</button></section>}
    {dailyCompleted && ticketCount < 1 && <section className="no-ticket"><h2>チケットが ないよ</h2><p>ついかチャレンジで 🎫をふやそう！</p><button className="primary" onClick={goStudy}>まなぶ！</button></section>}
  </main>
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
  const explore = (areaId, choiceItemId = null) => {
    const result = performGameExploration(game, { areaId, choiceItemId })
    if (result.ok) setGame(result.game)
    return result
  }
  const setMapLocation = (nextLocation) => setGame((current) => ({ ...current, adventureLocation: nextLocation }))
  if (game.activeBattle) return <BattleView game={game} setGame={setGame} onExitToMap={() => {}} goStudy={goStudy} />
  return <StageMap game={game} onStart={start} onExplore={explore} goStudy={goStudy} goHome={goHome} dailyCompleted={dailyCompleted} today={today} location={game.adventureLocation} onLocationChange={setMapLocation} />
}
