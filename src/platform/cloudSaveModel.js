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

export function payloadPartHashes(payload) {
  const parts = { __global__: payloadHash(globalPayloadSlice(payload)) }
  for (const profileId of payloadProfileIds(payload)) parts[profileId] = payloadHash(profilePayloadSlice(payload, profileId))
  return parts
}

function changedPartKeys(current, base) {
  const keys = new Set([...Object.keys(current || {}), ...Object.keys(base || {})])
  return [...keys].filter((key) => current?.[key] !== base?.[key])
}

function clone(value) {
  return value == null ? value : structuredClone(value)
}

function copyProfilePart(target, source, profileId) {
  target.learning ||= {}
  target.learning.profiles ||= {}
  target.gameEnvelope ||= { formatVersion: source?.gameEnvelope?.formatVersion ?? 2, gameByProfile: {} }
  target.gameEnvelope.gameByProfile ||= {}
  target.learningRewardEnvelope ||= { version: source?.learningRewardEnvelope?.version ?? 1, byProfile: {} }
  target.learningRewardEnvelope.byProfile ||= {}

  const learning = source?.learning?.profiles?.[profileId]
  const game = source?.gameEnvelope?.gameByProfile?.[profileId]
  const reward = source?.learningRewardEnvelope?.byProfile?.[profileId]
  if (learning == null) delete target.learning.profiles[profileId]
  else target.learning.profiles[profileId] = clone(learning)
  if (game == null) delete target.gameEnvelope.gameByProfile[profileId]
  else target.gameEnvelope.gameByProfile[profileId] = clone(game)
  if (reward == null) delete target.learningRewardEnvelope.byProfile[profileId]
  else target.learningRewardEnvelope.byProfile[profileId] = clone(reward)
}

export function mergeDisjointProfilePayloads({ localPayload, cloudPayload, baseParts }) {
  if (!localPayload || !cloudPayload || !baseParts) return null
  const localParts = payloadPartHashes(localPayload)
  const cloudParts = payloadPartHashes(cloudPayload)
  const localChanged = changedPartKeys(localParts, baseParts)
  const cloudChanged = changedPartKeys(cloudParts, baseParts)
  const cloudChangedSet = new Set(cloudChanged)
  const conflicts = localChanged.filter((key) => cloudChangedSet.has(key) && localParts[key] !== cloudParts[key])
  if (conflicts.length) return { ok: false, conflicts, localParts, cloudParts }

  const merged = clone(cloudPayload)
  const localChangedSet = new Set(localChanged)
  if (localChangedSet.has('__global__') && !cloudChangedSet.has('__global__')) {
    merged.appId = localPayload.appId
    merged.saveSchemaVersion = localPayload.saveSchemaVersion
    merged.learning ||= {}
    merged.learning.version = localPayload.learning?.version
    merged.learning.contentVersion = localPayload.learning?.contentVersion
    merged.gameEnvelope ||= {}
    merged.gameEnvelope.formatVersion = localPayload.gameEnvelope?.formatVersion
    merged.learningRewardEnvelope ||= {}
    merged.learningRewardEnvelope.version = localPayload.learningRewardEnvelope?.version
  }
  for (const key of localChanged) {
    if (key === '__global__') continue
    if (!cloudChangedSet.has(key)) copyProfilePart(merged, localPayload, key)
  }
  merged.capturedAt = new Date().toISOString()
  return { ok: true, payload: merged, localParts, cloudParts, localChanged, cloudChanged }
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

export function decideSync({ localHash, localPayload = null, meta = null, cloud = null, freshDevice = FRESH_DEVICE_AT_BOOT }) {
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
    if (localHash === meta.hash) return { action: 'pull', cloudHash }
    const merged = mergeDisjointProfilePayloads({ localPayload, cloudPayload: cloud.payload, baseParts: meta.parts })
    if (merged?.ok) return { action: 'merge', cloudHash, payload: merged.payload, merged }
    return { action: 'conflict', cloudHash, conflicts: merged?.conflicts || [] }
  }
  return { action: 'conflict', cloudHash }
}
