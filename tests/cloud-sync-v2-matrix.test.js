import test from 'node:test'
import assert from 'node:assert/strict'

import { CLOUD_RECOVERY_REASONS, decideSync, makeCloudPayload, payloadHash } from '../src/platform/cloudSaveModel.js'

function p(value) {
  return makeCloudPayload({
    learning: { profiles: { p1: { name: 'P1', state: { value } } } },
    gameEnvelope: { formatVersion: 2, gameByProfile: { p1: { value } } },
    learningRewardEnvelope: { version: 1, byProfile: { p1: { value } } },
    capturedAt: '2026-09-07T00:00:00.000Z'
  })
}

const base = p('base')
const baseHash = payloadHash(base)
const meta = { revision: 5, hash: baseHash }

test('D-032 canonical sync matrix is deterministic and never asks a child to resolve a conflict', () => {
  const cases = [
    { name: 'cloud empty initializes from local', args: { localHash: baseHash, meta, cloud: null }, action: 'push-new' },
    { name: 'fresh device pulls existing cloud', args: { localHash: payloadHash(p('default')), cloud: { revision: 5, payload: base }, freshDevice: true }, action: 'pull' },
    { name: 'equal local/cloud with trusted base is noop', args: { localHash: baseHash, meta, cloud: { revision: 5, payload: base } }, action: 'noop' },
    { name: 'local-only change pushes', args: { localHash: payloadHash(p('local')), meta, cloud: { revision: 5, payload: base } }, action: 'push' },
    { name: 'cloud-only advance pulls', args: { localHash: baseHash, meta, cloud: { revision: 6, payload: p('cloud') } }, action: 'pull' },
    { name: 'both advance preserves local then pulls cloud', args: { localHash: payloadHash(p('local')), meta, cloud: { revision: 6, payload: p('cloud') } }, action: 'recover-pull', reason: CLOUD_RECOVERY_REASONS.LOCAL_AND_CLOUD_DIVERGED },
    { name: 'no trusted base on non-fresh device preserves local', args: { localHash: payloadHash(p('local')), cloud: { revision: 5, payload: base }, freshDevice: false }, action: 'recover-pull', reason: CLOUD_RECOVERY_REASONS.NO_TRUSTED_BASE },
    { name: 'cloud revision regression preserves divergent local', args: { localHash: payloadHash(p('local')), meta: { revision: 6, hash: payloadHash(p('trusted-newer')) }, cloud: { revision: 5, payload: base } }, action: 'recover-pull', reason: CLOUD_RECOVERY_REASONS.CLOUD_REVISION_REGRESSION }
  ]

  for (const entry of cases) {
    const decision = decideSync(entry.args)
    assert.equal(decision.action, entry.action, entry.name)
    if (entry.reason) assert.equal(decision.recoveryReason, entry.reason, entry.name)
    assert.ok(!['merge', 'conflict'].includes(decision.action), entry.name)
  }
})
