import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  RUNTIME_MONSTER_ASSETS,
  RUNTIME_MONSTER_DESCRIPTIONS,
  RUNTIME_MOVES,
  RUNTIME_SPECIES,
  RUNTIME_STAGES
} from '../src/game/runtimeMaster.generated.js'
import {
  ACTIVE_MONSTER_IDS,
  isActiveMonsterSpeciesId,
  monsterDescriptionOf,
  monsterIdentityOf
} from '../src/game/monsterData.js'
import {
  fallbackMonsterArt,
  resolveMonsterArt,
  resolveMonsterArtEntry
} from '../src/game/monsterArt.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('W-207 active monster registry is exactly m001-m238 and excludes m239', () => {
  assert.equal(ACTIVE_MONSTER_IDS.length, 238)
  assert.equal(ACTIVE_MONSTER_IDS[0], 'm001')
  assert.equal(ACTIVE_MONSTER_IDS.at(-1), 'm238')
  assert.equal(Object.keys(RUNTIME_SPECIES).length, 238)
  assert.deepEqual(Object.keys(RUNTIME_SPECIES).sort(), [...ACTIVE_MONSTER_IDS])
  assert.equal(isActiveMonsterSpeciesId('m238'), true)
  assert.equal(isActiveMonsterSpeciesId('m239'), false)
  assert.equal(RUNTIME_SPECIES.m239, undefined)
})

test('W-207 canonical identity wins over later runtime drift, including m236', () => {
  assert.equal(RUNTIME_SPECIES.m236.name, 'ホシラディア')
  assert.equal(monsterIdentityOf('m236')?.name, 'ホシラディア')
  assert.equal(monsterDescriptionOf('m236')?.name, 'ホシラディア')
  assert.equal(monsterIdentityOf('m239'), null)
  assert.equal(JSON.stringify([RUNTIME_SPECIES, RUNTIME_MOVES, RUNTIME_STAGES]).includes('ソラリオン'), false)
})

test('W-114 normalized descriptions expose the same lossless schema across shards', () => {
  assert.equal(Object.keys(RUNTIME_MONSTER_DESCRIPTIONS).length, 238)

  for (const id of ['m001', 'm081', 'm161', 'm238']) {
    const description = monsterDescriptionOf(id)
    assert.equal(typeof description.familyConcept, 'string')
    assert.equal(typeof description.personalityArc, 'object')
    assert.equal(Array.isArray(description.personalityArc), false)
    assert.equal(typeof description.personalityArcContext, 'string')
    assert.equal(typeof description.description, 'string')
  }
})

test('W-207 runtime art resolves FORMAL assets while retaining CANDIDATE and PLACEHOLDER safeguards', () => {
  assert.equal(Object.keys(RUNTIME_MONSTER_ASSETS).length, 238)
  assert.equal(RUNTIME_MONSTER_ASSETS.m001.state, 'FORMAL')
  assert.equal(RUNTIME_MONSTER_ASSETS.m011.state, 'CANDIDATE')
  assert.equal(RUNTIME_MONSTER_ASSETS.m229.state, 'PLACEHOLDER')

  const formal = resolveMonsterArt('m001')
  assert.equal(formal.state, 'FORMAL')
  assert.equal(formal.src, '/monsters/m001.webp')
  assert.equal(formal.isFormal, true)

  const candidate = resolveMonsterArt('m011')
  assert.equal(candidate.state, 'CANDIDATE')
  assert.equal(candidate.src, null)
  assert.equal(candidate.isFormal, false)

  const placeholder = resolveMonsterArt('m229')
  assert.equal(placeholder.state, 'PLACEHOLDER')
  assert.equal(placeholder.src, null)
  assert.equal(placeholder.isFormal, false)

  const excluded = resolveMonsterArt('m239')
  assert.equal(excluded.state, 'MISSING')
  assert.equal(excluded.src, null)
})

test('W-207 review mode can explicitly preview a candidate without treating it as FORMAL', () => {
  const runtimeResolution = resolveMonsterArt('m011')
  const reviewResolution = resolveMonsterArt('m011', 'review')
  assert.equal(runtimeResolution.src, null)
  assert.equal(reviewResolution.state, 'CANDIDATE')
  assert.match(reviewResolution.src, /m011\.svg$/)
  assert.equal(reviewResolution.isFormal, false)
  assert.equal(reviewResolution.isCandidatePreview, true)
})

test('W-207 FORMAL resolution requires path, approval evidence, and asset integrity', () => {
  const valid = resolveMonsterArtEntry('m001', {
    state: 'FORMAL',
    formalAsset: '/monsters/m001.webp',
    approvalEvidence: 'approved-review-id',
    formalAssetExists: true
  })
  assert.equal(valid.src, '/monsters/m001.webp')
  assert.equal(valid.isFormal, true)

  const noApproval = resolveMonsterArtEntry('m001', {
    state: 'FORMAL',
    formalAsset: '/monsters/m001.webp',
    approvalEvidence: null,
    formalAssetExists: true
  })
  assert.equal(noApproval.src, null)
  assert.equal(noApproval.isFormal, false)
  assert.equal(noApproval.integrityIssue, 'formal-asset-integrity')

  const missingFile = resolveMonsterArtEntry('m001', {
    state: 'FORMAL',
    formalAsset: '/monsters/m001.webp',
    approvalEvidence: 'approved-review-id',
    formalAssetExists: false
  })
  assert.equal(missingFile.src, null)
  assert.equal(missingFile.isFormal, false)
})

test('W-207 broken FORMAL artwork has a deterministic placeholder fallback', () => {
  const formal = resolveMonsterArtEntry('m001', {
    state: 'FORMAL',
    formalAsset: '/monsters/m001.webp',
    approvalEvidence: 'approved-review-id',
    formalAssetExists: true
  })
  const fallback = fallbackMonsterArt(formal, 'formal-asset-load-error')
  assert.equal(fallback.speciesId, 'm001')
  assert.equal(fallback.src, null)
  assert.equal(fallback.isFormal, false)
  assert.equal(fallback.integrityIssue, 'formal-asset-load-error')
})

test('W-207 MonsterArt component contains no number-range or guessed-path artwork logic', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/game/PlaceholderMonster.jsx'), 'utf8')
  assert.match(source, /resolveMonsterArt\(speciesId, 'runtime'\)/)
  assert.doesNotMatch(source, /formalSvgUrl/)
  assert.doesNotMatch(source, /officialImageUrl/)
  assert.doesNotMatch(source, /no\s*>=\s*1\s*&&\s*no\s*<=\s*20/)
  assert.doesNotMatch(source, /monsters\/\$\{speciesId\}\.svg/)
})
