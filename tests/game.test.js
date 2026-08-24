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
  gainXp,
  makeMonster,
  setTeam,
  startBattle,
  switchBattleMonster,
  totalXpForLevel,
  useMove,
  xpToNext
} from '../src/game/engine.js'
import {
  CURRENT_GAME_VERSION,
  TICKET_TTL_DAYS,
  addTickets,
  availableTicketCount,
  createGameState,
  equipHeldItem,
  grantEvolutionItem,
  normalizeGameState
} from '../src/game/progression.js'

const STAGE = 'a1-wild-001'
const start = (game, stageId = STAGE, today = 100) => startBattle(game, stageId, { dailyCompleted: true, today })

test('battle system keeps exactly the reviewed 18 types', () => {
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

test('reviewed XP curve uses cumulative 6*(level-1)^1.9 and caps at level 100', () => {
  assert.equal(totalXpForLevel(1), 0)
  assert.equal(totalXpForLevel(2), 6)
  assert.equal(xpToNext(1), 6)
  assert.equal(xpToNext(100), 0)
  assert.ok(xpToNext(30) > xpToNext(10))
})

test('ticket grants last seven days and expire at the start of day 7', () => {
  const day = 1000
  const game = addTickets(createGameState(), 3, day)
  assert.equal(TICKET_TTL_DAYS, 7)
  assert.equal(availableTicketCount(game, day + 6), 3)
  assert.equal(availableTicketCount(game, day + 7), 0)
  assert.equal(normalizeGameState(game, day + 7).ticketGrants.length, 0)
  assert.equal(normalizeGameState(game, day + 7).captureItems.star, game.captureItems.star)
})

test('battle consumes nearest-expiry ticket and persists canonical activeBattle', () => {
  const day = 1100
  let game = addTickets(createGameState(), 1, day)
  game = addTickets(game, 1, day + 2)
  const firstExpiry = game.ticketGrants[0].expiresDay
  const result = start(game, STAGE, day + 2)
  assert.equal(result.ok, true)
  assert.equal(result.battle.ticketSource.expiresDay, firstExpiry)
  assert.equal(result.battle.enemy.speciesId, 'm001')
  assert.equal(availableTicketCount(result.game, day + 2), 1)
  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(result.game)), day + 2)
  assert.equal(reloaded.activeBattle.stageId, STAGE)
  assert.equal(reloaded.activeBattle.enemy.speciesId, 'm001')
})

test('yesterday daily completion cannot open a new battle after day rollover', () => {
  const day = 1150
  const game = addTickets(createGameState(), 1, day)
  const blocked = startBattle(game, STAGE, { dailyCompleted: true, dailyDay: day, today: day + 1 })
  assert.equal(blocked.ok, false)
  assert.equal(blocked.reason, 'DAILY_NOT_COMPLETED')
  assert.equal(availableTicketCount(blocked.game, day + 1), 1)
})

test('normal stage soft-scales to current team instead of legacy fixed level', () => {
  const day = 1200
  let game = addTickets(createGameState(), 1, day)
  game.box[game.activeMonsterId].level = 50
  const result = start(game, STAGE, day)
  assert.equal(result.ok, true)
  assert.equal(result.battle.enemy.balance.mode, 'normal-soft')
  assert.ok(result.battle.enemy.level > 5)
  assert.deepEqual(result.battle.teamAtStart, [game.activeMonsterId])
})

test('explicit quit refunds the reserved ticket with original expiry', () => {
  const day = 1400
  const started = start(addTickets(createGameState(), 1, day), STAGE, day)
  const source = started.battle.ticketSource
  const abandoned = abandonBattle(started.game, { today: day })
  assert.equal(abandoned.ok, true)
  assert.equal(abandoned.refunded, true)
  assert.equal(abandoned.game.activeBattle, null)
  assert.equal(availableTicketCount(abandoned.game, day), 1)
  assert.equal(abandoned.game.ticketGrants[0].expiresDay, source.expiresDay)
})

test('loss refunds reserved ticket exactly once', () => {
  const day = 1500
  let game = createGameState()
  game.box[game.activeMonsterId].level = 1
  const started = start(addTickets(game, 1, day), STAGE, day)
  const battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  const result = useMove(started.game, battle, 'm004-stable')
  assert.equal(result.battle.status, 'lost')
  assert.equal(result.battle.ticketRefunded, true)
  assert.equal(availableTicketCount(result.game, day), 1)
  const cleared = clearFinishedBattle(result.game, { today: day })
  assert.equal(availableTicketCount(cleared.game, day), 1)
})

test('win keeps ticket consumed and awards full XP to battle-start team', () => {
  const day = 1600
  let game = createGameState()
  const mate = makeMonster('m007', 5, 'w1')
  game.box.w1 = mate
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const before = Object.fromEntries(game.team.map((id) => [id, { level: game.box[id].level, xp: game.box[id].xp }]))
  const started = start(addTickets(game, 1, day), STAGE, day)
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const result = useMove(started.game, battle, 'm004-stable')
  assert.equal(result.battle.status, 'won')
  assert.equal(result.rewards.xp, 110)
  assert.equal(availableTicketCount(result.game, day), 0)
  for (const id of started.battle.teamAtStart) {
    assert.ok(result.game.box[id].level > before[id].level || result.game.box[id].xp > before[id].xp)
    assert.ok(id in result.rewards.levelsByInstance)
  }
})

test('switching preserves per-monster HP and fainted monster cannot return', () => {
  const day = 1700
  let game = createGameState()
  game.box.w1 = makeMonster('m007', 5, 'w1')
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = start(addTickets(game, 1, day), STAGE, day)
  const starterId = started.battle.activeInstanceId
  const hurt = structuredClone(started.battle)
  hurt.partyHp[starterId] = 10
  const toMate = switchBattleMonster(started.game, hurt, 'w1')
  assert.equal(toMate.ok, true)
  if (toMate.battle.status === 'fighting') {
    const back = switchBattleMonster(toMate.game, toMate.battle, starterId)
    assert.equal(back.ok, true)
    assert.ok(back.battle.partyHp[starterId] <= 10)
  }
  const fainted = structuredClone(started.battle)
  fainted.partyHp.w1 = 0
  const blocked = switchBattleMonster(started.game, fainted, 'w1')
  assert.equal(blocked.ok, false)
  assert.equal(blocked.reason, 'FAINTED')
})

test('healthy teammate changes active faint into needs_switch instead of full loss', () => {
  const day = 1800
  let game = createGameState()
  game.box.w1 = makeMonster('m007', 5, 'w1')
  game = setTeam(game, [game.activeMonsterId, 'w1']).game
  const started = start(addTickets(game, 1, day), STAGE, day)
  const battle = structuredClone(started.battle)
  battle.partyHp[battle.activeInstanceId] = 1
  const result = useMove(started.game, battle, 'm004-stable')
  assert.equal(result.ok, true)
  if (currentPlayerHp(result.battle) === 0) assert.equal(result.battle.status, 'needs_switch')
})

test('capture is blocked until enemy HP is 50 percent or lower', () => {
  const day = 2000
  const started = start(addTickets(createGameState(), 1, day), STAGE, day)
  assert.equal(canAttemptCapture(started.game, started.battle, 'star'), false)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = Math.floor(weakened.enemy.maxHp / 2)
  assert.equal(canAttemptCapture(started.game, weakened, 'star'), true)
})

test('ring performance is star < silver < gold, rainbow guaranteed, non-rainbow capped at 92%', () => {
  const day = 2100
  const started = start(addTickets(createGameState(), 1, day), STAGE, day)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  const star = captureChance(weakened, 'star')
  const silver = captureChance(weakened, 'silver')
  const gold = captureChance(weakened, 'gold')
  assert.equal(CAPTURE_CONFIG.star.multiplier, 1)
  assert.equal(CAPTURE_CONFIG.silver.multiplier, 1.2)
  assert.equal(CAPTURE_CONFIG.gold.multiplier, 1.5)
  assert.ok(star < silver)
  assert.ok(silver <= gold)
  assert.ok(gold <= 0.92)
  assert.equal(captureChance(weakened, 'rainbow'), 1)
})

test('rainbow capture succeeds with worst RNG, registers formal species, and captured monster gets no battle XP', () => {
  const day = 2200
  let game = createGameState()
  game.captureItems.rainbow = 1
  const started = start(addTickets(game, 1, day), STAGE, day)
  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  const result = attemptCapture(started.game, weakened, [1, 1, 1, 1], 'rainbow')
  assert.equal(result.ok, true)
  assert.equal(result.caught, true)
  assert.equal(result.game.dex.caught.m001, true)
  assert.equal(result.captured.speciesId, 'm001')
  assert.equal(result.captured.xp, 0)
  assert.equal(result.captured.evolutionReady, false)
  assert.equal(availableTicketCount(result.game, day), 0)
  assert.ok(result.game.normalStageSnapshots[STAGE]?.firstClearReferencePower > 0)
})

test('failed capture consumes turn and one battle allows at most three attempts', () => {
  const day = 2300
  const started = start(addTickets(createGameState(), 1, day), STAGE, day)
  let battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  let game = started.game
  const initialTurn = battle.turn
  for (let i = 0; i < MAX_CAPTURE_ATTEMPTS; i += 1) {
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

test('team setter enforces hard maximum of three monsters', () => {
  const game = createGameState()
  const extra = [makeMonster('m001', 5, 'g1'), makeMonster('m007', 5, 'w1'), makeMonster('m025', 5, 'e1')]
  for (const monster of extra) game.box[monster.instanceId] = monster
  const result = setTeam(game, [game.activeMonsterId, 'g1', 'w1', 'e1'])
  assert.equal(result.ok, true)
  assert.equal(result.game.team.length, 3)
})

test('formal species master includes level, stone, and held-item actual-levelup evolution methods', () => {
  const methods = new Set(Object.values(SPECIES).map((species) => species.evolution?.method).filter(Boolean))
  assert.deepEqual([...methods].sort(), ['held_item_levelup', 'level', 'stone'])
  assert.equal(methods.has('held_item_level'), false)
})

test('generic held-item condition requires evolutionReady', () => {
  const monster = makeMonster('m001', 10, 'g1')
  assert.equal(evolutionConditionMet(monster, { evolution: { to: 'x', method: 'level', level: 10 } }, {}), true)
  assert.equal(evolutionConditionMet(monster, { evolution: { to: 'x', method: 'stone', itemId: 'moon' } }, { evolutionItems: { stones: { moon: 1 } } }), true)
  const heldSpecies = { evolution: { to: 'x', method: 'held_item_levelup', heldItemId: 'seed' } }
  assert.equal(evolutionConditionMet({ ...monster, heldItemId: 'seed', evolutionReady: false }, heldSpecies, {}), false)
  assert.equal(evolutionConditionMet({ ...monster, heldItemId: 'seed', evolutionReady: true }, heldSpecies, {}), true)
})

test('formal level evolution preserves monster instance and follows canonical level', () => {
  const game = createGameState()
  const id = game.activeMonsterId
  assert.equal(game.box[id].speciesId, 'm004')
  game.box[id].level = 17
  assert.equal(canNormalEvolve(game.box[id], game), true)
  const result = evolveInstance(game, id)
  assert.equal(result.ok, true)
  assert.equal(result.game.box[id].instanceId, id)
  assert.equal(result.game.box[id].speciesId, 'm005')
  assert.equal(result.game.dex.caught.m005, true)
})

test('formal stone evolution works E2E and consumes exactly one stone', () => {
  let game = createGameState()
  const monster = makeMonster('m026', 20, 'stone-1')
  game.box[monster.instanceId] = monster
  game.team = [monster.instanceId]
  game.activeMonsterId = monster.instanceId
  game = grantEvolutionItem(game, 'stone', 'thunder', 1, 2500).game
  assert.equal(canNormalEvolve(game.box['stone-1'], game), true)
  const evolved = evolveInstance(game, 'stone-1')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box['stone-1'].speciesId, 'm027')
  assert.equal(evolved.game.evolutionItems.stones.thunder, undefined)
})

test('formal held-item evolution needs an actual level-up after equipping and keeps item after evolution', () => {
  let game = createGameState()
  const monster = makeMonster('m058', 20, 'held-1')
  game.box[monster.instanceId] = monster
  game.team = [monster.instanceId]
  game.activeMonsterId = monster.instanceId
  game = grantEvolutionItem(game, 'held', 'emberwick', 1, 2600).game
  game = equipHeldItem(game, 'held-1', 'emberwick', 2600).game
  assert.equal(canNormalEvolve(game.box['held-1'], game), false)
  const gained = gainXp(game.box['held-1'], xpToNext(game.box['held-1'].level))
  assert.equal(gained.levels.length, 1)
  assert.equal(gained.monster.evolutionReady, true)
  game.box['held-1'] = gained.monster
  assert.equal(canNormalEvolve(game.box['held-1'], game), true)
  const evolved = evolveInstance(game, 'held-1')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box['held-1'].speciesId, 'm059')
  assert.equal(evolved.game.box['held-1'].heldItemId, 'emberwick')
  assert.equal(evolved.game.box['held-1'].evolutionReady, false)
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
  assert.equal(CURRENT_GAME_VERSION, 8)
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
  saved.box[saved.activeMonsterId].speciesId = 'starter-fire-1'
  saved.dex = { seen: { 'starter-fire-1': true }, caught: { 'starter-fire-1': true } }
  const normalized = normalizeGameState(saved, 2750)
  assert.equal(normalized.box[normalized.activeMonsterId].speciesId, 'm004')
  assert.equal(normalized.dex.caught.m004, true)
  assert.equal(normalized.dex.caught['starter-fire-1'], undefined)
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
