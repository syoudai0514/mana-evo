import test from 'node:test'
import assert from 'node:assert/strict'

import { STAGES, speciesOf } from '../src/game/content.js'
import {
  TRAINING_XP_MULTIPLIERS,
  ZONE_XP_MULTIPLIERS,
  battleXpForStage,
  stageXpMultiplier
} from '../src/game/balance.js'
import {
  attemptCapture,
  canAttemptCapture,
  isStageUnlocked
} from '../src/game/engine.js'
import { createGameState } from '../src/game/progression.js'

test('D-031 route XP rises ①→②→③ without stacking training bonuses', () => {
  const base = { kind: 'wild', enemyDifficulty: 'normal' }
  const z1 = { ...base, zoneIndex: 0 }
  const z2 = { ...base, zoneIndex: 1 }
  const z3 = { ...base, zoneIndex: 2 }
  assert.equal(stageXpMultiplier(z1), ZONE_XP_MULTIPLIERS[0])
  assert.equal(stageXpMultiplier(z2), ZONE_XP_MULTIPLIERS[1])
  assert.equal(stageXpMultiplier(z3), ZONE_XP_MULTIPLIERS[2])
  assert.ok(battleXpForStage(z1) < battleXpForStage(z2))
  assert.ok(battleXpForStage(z2) < battleXpForStage(z3))

  const training = { kind: 'training', enemyDifficulty: 'strong', zoneIndex: 2, trainingEvolutionStage: 2 }
  assert.equal(stageXpMultiplier(training), TRAINING_XP_MULTIPLIERS[2])
  assert.equal(battleXpForStage(training), Math.round(125 * TRAINING_XP_MULTIPLIERS[2]))
})

test('a two-stage family final form receives the final-form training multiplier', () => {
  const training = STAGES.find((stage) => {
    if (stage.kind !== 'training') return false
    const species = speciesOf(stage.enemySpeciesId)
    return species?.stage === 2 && !species?.evolution
  })
  assert.ok(training, 'fixture must include a two-stage family final form')
  assert.equal(stageXpMultiplier(training), TRAINING_XP_MULTIPLIERS.final)
})

test('training is hidden until the exact evolved form has been self-discovered', () => {
  const training = STAGES.find((stage) => stage.kind === 'training')
  assert.ok(training)
  const game = createGameState()
  assert.equal(isStageUnlocked(game, training), false)
  game.evolutionDiscoveries[training.enemySpeciesId] = true
  if (training.area > 1) game.stagesCleared.push(`a${training.area - 1}-boss`)
  assert.equal(isStageUnlocked(game, training), true)
})

test('evolved forms remain non-capturable in fighting and post-win states without spending a ring', () => {
  const evolved = STAGES.find((stage) => stage.kind === 'training' && speciesOf(stage.enemySpeciesId)?.stage >= 2)
  assert.ok(evolved)
  for (const status of ['fighting', 'won']) {
    const battle = {
      battleId: `d031-${status}`,
      stageId: evolved.id,
      status,
      captureAttempts: 0,
      enemy: {
        speciesId: evolved.enemySpeciesId,
        hp: status === 'won' ? 0 : 1,
        maxHp: 10
      }
    }
    const game = createGameState()
    game.captureItems.star = 3
    game.activeBattle = structuredClone(battle)
    const before = game.captureItems.star
    assert.equal(canAttemptCapture(game, battle, 'star'), false)
    const result = attemptCapture(game, battle, 0, 'star')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'CAPTURE_DISABLED')
    assert.equal(result.game.captureItems.star, before)
  }
})
