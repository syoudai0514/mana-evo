import * as core from './progressionCore.js'
import { applyLearningGameReward } from './learningRewardBridge.js'
import { speciesOf } from './content.js'
import {
  getEvolutionTransition,
  normalizePendingEvolution,
  qualifyMaxLevelHeldItemEvolution
} from './evolutionDomain.js'
import { hasSpecialFormEntitlement, isSpecialFormTarget } from './specialFormsDomain.js'
import { withSharedRuntimeState } from './sharedRuntimeState.js'

export const CURRENT_GAME_VERSION = 11
export const CAPTURE_ITEM_IDS = core.CAPTURE_ITEM_IDS
export const TICKET_TTL_DAYS = core.TICKET_TTL_DAYS

export const canonicalSpeciesId = core.canonicalSpeciesId
export const availableTicketCount = core.availableTicketCount

function migrationPending(monster, rawMonster, sourceVersion) {
  if (Number(sourceVersion || 0) >= CURRENT_GAME_VERSION) return null
  const transition = getEvolutionTransition(monster?.speciesId)
  if (!transition || transition.method === 'stone') return null
  const qualified = transition.method === 'level'
    ? Number(monster?.level || 0) >= Number(transition.level || Infinity)
    : transition.method === 'held_item_levelup' && rawMonster?.evolutionReady === true && monster?.heldItemId === transition.itemId
  if (!qualified) return null
  const sourceOperationId = `migration:v${CURRENT_GAME_VERSION}:${monster.instanceId}:${transition.fromSpeciesId}->${transition.toSpeciesId}`
  return {
    qualificationId: `evo:${sourceOperationId}:${monster.instanceId}:${transition.fromSpeciesId}->${transition.toSpeciesId}`,
    sourceOperationId,
    fromSpeciesId: transition.fromSpeciesId,
    toSpeciesId: transition.toSpeciesId,
    method: transition.method,
    qualifiedAtLevel: Math.max(1, Number(monster.level) || 1),
    ...(transition.method === 'held_item_levelup' ? { itemId: transition.itemId } : {}),
    qualificationKind: 'migration'
  }
}

function preservePendingEvolution(target, source) {
  if (!target?.box || typeof target.box !== 'object') return target
  const sourceBox = source?.box && typeof source.box === 'object' ? source.box : {}
  for (const [instanceId, monster] of Object.entries(target.box)) {
    const targetPending = normalizePendingEvolution(monster, monster?.pendingEvolution)
    const sourcePending = normalizePendingEvolution(monster, sourceBox?.[instanceId]?.pendingEvolution)
    const migrated = targetPending || sourcePending || migrationPending(monster, sourceBox?.[instanceId], source?.version)
    target.box[instanceId] = {
      ...monster,
      pendingEvolution: migrated || null,
      evolutionReady: !!migrated
    }
  }
  return target
}

function preserve(source, next) {
  const merged = withSharedRuntimeState(next, source)
  preservePendingEvolution(merged, source)
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
  const equipped = preserveResult(game, core.equipHeldItem(game, instanceId, itemId, today))
  if (!equipped?.ok) return equipped
  const recovered = qualifyMaxLevelHeldItemEvolution(equipped.game, {
    instanceId,
    operationId: `max-level-held-item:${instanceId}:${equipped.game.box?.[instanceId]?.speciesId || 'unknown'}:${itemId}`
  })
  return recovered.ok
    ? { ...equipped, game: preserve(equipped.game, recovered.game), pendingEvolution: recovered.pendingEvolution || null }
    : equipped
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