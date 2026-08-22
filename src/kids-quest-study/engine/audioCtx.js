let ctx = null

export function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function unlockAudio() {
  const a = getCtx()
  if (a && a.state === 'suspended') a.resume()
  return a
}
