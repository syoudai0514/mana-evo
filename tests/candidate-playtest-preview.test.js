import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PLAYTEST_CANDIDATE_ART, resolvePlaytestCandidateArt } from '../src/game/playtestCandidateArt.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const EXPECTED_IDS = [
  // W-303 grass
  'm001','m002','m003','m040','m041','m042','m082','m083','m084','m085','m086','m087','m134','m135','m136','m235',
  // W-304 fire
  'm004','m005','m006','m055','m056','m057','m058','m059','m060','m211','m212','m213',
  // W-305 water
  'm007','m008','m009','m037','m038','m039','m073','m074','m075','m076','m077','m078','m128','m129','m130','m131','m132','m133','m214','m215','m216',
  // W-307 normal
  'm010','m011','m012','m013','m014','m015','m100','m101','m102','m117','m118','m181','m182','m183','m232','m233','m234',
  // W-308 flying
  'm016','m017','m018','m094','m095','m096','m172','m173','m174','m223','m224','m225',
  // W-310 ground
  'm031','m032','m033','m061','m062','m063','m160','m161','m162','m163','m164','m165','m237',
  // W-311 rock
  'm034','m035','m036','m064','m065','m066','m157','m158','m159','m238',
  // W-312 steel
  'm067','m068','m069','m154','m155','m156','m196','m197','m198','m199','m200','m201',
  // W-314 fight
  'm046','m047','m048','m088','m089','m090','m091','m092','m093','m169','m170','m171','m220','m221','m222',
  // W-315 fairy
  'm049','m050','m051','m115','m116','m175','m176','m177','m208','m209','m210',
  // W-316 psychic
  'm052','m053','m054','m097','m098','m099','m143','m144','m193','m194','m195','m236',
  // W-317 ice
  'm103','m104','m105','m119','m120','m121','m122','m123','m124','m125','m126','m127',
  // W-318 ghost
  'm109','m110','m111','m112','m113','m114','m145','m146','m147','m202','m203','m204',
  // W-320 dragon
  'm184','m185','m186','m187','m188','m189','m190','m191','m192'
]

test('production candidate overlay is exactly 184 validated species, with incomplete work and m239 excluded', () => {
  assert.equal(EXPECTED_IDS.length, 184)
  assert.equal(new Set(EXPECTED_IDS).size, 184)
  assert.deepEqual(Object.keys(PLAYTEST_CANDIDATE_ART).sort(), [...EXPECTED_IDS].sort())

  for (const excluded of ['m025', 'm019', 'm043', 'm106', 'm239']) {
    assert.equal(PLAYTEST_CANDIDATE_ART[excluded], undefined, `${excluded} must remain excluded`)
    assert.equal(resolvePlaytestCandidateArt(excluded), null)
  }
})

test('all 184 production candidate assets are real candidate-safe WebP files', () => {
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

test('production candidate rollout does not promote CURRENT assets to FORMAL', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/current/monster-asset-manifest.json'), 'utf8'))
  const formalCount = Object.values(manifest.assets).filter((asset) => asset.state === 'FORMAL').length
  assert.equal(formalCount, 0)
})
