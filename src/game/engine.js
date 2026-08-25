import { attemptCapture as attemptCaptureShared } from './engineSharedRuntime.js'

export * from './engineSharedRuntime.js'

// Preserve the public default while ensuring null means "no caller-supplied roll".
// Number(null) is 0, which would otherwise make every default capture succeed.
export function attemptCapture(game, battle, rolls = null, itemType = 'star', options = {}) {
  return attemptCaptureShared(game, battle, rolls === null ? undefined : rolls, itemType, options)
}
