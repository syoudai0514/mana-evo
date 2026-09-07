export const BALANCE_VERSION = 5
export const MAX_MONSTER_LEVEL = 100
export const NORMAL_REPEAT_CAP = 1.10
export const NORMAL_REPEAT_MASTERY_FLOOR = 0.70

// Evolution pacing keeps the reviewed stage reward values as the encounter
// reward pool, then applies these multipliers when XP is settled to monsters.
// The active battler receives 40% of the pool; teammates receive 40% of that
// active amount so a long first-day session cannot evolve a whole party at once.
export const BATTLE_XP_GLOBAL_MULTIPLIER = 0.40
export const BATTLE_XP_TEAMMATE_MULTIPLIER = 0.40
export const CAPTURE_EVOLUTION_LEVEL_BUFFER = 5

// D-031 progression reward tuning. Normal route depth increases XP without
// changing capture probability or multiplying difficulty bonuses twice.
export const ZONE_XP_MULTIPLIERS = Object.freeze({
  0: 1.00,
  1: 1.15,
  2: 1.30
})
export const TRAINING_XP_MULTIPLIERS = Object.freeze({
  2: 1.35,
  final: 1.45
})

export const NORMAL_DIFFICULTY = Object.freeze({
  weak: { targetMultiplier: 0.82, label: 'いけそう', xp: 90 },
  normal: { targetMultiplier: 0.92, label: 'いけそう', xp: 110 },
  strong: { targetMultiplier: 1.02, label: 'いいしょうぶ', xp: 125 },
  rare: { targetMultiplier: 1.065, label: 'いいしょうぶ', xp: 145 },
  elite: { targetMultiplier: 1.12, label: 'かなりつよい', xp: 165 }
})

export const BOSS_RANKS = Object.freeze({
  C: { targetMultiplier: 1.02, hp: 1.20, attack: 1.02, defense: 1.00, xp: 180, bigMovePower: 100 },
  B: { targetMultiplier: 1.08, hp: 1.35, attack: 1.04, defense: 1.03, xp: 200, bigMovePower: 120 },
  A: { targetMultiplier: 1.14, hp: 1.50, attack: 1.07, defense: 1.05, xp: 220, bigMovePower: 140 },
  S: { targetMultiplier: 1.20, hp: 1.65, attack: 1.10, defense: 1.08, xp: 250, bigMovePower: 155 },
  EX: { targetMultiplier: 1.28, hp: 1.80, attack: 1.12, defense: 1.10, xp: 300, bigMovePower: 170 }
})

const clamp = (min, value, max) => Math.max(min, Math.min(max, value))
const positive = (value, fallback = 1) => Math.max(1, Number(value) || fallback)
const statMultiplier = (value, fallback = 1) => clamp(0.5, Number(value) || fallback, 4)

function stageLevelBounds(stage) {
  const min = clamp(1, Math.floor(Number(stage?.minEnemyLevel) || 1), MAX_MONSTER_LEVEL)
  const max = clamp(min, Math.floor(Number(stage?.maxEnemyLevel) || MAX_MONSTER_LEVEL), MAX_MONSTER_LEVEL)
  return { min, max }
}

function clampStageLevel(stage, level) {
  const { min, max } = stageLevelBounds(stage)
  return clamp(min, Math.floor(Number(level) || min), max)
}

export function normalizeStatMultipliers(value = null) {
  return {
    hp: statMultiplier(value?.hp, 1),
    attack: statMultiplier(value?.attack, 1),
    defense: statMultiplier(value?.defense, 1),
    speed: statMultiplier(value?.speed, 1)
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

function weightedTop(values, weights = [0.5, 0.3, 0.2]) {
  const picked = values.slice(0, weights.length)
  if (!picked.length) return 0
  const activeWeights = weights.slice(0, picked.length)
  const weightSum = activeWeights.reduce((sum, weight) => sum + weight, 0)
  return picked.reduce((sum, value, index) => sum + value * activeWeights[index], 0) / weightSum
}

function teamPowers(game, speciesOf) {
  return (game?.team || [])
    .map((id) => game?.box?.[id])
    .filter(Boolean)
    .map((monster) => monsterCombatPower(monster, speciesOf))
    .filter((value) => value > 0)
    .sort((a, b) => b - a)
}

function rosterPowers(game, speciesOf) {
  return Object.values(game?.box || {})
    .map((monster) => monsterCombatPower(monster, speciesOf))
    .filter((value) => value > 0)
    .sort((a, b) => b - a)
}

// Normal encounters intentionally use the current team only so newly caught
// monsters can still be trained without the entire box making enemies too hard.
export function normalReferencePower(game, speciesOf) {
  const team = teamPowers(game, speciesOf)
  if (team.length) return Math.max(1, average(team.slice(0, 3)))
  const roster = rosterPowers(game, speciesOf)
  return Math.max(1, roster[0] || 1)
}

// Story bosses must not become trivial just because a Lv80 carry is paired with
// two weak monsters, nor should swapping to a deliberately weak team lower the
// first-encounter snapshot. We therefore include a softened roster/carry floor.
export function bossReferencePower(game, speciesOf) {
  const team = teamPowers(game, speciesOf)
  const roster = rosterPowers(game, speciesOf)
  const teamWeighted = weightedTop(team)
  const rosterWeighted = weightedTop(roster) * 0.85
  const carryFloor = (roster[0] || team[0] || 0) * 0.80
  return Math.max(1, teamWeighted, rosterWeighted, carryFloor)
}

export function referencePower(game, speciesOf) {
  return normalReferencePower(game, speciesOf)
}

export function stageXpMultiplier(stage) {
  if (stage?.bossRank) return 1
  if (stage?.kind === 'training') {
    return Number(stage?.trainingEvolutionStage) >= 3
      ? TRAINING_XP_MULTIPLIERS.final
      : TRAINING_XP_MULTIPLIERS[2]
  }
  return ZONE_XP_MULTIPLIERS[Math.max(0, Math.min(2, Number(stage?.zoneIndex) || 0))] || 1
}

export function battleXpForStage(stage) {
  if (stage?.bossRank) return (BOSS_RANKS[stage.bossRank] || BOSS_RANKS.A).xp
  const base = (NORMAL_DIFFICULTY[stage?.enemyDifficulty] || NORMAL_DIFFICULTY.normal).xp
  return Math.max(1, Math.round(base * stageXpMultiplier(stage)))
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

function validBossSnapshot(snapshot, stage) {
  if (!snapshot || snapshot.stageId !== stage?.id || Number(snapshot.balanceVersion) !== BALANCE_VERSION) return false
  const { min, max } = stageLevelBounds(stage)
  return Number(snapshot.lockedLevel) >= min && Number(snapshot.lockedLevel) <= max
}

function validNormalSnapshot(snapshot, stage) {
  return !!snapshot && snapshot.stageId === stage?.id && Number(snapshot.firstClearReferencePower) > 0
}

function repeatMasteryMultipliers(currentRef, firstClearReferencePower) {
  const growthRatio = currentRef / Math.max(1, firstClearReferencePower)
  if (growthRatio <= 1) return normalizeStatMultipliers()
  // When the team has genuinely grown, old cleared stages should feel easier.
  const ease = clamp(NORMAL_REPEAT_MASTERY_FLOOR, 1 - (growthRatio - 1) * 1.25, 1)
  return normalizeStatMultipliers({ hp: ease, attack: 1, defense: ease, speed: 1 })
}

export function buildEnemyPlan(game, stage, speciesOf, existingSnapshot = null, { challenge = false } = {}) {
  const species = stage ? speciesOf(stage.enemySpeciesId) : null
  if (!stage || !species) return null

  if (stage.bossRank && !challenge && validBossSnapshot(existingSnapshot, stage)) {
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

  if (stage.bossRank) {
    const ref = bossReferencePower(game, speciesOf)
    const rank = BOSS_RANKS[stage.bossRank] || BOSS_RANKS.A
    const statMultipliers = normalizeStatMultipliers({ hp: rank.hp, attack: rank.attack, defense: rank.defense, speed: 1 })
    const targetPower = ref * rank.targetMultiplier
    const level = clampStageLevel(stage, levelForTargetPower(species, targetPower, statMultipliers))
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

  const currentRef = normalReferencePower(game, speciesOf)
  const stored = game?.normalStageSnapshots?.[stage.id]
  let ref = currentRef
  let repeatCap = null
  let mode = stage.kind === 'training' ? 'training-soft' : 'normal-soft'
  let statMultipliers = normalizeStatMultipliers()
  if (validNormalSnapshot(stored, stage)) {
    repeatCap = stored.firstClearReferencePower * NORMAL_REPEAT_CAP
    ref = Math.min(currentRef, repeatCap)
    mode = currentRef > repeatCap
      ? (stage.kind === 'training' ? 'training-repeat-cap' : 'normal-repeat-cap')
      : (stage.kind === 'training' ? 'training-repeat-soft' : 'normal-repeat-soft')
    statMultipliers = repeatMasteryMultipliers(currentRef, stored.firstClearReferencePower)
  }

  const difficulty = NORMAL_DIFFICULTY[stage.enemyDifficulty] || NORMAL_DIFFICULTY.normal
  const targetPower = ref * difficulty.targetMultiplier
  // Pick the level from the capped reference first, then apply repeat mastery easing.
  const level = clampStageLevel(stage, levelForTargetPower(species, targetPower))
  const actualPower = combatPowerFromStats(statsFromBase(species.base, level, statMultipliers))
  return {
    mode,
    level,
    statMultipliers,
    referencePower: ref,
    currentReferencePower: currentRef,
    repeatCap,
    targetPower,
    actualPower,
    difficultyLabel: difficultyLabelFromRatio(actualPower / ref),
    bossRank: null,
    snapshot: null
  }
}
