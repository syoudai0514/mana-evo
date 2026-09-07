export const CLOUD_APP_ID = 'mana-evo'
export const CLOUD_SLOT_MAIN = 'main'
export const CLOUD_SAVE_SCHEMA_VERSION = 1
export const CLOUD_SYNC_META_PREFIX = 'manaevo:cloud-sync-meta:v1:'
export const DEVICE_PROFILE_KEY = 'manaevo:device-profile:v1'
export const TEST_MODE_KEY = 'manaevo:test-mode:v1'
export const TEST_RETURN_KEY = 'manaevo:test-return:v1'

export const CLOUD_RECOVERY_REASONS = Object.freeze({
  NO_TRUSTED_BASE: 'NO_TRUSTED_BASE',
  LOCAL_AND_CLOUD_DIVERGED: 'LOCAL_AND_CLOUD_DIVERGED',
  SAME_REVISION_DIVERGENCE: 'SAME_REVISION_DIVERGENCE',
  CLOUD_REVISION_REGRESSION: 'CLOUD_REVISION_REGRESSION'
})

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

function payloadProfileIds(payload) {
  const ids = new Set([
    ...Object.keys(payload?.learning?.profiles || {}),
    ...Object.keys(payload?.gameEnvelope?.gameByProfile || {}),
    ...Object.keys(payload?.learningRewardEnvelope?.byProfile || {})
  ])
  return [...ids].sort()
}

function globalPayloadSlice(payload) {
  return {
    appId: payload?.appId ?? null,
    saveSchemaVersion: payload?.saveSchemaVersion ?? null,
    learningVersion: payload?.learning?.version ?? null,
    contentVersion: payload?.learning?.contentVersion ?? null,
    gameFormatVersion: payload?.gameEnvelope?.formatVersion ?? null,
    rewardFormatVersion: payload?.learningRewardEnvelope?.version ?? null
  }
}

function profilePayloadSlice(payload, profileId) {
  return {
    learning: payload?.learning?.profiles?.[profileId] ?? null,
    game: payload?.gameEnvelope?.gameByProfile?.[profileId] ?? null,
    reward: payload?.learningRewardEnvelope?.byProfile?.[profileId] ?? null
  }
}

// Retained as recovery/debug metadata only. D-032 does not use part hashes to
// automatically merge divergent snapshots.
export function payloadPartHashes(payload) {
  const parts = { __global__: payloadHash(globalPayloadSlice(payload)) }
  for (const profileId of payloadProfileIds(payload)) parts[profileId] = payloadHash(profilePayloadSlice(payload, profileId))
  return parts
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

/**
 * D-032 Cloud Sync V2 decision authority.
 *
 * Normal cases stay automatic:
 * - only local changed against the same trusted cloud base -> push
 * - only cloud advanced -> pull
 * - genuinely fresh device -> pull
 *
 * If local data may contain progress that is not in cloud while cloud is also
 * different, we never synthesize a merged snapshot. The caller must persist a
 * recovery candidate first and only then apply cloud (`recover-pull`).
 */
export function decideSync({ localHash, meta = null, cloud = null, freshDevice = FRESH_DEVICE_AT_BOOT }) {
  if (!cloud) return { action: 'push-new' }

  const cloudHash = payloadHash(cloud.payload)
  const cloudRevision = Number(cloud.revision) || 0

  if (!meta) {
    if (localHash === cloudHash) return { action: 'adopt', cloudHash }
    return freshDevice
      ? { action: 'pull', cloudHash }
      : { action: 'recover-pull', cloudHash, recoveryReason: CLOUD_RECOVERY_REASONS.NO_TRUSTED_BASE }
  }

  const revision = Number(meta.revision) || 0
  const localMatchesBase = localHash === meta.hash
  const cloudMatchesBase = cloudHash === meta.hash

  if (cloudRevision === revision) {
    if (localHash === cloudHash) return { action: 'noop', cloudHash }
    if (cloudMatchesBase && !localMatchesBase) return { action: 'push', cloudHash }
    if (localMatchesBase && !cloudMatchesBase) return { action: 'pull', cloudHash }
    return {
      action: 'recover-pull',
      cloudHash,
      recoveryReason: CLOUD_RECOVERY_REASONS.SAME_REVISION_DIVERGENCE
    }
  }

  if (cloudRevision > revision) {
    if (localHash === cloudHash) return { action: 'adopt', cloudHash }
    if (localMatchesBase) return { action: 'pull', cloudHash }
    return {
      action: 'recover-pull',
      cloudHash,
      recoveryReason: CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED
    }
  }

  if (localHash === cloudHash) return { action: 'adopt', cloudHash }
  return {
    action: 'recover-pull',
    cloudHash,
    recoveryReason: CLOUD_RECOVERY_REASONS.CLOUD_REVISION_REGRESSION
  }
}
