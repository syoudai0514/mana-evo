import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BATTLE_XP_GLOBAL_MULTIPLIER,
  battleXpForStage,
  battleXpLevelMultiplier,
  normalReferencePower
} from '../src/game/balance.js'
import { speciesOf } from '../src/game/content.js'
import {
  attemptCapture,
  makeMonster,
  stageById,
  startBattle,
  switchBattleMonster,
  useProtect,
  xpToNext
} from '../src/game/engine.js'
import { getEvolutionTransition } from '../src/game/evolutionDomain.js'
import { addTickets, createGameState } from '../src/game/progression.js'

const TODAY = 24000
const STAGE_ID = 'a1-wild-001'

function expectedActiveBattleXp(playerLevel, enemyLevel) {
  const base = battleXpForStage(stageById(STAGE_ID))
  const global = Math.max(1, Math.round(base * BATTLE_XP_GLOBAL_MULTIPLIER))
  return Math.max(1, Math.round(global * battleXpLevelMultiplier(playerLevel, enemyLevel)))
}

function preparedBattle({ playerLevel = 30, playerXp = 0, supportLevel = null, rainbow = 0 } = {}) {
  let game = createGameState()
  const activeId = game.activeMonsterId
  game.box[activeId] = { ...game.box[activeId], level: playerLevel, xp: playerXp }
  if (supportLevel != null) {
    const support = makeMonster('m004', supportLevel, 'hotfix-support')
    game.box[support.instanceId] = support
    game.team = [activeId, support.instanceId]
  } else {
    game.team = [activeId]
  }
  game.captureItems.rainbow = rainbow
  game = addTickets(game, 1, TODAY)
  const started = startBattle(game, STAGE_ID, { dailyCompleted: true, dailyDay: TODAY, today: TODAY })
  assert.equal(started.ok, true)
  return { game: started.game, battle: started.battle, activeId, supportId: supportLevel == null ? null : 'hotfix-support' }
}

function withEnemyState(prepared, { enemyLevel, hp = 1, poison = false } = {}) {
  const game = structuredClone(prepared.game)
  const battle = structuredClone(prepared.battle)
  if (enemyLevel != null) battle.enemy.level = enemyLevel
  battle.enemy.hp = hp
  battle.enemy.status = poison ? { type: 'poison' } : null
  game.activeBattle = structuredClone(battle)
  return { ...prepared, game, battle }
}

function dotKo({ playerLevel, enemyLevel, supportLevel = null, playerXp = 0 } = {}) {
  const prepared = withEnemyState(preparedBattle({ playerLevel, playerXp, supportLevel, rainbow: 2 }), {
    enemyLevel,
    hp: 1,
    poison: true
  })
  const result = useProtect(prepared.game, prepared.battle, { today: TODAY })
  assert.equal(result.ok, true)
  assert.equal(result.battle.status, 'won')
  assert.equal(result.battle.enemy.hp, 0)
  return { ...prepared, result }
}

function preKoCapture({ playerLevel, enemyLevel, playerXp = 0, duplicate = false } = {}) {
  const prepared = preparedBattle({ playerLevel, playerXp, rainbow: 2 })
  const hp = Math.max(1, Math.floor(prepared.battle.enemy.maxHp * 0.4))
  const scenario = withEnemyState(prepared, { enemyLevel, hp, poison: false })
  if (duplicate) scenario.game.dex.caught[scenario.battle.enemy.speciesId] = true
  scenario.game.activeBattle = structuredClone(scenario.battle)
  const result = attemptCapture(scenario.game, scenario.battle, [0], 'rainbow', { today: TODAY })
  assert.equal(result.ok, true)
  assert.equal(result.caught, true)
  return { ...scenario, result }
}

test('Lv30 active plus Lv5 bench cannot reduce normal reference below active-only power', () => {
  const active = makeMonster('m001', 30, 'active-high')
  const weak = makeMonster('m004', 5, 'weak-bench')
  const activeOnly = {
    box: { [active.instanceId]: active },
    team: [active.instanceId],
    activeMonsterId: active.instanceId
  }
  const mixed = {
    box: { [active.instanceId]: active, [weak.instanceId]: weak },
    team: [active.instanceId, weak.instanceId],
    activeMonsterId: active.instanceId
  }
  const activePower = normalReferencePower(activeOnly, speciesOf)
  const mixedPower = normalReferencePower(mixed, speciesOf)
  assert.ok(mixedPower >= activePower)
})

test('KO and pre-KO capture use the same canonical level-gap Battle XP policy', () => {
  const playerLevel = 30
  const enemyLevel = 20
  const ko = dotKo({ playerLevel, enemyLevel })
  const capture = preKoCapture({ playerLevel, enemyLevel })
  const expected = expectedActiveBattleXp(playerLevel, enemyLevel)
  assert.equal(ko.result.rewards.xpByInstance[ko.activeId], expected)
  assert.equal(capture.result.xpByInstance[capture.activeId], expected)
})

test('canonical Battle XP settlement applies +6 +10 +15 and enemy +3 +5 level-gap bands', () => {
  const cases = [
    { player: 26, enemy: 20, multiplier: 0.50 },
    { player: 30, enemy: 20, multiplier: 0.25 },
    { player: 35, enemy: 20, multiplier: 0.15 },
    { player: 20, enemy: 23, multiplier: 1.15 },
    { player: 20, enemy: 25, multiplier: 1.25 }
  ]
  for (const entry of cases) {
    assert.equal(battleXpLevelMultiplier(entry.player, entry.enemy), entry.multiplier)
    const ko = dotKo({ playerLevel: entry.player, enemyLevel: entry.enemy })
    assert.equal(ko.result.rewards.xpByInstance[ko.activeId], expectedActiveBattleXp(entry.player, entry.enemy))
  }
})

test('pre-KO capture applies level-gap XP before a level-up evolution', () => {
  const base = createGameState()
  const starter = base.box[base.activeMonsterId]
  const transition = getEvolutionTransition(starter.speciesId)
  assert.equal(transition?.method, 'level')
  const playerLevel = transition.level - 1
  const enemyLevel = Math.max(1, playerLevel - 6)
  const playerXp = Math.max(0, xpToNext(playerLevel) - 1)
  const capture = preKoCapture({ playerLevel, enemyLevel, playerXp })
  const expected = expectedActiveBattleXp(playerLevel, enemyLevel)
  assert.equal(capture.result.xpByInstance[capture.activeId], expected)
  assert.equal(capture.result.game.box[capture.activeId].speciesId, transition.toSpeciesId)
  assert.deepEqual(capture.result.evolutionsByInstance[capture.activeId]?.to, transition.toSpeciesId)
})

test('post-KO capture rejects stale replay and never consumes a second ball', () => {
  const won = dotKo({ playerLevel: 30, enemyLevel: 20 })
  const first = attemptCapture(won.result.game, won.result.battle, [0], 'rainbow', { today: TODAY })
  assert.equal(first.ok, true)
  assert.equal(first.caught, true)
  const ballsAfterFirst = first.game.captureItems.rainbow

  const stale = attemptCapture(first.game, won.result.battle, [0], 'rainbow', { today: TODAY })
  assert.equal(stale.ok, false)
  assert.equal(stale.reason, 'STALE_BATTLE')
  assert.equal(stale.game.captureItems.rainbow, ballsAfterFirst)
  assert.equal(stale.game.activeBattle.status, 'caught')
})

test('duplicate post-KO stale replay cannot consume another ball while settlement is pending', () => {
  const won = dotKo({ playerLevel: 30, enemyLevel: 20 })
  won.result.game.dex.caught[won.result.battle.enemy.speciesId] = true
  const first = attemptCapture(won.result.game, won.result.battle, [0], 'rainbow', { today: TODAY })
  assert.equal(first.ok, true)
  assert.equal(first.captureSettlement.duplicate, true)
  assert.equal(first.captureSettlement.status, 'pending_duplicate_choice')
  const ballsAfterFirst = first.game.captureItems.rainbow

  const replay = attemptCapture(first.game, won.result.battle, [0], 'rainbow', { today: TODAY })
  assert.equal(replay.ok, false)
  assert.equal(replay.reason, 'STALE_BATTLE')
  assert.equal(replay.game.captureItems.rainbow, ballsAfterFirst)
})

test('Protect end-turn poison KO settles victory immediately', () => {
  const ko = dotKo({ playerLevel: 30, enemyLevel: 20 })
  assert.equal(ko.result.battle.status, 'won')
  assert.equal(ko.result.battle.ticketSettlement, 'committed')
  assert.ok(ko.result.rewards?.xpByInstance?.[ko.activeId] > 0)
})

test('switch end-turn poison KO settles victory immediately instead of leaving 0 HP fighting', () => {
  const prepared = withEnemyState(preparedBattle({ playerLevel: 80, supportLevel: 80 }), {
    enemyLevel: 5,
    hp: 1,
    poison: true
  })
  const result = switchBattleMonster(prepared.game, prepared.battle, prepared.supportId, { today: TODAY })
  assert.equal(result.ok, true)
  assert.equal(result.battle.enemy.hp, 0)
  assert.equal(result.battle.status, 'won')
  assert.equal(result.battle.ticketSettlement, 'committed')
})

test('failed capture end-turn poison KO also settles through the shared victory boundary', () => {
  const prepared = preparedBattle({ playerLevel: 80, rainbow: 0 })
  prepared.game.captureItems.star = Math.max(1, prepared.game.captureItems.star || 0)
  const scenario = withEnemyState(prepared, { enemyLevel: 5, hp: 1, poison: true })
  scenario.game.activeBattle = structuredClone(scenario.battle)
  const result = attemptCapture(scenario.game, scenario.battle, [1], 'star', { today: TODAY })
  assert.equal(result.ok, true)
  assert.equal(result.caught, false)
  assert.equal(result.battle.enemy.hp, 0)
  assert.equal(result.battle.status, 'won')
  assert.ok(result.rewards?.xpByInstance?.[scenario.activeId] > 0)
})
