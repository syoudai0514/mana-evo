import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BATTLE_STATUS,
  CRITICAL_CHANCE,
  CRITICAL_MULTIPLIER,
  DAMAGE_RANDOM_MAX,
  DAMAGE_RANDOM_MIN,
  STAB_MULTIPLIER,
  canonicalDamage,
  criticalMultiplier,
  damageRandomMultiplier,
  isStatusImmune,
  makeBattleStatus,
  speedOrder,
  statusActionResult,
  statusAttackMultiplier,
  statusEndTurnDamage,
  statusSpeedMultiplier,
  tryApplyBattleStatus,
  wakeSleepOnDamagingHit
} from '../src/game/battleRules.js'

test('canonical damage boundaries match W-102', () => {
  assert.equal(STAB_MULTIPLIER, 1.5)
  assert.equal(CRITICAL_CHANCE, 1 / 16)
  assert.equal(CRITICAL_MULTIPLIER, 1.5)
  assert.equal(DAMAGE_RANDOM_MIN, 0.90)
  assert.equal(DAMAGE_RANDOM_MAX, 1.00)
  assert.equal(canonicalDamage({ level: 20, power: 60, attack: 40, defense: 30, stab: 1.5, type: 0, critical: 1.5, random: 1 }), 0)
  const normal = canonicalDamage({ level: 20, power: 60, attack: 40, defense: 30, stab: 1, type: 1, critical: 1, random: 1 })
  const stab = canonicalDamage({ level: 20, power: 60, attack: 40, defense: 30, stab: 1.5, type: 1, critical: 1, random: 1 })
  assert.ok(stab > normal)
  assert.equal(criticalMultiplier(0), 1.5)
  assert.equal(criticalMultiplier(0.5), 1)
  assert.equal(damageRandomMultiplier(0), 0.90)
  assert.equal(damageRandomMultiplier(1), 1.00)
})

test('speed ties are decided by a roll instead of fixed player priority', () => {
  assert.equal(speedOrder(30, 30, 0.1), 'player')
  assert.equal(speedOrder(30, 30, 0.9), 'enemy')
  assert.equal(speedOrder(31, 30, 0.9), 'player')
  assert.equal(speedOrder(29, 30, 0.1), 'enemy')
})

test('canonical status immunities and stat boundaries are explicit', () => {
  assert.equal(isStatusImmune(['fire'], BATTLE_STATUS.burn), true)
  assert.equal(isStatusImmune(['electric'], BATTLE_STATUS.paralysis), true)
  assert.equal(isStatusImmune(['poison'], BATTLE_STATUS.poison), true)
  assert.equal(isStatusImmune(['steel'], BATTLE_STATUS.poison), true)
  assert.equal(tryApplyBattleStatus(null, BATTLE_STATUS.burn, ['fire']).reason, 'IMMUNE')
  assert.equal(statusAttackMultiplier({ type: BATTLE_STATUS.burn }), 0.7)
  assert.equal(statusSpeedMultiplier({ type: BATTLE_STATUS.paralysis }), 0.5)
  assert.equal(statusEndTurnDamage({ type: BATTLE_STATUS.burn }, 160), 10)
  assert.equal(statusEndTurnDamage({ type: BATTLE_STATUS.poison }, 160), 20)
})

test('sleep lasts 1-3 skipped turns and wakes on a damaging hit', () => {
  assert.equal(makeBattleStatus(BATTLE_STATUS.sleep, { sleepRoll: 0 }).turnsLeft, 1)
  assert.equal(makeBattleStatus(BATTLE_STATUS.sleep, { sleepRoll: 0.99 }).turnsLeft, 3)
  const first = statusActionResult({ type: BATTLE_STATUS.sleep, turnsLeft: 2 }, 1)
  assert.equal(first.canAct, false)
  assert.equal(first.status.turnsLeft, 1)
  const second = statusActionResult(first.status, 1)
  assert.equal(second.canAct, false)
  assert.equal(second.status, null)
  assert.equal(wakeSleepOnDamagingHit({ type: BATTLE_STATUS.sleep, turnsLeft: 3 }, 1), null)
})
