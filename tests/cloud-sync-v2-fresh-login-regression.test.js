import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  CLOUD_RECOVERY_REASONS,
  decideSync,
  isPristineLocalSnapshot,
  makeCloudPayload,
  payloadHash
} from '../src/platform/cloudSaveModel.js'
import { adoptCloudAuthoritatively, establishInitialCloud } from '../src/platform/cloudSyncV2.js'

function payload(value) {
  return makeCloudPayload({
    learning: { profiles: { p1: { name: 'P1', state: { value } } } },
    gameEnvelope: { formatVersion: 2, gameByProfile: { p1: { value } } },
    learningRewardEnvelope: { version: 1, byProfile: { p1: {} } },
    capturedAt: '2026-09-09T00:00:00.000Z'
  })
}

function pristineEvidence({ baseline, current, hadPersistedLocalAtBoot = false }) {
  return isPristineLocalSnapshot({
    hadPersistedLocalAtBoot,
    pristineLocalHash: payloadHash(baseline),
    localHash: payloadHash(current)
  })
}

test('clean boot with no LOCAL progress remains pristine and pulls existing CLOUD without a recovery candidate', async () => {
  const localPayload = payload('fresh-default')
  const cloudPayload = payload('existing-cloud')
  const freshDevice = pristineEvidence({ baseline: localPayload, current: localPayload })
  assert.equal(freshDevice, true)

  const decision = decideSync({
    localHash: payloadHash(localPayload),
    cloud: { revision: 7, payload: cloudPayload },
    freshDevice
  })
  assert.equal(decision.action, 'pull')

  const order = []
  let recoveryWrites = 0
  await adoptCloudAuthoritatively({
    decision,
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 7, payload: cloudPayload },
    persistRecoveryCandidate: async () => { recoveryWrites += 1; return { id: 'unexpected' } },
    captureCurrentLocalPayload: () => localPayload,
    applyCloudPayload: (next) => { order.push('apply'); assert.deepEqual(next, cloudPayload) },
    commitSyncMeta: () => order.push('meta')
  })

  assert.equal(recoveryWrites, 0)
  assert.deepEqual(order, ['apply', 'meta'])
})

test('clean boot that gains LOCAL progress before login is no longer pristine and preserves exact LOCAL before CLOUD apply', async () => {
  const pristineBaseline = payload('fresh-default')
  const localPayload = payload('learning-progress-before-login')
  const cloudPayload = payload('existing-cloud')
  const freshDevice = pristineEvidence({ baseline: pristineBaseline, current: localPayload })
  assert.equal(freshDevice, false)

  const decision = decideSync({
    localHash: payloadHash(localPayload),
    cloud: { revision: 8, payload: cloudPayload },
    freshDevice
  })
  assert.equal(decision.action, 'recover-pull')
  assert.equal(decision.recoveryReason, CLOUD_RECOVERY_REASONS.NO_TRUSTED_BASE)

  const order = []
  let persisted = null
  await adoptCloudAuthoritatively({
    decision,
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 8, payload: cloudPayload },
    persistRecoveryCandidate: async (candidate) => {
      order.push('persist')
      persisted = candidate
      return { id: 'candidate-pre-login-progress' }
    },
    captureCurrentLocalPayload: () => localPayload,
    applyCloudPayload: (next) => { order.push('apply'); assert.deepEqual(next, cloudPayload) },
    commitSyncMeta: () => order.push('meta')
  })

  assert.deepEqual(order, ['persist', 'apply', 'meta'])
  assert.deepEqual(persisted.localPayload, localPayload)
  assert.deepEqual(persisted.cloudPayload, cloudPayload)
  assert.equal(persisted.localHash, payloadHash(localPayload))
  assert.equal(persisted.cloudRevision, 8)
})

test('pre-login LOCAL progress fails closed when recovery persistence fails', async () => {
  const pristineBaseline = payload('fresh-default')
  const localPayload = payload('must-survive-before-login')
  const cloudPayload = payload('existing-cloud')
  const freshDevice = pristineEvidence({ baseline: pristineBaseline, current: localPayload })
  const decision = decideSync({
    localHash: payloadHash(localPayload),
    cloud: { revision: 9, payload: cloudPayload },
    freshDevice
  })
  assert.equal(decision.action, 'recover-pull')

  let applied = false
  let metaCommitted = false
  await assert.rejects(() => adoptCloudAuthoritatively({
    decision,
    localPayload,
    localHash: payloadHash(localPayload),
    cloud: { revision: 9, payload: cloudPayload },
    persistRecoveryCandidate: async () => { throw new Error('recovery unavailable') },
    captureCurrentLocalPayload: () => localPayload,
    applyCloudPayload: () => { applied = true },
    commitSyncMeta: () => { metaCommitted = true }
  }), /recovery unavailable/)

  assert.equal(applied, false)
  assert.equal(metaCommitted, false)
})

test('initial INSERT race reclassification uses the same sync-time pristine evidence', async () => {
  const pristineBaseline = payload('fresh-default')
  const localPayload = payload('progress-before-login')
  const cloudPayload = payload('other-device-cloud')
  const freshDevice = pristineEvidence({ baseline: pristineBaseline, current: localPayload })
  assert.equal(freshDevice, false)

  const result = await establishInitialCloud({
    localPayload,
    localHash: payloadHash(localPayload),
    insertMainSave: async () => { throw new Error('duplicate key') },
    fetchMainSave: async () => ({ revision: 1, payload: cloudPayload }),
    freshDevice
  })

  assert.equal(result.created, false)
  assert.equal(result.decision.action, 'recover-pull')
  assert.equal(result.decision.recoveryReason, CLOUD_RECOVERY_REASONS.NO_TRUSTED_BASE)
})

test('runtime wiring has no module-load fresh authority and passes one sync-time proof to direct and INSERT-race classification', () => {
  const model = fs.readFileSync(new URL('../src/platform/cloudSaveModel.js', import.meta.url), 'utf8')
  const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(model, /FRESH_DEVICE_AT_BOOT/)
  assert.match(model, /freshDevice = false/)
  assert.match(shell, /const freshDevice = currentLocalIsPristine\(localHash\)/)
  assert.match(shell, /decideSync\(\{ localHash, meta, cloud, freshDevice \}\)/)
  assert.match(shell, /establishInitialCloud\(\{[\s\S]*?localPayload,[\s\S]*?localHash,[\s\S]*?meta,[\s\S]*?insertMainSave,[\s\S]*?fetchMainSave,[\s\S]*?freshDevice[\s\S]*?\}\)/)
})
