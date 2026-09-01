export const UNNAMED_PROFILE_LABEL = 'なまえをきめよう'

const LEGACY_AUTO_NAME = /^ぼうけんしゃ\s*\d*$/

export function isLegacyAutoProfileName(name) {
  return LEGACY_AUTO_NAME.test(String(name || '').trim())
}

export function profileDisplayName(profile, fallback = UNNAMED_PROFILE_LABEL) {
  const raw = String(profile?.name || '').trim()
  if (!raw || isLegacyAutoProfileName(raw)) return fallback
  return raw
}

export function profileEditableName(profile) {
  const raw = String(profile?.name || '').trim()
  return !raw || isLegacyAutoProfileName(raw) ? '' : raw
}
