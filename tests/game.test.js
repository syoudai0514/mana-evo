import test from 'node:test'
import assert from 'node:assert/strict'

import { TYPES, typeEffectiveness } from '../src/game/content.js'
import {
  MAX_CAPTURE_ATTEMPTS,
  abandonBattle,
  attemptCapture,
  canAttemptCapture,
  canNormalEvolve,
  clearFinishedBattle,
  currentPlayerHp,
  evolutionConditionMet,
  evolveInstance,
  makeMonster,
  setTeam,
  startBattle,
  switchBattleMonster,
  useMove
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

test('starting a fixed stage consumes one ticket, persists activeBattle and does not scale enemy', () => {
  let game = addTickets(createGameState(), 1)
  game.box[game.activeMonsterId].level = 50
  const result = startBattle(game, '1-1')
  assert.equal(result.ok, true)
  assert.equal(result.game.tickets, 0)
  assert.equal(result.battle.enemy.level, 5)
  assert.deepEqual(result.game.activeBattle, result.battle)
})

test('reload normalization preserves an active battle so ticket is not silently lost', () => {
  const started = startBattle(addTickets(createGameState(), 1), '1-1')
  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(started.game)))
  assert.equal(reloaded.tickets, 0)
  assert.equal(reloaded.activeBattle?.stageId, '1-1')
  assert.equal(reloaded.activeBattle?.turn, started.battle.turn)
})

test('switch away and back preserves per-monster HP instead of full-healing', () => {
  let game = createGameState()
  const teammate = makeMonster('wild-water-1', 5, 'w1')
  game.box.w1 = teammate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = startBattle(addTickets(game, 1), '1-1')
  const starterId = started.battle.activeInstanceId
  const hurt = structuredClone(started.battle)
  hurt.partyHp[starterId] = 10
  let currentGame = { ...started.game, activeBattle: hurt }
  const toMate = switchBattleMonster(currentGame, hurt, 'w1')
  assert.equal(toMate.ok, true)
  const back = switchBattleMonster(toMate.game, toMate.battle, starterId)
  assert.equal(back.ok, true)
  assert.ok(back.battle.partyHp[starterId] <= 10, 'starter must not heal by switching')
})

test('fainted monster cannot be restored by switching', () => {
  let game = createGameState()
  const teammate = makeMonster('wild-water-1', 5, 'w1')
  game.box.w1 = teammate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = startBattle(addTickets(game, 1), '1-1')
  const battle = structuredClone(started.battle)
  battle.partyHp.w1 = 0
  const result = switchBattleMonster(started.game, battle, 'w1')
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'FAINTED')
})

test('healthy teammate prevents immediate loss when active monster faints', () => {
  let game = createGameState()
  const teammate = makeMonster('wild-water-1', 5, 'w1')
  game.box.w1 = teammate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = startBattle(addTickets(game, 1), '1-1')
  const battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  const result = useMove(started.game, battle, 'tackle')
  assert.equal(result.ok, true)
  if (currentPlayerHp(result.battle) === 0) assert.equal(result.battle.status, 'needs_switch')
})

test('capture is blocked until enemy HP is 50 percent or lower', () => {
  const started = startBattle(addTickets(createGameState(), 1), '1-1')
  assert.equal(canAttemptCapture(started.game, started.battle, 'star'), false)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = Math.floor(weakened.enemy.maxHp / 2)
  assert.equal(canAttemptCapture(started.game, weakened, 'star'), true)
})

test('four successful checks capture, consume selected ring and register dex', () => {
  const started = startBattle(addTickets(createGameState(), 1), '1-1')
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  const ringsBefore = started.game.captureItems.star
  const result = attemptCapture(started.game, weakened, [0, 0, 0, 0], 'star')
  assert.equal(result.ok, true)
  assert.equal(result.caught, true)
  assert.equal(result.stars, 4)
  assert.equal(result.game.captureItems.star, ringsBefore - 1)
  assert.equal(result.game.dex.caught['wild-grass-1'], true)
  assert.ok(Object.values(result.game.box).some((monster) => monster.speciesId === 'wild-grass-1'))
})

test('capture inventory has four types, failed capture consumes turn, and one battle allows max three attempts', () => {
  let started = startBattle(addTickets(createGameState(), 1), '1-1')
  assert.deepEqual(Object.keys(started.game.captureItems).sort(), ['gold', 'rainbow', 'silver', 'star'])
  let battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  let game = started.game
  const initialTurn = battle.turn
  for (let i = 0; i < MAX_CAPTURE_ATTEMPTS; i++) {
    const result = attemptCapture(game, battle, [1, 1, 1, 1], 'star')
    assert.equal(result.ok, true)
    assert.equal(result.caught, false)
    game = result.game
    battle = result.battle
    if (['lost', 'needs_switch'].includes(battle.status)) break
  }
  if (battle.status === 'fighting') {
    assert.equal(battle.captureAttempts, 3)
    assert.ok(battle.turn > initialTurn)
    const fourth = attemptCapture(game, battle, [1, 1, 1, 1], 'star')
    assert.equal(fourth.ok, false)
    assert.equal(fourth.reason, 'CAPTURE_LIMIT')
  }
})

test('team setter enforces a hard maximum of three monsters', () => {
  const game = createGameState()
  const extra = [makeMonster('wild-grass-1', 5, 'g1'), makeMonster('wild-water-1', 5, 'w1'), makeMonster('wild-electric-1', 5, 'e1')]
  for (const monster of extra) game.box[monster.instanceId] = monster
  const result = setTeam(game, [game.activeMonsterId, 'g1', 'w1', 'e1'])
  assert.equal(result.ok, true)
  assert.equal(result.game.team.length, 3)
})

test('generic evolution conditions support level, stone and held-item+level without hardcoding species logic', () => {
  const monster = makeMonster('wild-grass-1', 10, 'g1')
  assert.equal(evolutionConditionMet(monster, { evolution: { to: 'x', method: 'level', level: 10 } }, {}), true)
  assert.equal(evolutionConditionMet(monster, { evolution: { to: 'x', method: 'stone', itemId: 'moon' } }, { evolutionItems: { stones: { moon: 1 } } }), true)
  assert.equal(evolutionConditionMet({ ...monster, heldItemId: 'seed' }, { evolution: { to: 'x', method: 'held_item_level', heldItemId: 'seed', level: 10 } }, {}), true)
})

test('normal level evolution preserves the same monster instance', () => {
  const game = createGameState()
  const id = game.activeMonsterId
  game.box[id].level = 8
  assert.equal(canNormalEvolve(game.box[id], game), true)
  const result = evolveInstance(game, id)
  assert.equal(result.ok, true)
  assert.equal(result.game.box[id].instanceId, id)
  assert.equal(result.game.box[id].speciesId, 'starter-fire-2')
  assert.equal(result.game.dex.caught['starter-fire-2'], true)
})

test('active battle can be explicitly abandoned or cleared after finish', () => {
  const started = startBattle(addTickets(createGameState(), 1), '1-1')
  const abandoned = abandonBattle(started.game)
  assert.equal(abandoned.ok, true)
  assert.equal(abandoned.game.activeBattle, null)
  assert.equal(abandoned.game.tickets, 0)

  const finishedGame = structuredClone(started.game)
  finishedGame.activeBattle.status = 'lost'
  const cleared = clearFinishedBattle(finishedGame)
  assert.equal(cleared.ok, true)
  assert.equal(cleared.game.activeBattle, null)
})

test('legacy v1 save migrates without stale Star Awakening and into permanent special ownership shape', () => {
  const legacy = {
    tickets: 7,
    mana: 90,
    starShards: 9,
    gigaStones: 4,
    burstCores: 2,
    battlesWon: 6,
    activeMonsterId: 'starter-001',
    monsters: { 'starter-001': { monsterId: 'starter-001', level: 12, xp: 17, stage: 2, starAwakened: true } }
  }
  const migrated = normalizeGameState(legacy)
  assert.equal(migrated.version, 3)
  assert.equal(migrated.tickets, 7)
  assert.equal(migrated.mana, 90)
  assert.equal(migrated.battlesWon, 6)
  assert.equal(migrated.box[migrated.activeMonsterId].speciesId, 'starter-fire-2')
  assert.equal('starShards' in migrated, false)
  assert.equal('gigaCores' in migrated, false)
  assert.deepEqual(migrated.gigaCoreSpecies, {})
  assert.deepEqual(migrated.burstMarks, {})
})

test('unknown or removed species in save are discarded instead of crashing later', () => {
  const saved = createGameState()
  saved.box.bad = { instanceId: 'bad', speciesId: 'removed-species', level: 99, xp: 0 }
  saved.team = ['bad', saved.activeMonsterId]
  saved.activeMonsterId = 'bad'
  const normalized = normalizeGameState(saved)
  assert.equal(normalized.box.bad, undefined)
  assert.ok(normalized.box[normalized.activeMonsterId])
})
