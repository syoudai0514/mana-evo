import fs from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

import { MOVES, RUNTIME_META, RUNTIME_STAGES, SPECIES, STAGES, moveOf, speciesOf } from '../src/game/content.js'
import { buildEnemyPlan, monsterCombatPower } from '../src/game/balance.js'
import {
  BURST_ATTACK_MULTIPLIER,
  BURST_HP_MULTIPLIER,
  BURST_TURNS,
  GIGA_MULTIPLIER,
  abandonBattle,
  activateBurst,
  activateGiga,
  damageAmount,
  makeMonster,
  setTeam,
  startBattle,
  useMove,
  useProtect
} from '../src/game/engine.js'
import { addTickets, createGameState } from '../src/game/progression.js'
import { performGameExploration } from '../src/game/sharedRuntime.js'
import { applyAreaBossProgressEvent } from '../src/game/worldProgression.js'

const HEAL_IDS = ['m041','m042','m049','m050','m051','m098','m099','m115','m116','m175','m176','m177','m208','m209','m210','m235']
const GIGA_IDS = ['m003','m006','m009','m051','m054','m072','m090','m121','m153','m156','m159','m186']
const BURST_IDS = ['m060','m066','m133','m136','m142','m165','m171','m174']

function preparedGame(speciesId = 'm004', level = 40, day = 7000) {
  let game = createGameState()
  const id = game.activeMonsterId
  game.box[id] = makeMonster(speciesId, level, id)
  game.team = [id]
  game.activeMonsterId = id
  game.dex.seen[speciesId] = true
  game.dex.caught[speciesId] = true
  return addTickets(game, 10, day)
}

function distinctSpeciesStages(stages, count) {
  const seen = new Set()
  const picked = []
  for (const stage of stages) {
    if (!stage?.enemySpeciesId || seen.has(stage.enemySpeciesId)) continue
    seen.add(stage.enemySpeciesId)
    picked.push(stage)
    if (picked.length >= count) break
  }
  return picked
}

function unlockAreaBoss(game, area) {
  const boss = STAGES.find((stage) => stage.id === `a${area}-boss`)
  if (area > 1) for (let a = 1; a < area; a += 1) game.stagesCleared.push(`a${a}-boss`)
  const route = distinctSpeciesStages(STAGES
    .filter((stage) => stage.kind === 'wild' && stage.routeProgressEligible)
    .filter((stage) => Number(stage.adventureArea || stage.area) === area)
    .filter((stage) => stage.zoneId === boss.zoneGatePreviousId), 3)
  assert.equal(route.length, 3, `area ${area} boss needs three distinct route species in the previous zone`)
  game.stagesCleared = [...new Set([...(game.stagesCleared || []), ...route.map((stage) => stage.id)])]
  game = applyAreaBossProgressEvent(game, { id: `test:${area}:a`, area, points: 6, skillId: `skill-${area}-a` }).game
  game = applyAreaBossProgressEvent(game, { id: `test:${area}:b`, area, points: 6, skillId: `skill-${area}-b` }).game
  return { game, boss }
}

test('generated runtime is exactly the canonical No.001-238 master', () => {
  const entries = Object.values(SPECIES).sort((a, b) => Number(a.no) - Number(b.no))
  assert.equal(entries.length, 238)
  assert.equal(RUNTIME_META.speciesCount, 238)
  assert.deepEqual(entries.map((entry) => entry.id), Array.from({ length: 238 }, (_, index) => `m${String(index + 1).padStart(3, '0')}`))
  assert.equal(SPECIES.m239, undefined)
  assert.equal(entries[141].id, 'm142')
  assert.equal(entries[141].name, 'ヘラクレオン')
  assert.equal(entries[141].burstEligible, true)
})

test('every formal species has four purposeful moves with complete schema', () => {
  for (const species of Object.values(SPECIES)) {
    assert.equal(species.moves.length, 4, `${species.id} must have 4 normal moves`)
    assert.equal(new Set(species.moves).size, 4, `${species.id} move ids must be unique`)
    const moves = species.moves.map(moveOf)
    for (const move of moves) {
      assert.ok(move?.moveId)
      assert.ok(move?.name)
      assert.ok(move?.type)
      assert.ok(Number.isFinite(move?.power))
      assert.ok(Number.isFinite(move?.accuracy))
      assert.ok(move?.effect?.type)
      assert.ok(move?.role)
    }
    assert.ok(new Set(moves.map((move) => move.role)).size >= 3, `${species.id} must not collapse into one move role`)
    const damageMoves = moves.filter((move) => move.effect.type === 'damage')
    assert.ok(damageMoves.length >= 3)
    assert.ok(damageMoves.some((move) => move.role === 'stable'))
    assert.ok(damageMoves.some((move) => move.role === 'strong'))
  }
  assert.equal(RUNTIME_META.moveCount, 238 * 4 + 8)
})

test('healer/support identity watches and No.181/182 are represented in formal moves', () => {
  for (const id of HEAL_IDS) {
    const moves = SPECIES[id].moves.map(moveOf)
    const heal = moves.find((move) => move.effect.type === 'heal')
    assert.ok(heal, `${id} must have heal identity`)
    assert.equal(heal.effect.healRatio, 0.20)
    assert.equal(heal.effect.usesPerBattle, 1)
  }
  assert.equal(SPECIES.m181.moves.map(moveOf).find((move) => move.role === 'identity')?.name, 'きずなリンク')
  assert.equal(SPECIES.m182.moves.map(moveOf).find((move) => move.role === 'identity')?.name, 'こころリレー')
})

test('combatRoleV2 is audit metadata only and never drives battle/UI decisions', () => {
  const runtimeSources = ['src/game/engine.js', 'src/game/GameScreens.jsx', 'src/game/balance.js']
    .map((path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))
    .join('\n')
  assert.equal(runtimeSources.includes('combatRoleV2'), false)
  assert.equal(SPECIES.m142.combatRoleV2, 'fastGlass')
  assert.ok(SPECIES.m142.base.defense > SPECIES.m142.base.speed)
})

test('dedicated evolution trials are retired while canonical special challenges remain exposed', () => {
  const trials = RUNTIME_STAGES.filter((stage) => stage.kind === 'evolution-trial')
  assert.equal(trials.length, 0)
  assert.equal(RUNTIME_META.itemTrialCount, 0)
  assert.equal(RUNTIME_STAGES.some((stage) => stage.minAreaClears !== undefined), false)
  assert.equal(RUNTIME_STAGES.some((stage) => stage.evolutionReward !== undefined), false)
  const giga = RUNTIME_STAGES.filter((stage) => stage.kind === 'giga-challenge')
  const burst = RUNTIME_STAGES.filter((stage) => stage.kind === 'burst-challenge')
  assert.deepEqual(giga.map((stage) => stage.specialReward.speciesId).sort(), [...GIGA_IDS].sort())
  assert.deepEqual(burst.map((stage) => stage.specialReward.speciesId).sort(), [...BURST_IDS].sort())
  assert.equal(RUNTIME_STAGES.filter((stage) => stage.kind === 'event').length, 4)
  assert.equal(RUNTIME_STAGES.filter((stage) => stage.kind === 'ex').length, 1)
})

test('evolution items are acquired through the canonical 5-point exploration path', () => {
  let game = createGameState()
  game.explorePoint = 5
  const explored = performGameExploration(game, { areaId: 1, rng: () => 0, operationId: 'runtime-completion:explore' })
  assert.equal(explored.ok, true)
  assert.equal(explored.game.explorePoint, 0)
  assert.equal(explored.result.kind, 'evolution_item')
  assert.ok(explored.result.itemId)
  const inventory = { ...explored.game.evolutionItems.stones, ...explored.game.evolutionItems.heldItems }
  assert.equal(inventory[explored.result.itemId], 1)
})

test('boss warning plus protect blocks the telegraphed big move and cannot be repeated', () => {
  const day = 7200
  let game = preparedGame('m004', 45, day)
  const unlocked = unlockAreaBoss(game, 1)
  game = unlocked.game
  const boss = unlocked.boss
  const started = startBattle(game, boss.id, { dailyCompleted: true, today: day })
  assert.equal(started.ok, true)
  const warned = structuredClone(started.battle)
  warned.bossTelegraphed = true
  warned.bossCountdown = 0
  const hpBefore = warned.partyHp[warned.activeInstanceId]
  const protectedTurn = useProtect(started.game, warned)
  assert.equal(protectedTurn.ok, true)
  assert.equal(protectedTurn.battle.partyHp[warned.activeInstanceId], hpBefore)
  assert.equal(protectedTurn.battle.bossTelegraphed, false)
  assert.match(protectedTurn.battle.log.join(' '), /ふせいだ/)
  const repeated = useProtect(protectedTurn.game, protectedTurn.battle)
  assert.equal(repeated.ok, false)
  assert.equal(repeated.reason, 'PROTECT_CONSECUTIVE')
})

test('boss first encounter snapshot locks normal rematch while challenge rescales', () => {
  const day = 7300
  let game = preparedGame('m004', 35, day)
  const unlocked = unlockAreaBoss(game, 1)
  game = unlocked.game
  const boss = unlocked.boss
  const first = startBattle(game, boss.id, { dailyCompleted: true, today: day })
  assert.equal(first.ok, true)
  const firstLevel = first.battle.enemy.level
  assert.ok(first.game.bossBalanceSnapshots[boss.id])
  let abandoned = abandonBattle(first.game, { today: day })
  abandoned.game.box[abandoned.game.activeMonsterId].level = 85
  const rematch = startBattle(abandoned.game, boss.id, { dailyCompleted: true, today: day })
  assert.equal(rematch.battle.enemy.balance.mode, 'boss-locked')
  assert.equal(rematch.battle.enemy.level, firstLevel)
  abandoned = abandonBattle(rematch.game, { today: day })
  const challenge = startBattle(abandoned.game, boss.id, { dailyCompleted: true, today: day, challenge: true })
  assert.equal(challenge.battle.enemy.balance.mode, 'boss-challenge')
  assert.ok(challenge.battle.enemy.level > firstLevel)
})

test('giga and burst are mutually exclusive one-battle specials with reviewed multipliers', () => {
  const day = 7400
  let gigaGame = preparedGame('m003', 55, day)
  gigaGame.gigaKeyOwned = true
  gigaGame.gigaCoreSpecies.m003 = true
  let started = startBattle(gigaGame, 'a1-wild-001', { dailyCompleted: true, today: day })
  const baseHp = started.battle.partyHp[started.battle.activeInstanceId]
  const giga = activateGiga(started.game, started.battle)
  assert.equal(giga.ok, true)
  assert.ok(giga.battle.partyHp[giga.battle.activeInstanceId] >= Math.floor(baseHp * GIGA_MULTIPLIER))
  assert.equal(activateBurst(giga.game, giga.battle).ok, false)

  let burstGame = preparedGame('m060', 55, day + 1)
  burstGame.burstMarks.m060 = true
  started = startBattle(burstGame, 'a1-wild-001', { dailyCompleted: true, today: day + 1 })
  const burstBaseHp = started.battle.partyHp[started.battle.activeInstanceId]
  const burst = activateBurst(started.game, started.battle)
  assert.equal(burst.ok, true)
  assert.equal(burst.battle.playerSpecial.turnsLeft, BURST_TURNS)
  assert.ok(burst.battle.partyHp[burst.battle.activeInstanceId] >= burstBaseHp * 2)
  assert.ok(SPECIES.m060.burstMoveId)
  assert.equal(moveOf(SPECIES.m060.burstMoveId).power, 110)
  assert.equal(moveOf(SPECIES.m060.burstMoveId).accuracy, 95)

  const gigaThreeTurnOffense = GIGA_MULTIPLIER * 3
  const burstThreeTurnOffense = BURST_ATTACK_MULTIPLIER * 1.10 * BURST_TURNS
  const offenseRatio = gigaThreeTurnOffense / burstThreeTurnOffense
  const durabilityRatio = (GIGA_MULTIPLIER * GIGA_MULTIPLIER) / BURST_HP_MULTIPLIER
  assert.ok(offenseRatio > 0.85 && offenseRatio < 1.20)
  assert.ok(durabilityRatio > 0.85 && durabilityRatio < 1.10)
})

test('repeat-cap simulation gives a meaningful shorter fight after roughly +20% player power', () => {
  const samples = RUNTIME_STAGES.filter((stage) => stage.kind === 'wild' && stage.area === 1).slice(0, 18)
  let totalBefore = 0
  let totalAfter = 0
  let eligible = 0
  for (const stage of samples) {
    const baseGame = preparedGame('m004', 30, 7500)
    const firstPlan = buildEnemyPlan(baseGame, stage, speciesOf)
    const baseMonster = baseGame.box[baseGame.activeMonsterId]
    const basePower = monsterCombatPower(baseMonster, speciesOf)
    let grownLevel = baseMonster.level
    while (grownLevel < 100) {
      const candidate = { ...baseMonster, level: grownLevel }
      if (monsterCombatPower(candidate, speciesOf) >= basePower * 1.20) break
      grownLevel += 1
    }
    const grownGame = structuredClone(baseGame)
    grownGame.box[grownGame.activeMonsterId].level = grownLevel
    grownGame.normalStageSnapshots[stage.id] = { stageId: stage.id, firstClearReferencePower: firstPlan.referencePower, balanceVersion: 3 }
    const repeatPlan = buildEnemyPlan(grownGame, stage, speciesOf)
    const move = moveOf('m004-finisher')
    const beforeEnemy = { speciesId: stage.enemySpeciesId, level: firstPlan.level, statMultipliers: firstPlan.statMultipliers }
    const afterEnemy = { speciesId: stage.enemySpeciesId, level: repeatPlan.level, statMultipliers: repeatPlan.statMultipliers }
    const beforeHp = statsForPlan(stage.enemySpeciesId, firstPlan).hp
    const afterHp = statsForPlan(stage.enemySpeciesId, repeatPlan).hp
    const beforeDamage = Math.max(1, damageAmount(baseMonster, beforeEnemy, move).damage)
    const afterDamage = Math.max(1, damageAmount(grownGame.box[grownGame.activeMonsterId], afterEnemy, move).damage)
    const beforeTurns = Math.ceil(beforeHp / beforeDamage)
    const afterTurns = Math.ceil(afterHp / afterDamage)
    if (beforeTurns <= 1) continue
    eligible += 1
    totalBefore += beforeTurns
    totalAfter += afterTurns
  }
  assert.ok(eligible > 0, 'simulation must include repeat fights with room to get shorter')
  const averageImprovement = (totalBefore - totalAfter) / eligible
  assert.ok(averageImprovement >= 1, `expected >=1 turn shorter on eligible fights, got ${averageImprovement}`)
})

function statsForPlan(speciesId, plan) {
  const species = speciesOf(speciesId)
  const level = plan.level
  const m = plan.statMultipliers || { hp: 1, attack: 1, defense: 1, speed: 1 }
  const rawHp = Math.floor((2 * species.base.hp * level) / 100) + level + 10
  const rawAttack = Math.floor((2 * species.base.attack * level) / 100) + 5
  const rawDefense = Math.floor((2 * species.base.defense * level) / 100) + 5
  const rawSpeed = Math.floor((2 * species.base.speed * level) / 100) + 5
  return { hp: Math.floor(rawHp * m.hp), attack: Math.floor(rawAttack * m.attack), defense: Math.floor(rawDefense * m.defense), speed: Math.floor(rawSpeed * m.speed) }
}
