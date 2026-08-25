// W-201 owns this adapter only. It deliberately does not edit the shared battle/world
// engines in Wave A. The caller supplies persisted learning events and can acknowledge
// them only after the returned game state has been saved.

export const LEARNING_TICKET_TTL_DAYS = 7
export const LEARNING_RING_IDS = Object.freeze(['star', 'silver', 'gold'])

function positiveInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function stableId(value) {
  return String(value || '').trim()
}

function normalizeRingInventory(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    star: positiveInt(source.star),
    silver: positiveInt(source.silver),
    gold: positiveInt(source.gold),
    rainbow: positiveInt(source.rainbow)
  }
}

function normalizeAppliedIds(value) {
  return Array.isArray(value)
    ? [...new Set(value.map(stableId).filter(Boolean))].slice(-4000)
    : []
}

function normalizeTicketGrants(value, today) {
  return (Array.isArray(value) ? value : [])
    .map((grant, index) => ({
      id: stableId(grant?.id) || `learning-legacy-${today}-${index}`,
      count: positiveInt(grant?.count),
      earnedDay: Number.isFinite(Number(grant?.earnedDay)) ? Math.floor(Number(grant.earnedDay)) : today,
      expiresDay: Number.isFinite(Number(grant?.expiresDay)) ? Math.floor(Number(grant.expiresDay)) : today + LEARNING_TICKET_TTL_DAYS
    }))
    .filter((grant) => grant.count > 0 && grant.expiresDay > today)
    .sort((a, b) => a.expiresDay - b.expiresDay || a.earnedDay - b.earnedDay || a.id.localeCompare(b.id))
}

function availableTicketCount(ticketGrants, today) {
  return ticketGrants.reduce((sum, grant) => grant.expiresDay > today ? sum + positiveInt(grant.count) : sum, 0)
}

export function normalizeLearningGameReward(raw = {}) {
  const rings = raw.captureItemDelta && typeof raw.captureItemDelta === 'object' ? raw.captureItemDelta : {}
  return {
    id: stableId(raw.id),
    ticketDelta: positiveInt(raw.ticketDelta),
    captureItemDelta: {
      star: positiveInt(rings.star),
      silver: positiveInt(rings.silver),
      gold: positiveInt(rings.gold)
    }
  }
}

export function applyLearningGameReward(game, rawReward, { today } = {}) {
  const day = Math.floor(Number(today) || 0)
  const reward = normalizeLearningGameReward(rawReward)
  if (!reward.id) return { game, applied: false, reason: 'MISSING_REWARD_ID' }

  const appliedIds = normalizeAppliedIds(game?.appliedLearningRewardIds)
  if (appliedIds.includes(reward.id)) return { game, applied: false, reason: 'ALREADY_APPLIED' }

  const next = {
    ...(game || {}),
    captureItems: normalizeRingInventory(game?.captureItems),
    ticketGrants: normalizeTicketGrants(game?.ticketGrants, day),
    appliedLearningRewardIds: appliedIds
  }

  if (reward.ticketDelta > 0) {
    next.ticketGrants.push({
      id: `learning:${reward.id}`,
      count: reward.ticketDelta,
      earnedDay: day,
      expiresDay: day + LEARNING_TICKET_TTL_DAYS
    })
    next.ticketGrants.sort((a, b) => a.expiresDay - b.expiresDay || a.earnedDay - b.earnedDay || a.id.localeCompare(b.id))
  }

  for (const ringId of LEARNING_RING_IDS) {
    next.captureItems[ringId] += reward.captureItemDelta[ringId]
  }
  // Learning-side rainbow allocation is intentionally unsupported until W-101-01 is resolved.

  next.appliedLearningRewardIds = [...new Set([...appliedIds, reward.id])].slice(-4000)
  next.tickets = availableTicketCount(next.ticketGrants, day)
  return { game: next, applied: true, reason: null }
}

export function applyLearningGameRewards(game, rewards, { today } = {}) {
  let next = game
  const appliedIds = []
  for (const reward of Array.isArray(rewards) ? rewards : []) {
    const result = applyLearningGameReward(next, reward, { today })
    next = result.game
    if (result.applied) appliedIds.push(stableId(reward?.id))
  }
  return { game: next, appliedIds }
}

export function normalizeLearningProgressionSignal(raw = {}) {
  return {
    id: stableId(raw.id),
    kind: stableId(raw.kind),
    explorationPointDelta: positiveInt(raw.explorationPointDelta),
    worldProgressDelta: positiveInt(raw.worldProgressDelta),
    skillId: stableId(raw.skillId) || null,
    dayKey: stableId(raw.dayKey) || null
  }
}

export function projectLearningProgressionSignals(signals, alreadyAppliedIds = []) {
  const seen = new Set(normalizeAppliedIds(alreadyAppliedIds))
  const accepted = []
  let explorationPointDelta = 0
  let worldProgressDelta = 0

  for (const raw of Array.isArray(signals) ? signals : []) {
    const signal = normalizeLearningProgressionSignal(raw)
    if (!signal.id || seen.has(signal.id)) continue
    seen.add(signal.id)
    accepted.push(signal)
    explorationPointDelta += signal.explorationPointDelta
    worldProgressDelta += signal.worldProgressDelta
  }

  return {
    accepted,
    acceptedIds: accepted.map((signal) => signal.id),
    explorationPointDelta,
    worldProgressDelta
  }
}
