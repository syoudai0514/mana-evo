import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptDir, '..')
const CANONICAL_URL = 'https://mana-evo.vercel.app/'
const APP_BASE = '/'
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.css', '.json'])
const RESOLVE_EXTENSIONS = ['', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css']

function invariant(condition, message) {
  if (!condition) throw new Error(message)
}

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function pngDimensions(file) {
  const png = fs.readFileSync(file)
  invariant(png.toString('hex', 0, 8) === '89504e470d0a1a0a', `${file} is not a PNG`)
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

function localDependencySpecifiers(source, extension) {
  const found = new Set()
  if (extension === '.css') {
    for (const match of source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) found.add(match[1])
    return [...found]
  }

  const patterns = [
    /(?:^|\n)\s*import\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /(?:^|\n)\s*export\s+[^'"\n]*?\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
  ]
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.add(match[1])
  }
  return [...found]
}

function resolveLocalDependency(root, fromRelativePath, specifier) {
  if (!specifier.startsWith('.')) return null
  const clean = specifier.split(/[?#]/, 1)[0]
  const fromDir = path.dirname(path.join(root, fromRelativePath))
  const baseCandidate = path.resolve(fromDir, clean)
  const rootPrefix = `${path.resolve(root)}${path.sep}`
  invariant(baseCandidate === path.resolve(root) || baseCandidate.startsWith(rootPrefix), `import escapes repository root: ${fromRelativePath} -> ${specifier}`)

  for (const extension of RESOLVE_EXTENSIONS) {
    const candidate = `${baseCandidate}${extension}`
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return path.relative(root, candidate).split(path.sep).join('/')
  }
  for (const extension of RESOLVE_EXTENSIONS.slice(1)) {
    const candidate = path.join(baseCandidate, `index${extension}`)
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return path.relative(root, candidate).split(path.sep).join('/')
  }
  throw new Error(`missing local import: ${fromRelativePath} -> ${specifier}`)
}

export function buildProductionReachability({ root = defaultRoot, entry = 'src/main.jsx' } = {}) {
  const reachable = new Set()
  const queue = [entry]

  while (queue.length) {
    const relativePath = queue.shift()
    if (reachable.has(relativePath)) continue
    const absolutePath = path.join(root, relativePath)
    invariant(fs.existsSync(absolutePath), `production entry dependency is missing: ${relativePath}`)
    reachable.add(relativePath)

    const extension = path.extname(relativePath)
    if (!TEXT_EXTENSIONS.has(extension)) continue
    const source = fs.readFileSync(absolutePath, 'utf8')
    for (const specifier of localDependencySpecifiers(source, extension)) {
      const resolved = resolveLocalDependency(root, relativePath, specifier)
      if (resolved && !reachable.has(resolved)) queue.push(resolved)
    }
  }

  return reachable
}

function verifyManifestAndIcons(root, publicPrefix = 'public') {
  const manifest = JSON.parse(read(root, `${publicPrefix}/manifest.webmanifest`))
  for (const key of ['id', 'start_url', 'scope']) invariant(manifest[key] === CANONICAL_URL, `${key} must be ${CANONICAL_URL}`)
  invariant(manifest.display === 'standalone', 'manifest display must remain standalone')
  invariant(manifest.orientation === 'portrait-primary', 'manifest orientation must remain portrait-primary')

  const iconExpectations = [
    ['icons/apple-touch-icon.png', 180],
    ['icons/icon-192.png', 192],
    ['icons/icon-512.png', 512]
  ]
  for (const [relativePath, size] of iconExpectations) {
    const file = path.join(root, publicPrefix, relativePath)
    invariant(fs.existsSync(file), `missing install icon: ${publicPrefix}/${relativePath}`)
    const [width, height] = pngDimensions(file)
    invariant(width === size && height === size, `${publicPrefix}/${relativePath} must be ${size}x${size}`)
  }
  return manifest
}

function countArtStates(canonicalArt) {
  const counts = { FORMAL: 0, CANDIDATE: 0, PLACEHOLDER: 0 }
  for (const entry of Object.values(canonicalArt.assets || {})) {
    const state = entry?.state
    invariant(Object.hasOwn(counts, state), `unexpected monster art state: ${state}`)
    counts[state] += 1
  }
  invariant(Object.values(counts).reduce((sum, value) => sum + value, 0) === 238, 'monster asset manifest must cover exactly 238 active species')
  for (const [state, expected] of Object.entries(canonicalArt.counts || {})) {
    invariant(counts[state] === expected, `monster asset count drift for ${state}: expected ${expected}, got ${counts[state]}`)
  }
  return counts
}

function verify404Source(source) {
  invariant(source.includes("const APP_ROOT = '/'"), '404 fallback must return to the Vercel app root')
  invariant(source.includes('window.location.pathname !== APP_ROOT'), '404 fallback must guard against a root redirect loop')
  invariant(source.includes('window.location.replace'), '404 fallback must recover deep entry to the app root')
  invariant(!source.includes('/mana-evo/'), 'Vercel canonical fallback must not retain the GitHub Pages base path')
  invariant(!source.includes('/kids-quest/'), '404 fallback must not target Kids Quest')
}

function verifyServiceWorkerSource(sw) {
  invariant(sw.includes("const LEGACY_CACHE_PREFIX = 'manaevo-pwa-'"), 'service worker must identify the legacy ManaEvo cache namespace for migration cleanup')
  invariant(sw.includes("const SHELL_CACHE_PREFIX = 'manaevo-shell-'"), 'service worker shell cache prefix must stay ManaEvo-specific')
  invariant(sw.includes("const DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'"), 'service worker must use the dedicated D-020 Dex art cache')
  invariant(sw.includes('url.pathname.startsWith(BASE_PATH)'), 'service worker fetch handler must stay inside its own scope')
  invariant(sw.includes('key.startsWith(SHELL_CACHE_PREFIX)'), 'service worker cleanup must only rotate ManaEvo shell caches')
  invariant(sw.includes('key.startsWith(LEGACY_CACHE_PREFIX)'), 'service worker must clean legacy ManaEvo PWA caches during migration')
  invariant(sw.includes('DEX_ART_CACHE_NAME is deliberately not deleted'), 'shell updates must preserve the user-requested Dex art cache')
  invariant(sw.includes('verifyResponseForRevision'), 'current FORMAL writes must pass SHA verification')
  invariant(sw.includes('await artCache.put(cacheKey, verified.response.clone())'), 'verified current FORMAL bytes must commit to the dedicated art cache')
  invariant(sw.includes('pruneDexArtCache'), 'obsolete art pruning must exist as an explicit control-plane operation')
  invariant(sw.includes("MANA_EVO_DEX_ART_REFRESH_MANIFEST"), 'art prune/manifest refresh must be triggered explicitly rather than on every image hit')
  invariant(!sw.includes('kids-quest'), 'service worker must not reference Kids Quest')

  const warmHit = sw.indexOf('const cached = await artCache.match(cacheKey)')
  const warmReturn = sw.indexOf('if (cached) return cached', warmHit)
  invariant(warmHit >= 0 && warmReturn > warmHit, 'FORMAL warm hit must return directly from revisioned art cache')
  const pruneAfterWarmHit = sw.indexOf('pruneDexArtCache', warmHit)
  const networkAfterWarmHit = sw.indexOf('fetch(request', warmHit)
  invariant(pruneAfterWarmHit < 0 || networkAfterWarmHit < pruneAfterWarmHit, 'warm FORMAL cache hit must not prune the entire art cache')

  const appShell = sw.match(/const APP_SHELL = \[([\s\S]*?)\]\n/)?.[1] || ''
  invariant(appShell.length > 0, 'service worker APP_SHELL could not be inspected')
  invariant(!/(piper|onnx|\.wasm|\.onnx|voice|model)/i.test(appShell), 'heavy voice/model assets must not be forced into APP_SHELL')
}

export function verifySourceContracts({ root = defaultRoot } = {}) {
  const index = read(root, 'index.html')
  const fallback404 = read(root, 'public/404.html')
  const sw = read(root, 'public/sw.js')
  const main = read(root, 'src/main.jsx')
  const canonicalArt = JSON.parse(read(root, 'design/current/monster-asset-manifest.json'))
  const artCounts = countArtStates(canonicalArt)
  verifyManifestAndIcons(root)
  verify404Source(fallback404)
  verifyServiceWorkerSource(sw)

  invariant(index.includes('href="%BASE_URL%manifest.webmanifest"'), 'index manifest reference must use Vite base URL')
  invariant(index.includes('href="%BASE_URL%icons/apple-touch-icon.png"'), 'index touch icon must use Vite base URL')
  invariant(index.includes(`href="${CANONICAL_URL}"`), 'index canonical URL must point to the Vercel production origin')
  invariant(index.includes(`content="${CANONICAL_URL}"`), 'index OG URL must point to the Vercel production origin')
  invariant(!index.includes('syoudai0514.github.io/mana-evo'), 'source metadata must not retain the old GitHub Pages canonical URL')
  invariant(!main.includes("CANONICAL_PATH = '/mana-evo/'"), 'runtime must not retain the GitHub Pages path redirect')
  invariant(main.includes('updateViaCache: \'none\''), 'service worker registration must bypass HTTP cache for updates')

  const reachable = buildProductionReachability({ root })
  invariant(reachable.has('src/game/monsterSprite.js'), 'legacy saved-ID compatibility sprite resolver must remain reachable')
  invariant(reachable.has('src/game/manaevo-monsters-v3.webp'), 'legacy saved-ID compatibility sprite asset v3 must remain reachable')
  invariant(!reachable.has('src/game/manaevo-monsters-v1.webp'), 'superseded sprite v1 must not be reachable from the production entrypoint')
  invariant(!fs.existsSync(path.join(root, 'src/game/manaevo-monsters-v1.webp')), 'superseded unreachable sprite v1 should be removed')

  return {
    canonicalUrl: CANONICAL_URL,
    appBase: APP_BASE,
    artCounts,
    productionReachableFiles: reachable.size,
    deadCleanup: ['src/game/manaevo-monsters-v1.webp'],
    retainedCompatibilityAsset: 'src/game/manaevo-monsters-v3.webp'
  }
}

export function verifyBuildArtifact({ root = defaultRoot } = {}) {
  const required = [
    'dist/index.html',
    'dist/404.html',
    'dist/manifest.webmanifest',
    'dist/sw.js',
    'dist/monster-asset-revisions.json',
    'dist/icons/apple-touch-icon.png',
    'dist/icons/icon-192.png',
    'dist/icons/icon-512.png'
  ]
  for (const relativePath of required) invariant(fs.existsSync(path.join(root, relativePath)), `release artifact is missing ${relativePath}`)

  const index = read(root, 'dist/index.html')
  const fallback404 = read(root, 'dist/404.html')
  const sw = read(root, 'dist/sw.js')
  const canonicalArt = JSON.parse(read(root, 'design/current/monster-asset-manifest.json'))
  const revisions = JSON.parse(read(root, 'dist/monster-asset-revisions.json'))
  const artCounts = countArtStates(canonicalArt)
  verifyManifestAndIcons(root, 'dist')
  verify404Source(fallback404)
  verifyServiceWorkerSource(sw)

  invariant(index.includes('/manifest.webmanifest'), 'built index must reference manifest from the Vercel root')
  invariant(index.includes('/icons/icon-192.png'), 'built index must reference icon from the Vercel root')
  invariant(index.includes('/icons/apple-touch-icon.png'), 'built index must reference touch icon from the Vercel root')
  invariant(index.includes(CANONICAL_URL), 'built index must retain canonical Vercel URL')
  invariant(!index.includes('/mana-evo/'), 'built index must not retain the GitHub Pages production base')

  const localRefs = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((value) => !/^(https?:|data:|#)/.test(value))
  for (const ref of localRefs) invariant(ref.startsWith(APP_BASE), `built index local asset escaped app root: ${ref}`)

  invariant(revisions.schemaVersion === 2, 'generated monster revision manifest must use D-020 schema v2')
  invariant(revisions.formalCount === artCounts.FORMAL, `generated FORMAL count must be ${artCounts.FORMAL}`)
  invariant(Number(revisions.totalBytes) > 0, 'generated monster revision manifest must include totalBytes')
  invariant(/^sha256-[a-f0-9]{64}$/.test(revisions.manifestRevision || ''), 'generated monster revision manifest must include stable SHA identity')
  invariant(Object.keys(revisions.assets || {}).length === 238, 'generated monster revision manifest must cover m001-m238')
  invariant(Object.keys(revisions.formalByUrl || {}).length === artCounts.FORMAL, `generated FORMAL revision count must be ${artCounts.FORMAL}`)
  for (const [speciesId, canonical] of Object.entries(canonicalArt.assets || {})) {
    invariant(revisions.assets?.[speciesId]?.state === canonical.state, `generated art state drift for ${speciesId}`)
    if (canonical.state === 'FORMAL') invariant(Number(revisions.assets?.[speciesId]?.byteLength) > 0, `${speciesId} must include byteLength`)
    if (canonical.state !== 'FORMAL') invariant(!revisions.assets?.[speciesId]?.revision, `${speciesId} must not receive a FORMAL revision while ${canonical.state}`)
  }

  return {
    artCounts,
    localIndexReferences: localRefs.length,
    formalRevisionEntries: Object.keys(revisions.formalByUrl || {}).length
  }
}

export function verifyReleaseReadiness(options = {}) {
  const source = verifySourceContracts(options)
  const build = verifyBuildArtifact(options)
  return { source, build }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  try {
    const report = verifyReleaseReadiness()
    console.log('W-220 release readiness PASS')
    console.log(`Vercel production: ${report.source.canonicalUrl}`)
    console.log(`Production import graph: ${report.source.productionReachableFiles} reachable files`)
    console.log(`Monster art: FORMAL=${report.build.artCounts.FORMAL}, CANDIDATE=${report.build.artCounts.CANDIDATE}, PLACEHOLDER=${report.build.artCounts.PLACEHOLDER}`)
    console.log(`FORMAL revision entries: ${report.build.formalRevisionEntries}`)
    console.log(`Dead cleanup: ${report.source.deadCleanup.join(', ')}`)
  } catch (error) {
    console.error(`W-220 release readiness FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
