import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { makeCloudPayload, payloadHash } from '../src/platform/cloudSaveModel.js'
import { establishInitialCloud } from '../src/platform/cloudSyncV2.js'

function payload(value) {
  return makeCloudPayload({
    learning: { profiles: { p1: { name: 'P1', state: { value } } } },
    gameEnvelope: { formatVersion: 2, gameByProfile: { p1: {} } },
    learningRewardEnvelope: { version: 1, byProfile: { p1: {} } },
    capturedAt: '2026-09-07T00:00:00.000Z'
  })
}

test('initial cloud creation returns the inserted durable row without a second read', async () => {
  const localPayload = payload('local')
  let reads = 0
  const result = await establishInitialCloud({
    localPayload,
    localHash: payloadHash(localPayload),
    insertMainSave: async () => ({ revision: 1, payload: localPayload }),
    fetchMainSave: async () => { reads += 1; return null }
  })

  assert.equal(result.created, true)
  assert.equal(result.row.revision, 1)
  assert.equal(reads, 0)
})

test('initial insert race re-reads a row created by another device and re-enters D-032 authority', async () => {
  const localPayload = payload('local-progress')
  const cloudPayload = payload('other-device-progress')
  const duplicate = new Error('duplicate key')

  const result = await establishInitialCloud({
    localPayload,
    localHash: payloadHash(localPayload),
    insertMainSave: async () => { throw duplicate },
    fetchMainSave: async () => ({ revision: 1, payload: cloudPayload }),
    freshDevice: false
  })

  assert.equal(result.created, false)
  assert.equal(result.insertError, duplicate)
  assert.equal(result.decision.action, 'recover-pull')
  assert.equal(result.cloud.revision, 1)
})

test('ambiguous fulfilled insert with no row also re-reads CLOUD instead of assuming creation failed', async () => {
  const localPayload = payload('same')
  const result = await establishInitialCloud({
    localPayload,
    localHash: payloadHash(localPayload),
    insertMainSave: async () => null,
    fetchMainSave: async () => ({ revision: 1, payload: payload('same') }),
    freshDevice: false
  })

  assert.equal(result.created, false)
  assert.equal(result.decision.action, 'adopt')
})

test('fresh device losing an initial insert race pulls the new CLOUD without creating fake local divergence', async () => {
  const localPayload = payload('fresh-default')
  const result = await establishInitialCloud({
    localPayload,
    localHash: payloadHash(localPayload),
    insertMainSave: async () => { throw new Error('duplicate key') },
    fetchMainSave: async () => ({ revision: 1, payload: payload('other-device') }),
    freshDevice: true
  })

  assert.equal(result.decision.action, 'pull')
})

test('initial insert failure remains fail-closed when no authoritative CLOUD can be re-read', async () => {
  const localPayload = payload('must-stay-local')
  const original = new Error('network failed')

  await assert.rejects(() => establishInitialCloud({
    localPayload,
    localHash: payloadHash(localPayload),
    insertMainSave: async () => { throw original },
    fetchMainSave: async () => null,
    freshDevice: false
  }), (error) => error === original)
})

test('CloudAccountShell routes push-new ambiguity back through establishInitialCloud and does not revive save-choice copy', () => {
  const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')
  assert.match(shell, /decision\.action === 'push-new'/)
  assert.match(shell, /establishInitialCloud\(\{[\s\S]*insertMainSave,[\s\S]*fetchMainSave[\s\S]*\}\)/)
  assert.match(shell, /initial\.decision/)
  assert.match(shell, /decision\.action === 'pull' \|\| decision\.action === 'recover-pull'/)
  assert.doesNotMatch(shell, /保存確認/)
  assert.match(shell, /同期保留/)
})
