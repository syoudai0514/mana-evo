const clamp = (min, value, max) => Math.max(min, Math.min(max, value))

export const CAPTURE_BOUNDARIES = Object.freeze({
  eligibilityHpRatio: 0.5,
  maxAttempts: 3,
  nonRainbowCap: 0.92,
  ringMultipliers: Object.freeze({
    star: 1,
    silver: 1.2,
    gold: 1.5,
    rainbow: 1
  }),
  guaranteedRings: Object.freeze(['rainbow'])
})

// Compatibility tuning only. These values mirror the pre-rebuild runtime and are
// intentionally separate from CAPTURE_BOUNDARIES because CURRENT does not make
// the base-chance formula or its coefficients a product invariant.
export const DEFAULT_CAPTURE_TUNING = Object.freeze({
  minChance: 0.12,
  baseChance: 0.34,
  missingHpWeight: 0.62,
  catchRankWeight: 0.07,
  maxChance: 0.90
})

export const GROWTH_SHARD_RULE = Object.freeze({
  shardsPerUse: 3,
  xpPerUse: 30
})

function ringKnown(itemType) {
  return Object.prototype.hasOwnProperty.call(CAPTURE_BOUNDARIES.ringMultipliers, itemType)
}

function captureDomainState(game) {
  const next = structuredClone(game || {})
  next.box ||= {}
  next.team ||= []
  next.dex ||= {}
  next.dex.seen ||= {}
  next.dex.caught ||= {}
  next.captureDomain ||= {}
  next.captureDomain.settlements ||= {}
  next.captureDomain.shardRedemptions ||= {}
  next.growthShards = Math.max(0, Math.floor(Number(next.growthShards) || 0))
  return next
}

function ownsSpecies(game, speciesId) {
  return Object.values(game?.box || {}).some((monster) => monster?.speciesId === speciesId)
}

export function captureEligibility(game, battle, itemType = 'star', { captureDisabled = false } = {}) {
  if (!ringKnown(itemType)) return { eligible: false, reason: 'UNKNOWN_RING' }
  if (captureDisabled) return { eligible: false, reason: 'CAPTURE_DISABLED' }
  if (battle?.status !== 'fighting') return { eligible: false, reason: 'BATTLE_NOT_FIGHTING' }

  const hp = Number(battle?.enemy?.hp)
  const maxHp = Number(battle?.enemy?.maxHp)
  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0 || hp <= 0) {
    return { eligible: false, reason: 'ENEMY_NOT_CAPTURABLE' }
  }
  if (hp / maxHp > CAPTURE_BOUNDARIES.eligibilityHpRatio) {
    return { eligible: false, reason: 'HP_TOO_HIGH' }
  }
  if ((Number(battle?.captureAttempts) || 0) >= CAPTURE_BOUNDARIES.maxAttempts) {
    return { eligible: false, reason: 'CAPTURE_LIMIT' }
  }
  if ((Number(game?.captureItems?.[itemType]) || 0) <= 0) {
    return { eligible: false, reason: 'NO_RING' }
  }
  return { eligible: true, reason: null }
}

export function defaultBaseCaptureChance({ hp, maxHp, catchRank = 1 }, tuning = DEFAULT_CAPTURE_TUNING) {
  const safeMaxHp = Math.max(1, Number(maxHp) || 1)
  const safeHp = clamp(0, Number(hp) || 0, safeMaxHp)
  const missingHpRatio = 1 - safeHp / safeMaxHp
  const rank = Math.max(0, Number(catchRank) || 0)
  return clamp(
    Number(tuning.minChance),
    Number(tuning.baseChance) + missingHpRatio * Number(tuning.missingHpWeight) - rank * Number(tuning.catchRankWeight),
    Number(tuning.maxChance)
  )
}

export function captureProbability(baseChance, itemType = 'star') {
  if (!ringKnown(itemType)) throw new Error(`Unknown capture ring: ${itemType}`)
  if (CAPTURE_BOUNDARIES.guaranteedRings.includes(itemType)) return 1
  const base = clamp(0, Number(baseChance) || 0, 1)
  return Math.min(base * CAPTURE_BOUNDARIES.ringMultipliers[itemType], CAPTURE_BOUNDARIES.nonRainbowCap)
}

export function buildCapturePresentation(success, { failureStars = 1 } = {}) {
  if (success) {
    return {
      starCount: 4,
      frames: [1, 2, 3, 4].map((lit) => ({ type: 'stars', lit })).concat([
        { type: 'ring_closed', rainbow: true },
        { type: 'caught' }
      ])
    }
  }

  const starCount = clamp(1, Math.floor(Number(failureStars) || 1), 3)
  return {
    starCount,
    frames: Array.from({ length: starCount }, (_, index) => ({ type: 'stars', lit: index + 1 })).concat([
      { type: 'ring_scatter', lit: starCount },
      { type: 'escaped' }
    ])
  }
}

export function resolveCaptureRoll({ baseChance, itemType = 'star', successRoll, failureStars = 1 }) {
  const chance = captureProbability(baseChance, itemType)
  const roll = clamp(0, Number(successRoll), 1)
  if (!Number.isFinite(Number(successRoll))) throw new Error('successRoll must be a finite number')
  const success = CAPTURE_BOUNDARIES.guaranteedRings.includes(itemType) || roll <= chance
  return {
    success,
    chance,
    presentation: buildCapturePresentation(success, { failureStars })
  }
}

export function captureBattleXpRecipients(teamAtStart = [], capturedInstanceId = null) {
  return [...new Set(teamAtStart)]
    .filter(Boolean)
    .filter((instanceId) => instanceId !== capturedInstanceId)
    .slice(0, 3)
}

export function settleCaptureSuccess(game, {
  resolutionId,
  capturedMonster,
  ringType = 'star',
  teamAtStart = []
} = {}) {
  if (!resolutionId) return { ok: false, game, reason: 'RESOLUTION_ID_REQUIRED' }
  if (!capturedMonster?.instanceId || !capturedMonster?.speciesId) return { ok: false, game, reason: 'CAPTURED_MONSTER_REQUIRED' }
  if (!ringKnown(ringType)) return { ok: false, game, reason: 'UNKNOWN_RING' }

  const existingSettlement = game?.captureDomain?.settlements?.[resolutionId]
  if (existingSettlement) {
    return { ok: true, game, settlement: existingSettlement, idempotent: true }
  }

  const next = captureDomainState(game)
  if (next.box[capturedMonster.instanceId]) return { ok: false, game, reason: 'INSTANCE_ID_CONFLICT' }

  const duplicate = ownsSpecies(next, capturedMonster.speciesId)
  const captured = {
    ...structuredClone(capturedMonster),
    captureRingType: capturedMonster.captureRingType || ringType
  }
  const settlement = {
    resolutionId,
    speciesId: captured.speciesId,
    capturedInstance: captured,
    duplicate,
    choice: duplicate ? null : 'keep',
    status: duplicate ? 'pending_duplicate_choice' : 'settled',
    battleXpRecipients: captureBattleXpRecipients(teamAtStart, captured.instanceId)
  }

  next.dex.seen[captured.speciesId] = true
  next.dex.caught[captured.speciesId] = true
  next.monstersCaught = (Number(next.monstersCaught) || 0) + 1
  if (!duplicate) next.box[captured.instanceId] = captured
  next.captureDomain.settlements[resolutionId] = settlement

  return { ok: true, game: next, settlement, idempotent: false }
}

export function resolveDuplicateChoice(game, resolutionId, choice) {
  if (!resolutionId) return { ok: false, game, reason: 'RESOLUTION_ID_REQUIRED' }
  if (!['keep', 'support'].includes(choice)) return { ok: false, game, reason: 'UNKNOWN_DUPLICATE_CHOICE' }

  const current = game?.captureDomain?.settlements?.[resolutionId]
  if (!current) return { ok: false, game, reason: 'UNKNOWN_CAPTURE_SETTLEMENT' }
  if (!current.duplicate) return { ok: true, game, settlement: current, idempotent: true }
  if (current.status === 'settled') {
    return current.choice === choice
      ? { ok: true, game, settlement: current, idempotent: true }
      : { ok: false, game, settlement: current, reason: 'DUPLICATE_ALREADY_SETTLED' }
  }
  if (current.status !== 'pending_duplicate_choice') return { ok: false, game, reason: 'CAPTURE_SETTLEMENT_NOT_PENDING' }

  const next = captureDomainState(game)
  const settlement = structuredClone(next.captureDomain.settlements[resolutionId])
  if (choice === 'keep') {
    const instanceId = settlement.capturedInstance.instanceId
    if (next.box[instanceId]) return { ok: false, game, settlement: current, reason: 'INSTANCE_ID_CONFLICT' }
    next.box[instanceId] = structuredClone(settlement.capturedInstance)
  } else {
    next.growthShards += 1
  }

  settlement.choice = choice
  settlement.status = 'settled'
  next.captureDomain.settlements[resolutionId] = settlement
  return { ok: true, game: next, settlement, idempotent: false }
}

export function redeemGrowthShards(game, {
  redemptionId,
  instanceId,
  applyXp
} = {}) {
  if (!redemptionId) return { ok: false, game, reason: 'REDEMPTION_ID_REQUIRED' }
  const prior = game?.captureDomain?.shardRedemptions?.[redemptionId]
  if (prior) return { ok: true, game, redemption: prior, idempotent: true }
  if (!(game?.team || []).includes(instanceId) || !game?.box?.[instanceId]) {
    return { ok: false, game, reason: 'TARGET_NOT_IN_CURRENT_TEAM' }
  }
  if ((Number(game?.growthShards) || 0) < GROWTH_SHARD_RULE.shardsPerUse) {
    return { ok: false, game, reason: 'NOT_ENOUGH_GROWTH_SHARDS' }
  }
  if (typeof applyXp !== 'function') return { ok: false, game, reason: 'XP_APPLIER_REQUIRED' }

  const next = captureDomainState(game)
  const applied = applyXp(structuredClone(next.box[instanceId]), GROWTH_SHARD_RULE.xpPerUse)
  const updatedMonster = applied?.monster || applied
  if (!updatedMonster || typeof updatedMonster !== 'object') return { ok: false, game, reason: 'INVALID_XP_RESULT' }

  next.box[instanceId] = updatedMonster
  next.growthShards -= GROWTH_SHARD_RULE.shardsPerUse
  const redemption = {
    redemptionId,
    instanceId,
    xp: GROWTH_SHARD_RULE.xpPerUse,
    shardsSpent: GROWTH_SHARD_RULE.shardsPerUse,
    levels: Array.isArray(applied?.levels) ? applied.levels : []
  }
  next.captureDomain.shardRedemptions[redemptionId] = redemption
  return { ok: true, game: next, redemption, idempotent: false }
}
