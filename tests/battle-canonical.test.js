import test from 'node:test'
import assert from 'node:assert/strict'

import { SPECIES, STAGES, moveOf, speciesOf, typeEffectiveness } from '../src/game/content.js'
import { BALANCE_VERSION } from '../src/game/balance.js'
import {
  abandonBattle,
  canUseProtect,
  clearFinishedBattle,
  damageAmount,
  makeMonster,
  setTeam,
  startBattle,
  switchBattleMonster,
  useMove,
  useProtect
} from '../src/game/engine.js'
import { addTickets, availableTicketCount, createGameState } from '../src/game/progression.js'
import { applyAreaBossProgressEvent } from '../src/game/worldProgression.js'

const DAY = 4100
const FIRST_WILD = 'a1-wild-001'

function unlockForStage(game, stage) {
  let next = structuredClone(game)
  next.stagesCleared ||= []
  const add = (id) => { if (id && !next.stagesCleared.includes(id)) next.stagesCleared.push(id) }
  add(stage.unlockedBy)
  add(stage.areaGateBossId)
  if (stage.requiresAllAreasCleared) [1, 2, 3, 4].forEach((area) => add(`a${area}-boss`))
  if (stage.requiresEvolutionDiscoverySpeciesId) {
    next.evolutionDiscoveries ||= {}
    next.evolutionDiscoveries[stage.requiresEvolutionDiscoverySpeciesId] = true
  }
  if (stage.requiresOwnedSpeciesId) {
    next.dex ||= { seen: {}, caught: {} }
    next.dex.caught ||= {}
    next.dex.caught[stage.requiresOwnedSpeciesId] = true
  }
  for (const candidate of STAGES) {
    if (candidate.kind === 'wild' && (candidate.adventureArea || candidate.area) === (stage.adventureArea || stage.area)) add(candidate.id)
  }
  const area = Number(stage.adventureArea || stage.area)
  if (stage.kind === 'boss' && area >= 1 && area <= 4) {
    next = applyAreaBossProgressEvent(next, { id: `test:${stage.id}:a`, area, points: 6, skillId: `${stage.id}:skill-a` }).game
    next = applyAreaBossProgressEvent(next, { id: `test:${stage.id}:b`, area, points: 6, skillId: `${stage.id}:skill-b` }).game
  }
  return next
}

function start(game, stageId = FIRST_WILD, day = DAY, options = {}) {
  return startBattle(game, stageId, { dailyCompleted: true, dailyDay: day, today: day, ...options })
}

test('new battle gate rejects invalid team before reserving a ticket', () => {
  let game = addTickets(createGameState(), 1, DAY)
  for (const [id, speciesId] of [['x1', 'm001'], ['x2', 'm007'], ['x3', 'm025']]) game.box[id] = makeMonster(speciesId, 5, id)
  game.team = [game.activeMonsterId, 'x1', 'x2', 'x3']
  const result = start(game)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'INVALID_TEAM')
  assert.equal(availableTicketCount(result.game, DAY), 1)
})

test('battle start reserves one FEFO lot and reload does not reserve again', () => {
  let game = addTickets(createGameState(), 1, DAY)
  game = addTickets(game, 1, DAY + 2)
  const expectedExpiry = game.ticketGrants[0].expiresDay
  const result = start(game, FIRST_WILD, DAY + 2)
  assert.equal(result.ok, true)
  assert.equal(result.battle.ticketSettlement, 'reserved')
  assert.equal(result.battle.ticketCommitted, false)
  assert.equal(result.battle.ticketReservation.expiresDay, expectedExpiry)
  assert.equal(availableTicketCount(result.game, DAY + 2), 1)
  const resumed = startBattle(result.game, FIRST_WILD, { dailyCompleted: true, today: DAY + 2 })
  assert.equal(resumed.ok, false)
  assert.equal(resumed.reason, 'BATTLE_ALREADY_ACTIVE')
  assert.equal(resumed.battle.battleId, result.battle.battleId)
  assert.equal(availableTicketCount(resumed.game, DAY + 2), 1)
})

test('Battle V6 damage uses reduced STAB/critical burst and exact immunity zero', () => {
  const attacker = { speciesId: 'm004', level: 20 }
  const defender = { speciesId: 'm001', level: 20 }
  const move = moveOf('m004-stable')
  const regular = damageAmount(attacker, defender, move, { criticalRoll: 1, randomRoll: 1 })
  const critical = damageAmount(attacker, defender, move, { criticalRoll: 0, randomRoll: 1 })
  const lowRoll = damageAmount(attacker, defender, move, { criticalRoll: 1, randomRoll: 0 })
  assert.equal(regular.stab, 1.25)
  assert.equal(critical.critical, 1.35)
  assert.equal(lowRoll.random, 0.92)
  assert.ok(critical.damage > regular.damage)
  assert.ok(regular.damage >= lowRoll.damage)

  const ground = Object.values(SPECIES).find((species) => species.types.includes('ground'))
  assert.ok(ground)
  const immunity = damageAmount({ speciesId: 'm025', level: 20 }, { speciesId: ground.id, level: 20 }, moveOf('m025-stable'), { criticalRoll: 0, randomRoll: 1 })
  assert.equal(immunity.effectiveness, 0)
  assert.equal(immunity.damage, 0)
})

test('protect blocks the enemy action and has one full-turn cooldown', () => {
  const started = start(addTickets(createGameState(), 1, DAY))
  assert.equal(started.ok, true)
  const beforeHp = started.battle.partyHp[started.battle.activeInstanceId]
  const guarded = useProtect(started.game, started.battle, { today: DAY })
  assert.equal(guarded.ok, true)
  assert.equal(guarded.battle.partyHp[guarded.battle.activeInstanceId], beforeHp)
  assert.equal(canUseProtect(guarded.battle), false)
  const moveId = speciesOf(guarded.game.box[guarded.battle.activeInstanceId].speciesId).moves[0]
  const acted = useMove(guarded.game, guarded.battle, moveId, { today: DAY })
  if (acted.battle.status === 'fighting') assert.equal(canUseProtect(acted.battle), true)
})

test('voluntary switch uses enemy move planned against pre-switch active monster', () => {
  let chosen = null
  for (const stage of STAGES.filter((candidate) => candidate.kind === 'wild' && !candidate.hidden)) {
    const enemySpecies = speciesOf(stage.enemySpeciesId)
    const damageMoves = enemySpecies.moves.map(moveOf).filter((move) => move?.effect?.type === 'damage' && move.power > 0)
    const best = (target) => damageMoves.slice().sort((a, b) => {
      const score = (move) => move.power * ((move.accuracy ?? 100) / 100) * typeEffectiveness(move.type, target.types)
      return score(b) - score(a)
    })[0]
    const targets = Object.values(SPECIES)
    outer: for (const from of targets) {
      for (const to of targets) {
        if (from.id === to.id) continue
        const before = best(from)
        const after = best(to)
        if (before?.id && after?.id && before.id !== after.id) {
          chosen = { stage, from, to, before }
          break outer
        }
      }
    }
    if (chosen) break
  }
  assert.ok(chosen)

  let game = addTickets(createGameState(), 1, DAY)
  game = unlockForStage(game, chosen.stage)
  game.box.from = makeMonster(chosen.from.id, 30, 'from')
  game.box.to = makeMonster(chosen.to.id, 30, 'to')
  game = setTeam(game, ['from', 'to']).game
  game.activeMonsterId = 'from'
  const started = start(game, chosen.stage.id)
  assert.equal(started.ok, true)
  const switched = switchBattleMonster(started.game, started.battle, 'to', { today: DAY })
  assert.equal(switched.ok, true)
  assert.ok(switched.battle.log.join('\n').includes(chosen.before.name))
})

test('win commits reservation once and stale replay cannot double reward', () => {
  const started = start(addTickets(createGameState(), 1, DAY))
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const moveId = speciesOf(started.game.box[battle.activeInstanceId].speciesId).moves[0]
  const won = useMove(started.game, battle, moveId, { today: DAY })
  assert.equal(won.ok, true)
  assert.equal(won.battle.status, 'won')
  assert.equal(won.battle.ticketSettlement, 'committed')
  assert.equal(won.battle.ticketCommitted, true)
  assert.equal(availableTicketCount(won.game, DAY), 0)
  const xpAfter = won.game.box[battle.activeInstanceId].xp
  const replay = useMove(won.game, battle, moveId, { today: DAY })
  assert.equal(replay.ok, false)
  assert.equal(replay.reason, 'BATTLE_FINISHED')
  assert.equal(replay.game.box[battle.activeInstanceId].xp, xpAfter)
})

test('explicit abandon spends the reserved ticket and cannot settle twice', () => {
  const started = start(addTickets(createGameState(), 1, DAY))
  const abandoned = abandonBattle(started.game, { today: DAY })
  assert.equal(abandoned.ok, true)
  assert.equal(abandoned.refunded, false)
  assert.equal(availableTicketCount(abandoned.game, DAY), 0)
  const second = abandonBattle(abandoned.game, { today: DAY })
  assert.equal(second.ok, false)
  assert.equal(second.reason, 'NO_ACTIVE_BATTLE')
  assert.equal(availableTicketCount(second.game, DAY), 0)
})

test('old boss snapshot is replaced once and normal rematch re-locks', () => {
  const boss = STAGES.find((stage) => stage.bossRank && !stage.hidden)
  assert.ok(boss)
  let game = addTickets(createGameState(), 2, DAY)
  game = unlockForStage(game, boss)
  game.bossBalanceSnapshots[boss.id] = {
    stageId: boss.id,
    bossId: boss.bossId || boss.enemySpeciesId,
    bossRank: boss.bossRank,
    lockedLevel: 1,
    referencePower: 1,
    targetPower: 1,
    statMultipliers: { hp: 1, attack: 1, defense: 1, speed: 1 },
    balanceVersion: BALANCE_VERSION - 1
  }
  const first = start(game, boss.id)
  assert.equal(first.ok, true)
  const replacement = first.game.bossBalanceSnapshots[boss.id]
  assert.equal(replacement.balanceVersion, BALANCE_VERSION)
  const quit = abandonBattle(first.game, { today: DAY })
  assert.equal(quit.ok, true)
  assert.equal(availableTicketCount(quit.game, DAY), 1)
  const rematch = start(quit.game, boss.id)
  assert.equal(rematch.ok, true)
  assert.equal(rematch.battle.enemy.balance.mode, 'boss-locked')
  assert.equal(rematch.game.bossBalanceSnapshots[boss.id].lockedLevel, replacement.lockedLevel)
})

test('boss XP is first-clear only instead of an unconditional repeat bonus', () => {
  const boss = STAGES.find((stage) => stage.bossRank && !stage.hidden)
  assert.ok(boss)
  let game = addTickets(createGameState(), 2, DAY)
  game = unlockForStage(game, boss)
  game.box[game.activeMonsterId].level = 100
  const first = start(game, boss.id)
  assert.equal(first.ok, true)
  const firstBattle = structuredClone(first.battle)
  firstBattle.enemy.hp = 1
  const moveId = speciesOf(first.game.box[firstBattle.activeInstanceId].speciesId).moves[0]
  const firstWin = useMove(first.game, firstBattle, moveId, { today: DAY })
  assert.equal(firstWin.battle.status, 'won')
  assert.ok(firstWin.rewards.xp > 0)
  const cleared = clearFinishedBattle(firstWin.game, { today: DAY })
  assert.equal(cleared.ok, true)
  const second = start(cleared.game, boss.id)
  assert.equal(second.ok, true)
  const secondBattle = structuredClone(second.battle)
  secondBattle.enemy.hp = 1
  const repeatWin = useMove(second.game, secondBattle, moveId, { today: DAY })
  assert.equal(repeatWin.battle.status, 'won')
  assert.equal(repeatWin.rewards.xp, 0)
})
