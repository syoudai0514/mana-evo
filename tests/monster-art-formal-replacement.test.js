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

const BASE_HEAD = '1'.repeat(40)

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
  margins: { left: 20, top: 20, right: 21, bottom: 21 },
  minMarginPx: 20,
  borderSolidRatio: 0,
  rectangularBackgroundSuspicion: false,
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
    const currentSha = sha256(bytes)
    assets[row.id] = {
      state: 'FORMAL',
      formalAsset: `/monsters/${row.id}.webp`,
      formalSha256: currentSha,
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
        candidate: { repositoryPath: `public/monsters/${row.id}.webp`, sha256: currentSha, bytes: bytes.length },
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

function familyReferenceMap(root, ids) {
  const descriptions = JSON.parse(fs.readFileSync(path.join(root, 'design/current/monsters/descriptions-001-999.json')))
  const target = descriptions.find((row) => row.speciesId === ids[0])
  const family = descriptions.filter((row) => String(row.familyNo) === String(target?.familyNo))
  const references = Object.fromEntries(family.map((row) => {
    const current = fs.readFileSync(path.join(root, 'public/monsters', `${row.speciesId}.webp`))
    return [row.speciesId, { expectedCurrentSha256: sha256(current) }]
  }))
  // Include every explicit target even for the negative unrelated-family fixture,
  // so the test reaches and proves the one-family guard rather than failing earlier
  // on a deliberately incomplete reference map.
  for (const id of ids) {
    if (references[id]) continue
    const currentPath = path.join(root, 'public/monsters', `${id}.webp`)
    if (fs.existsSync(currentPath)) references[id] = { expectedCurrentSha256: sha256(fs.readFileSync(currentPath)) }
  }
  return references
}

function makeBundle(root, ids, {
  sameAsCurrent = new Set(),
  visualQa = 'PASS',
  transactionId = 'tx-test-0001',
  baseHeadSha = BASE_HEAD,
  familyReferences = null,
} = {}) {
  const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-art-bundle-'))
  const species = {}
  ids.forEach((id, index) => {
    const currentPath = path.join(root, 'public/monsters', `${id}.webp`)
    const current = fs.existsSync(currentPath) ? fs.readFileSync(currentPath) : null
    const currentSha = current ? sha256(current) : '0'.repeat(64)
    const bytes = sameAsCurrent.has(id) && current ? current : fakeWebP(0x70 + index, 120 + index)
    fs.writeFileSync(path.join(bundleDir, `${id}.webp`), bytes)
    species[id] = {
      file: `${id}.webp`,
      expectedCurrentSha256: currentSha,
      sha256: sha256(bytes),
      bytes: bytes.length,
      visualQa,
    }
  })
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), JSON.stringify({
    schema: BUNDLE_SCHEMA,
    transactionId,
    baseHeadSha,
    intent: 'REPLACE',
    scope: ids,
    familyVisualQa: ids.length > 1 ? 'PASS' : undefined,
    familyReferences: familyReferences ?? familyReferenceMap(root, ids),
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

const plan = (root, bundleDir, extra = {}) => planFormalReplacement({ root, bundleDir, inspectImage: passImage, currentHeadSha: BASE_HEAD, ...extra })

test('bundle v2 contract requires transaction/base/current binding', () => {
  assert.equal(validateBundleManifest({
    schema: BUNDLE_SCHEMA,
    transactionId: 'tx-valid-0001',
    baseHeadSha: BASE_HEAD,
    intent: 'REPLACE',
    scope: ['m001'],
    approval: { approved: true, approvedBy: 'owner', approvedAt: '2026-08-31T00:00:00Z', source: 'chat selection' },
    familyReferences: { m001: { expectedCurrentSha256: 'b'.repeat(64) } },
    species: { m001: { file: 'm001.webp', expectedCurrentSha256: 'b'.repeat(64), sha256: 'a'.repeat(64), bytes: 10, visualQa: 'PASS' } },
  }).scope.length, 1)
  assert.throws(() => validateBundleManifest({
    schema: BUNDLE_SCHEMA,
    transactionId: 'tx-valid-0001',
    baseHeadSha: BASE_HEAD,
    intent: 'REPLACE',
    scope: ['m001','m002','m003','m004'],
    approval: { approved: true, approvedBy: 'owner', approvedAt: '2026-08-31T00:00:00Z', source: 'chat selection' },
    familyReferences: {},
    species: {},
  }), /1-3 species/)
})

test('bundle is rejected when base HEAD moved', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  await assert.rejects(() => plan(root, bundleDir, { currentHeadSha: '2'.repeat(40) }), /STALE_BUNDLE base HEAD/)
})

test('bundle is rejected when target CURRENT SHA moved after art selection', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  fs.writeFileSync(path.join(root, 'public/monsters/m001.webp'), fakeWebP(0x55, 130))
  const manifestPath = path.join(root, 'design/current/monster-asset-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath))
  manifest.assets.m001.formalSha256 = sha256(path.join(root, 'public/monsters/m001.webp'))
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  const revisionsPath = path.join(root, 'public/monster-asset-revisions.json')
  const revisions = JSON.parse(fs.readFileSync(revisionsPath))
  revisions.assets.m001.revision = `sha256-${manifest.assets.m001.formalSha256}`
  revisions.formalByUrl['/monsters/m001.webp'] = revisions.assets.m001.revision
  fs.writeFileSync(revisionsPath, JSON.stringify(revisions, null, 2))
  const provenancePath = path.join(root, 'design/rebuild/asset-production/candidate-provenance/m001.json')
  const provenance = JSON.parse(fs.readFileSync(provenancePath))
  provenance.events.push({ candidate: { sha256: manifest.assets.m001.formalSha256, repositoryPath: 'public/monsters/m001.webp', bytes: 130 } })
  fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2))
  await assert.rejects(() => plan(root, bundleDir), /STALE_BUNDLE m001/)
})

test('one-species replacement dry-run verifies actual bytes and decoded QA without mutation', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  const before = fs.readFileSync(path.join(root, 'public/monsters/m001.webp'))
  const result = await plan(root, bundleDir)
  assert.deepEqual(result.changedSpecies, ['m001'])
  assert.deepEqual(result.alreadyAppliedSpecies, [])
  assert.deepEqual(fs.readFileSync(path.join(root, 'public/monsters/m001.webp')), before)
})

test('initial byte-identical REPLACE fails instead of hiding an omitted selected image', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'], { sameAsCurrent: new Set(['m001']), transactionId: 'tx-noop-0001' })
  await assert.rejects(() => plan(root, bundleDir), /replacement is unexpectedly byte-identical|ambiguous no-op/)
})

test('three-stage family replacement preserves FORMAL/history/provenance and old approval evidence', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001','m002','m003'], { transactionId: 'tx-family-0001' })
  const old = Object.fromEntries(['m001','m002','m003'].map((id) => [id, sha256(path.join(root, 'public/monsters', `${id}.webp`))]))
  const replacementPlan = await plan(root, bundleDir)
  const result = executeFormalReplacement(replacementPlan, { timestamp: '2026-08-31T02:00:00Z', currentHeadSha: BASE_HEAD })
  assert.deepEqual(result.changedSpecies, ['m001','m002','m003'])
  assert.equal(result.counts.FORMAL, 3)
  assert.match(result.changePlanPath, /change-plans\/tx-family-0001\.json$/)
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json')))
  for (const id of ['m001','m002','m003']) {
    assert.equal(manifest.assets[id].state, 'FORMAL')
    assert.notEqual(manifest.assets[id].formalSha256, old[id])
    assert.equal(fs.existsSync(path.join(root, 'design/rebuild/asset-production/candidate-history', id, `${old[id]}.webp`)), true)
    const provenance = JSON.parse(fs.readFileSync(path.join(root, 'design/rebuild/asset-production/candidate-provenance', `${id}.json`)))
    const event = provenance.events.at(-1)
    assert.equal(event.formalReplacement, true)
    assert.equal(event.transactionId, 'tx-family-0001')
    assert.equal(event.previous.approvalEvidence.approvedBy, 'baseline')
  }
})

test('re-running the same transaction after successful application becomes ALREADY_APPLIED', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'], { transactionId: 'tx-repeat-0001' })
  const firstPlan = await plan(root, bundleDir)
  executeFormalReplacement(firstPlan, { currentHeadSha: BASE_HEAD })
  const secondPlan = await plan(root, bundleDir)
  assert.deepEqual(secondPlan.changedSpecies, [])
  assert.deepEqual(secondPlan.alreadyAppliedSpecies, ['m001'])
  const result = executeFormalReplacement(secondPlan, { currentHeadSha: BASE_HEAD })
  assert.equal(result.mode, 'ALREADY_APPLIED')
})

test('multi-species bundle rejects unrelated families', async () => {
  const root = makeRoot([
    { id: 'm001', familyNo: 1 },
    { id: 'm002', familyNo: 1 },
    { id: 'm003', familyNo: 2 },
  ])
  const bundleDir = makeBundle(root, ['m001','m002','m003'])
  await assert.rejects(() => plan(root, bundleDir), /one evolution family/)
})

test('bundle scope fails closed on extra WebP or declared SHA mismatch', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  fs.writeFileSync(path.join(bundleDir, 'm999.webp'), fakeWebP())
  await assert.rejects(() => plan(root, bundleDir), /exactly match scope/)
  fs.unlinkSync(path.join(bundleDir, 'm999.webp'))
  const manifestPath = path.join(bundleDir, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath))
  manifest.species.m001.sha256 = '0'.repeat(64)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  await assert.rejects(() => plan(root, bundleDir), /sha256 mismatch/)
})

test('decoded QA fails wrong size, no transparency, edge contact, or sub-4px margin', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  await assert.rejects(() => plan(root, bundleDir, { inspectImage: async () => ({ ...await passImage(), width: 1024 }) }), /512x512/)
  await assert.rejects(() => plan(root, bundleDir, { inspectImage: async () => ({ ...await passImage(), actualAlpha: false }) }), /alpha\/transparency/)
  await assert.rejects(() => plan(root, bundleDir, { inspectImage: async () => ({ ...await passImage(), bboxTouchesEdges: 1, minMarginPx: 0 }) }), /touches 1 canvas edge/)
  await assert.rejects(() => plan(root, bundleDir, { inspectImage: async () => ({ ...await passImage(), minMarginPx: 3 }) }), /at least 4px/)
})

test('existing history archive must match the old FORMAL SHA', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'], { transactionId: 'tx-history-0001' })
  const replacementPlan = await plan(root, bundleDir)
  const oldSha = replacementPlan.entries[0].currentSha256
  const historyPath = path.join(root, 'design/rebuild/asset-production/candidate-history/m001', `${oldSha}.webp`)
  fs.mkdirSync(path.dirname(historyPath), { recursive: true })
  fs.writeFileSync(historyPath, fakeWebP(0x7f, 140))
  assert.throws(() => executeFormalReplacement(replacementPlan, { currentHeadSha: BASE_HEAD }), /existing history archive SHA mismatch/)
})

test('provenance must describe the current FORMAL SHA before replacement', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001'])
  const provenancePath = path.join(root, 'design/rebuild/asset-production/candidate-provenance/m001.json')
  const provenance = JSON.parse(fs.readFileSync(provenancePath))
  provenance.events.at(-1).candidate.sha256 = 'f'.repeat(64)
  fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2))
  await assert.rejects(() => plan(root, bundleDir), /provenance latest asset SHA does not match CURRENT FORMAL SHA/)
})

test('three-species execution rolls back all files when a post-write gate fails', async () => {
  const root = makeRoot()
  const bundleDir = makeBundle(root, ['m001','m002','m003'], { transactionId: 'tx-rollback-0001' })
  const before = Object.fromEntries(['m001','m002','m003'].map((id) => [id, fs.readFileSync(path.join(root, 'public/monsters', `${id}.webp`))]))
  const manifestBefore = fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json'))
  const replacementPlan = await plan(root, bundleDir)
  assert.throws(() => executeFormalReplacement(replacementPlan, {
    currentHeadSha: BASE_HEAD,
    regenerateRevisions: () => { throw new Error('simulated revision failure') },
  }), /rolled back/)
  for (const id of ['m001','m002','m003']) assert.deepEqual(fs.readFileSync(path.join(root, 'public/monsters', `${id}.webp`)), before[id])
  assert.deepEqual(fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json')), manifestBefore)
})

test('FAST LANE refuses unknown/new roster IDs so expansion cannot masquerade as replacement', async () => {
  const root = makeRoot()
  const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-art-bundle-'))
  const bytes = fakeWebP(0x77, 120)
  fs.writeFileSync(path.join(bundleDir, 'm004.webp'), bytes)
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), JSON.stringify({
    schema: BUNDLE_SCHEMA,
    transactionId: 'tx-newid-0001',
    baseHeadSha: BASE_HEAD,
    intent: 'REPLACE',
    scope: ['m004'],
    familyReferences: { m004: { expectedCurrentSha256: '0'.repeat(64) } },
    approval: { approved: true, approvedBy: 'owner', approvedAt: '2026-08-31T00:00:00Z', source: 'chat' },
    species: { m004: { file: 'm004.webp', expectedCurrentSha256: '0'.repeat(64), sha256: sha256(bytes), bytes: bytes.length, visualQa: 'PASS' } },
  }))
  await assert.rejects(() => plan(root, bundleDir), /not present in CURRENT manifest; roster expansion uses a different lane/)
})
