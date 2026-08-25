import test from 'node:test'
import assert from 'node:assert/strict'
import { AREA_META, SPECIES, STAGES, speciesOf } from '../src/game/content.js'
import { buildEnemyPlan } from '../src/game/balance.js'
import { evolveInstance, isStageUnlocked } from '../src/game/engine.js'
import { createGameState } from '../src/game/progression.js'

test('world areas expose explicit progression bands and zones', () => {
  assert.deepEqual(AREA_META.map((a) => [a.area, a.levelMin, a.levelMax]), [
    [1, 5, 22], [2, 18, 38], [3, 32, 58], [4, 50, 80]
  ])
  assert.ok(AREA_META.every((a) => a.zones.length === 3))
})

test('second-form wild encounter is locked until that form has been obtained by evolution', () => {
  const stage = STAGES.find((s) => s.kind === 'wild' && s.area === 1 && speciesOf(s.enemySpeciesId)?.stage === 2 && speciesOf(s.enemySpeciesId)?.evolution)
  assert.ok(stage, 'area1 should contain a non-final second form')
  assert.equal(stage.firstAcquireByEvolution, true)
  assert.equal(stage.requiresEvolutionDiscoverySpeciesId, stage.enemySpeciesId)

  const predecessor = Object.values(SPECIES).find((s) => s.evolution?.to === stage.enemySpeciesId && s.evolution?.method === 'level')
  assert.ok(predecessor, 'needs a level-evolution predecessor for the test')
  const game = createGameState()
  game.box = {
    evo: {
      instanceId: 'evo', speciesId: predecessor.id, level: predecessor.evolution.level,
      xp: 0, heldItemId: null, evolutionReady: false, caughtAt: Date.now()
    }
  }
  game.team = ['evo']
  game.activeMonsterId = 'evo'
  game.dex = { seen: { [predecessor.id]: true }, caught: { [predecessor.id]: true } }
  game.stagesCleared = ['a1-boss', 'a2-boss']
  for (const zoneId of ['coast', 'frost', 'city', 'skyway']) {
    const route = STAGES.filter((entry) => entry.kind === 'wild' && entry.adventureArea === stage.adventureArea && entry.zoneId === zoneId).slice(0, 2)
    if (route.length === 2) game.stagesCleared.push(...route.map((entry) => entry.id))
  }
  assert.equal(isStageUnlocked(game, stage), false)

  const evolved = evolveInstance(game, 'evo')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.to, stage.enemySpeciesId)
  assert.equal(evolved.game.dex.caught[stage.enemySpeciesId], true)
  assert.equal(evolved.game.evolutionDiscoveries[stage.enemySpeciesId], true)
  assert.equal(isStageUnlocked(evolved.game, stage), true)
})

test('final evolved forms are not normal wild map targets', () => {
  const illegal = STAGES.filter((s) => s.kind === 'wild' && !s.legacy).filter((s) => {
    const species = speciesOf(s.enemySpeciesId)
    return species?.stage > 1 && !species?.evolution && !s.hidden
  })
  assert.equal(illegal.length, 0)
})

test('normal encounter scaling is clamped to the zone level band', () => {
  const weakGame = createGameState()
  const hard = STAGES.find((s) => s.kind === 'wild' && !s.hidden && s.area === 4)
  assert.ok(hard)
  const hardPlan = buildEnemyPlan(weakGame, hard, speciesOf)
  assert.ok(hardPlan.level >= hard.minEnemyLevel)

  const strongGame = createGameState()
  strongGame.box[strongGame.team[0]].level = 100
  const easy = STAGES.find((s) => s.kind === 'wild' && !s.hidden && s.area === 1)
  assert.ok(easy)
  const easyPlan = buildEnemyPlan(strongGame, easy, speciesOf)
  assert.ok(easyPlan.level <= easy.maxEnemyLevel)
})

test('story bosses use the canonical per-area learning gate instead of route-clear count', () => {
  const bosses = STAGES.filter((s) => s.kind === 'boss' && [1, 2, 3, 4].includes(s.area))
  assert.equal(bosses.length, 4)
  assert.ok(bosses.every((s) => s.minAreaClears === undefined))
  assert.ok(bosses.every((s) => s.requiresAreaBossProgress === true))
  assert.ok(bosses.every((s) => s.bossProgressRequirement?.minPoints === 12))
  assert.ok(bosses.every((s) => s.bossProgressRequirement?.minUniqueSkills === 2))
})
