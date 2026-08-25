export const GIGA_TARGET_IDS = Object.freeze([
  'm003', 'm006', 'm009', 'm051', 'm054', 'm072',
  'm090', 'm121', 'm153', 'm156', 'm159', 'm186'
])
export const BURST_TARGET_IDS = Object.freeze([
  'm060', 'm066', 'm133', 'm136', 'm142', 'm165', 'm171', 'm174'
])

const GIGA_TARGET_SET = new Set(GIGA_TARGET_IDS)
const BURST_TARGET_SET = new Set(BURST_TARGET_IDS)

export const CANONICAL_SPECIAL_IDENTITIES = Object.freeze({ m142: 'ヘラクレオン' })
export const SPECIAL_FORM_EFFECTS = Object.freeze({
  giga: Object.freeze({ hp: 1.35, attack: 1.35, defense: 1.35, speed: 1.35, turns: null }),
  burst: Object.freeze({
    hp: 2.0,
    attack: 1.2,
    defense: 1.0,
    speed: 1.0,
    turns: 3,
    move: Object.freeze({ power: 110, accuracy: 95, recoil: 0 })
  })
})

export function specialFormEffect(form) {
  return SPECIAL_FORM_EFFECTS[form] || null
}

export function isSpecialFormTarget(speciesId, form) {
  if (form === 'giga') return GIGA_TARGET_SET.has(speciesId)
  if (form === 'burst') return BURST_TARGET_SET.has(speciesId)
  return false
}

export function hasSpecialFormEntitlement(game, speciesId, form) {
  if (form === 'giga') return !!game?.gigaKeyOwned && !!game?.gigaCoreSpecies?.[speciesId]
  if (form === 'burst') return !!game?.burstMarks?.[speciesId]
  return false
}

export function specialFormActivationStatus(game, battle, speciesId, form) {
  if (!SPECIAL_FORM_EFFECTS[form]) return { activatable: false, reason: 'UNKNOWN_SPECIAL_FORM' }
  if (!isSpecialFormTarget(speciesId, form)) return { activatable: false, reason: 'SPECIES_NOT_ELIGIBLE' }
  if (battle?.status && battle.status !== 'fighting') return { activatable: false, reason: 'BATTLE_NOT_ACTIVE' }
  if (battle?.specialUsed || battle?.playerSpecial) return { activatable: false, reason: 'SPECIAL_ALREADY_USED' }
  if (!hasSpecialFormEntitlement(game, speciesId, form)) return { activatable: false, reason: 'ENTITLEMENT_NOT_OWNED' }
  return { activatable: true, reason: null }
}

export function activateSpecialForm(game, battle, {
  speciesId,
  instanceId,
  form
} = {}) {
  const status = specialFormActivationStatus(game, battle, speciesId, form)
  if (!status.activatable) return { ok: false, game, battle, reason: status.reason }
  const nextGame = structuredClone(game || {})
  const nextBattle = structuredClone(battle || {})
  nextBattle.specialUsed = true
  nextBattle.playerSpecial = {
    type: form,
    speciesId,
    instanceId,
    turnsLeft: form === 'burst' ? SPECIAL_FORM_EFFECTS.burst.turns : null
  }
  nextGame.specialDex ||= { giga: {}, burst: {} }
  nextGame.specialDex.giga ||= {}
  nextGame.specialDex.burst ||= {}
  nextGame.specialDex[form][speciesId] = true
  return { ok: true, game: nextGame, battle: nextBattle, effect: SPECIAL_FORM_EFFECTS[form] }
}

export function advanceBurstTurn(battle) {
  const next = structuredClone(battle || {})
  if (next.playerSpecial?.type !== 'burst') return { battle: next, ended: false }
  next.playerSpecial.turnsLeft = Math.max(0, Number(next.playerSpecial.turnsLeft) - 1)
  if (next.playerSpecial.turnsLeft > 0) return { battle: next, ended: false }
  next.playerSpecial = null
  return { battle: next, ended: true }
}

export function scaleHpPreservingRatio(currentHp, maxHp, targetMaxHp) {
  const current = Math.max(0, Number(currentHp) || 0)
  const max = Math.max(1, Number(maxHp) || 1)
  const targetMax = Math.max(1, Math.round(Number(targetMaxHp) || 1))
  if (current <= 0) return { currentHp: 0, maxHp: targetMax }
  return {
    currentHp: Math.max(0, Math.min(targetMax, Math.round((current / max) * targetMax))),
    maxHp: targetMax
  }
}

export function transformHpForSpecialForm(currentHp, maxHp, form) {
  const effect = SPECIAL_FORM_EFFECTS[form]
  if (!effect) throw new Error(`Unknown special form: ${form}`)
  return scaleHpPreservingRatio(currentHp, maxHp, Math.round(Math.max(1, Number(maxHp) || 1) * effect.hp))
}

export function restoreHpAfterSpecialForm(currentHp, transformedMaxHp, normalMaxHp) {
  return scaleHpPreservingRatio(currentHp, transformedMaxHp, normalMaxHp)
}
