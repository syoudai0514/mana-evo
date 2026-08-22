import test from 'node:test'
import assert from 'node:assert/strict'

import { TYPES, typeEffectiveness } from '../src/game/content.js'
import {
  attemptCapture,
  canAttemptCapture,
  canNormalEvolve,
  evolveInstance,
  makeMonster,
  setTeam,
  startBattle
} from '../src/game/engine.js'
import { addTickets, createGameState, normalizeGameState } from '../src/game/progression.js'

test('battle system keeps exactly the 18 final-review types', () => {
  assert.equal(TYPES.length, 18)
  assert.equal(new Set(TYPES.map((type) => type.id)).size, 18)
  assert.ok(TYPES.some((type) => type.id === 'electric'))
  assert.ok(TYPES.some((type) => type.id === 'fairy'))
})

test('type chart exposes super effective, resisted and immune outcomes', () => {
  assert.equal(typeEffectiveness('fire', ['grass']), 2)
  assert.equal(typeEffectiveness('fire', ['water']), 0.5)
  assert.equal(typeEffectiveness('electric', ['ground']), 0)
  assert.equal(typeEffectiveness('ice', ['dragon']), 2)
})

test('starting a fixed stage consumes one ticket and does not scale enemy to player', () => {
  let game = addTickets(createGameState(), 1)
  game.box[game.activeMonsterId].level = 50
  const result = startBattle(game, '1-1')
  assert.equal(result.ok, true)
  assert.equal(result.game.tickets, 0)
  assert.equal(result.battle.enemy.level, 5)
})

test('capture is blocked until enemy HP is 50 percent or lower', () => {
  const game = addTickets(createGameState(), 1)
  const started = startBattle(game, '1-1')
  assert.equal(canAttemptCapture(started.game, started.battle), false)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = Math.floor(weakened.enemy.maxHp / 2)
  assert.equal(canAttemptCapture(started.game, weakened), true)
})

test('four successful ring checks capture the monster, consume one ring and register dex', () => {
  const game = addTickets(createGameState(), 1)
  const started = startBattle(game, '1-1')
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  const ringsBefore = started.game.captureRings
  const result = attemptCapture(started.game, weakened, [0, 0, 0, 0])
  assert.equal(result.ok, true)
  assert.equal(result.caught, true)
  assert.equal(result.stars, 4)
  assert.equal(result.game.captureRings, ringsBefore - 1)
  assert.equal(result.game.dex.caught['wild-grass-1'], true)
  assert.ok(Object.values(result.game.box).some((monster) => monster.speciesId === 'wild-grass-1'))
  assert.equal(result.game.team.length, 2)
})

test('team setter enforces a hard maximum of three monsters', () => {
  const game = createGameState()
  const extra = [
    makeMonster('wild-grass-1', 5, 'g1'),
    makeMonster('wild-water-1', 5, 'w1'),
    makeMonster('wild-electric-1', 5, 'e1')
  ]
  for (const monster of extra) game.box[monster.instanceId] = monster
  const result = setTeam(game, [game.activeMonsterId, 'g1', 'w1', 'e1'])
  assert.equal(result.ok, true)
  assert.equal(result.game.team.length, 3)
})

test('normal evolution uses level condition and preserves the same monster instance', () => {
  const game = createGameState()
  const id = game.activeMonsterId
  game.box[id].level = 8
  assert.equal(canNormalEvolve(game.box[id]), true)
  const result = evolveInstance(game, id)
  assert.equal(result.ok, true)
  assert.equal(result.game.box[id].instanceId, id)
  assert.equal(result.game.box[id].speciesId, 'starter-fire-2')
  assert.equal(result.game.dex.caught['starter-fire-2'], true)
})

test('legacy v1 save migrates without carrying stale Star Awakening progression', () => {
  const legacy = {
    tickets: 7,
    mana: 90,
    starShards: 9,
    gigaStones: 4,
    burstCores: 2,
    battlesWon: 6,
    activeMonsterId: 'starter-001',
    monsters: {
      'starter-001': { monsterId: 'starter-001', level: 12, xp: 17, stage: 2, starAwakened: true }
    }
  }
  const migrated = normalizeGameState(legacy)
  assert.equal(migrated.version, 2)
  assert.equal(migrated.tickets, 7)
  assert.equal(migrated.mana, 90)
  assert.equal(migrated.battlesWon, 6)
  assert.equal(migrated.box[migrated.activeMonsterId].level, 12)
  assert.equal(migrated.box[migrated.activeMonsterId].speciesId, 'starter-fire-2')
  assert.equal('starShards' in migrated, false)
  assert.equal('starAwakened' in migrated.box[migrated.activeMonsterId], false)
})
