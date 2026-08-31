import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildRevisionManifest } from '../scripts/generate-pwa-asset-revisions.mjs'
import { normalizedDexManifest, verifyAssetResponse } from '../src/platform/dexArtPack.js'

function canonical238() {
  return {
    schemaVersion: 1,
    assets: Object.fromEntries(Array.from({ length: 238 }, (_, index) => {
      const speciesId = `m${String(index + 1).padStart(3, '0')}`
      return [speciesId, { state: 'FORMAL', formalAsset: `/monsters/${speciesId}.webp` }]
    }))
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

test('D-020 Service Worker separates shell/art ownership and keeps warm hit free of per-hit prune', () => {
  const source = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
  assert.match(source, /SHELL_CACHE_NAME/)
  assert.match(source, /DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'/)
  assert.match(source, /if \(cached\) return cached/)
  assert.doesNotMatch(source, /if \(cached\) \{\s*await pruneDexArtCache/)
  assert.match(source, /MANA_EVO_DEX_ART_REFRESH_MANIFEST/)
  assert.match(source, /verifyResponseForRevision/)
  assert.match(source, /monsterFillInflight/)
})

test('D-020 detail prefetch collapses overlapping no-signal fills for one revision', () => {
  const source = fs.readFileSync(new URL('../src/platform/dexArtPack.js', import.meta.url), 'utf8')
  assert.match(source, /assetFillInflight/)
  assert.match(source, /const existing = assetFillInflight\.get\(key\)/)
  assert.match(source, /if \(existing\) return existing/)
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
