import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_BOSS_REQUIREMENT,
  ROUTE_CLEAR_TUNING_DEFAULT,
  adventureZoneProgress,
  applyAreaBossProgressEvent,
  applyFirstBossClear,
  areaBossEligibility,
  clampEnemyLevelToWorldBand,
  enrichStage,
  isAdventureAreaUnlocked,
  persistedAdventureLocation,
  setAdventureLocation,
  worldStageAvailability
} from '../src/game/worldProgression.js'

function gameState() {
  return {
    stagesCleared: [],
    areaBossProgress: {},
    evolutionDiscoveries: {},
    adventureLocation: { area: 1, zoneId: 'meadow' }
  }
}

function routeStages(area = 1) {
  const zoneIdsByArea = {
    1: ['meadow', 'forest', 'deep'],
    2: ['foothill', 'magma', 'deep'],
    3: ['coast', 'frost', 'deep'],
    4: ['city', 'skyway', 'deep']
  }
  const zoneIds = zoneIdsByArea[area] || ['ex']
  return zoneIds.flatMap((zoneId) => [1, 2, 3].map((n) => ({
    id: `a${area}-${zoneId}-${n}`,
    kind: 'wild',
    adventureArea: area,
    zoneId
  })))
}

test('source area stays immutable while adventure placement may move later evolved wilds', () => {
  const stage = { id: 'a1-wild-middle', kind: 'wild', area: 1 }
  const species = { id: 'm002', no: '002', stage: 2, evolution: { to: 'm003' } }
  const enriched = enrichStage(stage, species)
  assert.equal(enriched.area, 1)
  assert.equal(enriched.sourceArea, 1)
  assert.equal(enriched.adventureArea, 3)
  assert.equal(enriched.zoneId, 'deep')
  assert.equal(enriched.requiresEvolutionDiscoverySpeciesId, 'm002')
})

test('first forms remain normal-wild candidates and final forms are not normal-wild catches', () => {
  const first = enrichStage({ id: 'first', kind: 'wild', area: 1 }, { id: 'm001', no: '001', stage: 1, evolution: { to: 'm002' } })
  assert.equal(first.hidden, undefined)
  assert.equal(first.captureDisabled, undefined)
  assert.equal(first.firstAcquireByEvolution, false)

  const final = enrichStage({ id: 'final', kind: 'wild', area: 1 }, { id: 'm003', no: '003', stage: 3 })
  assert.equal(final.hidden, true)
  assert.equal(final.captureDisabled, true)
  assert.equal(final.finalEvolutionOnly, true)
})

test('boss stages use canonical learning gate metadata and never minAreaClears=5', () => {
  const boss = enrichStage({ id: 'a1-boss', kind: 'boss', area: 1 }, { id: 'm050', no: '050', stage: 1 })
  assert.equal(boss.minAreaClears, undefined)
  assert.equal(boss.requiresAreaBossProgress, true)
  assert.equal(boss.bossProgressArea, 1)
  assert.deepEqual(boss.bossProgressRequirement, AREA_BOSS_REQUIREMENT)
  assert.deepEqual(AREA_BOSS_REQUIREMENT, { minPoints: 12, minUniqueSkills: 2 })
})

test('per-area boss progress requires at least 12 points and two unique skills', () => {
  let game = gameState()
  const e1 = applyAreaBossProgressEvent(game, { id: 'core-1', area: 1, points: 1, skillId: 'math-add' })
  assert.equal(e1.ok, true)
  game = e1.game
  const e2 = applyAreaBossProgressEvent(game, { id: 'mastery-1', area: 1, points: 11, skillId: 'math-add' })
  game = e2.game
  assert.equal(areaBossEligibility(game, 1).eligible, false)
  assert.equal(areaBossEligibility(game, 1).missingPoints, 0)
  assert.equal(areaBossEligibility(game, 1).missingUniqueSkills, 1)
  game = applyAreaBossProgressEvent(game, { id: 'chapter-1', area: 1, points: 1, skillId: 'math-subtract' }).game
  assert.equal(areaBossEligibility(game, 1).eligible, true)
})

test('boss learning events are idempotent and progress does not leak between areas', () => {
  let game = gameState()
  const first = applyAreaBossProgressEvent(game, { id: 'evt-1', area: 1, points: 3, skillIds: ['s1', 's1'] })
  game = first.game
  const replay = applyAreaBossProgressEvent(game, { id: 'evt-1', area: 1, points: 3, skillIds: ['s2'] })
  assert.equal(replay.changed, false)
  assert.equal(replay.progress.points, 3)
  assert.deepEqual(replay.progress.uniqueSkillIds, ['s1'])
  assert.equal(areaBossEligibility(game, 2).points, 0)
  assert.equal(areaBossEligibility(game, 2).uniqueSkillCount, 0)
})

test('first boss clear unlocks only the next area once and does not move current location', () => {
  let game = gameState()
  game = applyAreaBossProgressEvent(game, { id: 'ready', area: 1, points: 12, skillIds: ['s1', 's2'] }).game
  const cleared = applyFirstBossClear(game, 1)
  assert.equal(cleared.ok, true)
  assert.equal(cleared.firstClear, true)
  assert.equal(cleared.unlockedArea, 2)
  assert.equal(isAdventureAreaUnlocked(cleared.game, 2), true)
  assert.deepEqual(cleared.game.areaBossProgress[2], { points: 0, uniqueSkillIds: [], appliedEventIds: [] })
  assert.deepEqual(cleared.game.adventureLocation, { area: 1, zoneId: 'meadow' })

  const replayWithoutNewProgressState = structuredClone(cleared.game)
  replayWithoutNewProgressState.areaBossProgress = {}
  const again = applyFirstBossClear(replayWithoutNewProgressState, 1)
  assert.equal(again.ok, true)
  assert.equal(again.firstClear, false)
  assert.equal(again.unlockedArea, null)
  assert.deepEqual(again.game.stagesCleared, cleared.game.stagesCleared)
})

test('entrance-mid-deep route uses distinct first-clear counts as tuning, separate from boss learning gate', () => {
  const stages = routeStages(1)
  const game = gameState()
  assert.equal(ROUTE_CLEAR_TUNING_DEFAULT, 2)
  assert.equal(adventureZoneProgress(game, stages, 1, 'meadow').unlocked, true)
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').unlocked, false)
  game.stagesCleared = ['a1-meadow-1', 'a1-meadow-1']
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').clears, 1)
  game.stagesCleared.push('a1-meadow-2')
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').unlocked, true)

  const boss = { id: 'a1-boss', kind: 'boss', area: 1, adventureArea: 1, zoneId: 'deep' }
  game.stagesCleared.push('a1-forest-1', 'a1-forest-2')
  assert.equal(worldStageAvailability(game, boss, stages).reason, 'BOSS_LEARNING_PROGRESS_REQUIRED')
})

test('evolved wild availability reads evolutionDiscoveries rather than ownership-shaped state', () => {
  const stages = routeStages(3)
  const stage = {
    id: 'a3-evolved',
    kind: 'wild',
    area: 1,
    adventureArea: 3,
    zoneId: 'deep',
    requiresEvolutionDiscoverySpeciesId: 'm002'
  }
  stages.push(stage)
  const game = gameState()
  game.stagesCleared = ['a1-boss', 'a2-boss', 'a3-coast-1', 'a3-coast-2', 'a3-frost-1', 'a3-frost-2']
  game.dex = { caught: { m002: true } }
  assert.equal(worldStageAvailability(game, stage, stages).reason, 'EVOLUTION_DISCOVERY_REQUIRED')
  game.evolutionDiscoveries.m002 = true
  assert.equal(worldStageAvailability(game, stage, stages).unlocked, true)
})

test('persisted location is explicit, stays on older areas, and rejects locked jumps', () => {
  const stages = [...routeStages(1), ...routeStages(2)]
  let game = gameState()
  assert.deepEqual(persistedAdventureLocation(game), { area: 1, zoneId: 'meadow' })
  const locked = setAdventureLocation(game, { area: 2, zoneId: 'foothill' }, stages)
  assert.equal(locked.ok, false)
  assert.equal(locked.reason, 'AREA_LOCKED')

  game = applyAreaBossProgressEvent(game, { id: 'ready-a1', area: 1, points: 12, skillIds: ['s1', 's2'] }).game
  game = applyFirstBossClear(game, 1).game
  const moved = setAdventureLocation(game, { area: 2, zoneId: 'foothill' }, stages)
  assert.equal(moved.ok, true)
  const returned = setAdventureLocation(moved.game, { area: 1, zoneId: 'meadow' }, stages)
  assert.equal(returned.ok, true)
  assert.deepEqual(persistedAdventureLocation(returned.game), { area: 1, zoneId: 'meadow' })
})

test('old-area enemy candidates stay clamped to stable zone bands instead of mirroring player level', () => {
  const stage = enrichStage({ id: 'old-area', kind: 'wild', area: 1 }, { id: 'm001', no: '001', stage: 1, evolution: { to: 'm002' } })
  assert.equal(stage.minEnemyLevel, 5)
  assert.equal(stage.maxEnemyLevel, 10)
  assert.equal(clampEnemyLevelToWorldBand(stage, 99), 10)
  assert.equal(clampEnemyLevelToWorldBand(stage, 1), 5)
})

test('EX continuity default can be overridden because exact unlock remains unresolved', () => {
  const game = gameState()
  game.stagesCleared = ['a1-boss', 'a2-boss', 'a3-boss', 'a4-boss']
  assert.equal(isAdventureAreaUnlocked(game, 5), true)
  assert.equal(isAdventureAreaUnlocked(game, 5, { exUnlocked: false }), false)
  assert.equal(isAdventureAreaUnlocked(game, 5, { exUnlocked: true }), true)
})
