import test from 'node:test'
import assert from 'node:assert/strict'

import { speciesOf } from '../src/game/content.js'
import { addTickets, createGameState } from '../src/game/progression.js'
import { startBattle, useMove } from '../src/game/engine.js'

const DAY = 4700
const STAGE_ID = 'a1-wild-001'

function startedBattle() {
  const game = addTickets(createGameState(), 1, DAY)
  const started = startBattle(game, STAGE_ID, { dailyCompleted: true, dailyDay: DAY, today: DAY })
  assert.equal(started.ok, true)
  return started
}

function firstDamageMove(game, battle) {
  const monster = game.box[battle.activeInstanceId]
  return speciesOf(monster.speciesId).moves[0]
}

function syncBattle(started, mutate) {
  const game = structuredClone(started.game)
  const battle = structuredClone(started.battle)
  mutate?.(battle, game)
  game.activeBattle = structuredClone(battle)
  return { game, battle }
}

test('D-030 presentation events use stable increasing ordinals and deterministic ids', () => {
  const started = startedBattle()
  const { game, battle } = syncBattle(started)
  const moveId = firstDamageMove(game, battle)
  const result = useMove(game, battle, moveId, { today: DAY })
  assert.equal(result.ok, true)
  assert.ok(result.presentationEvents.length >= 2)
  assert.deepEqual(result.presentationEvents.map((event) => event.ordinal), result.presentationEvents.map((_, index) => index))
  assert.equal(new Set(result.presentationEvents.map((event) => event.eventId)).size, result.presentationEvents.length)
  for (const event of result.presentationEvents) {
    assert.equal(event.battleId, battle.battleId)
    assert.equal(event.turn, battle.turn)
    assert.ok(event.eventId.startsWith(`${battle.battleId}:${battle.turn}:`))
  }
})

test('enemy-first semantic transaction exposes enemy events before player events', () => {
  const started = startedBattle()
  const { game, battle } = syncBattle(started, (next) => {
    next.enemy.statMultipliers = { hp: 1, attack: 0.2, defense: 1, speed: 20 }
  })
  const moveId = firstDamageMove(game, battle)
  const result = useMove(game, battle, moveId, { today: DAY })
  assert.equal(result.ok, true)
  const actorMoves = result.presentationEvents.filter((event) => event.kind === 'move').map((event) => event.actor)
  assert.equal(actorMoves[0], 'enemy')
  if (result.battle.partyHp[battle.activeInstanceId] > 0) assert.ok(actorMoves.includes('player'))
})

test('player terminal first action omits enemy action that never occurred', () => {
  const started = startedBattle()
  const { game, battle } = syncBattle(started, (next) => {
    next.enemy.hp = 1
    next.enemy.statMultipliers = { hp: 1, attack: 1, defense: 1, speed: 0.05 }
  })
  const moveId = firstDamageMove(game, battle)
  const result = useMove(game, battle, moveId, { today: DAY })
  assert.equal(result.ok, true)
  assert.equal(result.battle.status, 'won')
  const actorMoves = result.presentationEvents.filter((event) => event.kind === 'move').map((event) => event.actor)
  assert.deepEqual(actorMoves, ['player'])
  assert.ok(result.presentationEvents.some((event) => event.kind === 'defeat' && event.target === 'enemy'))
  assert.ok(result.presentationEvents.some((event) => event.kind === 'reward-marker'))
})

test('damage events carry intermediate HP snapshots from the resolved action', () => {
  const started = startedBattle()
  const { game, battle } = syncBattle(started, (next) => {
    next.enemy.statMultipliers = { hp: 1, attack: 0.2, defense: 1, speed: 0.05 }
  })
  const moveId = firstDamageMove(game, battle)
  const result = useMove(game, battle, moveId, { today: DAY })
  assert.equal(result.ok, true)
  const playerDamage = result.presentationEvents.find((event) => event.actor === 'player' && event.kind === 'damage')
  assert.ok(playerDamage)
  assert.equal(playerDamage.hpBefore, battle.enemy.hp)
  assert.ok(playerDamage.hpAfter <= playerDamage.hpBefore)
  assert.ok(Number.isFinite(playerDamage.effectiveness))
})
