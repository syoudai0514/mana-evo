import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attemptCapture,
  canAttemptCapture
} from '../src/game/engine.js'

function fightingBattle(speciesId) {
  return {
    battleId: `temporary-capture-${speciesId}`,
    stageId: 'temporary-capture-policy-test',
    status: 'fighting',
    captureAttempts: 0,
    enemy: {
      speciesId,
      hp: 1,
      maxHp: 10
    }
  }
}

function wonBattle(speciesId) {
  const battle = fightingBattle(speciesId)
  battle.status = 'won'
  battle.enemy.hp = 0
  return battle
}

function gameFor(battle) {
  return {
    captureItems: {
      star: 3,
      silver: 0,
      gold: 0,
      rainbow: 1
    },
    activeBattle: structuredClone(battle)
  }
}

test('temporary capture gate keeps stage 1 capturable while blocking stage 2 and stage 3 during battle', () => {
  const stage1 = fightingBattle('wild-grass-1')
  const stage2 = fightingBattle('wild-grass-2')
  const stage3 = fightingBattle('wild-grass-3')

  assert.equal(canAttemptCapture(gameFor(stage1), stage1, 'star'), true)
  assert.equal(canAttemptCapture(gameFor(stage2), stage2, 'star'), false)
  assert.equal(canAttemptCapture(gameFor(stage3), stage3, 'star'), false)

  for (const battle of [stage2, stage3]) {
    const game = gameFor(battle)
    const before = game.captureItems.star
    const result = attemptCapture(game, battle, 0, 'star')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'CAPTURE_DISABLED')
    assert.equal(result.game.captureItems.star, before)
    assert.equal(result.battle.status, 'fighting')
  }
})

test('temporary capture gate also blocks evolved forms after victory without spending a ring', () => {
  const stage1 = wonBattle('wild-grass-1')
  const stage2 = wonBattle('wild-grass-2')
  const stage3 = wonBattle('wild-grass-3')

  assert.equal(canAttemptCapture(gameFor(stage1), stage1, 'star'), true)
  assert.equal(canAttemptCapture(gameFor(stage2), stage2, 'star'), false)
  assert.equal(canAttemptCapture(gameFor(stage3), stage3, 'star'), false)

  for (const battle of [stage2, stage3]) {
    const game = gameFor(battle)
    const before = game.captureItems.star
    const result = attemptCapture(game, battle, 0, 'star')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'CAPTURE_DISABLED')
    assert.equal(result.game.captureItems.star, before)
    assert.equal(result.battle.status, 'won')
  }
})
