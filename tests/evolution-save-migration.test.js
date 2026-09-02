import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeGameEnvelope } from '../src/game/saveStore.js'
import { createGameState, equipHeldItem, normalizeGameState } from '../src/game/progression.js'
import { makeCloudPayload, payloadHash } from '../src/platform/cloudSaveModel.js'

const DAY = 5100

function singleMonsterGame({ version = 10, instanceId = 'one', speciesId = 'm001', level = 17, heldItemId = null, evolutionReady = false, pendingEvolution = null } = {}) {
  const game = createGameState()
  game.version = version
  game.box = {
    [instanceId]: {
      instanceId,
      speciesId,
      level,
      xp: 12,
      heldItemId,
      evolutionReady,
      pendingEvolution,
      caughtAt: 123456
    }
  }
  game.team = [instanceId]
  game.activeMonsterId = instanceId
  game.dex = { seen: { [speciesId]: true }, caught: { [speciesId]: true } }
  game.activeBattle = null
  return game
}

test('D-030 legacy level source at/above threshold migrates to one deterministic pending token', () => {
  const legacy = singleMonsterGame({ version: 10, speciesId: 'm001', level: 17 })
  const normalized = normalizeGameState(legacy, DAY)
  const pending = normalized.box.one.pendingEvolution
  assert.equal(normalized.version, 11)
  assert.equal(normalized.box.one.speciesId, 'm001')
  assert.equal(pending.fromSpeciesId, 'm001')
  assert.equal(pending.toSpeciesId, 'm002')
  assert.equal(pending.method, 'level')
  assert.equal(pending.qualificationKind, 'migration')
  assert.equal(pending.sourceOperationId, 'migration:v11:one:m001->m002')
  assert.equal(pending.qualificationId, 'evo:migration:v11:one:m001->m002:one:m001->m002')
  assert.equal(normalized.evolutionDiscoveries.m002, undefined)

  const twice = normalizeGameState(normalized, DAY)
  assert.deepEqual(twice, normalized, 'repeated normalization must not generate a new token or semantic drift')
})

test('D-030 legacy held readiness migrates only with matching held-item evidence', () => {
  const withEvidence = normalizeGameState(singleMonsterGame({
    version: 10,
    speciesId: 'm058',
    level: 24,
    heldItemId: 'emberwick',
    evolutionReady: true
  }), DAY)
  assert.equal(withEvidence.box.one.pendingEvolution?.method, 'held_item_levelup')
  assert.equal(withEvidence.box.one.pendingEvolution?.itemId, 'emberwick')
  assert.equal(withEvidence.box.one.pendingEvolution?.qualificationKind, 'migration')

  const noEvidence = normalizeGameState(singleMonsterGame({
    version: 10,
    speciesId: 'm058',
    level: 24,
    heldItemId: null,
    evolutionReady: true
  }), DAY)
  assert.equal(noEvidence.box.one.pendingEvolution, null)
  assert.equal(noEvidence.box.one.evolutionReady, false)
})

test('D-030 malformed or stale pending tokens are rejected and already-evolved species never regress', () => {
  const malformed = singleMonsterGame({
    version: 11,
    speciesId: 'm001',
    level: 17,
    pendingEvolution: {
      qualificationId: 'bad',
      sourceOperationId: 'bad-source',
      fromSpeciesId: 'm001',
      toSpeciesId: 'm099',
      method: 'level',
      qualifiedAtLevel: 17,
      qualificationKind: 'levelup'
    }
  })
  const normalizedMalformed = normalizeGameState(malformed, DAY)
  assert.equal(normalizedMalformed.box.one.pendingEvolution, null)
  assert.equal(normalizedMalformed.box.one.speciesId, 'm001')

  const evolved = normalizeGameState(singleMonsterGame({ version: 10, speciesId: 'm002', level: 20 }), DAY)
  assert.equal(evolved.box.one.speciesId, 'm002')
  assert.notEqual(evolved.box.one.pendingEvolution?.toSpeciesId, 'm002', 'migration never synthesizes a prior-form token')
})

test('D-030 pending token survives profile envelope, JSON backup and cloud payload round-trips with stable hash', () => {
  const profileA = normalizeGameState(singleMonsterGame({ version: 10, speciesId: 'm001', level: 17 }), DAY)
  const profileB = normalizeGameState(singleMonsterGame({ version: 11, instanceId: 'two', speciesId: 'm004', level: 5 }), DAY)
  const envelope = normalizeGameEnvelope({ formatVersion: 2, gameByProfile: { childA: profileA, childB: profileB } }, 'childA')
  const qualificationId = envelope.gameByProfile.childA.box.one.pendingEvolution.qualificationId

  const backupRestore = normalizeGameEnvelope(JSON.parse(JSON.stringify(envelope)), 'childA')
  assert.equal(backupRestore.gameByProfile.childA.box.one.pendingEvolution.qualificationId, qualificationId)
  assert.equal(backupRestore.gameByProfile.childB.box.two.speciesId, 'm004')

  const payload = makeCloudPayload({
    learning: { version: 1, contentVersion: 1, profiles: { childA: { state: {} }, childB: { state: {} } } },
    gameEnvelope: envelope,
    learningRewardEnvelope: { version: 1, byProfile: {} },
    capturedAt: '2026-09-03T00:00:00.000Z'
  })
  const cloudCopy = JSON.parse(JSON.stringify(payload))
  const restoredEnvelope = normalizeGameEnvelope(cloudCopy.gameEnvelope, 'childB')
  assert.equal(restoredEnvelope.gameByProfile.childA.box.one.pendingEvolution.qualificationId, qualificationId)
  const normalizedAgainPayload = { ...cloudCopy, gameEnvelope: restoredEnvelope }
  assert.equal(payloadHash(normalizedAgainPayload), payloadHash(payload), 'no-op cloud round-trip must not create semantic hash drift')
})

test('D-030 equipping the required held item at Lv100 creates recovery readiness but does not evolve automatically', () => {
  const game = normalizeGameState(singleMonsterGame({ version: 11, speciesId: 'm058', level: 100, heldItemId: null }), DAY)
  game.evolutionItems.heldItems.emberwick = 1
  const equipped = equipHeldItem(game, 'one', 'emberwick', DAY)
  assert.equal(equipped.ok, true)
  assert.equal(equipped.game.box.one.speciesId, 'm058')
  assert.equal(equipped.game.box.one.heldItemId, 'emberwick')
  assert.equal(equipped.game.box.one.pendingEvolution?.qualificationKind, 'max-level-held-item-recovery')
  assert.equal(equipped.game.evolutionItems.heldItems.emberwick, undefined, 'equipping moves inventory into the held slot')
})
