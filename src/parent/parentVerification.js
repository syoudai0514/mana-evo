let active = false

export function markParentVerification() {
  active = true
}

export function clearParentVerification() {
  active = false
}

export function isParentVerificationActive() {
  return active
}
