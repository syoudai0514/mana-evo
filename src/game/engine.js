import { MOVES, SPECIES, STAGES, moveOf, speciesOf, typeEffectiveness } from './content.js'

const clamp = (min, value, max) => Math.max(min, Math.min(max, value))

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
    gigaUnlocked: false,
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

export function canNormalEvolve(monster) {
  const species = speciesOf(monster.speciesId)
  return !!species?.evolvesTo && monster.level >= species.evolvesAt
}

export function levelsUntilEvolution(monster) {
  const species = speciesOf(monster.speciesId)
  if (!species?.evolvesTo) return null
  return Math.max(0, species.evolvesAt - monster.level)
}

export function normalEvolve(monster) {
  if (!canNormalEvolve(monster)) return { ok: false, monster, reason: 'NOT_READY' }
  const species = speciesOf(monster.speciesId)
  return { ok: true, monster: { ...monster, speciesId: species.evolvesTo } }
}

export function stageById(stageId) {
  return STAGES.find((stage) => stage.id === stageId) || null
}

export function isStageUnlocked(game, stage) {
  return !stage.unlockedBy || (game.stagesCleared || []).includes(stage.unlockedBy)
}

export function startBattle(game, stageId) {
  const stage = stageById(stageId)
  if (!stage) return { ok: false, game, reason: 'UNKNOWN_STAGE' }
  if (!isStageUnlocked(game, stage)) return { ok: false, game, reason: 'LOCKED_STAGE' }
  if ((game.tickets || 0) < 1) return { ok: false, game, reason: 'NO_TICKET' }
  const activeId = game.activeMonsterId || game.team?.[0]
  const active = game.box?.[activeId]
  if (!active) return { ok: false, game, reason: 'NO_ACTIVE_MONSTER' }

  const nextGame = structuredClone(game)
  nextGame.tickets -= 1
  nextGame.battlesStarted = (nextGame.battlesStarted || 0) + 1
  nextGame.dex ||= { seen: {}, caught: {} }
  nextGame.dex.seen[stage.enemySpeciesId] = true

  const enemyStats = statsFor(stage.enemySpeciesId, stage.enemyLevel)
  const playerStats = statsFor(active.speciesId, active.level)
  const battle = {
    stageId,
    activeInstanceId: activeId,
    playerHp: playerStats.hp,
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
    lastEffect: 1
  }
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

function awardWin(game, battle) {
  const next = structuredClone(game)
  const stage = stageById(battle.stageId)
  const current = next.box[battle.activeInstanceId]
  const gained = gainXp(current, stage.xp)
  next.box[battle.activeInstanceId] = gained.monster
  next.mana = (next.mana || 0) + stage.mana
  next.battlesWon = (next.battlesWon || 0) + 1
  next.stagesCleared ||= []
  if (!next.stagesCleared.includes(stage.id)) next.stagesCleared.push(stage.id)
  return { game: next, levels: gained.levels, xp: stage.xp, mana: stage.mana }
}

export function useMove(game, battle, moveId) {
  if (battle.status !== 'fighting') return { ok: false, game, battle, reason: 'BATTLE_FINISHED' }
  const player = activeMonster(game, battle)
  const playerSpecies = speciesOf(player.speciesId)
  if (!playerSpecies.moves.includes(moveId)) return { ok: false, game, battle, reason: 'UNKNOWN_MOVE' }
  const enemy = { speciesId: battle.enemy.speciesId, level: battle.enemy.level }
  const move = moveOf(moveId)
  const enemyMove = enemyMoveFor(enemy, player)
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
  const enemyAttack = () => {
    if (next.enemy.hp <= 0) return null
    const result = damageAmount(enemy, player, enemyMove)
    next.playerHp = Math.max(0, next.playerHp - result.damage)
    log.push(`${speciesOf(enemy.speciesId).name} の ${enemyMove.name}！ ${result.damage} ダメージ`)
    return result
  }

  if (playerStats.speed >= enemyStats.speed) {
    playerAttack()
    enemyAttack()
  } else {
    enemyAttack()
    if (next.playerHp > 0) playerAttack()
  }

  next.turn += 1
  next.log = [...next.log.slice(-4), ...log].slice(-6)

  if (next.enemy.hp <= 0) {
    next.status = 'won'
    const rewards = awardWin(game, next)
    next.log.push(`かち！ XP +${rewards.xp} / マナ +${rewards.mana}`)
    return { ok: true, game: rewards.game, battle: next, rewards }
  }
  if (next.playerHp <= 0) {
    next.status = 'lost'
    next.log.push('まけちゃった…。チームをそだてて もういちど！')
    return { ok: true, game, battle: next }
  }

  return { ok: true, game, battle: next }
}

export function captureChance(battle) {
  const species = speciesOf(battle.enemy.speciesId)
  const missing = 1 - battle.enemy.hp / battle.enemy.maxHp
  return clamp(0.12, 0.34 + missing * 0.62 - (species.catchRank || 1) * 0.07, 0.9)
}

export function canAttemptCapture(game, battle) {
  return battle.status === 'fighting' && battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5 && (game.captureRings || 0) > 0
}

export function attemptCapture(game, battle, rolls = null) {
  if (!canAttemptCapture(game, battle)) return { ok: false, game, battle, reason: 'CAPTURE_NOT_READY' }
  const nextGame = structuredClone(game)
  nextGame.captureRings -= 1
  const chance = captureChance(battle)
  const perStarChance = Math.pow(chance, 1 / 4)
  const samples = rolls || Array.from({ length: 4 }, () => Math.random())
  let stars = 0
  for (const roll of samples.slice(0, 4)) {
    if (roll <= perStarChance) stars += 1
    else break
  }

  const nextBattle = structuredClone(battle)
  nextBattle.captureStars = stars
  if (stars < 4) {
    nextBattle.log = [...nextBattle.log.slice(-4), `「わ」が ${stars}こ 光った！ でも逃げられた！`]
    return { ok: true, caught: false, stars, chance, game: nextGame, battle: nextBattle }
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
  nextBattle.status = 'caught'
  nextBattle.log = [...nextBattle.log.slice(-4), '★★★★ 「わ」が ひかった！ ゲット！']
  return { ok: true, caught: true, stars, chance, captured, game: nextGame, battle: nextBattle }
}

export function switchBattleMonster(game, battle, instanceId) {
  if (battle.status !== 'fighting') return { ok: false, game, battle, reason: 'BATTLE_FINISHED' }
  if (!(game.team || []).includes(instanceId) || !game.box[instanceId]) return { ok: false, game, battle, reason: 'NOT_IN_TEAM' }
  if (instanceId === battle.activeInstanceId) return { ok: true, game, battle }
  const nextGame = { ...game, activeMonsterId: instanceId }
  const nextBattle = structuredClone(battle)
  nextBattle.activeInstanceId = instanceId
  nextBattle.playerHp = statsFor(game.box[instanceId].speciesId, game.box[instanceId].level).hp
  nextBattle.log = [...nextBattle.log.slice(-4), `${speciesOf(game.box[instanceId].speciesId).name} に こうたい！`]
  return { ok: true, game: nextGame, battle: nextBattle }
}

export function evolveInstance(game, instanceId) {
  const current = game.box?.[instanceId]
  if (!current) return { ok: false, game, reason: 'UNKNOWN_MONSTER' }
  const result = normalEvolve(current)
  if (!result.ok) return { ok: false, game, reason: result.reason }
  const next = structuredClone(game)
  const from = current.speciesId
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
