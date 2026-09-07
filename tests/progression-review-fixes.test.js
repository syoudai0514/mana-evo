import test from 'node:test'
import assert from 'node:assert/strict'
import { SPECIES, STAGES, speciesOf } from '../src/game/content.js'
import { adventureZoneProgress, applyXpToInstance, evolveInstance, isAdventureZoneUnlocked, isStageUnlocked, makeMonster, xpToNext } from '../src/game/engine.js'
import { getEvolutionTransition } from '../src/game/evolutionDomain.js'
import { createGameState, normalizeGameState } from '../src/game/progression.js'

function distinctSpeciesStages(stages, count) {
  const seen = new Set()
  const result = []
  for (const stage of stages) {
    if (!stage?.enemySpeciesId || seen.has(stage.enemySpeciesId)) continue
    seen.add(stage.enemySpeciesId)
    result.push(stage)
    if (result.length >= count) break
  }
  return result
}

test('stage1 level evolutions are never ready immediately at a capturable wild-zone max level', () => {
  for (const stage of STAGES.filter((entry) => entry.kind === 'wild' && !entry.hidden && !entry.captureDisabled)) {
    const species = speciesOf(stage.enemySpeciesId)
    if (species?.stage !== 1 || species.evolution?.method !== 'level') continue
    assert.ok(species.evolution.level >= stage.maxEnemyLevel + 4, species.id + ' evo ' + species.evolution.level + ' vs capturable wild max ' + stage.maxEnemyLevel)
  }
})

test('later level evolutions keep at least ten levels after an adjusted prior level evolution', () => {
  for (const species of Object.values(SPECIES)) {
    if (species.stage !== 2 || species.evolution?.method !== 'level') continue
    const previous = Object.values(SPECIES).find((candidate) => candidate.familyNo === species.familyNo && candidate.stage === 1)
    if (previous?.evolution?.method !== 'level') continue
    assert.ok(species.evolution.level >= previous.evolution.level + 10, species.id)
  }
})

test('zones unlock sequentially after three distinct normal enemy species in the previous zone', () => {
  const game = createGameState()
  assert.equal(isAdventureZoneUnlocked(game, 1, 'meadow'), true)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), false)
  const meadow = distinctSpeciesStages(STAGES.filter((stage) => stage.kind === 'wild' && stage.routeProgressEligible && stage.adventureArea === 1 && stage.zoneId === 'meadow'), 3)
  assert.equal(meadow.length, 3)
  game.stagesCleared = meadow.slice(0, 2).map((stage) => stage.id)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), false)
  game.stagesCleared.push(meadow[2].id)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), true)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), false)

  const forest = distinctSpeciesStages(STAGES.filter((stage) => stage.kind === 'wild' && stage.routeProgressEligible && stage.adventureArea === 1 && stage.zoneId === 'forest'), 3)
  assert.equal(forest.length, 3)
  game.stagesCleared.push(...forest.slice(0, 2).map((stage) => stage.id))
  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), false)
  game.stagesCleared.push(forest[2].id)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), true)
  assert.equal(adventureZoneProgress(game, 1, 'deep').remaining, 0)
})

test('evolution training requires explicit self-evolution discovery, not dex ownership alone', () => {
  const stage = STAGES.find((entry) => entry.kind === 'training' && entry.requiresEvolutionDiscoverySpeciesId)
  assert.ok(stage)
  const game = createGameState()
  game.dex.caught[stage.enemySpeciesId] = true
  if (stage.area > 1) game.stagesCleared.push(`a${stage.area - 1}-boss`)
  assert.equal(isStageUnlocked(game, stage), false)
  game.evolutionDiscoveries[stage.enemySpeciesId] = true
  assert.equal(isStageUnlocked(game, stage), true)
})

test('actual level-up creates readiness; confirmation records self-evolution discovery and migration keeps current location', () => {
  let game = createGameState()
  const instanceId = game.activeMonsterId
  const transition = getEvolutionTransition('m001')
  game.box[instanceId] = makeMonster('m001', transition.level - 1, instanceId)
  game.dex.caught.m001 = true
  const qualified = applyXpToInstance(game, {
    instanceId,
    amount: xpToNext(game.box[instanceId].level),
    operationId: 'progression-review:self-evolution'
  })
  assert.equal(qualified.ok, true)
  assert.equal(qualified.game.box[instanceId].speciesId, 'm001')
  assert.equal(qualified.game.box[instanceId].evolutionReady, true)
  assert.equal(qualified.game.box[instanceId].pendingEvolution?.toSpeciesId, transition.toSpeciesId)
  assert.equal(qualified.game.evolutionDiscoveries[transition.toSpeciesId], undefined)

  const evolved = evolveInstance(qualified.game, instanceId)
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box[instanceId].speciesId, transition.toSpeciesId)
  assert.equal(evolved.game.evolutionDiscoveries[transition.toSpeciesId], true)
  evolved.game.adventureLocation = { area: 1, zoneId: 'forest' }
  const normalized = normalizeGameState(evolved.game, 9999)
  assert.deepEqual(normalized.adventureLocation, { area: 1, zoneId: 'forest' })
})
