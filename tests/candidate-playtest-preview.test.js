import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { CANDIDATE_ART_SPECIES } from '../src/game/candidateArt.generated.js'
import { PLAYTEST_CANDIDATE_ART, resolvePlaytestCandidateArt } from '../src/game/playtestCandidateArt.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROVENANCE = path.join(ROOT, 'design/rebuild/asset-production/candidate-provenance')
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

test('candidate overlay is generated from the current 238 candidate artifacts', () => {
  assert.equal(CANDIDATE_ART_SPECIES.length, 238)
  assert.equal(new Set(CANDIDATE_ART_SPECIES).size, 238)
  assert.deepEqual(Object.keys(PLAYTEST_CANDIDATE_ART), CANDIDATE_ART_SPECIES)

  assert.equal(resolvePlaytestCandidateArt('m239'), null)

  for (const integrated of ['m019','m043','m106','m228','m231']) {
    assert.ok(PLAYTEST_CANDIDATE_ART[integrated], `${integrated} must be integrated`)
  }
})

test('every generated candidate has an exact WebP/provenance pair', () => {
  for (const id of CANDIDATE_ART_SPECIES) {
    const resolution = resolvePlaytestCandidateArt(id)
    assert.equal(resolution.state, 'CANDIDATE')
    assert.equal(resolution.isCandidatePreview, true)
    assert.equal(resolution.isFormal, false)
    assert.equal(resolution.src, `/monsters/${id}.webp`)

    const filePath = path.join(ROOT, 'public', 'monsters', `${id}.webp`)
    const bytes = fs.readFileSync(filePath)
    assert.ok(bytes.length > 0, `${id} WebP empty`)
    assert.ok(bytes.length < 1_000_000, `${id} WebP must be < 1 MB`)
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${id} missing RIFF`)
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${id} missing WEBP`)

    const provenance = JSON.parse(fs.readFileSync(path.join(PROVENANCE, `${id}.json`), 'utf8'))
    const latest = provenance.events.at(-1)
    assert.equal(provenance.speciesId, id)
    assert.equal(latest.formalPromotion, false)
    assert.equal(latest.candidate.repositoryPath, `public/monsters/${id}.webp`)
    assert.equal(latest.candidate.bytes, bytes.length)
    assert.equal(latest.candidate.sha256, sha256(bytes))
  }
})

test('FINAL ART CLOSEOUT promotes every completed active asset except m235 to FORMAL', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/current/monster-asset-manifest.json'), 'utf8'))
  const assets = Object.values(manifest.assets)
  const formal = Object.entries(manifest.assets).filter(([, asset]) => asset.state === 'FORMAL')
  assert.equal(formal.length, 237)
  assert.equal(assets.filter((asset) => asset.state === 'CANDIDATE').length, 0)
  assert.equal(assets.filter((asset) => asset.state === 'PLACEHOLDER').length, 1)
  for (const [speciesId, asset] of formal) {
    assert.equal(asset.formalAsset, `/monsters/${speciesId}.webp`)
    assert.equal(asset.approvalEvidence?.approved, true)
    assert.equal(asset.approvalEvidence?.approvalType, 'CURRENT_FORMAL')
  }
  assert.equal(manifest.assets.m235.state, 'PLACEHOLDER')
})
