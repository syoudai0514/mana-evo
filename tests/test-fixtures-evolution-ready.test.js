import test from 'node:test'
import assert from 'node:assert/strict'

import { SPECIES } from '../src/game/content.js'
import { EVOLUTION_TRANSITIONS, evolutionTriggerStatus } from '../src/game/evolutionDomain.js'
import { applyXpToInstance, xpToNext } from '../src/game/engine.js'
import { createEvolutionTestGameFixture, TEST_FIXTURE_LABELS } from '../src/platform/testFixtures.js'

function transitionsForStage(stage) {
  return EVOLUTION_TRANSITIONS.filter((transition) => Number(SPECIES[transition.fromSpeciesId]?.stage) === stage)
}

function assertFixtureReady(stage) {
  const game = createEvolutionTestGameFixture(stage)
  const transitions = transitionsForStage(stage)
  assert.ok(transitions.length > 0, `stage ${stage} must have evolution transitions`)

  for (const transition of transitions) {
    const monster = game.box[`test-${transition.fromSpeciesId}`]
    assert.ok(monster, `${transition.fromSpeciesId} must exist in stage ${stage} fixture`)
    assert.equal(monster.evolutionReady, true, `${transition.fromSpeciesId} must be marked evolution-ready`)

    if (transition.method === 'level') {
      assert.equal(monster.level, transition.level, `${transition.fromSpeciesId} must already be at its evolution condition level`)
      assert.equal(monster.xp, Math.max(0, xpToNext(monster.level) - 1), `${transition.fromSpeciesId} should be one XP from the next actual level-up trigger`)
      const evolved = applyXpToInstance(game, {
        instanceId: monster.instanceId,
        amount: 1,
        operationId: `test-ready:${stage}:${transition.fromSpeciesId}`
      })
      assert.equal(evolved.ok, true)
      assert.equal(evolved.game.box[monster.instanceId].speciesId, transition.toSpeciesId, `${transition.fromSpeciesId} must evolve on the next level-up`)
      continue
    }

    if (transition.method === 'held_item_levelup') {
      assert.equal(monster.heldItemId, transition.itemId, `${transition.fromSpeciesId} must already hold the required item`)
      assert.equal(monster.xp, Math.max(0, xpToNext(monster.level) - 1), `${transition.fromSpeciesId} should be one XP from a level-up trigger`)
      const evolved = applyXpToInstance(game, {
        instanceId: monster.instanceId,
        amount: 1,
        operationId: `test-ready:${stage}:${transition.fromSpeciesId}`
      })
      assert.equal(evolved.ok, true)
      assert.equal(evolved.game.box[monster.instanceId].speciesId, transition.toSpeciesId, `${transition.fromSpeciesId} must evolve with the held item on the next level-up`)
      continue
    }

    if (transition.method === 'stone') {
      const status = evolutionTriggerStatus(monster, game, {
        trigger: 'stone',
        itemId: transition.itemId
      })
      assert.equal(status.ready, true, `${transition.fromSpeciesId} must have the required stone available`)
    }
  }
}

test('TEST fixture labels describe the actual evolution trigger', () => {
  assert.equal(TEST_FIXTURE_LABELS.stage1, '第1形態・次のLvUPで進化確認')
  assert.equal(TEST_FIXTURE_LABELS.stage2, '第2形態・次のLvUP/条件で最終進化確認')
})

test('stage 1 TEST fixture can trigger every first evolution', () => {
  assertFixtureReady(1)
})

test('stage 2 TEST fixture can trigger every final evolution', () => {
  assertFixtureReady(2)
})
