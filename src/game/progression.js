import * as shared from './progressionSharedRuntime.js'

export * from './progressionSharedRuntime.js'

function positiveInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

// Legacy direct callers without a persisted reward id remain non-idempotent by design.
// They still use W-201 economics: tickets/rings only, never implicit Mana.
export function grantLearningReward(game, {
  rewardId = null,
  ticketDelta = 0,
  captureItemDelta = null,
  unitMastered = false,
  hardMastered = false,
  today = 0
} = {}) {
  if (rewardId) {
    return shared.grantLearningReward(game, { rewardId, ticketDelta, captureItemDelta, today })
  }

  let next = ticketDelta > 0 ? shared.grantTickets(game, ticketDelta, today) : structuredClone(game)
  next.captureItems ||= { star: 0, silver: 0, gold: 0, rainbow: 0 }
  for (const id of ['star', 'silver', 'gold']) next.captureItems[id] = positiveInt(next.captureItems[id]) + positiveInt(captureItemDelta?.[id])
  if (unitMastered) next.captureItems.silver = positiveInt(next.captureItems.silver) + 1
  if (hardMastered) next.captureItems.gold = positiveInt(next.captureItems.gold) + 1
  next.tickets = shared.availableTicketCount(next, today)
  return next
}
