export const CLOUD_APP_ID = 'mana-evo'
export const CLOUD_SLOT_MAIN = 'main'
export const CLOUD_SAVE_SCHEMA_VERSION = 1
export const CLOUD_SYNC_META_PREFIX = 'manaevo:cloud-sync-meta:v1:'
export const DEVICE_PROFILE_KEY = 'manaevo:device-profile:v1'
export const TEST_MODE_KEY = 'manaevo:test-mode:v1'
export const TEST_RETURN_KEY = 'manaevo:test-return:v1'

const PREEXISTING_LOCAL_SAVE_KEYS = Object.freeze([
  'mana-evo:kids-quest-learning:v2',
  'mana-evo-save-v2',
  'mana-evo-save-v1'
])

const FRESH_DEVICE_AT_BOOT = (() => {
  try {
    if (!globalThis.localStorage) return false
    return !PREEXISTING_LOCAL_SAVE_KEYS.some((key) => globalThis.localStorage.getItem(key) != null)
  } catch { return false }
})()

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
  }
  return value
}

export function stableStringify(value) {
  return JSON.stringify(canonical(value))
}

function semanticPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  if (!('capturedAt' in value)) return value
  const { capturedAt: _capturedAt, ...semantic } = value
  return semantic
}

export function payloadHash(value) {
  const text = stableStringify(semanticPayload(value))
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function makeCloudPayload({ learning, gameEnvelope, learningRewardEnvelope = null, capturedAt = new Date().toISOString() }) {
  return {
    appId: CLOUD_APP_ID,
    saveSchemaVersion: CLOUD_SAVE_SCHEMA_VERSION,
    capturedAt,
    learning,
    gameEnvelope,
    learningRewardEnvelope
  }
}

export function syncMetaKey(userId) {
  return `${CLOUD_SYNC_META_PREFIX}${String(userId || '')}`
}

export function decideSync({ localHash, meta = null, cloud = null, freshDevice = FRESH_DEVICE_AT_BOOT }) {
  if (!cloud) return { action: 'push-new' }
  const cloudHash = payloadHash(cloud.payload)
  if (!meta) {
    if (localHash === cloudHash) return { action: 'adopt', cloudHash }
    return freshDevice ? { action: 'pull', cloudHash } : { action: 'conflict', cloudHash }
  }
  const revision = Number(meta.revision) || 0
  const cloudRevision = Number(cloud.revision) || 0
  if (cloudRevision === revision) {
    return localHash === meta.hash
      ? { action: 'noop', cloudHash }
      : { action: 'push', cloudHash }
  }
  if (cloudRevision > revision) {
    return localHash === meta.hash
      ? { action: 'pull', cloudHash }
      : { action: 'conflict', cloudHash }
  }
  return { action: 'conflict', cloudHash }
}
