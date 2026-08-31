import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildProductionReachability, verifySourceContracts } from '../scripts/release-readiness.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('W-220 source release contracts keep Vercel-root PWA isolated and installable', () => {
  const report = verifySourceContracts({ root })
  assert.equal(report.canonicalUrl, 'https://mana-evo.vercel.app/')
  assert.equal(report.appBase, '/')
  assert.deepEqual(report.artCounts, { FORMAL: 238, CANDIDATE: 0, PLACEHOLDER: 0 })
})

test('production reachability keeps save-compatibility sprite v3 but proves v1 dead before removal', () => {
  const reachable = buildProductionReachability({ root })
  assert.ok(reachable.has('src/main.jsx'))
  assert.ok(reachable.has('src/game/monsterSprite.js'))
  assert.ok(reachable.has('src/game/manaevo-monsters-v3.webp'))
  assert.ok(!reachable.has('src/game/manaevo-monsters-v1.webp'))
  assert.equal(fs.existsSync(path.join(root, 'src/game/manaevo-monsters-v1.webp')), false)
})

test('Vercel deep-entry fallback returns to root and preserves query/hash', () => {
  const fallback = fs.readFileSync(path.join(root, 'public/404.html'), 'utf8')
  assert.match(fallback, /const APP_ROOT = '\/'/)
  assert.match(fallback, /pathname !== APP_ROOT/)
  assert.match(fallback, /\$\{APP_ROOT\}\$\{window\.location\.search\}\$\{window\.location\.hash\}/)
  assert.doesNotMatch(fallback, /\/mana-evo\//)
  assert.doesNotMatch(fallback, /kids-quest/)
})

test('GitHub Pages production workflow is retired and CI no longer injects the old base path', () => {
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/pages.yml')), false)
  const ci = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8')
  assert.doesNotMatch(ci, /VITE_BASE_PATH:\s*\/mana-evo\//)
})

test('D-020 service worker commits current FORMAL bytes only after SHA verification and prunes only on control-plane refresh', () => {
  const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
  const verify = sw.indexOf('const verified = await verifyResponseForRevision(networkResponse, revision)')
  const put = sw.indexOf('await artCache.put(cacheKey, verified.response.clone())', verify)
  const warmHit = sw.indexOf('if (cached) return cached')
  const messageHandler = sw.indexOf("MANA_EVO_DEX_ART_REFRESH_MANIFEST")
  const prune = sw.indexOf('await pruneDexArtCache(revisions)', messageHandler)

  assert.ok(verify >= 0, 'current FORMAL response must be SHA verified')
  assert.ok(put > verify, 'verified FORMAL bytes must be cached only after verification')
  assert.ok(warmHit >= 0 && warmHit < verify, 'warm current revision should return before network verification')
  assert.ok(messageHandler >= 0 && prune > messageHandler, 'obsolete art pruning must run from explicit manifest refresh control path')
  assert.match(sw, /return \(await previousRevisionResponse\(artCache, request\)\) \|\| Response\.error\(\)/)
})
