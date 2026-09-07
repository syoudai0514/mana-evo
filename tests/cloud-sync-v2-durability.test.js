import test from 'node:test'
import assert from 'node:assert/strict'

import { makeCloudPayload, payloadHash } from '../src/platform/cloudSaveModel.js'
import { adoptCloudAuthoritatively } from '../src/platform/cloudSyncV2.js'

function payload(value) {
  return makeCloudPayload({
    learning: { profiles: { p1: { name: 'P1', state: { value } } } },
    gameEnvelope: { formatVersion: 2, gameByProfile: { p1: {} } },
    learningRewardEnvelope: { version: 1, byProfile: { p1: {} } },
    capturedAt: '2026-09-07T00:00:00.000Z'
  })
}

test('recover-pull treats a null persistence receipt as failure and never applies CLOUD', async () => {
  const localPayload = payload('local-progress')
  const cloudPayload = payload('cloud-progress')
  let applied = false
  let metaCommitted = false

  await assert.rejects(() => adoptCloudAuthoritatively({
    decision: {
      action: 'recover-pull',
      recoveryReason: 'LOCAL_AND_CLOUD_DIVERGED',
      cloudHash: payloadHash(cloudPayload)
    },
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 9, payload: cloudPayload },
    meta: { revision: 8, hash: payloadHash(payload('base')) },
    persistRecoveryCandidate: async () => null,
    applyCloudPayload: () => { applied = true },
    commitSyncMeta: () => { metaCommitted = true }
  }), /復旧候補を永続化できませんでした/)

  assert.equal(applied, false)
  assert.equal(metaCommitted, false)
})

test('recover-pull accepts a durable inserted-row receipt before applying CLOUD', async () => {
  const localPayload = payload('local-progress')
  const cloudPayload = payload('cloud-progress')
  const order = []

  await adoptCloudAuthoritatively({
    decision: {
      action: 'recover-pull',
      recoveryReason: 'LOCAL_AND_CLOUD_DIVERGED',
      cloudHash: payloadHash(cloudPayload)
    },
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 9, payload: cloudPayload },
    meta: { revision: 8, hash: payloadHash(payload('base')) },
    persistRecoveryCandidate: async () => { order.push('persist'); return { id: 'candidate-1' } },
    applyCloudPayload: () => order.push('apply'),
    commitSyncMeta: () => order.push('meta')
  })

  assert.deepEqual(order, ['persist', 'apply', 'meta'])
})

test('ordinary pull is deferred if LOCAL changes after classification and before apply', async () => {
  const classifiedLocal = payload('base')
  const newerLocal = payload('new-child-progress')
  const cloudPayload = payload('cloud-progress')
  let applied = false
  let metaCommitted = false

  const result = await adoptCloudAuthoritatively({
    decision: { action: 'pull', cloudHash: payloadHash(cloudPayload) },
    localPayload: classifiedLocal,
    localHash: payloadHash(classifiedLocal),
    cloud: { revision: 10, payload: cloudPayload },
    captureCurrentLocalPayload: () => newerLocal,
    applyCloudPayload: () => { applied = true },
    commitSyncMeta: () => { metaCommitted = true }
  })

  assert.equal(result.deferred, true)
  assert.equal(result.reason, 'LOCAL_CHANGED_DURING_SYNC')
  assert.equal(applied, false)
  assert.equal(metaCommitted, false)
})

test('recover-pull preserves the classified snapshot but defers overwrite if newer LOCAL activity appears', async () => {
  const classifiedLocal = payload('local-before-network')
  const newerLocal = payload('local-after-network')
  const cloudPayload = payload('cloud-progress')
  const order = []

  const result = await adoptCloudAuthoritatively({
    decision: {
      action: 'recover-pull',
      recoveryReason: 'LOCAL_AND_CLOUD_DIVERGED',
      cloudHash: payloadHash(cloudPayload)
    },
    localPayload: classifiedLocal,
    localHash: payloadHash(classifiedLocal),
    cloud: { revision: 11, payload: cloudPayload },
    meta: { revision: 10, hash: payloadHash(payload('base')) },
    persistRecoveryCandidate: async () => { order.push('persist'); return { id: 'candidate-2' } },
    captureCurrentLocalPayload: () => newerLocal,
    applyCloudPayload: () => order.push('apply'),
    commitSyncMeta: () => order.push('meta')
  })

  assert.equal(result.deferred, true)
  assert.deepEqual(order, ['persist'])
})
