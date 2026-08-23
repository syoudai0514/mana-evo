import { CAPTURE_CONFIG, EVOLUTION_ITEMS, MOVES, SPECIES, STAGES, moveOf, speciesOf, typeEffectiveness } from './content.js'
import { consumeTicket, grantEvolutionItem, refundTicket } from './progression.js'

const clamp = (min, value, max) => Math.max(min, Math.min(max, value))
export const MAX_CAPTURE_ATTEMPTS = 3

export function xpToNext(level) {
  return 60 + level * 18
}

export function statsFor(speciesId, level) {
  const species = speciesOf(speciesId)
  if (!species) throw new Error(`Unknown species: ${speciesId}`)
  const scale = Math.max(0, level - 1)
  return {
    hp: species.base.hp + scale * 3,
    attack: species.base.attack + scale * 2,
    defense: species.base.defense + Math.floor(scale * 1.6),
    speed: species.base.speed + Math.floor(scale * 1.5)
  }
}

export function makeMonster(speciesId, level = 1, instanceId = null) {
  if (!SPECIES[speciesId]) throw new Error(`Unknown species: ${speciesId}`)
  return {
    instanceId: instanceId || `${speciesId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    speciesId,
    level,
    xp: 0,
    heldItemId: null,
    caughtAt: Date.now()
  }
}

export function gainXp(monster, amount) {
  const next = { ...monster, xp: (monster.xp || 0) + Math.max(0, amount) }
  const levels = []
  while (next.xp >= xpToNext(next.level) && next.level < 100) {
    next.xp -= xpToNext(next.level)
    next.level += 1
    levels.push(next.level)
  }
  return { monster: next, levels }
}

export function evolutionConditionMet(monster, species = speciesOf(monster?.speciesId), game = null) {
  const evo = species?.evolution
  if (!monster || !evo?.to) return false
  if (evo.method === 'level') return monster.level >= (evo.level || 1)
  if (evo.method === 'stone') return (game?.evolutionItems?.stones?.[evo.itemId] || 0) > 0
  if (evo.method === 'held_item_level') return monster.heldItemId === evo.heldItemId && monster.level >= (evo.level || 1)
  return false
}

export function canNormalEvolve(monster, game = null) {
  return evolutionConditionMet(monster, speciesOf(monster?.speciesId), game)
}

export function levelsUntilEvolution(monster) {
  const evo = speciesOf(monster?.speciesId)?.evolution
  if (!evo?.to || !['level', 'held_item_level'].includes(evo.method)) return null
  return Math.max(0, (evo.level || 1) - monster.level)
}

export function describeEvolutionCondition(monster) {
  const evo = speciesOf(monster?.speciesId)?.evolution
  if (!evo) return '通常進化：最終形'
  if (evo.method === 'level') return `Lv.${evo.level}で進化`
  if (evo.method === 'stone') return `${EVOLUTION_ITEMS.stones[evo.itemId]?.name || evo.itemId || '進化アイテム'}で進化`
  if (evo.method === 'held_item_level') return `${EVOLUTION_ITEMS.heldItems[evo.heldItemId]?.name || evo.heldItemId || '特定アイテム'}を持って Lv.${evo.level}以上でレベルアップ`
  return '進化条件は未設定'
}

export function normalEvolve(monster, game = null) {
  if (!canNormalEvolve(monster, game)) return { ok: false, monster, reason: 'NOT_READY' }
  const species = speciesOf(monster.speciesId)
  return { ok: true, monster: { ...monster, speciesId: species.evolution.to } }
}

export function stageById(stageId) {
  return STAGES.find((stage) => stage.id === stageId) || null
}

export function isStageUnlocked(game, stage) {
  return !stage.unlockedBy || (game.stagesCleared || []).includes(stage.unlockedBy)
}

function syncActiveBattle(game, battle) {
  const next = structuredClone(game)
  next.activeBattle = structuredClone(battle)
  return next
}

export function currentPlayerHp(battle) {
  return Math.max(0, Number(battle?.partyHp?.[battle?.activeInstanceId]) || 0)
}

export function healthyTeamIds(game, battle) {
  return (game.team || []).filter((id) => game.box?.[id] && (battle.partyHp?.[id] || 0) > 0)
}

export function startBattle(game, stageId, { dailyCompleted = false, dailyDay = null, today } = {}) {
  if (game.activeBattle) return { ok: false, game, battle: game.activeBattle, reason: 'BATTLE_ALREADY_ACTIVE' }
  const stage = stageById(stageId)
  if (!stage) return { ok: false, game, reason: 'UNKNOWN_STAGE' }
  if (!isStageUnlocked(game, stage)) return { ok: false, game, reason: 'LOCKED_STAGE' }
  if (!dailyCompleted || (dailyDay != null && dailyDay !== today)) return { ok: false, game, reason: 'DAILY_NOT_COMPLETED' }
  const ticket = consumeTicket(game, today)
  if (!ticket.ok) return { ok: false, game: ticket.game, reason: 'NO_TICKET' }
  const activeId = ticket.game.activeMonsterId || ticket.game.team?.[0]
  const active = ticket.game.box?.[activeId]
  if (!active) return { ok: false, game: game, reason: 'NO_ACTIVE_MONSTER' }

  const nextGame = structuredClone(ticket.game)
  nextGame.battlesStarted = (nextGame.battlesStarted || 0) + 1
  nextGame.dex ||= { seen: {}, caught: {} }
  nextGame.dex.seen[stage.enemySpeciesId] = true

  const enemyStats = statsFor(stage.enemySpeciesId, stage.enemyLevel)
  const partyHp = Object.fromEntries((nextGame.team || []).filter((id) => nextGame.box[id]).map((id) => {
    const monster = nextGame.box[id]
    return [id, statsFor(monster.speciesId, monster.level).hp]
  }))
  const battle = {
    stageId,
    activeInstanceId: activeId,
    partyHp,
    enemy: {
      speciesId: stage.enemySpeciesId,
      level: stage.enemyLevel,
      hp: enemyStats.hp,
      maxHp: enemyStats.hp
    },
    turn: 1,
    log: [`${speciesOf(stage.enemySpeciesId).name} が あらわれた！`],
    status: 'fighting',
    captureStars: 0,
    captureAttempts: 0,
    lastEffect: 1,
    ticketCommitted: true,
    ticketSource: ticket.consumed,
    ticketRefunded: false
  }
  nextGame.activeBattle = structuredClone(battle)
  return { ok: true, game: nextGame, battle }
}

export function damageAmount(attacker, defender, move) {
  const aStats = statsFor(attacker.speciesId, attacker.level)
  const dStats = statsFor(defender.speciesId, defender.level)
  const attackerSpecies = speciesOf(attacker.speciesId)
  const defenderSpecies = speciesOf(defender.speciesId)
  const stab = attackerSpecies.types.includes(move.type) ? 1.2 : 1
  const effectiveness = typeEffectiveness(move.type, defenderSpecies.types)
  const base = Math.floor((((2 * attacker.level / 5 + 2) * move.power * aStats.attack / Math.max(1, dStats.defense)) / 50) + 2)
  return { damage: Math.max(effectiveness === 0 ? 0 : 1, Math.floor(base * stab * effectiveness)), effectiveness, stab }
}

function enemyMoveFor(enemy, player) {
  const species = speciesOf(enemy.speciesId)
  return species.moves
    .map((id) => moveOf(id))
    .filter(Boolean)
    .sort((a, b) => {
      const aScore = a.power * typeEffectiveness(a.type, speciesOf(player.speciesId).types)
      const bScore = b.power * typeEffectiveness(b.type, speciesOf(player.speciesId).types)
      return bScore - aScore
    })[0] || MOVES.tackle
}

function activeMonster(game, battle) {
  return game.box[battle.activeInstanceId]
}

function resolvePlayerFaint(game, battle) {
  if (currentPlayerHp(battle) > 0) return battle
  const others = healthyTeamIds(game, battle).filter((id) => id !== battle.activeInstanceId)
  if (others.length) {
    battle.status = 'needs_switch'
    battle.log = [...battle.log.slice(-5), 'たおれた！ つぎの なかまを えらぼう！']
  } else {
    battle.status = 'lost'
    battle.log = [...battle.log.slice(-5), 'まけちゃった…。チームをそだてて もういちど！']
  }
  return battle
}

function refundLostBattleIfNeeded(game, battle, today) {
  if (battle.status !== 'lost' || battle.ticketRefunded || !battle.ticketSource) return { game, battle }
  const refund = refundTicket(game, battle.ticketSource, today)
  const nextBattle = structuredClone(battle)
  nextBattle.ticketRefunded = refund.refunded
  if (refund.refunded) nextBattle.log = [...nextBattle.log.slice(-5), '🎫 バトルチケットが 1まい もどった！']
  return { game: refund.game, battle: nextBattle }
}

function enemyAttackOnce(game, battle, log) {
  if (battle.enemy.hp <= 0) return null
  const player = activeMonster(game, battle)
  if (!player || currentPlayerHp(battle) <= 0) return null
  const enemy = { speciesId: battle.enemy.speciesId, level: battle.enemy.level }
  const enemyMove = enemyMoveFor(enemy, player)
  const result = damageAmount(enemy, player, enemyMove)
  battle.partyHp[battle.activeInstanceId] = Math.max(0, currentPlayerHp(battle) - result.damage)
  log.push(`${speciesOf(enemy.speciesId).name} の ${enemyMove.name}！ ${result.damage} ダメージ`)
  return result
}

function grantStageEvolutionReward(game, stage) {
  if (!stage?.evolutionReward) return { game, evolutionReward: null }
  const granted = grantEvolutionItem(game, stage.evolutionReward.kind, stage.evolutionReward.itemId, stage.evolutionReward.count || 1)
  return granted.ok ? { game: granted.game, evolutionReward: stage.evolutionReward } : { game, evolutionReward: null }
}

function awardWin(game, battle) {
  let next = structuredClone(game)
  const stage = stageById(battle.stageId)
  const current = next.box[battle.activeInstanceId]
  const gained = gainXp(current, stage.xp)
  next.box[battle.activeInstanceId] = gained.monster
  next.mana = (next.mana || 0) + stage.mana
  next.battlesWon = (next.battlesWon || 0) + 1
  next.stagesCleared ||= []
  if (!next.stagesCleared.includes(stage.id)) next.stagesCleared.push(stage.id)
  const granted = grantStageEvolutionReward(next, stage)
  next = granted.game
  return { game: next, levels: gained.levels, xp: stage.xp, mana: stage.mana, evolutionReward: granted.evolutionReward }
}

export function useMove(game, battle, moveId) {
  if (battle.status !== 'fighting') return { ok: false, game, battle, reason: battle.status === 'needs_switch' ? 'SWITCH_REQUIRED' : 'BATTLE_FINISHED' }
  const player = activeMonster(game, battle)
  const playerSpecies = speciesOf(player.speciesId)
  if (!playerSpecies.moves.includes(moveId)) return { ok: false, game, battle, reason: 'UNKNOWN_MOVE' }
  const enemy = { speciesId: battle.enemy.speciesId, level: battle.enemy.level }
  const move = moveOf(moveId)
  const playerStats = statsFor(player.speciesId, player.level)
  const enemyStats = statsFor(enemy.speciesId, enemy.level)
  const next = structuredClone(battle)
  const log = []

  const playerAttack = () => {
    const result = damageAmount(player, enemy, move)
    next.enemy.hp = Math.max(0, next.enemy.hp - result.damage)
    next.lastEffect = result.effectiveness
    log.push(`${playerSpecies.name} の ${move.name}！ ${result.damage} ダメージ`)
    return result
  }

  if (playerStats.speed >= enemyStats.speed) {
    playerAttack()
    enemyAttackOnce(game, next, log)
  } else {
    enemyAttackOnce(game, next, log)
    if (currentPlayerHp(next) > 0) playerAttack()
  }

  next.turn += 1
  next.log = [...next.log.slice(-4), ...log].slice(-6)

  if (next.enemy.hp <= 0) {
    next.status = 'won'
    const rewards = awardWin(game, next)
    next.log.push(`かち！ XP +${rewards.xp} / マナ +${rewards.mana}`)
    const synced = syncActiveBattle(rewards.game, next)
    return { ok: true, game: synced, battle: next, rewards }
  }

  resolvePlayerFaint(game, next)
  const resolved = refundLostBattleIfNeeded(game, next)
  return { ok: true, game: syncActiveBattle(resolved.game, resolved.battle), battle: resolved.battle }
}

export function baseCaptureChance(battle) {
  const species = speciesOf(battle.enemy.speciesId)
  const missing = 1 - battle.enemy.hp / battle.enemy.maxHp
  return clamp(0.12, 0.34 + missing * 0.62 - (species.catchRank || 1) * 0.07, 0.9)
}

export function captureChance(battle, itemType = 'star') {
  const config = CAPTURE_CONFIG[itemType] || CAPTURE_CONFIG.star
  if (config.guaranteed) return 1
  return clamp(0.01, baseCaptureChance(battle) * config.multiplier, CAPTURE_CONFIG.nonRainbowCap)
}

export function canAttemptCapture(game, battle, itemType = 'star') {
  return battle.status === 'fighting' && battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5 &&
    (battle.captureAttempts || 0) < MAX_CAPTURE_ATTEMPTS && (game.captureItems?.[itemType] || 0) > 0
}

export function attemptCapture(game, battle, rolls = null, itemType = 'star') {
  if (!canAttemptCapture(game, battle, itemType)) {
    const reason = (battle.captureAttempts || 0) >= MAX_CAPTURE_ATTEMPTS ? 'CAPTURE_LIMIT' : 'CAPTURE_NOT_READY'
    return { ok: false, game, battle, reason }
  }
  let nextGame = structuredClone(game)
  nextGame.captureItems[itemType] -= 1
  const chance = captureChance(battle, itemType)
  const perStarChance = Math.pow(chance, 1 / 4)
  const samples = rolls || Array.from({ length: 4 }, () => Math.random())
  let stars = 0
  for (const roll of samples.slice(0, 4)) {
    if (roll <= perStarChance) stars += 1
    else break
  }

  const nextBattle = structuredClone(battle)
  nextBattle.captureAttempts = (nextBattle.captureAttempts || 0) + 1
  nextBattle.captureStars = stars
  nextBattle.turn += 1
  if (stars < 4) {
    const log = [`「わ」が ${stars}こ 光った！ でも逃げられた！`]
    enemyAttackOnce(nextGame, nextBattle, log)
    nextBattle.log = [...nextBattle.log.slice(-4), ...log].slice(-6)
    resolvePlayerFaint(nextGame, nextBattle)
    const resolved = refundLostBattleIfNeeded(nextGame, nextBattle)
    resolved.game.activeBattle = structuredClone(resolved.battle)
    return { ok: true, caught: false, stars, chance, game: resolved.game, battle: resolved.battle }
  }

  const captured = makeMonster(battle.enemy.speciesId, battle.enemy.level)
  nextGame.box[captured.instanceId] = captured
  nextGame.dex ||= { seen: {}, caught: {} }
  nextGame.dex.caught[battle.enemy.speciesId] = true
  nextGame.dex.seen[battle.enemy.speciesId] = true
  if ((nextGame.team || []).length < 3) nextGame.team.push(captured.instanceId)
  nextGame.monstersCaught = (nextGame.monstersCaught || 0) + 1
  const stage = stageById(battle.stageId)
  nextGame.mana = (nextGame.mana || 0) + Math.floor(stage.mana / 2)
  nextGame.stagesCleared ||= []
  if (!nextGame.stagesCleared.includes(stage.id)) nextGame.stagesCleared.push(stage.id)
  const granted = grantStageEvolutionReward(nextGame, stage)
  nextGame = granted.game
  nextBattle.status = 'caught'
  nextBattle.log = [...nextBattle.log.slice(-4), '★★★★ 「わ」が ひかった！ ゲット！']
  nextGame.activeBattle = structuredClone(nextBattle)
  return { ok: true, caught: true, stars, chance, captured, evolutionReward: granted.evolutionReward, game: nextGame, battle: nextBattle }
}

export function switchBattleMonster(game, battle, instanceId) {
  if (!['fighting', 'needs_switch'].includes(battle.status)) return { ok: false, game, battle, reason: 'BATTLE_FINISHED' }
  if (!(game.team || []).includes(instanceId) || !game.box[instanceId]) return { ok: false, game, battle, reason: 'NOT_IN_TEAM' }
  if ((battle.partyHp?.[instanceId] || 0) <= 0) return { ok: false, game, battle, reason: 'FAINTED' }
  if (instanceId === battle.activeInstanceId) return { ok: true, game, battle }

  const forced = battle.status === 'needs_switch'
  const nextGame = structuredClone(game)
  nextGame.activeMonsterId = instanceId
  const nextBattle = structuredClone(battle)
  nextBattle.activeInstanceId = instanceId
  nextBattle.status = 'fighting'
  const log = [`${speciesOf(game.box[instanceId].speciesId).name} に こうたい！`]

  // Voluntary switching consumes the turn. A forced switch after fainting does not take
  // another enemy attack, so a child never gets hit twice for one knockout.
  if (!forced) {
    enemyAttackOnce(nextGame, nextBattle, log)
    nextBattle.turn += 1
    resolvePlayerFaint(nextGame, nextBattle)
  }
  nextBattle.log = [...nextBattle.log.slice(-4), ...log].slice(-6)
  const resolved = refundLostBattleIfNeeded(nextGame, nextBattle)
  resolved.game.activeBattle = structuredClone(resolved.battle)
  return { ok: true, game: resolved.game, battle: resolved.battle }
}

export function abandonBattle(game, { today } = {}) {
  if (!game.activeBattle) return { ok: false, game, reason: 'NO_ACTIVE_BATTLE' }
  const battle = structuredClone(game.activeBattle)
  let next = structuredClone(game)
  if (!battle.ticketRefunded && battle.ticketSource) {
    const refund = refundTicket(next, battle.ticketSource, today)
    next = refund.game
    battle.ticketRefunded = refund.refunded
  }
  next.activeBattle = null
  next.battlesAbandoned = (next.battlesAbandoned || 0) + 1
  return { ok: true, game: next, refunded: !!battle.ticketRefunded }
}

export function clearFinishedBattle(game, { today } = {}) {
  if (!game.activeBattle || !['won', 'lost', 'caught'].includes(game.activeBattle.status)) return { ok: false, game, reason: 'BATTLE_NOT_FINISHED' }
  let next = structuredClone(game)
  if (next.activeBattle.status === 'lost' && !next.activeBattle.ticketRefunded && next.activeBattle.ticketSource) {
    const refund = refundTicket(next, next.activeBattle.ticketSource, today)
    next = refund.game
  }
  next.activeBattle = null
  return { ok: true, game: next }
}

export function evolveInstance(game, instanceId) {
  const current = game.box?.[instanceId]
  if (!current) return { ok: false, game, reason: 'UNKNOWN_MONSTER' }
  const species = speciesOf(current.speciesId)
  const result = normalEvolve(current, game)
  if (!result.ok) return { ok: false, game, reason: result.reason }
  const next = structuredClone(game)
  const from = current.speciesId
  if (species.evolution.method === 'stone') {
    const itemId = species.evolution.itemId
    next.evolutionItems.stones[itemId] = Math.max(0, (next.evolutionItems.stones[itemId] || 0) - 1)
    if (next.evolutionItems.stones[itemId] <= 0) delete next.evolutionItems.stones[itemId]
  }
  // held-item evolution keeps the equipped item after evolution; stones are consumed above.
  next.box[instanceId] = result.monster
  next.dex ||= { seen: {}, caught: {} }
  next.dex.seen[result.monster.speciesId] = true
  next.dex.caught[result.monster.speciesId] = true
  return { ok: true, game: next, from, to: result.monster.speciesId }
}

export function setTeam(game, instanceIds) {
  const unique = [...new Set(instanceIds)].filter((id) => game.box?.[id]).slice(0, 3)
  if (!unique.length) return { ok: false, game, reason: 'EMPTY_TEAM' }
  const next = { ...game, team: unique, activeMonsterId: unique.includes(game.activeMonsterId) ? game.activeMonsterId : unique[0] }
  return { ok: true, game: next }
}