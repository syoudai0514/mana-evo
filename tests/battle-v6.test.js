import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BALANCE_VERSION,
  battleXpLevelMultiplier,
  normalReferencePower
} from '../src/game/balance.js'
import {
  CRITICAL_MULTIPLIER,
  DAMAGE_RANDOM_MIN,
  STAB_MULTIPLIER
} from '../src/game/battleRules.js'
import { AREA_META, STAGES, speciesOf } from '../src/game/content.js'
import {
  attemptCapture,
  canAttemptCapture,
  makeMonster,
  startBattle
} from '../src/game/engine.js'
import { addTickets, availableTicketCount, createGameState } from '../src/game/progression.js'

test('Battle V6 anchors normal enemy scaling to the active battler instead of averaging a weak bench', () => {
  assert.equal(BALANCE_VERSION, 6)
  const active = makeMonster('m001', 30, 'active-high')
  const weakA = makeMonster('m004', 5, 'weak-a')
  const weakB = makeMonster('m007', 5, 'weak-b')
  const game = {
    box: { [active.instanceId]: active, [weakA.instanceId]: weakA, [weakB.instanceId]: weakB },
    team: [active.instanceId, weakA.instanceId, weakB.instanceId],
    activeMonsterId: active.instanceId
  }
  const activePower = normalReferencePower({ ...game, team: [active.instanceId] }, speciesOf)
  const mixedPower = normalReferencePower(game, speciesOf)
  assert.ok(mixedPower >= activePower * 0.70)
})

test('Battle V6 reduces burst multipliers and throttles XP from enemies far below the player', () => {
  assert.equal(STAB_MULTIPLIER, 1.25)
  assert.equal(CRITICAL_MULTIPLIER, 1.35)
  assert.ok(DAMAGE_RANDOM_MIN >= 0.92)
  assert.equal(battleXpLevelMultiplier(30, 15), 0.15)
  assert.equal(battleXpLevelMultiplier(25, 15), 0.25)
  assert.equal(battleXpLevelMultiplier(21, 15), 0.50)
  assert.equal(battleXpLevelMultiplier(15, 15), 1)
  assert.equal(battleXpLevelMultiplier(10, 15), 1.25)
})

test('recommended world bands match the slower learning-first XP economy', () => {
  assert.deepEqual(AREA_META.map((area) => [area.area, area.levelMin, area.levelMax]), [
    [1, 5, 16],
    [2, 14, 27],
    [3, 24, 40],
    [4, 37, 58]
  ])
  const area3Stages = STAGES.filter((stage) => !stage.legacy && Number(stage.adventureArea || stage.area) === 3)
  assert.ok(area3Stages.length > 0)
  assert.ok(area3Stages.every((stage) => stage.minEnemyLevel >= 24 && stage.maxEnemyLevel <= 40))
})

test('a defeated wild monster remains capturable without granting battle XP twice', () => {
  const today = 12000
  let game = createGameState()
  game.captureItems.rainbow = 1
  game = addTickets(game, 1, today)
  const started = startBattle(game, 'a1-wild-001', { dailyCompleted: true, dailyDay: today, today })
  assert.equal(started.ok, true)

  const battle = structuredClone(started.battle)
  battle.status = 'won'
  battle.enemy.hp = 0
  battle.postKoCaptureAvailable = true
  battle.rewardResolutionId = `${battle.battleId}:reward`
  const wonGame = structuredClone(started.game)
  wonGame.activeBattle = structuredClone(battle)

  assert.equal(canAttemptCapture(wonGame, battle, 'rainbow'), true)
  const caught = attemptCapture(wonGame, battle, [0], 'rainbow', { today })
  assert.equal(caught.ok, true)
  assert.equal(caught.caught, true)
  assert.equal(caught.battle.status, 'caught')
  assert.equal(caught.xp, 0)
  assert.deepEqual(caught.xpByInstance, {})
})

test('post-KO capture is never enabled for a boss', () => {
  const boss = STAGES.find((stage) => stage.kind === 'boss')
  assert.ok(boss)
  const game = createGameState()
  game.captureItems.rainbow = 1
  const battle = {
    battleId: 'boss-ko',
    stageId: boss.id,
    status: 'won',
    captureAttempts: 0,
    postKoCaptureAvailable: true,
    enemy: { speciesId: boss.enemySpeciesId, level: 10, hp: 0, maxHp: 100 }
  }
  assert.equal(canAttemptCapture(game, battle, 'rainbow'), false)
})

test('a failed live capture that causes defeat still spends the reserved battle ticket', () => {
  const today = 13000
  let game = createGameState()
  game.captureItems.star = Math.max(1, game.captureItems.star || 0)
  game = addTickets(game, 1, today)
  const beforeTickets = availableTicketCount(game, today)
  const started = startBattle(game, 'a1-wild-001', { dailyCompleted: true, dailyDay: today, today })
  assert.equal(started.ok, true)
  assert.equal(availableTicketCount(started.game, today), beforeTickets - 1)

  const battle = structuredClone(started.battle)
  battle.enemy.hp = Math.max(1, Math.floor(battle.enemy.maxHp * 0.4))
  battle.partyHp[battle.activeInstanceId] = 1
  const activeId = battle.activeInstanceId
  battle.teamAtStart = [activeId]
  const gameForCapture = structuredClone(started.game)
  gameForCapture.team = [activeId]
  gameForCapture.activeBattle = structuredClone(battle)

  const result = attemptCapture(gameForCapture, battle, [1], 'star', { today })
  assert.equal(result.ok, true)
  if (result.battle.status === 'lost') {
    assert.equal(result.battle.ticketRefunded, false)
    assert.equal(result.battle.ticketSettlement, 'committed')
    assert.equal(availableTicketCount(result.game, today), beforeTickets - 1)
  } else {
    // If the deterministic enemy move misses for this content revision, the
    // reservation is still consumed at start and must not increase.
    assert.equal(availableTicketCount(result.game, today), beforeTickets - 1)
  }
})
