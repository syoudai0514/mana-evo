import { BOSS_RANKS } from './balance.js'
import {
  seededBattleRoll,
  speedOrder,
  statusActionResult,
  statusSpeedMultiplier
} from './battleRules.js'
import { MOVES, STAGES, moveOf, speciesOf, typeEffectiveness } from './content.js'
import { damageAmount, statsFor } from './engineCore.js'
import { SPECIAL_FORM_EFFECTS } from './specialFormsDomain.js'

const clamp = (min, value, max) => Math.max(min, Math.min(max, value))

function battleRoll(battle, actor, kind, moveId = '') {
  return seededBattleRoll(battle?.rngSeed, `${battle?.stageId}:${battle?.turn}:${actor}:${kind}:${moveId}`)
}

function deterministicHit(move, battle, actor) {
  const accuracy = clamp(1, Number(move?.accuracy) || 100, 100)
  if (accuracy >= 100) return true
  return battleRoll(battle, actor, 'accuracy', move.id || move.moveId) * 100 < accuracy
}

function playerSpecialMultipliers(battle, instanceId) {
  const special = battle?.playerSpecial
  if (!special || special.instanceId !== instanceId) return null
  const effect = SPECIAL_FORM_EFFECTS[special.type]
  if (!effect) return null
  return {
    hp: effect.hp,
    attack: effect.attack,
    defense: effect.defense,
    speed: effect.speed
  }
}

function playerBattleMonster(game, battle) {
  const monster = game?.box?.[battle?.activeInstanceId]
  if (!monster) return null
  return {
    ...monster,
    statMultipliers: playerSpecialMultipliers(battle, monster.instanceId),
    battleStatus: battle?.partyStatuses?.[monster.instanceId] || null
  }
}

function enemyBattleMonster(battle) {
  if (!battle?.enemy) return null
  return {
    speciesId: battle.enemy.speciesId,
    level: battle.enemy.level,
    statMultipliers: battle.enemy.statMultipliers,
    battleStatus: battle.enemy.status || null
  }
}

function effectiveSpeed(monster) {
  if (!monster) return 0
  const base = statsFor(monster.speciesId, monster.level, monster.statMultipliers).speed
  return Math.max(1, Math.floor(base * statusSpeedMultiplier(monster.battleStatus)))
}

function bossBigMove(stage, enemySpecies) {
  const rank = BOSS_RANKS[stage?.bossRank] || BOSS_RANKS.A
  return {
    id: `${stage?.id || 'boss'}-big-move`,
    moveId: `${stage?.id || 'boss'}-big-move`,
    name: `${enemySpecies?.name || 'ボス'}の おおわざ`,
    type: enemySpecies?.types?.[0] || 'normal',
    power: rank.bigMovePower,
    accuracy: 90,
    effect: { type: 'damage' },
    role: 'boss-big'
  }
}

function enemyMoveFor(enemy, player) {
  const species = speciesOf(enemy?.speciesId)
  const playerSpecies = speciesOf(player?.speciesId)
  if (!species || !playerSpecies) return null
  return species.moves
    .map((id) => moveOf(id))
    .filter((move) => move?.effect?.type === 'damage' && move.power > 0)
    .sort((a, b) => {
      const aScore = a.power * ((a.accuracy ?? 100) / 100) * typeEffectiveness(a.type, playerSpecies.types)
      const bScore = b.power * ((b.accuracy ?? 100) / 100) * typeEffectiveness(b.type, playerSpecies.types)
      return bScore - aScore
    })[0] || Object.values(MOVES).find((move) => move.effect?.type === 'damage') || null
}

function plannedEnemyMove(game, battle) {
  const player = playerBattleMonster(game, battle)
  const enemy = enemyBattleMonster(battle)
  if (!player || !enemy || Number(battle?.enemy?.hp) <= 0) return null
  const stage = STAGES.find((entry) => entry.id === battle.stageId)
  const enemySpecies = speciesOf(enemy.speciesId)
  if (stage?.bossRank && battle.bossTelegraphed) return bossBigMove(stage, enemySpecies)
  return enemyMoveFor(enemy, player)
}

function eventFactory(battle) {
  let ordinal = 0
  const turn = Math.max(1, Number(battle?.turn) || 1)
  const battleId = String(battle?.battleId || battle?.stageId || 'battle')
  return (actor, kind, fields = {}) => {
    const currentOrdinal = ordinal++
    const discriminator = fields.moveId || fields.target || fields.terminalStatus || 'event'
    return {
      eventId: `${battleId}:${turn}:${currentOrdinal}:${actor}:${kind}:${discriminator}`,
      battleId,
      turn,
      ordinal: currentOrdinal,
      actor,
      kind,
      ...fields
    }
  }
}

function maxHpForPlayer(player) {
  if (!player) return 1
  return statsFor(player.speciesId, player.level, player.statMultipliers).hp
}

function resolveDamage(attacker, defender, move, battle, actor) {
  if (!attacker || !defender || !move || move.effect?.type !== 'damage') return null
  if (!deterministicHit(move, battle, actor)) return { hit: false, damage: 0, effectiveness: typeEffectiveness(move.type, speciesOf(defender.speciesId)?.types || []), critical: 1 }
  const result = damageAmount(attacker, defender, move, {
    criticalRoll: battleRoll(battle, actor, 'critical', move.id || move.moveId),
    randomRoll: battleRoll(battle, actor, 'damage-random', move.id || move.moveId)
  })
  return { hit: true, ...result }
}

function canActorAct(status, battle, actor) {
  return statusActionResult(status, battleRoll(battle, actor, 'status-action')).canAct
}

export function buildMovePresentationEvents(game, battle, moveId, result) {
  if (!result?.ok || !result?.battle || !battle || !moveId) return []
  const move = moveOf(moveId)
  const player = playerBattleMonster(game, battle)
  const enemy = enemyBattleMonster(battle)
  if (!move || !player || !enemy) return []

  const makeEvent = eventFactory(battle)
  const events = []
  let playerHp = Math.max(0, Number(battle?.partyHp?.[battle.activeInstanceId]) || 0)
  let enemyHp = Math.max(0, Number(battle?.enemy?.hp) || 0)
  const finalPlayerHp = Math.max(0, Number(result.battle?.partyHp?.[battle.activeInstanceId]) || 0)
  const finalEnemyHp = Math.max(0, Number(result.battle?.enemy?.hp) || 0)
  const enemyMove = plannedEnemyMove(game, battle)

  const forcedPlayerFirst = move.effect?.type === 'heal' || move.effect?.type === 'status'
  const order = forcedPlayerFirst
    ? 'player'
    : speedOrder(
      effectiveSpeed(player),
      effectiveSpeed(enemy),
      battleRoll(battle, 'turn', 'speed-tie')
    )

  const playerCanAct = canActorAct(player.battleStatus, battle, 'player')
  const enemyCanAct = canActorAct(enemy.battleStatus, battle, 'enemy')

  const doPlayer = () => {
    if (!playerCanAct || playerHp <= 0 || enemyHp <= 0) return false
    events.push(makeEvent('player', 'move', { moveId: move.id || move.moveId, target: move.effect?.type === 'heal' ? 'player' : 'enemy' }))
    if (move.effect?.type === 'heal') {
      const hpBefore = playerHp
      const heal = Math.max(1, Math.floor(maxHpForPlayer(player) * (move.effect.healRatio || 0.20)))
      playerHp = Math.min(maxHpForPlayer(player), playerHp + heal)
      events.push(makeEvent('player', 'heal', { moveId: move.id || move.moveId, target: 'player', hpBefore, hpAfter: playerHp }))
      return true
    }
    if (move.effect?.type === 'status') {
      events.push(makeEvent('player', 'status', { moveId: move.id || move.moveId, target: 'enemy' }))
      return true
    }
    const resolved = resolveDamage(player, enemy, move, battle, 'player')
    if (!resolved?.hit) {
      events.push(makeEvent('player', 'miss', { moveId: move.id || move.moveId, target: 'enemy' }))
      return true
    }
    const hpBefore = enemyHp
    enemyHp = Math.max(0, enemyHp - resolved.damage)
    events.push(makeEvent('player', 'damage', {
      moveId: move.id || move.moveId,
      target: 'enemy',
      hpBefore,
      hpAfter: enemyHp,
      effectiveness: resolved.effectiveness,
      critical: resolved.critical > 1
    }))
    return true
  }

  const doEnemy = () => {
    if (!enemyMove || !enemyCanAct || enemyHp <= 0 || playerHp <= 0) return false
    const enemyMoveId = enemyMove.id || enemyMove.moveId || 'enemy-move'
    events.push(makeEvent('enemy', 'move', { moveId: enemyMoveId, target: 'player' }))
    const resolved = resolveDamage(enemy, player, enemyMove, battle, 'enemy')
    if (!resolved?.hit) {
      events.push(makeEvent('enemy', 'miss', { moveId: enemyMoveId, target: 'player' }))
      return true
    }
    const hpBefore = playerHp
    playerHp = Math.max(0, playerHp - resolved.damage)
    events.push(makeEvent('enemy', 'damage', {
      moveId: enemyMoveId,
      target: 'player',
      hpBefore,
      hpAfter: playerHp,
      effectiveness: resolved.effectiveness,
      critical: resolved.critical > 1
    }))
    return true
  }

  if (order === 'player') {
    doPlayer()
    if (enemyHp > 0) doEnemy()
  } else {
    doEnemy()
    if (playerHp > 0) doPlayer()
  }

  // End-turn status damage is semantic but occurs after both normal actions. Use
  // the committed result as the authority for the terminal HP snapshot instead
  // of parsing human-readable log text.
  if (enemyHp !== finalEnemyHp) {
    events.push(makeEvent('system', 'status-damage', { target: 'enemy', hpBefore: enemyHp, hpAfter: finalEnemyHp }))
    enemyHp = finalEnemyHp
  }
  if (playerHp !== finalPlayerHp) {
    events.push(makeEvent('system', 'status-damage', { target: 'player', hpBefore: playerHp, hpAfter: finalPlayerHp }))
    playerHp = finalPlayerHp
  }

  const terminalStatus = result.battle.status
  if (terminalStatus === 'won') {
    events.push(makeEvent('system', 'defeat', { target: 'enemy', terminalStatus }))
    if (result.rewards) events.push(makeEvent('system', 'reward-marker', { target: 'player', terminalStatus }))
  } else if (terminalStatus === 'lost') {
    events.push(makeEvent('system', 'defeat', { target: 'player', terminalStatus }))
  } else if (terminalStatus === 'needs_switch') {
    events.push(makeEvent('system', 'defeat', { target: 'player', terminalStatus }))
  }

  return events
}

export function buildProtectPresentationEvents(game, battle, result) {
  if (!result?.ok || !result?.battle || !battle) return []
  const makeEvent = eventFactory(battle)
  const events = [makeEvent('player', 'protect', { target: 'player' })]
  const enemyMove = plannedEnemyMove(game, battle)
  if (enemyMove && Number(battle.enemy?.hp) > 0) {
    events.push(makeEvent('enemy', 'move', { moveId: enemyMove.id || enemyMove.moveId || 'enemy-move', target: 'player' }))
    events.push(makeEvent('player', 'protect-impact', { target: 'player' }))
  }
  const finalPlayerHp = Math.max(0, Number(result.battle?.partyHp?.[battle.activeInstanceId]) || 0)
  const before = Math.max(0, Number(battle?.partyHp?.[battle.activeInstanceId]) || 0)
  if (before !== finalPlayerHp) events.push(makeEvent('system', 'status-damage', { target: 'player', hpBefore: before, hpAfter: finalPlayerHp }))
  return events
}
