import test from 'node:test'
import assert from 'node:assert/strict'
import { AREA_META, SPECIES, STAGES, speciesOf } from '../src/game/content.js'
import { buildEnemyPlan } from '../src/game/balance.js'
import { applyXpToInstance, evolveInstance, isStageUnlocked, xpToNext } from '../src/game/engine.js'
import { getEvolutionTransition } from '../src/game/evolutionDomain.js'
import { createGameState } from '../src/game/progression.js'

test('world areas expose explicit progression bands and zones', () => {
  assert.deepEqual(AREA_META.map((a) => [a.area, a.levelMin, a.levelMax]), [
    [1, 5, 22], [2, 18, 38], [3, 32, 58], [4, 50, 80]
  ])
  assert.ok(AREA_META.every((a) => a.zones.length === 3))
})

test('confirmed self evolution unlocks training while the retired evolved-wild stage stays hidden', () => {
  const retired = STAGES.find((s) => s.kind === 'wild' && s.area === 1 && speciesOf(s.enemySpeciesId)?.stage === 2)
  assert.ok(retired, 'generated compatibility stage for an area1 second form should exist')
  assert.equal(retired.hidden, true)
  assert.equal(retired.captureDisabled, true)
  assert.equal(isStageUnlocked(createGameState(), retired), false)

  const targetSpeciesId = retired.enemySpeciesId
  const training = STAGES.find((s) => s.kind === 'training' && s.enemySpeciesId === targetSpeciesId)
  assert.ok(training, 'every evolved form should have a training stage')
  assert.equal(training.captureDisabled, true)
  assert.equal(training.requiresEvolutionDiscoverySpeciesId, targetSpeciesId)

  const predecessor = Object.values(SPECIES).find((s) => getEvolutionTransition(s.id)?.toSpeciesId === targetSpeciesId)
  const transition = predecessor ? getEvolutionTransition(predecessor.id) : null
  assert.ok(predecessor && transition?.method === 'level', 'needs a level-evolution predecessor for the test')

  const game = createGameState()
  game.box = {
    evo: {
      instanceId: 'evo', speciesId: predecessor.id, level: transition.level - 1,
      xp: 0, heldItemId: null, evolutionReady: false, caughtAt: Date.now()
    }
  }
  game.team = ['evo']
  game.activeMonsterId = 'evo'
  game.dex = { seen: { [predecessor.id]: true }, caught: { [predecessor.id]: true } }
  assert.equal(isStageUnlocked(game, training), false)

  const qualified = applyXpToInstance(game, {
    instanceId: 'evo',
    amount: xpToNext(game.box.evo.level),
    operationId: 'world-progression:self-evolution'
  })
  assert.equal(qualified.ok, true)
  assert.equal(qualified.game.box.evo.speciesId, predecessor.id)
  assert.equal(qualified.game.box.evo.evolutionReady, true)
  assert.equal(isStageUnlocked(qualified.game, training), false)

  const evolved = evolveInstance(qualified.game, 'evo')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box.evo.speciesId, targetSpeciesId)
  assert.equal(evolved.game.dex.caught[targetSpeciesId], true)
  assert.equal(evolved.game.evolutionDiscoveries[targetSpeciesId], true)
  assert.equal(isStageUnlocked(evolved.game, training), true)
  assert.equal(isStageUnlocked(evolved.game, retired), false, 'self evolution must not resurrect retired wild capture routes')
})

test('all evolved forms are absent from visible normal wild targets', () => {
  const illegal = STAGES.filter((s) => s.kind === 'wild' && !s.legacy && !s.hidden).filter((s) => speciesOf(s.enemySpeciesId)?.stage > 1)
  assert.equal(illegal.length, 0)
})

test('each main area has enough first-form route encounters to satisfy the three-clear gate', () => {
  for (const meta of AREA_META) {
    for (const zone of meta.zones.slice(0, 2)) {
      const eligible = STAGES.filter((stage) =>
        stage.kind === 'wild' && !stage.hidden && stage.routeProgressEligible !== false &&
        (stage.adventureArea || stage.area) === meta.area && stage.zoneId === zone.id &&
        speciesOf(stage.enemySpeciesId)?.stage === 1)
      assert.ok(eligible.length >= 3, `area${meta.area}/${zone.id} needs at least three eligible route encounters`)
    }
  }
})

test('deep zones contain strong first-form rematches and no evolved capture targets', () => {
  for (const meta of AREA_META) {
    const deep = meta.zones[2]
    const stages = STAGES.filter((stage) => !stage.hidden && (stage.adventureArea || stage.area) === meta.area && stage.zoneId === deep.id)
    assert.ok(stages.some((stage) => stage.kind === 'wild' && stage.deepRematch && speciesOf(stage.enemySpeciesId)?.stage === 1), `area${meta.area} needs a deep first-form rematch`)
    assert.equal(stages.filter((stage) => stage.kind === 'wild' && speciesOf(stage.enemySpeciesId)?.stage > 1).length, 0)
  }
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
