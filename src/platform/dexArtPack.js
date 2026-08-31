export const DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'
export const DEX_ART_TARGET_COUNT = 238
export const DEX_ART_REV_PARAM = '__manaevo_rev'

let manifestMemo = null

function baseUrl() {
  const raw = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

function publicUrl(path) {
  if (/^(https?:|data:|blob:)/.test(path)) return path
  const clean = String(path || '').replace(/^\/+/, '')
  return `${baseUrl()}${clean}`
}

export function revisionRequestUrl(asset) {
  const absolute = new URL(publicUrl(asset.url), typeof location !== 'undefined' ? location.href : 'https://mana-evo.invalid/')
  absolute.searchParams.set(DEX_ART_REV_PARAM, asset.revision)
  return absolute.href
}

export function normalizedDexManifest(raw) {
  const assets = Object.entries(raw?.assets || {})
    .filter(([, entry]) => entry?.state === 'FORMAL')
    .map(([speciesId, entry]) => ({
      speciesId,
      url: entry.url,
      revision: entry.revision,
      byteLength: Number(entry.byteLength || 0)
    }))
    .sort((a, b) => a.speciesId.localeCompare(b.speciesId))

  if (assets.length !== DEX_ART_TARGET_COUNT) {
    throw new Error(`FORMAL art manifest must contain ${DEX_ART_TARGET_COUNT} assets (got ${assets.length})`)
  }
  for (const asset of assets) {
    if (!/^m\d{3}$/.test(asset.speciesId) || asset.speciesId === 'm239') throw new Error(`invalid active FORMAL species ${asset.speciesId}`)
    if (!asset.url || !String(asset.revision || '').startsWith('sha256-')) throw new Error(`missing FORMAL art identity for ${asset.speciesId}`)
  }
  return {
    schemaVersion: raw.schemaVersion,
    manifestRevision: raw.manifestRevision || null,
    totalBytes: Number(raw.totalBytes || assets.reduce((sum, asset) => sum + asset.byteLength, 0)),
    assets
  }
}

export async function loadDexArtManifest({ cache = 'no-store', refresh = false } = {}) {
  if (!refresh && manifestMemo) return manifestMemo
  const response = await fetch(`${baseUrl()}monster-asset-revisions.json`, { cache })
  if (!response.ok) throw new Error(`monster manifest HTTP ${response.status}`)
  manifestMemo = normalizedDexManifest(await response.json())
  return manifestMemo
}

export function clearDexArtManifestMemo() {
  manifestMemo = null
}

export function expectedShaHex(revision) {
  return String(revision || '').replace(/^sha256-/, '').toLowerCase()
}

export async function sha256Hex(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is unavailable on this browser')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export async function verifyAssetResponse(asset, response) {
  if (!response?.ok) throw new Error(`${asset.speciesId}: image HTTP ${response?.status || 'error'}`)
  // Preserve the browser-native response object for CacheStorage. Rebuilding the
  // response with new Response(bytes) can lose fetch response metadata/type that
  // WebKit requires when a Service Worker later satisfies an <img> request offline.
  const cacheResponse = response.clone()
  const bytes = await response.arrayBuffer()
  const actual = await sha256Hex(bytes)
  const expected = expectedShaHex(asset.revision)
  if (actual !== expected) throw new Error(`${asset.speciesId}: SHA mismatch (${actual.slice(0, 12)} != ${expected.slice(0, 12)})`)
  return { bytes, response: cacheResponse }
}

export async function cacheHasCurrentAsset(cache, asset) {
  return !!(await cache.match(revisionRequestUrl(asset)))
}

export async function fetchVerifyAndCacheAsset(asset, { signal } = {}) {
  const cache = await caches.open(DEX_ART_CACHE_NAME)
  const key = revisionRequestUrl(asset)
  if (await cache.match(key)) return { speciesId: asset.speciesId, cached: true, bytes: asset.byteLength || 0 }

  const response = await fetch(publicUrl(asset.url), { cache: 'no-store', signal })
  const verified = await verifyAssetResponse(asset, response)
  await cache.put(key, verified.response)
  return { speciesId: asset.speciesId, cached: false, bytes: verified.bytes.byteLength }
}

export async function auditDexArtPack(manifest = null) {
  const target = manifest || await loadDexArtManifest()
  const cache = await caches.open(DEX_ART_CACHE_NAME)
  let complete = 0
  let downloadedBytes = 0
  const missing = []
  for (const asset of target.assets) {
    if (await cache.match(revisionRequestUrl(asset))) {
      complete += 1
      downloadedBytes += asset.byteLength || 0
    } else {
      missing.push(asset)
    }
  }
  return {
    manifest: target,
    complete,
    total: target.assets.length,
    downloadedBytes,
    totalBytes: target.totalBytes,
    missing,
    isComplete: complete === target.assets.length
  }
}

export async function pruneDexArtCache(manifest = null) {
  const target = manifest || await loadDexArtManifest()
  const expected = new Set(target.assets.map(revisionRequestUrl))
  const cache = await caches.open(DEX_ART_CACHE_NAME)
  const keys = await cache.keys()
  await Promise.all(keys.filter((key) => !expected.has(key.url)).map((key) => cache.delete(key)))
}

async function runPool(items, worker, concurrency) {
  let next = 0
  const runners = Array.from({ length: Math.min(Math.max(1, concurrency), items.length || 1) }, async () => {
    while (next < items.length) {
      const index = next++
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

export async function downloadDexArtPack({ onProgress, signal, concurrency = 4 } = {}) {
  const frozen = await loadDexArtManifest({ cache: 'no-store', refresh: true })
  let audit = await auditDexArtPack(frozen)
  onProgress?.(audit)

  await runPool(audit.missing, async (asset) => {
    if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError')
    await fetchVerifyAndCacheAsset(asset, { signal })
    audit = await auditDexArtPack(frozen)
    onProgress?.(audit)
  }, concurrency)

  const completedFrozen = await auditDexArtPack(frozen)
  const latest = await loadDexArtManifest({ cache: 'no-store', refresh: true })
  const latestAudit = await auditDexArtPack(latest)
  await pruneDexArtCache(latest)
  notifyServiceWorkerManifestRefresh()

  return {
    ...latestAudit,
    targetManifestRevision: frozen.manifestRevision,
    latestManifestRevision: latest.manifestRevision,
    updateAvailable: frozen.manifestRevision !== latest.manifestRevision || !latestAudit.isComplete,
    completedFrozen: completedFrozen.isComplete
  }
}

export async function deleteDexArtPack() {
  const deleted = await caches.delete(DEX_ART_CACHE_NAME)
  notifyServiceWorkerManifestRefresh()
  return deleted
}

export async function requestPersistentDexStorage() {
  try {
    if (!navigator.storage?.persist) return false
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function dexStorageEstimate() {
  try {
    if (!navigator.storage?.estimate) return null
    return await navigator.storage.estimate()
  } catch {
    return null
  }
}

export function formatBytes(bytes) {
  const value = Number(bytes || 0)
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function notifyServiceWorkerManifestRefresh() {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'MANA_EVO_DEX_ART_REFRESH_MANIFEST' })
  } catch {}
}

export async function prefetchDexSpecies(speciesIds = []) {
  if (!speciesIds.length) return
  const manifest = await loadDexArtManifest().catch(() => null)
  if (!manifest) return
  const wanted = new Set(speciesIds)
  await Promise.all(manifest.assets.filter((asset) => wanted.has(asset.speciesId)).map(async (asset) => {
    try { await fetchVerifyAndCacheAsset(asset) } catch {}
  }))
}
