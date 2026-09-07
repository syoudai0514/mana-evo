import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  CLOUD_RECOVERY_REASONS,
  decideSync,
  makeCloudPayload,
  payloadHash,
  payloadPartHashes
} from '../src/platform/cloudSaveModel.js'
import { adoptCloudAuthoritatively, buildRecoveryCandidate } from '../src/platform/cloudSyncV2.js'
import { activeSpeciesCount, createAllClearGameFixture, createEvolutionTestGameFixture } from '../src/platform/testFixtures.js'
import { EVOLUTION_TRANSITIONS } from '../src/game/evolutionDomain.js'
import { SPECIES } from '../src/game/content.js'

function payload(value, capturedAt = '2026-08-28T00:00:00.000Z') {
  return makeCloudPayload({ learning: { profiles: { p1: { name: 'P1', state: { value } } } }, gameEnvelope: { formatVersion: 2, gameByProfile: {} }, capturedAt })
}

function householdPayload({ papa = 1, masaki = 1 } = {}) {
  return makeCloudPayload({
    learning: {
      version: 4,
      contentVersion: 16,
      profiles: {
        papa: { name: 'パパ', state: { score: papa } },
        masaki: { name: 'まさき', state: { score: masaki } }
      }
    },
    gameEnvelope: {
      formatVersion: 2,
      gameByProfile: {
        papa: { marker: `papa-${papa}` },
        masaki: { marker: `masaki-${masaki}` }
      }
    },
    learningRewardEnvelope: {
      version: 1,
      byProfile: {
        papa: { marker: `papa-${papa}` },
        masaki: { marker: `masaki-${masaki}` }
      }
    },
    capturedAt: '2026-08-28T00:00:00.000Z'
  })
}

test('cloud payload hash is deterministic across object key order', () => {
  assert.equal(payloadHash({ b: 2, a: { y: 2, x: 1 } }), payloadHash({ a: { x: 1, y: 2 }, b: 2 }))
})

test('cloud payload hash ignores capturedAt bookkeeping time', () => {
  assert.equal(payloadHash(payload('same', '2026-08-28T00:00:00.000Z')), payloadHash(payload('same', '2026-08-29T12:34:56.000Z')))
})

test('cloud-only change pulls automatically while simultaneous local progress becomes recover-pull', () => {
  const oldPayload = payload('old')
  const localHash = payloadHash(oldPayload)
  const meta = { revision: 2, hash: localHash, parts: payloadPartHashes(oldPayload) }
  const cloud = { revision: 3, payload: payload('new') }
  assert.equal(decideSync({ localHash, meta, cloud }).action, 'pull')

  const diverged = decideSync({ localHash: payloadHash(payload('local-change')), meta, cloud })
  assert.equal(diverged.action, 'recover-pull')
  assert.equal(diverged.recoveryReason, CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED)
})

test('fresh device adopts existing cloud while non-fresh divergent device preserves a recovery candidate first', () => {
  const cloud = { revision: 7, payload: payload('cloud-existing') }
  const localHash = payloadHash(payload('brand-new-local-default'))
  assert.equal(decideSync({ localHash, cloud, freshDevice: true }).action, 'pull')
  const nonFresh = decideSync({ localHash, cloud, freshDevice: false })
  assert.equal(nonFresh.action, 'recover-pull')
  assert.equal(nonFresh.recoveryReason, CLOUD_RECOVERY_REASONS.NO_TRUSTED_BASE)
})

test('sync decision pushes a real local change when the trusted cloud base is unchanged', () => {
  const base = payload('base')
  const meta = { revision: 4, hash: payloadHash(base), parts: payloadPartHashes(base) }
  const cloud = { revision: 4, payload: base }
  assert.equal(decideSync({ localHash: payloadHash(payload('changed')), meta, cloud }).action, 'push')
})

test('different-player concurrent changes are preserved for later recovery instead of auto-merged', () => {
  const base = householdPayload({ papa: 1, masaki: 1 })
  const local = householdPayload({ papa: 2, masaki: 1 })
  const cloudPayload = householdPayload({ papa: 1, masaki: 3 })
  const meta = { revision: 10, hash: payloadHash(base), parts: payloadPartHashes(base) }
  const decision = decideSync({
    localHash: payloadHash(local),
    meta,
    cloud: { revision: 11, payload: cloudPayload }
  })
  assert.equal(decision.action, 'recover-pull')
  assert.equal(decision.recoveryReason, CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED)
  assert.equal('payload' in decision, false)
})

test('same-player concurrent changes also preserve LOCAL and then prefer CLOUD without automatic merge', () => {
  const base = householdPayload({ papa: 1, masaki: 1 })
  const local = householdPayload({ papa: 2, masaki: 1 })
  const cloudPayload = householdPayload({ papa: 4, masaki: 1 })
  const meta = { revision: 10, hash: payloadHash(base), parts: payloadPartHashes(base) }
  const decision = decideSync({
    localHash: payloadHash(local),
    meta,
    cloud: { revision: 11, payload: cloudPayload }
  })
  assert.equal(decision.action, 'recover-pull')
})

test('same revision with independently changed content is recover-pull unless only one side changed from base', () => {
  const base = payload('base')
  const meta = { revision: 9, hash: payloadHash(base) }
  const cloudOnly = { revision: 9, payload: payload('cloud-change') }
  assert.equal(decideSync({ localHash: payloadHash(base), meta, cloud: cloudOnly }).action, 'pull')

  const both = decideSync({ localHash: payloadHash(payload('local-change')), meta, cloud: cloudOnly })
  assert.equal(both.action, 'recover-pull')
  assert.equal(both.recoveryReason, CLOUD_RECOVERY_REASONS.SAME_REVISION_DIVERGENCE)
})

test('cloud revision regression never silently overwrites divergent local progress without recovery preservation', () => {
  const known = payload('known-newer')
  const meta = { revision: 12, hash: payloadHash(known) }
  const decision = decideSync({ localHash: payloadHash(known), meta, cloud: { revision: 11, payload: payload('older-cloud') } })
  assert.equal(decision.action, 'recover-pull')
  assert.equal(decision.recoveryReason, CLOUD_RECOVERY_REASONS.CLOUD_REVISION_REGRESSION)
})

test('D-032 decision authority never emits the superseded merge/conflict actions', () => {
  const base = payload('base')
  const meta = { revision: 5, hash: payloadHash(base), parts: payloadPartHashes(base) }
  const cases = [
    decideSync({ localHash: payloadHash(payload('local')), meta, cloud: { revision: 6, payload: payload('cloud') } }),
    decideSync({ localHash: payloadHash(payload('local')), cloud: { revision: 6, payload: payload('cloud') }, freshDevice: false }),
    decideSync({ localHash: payloadHash(base), meta, cloud: { revision: 4, payload: payload('older') } })
  ]
  for (const decision of cases) assert.ok(!['merge', 'conflict'].includes(decision.action), decision.action)
})

test('recovery candidate stores LOCAL, contemporaneous CLOUD and trusted-base metadata', () => {
  const localPayload = payload('local')
  const cloudPayload = payload('cloud')
  const decision = {
    action: 'recover-pull',
    recoveryReason: CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED,
    cloudHash: payloadHash(cloudPayload)
  }
  const candidate = buildRecoveryCandidate({
    decision,
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 8, payload: cloudPayload },
    meta: { revision: 7, hash: payloadHash(payload('base')) },
    deviceProfileId: 'masaki'
  })
  assert.equal(candidate.baseRevision, 7)
  assert.equal(candidate.cloudRevision, 8)
  assert.equal(candidate.deviceProfileId, 'masaki')
  assert.deepEqual(candidate.localPayload, localPayload)
  assert.deepEqual(candidate.cloudPayload, cloudPayload)
})

test('recover-pull durably persists recovery candidate before CLOUD apply and sync-meta commit', async () => {
  const localPayload = payload('local-progress')
  const cloudPayload = payload('cloud-progress')
  const order = []
  let persisted = null
  const decision = {
    action: 'recover-pull',
    recoveryReason: CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED,
    cloudHash: payloadHash(cloudPayload)
  }

  await adoptCloudAuthoritatively({
    decision,
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 22, payload: cloudPayload },
    meta: { revision: 21, hash: payloadHash(payload('base')) },
    deviceProfileId: 'masaki',
    persistRecoveryCandidate: async (candidate) => { order.push('persist'); persisted = candidate },
    applyCloudPayload: () => order.push('apply'),
    commitSyncMeta: () => order.push('meta')
  })

  assert.deepEqual(order, ['persist', 'apply', 'meta'])
  assert.equal(persisted.reason, CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED)
  assert.deepEqual(persisted.localPayload, localPayload)
  assert.deepEqual(persisted.cloudPayload, cloudPayload)
})

test('recovery persistence failure fails closed and leaves LOCAL unapplied/unacknowledged', async () => {
  const localPayload = payload('must-survive')
  const cloudPayload = payload('cloud')
  let applied = false
  let metaCommitted = false

  await assert.rejects(() => adoptCloudAuthoritatively({
    decision: {
      action: 'recover-pull',
      recoveryReason: CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED,
      cloudHash: payloadHash(cloudPayload)
    },
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 3, payload: cloudPayload },
    meta: { revision: 2, hash: payloadHash(payload('base')) },
    persistRecoveryCandidate: async () => { throw new Error('candidate insert failed') },
    applyCloudPayload: () => { applied = true },
    commitSyncMeta: () => { metaCommitted = true }
  }), /candidate insert failed/)

  assert.equal(applied, false)
  assert.equal(metaCommitted, false)
})

test('ordinary pull skips recovery storage and applies CLOUD before committing meta', async () => {
  const cloudPayload = payload('cloud')
  const order = []
  await adoptCloudAuthoritatively({
    decision: { action: 'pull', cloudHash: payloadHash(cloudPayload) },
    localPayload: payload('unchanged-base'),
    localHash: payloadHash(payload('unchanged-base')),
    cloud: { revision: 4, payload: cloudPayload },
    persistRecoveryCandidate: async () => order.push('persist'),
    applyCloudPayload: () => order.push('apply'),
    commitSyncMeta: () => order.push('meta')
  })
  assert.deepEqual(order, ['apply', 'meta'])
})

test('all-clear fixture exposes all active 238 species and clears all current stages', () => {
  assert.equal(activeSpeciesCount(), 238)
  const game = createAllClearGameFixture()
  assert.equal(Object.keys(game.dex.caught).length, 238)
  assert.equal(Object.keys(game.box).length, 238)
  assert.equal(game.adventureLocation.area, 5)
  assert.equal(game.adventureLocation.zoneId, 'ex')
})

for (const stage of [1, 2]) {
  test(`stage ${stage} evolution fixture contains every transition from that stage`, () => {
    const expected = EVOLUTION_TRANSITIONS.filter((transition) => Number(SPECIES[transition.fromSpeciesId]?.stage) === stage)
    const game = createEvolutionTestGameFixture(stage)
    assert.ok(expected.length > 0)
    assert.equal(Object.keys(game.box).length, expected.length)
    for (const transition of expected) {
      const monster = game.box[`test-${transition.fromSpeciesId}`]
      assert.ok(monster, transition.fromSpeciesId)
      if (transition.method === 'stone') assert.ok(game.evolutionItems.stones[transition.itemId] > 0)
      if (transition.method === 'held_item_levelup') assert.equal(monster.heldItemId, transition.itemId)
    }
  })
}

test('shared Supabase schema protects saves, backups and append-only recovery candidates with own-user RLS', () => {
  const sql = fs.readFileSync(new URL('../infra/shared-supabase/app-save-hub.sql', import.meta.url), 'utf8')
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /auth\.uid\(\)\) = user_id/)
  assert.doesNotMatch(sql, /grant[^;]+to anon/i)
  assert.match(sql, /revoke all privileges on table public\.app_saves from anon/i)
  assert.match(sql, /revoke all privileges on table public\.app_save_backups from anon/i)
  assert.match(sql, /revoke all privileges on table public\.app_save_recovery_candidates from anon/i)
  assert.match(sql, /primary key \(user_id, app_id, slot_id\)/i)
  assert.match(sql, /grant select, insert on public\.app_save_recovery_candidates to authenticated/i)
  assert.doesNotMatch(sql, /grant[^;]*update[^;]*app_save_recovery_candidates/i)
  assert.doesNotMatch(sql, /grant[^;]*delete[^;]*app_save_recovery_candidates/i)
  assert.match(sql, /local_payload jsonb not null/i)
  assert.match(sql, /cloud_payload jsonb not null/i)
})

test('cloud snapshot includes the learning-to-game reward bridge in the same revision', () => {
  const source = fs.readFileSync(new URL('../src/platform/cloudSnapshot.js', import.meta.url), 'utf8')
  assert.match(source, /exportLearningRewardEnvelope\(\)/)
  assert.match(source, /learningRewardEnvelope:/)
  assert.match(source, /importLearningRewardEnvelope\(payload\.learningRewardEnvelope(?:,\s*\{[^}]*\})?\)/)
})

test('cloud mutations require PIN or an explicit live Parent verification session', () => {
  const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')
  const gate = fs.readFileSync(new URL('../src/platform/AdultCloudControls.jsx', import.meta.url), 'utf8')
  const parentGate = fs.readFileSync(new URL('../src/parent/ParentGate.jsx', import.meta.url), 'utf8')
  const verification = fs.readFileSync(new URL('../src/parent/parentVerification.js', import.meta.url), 'utf8')
  assert.match(shell, /<AdultCloudControls\s+alreadyVerified=\{parentScreenOpen\}>/)
  assert.match(gate, /PARENT_PIN_KEY/)
  assert.match(gate, /保護者専用/)
  assert.match(gate, /alreadyVerified\s*&&\s*isParentVerificationActive\(\)/)
  assert.match(parentGate, /markParentVerification\(\)/)
  assert.match(parentGate, /clearParentVerification\(\)/)
  assert.match(verification, /let active = false/)
  assert.doesNotMatch(gate, /querySelector\(['"]\.parent-screen/)
  assert.doesNotMatch(shell, /cloud-test-banner[^\n]+onClick=\{stopTest\}/)
})

test('browser cloud client never embeds a Supabase secret or service-role credential', () => {
  const client = fs.readFileSync(new URL('../src/platform/sharedSupabaseRest.js', import.meta.url), 'utf8')
  const publicConfig = fs.readFileSync(new URL('../src/platform/sharedSupabasePublicConfig.js', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /service[_-]?role/i)
  assert.doesNotMatch(client, /sb_secret_/i)
  assert.doesNotMatch(publicConfig, /sb_secret_/i)
})

test('D-032 runtime source has no child-facing LOCAL-vs-CLOUD conflict chooser or automatic merge branch', () => {
  const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')
  const model = fs.readFileSync(new URL('../src/platform/cloudSaveModel.js', import.meta.url), 'utf8')
  assert.doesNotMatch(shell, /chooseCloud|chooseLocal|保存データが2つあります|decision\.action === 'merge'/)
  assert.doesNotMatch(model, /mergeDisjointProfilePayloads|action:\s*'conflict'|action:\s*'merge'/)
  assert.match(shell, /createRecoveryCandidate/)
  assert.match(shell, /recover-pull/)
})
