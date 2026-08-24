import test from 'node:test'
import assert from 'node:assert/strict'

import { speciesOf } from '../src/game/content.js'
import {
  BALANCE_VERSION,
  NORMAL_REPEAT_CAP,
  battleXpForStage,
  bossReferencePower,
  buildEnemyPlan,
  combatPowerFromStats,
  normalReferencePower,
  referencePower,
  statsFromBase
} from '../src/game/balance.js'

const monster = (instanceId, speciesId, level) => ({ instanceId, speciesId, level, xp: 0, heldItemId: null, evolutionReady: false, caughtAt: 1 })

function gameWith(monsters, team = null) {
  const box = Object.fromEntries(monsters.map((entry) => [entry.instanceId, entry]))
  return { box, team: team || monsters.slice(0, 3).map((entry) => entry.instanceId), normalStageSnapshots: {} }
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

test('normal reference uses current team so strong boxed monsters do not block training', () => {
  const game = gameWith([
    monster('a', 'starter-fire-1', 20),
    monster('b', 'wild-grass-1', 20),
    monster('c', 'wild-water-1', 20),
    monster('boxed', 'starter-fire-3', 80)
  ], ['a', 'b', 'c'])
  const normalRef = normalReferencePower(game, speciesOf)
  const withoutBoxed = normalReferencePower(gameWith([
    monster('a', 'starter-fire-1', 20),
    monster('b', 'wild-grass-1', 20),
    monster('c', 'wild-water-1', 20)
  ], ['a', 'b', 'c']), speciesOf)
  assert.equal(normalRef, withoutBoxed)
  assert.equal(referencePower(game, speciesOf), normalRef)
})

test('cleared normal stage caps upward rescaling but never floors a weak training team', () => {
  const stage = { id: 'normal-test', enemySpeciesId: 'wild-grass-1', enemyDifficulty: 'normal' }
  const firstGame = gameWith([monster('a', 'starter-fire-1', 20)])
  const firstReference = normalReferencePower(firstGame, speciesOf)

  const grown = gameWith([monster('a', 'starter-fire-3', 80)])
  grown.normalStageSnapshots[stage.id] = { stageId: stage.id, firstClearReferencePower: firstReference, balanceVersion: BALANCE_VERSION }
  const capped = buildEnemyPlan(grown, stage, speciesOf)
  assert.equal(capped.mode, 'normal-repeat-cap')
  assert.equal(capped.referencePower, firstReference * NORMAL_REPEAT_CAP)
  assert.ok(capped.currentReferencePower > capped.referencePower)

  const weak = gameWith([monster('a', 'wild-bug-1', 5)])
  weak.normalStageSnapshots[stage.id] = { stageId: stage.id, firstClearReferencePower: firstReference, balanceVersion: BALANCE_VERSION }
  const training = buildEnemyPlan(weak, stage, speciesOf)
  assert.equal(training.mode, 'normal-repeat-soft')
  assert.equal(training.referencePower, training.currentReferencePower)
  assert.ok(training.referencePower < firstReference)
})

test('battle XP comes from difficulty/rank tables rather than legacy stage xp', () => {
  assert.equal(battleXpForStage({ enemyDifficulty: 'normal', xp: 1 }), 110)
  assert.equal(battleXpForStage({ enemyDifficulty: 'elite', xp: 9999 }), 165)
  assert.equal(battleXpForStage({ bossRank: 'A', xp: 1 }), 220)
})

test('boss reference keeps a carry floor for Lv80 plus two weak teammates', () => {
  const mixed = gameWith([
    monster('a', 'starter-fire-3', 80),
    monster('b', 'wild-grass-1', 20),
    monster('c', 'wild-water-1', 20)
  ], ['a', 'b', 'c'])
  const strongestOnly = gameWith([monster('a', 'starter-fire-3', 80)], ['a'])
  const bossRef = bossReferencePower(mixed, speciesOf)
  const soloRef = bossReferencePower(strongestOnly, speciesOf)
  assert.ok(bossRef >= soloRef * 0.79, 'mixed team must keep at least the 80% carry floor')
})

test('boss reference resists deliberately weak team when strong monsters are owned', () => {
  const game = gameWith([
    monster('weak1', 'wild-bug-1', 10),
    monster('weak2', 'wild-grass-1', 10),
    monster('weak3', 'wild-water-1', 10),
    monster('strong1', 'starter-fire-3', 70),
    monster('strong2', 'wild-electric-3', 65),
    monster('strong3', 'wild-grass-3', 60)
  ], ['weak1', 'weak2', 'weak3'])
  assert.ok(bossReferencePower(game, speciesOf) > normalReferencePower(game, speciesOf))
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
