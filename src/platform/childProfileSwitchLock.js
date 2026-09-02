export const CHILD_PROFILE_SWITCH_LOCK_EVENT = 'manaevo:child-profile-switch-lock'

const activeLocks = new Set()

function publish() {
  if (typeof globalThis.dispatchEvent !== 'function' || typeof globalThis.CustomEvent !== 'function') return
  try {
    globalThis.dispatchEvent(new CustomEvent(CHILD_PROFILE_SWITCH_LOCK_EVENT, { detail: { locked: activeLocks.size > 0 } }))
  } catch {}
}

export function setChildProfileSwitchLock(owner, locked) {
  const key = String(owner || 'unknown')
  if (locked) activeLocks.add(key)
  else activeLocks.delete(key)
  publish()
}

export function isChildProfileSwitchLocked() {
  return activeLocks.size > 0
}

export function subscribeChildProfileSwitchLock(listener) {
  if (typeof globalThis.addEventListener !== 'function') return () => {}
  const onChange = (event) => listener?.(event?.detail?.locked === true)
  globalThis.addEventListener(CHILD_PROFILE_SWITCH_LOCK_EVENT, onChange)
  return () => globalThis.removeEventListener(CHILD_PROFILE_SWITCH_LOCK_EVENT, onChange)
}
