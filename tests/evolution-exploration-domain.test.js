import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EVOLUTION_TRANSITIONS,
  confirmEvolution,
  evolveAfterLevelUp,
  evolveWithStone,
  evolutionTriggerStatus,
  getEvolutionTransition,
  normalizePendingEvolution,
  qualifyMaxLevelHeldItemEvolution
} from '../src/game/evolutionDomain.js'
import {
  EVOLUTION_ITEM_RATE,
  EXPLORATION_COST,
  eligibleEvolutionItemsForArea,
  grantBossRegionalEvolutionItem,
  performEvolutionExploration
} from '../src/game/explorationDomain.js'
import {
  BURST_TARGET_IDS,
  CANONICAL_SPECIAL_IDENTITIES,
  GIGA_TARGET_IDS,
  SPECIAL_FORM_EFFECTS,
  activateSpecialForm,
  restoreHpAfterSpecialForm,
  specialFormActivationStatus,
  transformHpForSpecialForm
} from '../src/game/specialFormsDomain.js'

function baseGame(monster) {
  return {
    box: { one: { instanceId: 'one', xp: 77, heldItemId: null, evolutionReady: false, pendingEvolution: null, ...monster } },
    dex: { seen: {}, caught: {} },
    evolutionDiscoveries: {},
    evolutionItems: { stones: {}, heldItems: {} }
  }
}

test('canonical evolution master is exactly 155 active stable-ID transitions', () => {
  assert.equal(EVOLUTION_TRANSITIONS.length, 155)
  const methods = Object.groupBy(EVOLUTION_TRANSITIONS, (row) => row.method)
  assert.equal(methods.level.length, 123)
  assert.equal(methods.stone.length, 21)
  assert.equal(methods.held_item_levelup.length, 11)
  const areas = Object.groupBy(EVOLUTION_TRANSITIONS, (row) => row.area)
  assert.deepEqual([1, 2, 3, 4].map((area) => areas[area].length), [36, 42, 43, 34])
  assert.equal(new Set(EVOLUTION_TRANSITIONS.map((row) => row.fromSpeciesId)).size, 155)
  for (const row of EVOLUTION_TRANSITIONS) {
    for (const id of [row.fromSpeciesId, row.toSpeciesId]) {
      const no = Number(id.slice(1))
      assert.ok(no >= 1 && no <= 238, id)
      assert.notEqual(id, 'm239')
    }
  }
  assert.deepEqual(getEvolutionTransition('m001'), {
    area: 1, fromSpeciesId: 'm001', toSpeciesId: 'm002', method: 'level', level: 17
  })
})

test('D-030 level-up creates deterministic readiness and confirm mutates species exactly once', () => {
  const game = baseGame({ speciesId: 'm001', level: 40 })
  const notLevelUp = evolutionTriggerStatus(game.box.one, game, { trigger: 'level_up', previousLevel: 40, newLevel: 40 })
  assert.equal(notLevelUp.ready, false)
  assert.equal(notLevelUp.reason, 'ACTUAL_LEVEL_UP_REQUIRED')

  const qualified = evolveAfterLevelUp(game, { instanceId: 'one', previousLevel: 16, newLevel: 40, operationId: 'xp-event-1' })
  assert.equal(qualified.ok, true)
  assert.equal(qualified.game.box.one.instanceId, 'one')
  assert.equal(qualified.game.box.one.speciesId, 'm001')
  assert.equal(qualified.game.box.one.level, 40)
  assert.equal(qualified.game.box.one.xp, 77)
  assert.equal(qualified.game.box.one.evolutionReady, true)
  assert.equal(qualified.pendingEvolution.fromSpeciesId, 'm001')
  assert.equal(qualified.pendingEvolution.toSpeciesId, 'm002')
  assert.equal(qualified.pendingEvolution.qualificationId, 'evo:xp-event-1:one:m001->m002')
  assert.equal(qualified.game.evolutionDiscoveries.m002, undefined)

  const replay = evolveAfterLevelUp(qualified.game, { instanceId: 'one', previousLevel: 16, newLevel: 40, operationId: 'xp-event-1' })
  assert.equal(replay.ok, true)
  assert.equal(replay.alreadyQualified, true)
  assert.equal(replay.pendingEvolution.qualificationId, qualified.pendingEvolution.qualificationId)
  assert.equal(replay.game.box.one.speciesId, 'm001')

  const confirmed = confirmEvolution(qualified.game, { instanceId: 'one', qualificationId: qualified.pendingEvolution.qualificationId })
  assert.equal(confirmed.ok, true)
  assert.equal(confirmed.game.box.one.instanceId, 'one')
  assert.equal(confirmed.game.box.one.speciesId, 'm002')
  assert.equal(confirmed.game.box.one.level, 40)
  assert.equal(confirmed.game.box.one.xp, 77)
  assert.equal(confirmed.game.dex.seen.m002, true)
  assert.equal(confirmed.game.dex.caught.m002, true)
  assert.equal(confirmed.game.evolutionDiscoveries.m002, true)
  assert.equal(confirmed.nextPendingEvolution?.fromSpeciesId, 'm002', 'delayed high-level stage1 confirm creates a separate stage2 token')
  assert.equal(confirmed.nextPendingEvolution?.toSpeciesId, 'm003')
  assert.equal(confirmed.game.box.one.speciesId, 'm002', 'one confirmation performs at most one species mutation')
  assert.equal(confirmed.game.evolutionDiscoveries.m003, undefined)

  const duplicateConfirm = confirmEvolution(confirmed.game, { instanceId: 'one', qualificationId: qualified.pendingEvolution.qualificationId })
  assert.equal(duplicateConfirm.ok, true)
  assert.equal(duplicateConfirm.alreadyApplied, true)
  assert.equal(duplicateConfirm.game.box.one.speciesId, 'm002')
})

test('D-030 held-item qualification requires a real level-up, persists after item changes, and does not consume the held item', () => {
  const game = baseGame({ speciesId: 'm058', level: 23, heldItemId: null })
  const equippedOnly = evolutionTriggerStatus({ ...game.box.one, heldItemId: 'emberwick' }, game, { trigger: 'level_up', previousLevel: 23, newLevel: 23 })
  assert.equal(equippedOnly.ready, false)

  game.box.one.heldItemId = 'emberwick'
  game.box.one.level = 24
  const qualified = evolveAfterLevelUp(game, { instanceId: 'one', previousLevel: 23, newLevel: 24, operationId: 'held-lvup-1' })
  assert.equal(qualified.ok, true)
  assert.equal(qualified.game.box.one.speciesId, 'm058')
  assert.equal(qualified.pendingEvolution.method, 'held_item_levelup')
  assert.equal(qualified.pendingEvolution.itemId, 'emberwick')

  const changedAfterQualification = structuredClone(qualified.game)
  changedAfterQualification.box.one.heldItemId = null
  const persisted = normalizePendingEvolution(changedAfterQualification.box.one)
  assert.equal(persisted.qualificationId, qualified.pendingEvolution.qualificationId)

  const confirmed = confirmEvolution(changedAfterQualification, { instanceId: 'one', qualificationId: qualified.pendingEvolution.qualificationId })
  assert.equal(confirmed.ok, true)
  assert.equal(confirmed.game.box.one.speciesId, 'm059')
  assert.equal(confirmed.game.box.one.heldItemId, null)

  const keptItemGame = baseGame({ speciesId: 'm058', level: 24, heldItemId: 'emberwick' })
  const keptQualified = evolveAfterLevelUp(keptItemGame, { instanceId: 'one', previousLevel: 23, newLevel: 24, operationId: 'held-lvup-2' })
  const keptConfirmed = confirmEvolution(keptQualified.game, { instanceId: 'one', qualificationId: keptQualified.pendingEvolution.qualificationId })
  assert.equal(keptConfirmed.game.box.one.heldItemId, 'emberwick', 'held-item evolution retains the equipped item')
})

test('D-030 Lv100 held-item recovery creates readiness only and still requires explicit confirmation', () => {
  const game = baseGame({ speciesId: 'm058', level: 100, heldItemId: 'emberwick' })
  const recovered = qualifyMaxLevelHeldItemEvolution(game, { instanceId: 'one' })
  assert.equal(recovered.ok, true)
  assert.equal(recovered.game.box.one.speciesId, 'm058')
  assert.equal(recovered.pendingEvolution.qualificationKind, 'max-level-held-item-recovery')
  const replay = qualifyMaxLevelHeldItemEvolution(recovered.game, { instanceId: 'one' })
  assert.equal(replay.ok, true)
  assert.equal(replay.alreadyQualified, true)
  assert.equal(replay.pendingEvolution.qualificationId, recovered.pendingEvolution.qualificationId)

  const confirmed = confirmEvolution(recovered.game, { instanceId: 'one', qualificationId: recovered.pendingEvolution.qualificationId })
  assert.equal(confirmed.ok, true)
  assert.equal(confirmed.game.box.one.speciesId, 'm059')
})

test('stone evolution is manual and consumes exactly one owned stone', () => {
  const game = baseGame({ speciesId: 'm026', level: 30 })
  game.evolutionItems.stones.thunder = 2
  const automatic = evolutionTriggerStatus(game.box.one, game, { trigger: 'level_up', previousLevel: 29, newLevel: 30 })
  assert.equal(automatic.ready, false)
  assert.equal(automatic.reason, 'STONE_USE_REQUIRED')
  const evolved = evolveWithStone(game, { instanceId: 'one', itemId: 'thunder', operationId: 'stone-use-1' })
  assert.equal(evolved.ok, true)
  assert.equal(evolved.game.box.one.speciesId, 'm027')
  assert.equal(evolved.game.evolutionItems.stones.thunder, 1)
  const replay = evolveWithStone(evolved.game, { instanceId: 'one', itemId: 'thunder', operationId: 'stone-use-1' })
  assert.equal(replay.ok, true)
  assert.equal(replay.alreadyApplied, true)
  assert.equal(replay.game.evolutionItems.stones.thunder, 1)
})

test('exploration costs 5, uses 80/20, and keeps pity isolated per area', () => {
  assert.equal(EXPLORATION_COST, 5)
  assert.equal(EVOLUTION_ITEM_RATE, 0.20)
  let game = { explorePoint: 30, explorationPityMissesByArea: { 2: 3 }, evolutionItems: { stones: {}, heldItems: {} } }
  for (let i = 1; i <= 5; i += 1) {
    const miss = performEvolutionExploration(game, {
      areaId: 1,
      unlockedAreaIds: [1, 2],
      rng: () => 0.8,
      operationId: `miss-${i}`
    })
    assert.equal(miss.ok, true)
    assert.equal(miss.result.kind, 'material')
    game = miss.game
  }
  assert.equal(game.explorePoint, 5)
  assert.equal(game.explorationPityMissesByArea[1], 5)
  assert.equal(game.explorationPityMissesByArea[2], 3)

  const needsChoice = performEvolutionExploration(game, { areaId: 1, unlockedAreaIds: [1, 2], operationId: 'pity-6' })
  assert.equal(needsChoice.ok, false)
  assert.equal(needsChoice.reason, 'PITY_CHOICE_REQUIRED')
  assert.equal(needsChoice.game.explorePoint, 5)

  const chosen = performEvolutionExploration(game, {
    areaId: 1,
    unlockedAreaIds: [1, 2],
    choiceItemId: 'thunder',
    operationId: 'pity-6'
  })
  assert.equal(chosen.ok, true)
  assert.equal(chosen.result.source, 'pity')
  assert.equal(chosen.game.explorePoint, 0)
  assert.equal(chosen.game.evolutionItems.stones.thunder, 1)
  assert.equal(chosen.game.explorationPityMissesByArea[1], 0)
  assert.equal(chosen.game.explorationPityMissesByArea[2], 3)
})

test('normal item exploration stacks regional inventory and rejects locked areas', () => {
  const locked = performEvolutionExploration({ explorePoint: 5 }, { areaId: 2, unlockedAreaIds: [1], rng: () => 0.1 })
  assert.equal(locked.ok, false)
  assert.equal(locked.reason, 'AREA_LOCKED')

  const rolls = [0.1, 0]
  const found = performEvolutionExploration({ explorePoint: 5 }, {
    areaId: 2,
    unlockedAreaIds: [1, 2],
    rng: () => rolls.shift(),
    operationId: 'find-a2-1'
  })
  assert.equal(found.ok, true)
  assert.equal(found.result.kind, 'evolution_item')
  assert.equal(found.result.itemId, eligibleEvolutionItemsForArea(2)[0])
})

test('boss regional bonus hook validates eligible item without inventing selection policy', () => {
  const game = { evolutionItems: { stones: {}, heldItems: {} } }
  const unresolved = grantBossRegionalEvolutionItem(game, { areaId: 3, operationId: 'boss-a3' })
  assert.equal(unresolved.ok, false)
  assert.equal(unresolved.reason, 'BOSS_ITEM_SELECTION_UNRESOLVED')
  const wrong = grantBossRegionalEvolutionItem(game, { areaId: 3, itemId: 'thunder', operationId: 'boss-a3' })
  assert.equal(wrong.ok, false)
  assert.equal(wrong.reason, 'ITEM_NOT_ELIGIBLE_FOR_AREA')
  const granted = grantBossRegionalEvolutionItem(game, { areaId: 3, itemId: 'ice', operationId: 'boss-a3' })
  assert.equal(granted.ok, true)
  assert.equal(granted.game.evolutionItems.stones.ice, 1)
})

test('special-form targets/effects are canonical and No.142 is Herakureon', () => {
  assert.equal(GIGA_TARGET_IDS.length, 12)
  assert.equal(BURST_TARGET_IDS.length, 8)
  assert.equal(GIGA_TARGET_IDS.filter((id) => BURST_TARGET_IDS.includes(id)).length, 0)
  assert.equal(BURST_TARGET_IDS.includes('m142'), true)
  assert.equal(CANONICAL_SPECIAL_IDENTITIES.m142, 'ヘラクレオン')
  assert.deepEqual(SPECIAL_FORM_EFFECTS.giga, { hp: 1.35, attack: 1.35, defense: 1.35, speed: 1.35, turns: null })
  assert.equal(SPECIAL_FORM_EFFECTS.burst.hp, 2)
  assert.equal(SPECIAL_FORM_EFFECTS.burst.attack, 1.2)
  assert.equal(SPECIAL_FORM_EFFECTS.burst.turns, 3)
  assert.deepEqual(SPECIAL_FORM_EFFECTS.burst.move, { power: 110, accuracy: 95, recoil: 0 })
})

test('special form is one use per party per battle and entitlements are not consumed', () => {
  const game = {
    gigaKeyOwned: true,
    gigaCoreSpecies: { m003: true },
    burstMarks: { m060: true },
    specialDex: { giga: {}, burst: {} }
  }
  const battle = { status: 'fighting', specialUsed: false, playerSpecial: null }
  const giga = activateSpecialForm(game, battle, { speciesId: 'm003', instanceId: 'a', form: 'giga' })
  assert.equal(giga.ok, true)
  assert.equal(giga.battle.specialUsed, true)
  assert.equal(giga.game.specialDex.giga.m003, true)
  assert.equal(giga.game.gigaKeyOwned, true)
  assert.equal(giga.game.gigaCoreSpecies.m003, true)

  const burstAfterGiga = specialFormActivationStatus(giga.game, giga.battle, 'm060', 'burst')
  assert.equal(burstAfterGiga.activatable, false)
  assert.equal(burstAfterGiga.reason, 'SPECIAL_ALREADY_USED')
})

test('special-form HP conversion preserves ratio and never revives 0 HP', () => {
  assert.deepEqual(transformHpForSpecialForm(50, 100, 'giga'), { currentHp: 68, maxHp: 135 })
  assert.deepEqual(transformHpForSpecialForm(50, 100, 'burst'), { currentHp: 100, maxHp: 200 })
  assert.deepEqual(transformHpForSpecialForm(0, 100, 'burst'), { currentHp: 0, maxHp: 200 })
  assert.deepEqual(restoreHpAfterSpecialForm(74, 200, 100), { currentHp: 37, maxHp: 100 })
  assert.deepEqual(restoreHpAfterSpecialForm(0, 200, 100), { currentHp: 0, maxHp: 100 })
})
