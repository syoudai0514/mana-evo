import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attemptCapture,
  gainXp,
  makeMonster,
  setTeam,
  startBattle,
  useMove
} from '../src/game/engine.js'
import {
  addTickets,
  createGameState
} from '../src/game/progression.js'
import {
  BATTLE_XP_GLOBAL_MULTIPLIER,
  BATTLE_XP_TEAMMATE_MULTIPLIER,
  CAPTURE_EVOLUTION_LEVEL_BUFFER
} from '../src/game/balance.js'
import { getEvolutionTransition } from '../src/game/evolutionDomain.js'

const STAGE = 'a1-wild-001'

function start(game, today = 3100) {
  return startBattle(game, STAGE, { dailyCompleted: true, today })
}

test('V5 gives the active battler paced XP and teammates reduced support XP', () => {
  const today = 3100
  let game = createGameState()
  const mate = makeMonster('m007', 5, 'pacing-mate')
  game.box[mate.instanceId] = mate
  game = setTeam(game, [game.activeMonsterId, mate.instanceId]).game
  const activeId = game.activeMonsterId
  const before = structuredClone(game)

  const started = start(addTickets(game, 1, today), today)
  assert.equal(started.ok, true)
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const result = useMove(started.game, battle, 'm004-stable')

  assert.equal(result.ok, true)
  assert.equal(result.battle.status, 'won')
  assert.equal(result.rewards.xp, 110, 'encounter reward pool remains stable for UI/compatibility')

  const expectedActiveXp = Math.round(110 * BATTLE_XP_GLOBAL_MULTIPLIER)
  const expectedMateXp = Math.round(expectedActiveXp * BATTLE_XP_TEAMMATE_MULTIPLIER)
  assert.equal(expectedActiveXp, 44)
  assert.equal(expectedMateXp, 18)
  assert.equal(result.rewards.xpByInstance[activeId], expectedActiveXp)
  assert.equal(result.rewards.xpByInstance[mate.instanceId], expectedMateXp)

  const expectedActive = gainXp(before.box[activeId], expectedActiveXp).monster
  const expectedMate = gainXp(before.box[mate.instanceId], expectedMateXp).monster
  assert.equal(result.game.box[activeId].level, expectedActive.level)
  assert.equal(result.game.box[activeId].xp, expectedActive.xp)
  assert.equal(result.game.box[mate.instanceId].level, expectedMate.level)
  assert.equal(result.game.box[mate.instanceId].xp, expectedMate.xp)
})

test('21 normal-win equivalents no longer evolve a fresh starter on day one', () => {
  const starter = makeMonster('m004', 5, 'day-one-starter')
  const activeXp = Math.round(110 * BATTLE_XP_GLOBAL_MULTIPLIER)
  const after = gainXp(starter, activeXp * 21).monster
  const transition = getEvolutionTransition('m004')

  assert.equal(transition.level, 17)
  assert.ok(after.level < transition.level, `Lv.${after.level} must remain below Lv.${transition.level}`)
})

test('captured level-evolution monsters keep a five-level growth runway', () => {
  const today = 3200
  let game = createGameState()
  game.captureItems.rainbow = 1
  const started = start(addTickets(game, 1, today), today)
  assert.equal(started.ok, true)

  const battle = structuredClone(started.battle)
  battle.enemy.level = 30
  battle.enemy.hp = 1
  const result = attemptCapture(started.game, battle, [1, 1, 1, 1], 'rainbow', { today })

  assert.equal(result.ok, true)
  assert.equal(result.caught, true)
  assert.equal(result.captured.speciesId, 'm001')
  const transition = getEvolutionTransition('m001')
  assert.equal(transition.level, 17)
  assert.equal(CAPTURE_EVOLUTION_LEVEL_BUFFER, 5)
  assert.equal(result.captured.level, transition.level - CAPTURE_EVOLUTION_LEVEL_BUFFER)
  assert.equal(result.captured.level, 12)
  assert.equal(result.captured.xp, 0)
})
