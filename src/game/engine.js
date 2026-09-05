import {
  attemptCapture as attemptCaptureShared,
  canAttemptCapture as canAttemptCaptureShared
} from './engineSharedRuntime.js'
import {
  attemptPostWinCapture,
  canAttemptPostWinCapture,
  isPostWinCapturePhase
} from './postWinCapture.js'
import { speciesOf } from './content.js'

export * from './engineSharedRuntime.js'

// D-031 canonical acquisition rule. First forms may be captured; stage 2/final
// forms are obtained by confirmed self-evolution only. Evolved forms can still be
// fought through unlocked training/special battles, but capture stays disabled on
// both the in-battle and post-win public routes.
function evolvedFormCaptureBlocked(battle) {
  const speciesId = battle?.enemy?.speciesId
  if (!speciesId) return false
  const species = speciesOf(speciesId)
  return Math.max(1, Number(species?.stage) || 1) >= 2
}

export function canAttemptCapture(game, battle, itemType = 'star') {
  const authoritativeBattle = game?.activeBattle || battle
  if (evolvedFormCaptureBlocked(authoritativeBattle)) return false
  if (isPostWinCapturePhase(battle)) return canAttemptPostWinCapture(game, battle, itemType)
  return canAttemptCaptureShared(game, battle, itemType)
}

// Preserve the public default while ensuring null means "no caller-supplied roll".
// Number(null) is 0, which would otherwise make every default capture succeed.
export function attemptCapture(game, battle, rolls = null, itemType = 'star', options = {}) {
  const authoritativeBattle = game?.activeBattle || battle
  if (evolvedFormCaptureBlocked(authoritativeBattle)) {
    return { ok: false, game, battle: authoritativeBattle, reason: 'CAPTURE_DISABLED' }
  }
  const normalizedRolls = rolls === null ? undefined : rolls
  if (isPostWinCapturePhase(battle)) {
    return attemptPostWinCapture(game, battle, normalizedRolls, itemType, options)
  }
  return attemptCaptureShared(game, battle, normalizedRolls, itemType, options)
}
