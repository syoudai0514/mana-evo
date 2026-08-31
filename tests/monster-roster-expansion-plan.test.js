import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExpansionPlan } from '../scripts/monster-art/roster-expansion-plan.mjs'

function fixture({ excluded = ['m239'], last = 238 } = {}) {
  const assets = Object.fromEntries(Array.from({ length: last }, (_, index) => [`m${String(index + 1).padStart(3, '0')}`, { state: 'FORMAL' }]))
  const descriptions = Array.from({ length: last }, (_, index) => ({ speciesId: `m${String(index + 1).padStart(3, '0')}`, familyNo: Math.floor(index / 3) + 1 }))
  descriptions.at(-1).familyNo = 83
  return {
    manifest: { canonicalScope: { firstId: 'm001', lastId: `m${String(last).padStart(3, '0')}`, speciesCount: last, excludedReferenceIds: excluded }, assets },
    descriptions,
  }
}

test('current 238 roster keeps m239 reserved and proposes m240-m242 for a new three-stage family', () => {
  const { manifest, descriptions } = fixture()
  const plan = buildExpansionPlan({ manifest, descriptions, familySize: 3 })
  assert.deepEqual(plan.proposal.speciesIds, ['m240','m241','m242'])
  assert.equal(plan.proposal.familyNo, 84)
  assert.equal(plan.proposal.resultingSpeciesCount, 241)
  assert.equal(plan.safety.excludedIdsReused, false)
})

test('planner is append-only and skips any additional reserved IDs', () => {
  const { manifest, descriptions } = fixture({ excluded: ['m239','m241'] })
  const plan = buildExpansionPlan({ manifest, descriptions, familySize: 3 })
  assert.deepEqual(plan.proposal.speciesIds, ['m242','m243','m244'])
})

test('planner accepts one or two stage families and rejects larger implicit batches', () => {
  const { manifest, descriptions } = fixture()
  assert.equal(buildExpansionPlan({ manifest, descriptions, familySize: 1 }).proposal.speciesIds.length, 1)
  assert.equal(buildExpansionPlan({ manifest, descriptions, familySize: 2 }).proposal.speciesIds.length, 2)
  assert.throws(() => buildExpansionPlan({ manifest, descriptions, familySize: 4 }), /1, 2, or 3/)
})

test('planner fails closed when canonical speciesCount is stale', () => {
  const { manifest, descriptions } = fixture()
  manifest.canonicalScope.speciesCount = 999
  assert.throws(() => buildExpansionPlan({ manifest, descriptions, familySize: 3 }), /speciesCount is stale/)
})
