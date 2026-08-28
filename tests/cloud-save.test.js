import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { decideSync, makeCloudPayload, payloadHash } from '../src/platform/cloudSaveModel.js'
import { activeSpeciesCount, createAllClearGameFixture, createEvolutionTestGameFixture } from '../src/platform/testFixtures.js'
import { EVOLUTION_TRANSITIONS } from '../src/game/evolutionDomain.js'
import { SPECIES } from '../src/game/content.js'

function payload(value, capturedAt = '2026-08-28T00:00:00.000Z') {
  return makeCloudPayload({ learning: { profiles: { p1: { name: 'P1', state: { value } } } }, gameEnvelope: { formatVersion: 2, gameByProfile: {} }, capturedAt })
}

test('cloud payload hash is deterministic across object key order', () => {
  assert.equal(payloadHash({ b: 2, a: { y: 2, x: 1 } }), payloadHash({ a: { x: 1, y: 2 }, b: 2 }))
})

test('cloud payload hash ignores capturedAt bookkeeping time', () => {
  assert.equal(payloadHash(payload('same', '2026-08-28T00:00:00.000Z')), payloadHash(payload('same', '2026-08-29T12:34:56.000Z')))
})

test('sync decision pulls only when local has no unsynced changes', () => {
  const oldPayload = payload('old')
  const localHash = payloadHash(oldPayload)
  const meta = { revision: 2, hash: localHash }
  const cloud = { revision: 3, payload: payload('new') }
  assert.equal(decideSync({ localHash, meta, cloud }).action, 'pull')
  assert.equal(decideSync({ localHash: payloadHash(payload('local-change')), meta, cloud }).action, 'conflict')
})

test('sync decision pushes local change when cloud revision is unchanged', () => {
  const base = payload('base')
  const meta = { revision: 4, hash: payloadHash(base) }
  const cloud = { revision: 4, payload: base }
  assert.equal(decideSync({ localHash: payloadHash(payload('changed')), meta, cloud }).action, 'push')
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

test('shared Supabase schema is auth-owned and does not grant anon access', () => {
  const sql = fs.readFileSync(new URL('../infra/shared-supabase/app-save-hub.sql', import.meta.url), 'utf8')
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /auth\.uid\(\)\) = user_id/)
  assert.doesNotMatch(sql, /grant[^;]+to anon/i)
  assert.match(sql, /primary key \(user_id, app_id, slot_id\)/i)
})
