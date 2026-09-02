import {
  attemptCapture as attemptCaptureShared,
  canAttemptCapture as canAttemptCaptureShared,
  useMove as useMoveShared,
  useProtect as useProtectShared
} from './engineSharedRuntime.js'
import {
  attemptPostWinCapture,
  canAttemptPostWinCapture,
  isPostWinCapturePhase
} from './postWinCapture.js'
import {
  buildMovePresentationEvents,
  buildProtectPresentationEvents
} from './battlePresentationDomain.js'

export * from './engineSharedRuntime.js'

export function useMove(game, battle, moveId, options = {}) {
  const result = useMoveShared(game, battle, moveId, options)
  if (!result?.ok) return result
  return {
    ...result,
    presentationEvents: buildMovePresentationEvents(game, battle, moveId, result)
  }
}

export function useProtect(game, battle, options = {}) {
  const result = useProtectShared(game, battle, options)
  if (!result?.ok) return result
  return {
    ...result,
    presentationEvents: buildProtectPresentationEvents(game, battle, result)
  }
}

export function canAttemptCapture(game, battle, itemType = 'star') {
  if (isPostWinCapturePhase(battle)) return canAttemptPostWinCapture(game, battle, itemType)
  return canAttemptCaptureShared(game, battle, itemType)
}

// Preserve the public default while ensuring null means "no caller-supplied roll".
// Number(null) is 0, which would otherwise make every default capture succeed.
export function attemptCapture(game, battle, rolls = null, itemType = 'star', options = {}) {
  const normalizedRolls = rolls === null ? undefined : rolls
  if (isPostWinCapturePhase(battle)) {
    return attemptPostWinCapture(game, battle, normalizedRolls, itemType, options)
  }
  return attemptCaptureShared(game, battle, normalizedRolls, itemType, options)
}
