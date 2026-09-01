import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildRevisionManifest } from '../scripts/generate-pwa-asset-revisions.mjs'
import {
  DEX_ART_CACHE_NAME,
  auditDexArtPack,
  clearDexArtManifestMemo,
  downloadDexArtPack,
  fetchVerifyAndCacheAsset,
  normalizedDexManifest,
  revisionRequestUrl,
  verifyAssetResponse
} from '../src/platform/dexArtPack.js'

function canonical238() {
  return {
    schemaVersion: 1,
    assets: Object.fromEntries(Array.from({ length: 238 }, (_, index) => {
      const speciesId = `m${String(index + 1).padStart(3, '0')}`
      return [speciesId, { state: 'FORMAL', formalAsset: `/monsters/${speciesId}.webp` }]
    }))
  }
}

function requestKey(input) {
  const raw = typeof input === 'string' ? input : input.url
  return new URL(raw, 'https://mana-evo.invalid/').href
}

class MemoryCache {
  constructor() {
    this.entries = new Map()
    this.matchCount = 0
  }

  async match(input) {
    this.matchCount += 1
    const response = this.entries.get(requestKey(input))
    return response ? response.clone() : undefined
  }

  async put(input, response) {
    this.entries.set(requestKey(input), response.clone())
  }

  async delete(input) {
    return this.entries.delete(requestKey(input))
  }

  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url))
  }
}

class MemoryCacheStorage {
  constructor() {
    this.caches = new Map()
  }

  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new MemoryCache())
    return this.caches.get(name)
  }

  async delete(name) {
    return this.caches.delete(name)
  }

  async keys() {
    return [...this.caches.keys()]
  }
}

function fixture(changes = {}) {
  const bytesByPath = new Map()
  const manifest = buildRevisionManifest(canonical238(), (url) => {
    const speciesId = url.match(/(m\d{3})\.webp$/)?.[1]
    const version = changes[speciesId] || 'v1'
    const bytes = Buffer.from(`fixture:${url}:${version}`)
    bytesByPath.set(url, bytes)
    return bytes
  })
  return { manifest, bytesByPath }
}

function installDexRuntime(initialFixture) {
  const originals = {
    caches: globalThis.caches,
    fetch: globalThis.fetch
  }
  const cacheStorage = new MemoryCacheStorage()
  let activeFixture = initialFixture
  let imageRequests = []

  globalThis.caches = cacheStorage
  globalThis.fetch = async (input) => {
    const raw = typeof input === 'string' ? input : input.url
    const url = new URL(raw, 'https://mana-evo.invalid/')
    if (url.pathname.endsWith('/monster-asset-revisions.json')) {
      return new Response(JSON.stringify(activeFixture.manifest), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }
    if (url.pathname.startsWith('/monsters/')) {
      imageRequests.push(url.pathname)
      const bytes = activeFixture.bytesByPath.get(url.pathname)
      if (!bytes) return new Response('missing', { status: 404 })
      return new Response(bytes, { status: 200, headers: { 'content-type': 'image/webp' } })
    }
    return new Response('not found', { status: 404 })
  }
  clearDexArtManifestMemo()

  return {
    caches: cacheStorage,
    setFixture(next) {
      activeFixture = next
      clearDexArtManifestMemo()
    },
    resetImageRequests() {
      imageRequests = []
    },
    imageRequests() {
      return [...imageRequests]
    },
    restore() {
      clearDexArtManifestMemo()
      if (originals.caches === undefined) delete globalThis.caches
      else globalThis.caches = originals.caches
      globalThis.fetch = originals.fetch
    }
  }
}

test('D-020 revision manifest carries byteLength, totalBytes and stable manifest revision for exactly 238 FORMAL assets', () => {
  const manifest = buildRevisionManifest(canonical238(), (url) => Buffer.from(`bytes:${url}`))
  assert.equal(manifest.schemaVersion, 2)
  assert.equal(manifest.formalCount, 238)
  assert.ok(manifest.totalBytes > 0)
  assert.match(manifest.manifestRevision, /^sha256-[0-9a-f]{64}$/)
  assert.equal(Object.keys(manifest.formalByUrl).length, 238)
  assert.ok(manifest.assets.m001.byteLength > 0)
  assert.match(manifest.assets.m238.revision, /^sha256-[0-9a-f]{64}$/)
  assert.equal(manifest.assets.m239, undefined)
})

test('D-020 normalized client manifest rejects an active set other than 238 FORMAL assets', () => {
  assert.throws(() => normalizedDexManifest({ assets: { m001: { state: 'FORMAL', url: '/monsters/m001.webp', revision: `sha256-${'a'.repeat(64)}` } } }), /238/)
})

test('D-020 verified-write boundary rejects stale HTTP-success bytes with the wrong SHA', async () => {
  const bytes = new TextEncoder().encode('current bytes')
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const expected = [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('')
  const asset = { speciesId: 'm001', revision: `sha256-${expected}` }

  const good = await verifyAssetResponse(asset, new Response(bytes, { status: 200, headers: { 'content-type': 'image/webp' } }))
  assert.equal(good.bytes.byteLength, bytes.byteLength)

  await assert.rejects(
    verifyAssetResponse(asset, new Response(new TextEncoder().encode('old stale bytes'), { status: 200 })),
    /SHA mismatch/
  )
})

test('AC-DEX-PERF-003 crash-boundary resume trusts committed revision key and does not refetch it', async () => {
  const base = fixture()
  const runtime = installDexRuntime(base)
  try {
    const manifest = normalizedDexManifest(base.manifest)
    const first = manifest.assets[0]
    await fetchVerifyAndCacheAsset(first)
    runtime.resetImageRequests()

    const result = await downloadDexArtPack({ concurrency: 4 })
    assert.equal(result.complete, 238)
    assert.equal(result.isComplete, true)
    assert.equal(runtime.imageRequests().filter((path) => path === first.url).length, 0)
    assert.equal(runtime.imageRequests().length, 237)
  } finally {
    runtime.restore()
  }
})

test('D-020 download progress does not rescan all 238 cache entries after every completed image', async () => {
  const base = fixture()
  const runtime = installDexRuntime(base)
  try {
    const cache = await runtime.caches.open(DEX_ART_CACHE_NAME)
    await downloadDexArtPack({ concurrency: 4 })
    assert.ok(cache.matchCount < 2000, `expected bounded cache matching, got ${cache.matchCount}`)
  } finally {
    runtime.restore()
  }
})

test('AC-DEX-PERF-005 delta update fetches exactly 1 then exactly 7 changed image revisions', async () => {
  const base = fixture()
  const runtime = installDexRuntime(base)
  try {
    const initial = await downloadDexArtPack({ concurrency: 4 })
    assert.equal(initial.isComplete, true)

    const oneChanged = fixture({ m123: 'v2' })
    runtime.setFixture(oneChanged)
    runtime.resetImageRequests()
    const oneResult = await downloadDexArtPack({ concurrency: 4 })
    assert.equal(oneResult.isComplete, true)
    assert.deepEqual(runtime.imageRequests(), ['/monsters/m123.webp'])

    const sevenChanged = fixture({
      m002: 'v2', m003: 'v2', m004: 'v2', m005: 'v2', m006: 'v2', m007: 'v2', m008: 'v2',
      m123: 'v2'
    })
    runtime.setFixture(sevenChanged)
    runtime.resetImageRequests()
    const sevenResult = await downloadDexArtPack({ concurrency: 4 })
    assert.equal(sevenResult.isComplete, true)
    assert.deepEqual(runtime.imageRequests().sort(), [
      '/monsters/m002.webp', '/monsters/m003.webp', '/monsters/m004.webp', '/monsters/m005.webp',
      '/monsters/m006.webp', '/monsters/m007.webp', '/monsters/m008.webp'
    ])
  } finally {
    runtime.restore()
  }
})

test('AC-DEX-PERF-006 eviction audit downgrades truth and repairs only the missing current revision', async () => {
  const base = fixture()
  const runtime = installDexRuntime(base)
  try {
    const completed = await downloadDexArtPack({ concurrency: 4 })
    assert.equal(completed.isComplete, true)
    const manifest = normalizedDexManifest(base.manifest)
    const missingAsset = manifest.assets[77]
    const cache = await runtime.caches.open(DEX_ART_CACHE_NAME)
    await cache.delete(revisionRequestUrl(missingAsset))

    const degraded = await auditDexArtPack(manifest)
    assert.equal(degraded.complete, 237)
    assert.equal(degraded.isComplete, false)
    assert.deepEqual(degraded.missing.map((asset) => asset.speciesId), [missingAsset.speciesId])

    runtime.resetImageRequests()
    const repaired = await downloadDexArtPack({ concurrency: 4 })
    assert.equal(repaired.isComplete, true)
    assert.deepEqual(runtime.imageRequests(), [missingAsset.url])

    await runtime.caches.delete(DEX_ART_CACHE_NAME)
    const emptied = await auditDexArtPack(manifest)
    assert.equal(emptied.complete, 0)
    assert.equal(emptied.isComplete, false)
  } finally {
    runtime.restore()
  }
})

test('D-020 Service Worker separates shell/art ownership, honors explicit revisions, and keeps warm hit free of per-hit prune', () => {
  const source = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
  assert.match(source, /SHELL_CACHE_NAME/)
  assert.match(source, /DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'/)
  assert.match(source, /if \(cached\) return cached/)
  assert.doesNotMatch(source, /if \(cached\) \{\s*await pruneDexArtCache/)
  assert.match(source, /MANA_EVO_DEX_ART_REFRESH_MANIFEST/)
  assert.match(source, /event\.data\?\.prune === true/)
  assert.match(source, /verifyResponseForRevision/)
  assert.match(source, /monsterFillInflight/)
  assert.match(source, /requestedRevision = url\.searchParams\.get\(DEX_ART_REV_PARAM\)/)
  assert.match(source, /\^sha256-\[a-f0-9\]\{64\}\$/)
})

test('D-020 pack/prefetch uses exact revision URL and collapses overlapping no-signal fills', () => {
  const source = fs.readFileSync(new URL('../src/platform/dexArtPack.js', import.meta.url), 'utf8')
  assert.match(source, /assetFillInflight/)
  assert.match(source, /const existing = assetFillInflight\.get\(key\)/)
  assert.match(source, /if \(existing\) return existing/)
  assert.match(source, /const response = await fetch\(key, \{ cache: 'no-store', signal \}\)/)
})

test('D-020 app startup registers the Service Worker without forcing Dex-art maintenance', () => {
  const source = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
  assert.match(source, /navigator\.serviceWorker\.register/)
  assert.doesNotMatch(source, /registration\.update\(/)
  assert.doesNotMatch(source, /MANA_EVO_DEX_ART_REFRESH_MANIFEST/)
})

test('D-020 Dex screen owns push/replace/back history and explicit viewport eligibility', () => {
  const source = fs.readFileSync(new URL('../src/game/screens/DexScreen.jsx', import.meta.url), 'utf8')
  assert.match(source, /IntersectionObserver/)
  assert.match(source, /rootMargin: '250% 0px 250% 0px'/)
  assert.match(source, /history\.pushState/)
  assert.match(source, /history\.replaceState/)
  assert.match(source, /history\.back\(\)/)
  assert.match(source, /hasGridHistoryEntry/)
  assert.match(source, /history\.scrollRestoration = 'manual'/)
  assert.match(source, /anchorOffset/)
})
