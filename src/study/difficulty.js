// Copied from syoudai0514/kids-quest/src/engine/difficulty.js.
// Keep this compatible with Kids Quest so study progress can be migrated safely.
export const MIN_LEVEL = 1
export const MAX_LEVEL = 12
const PROMOTION_WINDOW = 4
const PROMOTION_CORRECT = 3
const DEMOTION_WINDOW = 5
const DEMOTION_MISSES = 3
const START_LEVEL = 2

export function makeSkill() {
  return {
    level: START_LEVEL,
    streak: 0,
    miss: 0,
    recent: [],
    lastLevelUpAt: 0,
    lastLevelDownAt: 0,
    correct: 0,
    attempts: 0
  }
}

export function applyResult(skill, wasCorrect) {
  const s = {
    ...skill,
    recent: [...(skill.recent || [])].slice(-(DEMOTION_WINDOW - 1)),
    lastLevelUpAt: skill.lastLevelUpAt || 0,
    lastLevelDownAt: skill.lastLevelDownAt || 0
  }
  s.attempts += 1
  s.recent.push(wasCorrect)
  if (s.recent.length > 10) s.recent.shift()

  let leveledUp = false
  let leveledDown = false
  if (wasCorrect) {
    s.correct += 1
    s.streak += 1
    s.miss = 0
  } else {
    s.streak = 0
    s.miss += 1
  }

  const recent4 = s.recent.slice(-PROMOTION_WINDOW)
  const correct4 = recent4.filter(Boolean).length
  if (
    recent4.length === PROMOTION_WINDOW &&
    correct4 >= PROMOTION_CORRECT &&
    s.attempts - s.lastLevelUpAt >= PROMOTION_WINDOW &&
    s.level < MAX_LEVEL
  ) {
    s.level = Math.min(MAX_LEVEL, s.level + 1)
    s.lastLevelUpAt = s.attempts
    leveledUp = true
  }

  const recent5 = s.recent.slice(-DEMOTION_WINDOW)
  const misses5 = recent5.filter((v) => !v).length
  if (
    recent5.length === DEMOTION_WINDOW &&
    misses5 >= DEMOTION_MISSES &&
    s.attempts - s.lastLevelDownAt >= DEMOTION_WINDOW &&
    s.level > MIN_LEVEL
  ) {
    s.level = Math.max(MIN_LEVEL, Math.round((s.level - 0.5) * 2) / 2)
    s.lastLevelDownAt = s.attempts
    leveledDown = true
  }
  return { skill: s, leveledUp, leveledDown }
}

export function hintLevel(skill = {}) {
  const recent5 = (skill.recent || []).slice(-DEMOTION_WINDOW)
  if (recent5.filter((v) => !v).length >= DEMOTION_MISSES) return 2
  if (skill.miss >= 1) return 1
  return 0
}

export function difficultyParams(skill = {}) {
  const lvl = Math.floor(Number.isFinite(skill.level) ? skill.level : START_LEVEL)
  return {
    level: lvl,
    rawLevel: skill.level,
    choiceCount: lvl <= 2 ? 3 : 4,
    allowKatakana: lvl >= 2,
    allowHard: lvl >= 4,
    hint: hintLevel(skill)
  }
}

export function trendLabel(skill) {
  if (skill.attempts < 4) return 'はじめたばかり'
  const rate = skill.correct / skill.attempts
  if (rate >= 0.85 || skill.level >= 4) return 'とくい！'
  if (rate >= 0.6) return 'いいちょうし'
  return 'おうえん中'
}
