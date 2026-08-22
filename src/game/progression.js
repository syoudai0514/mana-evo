export const createGameState = () => ({
  tickets: 0,
  mana: 0,
  starShards: 0,
  gigaStones: 0,
  burstCores: 0,
  battlesWon: 0,
  monsters: {
    'starter-001': {
      monsterId: 'starter-001',
      name: 'マナリィ（仮）',
      level: 1,
      xp: 0,
      stage: 1,
      starAwakened: false,
      gigaEvolved: false,
      burstUnlocked: false
    }
  },
  activeMonsterId: 'starter-001'
})

export function addTickets(game, amount) {
  return { ...game, tickets: Math.max(0, (game.tickets || 0) + amount) }
}

export function grantLearningReward(game, { ticketDelta = 0, unitMastered = false, hardMastered = false } = {}) {
  let next = addTickets(game, ticketDelta)
  if (ticketDelta > 0) next.mana = (next.mana || 0) + ticketDelta * 5
  if (unitMastered) next.starShards = (next.starShards || 0) + 1
  if (hardMastered) next.starShards = (next.starShards || 0) + 2
  return next
}

export function battleOnce(game) {
  if ((game.tickets || 0) < 1) return { game, ok: false, reason: 'NO_TICKET' }
  const next = structuredClone(game)
  next.tickets -= 1
  next.battlesWon += 1
  next.mana += 10
  const monster = next.monsters[next.activeMonsterId]
  monster.xp += 25
  while (monster.xp >= monster.level * 40) {
    monster.xp -= monster.level * 40
    monster.level += 1
  }
  if (monster.level >= 10 && monster.stage === 1) monster.stage = 2
  if (monster.level >= 20 && monster.stage === 2) monster.stage = 3
  return { game: next, ok: true, monster }
}

export function evolutionEligibility(monster, resources, learning) {
  const specifiedUnitMastered = Object.values(learning?.units || {}).some((u) => u.mastered)
  const hardMastered = Object.values(learning?.units || {}).some((u) => u.hardMastered)
  const subjectMasterCount = Object.values(learning?.subjectGrades || {}).filter((grade) => grade > 0).length

  return {
    star: !monster.starAwakened && monster.level >= 25 && specifiedUnitMastered && hardMastered && (resources.starShards || 0) >= 3,
    giga: monster.stage >= 3 && !monster.gigaEvolved && monster.level >= 40 && hardMastered && (resources.gigaStones || 0) >= 1,
    burst: !monster.burstUnlocked && subjectMasterCount >= 1 && (resources.burstCores || 0) >= 1
  }
}

export function applyEvolution(game, learning, kind) {
  const next = structuredClone(game)
  const monster = next.monsters[next.activeMonsterId]
  const eligible = evolutionEligibility(monster, next, learning)
  if (!eligible[kind]) return { game, ok: false }

  if (kind === 'star') {
    monster.starAwakened = true
    next.starShards -= 3
  }
  if (kind === 'giga') {
    monster.gigaEvolved = true
    next.gigaStones -= 1
  }
  if (kind === 'burst') {
    monster.burstUnlocked = true
    next.burstCores -= 1
  }
  return { game: next, ok: true }
}
