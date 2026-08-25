import { AREA_META, CAPTURE_CONFIG, EVOLUTION_ITEMS, MOVES, SPECIES, STAGES, moveOf, speciesOf, typeEffectiveness } from './content.js'
import { BALANCE_VERSION, BOSS_RANKS, battleXpForStage, buildEnemyPlan, statsFromBase } from './balance.js'
import { consumeTicket, grantEvolutionItem, refundTicket, specialProgressionStatus } from './progression.js'

const clamp = (min, value, max) => Math.max(min, Math.min(max, value))
export const MAX_CAPTURE_ATTEMPTS = 3
export const GIGA_MULTIPLIER = 1.35
export const BURST_HP_MULTIPLIER = 2
export const BURST_ATTACK_MULTIPLIER = 1.2
export const BURST_TURNS = 3

export function totalXpForLevel(level) {
  const lv = clamp(1, Math.floor(Number(level) || 1), 100)
  return Math.round(6 * Math.pow(lv - 1, 1.9))
}

export function xpToNext(level) {
  const lv = clamp(1, Math.floor(Number(level) || 1), 100)
  if (lv >= 100) return 0
  return totalXpForLevel(lv + 1) - totalXpForLevel(lv)
}

export function statsFor(speciesId, level, multipliers = null) {
  const species = speciesOf(speciesId)
  if (!species) throw new Error(`Unknown species: ${speciesId}`)
  return statsFromBase(species.base, level, multipliers)
}

export function makeMonster(speciesId, level = 1, instanceId = null) {
  const species = speciesOf(speciesId)
  if (!species) throw new Error(`Unknown species: ${speciesId}`)
  return {
    instanceId: instanceId || `${species.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    speciesId: species.id,
    level,
    xp: 0,
    heldItemId: null,
    evolutionReady: false,
    caughtAt: Date.now()
  }
}

function isHeldItemLevelupEvolution(evo) {
  return evo?.method === 'held_item_levelup'
}

export function gainXp(monster, amount) {
  const next = { ...monster, xp: (monster.xp || 0) + Math.max(0, amount), evolutionReady: !!monster.evolutionReady }
  const levels = []
  while (next.level < 100 && next.xp >= xpToNext(next.level)) {
    next.xp -= xpToNext(next.level)
    next.level += 1
    levels.push(next.level)
    const evo = speciesOf(next.speciesId)?.evolution
    if (isHeldItemLevelupEvolution(evo) && next.heldItemId === evo.heldItemId) next.evolutionReady = true
  }
  return { monster: next, levels }
}

export function evolutionConditionMet(monster, species = speciesOf(monster?.speciesId), game = null) {
  const evo = species?.evolution
  if (!monster || !evo?.to) return false
  if (evo.method === 'level') return monster.level >= (evo.level || 1)
  if (evo.method === 'stone') return (game?.evolutionItems?.stones?.[evo.itemId] || 0) > 0
  if (isHeldItemLevelupEvolution(evo)) return monster.heldItemId === evo.heldItemId && monster.evolutionReady === true
  return false
}

export function canNormalEvolve(monster, game = null) {
  return evolutionConditionMet(monster, speciesOf(monster?.speciesId), game)
}

export function levelsUntilEvolution(monster) {
  const evo = speciesOf(monster?.speciesId)?.evolution
  if (!evo?.to || evo.method !== 'level') return null
  return Math.max(0, (evo.level || 1) - monster.level)
}

export function describeEvolutionCondition(monster) {
  const evo = speciesOf(monster?.speciesId)?.evolution
  if (!evo) return '通常進化：最終形'
  if (evo.method === 'level') return `Lv.${evo.level}で進化`
  if (evo.method === 'stone') return `${EVOLUTION_ITEMS.stones[evo.itemId]?.name || evo.itemId || '進化アイテム'}で進化`
  if (isHeldItemLevelupEvolution(evo)) return `${EVOLUTION_ITEMS.heldItems[evo.heldItemId]?.name || evo.heldItemId || '特定アイテム'}をもって レベルアップすると進化`
  return '進化条件は未設定'
}

export function normalEvolve(monster, game = null) {
  if (!canNormalEvolve(monster, game)) return { ok: false, monster, reason: 'NOT_READY' }
  const species = speciesOf(monster.speciesId)
  return { ok: true, monster: { ...monster, speciesId: species.evolution.to, evolutionReady: false } }
}

export function stageById(stageId) {
  return STAGES.find((stage) => stage.id === stageId) || null
}

function ownsSpecies(game, speciesId) {
  return !!game?.dex?.caught?.[speciesId] || Object.values(game?.box || {}).some((monster) => monster.speciesId === speciesId)
}

function areaWildClearCount(game, area) {
  const cleared = new Set(game?.stagesCleared || [])
  return STAGES.filter((stage) => (stage.adventureArea || stage.area) === area && stage.kind === 'wild' && cleared.has(stage.id)).length
}

function zoneWildClearCount(game, area, zoneId) {
  const cleared = new Set(game?.stagesCleared || [])
  return STAGES.filter((stage) => (stage.adventureArea || stage.area) === area && stage.kind === 'wild' && stage.zoneId === zoneId && cleared.has(stage.id)).length
}

export function adventureZoneProgress(game, area, zoneId) {
  const meta = AREA_META.find((entry) => entry.area === Number(area))
  if (!meta) return { unlocked: Number(area) === 5, clears: 0, required: 0, remaining: 0, previousZoneName: null }
  const index = meta.zones.findIndex((zone) => zone.id === zoneId)
  if (index <= 0) return { unlocked: true, clears: 0, required: 0, remaining: 0, previousZoneName: null }
  const previous = meta.zones[index - 1]
  const required = 2
  const clears = zoneWildClearCount(game, meta.area, previous.id)
  return { unlocked: clears >= required, clears, required, remaining: Math.max(0, required - clears), previousZoneName: previous.name }
}

export function isAdventureZoneUnlocked(game, area, zoneId) {
  return adventureZoneProgress(game, area, zoneId).unlocked
}

export function isStageUnlocked(game, stage) {
  if (!stage) return false
  const cleared = new Set(game?.stagesCleared || [])
  if (stage.hidden) return false
  if (stage.unlockedBy && !cleared.has(stage.unlockedBy)) return false
  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return false
  if (stage.requiresAllAreasCleared && ![1, 2, 3, 4].every((area) => cleared.has(`a${area}-boss`))) return false
  if (stage.zoneId && Number(stage.adventureArea || stage.area) <= 4 && !isAdventureZoneUnlocked(game, stage.adventureArea || stage.area, stage.zoneId)) return false
  if (stage.requiresEvolutionDiscoverySpeciesId && !game?.evolutionDiscoveries?.[stage.requiresEvolutionDiscoverySpeciesId]) return false
  if (stage.requiresOwnedSpeciesId && !ownsSpecies(game, stage.requiresOwnedSpeciesId)) return false
  if (stage.minAreaClears && areaWildClearCount(game, stage.area) < stage.minAreaClears) return false
  return true
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

function playerSpecialMultipliers(battle, instanceId) {
  const special = battle?.playerSpecial
  if (!special || special.instanceId !== instanceId) return null
  if (special.type === 'giga') return { hp: GIGA_MULTIPLIER, attack: GIGA_MULTIPLIER, defense: GIGA_MULTIPLIER, speed: GIGA_MULTIPLIER }
  if (special.type === 'burst') return { hp: BURST_HP_MULTIPLIER, attack: BURST_ATTACK_MULTIPLIER, defense: 1, speed: 1 }
  return null
}

export function currentPlayerMaxHp(game, battle, instanceId = battle?.activeInstanceId) {
  const monster = game?.box?.[instanceId]
  if (!monster) return 1
  return statsFor(monster.speciesId, monster.level, playerSpecialMultipliers(battle, instanceId)).hp
}

function battleMonster(game, battle, instanceId = battle.activeInstanceId) {
  const monster = game.box[instanceId]
  return monster ? { ...monster, statMultipliers: playerSpecialMultipliers(battle, instanceId) } : null
}

function bossBigMove(stage, enemySpecies) {
  const rank = BOSS_RANKS[stage?.bossRank] || BOSS_RANKS.A
  return {
    id: `${stage?.id || 'boss'}-big-move`,
    moveId: `${stage?.id || 'boss'}-big-move`,
    name: `${enemySpecies.name}の おおわざ`,
    type: enemySpecies.types[0],
    power: rank.bigMovePower,
    accuracy: 100,
    effect: { type: 'damage' },
    role: 'boss-big'
  }
}

export function startBattle(game, stageId, { dailyCompleted = false, dailyDay = null, today, challenge = false } = {}) {
  if (game.activeBattle) return { ok: false, game, battle: game.activeBattle, reason: 'BATTLE_ALREADY_ACTIVE' }
  const stage = stageById(stageId)
  if (!stage) return { ok: false, game, reason: 'UNKNOWN_STAGE' }
  if (!isStageUnlocked(game, stage)) return { ok: false, game, reason: 'LOCKED_STAGE' }
  if (!dailyCompleted || (dailyDay != null && dailyDay !== today)) return { ok: false, game, reason: 'DAILY_NOT_COMPLETED' }
  const ticket = consumeTicket(game, today)
  if (!ticket.ok) return { ok: false, game: ticket.game, reason: 'NO_TICKET' }
  const activeId = ticket.game.activeMonsterId || ticket.game.team?.[0]
  const active = ticket.game.box?.[activeId]
  if (!active) return { ok: false, game, reason: 'NO_ACTIVE_MONSTER' }

  const existingSnapshot = ticket.game.bossBalanceSnapshots?.[stage.id] || null
  const balancePlan = buildEnemyPlan(ticket.game, stage, speciesOf, existingSnapshot, { challenge })
  const enemyLevel = balancePlan?.level || stage.enemyLevel || 1
  const enemyMultipliers = balancePlan?.statMultipliers || null

  const nextGame = structuredClone(ticket.game)
  nextGame.bossBalanceSnapshots ||= {}
  nextGame.normalStageSnapshots ||= {}
  if (balancePlan?.snapshot && !challenge && !existingSnapshot) {
    nextGame.bossBalanceSnapshots[stage.id] = structuredClone(balancePlan.snapshot)
  }
  nextGame.battlesStarted = (nextGame.battlesStarted || 0) + 1
  nextGame.dex ||= { seen: {}, caught: {} }
  nextGame.dex.seen[stage.enemySpeciesId] = true

  const enemyStats = statsFor(stage.enemySpeciesId, enemyLevel, enemyMultipliers)
  const teamAtStart = (nextGame.team || []).filter((id) => nextGame.box[id]).slice(0, 3)
  const partyHp = Object.fromEntries(teamAtStart.map((id) => {
    const monster = nextGame.box[id]
    return [id, statsFor(monster.speciesId, monster.level).hp]
  }))
  const battle = {
    stageId,
    challenge: !!challenge,
    rngSeed: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    activeInstanceId: activeId,
    teamAtStart,
    partyHp,
    enemy: {
      speciesId: stage.enemySpeciesId,
      level: enemyLevel,
      hp: enemyStats.hp,
      maxHp: enemyStats.hp,
      statMultipliers: enemyMultipliers,
      balance: balancePlan ? {
        mode: balancePlan.mode,
        referencePower: balancePlan.referencePower,
        currentReferencePower: balancePlan.currentReferencePower,
        repeatCap: balancePlan.repeatCap,
        targetPower: balancePlan.targetPower,
        actualPower: balancePlan.actualPower,
        difficultyLabel: balancePlan.difficultyLabel,
        bossRank: balancePlan.bossRank
      } : null
    },
    turn: 1,
    log: [`${speciesOf(stage.enemySpeciesId).name} が あらわれた！`],
    status: 'fighting',
    captureStars: 0,
    captureAttempts: 0,
    lastEffect: 1,
    ticketCommitted: true,
    ticketSource: ticket.consumed,
    ticketRefunded: false,
    moveUses: {},
    lastPlayerAction: null,
    specialUsed: false,
    playerSpecial: null,
    bossTelegraphed: false,
    bossCountdown: stage.bossRank ? 2 : 0
  }
  nextGame.activeBattle = structuredClone(battle)
  return { ok: true, game: nextGame, battle }
}

export function damageAmount(attacker, defender, move) {
  const aStats = statsFor(attacker.speciesId, attacker.level, attacker.statMultipliers)
  const dStats = statsFor(defender.speciesId, defender.level, defender.statMultipliers)
  const attackerSpecies = speciesOf(attacker.speciesId)
  const defenderSpecies = speciesOf(defender.speciesId)
  const stab = attackerSpecies.types.includes(move.type) ? 1.2 : 1
  const effectiveness = typeEffectiveness(move.type, defenderSpecies.types)
  const base = Math.floor((((2 * attacker.level / 5 + 2) * move.power * aStats.attack / Math.max(1, dStats.defense)) / 50) + 2)
  return { damage: Math.max(effectiveness === 0 ? 0 : 1, Math.floor(base * stab * effectiveness)), effectiveness, stab }
}

function deterministicHit(move, battle, actor = 'player') {
  const accuracy = clamp(1, Number(move?.accuracy) || 100, 100)
  if (accuracy >= 100) return true
  const seed = `${battle.rngSeed || 'legacy'}:${battle.stageId}:${battle.turn}:${move.id || move.moveId}:${actor}`
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619) >>> 0
  return (hash % 100) < accuracy
}

function enemyMoveFor(enemy, player) {
  const species = speciesOf(enemy.speciesId)
  return species.moves
    .map((id) => moveOf(id))
    .filter((move) => move?.effect?.type === 'damage' && move.power > 0)
    .sort((a, b) => {
      const aScore = a.power * ((a.accuracy ?? 100) / 100) * typeEffectiveness(a.type, speciesOf(player.speciesId).types)
      const bScore = b.power * ((b.accuracy ?? 100) / 100) * typeEffectiveness(b.type, speciesOf(player.speciesId).types)
      return bScore - aScore
    })[0] || Object.values(MOVES).find((move) => move.effect?.type === 'damage')
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

function afterBossAction(stage, battle, log, usedBigMove = false) {
  if (!stage?.bossRank) return
  if (usedBigMove) {
    battle.bossTelegraphed = false
    battle.bossCountdown = 2
    return
  }
  if (battle.bossTelegraphed) return
  battle.bossCountdown = Math.max(0, (battle.bossCountdown || 1) - 1)
  if (battle.bossCountdown === 0) {
    battle.bossTelegraphed = true
    log.push('⚠️ つぎに おおわざ！ まもるなら いま！')
  }
}

function enemyAttackOnce(game, battle, log, { blocked = false } = {}) {
  if (battle.enemy.hp <= 0) return null
  const player = battleMonster(game, battle)
  if (!player || currentPlayerHp(battle) <= 0) return null
  const stage = stageById(battle.stageId)
  const enemy = { speciesId: battle.enemy.speciesId, level: battle.enemy.level, statMultipliers: battle.enemy.statMultipliers }
  const enemySpecies = speciesOf(enemy.speciesId)
  const useBigMove = !!stage?.bossRank && !!battle.bossTelegraphed
  const enemyMove = useBigMove ? bossBigMove(stage, enemySpecies) : enemyMoveFor(enemy, player)
  if (blocked) {
    log.push(`🛡️ まもる！ ${enemySpecies.name} の ${enemyMove.name}を ふせいだ！`)
    afterBossAction(stage, battle, log, useBigMove)
    return { blocked: true, move: enemyMove }
  }
  if (!deterministicHit(enemyMove, battle, 'enemy')) {
    log.push(`${enemySpecies.name} の ${enemyMove.name}！ でも はずれた！`)
    afterBossAction(stage, battle, log, useBigMove)
    return { damage: 0, missed: true, move: enemyMove }
  }
  const result = damageAmount(enemy, player, enemyMove)
  battle.partyHp[battle.activeInstanceId] = Math.max(0, currentPlayerHp(battle) - result.damage)
  log.push(`${enemySpecies.name} の ${enemyMove.name}！ ${result.damage} ダメージ`)
  afterBossAction(stage, battle, log, useBigMove)
  return { ...result, move: enemyMove }
}

function grantStageEvolutionReward(game, stage, firstClear) {
  if (!firstClear || !stage?.evolutionReward) return { game, evolutionReward: null }
  const granted = grantEvolutionItem(game, stage.evolutionReward.kind, stage.evolutionReward.itemId, stage.evolutionReward.count || 1)
  return granted.ok ? { game: granted.game, evolutionReward: stage.evolutionReward } : { game, evolutionReward: null }
}

function grantStageSpecialReward(game, stage, firstClear) {
  if (!firstClear || !stage?.specialReward) return { game, specialReward: null }
  const next = structuredClone(game)
  const reward = stage.specialReward
  if (reward.type === 'giga-key') {
    next.gigaKeyOwned = true
  } else if (reward.type === 'giga') {
    next.gigaCoreSpecies ||= {}
    next.gigaCoreSpecies[reward.speciesId] = true
  } else if (reward.type === 'burst') {
    next.burstMarks ||= {}
    next.burstMarks[reward.speciesId] = true
  } else if (reward.type === 'rainbow') {
    next.captureItems ||= { star: 0, silver: 0, gold: 0, rainbow: 0 }
    next.captureItems.rainbow = (next.captureItems.rainbow || 0) + Math.max(1, reward.count || 1)
  }
  return { game: next, specialReward: reward }
}

function recordNormalFirstClearSnapshot(game, stage, battle) {
  if (!stage || stage.bossRank) return game
  const next = structuredClone(game)
  next.normalStageSnapshots ||= {}
  if (next.normalStageSnapshots[stage.id]) return next
  const firstClearReferencePower = Number(battle?.enemy?.balance?.referencePower)
  if (!Number.isFinite(firstClearReferencePower) || firstClearReferencePower <= 0) return next
  next.normalStageSnapshots[stage.id] = {
    stageId: stage.id,
    firstClearReferencePower,
    balanceVersion: BALANCE_VERSION
  }
  return next
}

function awardTeamBattleXp(game, battle, xp) {
  const next = structuredClone(game)
  const levelsByInstance = {}
  for (const instanceId of (battle.teamAtStart || []).slice(0, 3)) {
    const current = next.box?.[instanceId]
    if (!current) continue
    const gained = gainXp(current, xp)
    next.box[instanceId] = gained.monster
    levelsByInstance[instanceId] = gained.levels
  }
  return { game: next, levelsByInstance }
}

function awardWin(game, battle) {
  let next = structuredClone(game)
  const stage = stageById(battle.stageId)
  const xp = battleXpForStage(stage)
  const gained = awardTeamBattleXp(next, battle, xp)
  next = gained.game
  next.mana = (next.mana || 0) + stage.mana
  next.battlesWon = (next.battlesWon || 0) + 1
  next.stagesCleared ||= []
  const firstClear = !next.stagesCleared.includes(stage.id)
  next = recordNormalFirstClearSnapshot(next, stage, battle)
  if (firstClear) next.stagesCleared.push(stage.id)
  const evolutionGrant = grantStageEvolutionReward(next, stage, firstClear)
  next = evolutionGrant.game
  const specialGrant = grantStageSpecialReward(next, stage, firstClear)
  next = specialGrant.game
  return {
    game: next,
    levelsByInstance: gained.levelsByInstance,
    xp,
    mana: stage.mana,
    evolutionReward: evolutionGrant.evolutionReward,
    specialReward: specialGrant.specialReward,
    firstClear
  }
}

function moveUseKey(instanceId, moveId) { return `${instanceId}:${moveId}` }

function endBurstIfNeeded(game, battle, log) {
  if (battle.playerSpecial?.type !== 'burst') return
  battle.playerSpecial.turnsLeft -= 1
  if (battle.playerSpecial.turnsLeft > 0) return
  const instanceId = battle.playerSpecial.instanceId
  const monster = game.box[instanceId]
  if (monster) {
    const baseMax = statsFor(monster.speciesId, monster.level).hp
    const burstMax = statsFor(monster.speciesId, monster.level, { hp: BURST_HP_MULTIPLIER, attack: BURST_ATTACK_MULTIPLIER, defense: 1, speed: 1 }).hp
    const current = Math.max(0, battle.partyHp[instanceId] || 0)
    battle.partyHp[instanceId] = current <= 0 ? 0 : Math.max(1, Math.ceil(current * baseMax / burstMax))
  }
  battle.playerSpecial = null
  log.push('キョダイバーストが おわった！')
}

export function availableBattleMoveIds(game, battle) {
  const monster = activeMonster(game, battle)
  const species = monster ? speciesOf(monster.speciesId) : null
  if (!species) return []
  const ids = [...species.moves]
  if (battle.playerSpecial?.type === 'burst' && battle.playerSpecial.instanceId === monster.instanceId && species.burstMoveId) {
    const replaceIndex = ids.findIndex((id) => ['finisher', 'identity'].includes(moveOf(id)?.role))
    ids[replaceIndex >= 0 ? replaceIndex : Math.max(0, ids.length - 1)] = species.burstMoveId
  }
  return ids
}

export function useMove(game, battle, moveId) {
  if (battle.status !== 'fighting') return { ok: false, game, battle, reason: battle.status === 'needs_switch' ? 'SWITCH_REQUIRED' : 'BATTLE_FINISHED' }
  const playerRaw = activeMonster(game, battle)
  const playerSpecies = speciesOf(playerRaw.speciesId)
  if (!availableBattleMoveIds(game, battle).includes(moveId)) return { ok: false, game, battle, reason: 'UNKNOWN_MOVE' }
  const move = moveOf(moveId)
  if (!move) return { ok: false, game, battle, reason: 'UNKNOWN_MOVE' }
  const next = structuredClone(battle)
  const log = []
  const player = battleMonster(game, next)
  const enemy = { speciesId: next.enemy.speciesId, level: next.enemy.level, statMultipliers: next.enemy.statMultipliers }
  const useKey = moveUseKey(player.instanceId, moveId)
  if (move.effect?.usesPerBattle && (next.moveUses?.[useKey] || 0) >= move.effect.usesPerBattle) {
    return { ok: false, game, battle, reason: 'MOVE_USE_LIMIT' }
  }
  next.moveUses ||= {}
  next.moveUses[useKey] = (next.moveUses[useKey] || 0) + 1
  next.lastPlayerAction = `move:${moveId}`

  const playerAttack = () => {
    if (!deterministicHit(move, next, 'player')) {
      log.push(`${playerSpecies.name} の ${move.name}！ でも はずれた！`)
      return { damage: 0, effectiveness: 1, missed: true }
    }
    const result = damageAmount(player, enemy, move)
    next.enemy.hp = Math.max(0, next.enemy.hp - result.damage)
    next.lastEffect = result.effectiveness
    log.push(`${playerSpecies.name} の ${move.name}！ ${result.damage} ダメージ`)
    return result
  }

  if (move.effect?.type === 'heal') {
    const maxHp = currentPlayerMaxHp(game, next)
    const heal = Math.max(1, Math.floor(maxHp * (move.effect.healRatio || 0.20)))
    const before = currentPlayerHp(next)
    next.partyHp[next.activeInstanceId] = Math.min(maxHp, before + heal)
    log.push(`${playerSpecies.name} の ${move.name}！ HPが ${next.partyHp[next.activeInstanceId] - before} かいふく！`)
    enemyAttackOnce(game, next, log)
  } else {
    const playerStats = statsFor(player.speciesId, player.level, player.statMultipliers)
    const enemyStats = statsFor(enemy.speciesId, enemy.level, enemy.statMultipliers)
    if (playerStats.speed >= enemyStats.speed) {
      playerAttack()
      enemyAttackOnce(game, next, log)
    } else {
      enemyAttackOnce(game, next, log)
      if (currentPlayerHp(next) > 0) playerAttack()
    }
  }

  if (next.playerSpecial?.type === 'burst' && next.playerSpecial.instanceId === next.activeInstanceId) endBurstIfNeeded(game, next, log)
  next.turn += 1
  next.log = [...next.log.slice(-4), ...log].slice(-8)

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

export function canUseProtect(battle) {
  return battle?.status === 'fighting' && battle.lastPlayerAction !== 'protect'
}

export function useProtect(game, battle) {
  if (!canUseProtect(battle)) return { ok: false, game, battle, reason: 'PROTECT_CONSECUTIVE' }
  const next = structuredClone(battle)
  const log = ['🛡️ まもる！']
  next.lastPlayerAction = 'protect'
  enemyAttackOnce(game, next, log, { blocked: true })
  if (next.playerSpecial?.type === 'burst' && next.playerSpecial.instanceId === next.activeInstanceId) endBurstIfNeeded(game, next, log)
  next.turn += 1
  next.log = [...next.log.slice(-4), ...log].slice(-8)
  resolvePlayerFaint(game, next)
  return { ok: true, game: syncActiveBattle(game, next), battle: next }
}

function activateSpecial(game, battle, type) {
  if (battle?.status !== 'fighting') return { ok: false, game, battle, reason: 'BATTLE_FINISHED' }
  if (battle.specialUsed || battle.playerSpecial) return { ok: false, game, battle, reason: 'SPECIAL_ALREADY_USED' }
  const monster = activeMonster(game, battle)
  const status = specialProgressionStatus(monster, game)
  const allowed = type === 'giga' ? status.giga.activatable : status.burst.activatable
  if (!allowed) return { ok: false, game, battle, reason: 'SPECIAL_LOCKED' }
  const next = structuredClone(battle)
  const baseMax = statsFor(monster.speciesId, monster.level).hp
  const multipliers = type === 'giga'
    ? { hp: GIGA_MULTIPLIER, attack: GIGA_MULTIPLIER, defense: GIGA_MULTIPLIER, speed: GIGA_MULTIPLIER }
    : { hp: BURST_HP_MULTIPLIER, attack: BURST_ATTACK_MULTIPLIER, defense: 1, speed: 1 }
  const specialMax = statsFor(monster.speciesId, monster.level, multipliers).hp
  const current = Math.max(1, next.partyHp[monster.instanceId] || baseMax)
  next.partyHp[monster.instanceId] = Math.max(1, Math.ceil(current * specialMax / baseMax))
  next.specialUsed = true
  next.playerSpecial = { type, instanceId: monster.instanceId, turnsLeft: type === 'burst' ? BURST_TURNS : null }
  next.log = [...next.log.slice(-5), type === 'giga' ? `🔷 ${speciesOf(monster.speciesId).name}が ギガシンカ！` : `💥 ${speciesOf(monster.speciesId).name}が キョダイバースト！`]
  const nextGame = syncActiveBattle(game, next)
  nextGame.specialDex ||= { giga: {}, burst: {} }
  nextGame.specialDex[type] ||= {}
  nextGame.specialDex[type][monster.speciesId] = true
  return { ok: true, game: nextGame, battle: next }
}

export function activateGiga(game, battle) { return activateSpecial(game, battle, 'giga') }
export function activateBurst(game, battle) { return activateSpecial(game, battle, 'burst') }

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
  const stage = stageById(battle?.stageId)
  return !stage?.captureDisabled && battle.status === 'fighting' && battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5 &&
    (battle.captureAttempts || 0) < MAX_CAPTURE_ATTEMPTS && (game.captureItems?.[itemType] || 0) > 0
}

export function attemptCapture(game, battle, rolls = null, itemType = 'star') {
  if (!canAttemptCapture(game, battle, itemType)) {
    const stage = stageById(battle?.stageId)
    const reason = stage?.captureDisabled ? 'CAPTURE_DISABLED' : (battle.captureAttempts || 0) >= MAX_CAPTURE_ATTEMPTS ? 'CAPTURE_LIMIT' : 'CAPTURE_NOT_READY'
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
  nextBattle.lastPlayerAction = 'capture'
  nextBattle.turn += 1
  if (stars < 4) {
    const log = [`「わ」を なげた！ ${stars}こ 光った！ でも逃げられた！`]
    enemyAttackOnce(nextGame, nextBattle, log)
    if (nextBattle.playerSpecial?.type === 'burst') endBurstIfNeeded(nextGame, nextBattle, log)
    nextBattle.log = [...nextBattle.log.slice(-4), ...log].slice(-8)
    resolvePlayerFaint(nextGame, nextBattle)
    const resolved = refundLostBattleIfNeeded(nextGame, nextBattle)
    resolved.game.activeBattle = structuredClone(resolved.battle)
    return { ok: true, caught: false, stars, chance, game: resolved.game, battle: resolved.battle }
  }

  const stage = stageById(battle.stageId)
  const xp = battleXpForStage(stage)
  const gained = awardTeamBattleXp(nextGame, battle, xp)
  nextGame = gained.game

  const captured = makeMonster(battle.enemy.speciesId, battle.enemy.level)
  nextGame.box[captured.instanceId] = captured
  nextGame.dex ||= { seen: {}, caught: {} }
  nextGame.dex.caught[battle.enemy.speciesId] = true
  nextGame.dex.seen[battle.enemy.speciesId] = true
  if ((nextGame.team || []).length < 3) nextGame.team.push(captured.instanceId)
  nextGame.monstersCaught = (nextGame.monstersCaught || 0) + 1
  nextGame.mana = (nextGame.mana || 0) + Math.floor(stage.mana / 2)
  nextGame.stagesCleared ||= []
  const firstClear = !nextGame.stagesCleared.includes(stage.id)
  nextGame = recordNormalFirstClearSnapshot(nextGame, stage, battle)
  if (firstClear) nextGame.stagesCleared.push(stage.id)
  const evolutionGrant = grantStageEvolutionReward(nextGame, stage, firstClear)
  nextGame = evolutionGrant.game
  const specialGrant = grantStageSpecialReward(nextGame, stage, firstClear)
  nextGame = specialGrant.game
  nextBattle.status = 'caught'
  nextBattle.log = [...nextBattle.log.slice(-4), `★★★★ 「わ」を なげた！ 4つ ひかって ゲット！ XP +${xp}`]
  nextGame.activeBattle = structuredClone(nextBattle)
  return {
    ok: true,
    caught: true,
    stars,
    chance,
    captured,
    xp,
    levelsByInstance: gained.levelsByInstance,
    evolutionReward: evolutionGrant.evolutionReward,
    specialReward: specialGrant.specialReward,
    game: nextGame,
    battle: nextBattle
  }
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
  nextBattle.lastPlayerAction = 'switch'
  const log = [`${speciesOf(game.box[instanceId].speciesId).name} に こうたい！`]

  if (!forced) {
    enemyAttackOnce(nextGame, nextBattle, log)
    if (nextBattle.playerSpecial?.type === 'burst') endBurstIfNeeded(nextGame, nextBattle, log)
    nextBattle.turn += 1
    resolvePlayerFaint(nextGame, nextBattle)
  }
  nextBattle.log = [...nextBattle.log.slice(-4), ...log].slice(-8)
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
  next.box[instanceId] = result.monster
  next.dex ||= { seen: {}, caught: {} }
  next.dex.seen[result.monster.speciesId] = true
  next.dex.caught[result.monster.speciesId] = true
  next.evolutionDiscoveries ||= {}
  const firstEvolutionDiscovery = !next.evolutionDiscoveries[result.monster.speciesId]
  next.evolutionDiscoveries[result.monster.speciesId] = true
  return { ok: true, game: next, from, to: result.monster.speciesId, firstEvolutionDiscovery }
}

export function setTeam(game, instanceIds) {
  const unique = [...new Set(instanceIds)].filter((id) => game.box?.[id]).slice(0, 3)
  if (!unique.length) return { ok: false, game, reason: 'EMPTY_TEAM' }
  const next = { ...game, team: unique, activeMonsterId: unique.includes(game.activeMonsterId) ? game.activeMonsterId : unique[0] }
  return { ok: true, game: next }
}
