import {
  attemptCapture as attemptCaptureShared,
  canAttemptCapture as canAttemptCaptureShared
} from './engineSharedRuntime.js'
import {
  attemptPostWinCapture,
  canAttemptPostWinCapture,
  isPostWinCapturePhase
} from './postWinCapture.js'

export * from './engineSharedRuntime.js'

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
