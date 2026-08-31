import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  BUNDLE_SCHEMA,
  executeFormalReplacement,
  planFormalReplacement,
  sha256,
  validateBundleManifest,
} from '../scripts/monster-art/formal-replacement.mjs'

function fakeWebP(fill = 0x41, size = 96) {
  const buffer = Buffer.alloc(size, fill)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WEBP', 8, 'ascii')
  return buffer
}

const passImage = async () => ({
  width: 512,
  height: 512,
  actualAlpha: true,
  transparentPixelRatio: 0.4,
  visiblePixels: 1000,
  bbox: { minX: 20, minY: 20, maxX: 490, maxY: 490 },
  bboxTouchesEdges: 0,
})

function makeRoot(species = [
  { id: 'm001', familyNo: 1 },
  { id: 'm002', familyNo: 1 },
  { id: 'm003', familyNo: 1 },
]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-formal-replace-'))
  fs.mkdirSync(path.join(root, 'public/monsters'), { recursive: true })
  fs.mkdirSync(path.join(root, 'design/current/monsters'), { recursive: true })
  fs.mkdirSync(path.join(root, 'design/rebuild/asset-production/candidate-provenance'), { recursive: true })
  const assets = {}
  species.forEach((row, index) => {
    const bytes = fakeWebP(0x30 + index)
    const filePath = path.join(root, 'public/monsters', `${row.id}.webp`)
    fs.writeFileSync(filePath, bytes)
    assets[row.id] = {
      state: 'FORMAL',
      formalAsset: `/monsters/${row.id}.webp`,
      formalSha256: sha256(bytes),
      approvalEvidence: {
        speciesId: row.id,
        approved: true,
        approvalType: 'CURRENT_FORMAL',
        approvedBy: 'baseline',
        approvedAt: '2026-08-31T00:00:00Z',
        source: 'fixture',
      },
    }
    fs.writeFileSync(path.join(root, 'design/rebuild/asset-production/candidate-provenance', `${row.id}.json`), JSON.stringify({
      schemaVersion: 1,
      speciesId: row.id,
      events: [{
        timestamp: '2026-08-31T00:00:00Z',
        sourceLabel: 'fixture',
        previous: null,
        candidate: { repositoryPath: `public/monsters/${row.id}.webp`, sha256: sha256(bytes), bytes: bytes.length },
        manifestStateBefore: 'CANDIDATE',
        formalPromotion: false,
      }],
    }, null, 2))
  })
  fs.writeFileSync(path.join(root, 'design/current/monsters/descriptions-001-999.json'), JSON.stringify(species.map((row, index) => ({
    no: index + 1,
    speciesId: row.id,
    familyNo: row.familyNo,
    stage: index + 1,
    type: 'grass',
  }))))
  fs.writeFileSync(path.join(root, 'design/current/monster-asset-manifest.json'), JSON.stringify({
    schemaVersion: 1,
    canonicalScope: { firstId: species[0].id, lastId: species.at(-1).id, speciesCount: species.length, excludedReferenceIds: ['m239'] },
    counts: { FORMAL: species.length, CANDIDATE: 0, PLACEHOLDER: 0 },
    assets,
  }, null, 2))
  fs.writeFileSync(path.join(root, 'public/monster-asset-revisions.json'), JSON.stringify({
    schemaVersion: 1,
    assets: Object.fromEntries(Object.entries(assets).map(([id, row]) => [id, { state: 'FORMAL', url: row.formalAsset, revision: `sha256-${row.formalSha256}` }])),
    formalByUrl: Object.fromEntries(Object.values(assets).map((row) => [row.formalAsset, `sha256-${row.formalSha256}`])),
  }, null, 2))
  return root
}

function makeBundle(root, ids, { sameAsCurrent = new Set(), visualQa = 'PASS' } = {}) {
  const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-art-bundle-'))
  const species = {}
  ids.forEach((id, index) => {
    const currentPath = path.join(root, 'public/monsters', `${id}.webp`)
    const current = fs.existsSync(currentPath) ? fs.readFileSync(currentPath) : null
    const bytes = sameAsCurrent.has(id) && current ? current : fakeWebP(0x70 + index, 120 + index)
    fs.writeFileSync(path.join(bundleDir, `${id}.webp`), bytes)
    species[id] = { file: `${id}.webp`, sha256: sha256(bytes), bytes: bytes.length, visualQa }
  })
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), JSON.stringify({
    schema: BUNDLE_SCHEMA,
    scope: ids,
    familyVisualQa: ids.length > 1 ? 'PASS' : undefined,
    approval: {
      approved: true,
      approvedBy: 'repository owner via ChatGPT selection',
      approvedAt: '2026-08-31T01:00:00Z',
      source: 'selected option B in visual review',
    },
    species,
  }, null, 2))
  return bundleDir
}

test('bundle contract accepts one to three exact species', () => {
  assert.equal(validateBundleManifest({
    schema: BUNDLE_SCHEMA,
    scope: ['m001'],
    approval: { approved: true, approvedBy: 'owner', approvedAt: '2026-08-31T00:00:00Z', source: 'chat selection' },
    species: { m001: { file: 'm001.webp', sha256: 'a'.repeat(64), bytes: 10, visualQa: 'PASS' } },
  }).scope.length, 1)
  assert.throws(() => validateBundleManifest({
    schema: BUNDLE_SCHEMA,
    scope: ['m001','m002','m003','m004'],
    approval: { approved: true, approvedBy: 'owner', approvedAt: '2026-08-31T00:00:00Z', source: 'chat selection' },
    species: {},
  }), /1-3 species/)
})

test('one-species replacement dry-run verifies actual bytes and decoded QA without mutation', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  const before = fs.readFileSync(path.join(root, 'public/monsters/m001.webp'))
  const plan = await planFormalReplacement({ root, bundleDir, inspectImage: passImage })
  assert.deepEqual(plan.changedSpecies, ['m001'])
  assert.deepEqual(plan.idempotentSpecies, [])
  assert.deepEqual(fs.readFileSync(path.join(root, 'public/monsters/m001.webp')), before)
})

test('three-stage family replacement is atomic in scope and preserves FORMAL state/history', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001','m002','m003'])
  const old = Object.fromEntries(['m001','m002','m003'].map((id) => [id, sha256(path.join(root, 'public/monsters', `${id}.webp`))]))
  const plan = await planFormalReplacement({ root, bundleDir, inspectImage: passImage })
  const result = executeFormalReplacement(plan, { timestamp: '2026-08-31T02:00:00Z' })
  assert.deepEqual(result.changedSpecies, ['m001','m002','m003'])
  assert.equal(result.counts.FORMAL, 3)
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json')))
  for (const id of ['m001','m002','m003']) {
    assert.equal(manifest.assets[id].state, 'FORMAL')
    assert.notEqual(manifest.assets[id].formalSha256, old[id])
    assert.equal(fs.existsSync(path.join(root, 'design/rebuild/asset-production/candidate-history', id, `${old[id]}.webp`)), true)
    const provenance = JSON.parse(fs.readFileSync(path.join(root, 'design/rebuild/asset-production/candidate-provenance', `${id}.json`)))
    assert.equal(provenance.events.at(-1).formalReplacement, true)
    assert.equal(provenance.events.at(-1).approvalEvidence.speciesId, id)
  }
  const revisions = JSON.parse(fs.readFileSync(path.join(root, 'public/monster-asset-revisions.json')))
  for (const id of ['m001','m002','m003']) assert.equal(revisions.assets[id].revision, `sha256-${manifest.assets[id].formalSha256}`)
})

test('multi-species bundle rejects unrelated families', async () => {
  const root = makeRoot([
    { id: 'm001', familyNo: 1 },
    { id: 'm002', familyNo: 1 },
    { id: 'm003', familyNo: 2 },
  ])
  const bundleDir = makeBundle(root, ['m001','m002','m003'])
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: passImage }), /one evolution family/)
})

test('bundle scope fails closed on extra WebP or declared SHA mismatch', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  fs.writeFileSync(path.join(bundleDir, 'm999.webp'), fakeWebP())
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: passImage }), /exactly match scope/)
  fs.unlinkSync(path.join(bundleDir, 'm999.webp'))
  const manifestPath = path.join(bundleDir, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath))
  manifest.species.m001.sha256 = '0'.repeat(64)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: passImage }), /sha256 mismatch/)
})

test('decoded QA fails wrong size, no transparency, or edge contact', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: async () => ({ ...await passImage(), width: 1024 }) }), /512x512/)
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: async () => ({ ...await passImage(), actualAlpha: false }) }), /alpha\/transparency/)
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: async () => ({ ...await passImage(), bboxTouchesEdges: 1 }) }), /touches 1 canvas edge/)
})

test('byte-identical replacement is idempotent and does not append history', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'], { sameAsCurrent: new Set(['m001']) })
  const provenancePath = path.join(root, 'design/rebuild/asset-production/candidate-provenance/m001.json')
  const beforeEvents = JSON.parse(fs.readFileSync(provenancePath)).events.length
  const plan = await planFormalReplacement({ root, bundleDir, inspectImage: passImage })
  assert.deepEqual(plan.changedSpecies, [])
  assert.deepEqual(plan.idempotentSpecies, ['m001'])
  const result = executeFormalReplacement(plan)
  assert.deepEqual(result.changedSpecies, [])
  assert.equal(JSON.parse(fs.readFileSync(provenancePath)).events.length, beforeEvents)
})

test('three-species execution rolls back all files when a post-write gate fails', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001','m002','m003'])
  const before = Object.fromEntries(['m001','m002','m003'].map((id) => [id, fs.readFileSync(path.join(root, 'public/monsters', `${id}.webp`))]))
  const manifestBefore = fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json'))
  const plan = await planFormalReplacement({ root, bundleDir, inspectImage: passImage })
  assert.throws(() => executeFormalReplacement(plan, { regenerateRevisions: () => { throw new Error('simulated revision failure') } }), /rolled back/)
  for (const id of ['m001','m002','m003']) assert.deepEqual(fs.readFileSync(path.join(root, 'public/monsters', `${id}.webp`)), before[id])
  assert.deepEqual(fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json')), manifestBefore)
})

test('FAST LANE refuses unknown/new roster IDs so expansion cannot masquerade as replacement', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m004'])
  await assert.rejects(() => planFormalReplacement({ root, bundleDir, inspectImage: passImage }), /not present in CURRENT manifest; roster expansion uses a different lane/)
})
