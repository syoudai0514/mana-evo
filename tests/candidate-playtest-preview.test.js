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
const W306_PENDING = new Set(['m025','m026','m027','m028','m029','m030','m070','m071','m072','m178','m179','m180','m217','m218','m219'])
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

test('candidate overlay is generated from the current 223 candidate artifacts', () => {
  assert.equal(CANDIDATE_ART_SPECIES.length, 223)
  assert.equal(new Set(CANDIDATE_ART_SPECIES).size, 223)
  assert.deepEqual(Object.keys(PLAYTEST_CANDIDATE_ART), CANDIDATE_ART_SPECIES)

  for (const id of W306_PENDING) {
    assert.equal(PLAYTEST_CANDIDATE_ART[id], undefined, `${id} remains outside the integrated candidate set`)
    assert.equal(resolvePlaytestCandidateArt(id), null)
  }
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

test('candidate rollout does not promote CURRENT assets to FORMAL', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/current/monster-asset-manifest.json'), 'utf8'))
  const formalCount = Object.values(manifest.assets).filter((asset) => asset.state === 'FORMAL').length
  assert.equal(formalCount, 0)
})
