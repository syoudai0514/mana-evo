import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Keep the exact PWA icon files, canonical launch URL and dimensions under CI.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'))
const revisions = JSON.parse(fs.readFileSync(path.join(root, 'public/monster-asset-revisions.json'), 'utf8'))
const canonicalArt = JSON.parse(fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json'), 'utf8'))
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
const main = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8')
const canonicalUrl = 'https://mana-evo.vercel.app/'

function publicAsset(relativePath) {
  return path.join(root, 'public', relativePath)
}

function pngDimensions(file) {
  const png = fs.readFileSync(file)
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${file} must be PNG`)
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

test('iOS touch icon references the dedicated attached-artwork PNG', () => {
  const match = index.match(/rel="apple-touch-icon"[^>]*sizes="180x180"[^>]*href="%BASE_URL%([^\"]+)"/)
  assert.ok(match, '180x180 apple-touch-icon link is required')
  assert.equal(match[1], 'icons/apple-touch-icon.png')
  const file = publicAsset(match[1])
  assert.ok(fs.existsSync(file), `missing apple touch icon: ${match[1]}`)
  assert.deepEqual(pngDimensions(file), [180, 180])
})

test('PWA icons have the required PNG dimensions', () => {
  assert.deepEqual(pngDimensions(publicAsset('icons/icon-192.png')), [192, 192])
  assert.deepEqual(pngDimensions(publicAsset('icons/icon-512.png')), [512, 512])
})

test('manifest and metadata are pinned to the Vercel production canonical URL', () => {
  for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], canonicalUrl)
  assert.match(index, /rel="canonical" href="https:\/\/mana-evo\.vercel\.app\/"/)
  assert.match(index, /property="og:url" content="https:\/\/mana-evo\.vercel\.app\/"/)
  assert.doesNotMatch(index, /syoudai0514\.github\.io\/mana-evo/)
  assert.doesNotMatch(main, /CANONICAL_PATH/)
  assert.doesNotMatch(main, /location\.replace/)
})

test('service worker precache only references existing public assets', () => {
  for (const match of sw.matchAll(/new URL\('([^']+)'\s*,\s*BASE_URL\)/g)) {
    const relativePath = match[1]
    assert.ok(fs.existsSync(publicAsset(relativePath)), `service worker precache asset is missing: ${relativePath}`)
  }
  assert.match(sw, /const SHELL_CACHE_NAME = `\$\{SHELL_CACHE_PREFIX\}v11`/)
  assert.match(sw, /const DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'/)
  assert.match(sw, /monster-asset-revisions\.json/)
  assert.match(sw, /icons\/apple-touch-icon\.png/)
})

test('service worker keeps shell/art ownership ManaEvo-only and update-safe', () => {
  assert.match(sw, /const LEGACY_CACHE_PREFIX = 'manaevo-pwa-'/)
  assert.match(sw, /const SHELL_CACHE_PREFIX = 'manaevo-shell-'/)
  assert.match(sw, /const DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'/)
  assert.match(sw, /url\.pathname\.startsWith\(BASE_PATH\)/)
  assert.match(sw, /key\.startsWith\(SHELL_CACHE_PREFIX\)/)
  assert.match(sw, /key\.startsWith\(LEGACY_CACHE_PREFIX\)/)
  assert.match(sw, /DEX_ART_CACHE_NAME is deliberately not deleted/)
  assert.doesNotMatch(sw, /kids-quest/)
})

test('monster cache uses SHA revision identity for FORMAL art and keeps non-FORMAL out of authoritative art cache', () => {
  assert.match(sw, /loadMonsterRevisions/)
  assert.match(sw, /revisions\?\.formalByUrl\?\.\[relativePath\]/)
  assert.match(sw, /__manaevo_rev/)
  assert.match(sw, /verifyResponseForRevision/)
  assert.match(sw, /await artCache\.put\(cacheKey, verified\.response\.clone\(\)\)/)
  assert.match(sw, /previousRevisionResponse/)
  assert.match(sw, /Non-FORMAL\/candidate assets remain network-first/)
  assert.doesNotMatch(sw, /relative\.startsWith\('monsters\/'\) \|\| relative\.startsWith\('icons\/'\)/)
})

test('generated monster revision manifest mirrors canonical states and revisions every FORMAL local asset', () => {
  assert.equal(revisions.schemaVersion, 2)
  assert.equal(revisions.sourceSchemaVersion, canonicalArt.schemaVersion)
  assert.equal(revisions.formalCount, 238)
  assert.ok(revisions.totalBytes > 0)
  assert.match(revisions.manifestRevision, /^sha256-[a-f0-9]{64}$/)
  assert.deepEqual(Object.keys(revisions.assets).sort(), Object.keys(canonicalArt.assets).sort())

  for (const [speciesId, canonical] of Object.entries(canonicalArt.assets)) {
    const generated = revisions.assets[speciesId]
    assert.equal(generated.state, canonical.state, `${speciesId} state drift`)
    if (canonical.state === 'FORMAL') {
      assert.equal(generated.url, canonical.formalAsset)
      assert.match(generated.revision, /^sha256-[a-f0-9]{64}$/)
      assert.ok(generated.byteLength > 0, `${speciesId} byteLength missing`)
      assert.equal(revisions.formalByUrl[generated.url], generated.revision)
      assert.ok(fs.existsSync(publicAsset(generated.url.replace(/^\//, ''))), `${speciesId} formal asset missing`)
    }
  }
})

test('service worker warms only entry assets and avoids heavyweight voice precache', () => {
  assert.match(sw, /async function warmEntryAssets/)
  assert.match(sw, /url\.pathname\.startsWith\(`\$\{BASE_PATH\}assets\/`\)/)
  assert.match(sw, /relative\.startsWith\('assets\/'\)/)
  assert.doesNotMatch(sw, /APP_SHELL[\s\S]*piper_plus_wasm_bg/)
})
