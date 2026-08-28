export const CLOUD_APP_ID = 'mana-evo'
export const CLOUD_SLOT_MAIN = 'main'
export const CLOUD_SAVE_SCHEMA_VERSION = 1
export const CLOUD_SYNC_META_PREFIX = 'manaevo:cloud-sync-meta:v1:'
export const DEVICE_PROFILE_KEY = 'manaevo:device-profile:v1'
export const TEST_MODE_KEY = 'manaevo:test-mode:v1'
export const TEST_RETURN_KEY = 'manaevo:test-return:v1'

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

export function payloadHash(value) {
  const text = stableStringify(value)
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function makeCloudPayload({ learning, gameEnvelope, capturedAt = new Date().toISOString() }) {
  return {
    appId: CLOUD_APP_ID,
    saveSchemaVersion: CLOUD_SAVE_SCHEMA_VERSION,
    capturedAt,
    learning,
    gameEnvelope
  }
}

export function syncMetaKey(userId) {
  return `${CLOUD_SYNC_META_PREFIX}${String(userId || '')}`
}

export function decideSync({ localHash, meta = null, cloud = null }) {
  if (!cloud) return { action: 'push-new' }
  const cloudHash = payloadHash(cloud.payload)
  if (!meta) return localHash === cloudHash ? { action: 'adopt', cloudHash } : { action: 'conflict', cloudHash }
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
