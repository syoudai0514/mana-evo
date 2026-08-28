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
  assert.deepEqual(report.artCounts, { FORMAL: 0, CANDIDATE: 20, PLACEHOLDER: 218 })
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

test('service worker prunes old monster bytes only after current FORMAL bytes are cached', () => {
  const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
  const put = sw.indexOf('await cache.put(cacheKey, response.clone())')
  const prune = sw.indexOf('await pruneMonsterCache(cache, request, cacheKey)', put)
  assert.ok(put >= 0, 'current formal response must be cached')
  assert.ok(prune > put, 'old candidate/revision entries must only be pruned after current formal bytes are cached')
  assert.match(sw, /return \(await previousRevisionResponse\(cache, request\)\)/)
})
