import test from 'node:test'
import assert from 'node:assert/strict'

import { SPECIES } from '../src/game/content.js'
import { EVOLUTION_TRANSITIONS, evolutionTriggerStatus } from '../src/game/evolutionDomain.js'
import { xpToNext } from '../src/game/engine.js'
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
      assert.equal(monster.level, transition.level, `${transition.fromSpeciesId} must already be at its evolution level`)
      assert.equal(monster.xp, Math.max(0, xpToNext(monster.level) - 1), `${transition.fromSpeciesId} should be one XP from the next triggerable level-up`)
      const status = evolutionTriggerStatus(monster, game, {
        trigger: 'level_up',
        previousLevel: monster.level - 1,
        newLevel: monster.level
      })
      assert.equal(status.ready, true, `${transition.fromSpeciesId} level condition must be satisfied`)
      continue
    }

    if (transition.method === 'held_item_levelup') {
      assert.equal(monster.heldItemId, transition.itemId, `${transition.fromSpeciesId} must already hold the required item`)
      assert.equal(monster.xp, Math.max(0, xpToNext(monster.level) - 1), `${transition.fromSpeciesId} should be one XP from a level-up trigger`)
      const status = evolutionTriggerStatus(monster, game, {
        trigger: 'level_up',
        previousLevel: monster.level - 1,
        newLevel: monster.level
      })
      assert.equal(status.ready, true, `${transition.fromSpeciesId} held-item condition must be satisfied`)
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

test('TEST fixture labels describe actionable evolution states', () => {
  assert.equal(TEST_FIXTURE_LABELS.stage1, '第1形態・進化できる')
  assert.equal(TEST_FIXTURE_LABELS.stage2, '第2形態・最終進化できる')
})

test('stage 1 TEST fixture satisfies every first-evolution condition now', () => {
  assertFixtureReady(1)
})

test('stage 2 TEST fixture satisfies every final-evolution condition now', () => {
  assertFixtureReady(2)
})
