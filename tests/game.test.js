import test from 'node:test'
import assert from 'node:assert/strict'
import { CAPTURE_CONFIG, SPECIES, STAGES, speciesOf } from '../src/game/content.js'
import {
  MAX_CAPTURE_ATTEMPTS,
  abandonBattle,
  attemptCapture,
  canAttemptCapture,
  captureChance,
  clearFinishedBattle,
  currentPlayerHp,
  evolveInstance,
  gainXp,
  isStageUnlocked,
  makeMonster,
  setTeam,
  startBattle,
  statsFor,
  switchBattleMonster,
  totalXpForLevel,
  useMove,
  xpToNext
} from '../src/game/engine.js'
import {
  CURRENT_GAME_VERSION,
  addTickets,
  availableTicketCount,
  createGameState,
  equipHeldItem,
  grantEvolutionItem,
  normalizeGameState
} from '../src/game/progression.js'

const DAY = 2500

function readyGame({ speciesId = 'm004', level = 20, tickets = 5, day = DAY } = {}) {
  let game = createGameState()
  const id = game.activeMonsterId
  game.box[id] = makeMonster(speciesId, level, id)
  game.team = [id]
  game.activeMonsterId = id
  game.dex.seen[speciesId] = true
  game.dex.caught[speciesId] = true
  return addTickets(game, tickets, day)
}

function firstWild() {
  return STAGES.find((stage) => stage.id === 'a1-wild-001')
}

function startReadyBattle(game, day = DAY, stage = firstWild()) {
  const result = startBattle(game, stage.id, { dailyCompleted: true, dailyDay: day, today: day })
  assert.equal(result.ok, true)
  return result
}

test('battle system keeps exactly the reviewed 18 types', async () => {
  const { TYPES } = await import('../src/game/content.js')
  assert.equal(TYPES.length, 18)
  assert.ok(TYPES.some((type) => type.id === 'electric'))
})

test('type chart exposes super effective, resisted and immune outcomes', async () => {
  const { typeEffectiveness } = await import('../src/game/content.js')
  assert.equal(typeEffectiveness('fire', ['grass']), 2)
  assert.equal(typeEffectiveness('fire', ['water']), 0.5)
  assert.equal(typeEffectiveness('electric', ['ground']), 0)
})

test('reviewed XP curve uses cumulative 6*(level-1)^1.9 and caps at level 100', () => {
  assert.equal(totalXpForLevel(1), 0)
  assert.equal(totalXpForLevel(10), Math.round(6 * Math.pow(9, 1.9)))
  assert.equal(xpToNext(100), 0)
  assert.ok(xpToNext(50) > xpToNext(10))
})

test('ticket grants last seven days and expire at the start of day 7', () => {
  const game = addTickets(createGameState(), 3, DAY)
  assert.equal(availableTicketCount(game, DAY), 3)
  assert.equal(availableTicketCount(game, DAY + 6), 3)
  assert.equal(availableTicketCount(game, DAY + 7), 0)
})

test('battle consumes nearest-expiry ticket and persists canonical activeBattle', () => {
  let game = addTickets(createGameState(), 1, DAY - 2)
  game = addTickets(game, 1, DAY)
  const before = availableTicketCount(game, DAY)
  const started = startBattle(game, firstWild().id, { dailyCompleted: true, dailyDay: DAY, today: DAY })
  assert.equal(started.ok, true)
  assert.equal(availableTicketCount(started.game, DAY), before - 1)
  assert.ok(started.game.activeBattle)
  assert.equal(started.game.activeBattle.ticketSource.earnedDay, DAY - 2)
})

test('yesterday daily completion cannot open a new battle after day rollover', () => {
  const game = readyGame({ day: DAY + 1 })
  const started = startBattle(game, firstWild().id, { dailyCompleted: true, dailyDay: DAY, today: DAY + 1 })
  assert.equal(started.ok, false)
  assert.equal(started.reason, 'DAILY_NOT_COMPLETED')
})

test('normal stage soft-scales to current team instead of legacy fixed level', () => {
  const low = startReadyBattle(readyGame({ level: 5 }))
  const high = startReadyBattle(readyGame({ level: 60 }))
  assert.ok(high.battle.enemy.level >= low.battle.enemy.level)
  assert.ok(low.battle.enemy.level >= firstWild().minEnemyLevel)
  assert.ok(high.battle.enemy.level <= firstWild().maxEnemyLevel)
})

test('explicit quit refunds the reserved ticket with original expiry', () => {
  const started = startReadyBattle(readyGame())
  const source = started.battle.ticketSource
  const quit = abandonBattle(started.game, { today: DAY })
  assert.equal(quit.ok, true)
  assert.equal(quit.refunded, true)
  assert.equal(availableTicketCount(quit.game, DAY), 5)
  const restored = quit.game.ticketGrants.find((grant) => grant.id === source.id)
  assert.equal(restored.expiresDay, source.expiresDay)
})

test('loss refunds reserved ticket exactly once', () => {
  let game = readyGame({ level: 1 })
  const started = startReadyBattle(game)
  const battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  battle.enemy.level = 100
  battle.enemy.statMultipliers = { hp: 1, attack: 4, defense: 1, speed: 4 }
  const move = SPECIES[game.box[game.activeMonsterId].speciesId].moves[0]
  const lost = useMove(started.game, battle, move)
  assert.equal(lost.battle.status, 'lost')
  assert.equal(lost.battle.ticketRefunded, true)
  assert.equal(availableTicketCount(lost.game, DAY), 5)
  const cleared = clearFinishedBattle(lost.game, { today: DAY })
  assert.equal(availableTicketCount(cleared.game, DAY), 5)
})

test('win keeps ticket consumed and awards full XP to battle-start team', () => {
  let game = readyGame({ speciesId: 'm004', level: 80 })
  const second = makeMonster('m007', 5, 'second')
  game.box.second = second
  game.team = [game.activeMonsterId, 'second']
  const beforeA = { ...game.box[game.activeMonsterId] }
  const beforeB = { ...game.box.second }
  const started = startReadyBattle(game)
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const move = SPECIES.m004.moves[0]
  const won = useMove(started.game, battle, move)
  assert.equal(won.battle.status, 'won')
  assert.equal(availableTicketCount(won.game, DAY), 4)
  assert.ok(won.game.box[beforeA.instanceId].xp !== beforeA.xp || won.game.box[beforeA.instanceId].level > beforeA.level)
  assert.ok(won.game.box[beforeB.instanceId].xp !== beforeB.xp || won.game.box[beforeB.instanceId].level > beforeB.level)
})

test('switching preserves per-monster HP and fainted monster cannot return', () => {
  let game = readyGame({ speciesId: 'm004', level: 50 })
  game.box.second = makeMonster('m007', 50, 'second')
  game.team = [game.activeMonsterId, 'second']
  const started = startReadyBattle(game)
  const firstId = started.battle.activeInstanceId
  const battle = structuredClone(started.battle)
  battle.partyHp[firstId] = Math.max(1, battle.partyHp[firstId] - 5)
  const firstHp = battle.partyHp[firstId]
  const swapped = switchBattleMonster(started.game, battle, 'second')
  assert.equal(swapped.ok, true)
  assert.equal(swapped.battle.activeInstanceId, 'second')
  assert.equal(swapped.battle.partyHp[firstId], firstHp)
  swapped.battle.partyHp[firstId] = 0
  const back = switchBattleMonster(swapped.game, swapped.battle, firstId)
  assert.equal(back.ok, false)
  assert.equal(back.reason, 'FAINTED')
})

test('healthy teammate changes active faint into needs_switch instead of full loss', () => {
  let game = readyGame({ speciesId: 'm004', level: 1 })
  game.box.second = makeMonster('m007', 80, 'second')
  game.team = [game.activeMonsterId, 'second']
  const started = startReadyBattle(game)
  const battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  battle.enemy.level = 100
  battle.enemy.statMultipliers = { hp: 1, attack: 4, defense: 1, speed: 4 }
  const result = useMove(started.game, battle, SPECIES.m004.moves[0])
  assert.equal(result.battle.status, 'needs_switch')
  assert.ok(result.battle.partyHp.second > 0)
})

test('capture is blocked until enemy HP is 50 percent or lower', () => {
  const started = startReadyBattle(readyGame())
  assert.equal(canAttemptCapture(started.game, started.battle, 'star'), false)
  const battle = structuredClone(started.battle)
  battle.enemy.hp = Math.floor(battle.enemy.maxHp / 2)
  assert.equal(canAttemptCapture(started.game, battle, 'star'), true)
})

test('ring performance is star < silver < gold, rainbow guaranteed, non-rainbow capped at 92%', () => {
  const started = startReadyBattle(readyGame())
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const star = captureChance(battle, 'star')
  const silver = captureChance(battle, 'silver')
  const gold = captureChance(battle, 'gold')
  const rainbow = captureChance(battle, 'rainbow')
  assert.ok(star < silver)
  assert.ok(silver < gold)
  assert.equal(rainbow, 1)
  assert.ok(gold <= CAPTURE_CONFIG.nonRainbowCap)
})

test('rainbow capture succeeds with worst RNG, registers formal species, and captured monster gets no battle XP', () => {
  let game = readyGame({ speciesId: 'm004', level: 50 })
  game.captureItems.rainbow = 1
  const started = startReadyBattle(game)
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const teamBefore = structuredClone(started.game.box[started.game.activeMonsterId])
  const result = attemptCapture(started.game, battle, [1, 1, 1, 1], 'rainbow')
  assert.equal(result.caught, true)
  assert.equal(result.stars, 4)
  assert.equal(result.captured.speciesId, battle.enemy.speciesId)
  assert.equal(result.captured.xp, 0)
  assert.equal(result.game.dex.caught[battle.enemy.speciesId], true)
  assert.ok(result.game.box[teamBefore.instanceId].xp !== teamBefore.xp || result.game.box[teamBefore.instanceId].level > teamBefore.level)
})

test('failed capture consumes turn and one battle allows at most three attempts', () => {
  let started = startReadyBattle(readyGame({ level: 80 }))
  let battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  let game = started.game
  const turn = battle.turn
  for (let i = 0; i < MAX_CAPTURE_ATTEMPTS; i += 1) {
    const result = attemptCapture(game, battle, [1, 1, 1, 1], 'star')
    assert.equal(result.ok, true)
    assert.equal(result.caught, false)
    game = result.game
    battle = result.battle
    if (battle.status !== 'fighting') break
  }
  assert.ok(battle.turn > turn)
  if (battle.status === 'fighting') assert.equal(canAttemptCapture(game, battle, 'star'), false)
})

test('team setter enforces hard maximum of three monsters', () => {
  const game = createGameState()
  for (let i = 2; i <= 5; i += 1) game.box[`m${i}`] = makeMonster('m007', 5, `m${i}`)
  const result = setTeam(game, [game.activeMonsterId, 'm2', 'm3', 'm4'])
  assert.equal(result.ok, true)
  assert.equal(result.game.team.length, 3)
})

test('formal species master includes level, stone, and held-item actual-levelup evolution methods', () => {
  const methods = new Set(Object.values(SPECIES).map((species) => species.evolution?.method).filter(Boolean))
  assert.ok(methods.has('level'))
  assert.ok(methods.has('stone'))
  assert.ok(methods.has('held_item_levelup'))
})

test('generic held-item condition requires evolutionReady', () => {
  const species = Object.values(SPECIES).find((entry) => entry.evolution?.method === 'held_item_levelup')
  assert.ok(species)
  const monster = makeMonster(species.id, 50, 'held-generic')
  monster.heldItemId = species.evolution.heldItemId
  const game = createGameState()
  game.box = { [monster.instanceId]: monster }
  game.team = [monster.instanceId]
  game.activeMonsterId = monster.instanceId
  const before = evolveInstance(game, monster.instanceId)
  assert.equal(before.ok, false)
  monster.evolutionReady = true
  const after = evolveInstance({ ...game, box: { [monster.instanceId]: monster } }, monster.instanceId)
  assert.equal(after.ok, true)
})

test('formal level evolution preserves monster instance and follows canonical level', () => {
  const source = Object.values(SPECIES).find((entry) => entry.evolution?.method === 'level')
  const game = createGameState()
  const id = game.activeMonsterId
  game.box[id] = makeMonster(source.id, source.evolution.level, id)
  game.dex.caught[source.id] = true
  const result = evolveInstance(game, id)
  assert.equal(result.ok, true)
  assert.equal(result.game.box[id].instanceId, id)
  assert.equal(result.game.box[id].speciesId, source.evolution.to)
})

test('formal stone evolution works E2E and consumes exactly one stone', () => {
  const source = Object.values(SPECIES).find((entry) => entry.evolution?.method === 'stone')
  let game = createGameState()
  const id = game.activeMonsterId
  game.box[id] = makeMonster(source.id, 20, id)
  game.dex.caught[source.id] = true
  const granted = grantEvolutionItem(game, 'stone', source.evolution.itemId, 1, DAY)
  game = granted.game
  const result = evolveInstance(game, id)
  assert.equal(result.ok, true)
  assert.equal(result.game.box[id].speciesId, source.evolution.to)
  assert.equal(result.game.evolutionItems.stones[source.evolution.itemId] || 0, 0)
})

test('formal held-item evolution needs an actual level-up after equipping and keeps item after evolution', () => {
  const source = Object.values(SPECIES).find((entry) => entry.evolution?.method === 'held_item_levelup')
  let game = createGameState()
  const id = game.activeMonsterId
  game.box[id] = makeMonster(source.id, 20, id)
  game.dex.caught[source.id] = true
  game = grantEvolutionItem(game, 'held', source.evolution.heldItemId, 1, DAY).game
  game = equipHeldItem(game, id, source.evolution.heldItemId, DAY).game
  assert.equal(evolveInstance(game, id).ok, false)
  const levelled = gainXp(game.box[id], xpToNext(game.box[id].level))
  game.box[id] = levelled.monster
  assert.equal(game.box[id].evolutionReady, true)
  const evolved = evolveInstance(game, id)
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box[id].heldItemId, source.evolution.heldItemId)
  assert.equal(evolved.game.box[id].evolutionReady, false)
})

test('legacy v1 save migrates to formal IDs without stale Star Awakening fields', () => {
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
  assert.equal(migrated.version, CURRENT_GAME_VERSION)
  assert.equal(CURRENT_GAME_VERSION, 9)
  assert.equal(availableTicketCount(migrated, day), 7)
  assert.equal(availableTicketCount(migrated, day + 7), 0)
  assert.equal(migrated.box[migrated.activeMonsterId].speciesId, 'm005')
  assert.equal('starShards' in migrated, false)
  assert.equal('gigaCores' in migrated, false)
  assert.deepEqual(migrated.gigaCoreSpecies, {})
  assert.deepEqual(migrated.burstMarks, {})
})

test('version-6 placeholder species migrate to matching formal species', () => {
  const saved = createGameState()
  saved.version = 6
  saved.box = {
    x: { instanceId: 'x', speciesId: 'wild-electric-2', level: 22, xp: 7, heldItemId: null, evolutionReady: false, caughtAt: 1 }
  }
  saved.team = ['x']
  saved.activeMonsterId = 'x'
  saved.dex = { seen: { 'wild-electric-2': true }, caught: { 'wild-electric-2': true } }
  const migrated = normalizeGameState(saved, DAY)
  assert.equal(migrated.box.x.speciesId, 'm026')
  assert.equal(migrated.dex.caught.m026, true)
})

test('unknown or removed species in save are discarded instead of crashing later', () => {
  const saved = createGameState()
  saved.box.bad = { instanceId: 'bad', speciesId: 'does-not-exist', level: 20, xp: 0 }
  saved.team = ['bad', saved.activeMonsterId]
  const migrated = normalizeGameState(saved, DAY)
  assert.equal(migrated.box.bad, undefined)
  assert.ok(migrated.team.every((id) => migrated.box[id]))
})
