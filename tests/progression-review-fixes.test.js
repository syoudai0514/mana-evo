import test from 'node:test'
import assert from 'node:assert/strict'
import { SPECIES, STAGES, speciesOf } from '../src/game/content.js'
import { adventureZoneProgress, applyXpToInstance, isAdventureZoneUnlocked, isStageUnlocked, makeMonster, xpToNext } from '../src/game/engine.js'
import { getEvolutionTransition } from '../src/game/evolutionDomain.js'
import { createGameState, normalizeGameState } from '../src/game/progression.js'

test('stage1 level evolutions are never ready immediately at their wild-zone max level', () => {
  for (const stage of STAGES.filter((entry) => entry.kind === 'wild' && !entry.hidden)) {
    const species = speciesOf(stage.enemySpeciesId)
    if (species?.stage !== 1 || species.evolution?.method !== 'level') continue
    assert.ok(species.evolution.level >= stage.maxEnemyLevel + 4, species.id + ' evo ' + species.evolution.level + ' vs wild max ' + stage.maxEnemyLevel)
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

test('zones unlock sequentially after two wild first-clears in the previous zone', () => {
  const game = createGameState()
  assert.equal(isAdventureZoneUnlocked(game, 1, 'meadow'), true)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), false)
  const meadow = STAGES.filter((stage) => stage.kind === 'wild' && stage.adventureArea === 1 && stage.zoneId === 'meadow').slice(0, 2)
  game.stagesCleared = meadow.map((stage) => stage.id)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'forest'), true)
  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), false)
  const forest = STAGES.filter((stage) => stage.kind === 'wild' && stage.adventureArea === 1 && stage.zoneId === 'forest').slice(0, 2)
  game.stagesCleared.push(...forest.map((stage) => stage.id))
  assert.equal(isAdventureZoneUnlocked(game, 1, 'deep'), true)
  assert.equal(adventureZoneProgress(game, 1, 'deep').remaining, 0)
})

test('evolved wild unlock requires explicit self-evolution discovery, not dex ownership alone', () => {
  const stage = STAGES.find((entry) => entry.kind === 'wild' && entry.requiresEvolutionDiscoverySpeciesId)
  assert.ok(stage)
  const game = createGameState()
  game.dex.caught[stage.enemySpeciesId] = true
  game.stagesCleared = ['a1-boss', 'a2-boss', 'a3-boss']
  const area = stage.adventureArea
  const metaStages = STAGES.filter((entry) => entry.kind === 'wild' && entry.adventureArea === area)
  for (const zoneId of ['coast', 'frost', 'city', 'skyway']) {
    game.stagesCleared.push(...metaStages.filter((entry) => entry.zoneId === zoneId).slice(0, 2).map((entry) => entry.id))
  }
  assert.equal(isStageUnlocked(game, stage), false)
  game.evolutionDiscoveries[stage.enemySpeciesId] = true
  assert.equal(isStageUnlocked(game, stage), true)
})

test('actual level-up records self-evolution discovery and save migration keeps current location', () => {
  let game = createGameState()
  const instanceId = game.activeMonsterId
  const transition = getEvolutionTransition('m001')
  game.box[instanceId] = makeMonster('m001', transition.level - 1, instanceId)
  game.dex.caught.m001 = true
  const evolved = applyXpToInstance(game, {
    instanceId,
    amount: xpToNext(game.box[instanceId].level),
    operationId: 'progression-review:self-evolution'
  })
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.evolutionDiscoveries[transition.toSpeciesId], true)
  evolved.game.adventureLocation = { area: 1, zoneId: 'forest' }
  const normalized = normalizeGameState(evolved.game, 9999)
  assert.deepEqual(normalized.adventureLocation, { area: 1, zoneId: 'forest' })
})
