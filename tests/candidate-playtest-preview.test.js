import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PLAYTEST_CANDIDATE_ART, resolvePlaytestCandidateArt } from '../src/game/playtestCandidateArt.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const EXPECTED_IDS = [
  // W-303
  'm001', 'm002', 'm003', 'm040', 'm041', 'm042', 'm082', 'm083',
  'm084', 'm085', 'm086', 'm087', 'm134', 'm135', 'm136', 'm235',
  // W-304
  'm004', 'm005', 'm006', 'm055', 'm056', 'm057', 'm058', 'm059',
  'm060', 'm211', 'm212', 'm213',
  // W-305
  'm007', 'm008', 'm009', 'm037', 'm038', 'm039', 'm073', 'm074',
  'm075', 'm076', 'm077', 'm078', 'm128', 'm129', 'm130', 'm131',
  'm132', 'm133', 'm214', 'm215', 'm216'
]

test('playtest overlay is exactly W-303/W-304/W-305: 49 unique species, m239 excluded', () => {
  assert.equal(EXPECTED_IDS.length, 49)
  assert.equal(new Set(EXPECTED_IDS).size, 49)
  assert.deepEqual(Object.keys(PLAYTEST_CANDIDATE_ART).sort(), [...EXPECTED_IDS].sort())
  assert.equal(PLAYTEST_CANDIDATE_ART.m239, undefined)
  assert.equal(resolvePlaytestCandidateArt('m239'), null)
})

test('all 49 playtest assets are real candidate-safe WebP files', () => {
  for (const id of EXPECTED_IDS) {
    const resolution = resolvePlaytestCandidateArt(id)
    assert.equal(resolution.state, 'CANDIDATE')
    assert.equal(resolution.isCandidatePreview, true)
    assert.equal(resolution.isFormal, false)
    assert.equal(resolution.src, `/monsters/${id}.webp`)

    const filePath = path.join(ROOT, 'public', 'monsters', `${id}.webp`)
    assert.equal(fs.existsSync(filePath), true, `${id} WebP missing`)
    const stat = fs.statSync(filePath)
    assert.ok(stat.size > 0, `${id} WebP empty`)
    assert.ok(stat.size < 1_000_000, `${id} WebP must be < 1 MB`)
    const head = fs.readFileSync(filePath).subarray(0, 12)
    assert.equal(head.toString('ascii', 0, 4), 'RIFF', `${id} missing RIFF`)
    assert.equal(head.toString('ascii', 8, 12), 'WEBP', `${id} missing WEBP`)
  }
})

test('playtest overlay does not promote CURRENT assets to FORMAL', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/current/monster-asset-manifest.json'), 'utf8'))
  const formalCount = Object.values(manifest.assets).filter((asset) => asset.state === 'FORMAL').length
  assert.equal(formalCount, 0)
})
