import test from 'node:test'
import assert from 'node:assert/strict'

import { speciesOf } from '../src/game/content.js'
import {
  BALANCE_VERSION,
  buildEnemyPlan,
  combatPowerFromStats,
  referencePower,
  statsFromBase
} from '../src/game/balance.js'

const monster = (instanceId, speciesId, level) => ({ instanceId, speciesId, level, xp: 0, heldItemId: null, caughtAt: 1 })

function gameWith(monsters, team = null) {
  const box = Object.fromEntries(monsters.map((entry) => [entry.instanceId, entry]))
  return { box, team: team || monsters.slice(0, 3).map((entry) => entry.instanceId) }
}

test('level stats use species base values and grow monotonically through level 100', () => {
  const base = { hp: 48, attack: 25, defense: 20, speed: 24 }
  const lv5 = statsFromBase(base, 5)
  const lv50 = statsFromBase(base, 50)
  const lv100 = statsFromBase(base, 100)
  assert.deepEqual(lv5, { hp: 19, attack: 7, defense: 7, speed: 7 })
  for (const key of ['hp', 'attack', 'defense', 'speed']) {
    assert.ok(lv50[key] > lv5[key])
    assert.ok(lv100[key] > lv50[key])
  }
})

test('combat power rises when durability or offense rises', () => {
  const normal = combatPowerFromStats({ hp: 80, attack: 40, defense: 30, speed: 30 })
  const tank = combatPowerFromStats({ hp: 100, attack: 40, defense: 50, speed: 30 })
  const striker = combatPowerFromStats({ hp: 80, attack: 60, defense: 30, speed: 50 })
  assert.ok(tank > normal)
  assert.ok(striker > normal)
})

test('reference power uses team and roster core instead of one selected monster only', () => {
  const game = gameWith([
    monster('a', 'starter-fire-1', 80),
    monster('b', 'wild-grass-1', 20),
    monster('c', 'wild-water-1', 20),
    monster('d', 'wild-electric-1', 20),
    monster('e', 'wild-bug-1', 20)
  ], ['a', 'b', 'c'])
  const reference = referencePower(game, speciesOf)
  const solo = referencePower(gameWith([monster('a', 'starter-fire-1', 80)], ['a']), speciesOf)
  assert.ok(reference < solo)
  assert.ok(reference > 1)
})

test('story boss locks first encounter plan and normal rematch does not chase player growth', () => {
  const stage = { id: 'boss-test', enemySpeciesId: 'wild-stone-2', bossRank: 'A' }
  const firstGame = gameWith([monster('a', 'starter-fire-2', 25)])
  const first = buildEnemyPlan(firstGame, stage, speciesOf)
  assert.equal(first.mode, 'boss-new')
  assert.equal(first.snapshot.balanceVersion, BALANCE_VERSION)

  const grownGame = gameWith([monster('a', 'starter-fire-3', 80)])
  const rematch = buildEnemyPlan(grownGame, stage, speciesOf, first.snapshot)
  assert.equal(rematch.mode, 'boss-locked')
  assert.equal(rematch.level, first.level)
  assert.deepEqual(rematch.statMultipliers, first.statMultipliers)
})

test('challenge rematch ignores locked snapshot and rescales to current power', () => {
  const stage = { id: 'boss-test', enemySpeciesId: 'wild-stone-2', bossRank: 'A' }
  const firstGame = gameWith([monster('a', 'starter-fire-2', 25)])
  const first = buildEnemyPlan(firstGame, stage, speciesOf)
  const grownGame = gameWith([monster('a', 'starter-fire-3', 80)])
  const challenge = buildEnemyPlan(grownGame, stage, speciesOf, first.snapshot, { challenge: true })
  assert.equal(challenge.mode, 'boss-challenge')
  assert.ok(challenge.level > first.level)
  assert.equal(challenge.snapshot, null)
})
