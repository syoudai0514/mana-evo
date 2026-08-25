import * as core from './progressionCore.js'
import { applyLearningGameReward } from './learningRewardBridge.js'
import { speciesOf } from './content.js'
import { hasSpecialFormEntitlement, isSpecialFormTarget } from './specialFormsDomain.js'
import { withSharedRuntimeState } from './sharedRuntimeState.js'

export const CURRENT_GAME_VERSION = 10
export const CAPTURE_ITEM_IDS = core.CAPTURE_ITEM_IDS
export const TICKET_TTL_DAYS = core.TICKET_TTL_DAYS

export const canonicalSpeciesId = core.canonicalSpeciesId
export const availableTicketCount = core.availableTicketCount

function preserve(source, next) {
  const merged = withSharedRuntimeState(next, source)
  merged.version = CURRENT_GAME_VERSION
  return merged
}

function preserveResult(source, result) {
  if (!result || typeof result !== 'object' || !('game' in result)) return result
  return { ...result, game: preserve(source, result.game) }
}

export function createGameState() {
  return preserve({}, core.createGameState())
}

export function normalizeGameState(saved, today) {
  return preserve(saved || {}, core.normalizeGameState(saved, today))
}

export function grantTickets(game, amount, today) {
  return preserve(game, core.grantTickets(game, amount, today))
}

export function addTickets(game, amount, today) {
  return preserve(game, core.addTickets(game, amount, today))
}

export function consumeTicket(game, today) {
  return preserveResult(game, core.consumeTicket(game, today))
}

export function refundTicket(game, ticketSource, today = null) {
  return preserveResult(game, core.refundTicket(game, ticketSource, today))
}

export function grantEvolutionItem(game, kind, itemId, count = 1, today) {
  return preserveResult(game, core.grantEvolutionItem(game, kind, itemId, count, today))
}

export function equipHeldItem(game, instanceId, itemId, today) {
  return preserveResult(game, core.equipHeldItem(game, instanceId, itemId, today))
}

// Compatibility entry point for callers that have not moved to applyLearningQueues yet.
// The W-201 bridge is the single authority: learning rewards never create implicit Mana.
export function grantLearningReward(game, {
  rewardId = null,
  ticketDelta = 0,
  captureItemDelta = null,
  today = 0
} = {}) {
  const result = applyLearningGameReward(withSharedRuntimeState(game), {
    id: rewardId,
    ticketDelta,
    captureItemDelta: captureItemDelta || {}
  }, { today })
  return preserve(game, result.game)
}

export function specialProgressionStatus(monster, game) {
  const species = monster ? speciesOf(monster.speciesId) : null
  const speciesId = monster?.speciesId
  const isFinal = !!species && !species.evolution
  const gigaEligible = isSpecialFormTarget(speciesId, 'giga')
  const burstEligible = isSpecialFormTarget(speciesId, 'burst')
  const hasKey = !!game?.gigaKeyOwned || (game?.stagesCleared || []).includes('a1-boss')
  const hasCore = !!game?.gigaCoreSpecies?.[speciesId]
  const hasMark = !!game?.burstMarks?.[speciesId]
  return {
    giga: {
      label: 'ギガシンカ',
      eligibleSpecies: gigaEligible,
      isFinal,
      hasKey,
      hasCore,
      registered: !!game?.specialDex?.giga?.[speciesId],
      activatable: isFinal && gigaEligible && (hasSpecialFormEntitlement(game, speciesId, 'giga') || (hasKey && hasCore))
    },
    burst: {
      label: 'キョダイバースト',
      eligibleSpecies: burstEligible,
      isFinal,
      hasMark,
      registered: !!game?.specialDex?.burst?.[speciesId],
      activatable: isFinal && burstEligible && hasSpecialFormEntitlement(game, speciesId, 'burst')
    }
  }
}
