#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateRevisionManifest } from '../generate-pwa-asset-revisions.mjs'

export const BUNDLE_SCHEMA = 'ManaEvo.formal-art-replacement.v1'
export const MAX_SCOPE = 3
export const MAX_WEBP_BYTES = 1_000_000

const here = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(here, '../..')

export function sha256(value) {
  const buffer = Buffer.isBuffer(value) ? value : fs.readFileSync(value)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function assertSafeRelativeFile(value, speciesId) {
  if (value !== `${speciesId}.webp`) {
    throw new Error(`${speciesId}: bundle file must be exactly ${speciesId}.webp`)
  }
}

export function validateBundleManifest(bundle) {
  if (!bundle || typeof bundle !== 'object') throw new Error('bundle manifest must be an object')
  if (bundle.schema !== BUNDLE_SCHEMA) throw new Error(`bundle schema must be ${BUNDLE_SCHEMA}`)
  if (!Array.isArray(bundle.scope) || bundle.scope.length < 1 || bundle.scope.length > MAX_SCOPE) {
    throw new Error(`bundle scope must contain 1-${MAX_SCOPE} species`)
  }
  if (new Set(bundle.scope).size !== bundle.scope.length) throw new Error('bundle scope contains duplicate species')
  for (const id of bundle.scope) if (!/^m\d{3,}$/.test(id)) throw new Error(`invalid speciesId in bundle scope: ${id}`)

  const approval = bundle.approval
  if (!approval || approval.approved !== true) throw new Error('bundle approval.approved=true is required')
  for (const field of ['approvedBy', 'approvedAt', 'source']) {
    if (typeof approval[field] !== 'string' || !approval[field].trim()) throw new Error(`bundle approval.${field} is required`)
  }
  if (Number.isNaN(Date.parse(approval.approvedAt))) throw new Error('bundle approval.approvedAt must be ISO-compatible')

  if (!bundle.species || typeof bundle.species !== 'object') throw new Error('bundle species map is required')
  const speciesKeys = Object.keys(bundle.species).sort()
  const scopeKeys = [...bundle.scope].sort()
  if (JSON.stringify(speciesKeys) !== JSON.stringify(scopeKeys)) throw new Error('bundle species keys must exactly match scope')

  if (bundle.scope.length > 1 && bundle.familyVisualQa !== 'PASS') {
    throw new Error('multi-species bundle requires familyVisualQa=PASS')
  }

  for (const id of bundle.scope) {
    const row = bundle.species[id]
    assertSafeRelativeFile(row?.file, id)
    if (!/^[0-9a-f]{64}$/.test(row?.sha256 ?? '')) throw new Error(`${id}: sha256 must be 64 lowercase hex characters`)
    if (!Number.isInteger(row?.bytes) || row.bytes <= 0) throw new Error(`${id}: positive integer bytes is required`)
    if (row?.visualQa !== 'PASS') throw new Error(`${id}: visualQa must be PASS`)
  }
  return bundle
}

function assertWebPBinary(filePath) {
  const stat = fs.statSync(filePath)
  if (stat.size >= MAX_WEBP_BYTES) throw new Error(`${path.basename(filePath)} must be under 1 MB`)
  const head = fs.readFileSync(filePath).subarray(0, 12)
  if (head.length < 12 || head.toString('ascii', 0, 4) !== 'RIFF' || head.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${path.basename(filePath)} is not RIFF/WEBP`)
  }
  return stat.size
}

export async function inspectWebPWithWebKit(filePath) {
  let browser
  try {
    const { webkit } = await import('@playwright/test')
    browser = await webkit.launch({ headless: true })
  } catch (error) {
    throw new Error(`WebKit image QA could not start. Run "npm install && npx playwright install webkit" once in this environment. ${error.message}`)
  }
  try {
    const page = await browser.newPage()
    const src = `data:image/webp;base64,${fs.readFileSync(filePath).toString('base64')}`
    return await page.evaluate(async (imageSrc) => {
      const img = new Image()
      img.src = imageSrc
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const width = canvas.width
      const height = canvas.height
      let transparentPixels = 0
      let visiblePixels = 0
      let minX = width, minY = height, maxX = -1, maxY = -1
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const alpha = data[(y * width + x) * 4 + 3]
          if (alpha < 255) transparentPixels += 1
          if (alpha > 8) {
            visiblePixels += 1
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      const bbox = visiblePixels ? { minX, minY, maxX, maxY } : null
      const bboxTouchesEdges = bbox
        ? Number(bbox.minX === 0) + Number(bbox.minY === 0) + Number(bbox.maxX === width - 1) + Number(bbox.maxY === height - 1)
        : 0
      return {
        width,
        height,
        actualAlpha: transparentPixels > 0,
        transparentPixelRatio: transparentPixels / (width * height),
        visiblePixels,
        bbox,
        bboxTouchesEdges,
      }
    }, src)
  } finally {
    await browser.close()
  }
}

function loadSpeciesMetadata(root) {
  const dir = path.join(root, 'design/current/monsters')
  const files = fs.readdirSync(dir).filter((name) => /^descriptions-\d+-\d+\.json$/.test(name)).sort()
  if (!files.length) throw new Error('CURRENT monster description shards were not found')
  const rows = files.flatMap((name) => readJson(path.join(dir, name)))
  return new Map(rows.map((row) => [row.speciesId, row]))
}

function assetFilePath(root, assetUrl) {
  if (typeof assetUrl !== 'string' || !assetUrl.startsWith('/monsters/') || assetUrl.includes('..')) {
    throw new Error(`invalid formalAsset path: ${assetUrl}`)
  }
  return path.join(root, 'public', assetUrl.replace(/^\//, ''))
}

export function verifyFormalRepository(root, manifest) {
  const assets = manifest.assets ?? {}
  if (Object.keys(assets).length !== manifest?.canonicalScope?.speciesCount) {
    throw new Error('manifest asset count does not match canonicalScope.speciesCount')
  }
  const counts = { FORMAL: 0, CANDIDATE: 0, PLACEHOLDER: 0 }
  const hashes = {}
  for (const [id, row] of Object.entries(assets)) {
    if (counts[row.state] == null) throw new Error(`${id}: unknown manifest state ${row.state}`)
    counts[row.state] += 1
    if (row.state !== 'FORMAL') continue
    const filePath = assetFilePath(root, row.formalAsset)
    if (!fs.existsSync(filePath)) throw new Error(`${id}: FORMAL file is missing`)
    const actual = sha256(filePath)
    if (actual !== row.formalSha256) throw new Error(`${id}: FORMAL binary SHA does not match manifest`)
    hashes[id] = actual
  }
  for (const key of Object.keys(counts)) {
    if ((manifest.counts?.[key] ?? 0) !== counts[key]) throw new Error(`manifest counts.${key} is stale`)
  }
  return { counts, hashes }
}

function verifyBundleFiles(bundleDir, bundle) {
  const actualWebPs = fs.readdirSync(bundleDir).filter((name) => name.toLowerCase().endsWith('.webp')).sort()
  const expectedWebPs = bundle.scope.map((id) => `${id}.webp`).sort()
  if (JSON.stringify(actualWebPs) !== JSON.stringify(expectedWebPs)) {
    throw new Error(`bundle WebP files must exactly match scope; expected=${expectedWebPs.join(',')} actual=${actualWebPs.join(',')}`)
  }
}

function approvalFor(bundle, speciesId) {
  return {
    speciesId,
    approved: true,
    approvalType: 'CURRENT_FORMAL',
    approvedBy: bundle.approval.approvedBy,
    approvedAt: bundle.approval.approvedAt,
    source: bundle.approval.source,
  }
}

function readProvenance(filePath, speciesId) {
  if (!fs.existsSync(filePath)) throw new Error(`${speciesId}: provenance file is required before FORMAL replacement`)
  const value = readJson(filePath)
  if (value.speciesId !== speciesId || !Array.isArray(value.events)) throw new Error(`${speciesId}: malformed provenance`)
  return value
}

function revisionFor(value, speciesId) {
  return value?.assets?.[speciesId]?.revision ?? null
}

function verifyRevisionBaseline(revisions, hashes) {
  if (!revisions) throw new Error('public/monster-asset-revisions.json is required before FORMAL replacement')
  for (const [id, hash] of Object.entries(hashes)) {
    if (revisionFor(revisions, id) !== `sha256-${hash}`) throw new Error(`${id}: current revision manifest is stale before replacement`)
  }
}

function snapshotFile(filePath) {
  return fs.existsSync(filePath) ? { exists: true, bytes: fs.readFileSync(filePath) } : { exists: false, bytes: null }
}

function restoreSnapshot(filePath, snapshot) {
  if (snapshot.exists) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, snapshot.bytes)
  } else if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true })
  }
}

export async function planFormalReplacement({ root = defaultRoot, bundleDir, inspectImage = inspectWebPWithWebKit }) {
  if (!bundleDir) throw new Error('--bundle-dir is required')
  const absoluteBundleDir = path.resolve(bundleDir)
  const bundlePath = path.join(absoluteBundleDir, 'manifest.json')
  if (!fs.existsSync(bundlePath)) throw new Error('bundle manifest.json is required')
  const bundle = validateBundleManifest(readJson(bundlePath))
  verifyBundleFiles(absoluteBundleDir, bundle)

  const manifestPath = path.join(root, 'design/current/monster-asset-manifest.json')
  const manifest = readJson(manifestPath)
  const beforeRepository = verifyFormalRepository(root, manifest)
  const revisionPath = path.join(root, 'public/monster-asset-revisions.json')
  const revisionsBefore = fs.existsSync(revisionPath) ? readJson(revisionPath) : null
  verifyRevisionBaseline(revisionsBefore, beforeRepository.hashes)
  const metadata = loadSpeciesMetadata(root)

  const familyNos = new Set()
  const entries = []
  for (const id of bundle.scope) {
    const current = manifest.assets?.[id]
    if (!current) throw new Error(`${id}: not present in CURRENT manifest; roster expansion uses a different lane`)
    if (current.state !== 'FORMAL') throw new Error(`${id}: FAST LANE requires an existing FORMAL species`)
    const meta = metadata.get(id)
    if (!meta) throw new Error(`${id}: CURRENT species metadata not found`)
    familyNos.add(String(meta.familyNo))

    const sourcePath = path.join(absoluteBundleDir, `${id}.webp`)
    const actualBytes = assertWebPBinary(sourcePath)
    const actualSha = sha256(sourcePath)
    const declared = bundle.species[id]
    if (actualBytes !== declared.bytes) throw new Error(`${id}: bundle bytes mismatch`)
    if (actualSha !== declared.sha256) throw new Error(`${id}: bundle sha256 mismatch`)

    const image = await inspectImage(sourcePath, id)
    if (image.width !== 512 || image.height !== 512) throw new Error(`${id}: actual decoded size must be 512x512; got ${image.width}x${image.height}`)
    if (image.actualAlpha !== true) throw new Error(`${id}: actual decoded alpha/transparency is required`)
    if (!image.visiblePixels) throw new Error(`${id}: image has no visible creature pixels`)
    if (image.bboxTouchesEdges > 0) throw new Error(`${id}: visible silhouette touches ${image.bboxTouchesEdges} canvas edge(s)`)

    const currentPath = assetFilePath(root, current.formalAsset)
    const currentSha = sha256(currentPath)
    const provenancePath = path.join(root, 'design/rebuild/asset-production/candidate-provenance', `${id}.json`)
    readProvenance(provenancePath, id)
    entries.push({
      speciesId: id,
      familyNo: meta.familyNo,
      sourcePath,
      sourceBytes: actualBytes,
      newSha256: actualSha,
      currentPath,
      currentSha256: currentSha,
      provenancePath,
      status: currentSha === actualSha ? 'ALREADY_MATCHES' : 'CHANGE',
      image,
      approvalEvidence: approvalFor(bundle, id),
    })
  }

  if (entries.length > 1 && familyNos.size !== 1) {
    throw new Error('multi-species FAST LANE bundle must contain one evolution family only; split unrelated species into separate bundles')
  }

  return {
    root: path.resolve(root),
    bundleDir: absoluteBundleDir,
    bundle,
    manifestPath,
    manifestBefore: manifest,
    beforeRepository,
    revisionPath,
    revisionsBefore,
    entries,
    changedSpecies: entries.filter((row) => row.status === 'CHANGE').map((row) => row.speciesId),
    idempotentSpecies: entries.filter((row) => row.status === 'ALREADY_MATCHES').map((row) => row.speciesId),
  }
}

export function executeFormalReplacement(plan, {
  timestamp = new Date().toISOString(),
  regenerateRevisions = generateRevisionManifest,
} = {}) {
  const root = plan.root
  const manifest = structuredClone(plan.manifestBefore)
  const touched = new Map()
  const remember = (filePath) => {
    if (!touched.has(filePath)) touched.set(filePath, snapshotFile(filePath))
  }

  remember(plan.manifestPath)
  remember(plan.revisionPath)
  for (const row of plan.entries) {
    if (row.status !== 'CHANGE') continue
    const historyPath = path.join(root, 'design/rebuild/asset-production/candidate-history', row.speciesId, `${row.currentSha256}.webp`)
    row.historyPath = historyPath
    remember(row.currentPath)
    remember(row.provenancePath)
    remember(historyPath)
  }

  try {
    for (const row of plan.entries) {
      if (row.status !== 'CHANGE') continue
      fs.mkdirSync(path.dirname(row.historyPath), { recursive: true })
      if (!fs.existsSync(row.historyPath)) fs.copyFileSync(row.currentPath, row.historyPath)

      fs.copyFileSync(row.sourcePath, row.currentPath)

      const provenance = readProvenance(row.provenancePath, row.speciesId)
      provenance.events.push({
        timestamp,
        sourceLabel: plan.bundle.approval.source,
        previous: {
          repositoryPath: path.relative(root, row.currentPath).replaceAll('\\', '/'),
          sha256: row.currentSha256,
          archivePath: path.relative(root, row.historyPath).replaceAll('\\', '/'),
        },
        candidate: {
          repositoryPath: `public/monsters/${row.speciesId}.webp`,
          sha256: row.newSha256,
          bytes: row.sourceBytes,
        },
        manifestStateBefore: 'FORMAL',
        formalPromotion: false,
        formalReplacement: true,
        approvalEvidence: row.approvalEvidence,
      })
      writeJson(row.provenancePath, provenance)

      manifest.assets[row.speciesId] = {
        ...manifest.assets[row.speciesId],
        state: 'FORMAL',
        formalAsset: `/monsters/${row.speciesId}.webp`,
        formalSha256: row.newSha256,
        approvalEvidence: row.approvalEvidence,
      }
    }

    const counts = { FORMAL: 0, CANDIDATE: 0, PLACEHOLDER: 0 }
    for (const row of Object.values(manifest.assets)) {
      if (counts[row.state] == null) throw new Error(`unknown manifest state after replacement: ${row.state}`)
      counts[row.state] += 1
    }
    manifest.counts = counts
    writeJson(plan.manifestPath, manifest)
    const revisionsAfter = regenerateRevisions({ root })
    const afterRepository = verifyFormalRepository(root, manifest)

    const changedByRepository = Object.keys(afterRepository.hashes).filter((id) => plan.beforeRepository.hashes[id] !== afterRepository.hashes[id]).sort()
    const expectedChanged = [...plan.changedSpecies].sort()
    if (JSON.stringify(changedByRepository) !== JSON.stringify(expectedChanged)) {
      throw new Error(`unexpected FORMAL binary changes; expected=${expectedChanged.join(',')} actual=${changedByRepository.join(',')}`)
    }

    for (const [id, hash] of Object.entries(afterRepository.hashes)) {
      if (revisionFor(revisionsAfter, id) !== `sha256-${hash}`) throw new Error(`${id}: generated revision mismatch`)
    }
    for (const row of plan.entries) {
      if (row.status === 'ALREADY_MATCHES' && revisionFor(plan.revisionsBefore, row.speciesId) !== revisionFor(revisionsAfter, row.speciesId)) {
        throw new Error(`${row.speciesId}: idempotent entry unexpectedly changed revision`)
      }
    }

    return {
      mode: 'EXECUTED',
      scope: plan.bundle.scope,
      changedSpecies: plan.changedSpecies,
      idempotentSpecies: plan.idempotentSpecies,
      counts: afterRepository.counts,
    }
  } catch (error) {
    for (const [filePath, snapshot] of [...touched.entries()].reverse()) restoreSnapshot(filePath, snapshot)
    throw new Error(`FORMAL replacement rolled back: ${error.message}`)
  }
}

function parseArgs(argv) {
  const args = { root: defaultRoot, execute: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') args.root = path.resolve(argv[++i])
    else if (arg === '--bundle-dir') args.bundleDir = path.resolve(argv[++i])
    else if (arg === '--execute') args.execute = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!args.bundleDir) throw new Error('Usage: formal-replacement.mjs --bundle-dir /path/to/unzipped-bundle [--execute]')
  return args
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  const plan = await planFormalReplacement(args)
  if (!args.execute) {
    return {
      mode: 'DRY_RUN',
      scope: plan.bundle.scope,
      changedSpecies: plan.changedSpecies,
      idempotentSpecies: plan.idempotentSpecies,
    }
  }
  return executeFormalReplacement(plan)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  runCli().then((result) => {
    console.log(JSON.stringify(result, null, 2))
    if (result.mode === 'DRY_RUN') console.log('No repository files changed. Re-run with --execute after reviewing this exact bundle.')
  }).catch((error) => {
    console.error(`FAIL ${error.message}`)
    process.exitCode = 1
  })
}
