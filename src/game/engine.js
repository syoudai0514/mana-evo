import {
  attemptCapture as attemptCaptureShared,
  canAttemptCapture as canAttemptCaptureShared,
  stageById
} from './engineSharedRuntime.js'
import {
  attemptPostWinCapture,
  canAttemptPostWinCapture,
  isPostWinCapturePhase
} from './postWinCapture.js'
import { speciesOf } from './content.js'

export * from './engineSharedRuntime.js'

// D-031 canonical capture authority. A stage-level capture prohibition is checked
// before route-specific capture logic, and evolved forms are independently blocked
// because their first canonical acquisition must be confirmed self-evolution.
function captureBlocked(battle) {
  const stage = stageById(battle?.stageId)
  if (stage?.captureDisabled) return true
  const speciesId = battle?.enemy?.speciesId
  if (!speciesId) return false
  const species = speciesOf(speciesId)
  return Math.max(1, Number(species?.stage) || 1) >= 2
}

export function canAttemptCapture(game, battle, itemType = 'star') {
  const authoritativeBattle = game?.activeBattle || battle
  if (captureBlocked(authoritativeBattle)) return false
  if (isPostWinCapturePhase(authoritativeBattle)) return canAttemptPostWinCapture(game, authoritativeBattle, itemType)
  return canAttemptCaptureShared(game, authoritativeBattle, itemType)
}

// Preserve the public default while ensuring null means "no caller-supplied roll".
// Number(null) is 0, which would otherwise make every default capture succeed.
export function attemptCapture(game, battle, rolls = null, itemType = 'star', options = {}) {
  const authoritativeBattle = game?.activeBattle || battle
  if (captureBlocked(authoritativeBattle)) {
    return { ok: false, game, battle: authoritativeBattle, reason: 'CAPTURE_DISABLED' }
  }
  const normalizedRolls = rolls === null ? undefined : rolls
  if (isPostWinCapturePhase(authoritativeBattle)) {
    return attemptPostWinCapture(game, authoritativeBattle, normalizedRolls, itemType, options)
  }
  return attemptCaptureShared(game, authoritativeBattle, normalizedRolls, itemType, options)
}
