import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, text) => fs.writeFileSync(path, text)

function mustReplace(path, from, to, label = from.slice(0, 80)) {
  const source = read(path)
  if (!source.includes(from)) throw new Error(`Missing replacement target in ${path}: ${label}`)
  write(path, source.replace(from, to))
}

function mustReplaceRegex(path, regex, to, label) {
  const source = read(path)
  if (!regex.test(source)) throw new Error(`Missing regex target in ${path}: ${label}`)
  write(path, source.replace(regex, to))
}

// 1) Runtime evolution levels: preserve a real growth window after capture.
mustReplace(
  'scripts/generate-runtime-master.mjs',
  `}\n\nconst evolutionItems = { stones: {}, heldItems: {} }`,
  `}\n\n// World-progression overlay: the original CSV level thresholds were authored before\n// the current zone Lv bands. Keep those values as baselines, then raise only level\n// evolutions that would otherwise be ready immediately after a normal wild capture.\nconst EARLY_ZONE_MAX = { 1: [10, 16], 2: [24, 31], 3: [40, 49], 4: [60, 70] }\nconst FINAL_STAGE_FLOOR = { 1: 30, 2: 38, 3: 52, 4: 72 }\nconst families = new Map()\nfor (const monster of Object.values(species)) {\n  if (!families.has(monster.familyNo)) families.set(monster.familyNo, [])\n  families.get(monster.familyNo).push(monster)\n}\nfor (const family of families.values()) {\n  family.sort((a, b) => a.stage - b.stage)\n  for (let index = 0; index < family.length; index += 1) {\n    const monster = family[index]\n    const evo = monster.evolution\n    if (!evo || evo.method !== 'level') continue\n    const originalLevel = evo.level\n    if (monster.stage === 1) {\n      const zoneMaxes = EARLY_ZONE_MAX[monster.area] || [10, 16]\n      const zoneIndex = Number(monster.no) % Math.min(2, zoneMaxes.length)\n      evo.level = Math.max(originalLevel, zoneMaxes[zoneIndex] + 4)\n    } else {\n      const previous = family[index - 1]\n      const previousAcquireLevel = previous?.evolution?.method === 'level'\n        ? previous.evolution.level\n        : Math.max(...(EARLY_ZONE_MAX[monster.area] || [10])) + 4\n      evo.level = Math.max(originalLevel, FINAL_STAGE_FLOOR[monster.area] || originalLevel, previousAcquireLevel + 10)\n    }\n    evo.originalLevel = originalLevel\n    evo.worldAdjusted = evo.level !== originalLevel\n  }\n}\n\nconst evolutionItems = { stones: {}, heldItems: {} }`,
  'evolutionItems marker'
)

// 2) World metadata: sequential zone gates + explicit self-evolution discovery gate.
mustReplace(
  'src/game/worldProgression.js',
  `  const zone = zoneForStage(meta, stage, species)\n  const formStage = Math.max(1, Number(species?.stage) || 1)`,
  `  const zone = zoneForStage(meta, stage, species)\n  const zoneIndex = Math.max(0, meta.zones.findIndex((entry) => entry.id === zone.id))\n  const formStage = Math.max(1, Number(species?.stage) || 1)`
)
mustReplace(
  'src/game/worldProgression.js',
  `    zoneIcon: zone.icon,\n    minEnemyLevel: zone.minLevel,`,
  `    zoneIcon: zone.icon,\n    zoneIndex,\n    zoneGatePreviousId: zoneIndex > 0 ? meta.zones[zoneIndex - 1]?.id || null : null,\n    zoneGateMinClears: zoneIndex > 0 ? 2 : 0,\n    minEnemyLevel: zone.minLevel,`
)
mustReplace(
  'src/game/worldProgression.js',
  `  // 第2形態の初回入手は自力進化。進化後に dex.caught が立つので奥地野生が解禁される。\n  if (isFirstEvolvedForm) next.requiresOwnedSpeciesId = species.id`,
  `  // 第2形態の初回入手は自力進化。所有ではなく「自分で進化した記録」で奥地野生を解禁する。\n  if (isFirstEvolvedForm) next.requiresEvolutionDiscoverySpeciesId = species.id`
)
mustReplace(
  'src/game/worldProgression.js',
  `  isUnlocked = () => true,\n  isCaught = () => false,\n  isCleared = () => false\n} = {}) {`,
  `  isUnlocked = () => true,\n  isCaught = () => false,\n  isCleared = () => false,\n  priority = () => 0\n} = {}) {`
)
mustReplace(
  'src/game/worldProgression.js',
  `      const unlocked = Number(!isUnlocked(a)) - Number(!isUnlocked(b))\n      if (unlocked) return unlocked\n      const uncaught = Number(isCaught(a)) - Number(isCaught(b))`,
  `      const unlocked = Number(!isUnlocked(a)) - Number(!isUnlocked(b))\n      if (unlocked) return unlocked\n      const priorityDiff = Number(priority(a) || 0) - Number(priority(b) || 0)\n      if (priorityDiff) return priorityDiff\n      const uncaught = Number(isCaught(a)) - Number(isCaught(b))`
)

// 3) Save schema: real current location + explicit evolution discovery ledger.
mustReplace('src/game/progression.js', `export const CURRENT_GAME_VERSION = 8`, `export const CURRENT_GAME_VERSION = 9`)
mustReplace(
  'src/game/progression.js',
  `    specialDex: { giga: {}, burst: {} },\n    appliedLearningRewardIds: [],`,
  `    specialDex: { giga: {}, burst: {} },\n    evolutionDiscoveries: {},\n    adventureLocation: { area: 1, zoneId: 'meadow' },\n    appliedLearningRewardIds: [],`
)
mustReplace(
  'src/game/progression.js',
  `function normalizeRewardIds(value) {`,
  `const VALID_ADVENTURE_ZONES = Object.freeze({\n  1: ['meadow', 'forest', 'deep'],\n  2: ['foothill', 'magma', 'deep'],\n  3: ['coast', 'frost', 'deep'],\n  4: ['city', 'skyway', 'deep'],\n  5: ['ex']\n})\n\nfunction normalizeAdventureLocation(value) {\n  const area = Math.max(1, Math.min(5, positiveInt(value?.area) || 1))\n  const allowed = VALID_ADVENTURE_ZONES[area] || VALID_ADVENTURE_ZONES[1]\n  return { area, zoneId: allowed.includes(value?.zoneId) ? value.zoneId : allowed[0] }\n}\n\nfunction normalizeEvolutionDiscoveries(saved, box) {\n  const explicit = normalizeOwnershipMap(saved?.evolutionDiscoveries)\n  if (positiveInt(saved?.version) >= 9) return explicit\n  // v8 and earlier could not distinguish caught-vs-evolved. Grandfather already owned\n  // evolved forms so an existing child save never loses previously reachable content.\n  const candidates = new Set([\n    ...Object.keys(saved?.dex?.caught || {}).map(canonicalSpeciesId),\n    ...Object.values(box || {}).map((monster) => monster.speciesId)\n  ])\n  for (const speciesId of candidates) {\n    const species = speciesOf(speciesId)\n    if (species && Number(species.stage) > 1) explicit[speciesId] = true\n  }\n  return explicit\n}\n\nfunction normalizeRewardIds(value) {`
)
mustReplace(
  'src/game/progression.js',
  `    specialDex: {\n      giga: normalizeOwnershipMap(saved.specialDex?.giga),\n      burst: normalizeOwnershipMap(saved.specialDex?.burst)\n    },\n    appliedLearningRewardIds: normalizeRewardIds(saved.appliedLearningRewardIds),`,
  `    specialDex: {\n      giga: normalizeOwnershipMap(saved.specialDex?.giga),\n      burst: normalizeOwnershipMap(saved.specialDex?.burst)\n    },\n    evolutionDiscoveries: normalizeEvolutionDiscoveries(saved, box),\n    adventureLocation: normalizeAdventureLocation(saved.adventureLocation),\n    appliedLearningRewardIds: normalizeRewardIds(saved.appliedLearningRewardIds),`
)

// 4) Engine: zone gates are real game gates, and evolution is recorded explicitly.
mustReplace(
  'src/game/engine.js',
  `import { CAPTURE_CONFIG, EVOLUTION_ITEMS, MOVES, SPECIES, STAGES, moveOf, speciesOf, typeEffectiveness } from './content.js'`,
  `import { AREA_META, CAPTURE_CONFIG, EVOLUTION_ITEMS, MOVES, SPECIES, STAGES, moveOf, speciesOf, typeEffectiveness } from './content.js'`
)
mustReplace(
  'src/game/engine.js',
  `function areaWildClearCount(game, area) {\n  const cleared = new Set(game?.stagesCleared || [])\n  return STAGES.filter((stage) => (stage.adventureArea || stage.area) === area && stage.kind === 'wild' && cleared.has(stage.id)).length\n}\n\nexport function isStageUnlocked(game, stage) {`,
  `function areaWildClearCount(game, area) {\n  const cleared = new Set(game?.stagesCleared || [])\n  return STAGES.filter((stage) => (stage.adventureArea || stage.area) === area && stage.kind === 'wild' && cleared.has(stage.id)).length\n}\n\nfunction zoneWildClearCount(game, area, zoneId) {\n  const cleared = new Set(game?.stagesCleared || [])\n  return STAGES.filter((stage) => (stage.adventureArea || stage.area) === area && stage.kind === 'wild' && stage.zoneId === zoneId && cleared.has(stage.id)).length\n}\n\nexport function adventureZoneProgress(game, area, zoneId) {\n  const meta = AREA_META.find((entry) => entry.area === Number(area))\n  if (!meta) return { unlocked: Number(area) === 5, clears: 0, required: 0, remaining: 0, previousZoneName: null }\n  const index = meta.zones.findIndex((zone) => zone.id === zoneId)\n  if (index <= 0) return { unlocked: true, clears: 0, required: 0, remaining: 0, previousZoneName: null }\n  const previous = meta.zones[index - 1]\n  const required = 2\n  const clears = zoneWildClearCount(game, meta.area, previous.id)\n  return { unlocked: clears >= required, clears, required, remaining: Math.max(0, required - clears), previousZoneName: previous.name }\n}\n\nexport function isAdventureZoneUnlocked(game, area, zoneId) {\n  return adventureZoneProgress(game, area, zoneId).unlocked\n}\n\nexport function isStageUnlocked(game, stage) {`
)
mustReplace(
  'src/game/engine.js',
  `  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return false\n  if (stage.requiresAllAreasCleared && ![1, 2, 3, 4].every((area) => cleared.has(\`a\${area}-boss\`))) return false\n  if (stage.requiresOwnedSpeciesId && !ownsSpecies(game, stage.requiresOwnedSpeciesId)) return false`,
  `  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return false\n  if (stage.requiresAllAreasCleared && ![1, 2, 3, 4].every((area) => cleared.has(\`a\${area}-boss\`))) return false\n  if (stage.zoneId && Number(stage.adventureArea || stage.area) <= 4 && !isAdventureZoneUnlocked(game, stage.adventureArea || stage.area, stage.zoneId)) return false\n  if (stage.requiresEvolutionDiscoverySpeciesId && !game?.evolutionDiscoveries?.[stage.requiresEvolutionDiscoverySpeciesId]) return false\n  if (stage.requiresOwnedSpeciesId && !ownsSpecies(game, stage.requiresOwnedSpeciesId)) return false`
)
mustReplace(
  'src/game/engine.js',
  `  next.dex.seen[result.monster.speciesId] = true\n  next.dex.caught[result.monster.speciesId] = true\n  return { ok: true, game: next, from, to: result.monster.speciesId }`,
  `  next.dex.seen[result.monster.speciesId] = true\n  next.dex.caught[result.monster.speciesId] = true\n  next.evolutionDiscoveries ||= {}\n  const firstEvolutionDiscovery = !next.evolutionDiscoveries[result.monster.speciesId]\n  next.evolutionDiscoveries[result.monster.speciesId] = true\n  return { ok: true, game: next, from, to: result.monster.speciesId, firstEvolutionDiscovery }`
)

// 5) Home uses the player's real persisted current area/zone.
mustReplaceRegex(
  'src/App.jsx',
  /  const clearedStages = new Set\(game\.stagesCleared \|\| \[\]\)\n  const currentAreaNo = \[1, 2, 3, 4\]\.reduce\(\(best, areaNo\) => areaNo === 1 \|\| clearedStages\.has\(`a\$\{areaNo - 1\}-boss`\) \? Math\.max\(best, areaNo\) : best, 1\)\n  const currentArea = AREA_META\.find\(\(meta\) => meta\.area === currentAreaNo\)/,
  `  const clearedStages = new Set(game.stagesCleared || [])\n  const highestAreaNo = [1, 2, 3, 4].reduce((best, areaNo) => areaNo === 1 || clearedStages.has(\`a\${areaNo - 1}-boss\`) ? Math.max(best, areaNo) : best, 1)\n  const requestedAreaNo = Number(game.adventureLocation?.area)\n  const requestedAreaUnlocked = requestedAreaNo === 1 || (requestedAreaNo >= 2 && requestedAreaNo <= 4 && clearedStages.has(\`a\${requestedAreaNo - 1}-boss\`))\n  const currentAreaNo = requestedAreaUnlocked ? requestedAreaNo : highestAreaNo\n  const currentArea = AREA_META.find((meta) => meta.area === currentAreaNo)\n  const currentZone = currentArea?.zones?.find((zone) => zone.id === game.adventureLocation?.zoneId) || currentArea?.zones?.[0]`,
  'home current area calculation'
)
mustReplace(
  'src/App.jsx',
  `<section className="world-status-card"><div><p className="eyebrow">📍 いまの ぼうけん</p><h2>エリア{currentAreaNo}　{currentArea?.name}</h2><p>{currentArea?.levelLabel}。つよくなったら、まえのエリアへ もどって せいちょうも ためせるよ。</p></div>`,
  `<section className="world-status-card"><div><p className="eyebrow">📍 いまの ぼうけん</p><h2>エリア{currentAreaNo}　{currentArea?.name}</h2><p><b>{currentZone?.icon} {currentZone?.name}</b>　{currentArea?.levelLabel}。つよくなったら、まえのエリアへ もどって せいちょうも ためせるよ。</p></div>`
)

// 6) Adventure UX: sequential zones, total daily recommendations, direct post-battle evolution.
mustReplace(
  'src/game/GameScreens.jsx',
  `  isStageUnlocked,\n  levelsUntilEvolution,`,
  `  adventureZoneProgress,\n  isAdventureZoneUnlocked,\n  isStageUnlocked,\n  levelsUntilEvolution,`
)
mustReplaceRegex(
  'src/game/GameScreens.jsx',
  /function unlockReason\(game, stage\) \{[\s\S]*?\n\}/,
  `function unlockReason(game, stage) {\n  const cleared = new Set(game.stagesCleared || [])\n  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return 'まえの エリアボスを たおそう'\n  if (stage.requiresAllAreasCleared) return '4つの エリアを クリアしよう'\n  const zoneProgress = stage.zoneId ? adventureZoneProgress(game, stage.adventureArea || stage.area, stage.zoneId) : null\n  if (zoneProgress && !zoneProgress.unlocked) return \`${'${zoneProgress.previousZoneName}'}で あと ${'${zoneProgress.remaining}'}かい クリアしよう\`\n  if (stage.requiresEvolutionDiscoverySpeciesId && !game.evolutionDiscoveries?.[stage.requiresEvolutionDiscoverySpeciesId]) {\n    const required = speciesOf(stage.requiresEvolutionDiscoverySpeciesId)\n    return \`まず ${'${required?.name || \'このすがた\'}'}へ じぶんで シンカさせよう\`\n  }\n  if (stage.requiresOwnedSpeciesId && !game.dex?.caught?.[stage.requiresOwnedSpeciesId]) {\n    const required = speciesOf(stage.requiresOwnedSpeciesId)\n    return \`${'${required?.name || \'対象\'}'}を GETしよう\`\n  }\n  if (stage.minAreaClears) return \`このエリアで ${'${stage.minAreaClears}'}かい クリアしよう\`\n  return 'まだ あいていないよ'\n}`,
  'unlockReason'
)
mustReplace(
  'src/game/GameScreens.jsx',
  `  const defaultZoneId = areaMeta?.zones?.[0]?.id || 'ex'\n  const zoneId = areaMeta?.zones?.some((zone) => zone.id === location?.zoneId) ? location.zoneId : defaultZoneId\n  const activeZone = areaMeta?.zones?.find((zone) => zone.id === zoneId) || null`,
  `  const defaultZoneId = areaMeta?.zones?.[0]?.id || 'ex'\n  const requestedZoneId = areaMeta?.zones?.some((zone) => zone.id === location?.zoneId) ? location.zoneId : defaultZoneId\n  const zoneId = areaMeta && !isAdventureZoneUnlocked(game, area, requestedZoneId) ? defaultZoneId : requestedZoneId\n  const activeZone = areaMeta?.zones?.find((zone) => zone.id === zoneId) || null`
)
mustReplace(
  'src/game/GameScreens.jsx',
  `  const selectZone = (nextZoneId) => {\n    onLocationChange?.({ area, zoneId: nextZoneId })\n    setKind('all')\n    setSearch('')\n    setShowAll(false)\n  }`,
  `  const selectZone = (nextZoneId) => {\n    if (areaMeta && !isAdventureZoneUnlocked(game, area, nextZoneId)) return\n    onLocationChange?.({ area, zoneId: nextZoneId })\n    setKind('all')\n    setSearch('')\n    setShowAll(false)\n  }`
)
mustReplaceRegex(
  'src/game/GameScreens.jsx',
  /  const visibleStages = useMemo\(\(\) => \{\n    if \(!dailyMode\) return filteredStages\n    const wild = filteredStages\.filter\(\(stage\) => stage\.kind === 'wild'\)\n    const other = filteredStages\.filter\(\(stage\) => stage\.kind !== 'wild'\)\n    const dailyWild = pickDailyEncounterStages\(wild, \{[\s\S]*?\n    return \[\.\.\.dailyWild, \.\.\.other\]\n  \}, \[filteredStages, dailyMode, today, game, cleared\]\)/,
  `  const visibleStages = useMemo(() => {\n    if (!dailyMode) return filteredStages\n    return pickDailyEncounterStages(filteredStages, {\n      day: today,\n      limit: 5,\n      isUnlocked: (stage) => isStageUnlocked(game, stage),\n      isCaught: (stage) => stage.kind === 'wild' ? !!game.dex?.caught?.[stage.enemySpeciesId] : false,\n      isCleared: (stage) => cleared.has(stage.id),\n      priority: (stage) => stage.kind === 'boss' ? 0 : stage.kind === 'evolution-trial' ? 1 : ['giga-challenge', 'burst-challenge'].includes(stage.kind) ? 2 : stage.kind === 'wild' ? 3 : 4\n    })\n  }, [filteredStages, dailyMode, today, game, cleared])`,
  'visibleStages daily selection'
)
mustReplaceRegex(
  'src/game/GameScreens.jsx',
  /<div className="zone-grid">\{areaMeta\.zones\.map\(\(zone, index\) => \{\n          const danger = teamLevel < zone\.minLevel\n          return <button key=\{zone\.id\} className=\{`\$\{zoneId === zone\.id \? 'active' : ''\} \$\{danger \? 'danger' : 'ready'\}`\} onClick=\{\(\) => selectZone\(zone\.id\)\}>\n            <span className="zone-path-dot">\{zoneId === zone\.id \? '📍' : index \+ 1\}<\/span><b>\{zone\.icon\} \{zone\.name\}<\/b><small>Lv\.\{zone\.minLevel\}〜\{zone\.maxLevel\}<\/small><em>\{danger \? '⚠️ かなり つよい' : zoneId === zone\.id \? 'いま ここ！' : 'いけるよ'\}<\/em>\n          <\/button>\n        \}\)\}<\/div>/,
  `<div className="zone-grid">{areaMeta.zones.map((zone, index) => {\n          const danger = teamLevel < zone.minLevel\n          const progress = adventureZoneProgress(game, area, zone.id)\n          const locked = !progress.unlocked\n          return <button key={zone.id} disabled={locked} className={\`${'${zoneId === zone.id ? \'active\' : \'\'}'} ${'${danger ? \'danger\' : \'ready\'}'} ${'${locked ? \'zone-locked\' : \'\'}'}\`} onClick={() => selectZone(zone.id)}>\n            <span className="zone-path-dot">{locked ? '🔒' : zoneId === zone.id ? '📍' : index + 1}</span><b>{zone.icon} {zone.name}</b><small>Lv.{zone.minLevel}〜{zone.maxLevel}</small><em>{locked ? `${'${progress.previousZoneName}'} あと${'${progress.remaining}'}かい` : danger ? '⚠️ かなり つよい' : zoneId === zone.id ? 'いま ここ！' : 'いけるよ'}</em>\n          </button>\n        })}</div>`,
  'zone grid'
)
mustReplace(
  'src/game/GameScreens.jsx',
  `dailyMode ? 'まずは5たいまで。GETしていない なかまを ゆうせんして みつけるよ。' : 'ずかんのように ぜんぶ さがせるよ。'`,
  `dailyMode ? '野生・シンカ・ボスから、いま意味のある であいを5つまで えらぶよ。' : 'ずかんのように ぜんぶ さがせるよ。'`
)
mustReplace(
  'src/game/GameScreens.jsx',
  `  const captureAttemptsLeft = Math.max(0, MAX_CAPTURE_ATTEMPTS - (battle.captureAttempts || 0))`,
  `  const captureAttemptsLeft = Math.max(0, MAX_CAPTURE_ATTEMPTS - (battle.captureAttempts || 0))\n  const [battleEvolutionReveal, setBattleEvolutionReveal] = useState(null)\n  const readyEvolutionMonster = finished && battle.status !== 'lost'\n    ? (battle.teamAtStart || []).map((id) => game.box?.[id]).find((monster) => monster && canNormalEvolve(monster, game))\n    : null`
)
mustReplace(
  'src/game/GameScreens.jsx',
  `  const battleMoves = availableBattleMoveIds(game, battle)`,
  `  const evolveReadyMonster = () => {\n    if (!readyEvolutionMonster) return\n    const fromId = readyEvolutionMonster.speciesId\n    const level = readyEvolutionMonster.level\n    const result = evolveInstance(game, readyEvolutionMonster.instanceId)\n    if (!result.ok) return\n    setGame(result.game)\n    setBattleEvolutionReveal({ fromId, toId: result.to, level })\n  }\n\n  const battleMoves = availableBattleMoveIds(game, battle)`
)
mustReplace(
  'src/game/GameScreens.jsx',
  `<main className={\`screen battle-screen-v2 area-theme-${'${stage?.adventureArea || stage?.area || 5}'}\`}>`,
  `<main className={\`screen battle-screen-v2 area-theme-${'${stage?.adventureArea || stage?.area || 5}'}\`}>\n      <EvolutionCelebration reveal={battleEvolutionReveal} onClose={() => setBattleEvolutionReveal(null)} />`
)
mustReplace(
  'src/game/GameScreens.jsx',
  `        {battle.status === 'lost' && <p>{battle.ticketRefunded ? '🎫は1まい返ってきたよ。仲間を育てて再挑戦しよう！' : '🎫は期限をすぎていたので戻らなかったよ。もう一度学んで挑戦しよう！'}</p>}\n        <button className="primary" onClick={exit}>マップへ</button>`,
  `        {battle.status === 'lost' && <p>{battle.ticketRefunded ? '🎫は1まい返ってきたよ。仲間を育てて再挑戦しよう！' : '🎫は期限をすぎていたので戻らなかったよ。もう一度学んで挑戦しよう！'}</p>}\n        {readyEvolutionMonster && <div className="battle-evolution-ready"><strong>✨ {speciesOf(readyEvolutionMonster.speciesId)?.name}が シンカできるよ！</strong><span>バトルで そだった いまが チャンス！</span><button className="evolve-now" onClick={evolveReadyMonster}>いま シンカする！</button></div>}\n        <button className="primary" onClick={exit}>マップへ</button>`
)
mustReplaceRegex(
  'src/game/GameScreens.jsx',
  /export function AdventureFlow\(\{ game, setGame, goHome, goStudy, dailyCompleted, dailyDay, today \}\) \{[\s\S]*?return <StageMap game=\{game\} onStart=\{start\} goStudy=\{goStudy\} goHome=\{goHome\} dailyCompleted=\{dailyCompleted\} today=\{today\} location=\{mapLocation\} onLocationChange=\{setMapLocation\} \/>\n\}/,
  `export function AdventureFlow({ game, setGame, goHome, goStudy, dailyCompleted, dailyDay, today }) {\n  const start = (stageId, challenge = false) => {\n    const liveToday = dayNumber()\n    const liveDailyCompleted = dailyCompleted && dailyDay === liveToday\n    const result = startBattle(game, stageId, { dailyCompleted: liveDailyCompleted, dailyDay: liveToday, today: liveToday, challenge })\n    if (!result.ok) {\n      if (['NO_TICKET', 'DAILY_NOT_COMPLETED'].includes(result.reason)) goStudy()\n      return\n    }\n    setGame(result.game)\n  }\n  const setMapLocation = (nextLocation) => setGame((current) => ({ ...current, adventureLocation: nextLocation }))\n  if (game.activeBattle) return <BattleView game={game} setGame={setGame} onExitToMap={() => {}} goStudy={goStudy} />\n  return <StageMap game={game} onStart={start} goStudy={goStudy} goHome={goHome} dailyCompleted={dailyCompleted} today={today} location={game.adventureLocation} onLocationChange={setMapLocation} />\n}`,
  'AdventureFlow'
)

// 7) Stronger map/game visual hierarchy.
write('src/game/game.css', read('src/game/game.css') + `\n\n/* Progression review fixes: sequential routes + reward moment */\n.area-zone-map.area-1{background:radial-gradient(circle at 82% 16%,#fff9b8 0 8%,transparent 9%),linear-gradient(160deg,#dff7e5,#a9dfbd 55%,#76bd91)}\n.area-zone-map.area-2{background:radial-gradient(circle at 18% 12%,#ffb05e 0 7%,transparent 8%),linear-gradient(160deg,#4b2b3f,#a84e36 52%,#d59a5b);color:#fff}.area-zone-map.area-2 .eyebrow,.area-zone-map.area-2 .zone-map-title>span{color:#6a381f}\n.area-zone-map.area-3{background:linear-gradient(160deg,#e5f8ff,#b9e5f5 48%,#7aa996)}\n.area-zone-map.area-4{background:radial-gradient(circle at 15% 20%,#fff 0 2px,transparent 3px),radial-gradient(circle at 75% 16%,#fff 0 2px,transparent 3px),linear-gradient(160deg,#181d4f,#454b91 58%,#7664b4);color:#fff}.area-zone-map.area-4 .eyebrow{color:#c9d4ff}\n.zone-grid button.zone-locked{opacity:.62;filter:saturate(.55);box-shadow:none}.zone-grid button.zone-locked .zone-path-dot{background:#647285}.zone-grid button:disabled{cursor:not-allowed}\n.battle-evolution-ready{display:grid;gap:6px;margin:12px 0;padding:14px;border-radius:17px;background:linear-gradient(135deg,#fff3a8,#ffd273);color:#6d4600;box-shadow:0 8px 20px #b57a1630}.battle-evolution-ready strong{font-size:1.05rem}.battle-evolution-ready span{font-size:.78rem}.battle-evolution-ready .evolve-now{padding:12px;border-radius:14px;background:#6b42c8;color:#fff;font-weight:1000;box-shadow:0 5px 0 #45268f}\n`)

// 8) Canonical docs: make the reviewed behavior explicit and demote stale numeric prose.
write('design/20-world-map-evolution-progression.md', read('design/20-world-map-evolution-progression.md') + `\n\n## 12. 2026-08-25 再レビュー反映（正本追記）\n\n### 捕獲直後シンカを禁止する世界補正\n\n旧CSVのlevel進化値はワールドLv帯導入前の基準値として保全し、runtime生成時に現在の冒険ゾーンと整合させる。第1形態のlevel進化は、その種が通常出現する入口／中盤ゾーンの上限Lvより最低4Lv先を保証する。3段階系列の第2→最終level進化は、前段階の実効進化Lvからさらに最低10Lv先を保証し、Area別の後半育成floorも適用する。stone / held_item_levelup は取得・装備体験が育成ゲートになるため、このLv補正の対象外。\n\n目的は「高LvエリアでGETした瞬間に進化可能」をなくし、どのエリアでも GET → 数日育成 → 自力シンカ の順番を守ること。元CSV値は `evolution.originalLevel` としてruntime監査可能にする。\n\n### ゾーン進行\n\n各エリアの入口は最初から入れる。中盤は入口の野生を2ステージ初回クリア、奥地は中盤の野生を2ステージ初回クリアすると解放する。ボスの5探索条件とは別に、画面上の道と実際の解放順を一致させる。\n\n### 自力進化の記録\n\n第2形態の奥地野生解禁は `dex.caught` ではなく `evolutionDiscoveries` を正とする。`evolveInstance()` 成功時に進化後speciesを記録する。v8以前の既存セーブだけは互換性のため、既に所有していた進化後speciesを移行時にgrandfatherする。\n\n### 現在地\n\n`adventureLocation = { area, zoneId }` をプロフィール別ゲームセーブへ保存する。ホームの「いまのぼうけん」と再入場時のマップは、最高解放エリアではなくこの実際の現在地を表示する。\n\n### 1日3チケットの選択\n\n通常表示の「きょうの であい」は野生だけを5体出すのではなく、野生・シンカしれん・特殊試練・ボスを含む候補全体から最大5件に絞る。未クリアのボス、利用可能な進化試練、特殊試練、未GET野生を優先し、全件は「ほかも さがす」で確認できる。\n\n### バトル→進化\n\n勝利／捕獲で手持ちが進化可能になった場合、結果画面に「いま シンカする！」を出し、モンスター管理画面を経由せず全画面進化演出へ接続する。\n`)

mustReplace(
  'design/08-balance-tuning-policy.md',
  `# バランス初期値・調整運用 正本仕様\n\n更新日: 2026-08-24`,
  `# バランス初期値・調整運用（履歴＋運用方針）\n\n更新日: 2026-08-25\n\n> **現行数値の正本ではありません。** 数値が競合する場合は \`design/12-detailed-balance-design-for-sol-review.md\`、\`design/20-world-map-evolution-progression.md\`、および現行runtimeを優先します。この文書は調整プロセス・受入思想を残す履歴資料です。`
)
mustReplace(
  'design/08-balance-tuning-policy.md',
  `xpToNext(level) = 60 + 18 * level`,
  `totalXp(L) = round(6 * (L - 1)^1.9)\nxpToNext(L) = totalXp(L+1) - totalXp(L)`
)
mustReplace(
  'design/08-balance-tuning-policy.md',
  `\`src/game/balance.js\` の \`BALANCE_VERSION=1\` を初期値とする。`,
  `現行 \`src/game/balance.js\` は \`BALANCE_VERSION=4\`。ゾーンLv帯クランプと再戦成長実感を含む。`
)

mustReplace(
  'design/00-README.md',
  `- Lv1〜100、XP、Battle XP、敵ソフトスケーリング、ボスsnapshot/challenge`,
  `- Lv1〜100、XP、Battle XP、ゾーンLv帯クランプ、ボスsnapshot/challenge\n- エリア→入口/中盤/奥地の順次解放、プロフィール別の実現在地保存\n- 自力進化記録 \`evolutionDiscoveries\` と、捕獲直後進化を防ぐワールド進化Lv補正`
)

// 9) Regression coverage for the review findings.
write('tests/progression-review-fixes.test.js', `import test from 'node:test'\nimport assert from 'node:assert/strict'\nimport { SPECIES, STAGES, speciesOf } from '../src/game/content.js'\nimport { adventureZoneProgress, evolveInstance, isAdventureZoneUnlocked, isStageUnlocked, makeMonster } from '../src/game/engine.js'\nimport { createGameState, normalizeGameState } from '../src/game/progression.js'\n\ntest('stage1 level evolutions are never ready immediately at their wild-zone max level', () => {\n  for (const stage of STAGES.filter((entry) => entry.kind === 'wild' && !entry.hidden)) {\n    const species = speciesOf(stage.enemySpeciesId)\n    if (species?.stage !== 1 || species.evolution?.method !== 'level') continue\n    assert.ok(species.evolution.level >= stage.maxEnemyLevel + 4, `${'${species.id}'} evo ${'${species.evolution.level}'} vs wild max ${'${stage.maxEnemyLevel}'}`)\n  }\n})\n\ntest('later level evolutions keep at least ten levels after an adjusted prior level evolution', () => {\n  for (const species of Object.values(SPECIES)) {\n    if (species.stage !== 2 || species.evolution?.method !== 'level') continue\n    const previous = Object.values(SPECIES).find((candidate) => candidate.familyNo === species.familyNo && candidate.stage === 1)\n    if (previous?.evolution?.method !== 'level') continue\n    assert.ok(species.evolution.level >= previous.evolution.level + 10, `${'${species.id}'}`)\n  }\n})\n\ntest('zones unlock sequentially after two wild first-clears in the previous zone', () => {\n  const game = createGameState()\n  assert.equal(isAdventureZoneUnlocked(game, 1, 'meadow'), true)\n  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), false)\n  const meadow = STAGES.filter((stage) => stage.kind === 'wild' && stage.adventureArea === 1 && stage.zoneId === 'meadow').slice(0, 2)\n  game.stagesCleared = meadow.map((stage) => stage.id)\n  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), true)\n  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), false)\n  const forest = STAGES.filter((stage) => stage.kind === 'wild' && stage.adventureArea === 1 && stage.zoneId === 'forest').slice(0, 2)\n  game.stagesCleared.push(...forest.map((stage) => stage.id))\n  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), true)\n  assert.equal(adventureZoneProgress(game, 1, 'deep').remaining, 0)\n})\n\ntest('evolved wild unlock requires explicit self-evolution discovery, not dex ownership alone', () => {\n  const stage = STAGES.find((entry) => entry.kind === 'wild' && entry.requiresEvolutionDiscoverySpeciesId)\n  assert.ok(stage)\n  const game = createGameState()\n  game.dex.caught[stage.enemySpeciesId] = true\n  game.stagesCleared = ['a1-boss', 'a2-boss', 'a3-boss']\n  const area = stage.adventureArea\n  const metaStages = STAGES.filter((entry) => entry.kind === 'wild' && entry.adventureArea === area)\n  for (const zoneId of ['coast', 'frost', 'city', 'skyway']) {\n    game.stagesCleared.push(...metaStages.filter((entry) => entry.zoneId === zoneId).slice(0, 2).map((entry) => entry.id))\n  }\n  assert.equal(isStageUnlocked(game, stage), false)\n  game.evolutionDiscoveries[stage.enemySpeciesId] = true\n  assert.equal(isStageUnlocked(game, stage), true)\n})\n\ntest('evolveInstance records self-evolution discovery and save migration keeps current location', () => {\n  let game = createGameState()\n  const instanceId = game.activeMonsterId\n  game.box[instanceId] = makeMonster('m001', SPECIES.m001.evolution.level, instanceId)\n  game.dex.caught.m001 = true\n  const evolved = evolveInstance(game, instanceId)\n  assert.equal(evolved.ok, true)\n  assert.equal(evolved.game.evolutionDiscoveries[evolved.to], true)\n  evolved.game.adventureLocation = { area: 1, zoneId: 'forest' }\n  const normalized = normalizeGameState(evolved.game, 9999)\n  assert.deepEqual(normalized.adventureLocation, { area: 1, zoneId: 'forest' })\n})\n`)

console.log('Applied progression review fixes')
