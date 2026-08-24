export const BALANCE_VERSION = 1
export const MAX_MONSTER_LEVEL = 100

export const NORMAL_DIFFICULTY = Object.freeze({
  weak: { targetMultiplier: 0.82, label: 'いけそう' },
  normal: { targetMultiplier: 0.92, label: 'いけそう' },
  strong: { targetMultiplier: 1.02, label: 'いいしょうぶ' },
  rare: { targetMultiplier: 1.065, label: 'いいしょうぶ' },
  elite: { targetMultiplier: 1.12, label: 'かなりつよい' }
})

export const BOSS_RANKS = Object.freeze({
  C: { targetMultiplier: 1.02, hp: 1.20, attack: 1.02, defense: 1.00 },
  B: { targetMultiplier: 1.08, hp: 1.35, attack: 1.04, defense: 1.03 },
  A: { targetMultiplier: 1.14, hp: 1.50, attack: 1.07, defense: 1.05 },
  S: { targetMultiplier: 1.20, hp: 1.65, attack: 1.10, defense: 1.08 },
  EX: { targetMultiplier: 1.28, hp: 1.80, attack: 1.12, defense: 1.10 }
})

const clamp = (min, value, max) => Math.max(min, Math.min(max, value))
const positive = (value, fallback = 1) => Math.max(1, Number(value) || fallback)

export function normalizeStatMultipliers(value = null) {
  return {
    hp: positive(value?.hp, 1),
    attack: positive(value?.attack, 1),
    defense: positive(value?.defense, 1),
    speed: positive(value?.speed, 1)
  }
}

export function statsFromBase(base, level, multipliers = null) {
  const lv = clamp(1, Math.floor(Number(level) || 1), MAX_MONSTER_LEVEL)
  const raw = {
    hp: Math.floor((2 * positive(base?.hp) * lv) / 100) + lv + 10,
    attack: Math.floor((2 * positive(base?.attack) * lv) / 100) + 5,
    defense: Math.floor((2 * positive(base?.defense) * lv) / 100) + 5,
    speed: Math.floor((2 * positive(base?.speed) * lv) / 100) + 5
  }
  const m = normalizeStatMultipliers(multipliers)
  return {
    hp: Math.max(1, Math.floor(raw.hp * m.hp)),
    attack: Math.max(1, Math.floor(raw.attack * m.attack)),
    defense: Math.max(1, Math.floor(raw.defense * m.defense)),
    speed: Math.max(1, Math.floor(raw.speed * m.speed))
  }
}

export function combatPowerFromStats(stats) {
  if (!stats) return 0
  const durability = positive(stats.hp) * (1 + positive(stats.defense) / 100)
  const offense = positive(stats.attack) * (1 + positive(stats.speed) / 300)
  return Math.sqrt(durability * offense)
}

export function monsterCombatPower(monster, speciesOf) {
  const species = monster ? speciesOf(monster.speciesId) : null
  if (!species) return 0
  return combatPowerFromStats(statsFromBase(species.base, monster.level, monster.statMultipliers))
}

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function referencePower(game, speciesOf) {
  const teamPowers = (game?.team || [])
    .map((id) => game?.box?.[id])
    .filter(Boolean)
    .map((monster) => monsterCombatPower(monster, speciesOf))
    .filter((value) => value > 0)
    .sort((a, b) => b - a)

  const rosterPowers = Object.values(game?.box || {})
    .map((monster) => monsterCombatPower(monster, speciesOf))
    .filter((value) => value > 0)
    .sort((a, b) => b - a)

  const activePower = average(teamPowers.slice(0, 3))
  const rosterCore = median(rosterPowers.slice(0, 5))
  return Math.max(1, activePower, rosterCore * 0.9)
}

export function levelForTargetPower(species, targetPower, multipliers = null) {
  if (!species?.base) return 1
  const target = Math.max(1, Number(targetPower) || 1)
  let best = { level: 1, delta: Number.POSITIVE_INFINITY, power: 0 }
  for (let level = 1; level <= MAX_MONSTER_LEVEL; level += 1) {
    const power = combatPowerFromStats(statsFromBase(species.base, level, multipliers))
    const delta = Math.abs(power - target)
    if (delta < best.delta) best = { level, delta, power }
  }
  return best.level
}

export function difficultyLabelFromRatio(ratio) {
  const value = Number(ratio) || 0
  if (value <= 0.90) return 'いけそう'
  if (value <= 1.08) return 'いいしょうぶ'
  return 'かなりつよい'
}

function validSnapshot(snapshot, stage) {
  return !!snapshot && snapshot.stageId === stage?.id && Number(snapshot.lockedLevel) >= 1 && Number(snapshot.lockedLevel) <= MAX_MONSTER_LEVEL
}

export function buildEnemyPlan(game, stage, speciesOf, existingSnapshot = null, { challenge = false } = {}) {
  const species = stage ? speciesOf(stage.enemySpeciesId) : null
  if (!stage || !species) return null

  if (stage.bossRank && !challenge && validSnapshot(existingSnapshot, stage)) {
    const statMultipliers = normalizeStatMultipliers(existingSnapshot.statMultipliers)
    const stats = statsFromBase(species.base, existingSnapshot.lockedLevel, statMultipliers)
    const actualPower = combatPowerFromStats(stats)
    return {
      mode: 'boss-locked',
      level: existingSnapshot.lockedLevel,
      statMultipliers,
      referencePower: existingSnapshot.referencePower,
      targetPower: existingSnapshot.targetPower,
      actualPower,
      difficultyLabel: difficultyLabelFromRatio(actualPower / Math.max(1, existingSnapshot.referencePower)),
      bossRank: existingSnapshot.bossRank || stage.bossRank,
      snapshot: structuredClone(existingSnapshot)
    }
  }

  const ref = referencePower(game, speciesOf)

  if (stage.bossRank) {
    const rank = BOSS_RANKS[stage.bossRank] || BOSS_RANKS.A
    const statMultipliers = normalizeStatMultipliers({ hp: rank.hp, attack: rank.attack, defense: rank.defense, speed: 1 })
    const targetPower = ref * rank.targetMultiplier
    const level = levelForTargetPower(species, targetPower, statMultipliers)
    const actualPower = combatPowerFromStats(statsFromBase(species.base, level, statMultipliers))
    const snapshot = {
      stageId: stage.id,
      bossId: stage.bossId || stage.enemySpeciesId,
      bossRank: stage.bossRank,
      lockedLevel: level,
      referencePower: ref,
      targetPower,
      statMultipliers,
      balanceVersion: BALANCE_VERSION
    }
    return {
      mode: challenge ? 'boss-challenge' : 'boss-new',
      level,
      statMultipliers,
      referencePower: ref,
      targetPower,
      actualPower,
      difficultyLabel: difficultyLabelFromRatio(actualPower / ref),
      bossRank: stage.bossRank,
      snapshot: challenge ? null : snapshot
    }
  }

  const difficulty = NORMAL_DIFFICULTY[stage.enemyDifficulty] || NORMAL_DIFFICULTY.normal
  const targetPower = ref * difficulty.targetMultiplier
  const level = levelForTargetPower(species, targetPower)
  const actualPower = combatPowerFromStats(statsFromBase(species.base, level))
  return {
    mode: 'normal-soft',
    level,
    statMultipliers: normalizeStatMultipliers(),
    referencePower: ref,
    targetPower,
    actualPower,
    difficultyLabel: difficultyLabelFromRatio(actualPower / ref),
    bossRank: null,
    snapshot: null
  }
}
