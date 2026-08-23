import test from 'node:test'
import assert from 'node:assert/strict'

import { CAPTURE_CONFIG, SPECIES, TYPES, typeEffectiveness } from '../src/game/content.js'
import {
  MAX_CAPTURE_ATTEMPTS,
  abandonBattle,
  attemptCapture,
  canAttemptCapture,
  canNormalEvolve,
  captureChance,
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
import {
  TICKET_TTL_DAYS,
  addTickets,
  availableTicketCount,
  createGameState,
  equipHeldItem,
  grantEvolutionItem,
  normalizeGameState
} from '../src/game/progression.js'

const start = (game, stageId = '1-1', today = 100) => startBattle(game, stageId, { dailyCompleted: true, today })

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

test('ticket grants last seven days and expire at the start of day 7', () => {
  const day = 1000
  const game = addTickets(createGameState(), 3, day)
  assert.equal(TICKET_TTL_DAYS, 7)
  assert.equal(availableTicketCount(game, day + 6), 3)
  assert.equal(availableTicketCount(game, day + 7), 0)
  assert.equal(normalizeGameState(game, day + 7).ticketGrants.length, 0)
  assert.equal(normalizeGameState(game, day + 7).captureItems.star, game.captureItems.star, 'rings never expire with tickets')
})

test('battle consumes the nearest-expiry ticket first and records its source', () => {
  const day = 1100
  let game = addTickets(createGameState(), 1, day)
  game = addTickets(game, 1, day + 2)
  const firstExpiry = game.ticketGrants[0].expiresDay
  const result = start(game, '1-1', day + 2)
  assert.equal(result.ok, true)
  assert.equal(result.battle.ticketSource.expiresDay, firstExpiry)
  assert.equal(availableTicketCount(result.game, day + 2), 1)
})

test('starting a fixed stage persists activeBattle and does not scale enemy', () => {
  const day = 1200
  let game = addTickets(createGameState(), 1, day)
  game.box[game.activeMonsterId].level = 50
  const result = start(game, '1-1', day)
  assert.equal(result.ok, true)
  assert.equal(availableTicketCount(result.game, day), 0)
  assert.equal(result.battle.enemy.level, 5)
  assert.deepEqual(result.game.activeBattle, result.battle)
})

test('reload normalization preserves an active battle so no second ticket is consumed', () => {
  const day = 1300
  const started = start(addTickets(createGameState(), 1, day), '1-1', day)
  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(started.game)), day + 1)
  assert.equal(availableTicketCount(reloaded, day + 1), 0)
  assert.equal(reloaded.activeBattle?.stageId, '1-1')
  assert.equal(reloaded.activeBattle?.turn, started.battle.turn)
  assert.equal(reloaded.activeBattle?.ticketSource?.expiresDay, started.battle.ticketSource.expiresDay)
})

test('explicit quit refunds the reserved ticket with its original expiry', () => {
  const day = 1400
  const started = start(addTickets(createGameState(), 1, day), '1-1', day)
  const source = started.battle.ticketSource
  const abandoned = abandonBattle(started.game, { today: day })
  assert.equal(abandoned.ok, true)
  assert.equal(abandoned.refunded, true)
  assert.equal(abandoned.game.activeBattle, null)
  assert.equal(availableTicketCount(abandoned.game, day), 1)
  assert.equal(abandoned.game.ticketGrants[0].expiresDay, source.expiresDay)
})

test('loss refunds the reserved ticket exactly once', () => {
  const now = new Date()
  const day = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000)
  let game = createGameState()
  game.box[game.activeMonsterId].level = 1
  game.box[game.activeMonsterId].speciesId = 'wild-bug-1'
  const started = start(addTickets(game, 1, day), '1-1', day)
  let battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  const result = useMove(started.game, battle, 'tackle')
  assert.equal(result.battle.status, 'lost')
  assert.equal(result.battle.ticketRefunded, true)
  assert.equal(availableTicketCount(result.game, day), 1)
  const cleared = clearFinishedBattle(result.game, { today: day })
  assert.equal(availableTicketCount(cleared.game, day), 1)
})

test('win keeps the ticket consumed', () => {
  const day = 1600
  let game = createGameState()
  game.box[game.activeMonsterId].level = 100
  const started = start(addTickets(game, 1, day), '1-1', day)
  let state = started
  for (let i = 0; i < 20 && state.battle.status === 'fighting'; i++) state = useMove(state.game, state.battle, 'flameRush')
  assert.equal(state.battle.status, 'won')
  assert.equal(availableTicketCount(state.game, day), 0)
})

test('switch away and back preserves per-monster HP instead of full-healing', () => {
  const day = 1700
  let game = createGameState()
  const teammate = makeMonster('wild-water-1', 5, 'w1')
  game.box.w1 = teammate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = start(addTickets(game, 1, day), '1-1', day)
  const starterId = started.battle.activeInstanceId
  const hurt = structuredClone(started.battle)
  hurt.partyHp[starterId] = 10
  const toMate = switchBattleMonster(started.game, hurt, 'w1')
  assert.equal(toMate.ok, true)
  if (toMate.battle.status !== 'lost' && toMate.battle.status !== 'needs_switch') {
    const back = switchBattleMonster(toMate.game, toMate.battle, starterId)
    assert.equal(back.ok, true)
    assert.ok(back.battle.partyHp[starterId] <= 10, 'starter must not heal by switching')
  }
})

test('fainted monster cannot be restored by switching', () => {
  const day = 1800
  let game = createGameState()
  const teammate = makeMonster('wild-water-1', 5, 'w1')
  game.box.w1 = teammate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = start(addTickets(game, 1, day), '1-1', day)
  const battle = structuredClone(started.battle)
  battle.partyHp.w1 = 0
  const result = switchBattleMonster(started.game, battle, 'w1')
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'FAINTED')
})

test('healthy teammate prevents immediate full-party loss when active monster faints', () => {
  const day = 1900
  let game = createGameState()
  const teammate = makeMonster('wild-water-1', 5, 'w1')
  game.box.w1 = teammate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = start(addTickets(game, 1, day), '1-1', day)
  const battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  const result = useMove(started.game, battle, 'tackle')
  assert.equal(result.ok, true)
  if (currentPlayerHp(result.battle) === 0) assert.equal(result.battle.status, 'needs_switch')
})

test('capture is blocked until enemy HP is 50 percent or lower', () => {
  const day = 2000
  const started = start(addTickets(createGameState(), 1, day), '1-1', day)
  assert.equal(canAttemptCapture(started.game, started.battle, 'star'), false)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = Math.floor(weakened.enemy.maxHp / 2)
  assert.equal(canAttemptCapture(started.game, weakened, 'star'), true)
})

test('ring performance is star < silver < gold, rainbow is guaranteed and non-rainbow caps at 92%', () => {
  const day = 2100
  const started = start(addTickets(createGameState(), 1, day), '1-1', day)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  const star = captureChance(weakened, 'star')
  const silver = captureChance(weakened, 'silver')
  const gold = captureChance(weakened, 'gold')
  const rainbow = captureChance(weakened, 'rainbow')
  assert.equal(CAPTURE_CONFIG.star.multiplier, 1)
  assert.equal(CAPTURE_CONFIG.silver.multiplier, 1.2)
  assert.equal(CAPTURE_CONFIG.gold.multiplier, 1.5)
  assert.ok(star < silver)
  assert.ok(silver <= gold)
  assert.ok(gold <= 0.92)
  assert.equal(rainbow, 1)
})

test('rainbow ring captures even with worst RNG and keeps battle ticket consumed', () => {
  const day = 2200
  let game = createGameState()
  game.captureItems.rainbow = 1
  const started = start(addTickets(game, 1, day), '1-1', day)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  const result = attemptCapture(started.game, weakened, [1, 1, 1, 1], 'rainbow')
  assert.equal(result.ok, true)
  assert.equal(result.caught, true)
  assert.equal(result.game.captureItems.rainbow, 0)
  assert.equal(availableTicketCount(result.game, day), 0)
})

test('four successful checks capture, consume selected ring and register dex', () => {
  const day = 2300
  const started = start(addTickets(createGameState(), 1, day), '1-1', day)
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
  const day = 2400
  const started = start(addTickets(createGameState(), 1, day), '1-1', day)
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

test('real species master includes level, stone, and held-item+level evolution methods', () => {
  const methods = new Set(Object.values(SPECIES).map((species) => species.evolution?.method).filter(Boolean))
  assert.ok(methods.has('level'))
  assert.ok(methods.has('stone'))
  assert.ok(methods.has('held_item_level'))
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

test('stone evolution works E2E and consumes exactly one stone', () => {
  let game = createGameState()
  const monster = makeMonster('wild-stone-1', 9, 'stone-1')
  game.box[monster.instanceId] = monster
  game.team = [monster.instanceId]
  game.activeMonsterId = monster.instanceId
  game = grantEvolutionItem(game, 'stone', 'glow-stone', 1, 2500).game
  assert.equal(canNormalEvolve(game.box['stone-1'], game), true)
  const evolved = evolveInstance(game, 'stone-1')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box['stone-1'].speciesId, 'wild-stone-2')
  assert.equal(evolved.game.evolutionItems.stones['glow-stone'], undefined)
})

test('held-item+level evolution works E2E and equipped item remains after evolution', () => {
  let game = createGameState()
  const monster = makeMonster('wild-charm-1', 10, 'charm-1')
  game.box[monster.instanceId] = monster
  game.team = [monster.instanceId]
  game.activeMonsterId = monster.instanceId
  game = grantEvolutionItem(game, 'held', 'bond-charm', 1, 2600).game
  game = equipHeldItem(game, 'charm-1', 'bond-charm', 2600).game
  assert.equal(canNormalEvolve(game.box['charm-1'], game), true)
  const evolved = evolveInstance(game, 'charm-1')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box['charm-1'].speciesId, 'wild-charm-2')
  assert.equal(evolved.game.box['charm-1'].heldItemId, 'bond-charm')
})

test('legacy v1 save migrates without stale Star Awakening and with seven-day ticket inventory', () => {
  const day = 2700
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
  const migrated = normalizeGameState(legacy, day)
  assert.equal(migrated.version, 4)
  assert.equal(availableTicketCount(migrated, day), 7)
  assert.equal(availableTicketCount(migrated, day + 6), 7)
  assert.equal(availableTicketCount(migrated, day + 7), 0)
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
  const normalized = normalizeGameState(saved, 2800)
  assert.equal(normalized.box.bad, undefined)
  assert.ok(normalized.box[normalized.activeMonsterId])
})
