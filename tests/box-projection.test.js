import test from 'node:test'
import assert from 'node:assert/strict'

import { groupBoxByFamily, projectBoxMonsters } from '../src/game/boxProjection.js'

function monster(instanceId, speciesId, level, pending = false) {
  return {
    instanceId,
    speciesId,
    level,
    xp: 0,
    ...(pending ? { pendingEvolution: { qualificationId: `q:${instanceId}` } } : {})
  }
}

test('D-030 evolution sort groups families, stages and same-species duplicates deterministically', () => {
  const game = {
    box: {
      a3: monster('a3', 'm003', 50),
      b1: monster('b1', 'm004', 15),
      a1low: monster('a1low', 'm001', 7),
      a2: monster('a2', 'm002', 24, true),
      a1high: monster('a1high', 'm001', 12)
    },
    team: ['b1', 'a1low']
  }
  const before = structuredClone(game)
  const projected = projectBoxMonsters(game, { sort: 'evolution' })
  assert.deepEqual(projected.map((entry) => entry.instanceId), ['a1high', 'a1low', 'a2', 'a3', 'b1'])
  const groups = groupBoxByFamily(projected)
  assert.equal(groups.length, 2)
  assert.deepEqual(groups[0].monsters.map((entry) => entry.instanceId), ['a1high', 'a1low', 'a2', 'a3'])
  assert.deepEqual(game, before, 'projection must not mutate BOX or Team')
})

test('D-030 level sort is secondary and preserves duplicate instances', () => {
  const game = {
    box: {
      low: monster('low', 'm001', 5),
      highA: monster('highA', 'm001', 30),
      highB: monster('highB', 'm007', 30)
    },
    team: ['low']
  }
  const projected = projectBoxMonsters(game, { sort: 'level' })
  assert.deepEqual(projected.map((entry) => entry.instanceId), ['highA', 'highB', 'low'])
  assert.equal(projected.length, 3)
  assert.deepEqual(game.team, ['low'])
})

test('D-030 evolvable-only is an independent view filter and never falls back to all monsters', () => {
  const game = {
    box: {
      ready: monster('ready', 'm001', 17, true),
      waiting: monster('waiting', 'm004', 5)
    },
    team: ['waiting']
  }
  const canEvolve = (entry) => !!entry.pendingEvolution
  const filtered = projectBoxMonsters(game, { sort: 'evolution', evolvableOnly: true, canEvolve })
  assert.deepEqual(filtered.map((entry) => entry.instanceId), ['ready'])
  const empty = projectBoxMonsters({ ...game, box: { waiting: game.box.waiting } }, { sort: 'evolution', evolvableOnly: true, canEvolve })
  assert.deepEqual(empty, [])
  assert.deepEqual(game.team, ['waiting'])
})
