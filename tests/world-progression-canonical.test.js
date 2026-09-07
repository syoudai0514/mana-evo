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
  return zoneIds.flatMap((zoneId) => [1, 2, 3, 4].map((n) => ({
    id: `a${area}-${zoneId}-${n}`,
    kind: 'wild',
    enemySpeciesId: `species-${area}-${zoneId}-${n}`,
    adventureArea: area,
    zoneId,
    routeProgressEligible: zoneId !== 'deep'
  })))
}

test('D-031 retires evolved wild encounters without changing their source-area identity', () => {
  const stage = { id: 'a1-wild-middle', kind: 'wild', area: 1 }
  const species = { id: 'm002', no: '002', stage: 2, evolution: { to: 'm003' } }
  const enriched = enrichStage(stage, species)
  assert.equal(enriched.area, 1)
  assert.equal(enriched.sourceArea, 1)
  assert.equal(enriched.adventureArea, 1)
  assert.equal(enriched.hidden, true)
  assert.equal(enriched.captureDisabled, true)
  assert.equal(enriched.retiredEvolvedWild, true)
  assert.equal(enriched.routeProgressEligible, false)
})

test('first forms remain normal-wild candidates while every evolved wild form is retired', () => {
  const first = enrichStage({ id: 'first', kind: 'wild', area: 1 }, { id: 'm001', no: '001', stage: 1, evolution: { to: 'm002' } })
  assert.equal(first.hidden, undefined)
  assert.equal(first.captureDisabled, undefined)
  assert.equal(first.firstAcquireByEvolution, false)
  assert.equal(first.routeProgressEligible, true)

  const second = enrichStage({ id: 'second', kind: 'wild', area: 1 }, { id: 'm002', no: '002', stage: 2, evolution: { to: 'm003' } })
  const final = enrichStage({ id: 'final', kind: 'wild', area: 1 }, { id: 'm003', no: '003', stage: 3 })
  for (const evolved of [second, final]) {
    assert.equal(evolved.hidden, true)
    assert.equal(evolved.captureDisabled, true)
    assert.equal(evolved.firstAcquireByEvolution, true)
  }
})

test('D-031 deep first-form rematches are training-only and capture-disabled', () => {
  const deep = enrichStage({
    id: 'a1-deep-001',
    kind: 'wild',
    area: 1,
    zoneHint: 'deep',
    deepRematch: true
  }, { id: 'm001', no: '001', stage: 1, evolution: { to: 'm002' } })
  assert.equal(deep.zoneId, 'deep')
  assert.equal(deep.captureDisabled, true)
  assert.equal(deep.captureDisabledReason, 'DEEP_TRAINING_ONLY')
  assert.equal(deep.routeProgressEligible, false)
})

test('boss stages keep the canonical learning gate metadata', () => {
  const boss = enrichStage({ id: 'a1-boss', kind: 'boss', area: 1 }, { id: 'm050', no: '050', stage: 1 })
  assert.equal(boss.minAreaClears, undefined)
  assert.equal(boss.requiresAreaBossProgress, true)
  assert.equal(boss.bossProgressArea, 1)
  assert.deepEqual(boss.bossProgressRequirement, AREA_BOSS_REQUIREMENT)
  assert.deepEqual(AREA_BOSS_REQUIREMENT, { minPoints: 12, minUniqueSkills: 2 })
})

test('per-area boss progress requires at least 12 points and two unique skills', () => {
  let game = gameState()
  game = applyAreaBossProgressEvent(game, { id: 'core-1', area: 1, points: 1, skillId: 'math-add' }).game
  game = applyAreaBossProgressEvent(game, { id: 'mastery-1', area: 1, points: 11, skillId: 'math-add' }).game
  assert.equal(areaBossEligibility(game, 1).eligible, false)
  assert.equal(areaBossEligibility(game, 1).missingPoints, 0)
  assert.equal(areaBossEligibility(game, 1).missingUniqueSkills, 1)
  game = applyAreaBossProgressEvent(game, { id: 'chapter-1', area: 1, points: 1, skillId: 'math-subtract' }).game
  assert.equal(areaBossEligibility(game, 1).eligible, true)
})

test('boss learning events are idempotent and progress does not leak between areas', () => {
  let game = gameState()
  game = applyAreaBossProgressEvent(game, { id: 'evt-1', area: 1, points: 3, skillIds: ['s1', 's1'] }).game
  const replay = applyAreaBossProgressEvent(game, { id: 'evt-1', area: 1, points: 3, skillIds: ['s2'] })
  assert.equal(replay.changed, false)
  assert.equal(replay.progress.points, 3)
  assert.deepEqual(replay.progress.uniqueSkillIds, ['s1'])
  assert.equal(areaBossEligibility(game, 2).points, 0)
})

test('first boss clear unlocks only the next area once and does not move current location', () => {
  let game = gameState()
  game = applyAreaBossProgressEvent(game, { id: 'ready', area: 1, points: 12, skillIds: ['s1', 's2'] }).game
  const cleared = applyFirstBossClear(game, 1)
  assert.equal(cleared.ok, true)
  assert.equal(cleared.firstClear, true)
  assert.equal(cleared.unlockedArea, 2)
  assert.equal(isAdventureAreaUnlocked(cleared.game, 2), true)
  assert.deepEqual(cleared.game.adventureLocation, { area: 1, zoneId: 'meadow' })

  const replayWithoutNewProgressState = structuredClone(cleared.game)
  replayWithoutNewProgressState.areaBossProgress = {}
  const again = applyFirstBossClear(replayWithoutNewProgressState, 1)
  assert.equal(again.ok, true)
  assert.equal(again.firstClear, false)
  assert.equal(again.unlockedArea, null)
})

test('D-031 route requires three distinct eligible enemy species and ignores training/duplicates', () => {
  const stages = routeStages(1)
  stages.push({ id: 'training-m002', kind: 'training', enemySpeciesId: 'm002', adventureArea: 1, zoneId: 'meadow', routeProgressEligible: false })
  const game = gameState()
  assert.equal(ROUTE_CLEAR_TUNING_DEFAULT, 3)
  assert.equal(adventureZoneProgress(game, stages, 1, 'meadow').unlocked, true)
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').unlocked, false)

  game.stagesCleared = ['a1-meadow-1', 'a1-meadow-1', 'training-m002']
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').clears, 1)
  game.stagesCleared.push('a1-meadow-2')
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').unlocked, false)
  game.stagesCleared.push('a1-meadow-3')
  assert.equal(adventureZoneProgress(game, stages, 1, 'forest').unlocked, true)
})

test('two stage IDs for the same enemy still count as only one route species', () => {
  const stages = [
    { id: 'a1-meadow-a1', kind: 'wild', enemySpeciesId: 'species-a', adventureArea: 1, zoneId: 'meadow', routeProgressEligible: true },
    { id: 'a1-meadow-a2', kind: 'wild', enemySpeciesId: 'species-a', adventureArea: 1, zoneId: 'meadow', routeProgressEligible: true },
    { id: 'a1-meadow-b', kind: 'wild', enemySpeciesId: 'species-b', adventureArea: 1, zoneId: 'meadow', routeProgressEligible: true },
    { id: 'a1-meadow-c', kind: 'wild', enemySpeciesId: 'species-c', adventureArea: 1, zoneId: 'meadow', routeProgressEligible: true }
  ]
  const game = gameState()
  game.stagesCleared = ['a1-meadow-a1', 'a1-meadow-a2', 'a1-meadow-b']
  const twoSpecies = adventureZoneProgress(game, stages, 1, 'forest')
  assert.equal(twoSpecies.clears, 2)
  assert.equal(twoSpecies.unlocked, false)
  game.stagesCleared.push('a1-meadow-c')
  const threeSpecies = adventureZoneProgress(game, stages, 1, 'forest')
  assert.equal(threeSpecies.clears, 3)
  assert.equal(threeSpecies.unlocked, true)
})

test('evolution training unlocks from self-evolution discovery independently of normal route depth', () => {
  const stages = routeStages(1)
  const training = enrichStage({
    id: 'a1-training-002',
    kind: 'training',
    area: 1,
    zoneHint: 'deep',
    requiresEvolutionDiscoverySpeciesId: 'm002',
    captureDisabled: true,
    trainingEvolutionStage: 2
  }, { id: 'm002', no: '002', stage: 2, evolution: { to: 'm003' } })
  stages.push(training)
  const game = gameState()
  assert.equal(adventureZoneProgress(game, stages, 1, 'deep').unlocked, false)
  assert.equal(worldStageAvailability(game, training, stages).reason, 'EVOLUTION_DISCOVERY_REQUIRED')
  game.evolutionDiscoveries.m002 = true
  assert.equal(worldStageAvailability(game, training, stages).unlocked, true)
})

test('persisted location is explicit, stays on older areas, and rejects locked jumps', () => {
  const stages = [...routeStages(1), ...routeStages(2)]
  let game = gameState()
  assert.deepEqual(persistedAdventureLocation(game), { area: 1, zoneId: 'meadow' })
  assert.equal(setAdventureLocation(game, { area: 2, zoneId: 'foothill' }, stages).reason, 'AREA_LOCKED')

  game = applyAreaBossProgressEvent(game, { id: 'ready-a1', area: 1, points: 12, skillIds: ['s1', 's2'] }).game
  game = applyFirstBossClear(game, 1).game
  const moved = setAdventureLocation(game, { area: 2, zoneId: 'foothill' }, stages)
  assert.equal(moved.ok, true)
  const returned = setAdventureLocation(moved.game, { area: 1, zoneId: 'meadow' }, stages)
  assert.equal(returned.ok, true)
})

test('old-area enemy candidates stay clamped to stable zone bands instead of mirroring player level', () => {
  const stage = enrichStage({ id: 'old-area', kind: 'wild', area: 1 }, { id: 'm001', no: '001', stage: 1, evolution: { to: 'm002' } })
  assert.equal(stage.minEnemyLevel, 5)
  assert.equal(stage.maxEnemyLevel, 10)
  assert.equal(clampEnemyLevelToWorldBand(stage, 99), 10)
  assert.equal(clampEnemyLevelToWorldBand(stage, 1), 5)
})

test('EX continuity default can still be overridden', () => {
  const game = gameState()
  game.stagesCleared = ['a1-boss', 'a2-boss', 'a3-boss', 'a4-boss']
  assert.equal(isAdventureAreaUnlocked(game, 5), true)
  assert.equal(isAdventureAreaUnlocked(game, 5, { exUnlocked: false }), false)
  assert.equal(isAdventureAreaUnlocked(game, 5, { exUnlocked: true }), true)
})
