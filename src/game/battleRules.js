export const STAB_MULTIPLIER = 1.5
export const CRITICAL_CHANCE = 1 / 16
export const CRITICAL_MULTIPLIER = 1.5
export const DAMAGE_RANDOM_MIN = 0.90
export const DAMAGE_RANDOM_MAX = 1.00

export const BATTLE_STATUS = Object.freeze({
  burn: 'burn',
  paralysis: 'paralysis',
  poison: 'poison',
  sleep: 'sleep'
})

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0))

export function seededBattleRoll(seed, key = '') {
  const text = `${seed || 'legacy'}:${key}`
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0
  return hash / 0x100000000
}

export function criticalMultiplier(roll) {
  return clamp01(roll) < CRITICAL_CHANCE ? CRITICAL_MULTIPLIER : 1
}

export function damageRandomMultiplier(roll) {
  return DAMAGE_RANDOM_MIN + (DAMAGE_RANDOM_MAX - DAMAGE_RANDOM_MIN) * clamp01(roll)
}

export function canonicalDamage({ level, power, attack, defense, stab = 1, type = 1, critical = 1, random = 1 }) {
  if (Number(type) === 0) return 0
  const lv = Math.max(1, Number(level) || 1)
  const atk = Math.max(1, Number(attack) || 1)
  const def = Math.max(1, Number(defense) || 1)
  const movePower = Math.max(0, Number(power) || 0)
  const base = Math.floor(Math.floor((2 * lv / 5 + 2) * movePower * atk / def) / 50) + 2
  return Math.max(1, Math.floor(base * stab * type * critical * random))
}

export function speedOrder(playerSpeed, enemySpeed, tieRoll = 0) {
  const player = Number(playerSpeed) || 0
  const enemy = Number(enemySpeed) || 0
  if (player > enemy) return 'player'
  if (enemy > player) return 'enemy'
  return clamp01(tieRoll) < 0.5 ? 'player' : 'enemy'
}

export function isStatusImmune(types = [], status) {
  if (status === BATTLE_STATUS.burn) return types.includes('fire')
  if (status === BATTLE_STATUS.paralysis) return types.includes('electric')
  if (status === BATTLE_STATUS.poison) return types.includes('poison') || types.includes('steel')
  return false
}

export function makeBattleStatus(status, { sleepRoll = 0 } = {}) {
  if (!Object.values(BATTLE_STATUS).includes(status)) return null
  if (status !== BATTLE_STATUS.sleep) return { type: status }
  return { type: status, turnsLeft: 1 + Math.floor(clamp01(sleepRoll) * 3) % 3 }
}

export function tryApplyBattleStatus(current, status, defenderTypes = [], options = {}) {
  if (current?.type === status) return { applied: false, status: current, reason: 'ALREADY_APPLIED' }
  if (current) return { applied: false, status: current, reason: 'STATUS_OCCUPIED' }
  if (isStatusImmune(defenderTypes, status)) return { applied: false, status: null, reason: 'IMMUNE' }
  const next = makeBattleStatus(status, options)
  return next ? { applied: true, status: next, reason: null } : { applied: false, status: current || null, reason: 'UNKNOWN_STATUS' }
}

export function statusAttackMultiplier(status) {
  return status?.type === BATTLE_STATUS.burn ? 0.7 : 1
}

export function statusSpeedMultiplier(status) {
  return status?.type === BATTLE_STATUS.paralysis ? 0.5 : 1
}

export function statusEndTurnDamage(status, maxHp) {
  const hp = Math.max(1, Math.floor(Number(maxHp) || 1))
  if (status?.type === BATTLE_STATUS.burn) return Math.max(1, Math.floor(hp / 16))
  if (status?.type === BATTLE_STATUS.poison) return Math.max(1, Math.floor(hp / 8))
  return 0
}

export function statusActionResult(status, roll = 1) {
  if (!status) return { canAct: true, status: null, reason: null }
  if (status.type === BATTLE_STATUS.paralysis && clamp01(roll) < 0.25) {
    return { canAct: false, status, reason: 'PARALYSIS' }
  }
  if (status.type === BATTLE_STATUS.sleep) {
    const turnsLeft = Math.max(0, Math.floor(Number(status.turnsLeft) || 0))
    if (turnsLeft > 0) return { canAct: false, status: turnsLeft > 1 ? { ...status, turnsLeft: turnsLeft - 1 } : null, reason: 'SLEEP' }
    return { canAct: true, status: null, reason: null }
  }
  return { canAct: true, status, reason: null }
}

export function wakeSleepOnDamagingHit(status, damage) {
  return status?.type === BATTLE_STATUS.sleep && Number(damage) > 0 ? null : status || null
}
