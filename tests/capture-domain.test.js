import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CAPTURE_BOUNDARIES,
  CAPTURE_EASE_BANDS,
  DEFAULT_CAPTURE_TUNING,
  GROWTH_SHARD_RULE,
  buildCapturePresentation,
  captureBattleXpRecipients,
  captureEaseCue,
  captureEligibility,
  captureProbability,
  defaultBaseCaptureChance,
  recommendCaptureItem,
  redeemGrowthShards,
  resolveCaptureRoll,
  resolveDuplicateChoice,
  settleCaptureSuccess
} from '../src/game/captureDomain.js'

function gameState() {
  return {
    box: {
      starter: { instanceId: 'starter', speciesId: 'm004', level: 8, xp: 0 }
    },
    team: ['starter'],
    dex: { seen: { m004: true }, caught: { m004: true } },
    captureItems: { star: 3, silver: 2, gold: 2, rainbow: 1 },
    growthShards: 0,
    monstersCaught: 0
  }
}

function battle(overrides = {}) {
  return {
    status: 'fighting',
    captureAttempts: 0,
    enemy: { hp: 50, maxHp: 100, speciesId: 'm001' },
    teamAtStart: ['starter'],
    ...overrides
  }
}

function captured(instanceId = 'caught-1', speciesId = 'm001') {
  return { instanceId, speciesId, level: 5, xp: 0, caughtAt: 1234 }
}

test('capture eligibility is exactly HP <= 50%, max three attempts, and requires an owned ring', () => {
  const game = gameState()
  assert.equal(CAPTURE_BOUNDARIES.eligibilityHpRatio, 0.5)
  assert.equal(CAPTURE_BOUNDARIES.maxAttempts, 3)
  assert.equal(captureEligibility(game, battle()).eligible, true)
  assert.deepEqual(captureEligibility(game, battle({ enemy: { hp: 51, maxHp: 100 } })), { eligible: false, reason: 'HP_TOO_HIGH' })
  assert.deepEqual(captureEligibility(game, battle({ captureAttempts: 3 })), { eligible: false, reason: 'CAPTURE_LIMIT' })
  const empty = structuredClone(game)
  empty.captureItems.star = 0
  assert.deepEqual(captureEligibility(empty, battle()), { eligible: false, reason: 'NO_RING' })
  assert.deepEqual(captureEligibility(game, battle(), 'star', { captureDisabled: true }), { eligible: false, reason: 'CAPTURE_DISABLED' })
})

test('D-029 V1 tuning exposes exact rank values at HP50 and HP0 and interpolates monotonically', () => {
  const expectedAt50 = [0.55, 0.42, 0.28, 0.16, 0.10]
  const expectedAt0 = [0.70, 0.55, 0.38, 0.24, 0.15]
  assert.deepEqual(Object.values(DEFAULT_CAPTURE_TUNING.baseAt50ByRank), expectedAt50)
  assert.deepEqual(Object.values(DEFAULT_CAPTURE_TUNING.lowHpBonusByRank), [0.15, 0.13, 0.10, 0.08, 0.05])

  for (let rank = 1; rank <= 5; rank += 1) {
    const at50 = defaultBaseCaptureChance({ hp: 50, maxHp: 100, catchRank: rank })
    const at25 = defaultBaseCaptureChance({ hp: 25, maxHp: 100, catchRank: rank })
    const at0 = defaultBaseCaptureChance({ hp: 0, maxHp: 100, catchRank: rank })
    assert.equal(at50, expectedAt50[rank - 1])
    assert.equal(at0, expectedAt0[rank - 1])
    assert.ok(at25 > at50)
    assert.ok(at25 < at0)
  }
})

test('canonical ball multipliers and non-rainbow 92% cap remain structural', () => {
  assert.equal(CAPTURE_BOUNDARIES.ringMultipliers.star, 1)
  assert.equal(CAPTURE_BOUNDARIES.ringMultipliers.silver, 1.2)
  assert.equal(CAPTURE_BOUNDARIES.ringMultipliers.gold, 1.5)
  assert.equal(CAPTURE_BOUNDARIES.nonRainbowCap, 0.92)
  assert.equal(captureProbability(0.8, 'star'), 0.8)
  assert.equal(captureProbability(0.8, 'silver'), 0.92)
  assert.equal(captureProbability(0.8, 'gold'), 0.92)
  assert.equal(captureProbability(0, 'rainbow'), 1)
  assert.equal(captureProbability(0.99, 'gold'), 0.92)
})

test('five child-facing capture bands have exact deterministic boundaries', () => {
  assert.deepEqual(CAPTURE_EASE_BANDS.map((band) => band.min), [0.8, 0.6, 0.4, 0.2, 0])
  assert.deepEqual(captureEaseCue(0.1999), { min: 0, level: 1, label: 'かなりつかまえにくい' })
  assert.deepEqual(captureEaseCue(0.2), { min: 0.2, level: 2, label: 'つかまえにくい' })
  assert.deepEqual(captureEaseCue(0.4), { min: 0.4, level: 3, label: 'ふつう' })
  assert.deepEqual(captureEaseCue(0.6), { min: 0.6, level: 4, label: 'つかまえやすい' })
  assert.deepEqual(captureEaseCue(0.8), { min: 0.8, level: 5, label: 'ほとんどつかまる' })
})

test('capture recommendation is inventory-aware, cheapest above 70%, and never auto-picks rainbow', () => {
  const options = [
    { id: 'star', ready: true, owned: 3, chance: 0.7 },
    { id: 'silver', ready: true, owned: 2, chance: 0.84 },
    { id: 'gold', ready: true, owned: 1, chance: 0.92 },
    { id: 'rainbow', ready: true, owned: 1, chance: 1 }
  ]
  assert.equal(recommendCaptureItem(options), 'star')
  assert.equal(recommendCaptureItem(options.map((option) => option.id === 'star' ? { ...option, owned: 0, ready: false } : option)), 'silver')

  const noneAt70 = options.map((option) => option.id === 'star'
    ? { ...option, chance: 0.42 }
    : option.id === 'silver'
      ? { ...option, chance: 0.504 }
      : option.id === 'gold'
        ? { ...option, chance: 0.63 }
        : option)
  assert.equal(recommendCaptureItem(noneAt70), 'gold')
  assert.equal(recommendCaptureItem([{ id: 'rainbow', ready: true, owned: 1, chance: 1 }]), null)
  assert.equal(recommendCaptureItem([{ id: 'rainbow', ready: true, owned: 1, chance: 1 }], { rainbowRecommended: true }), 'rainbow')
})

test('one deterministic success roll decides probability while presentation stays temporal and separate', () => {
  const failed = resolveCaptureRoll({ baseChance: 0.5, itemType: 'star', successRoll: 0.75, failureStars: 3 })
  assert.equal(failed.success, false)
  assert.deepEqual(failed.presentation.frames.map((frame) => frame.type), ['stars', 'stars', 'stars', 'ring_scatter', 'escaped'])
  assert.deepEqual(failed.presentation.frames.slice(0, 3).map((frame) => frame.lit), [1, 2, 3])

  const sameProbabilityDifferentPresentation = resolveCaptureRoll({ baseChance: 0.5, itemType: 'star', successRoll: 0.75, failureStars: 1 })
  assert.equal(sameProbabilityDifferentPresentation.success, failed.success)
  assert.equal(sameProbabilityDifferentPresentation.chance, failed.chance)
  assert.notEqual(sameProbabilityDifferentPresentation.presentation.starCount, failed.presentation.starCount)

  const success = resolveCaptureRoll({ baseChance: 0.5, itemType: 'star', successRoll: 0.25 })
  assert.equal(success.success, true)
  assert.deepEqual(success.presentation.frames.slice(0, 4).map((frame) => frame.lit), [1, 2, 3, 4])
  assert.equal(success.presentation.frames[4].type, 'ring_closed')
  assert.equal(success.presentation.frames[4].rainbow, true)
  assert.equal(success.presentation.frames[5].type, 'caught')

  const rainbow = resolveCaptureRoll({ baseChance: 0, itemType: 'rainbow', successRoll: 1 })
  assert.equal(rainbow.success, true)
})

test('presentation helper never creates four lit stars for a failed capture', () => {
  assert.equal(buildCapturePresentation(false, { failureStars: 99 }).starCount, 3)
})

test('first catch auto-keeps exactly one distinct BOX instance without changing the team', () => {
  const game = gameState()
  const result = settleCaptureSuccess(game, {
    resolutionId: 'battle-1:capture',
    capturedMonster: captured(),
    ringType: 'silver',
    teamAtStart: ['starter']
  })

  assert.equal(result.ok, true)
  assert.equal(result.settlement.duplicate, false)
  assert.equal(result.settlement.status, 'settled')
  assert.equal(result.settlement.choice, 'keep')
  assert.equal(result.game.box['caught-1'].speciesId, 'm001')
  assert.equal(result.game.box['caught-1'].captureRingType, 'silver')
  assert.deepEqual(result.game.team, ['starter'])
  assert.equal(result.game.dex.caught.m001, true)
  assert.equal(result.game.monstersCaught, 1)

  const repeated = settleCaptureSuccess(result.game, {
    resolutionId: 'battle-1:capture',
    capturedMonster: captured('should-not-exist'),
    ringType: 'gold',
    teamAtStart: ['starter']
  })
  assert.equal(repeated.idempotent, true)
  assert.equal(repeated.game.box['should-not-exist'], undefined)
  assert.equal(repeated.game.monstersCaught, 1)
})

test('duplicate capture stays unresolved until keep/support choice and survives reload', () => {
  let game = gameState()
  game.box.existing = captured('existing')
  const pending = settleCaptureSuccess(game, {
    resolutionId: 'battle-2:capture',
    capturedMonster: captured('duplicate-new'),
    ringType: 'gold',
    teamAtStart: ['starter']
  })

  assert.equal(pending.ok, true)
  assert.equal(pending.settlement.duplicate, true)
  assert.equal(pending.settlement.status, 'pending_duplicate_choice')
  assert.equal(pending.game.box['duplicate-new'], undefined)
  assert.equal(pending.game.growthShards, 0)

  const reloaded = JSON.parse(JSON.stringify(pending.game))
  const supported = resolveDuplicateChoice(reloaded, 'battle-2:capture', 'support')
  assert.equal(supported.ok, true)
  assert.equal(supported.game.box['duplicate-new'], undefined)
  assert.equal(supported.game.growthShards, 1)
  assert.equal(supported.settlement.choice, 'support')

  const repeated = resolveDuplicateChoice(supported.game, 'battle-2:capture', 'support')
  assert.equal(repeated.idempotent, true)
  assert.equal(repeated.game.growthShards, 1)
  const conflicting = resolveDuplicateChoice(supported.game, 'battle-2:capture', 'keep')
  assert.equal(conflicting.ok, false)
  assert.equal(conflicting.reason, 'DUPLICATE_ALREADY_SETTLED')
})

test('duplicate keep creates a separate instance and never overwrites the existing monster', () => {
  let game = gameState()
  game.box.existing = captured('existing')
  const pending = settleCaptureSuccess(game, {
    resolutionId: 'battle-3:capture',
    capturedMonster: captured('duplicate-kept'),
    teamAtStart: ['starter']
  })
  const kept = resolveDuplicateChoice(pending.game, 'battle-3:capture', 'keep')
  assert.equal(kept.ok, true)
  assert.equal(kept.game.box.existing.instanceId, 'existing')
  assert.equal(kept.game.box['duplicate-kept'].instanceId, 'duplicate-kept')
  assert.notStrictEqual(kept.game.box.existing, kept.game.box['duplicate-kept'])
  assert.equal(kept.game.growthShards, 0)
})

test('three growth shards grant +30 XP to one selected current-team monster exactly once', () => {
  const game = gameState()
  game.growthShards = 3
  const applyXp = (monster, xp) => ({ monster: { ...monster, xp: monster.xp + xp }, levels: [] })
  const redeemed = redeemGrowthShards(game, {
    redemptionId: 'shard-use-1',
    instanceId: 'starter',
    applyXp
  })
  assert.equal(redeemed.ok, true)
  assert.equal(GROWTH_SHARD_RULE.shardsPerUse, 3)
  assert.equal(GROWTH_SHARD_RULE.xpPerUse, 30)
  assert.equal(redeemed.game.growthShards, 0)
  assert.equal(redeemed.game.box.starter.xp, 30)

  const repeated = redeemGrowthShards(redeemed.game, {
    redemptionId: 'shard-use-1',
    instanceId: 'starter',
    applyXp
  })
  assert.equal(repeated.idempotent, true)
  assert.equal(repeated.game.box.starter.xp, 30)
})

test('growth shards cannot target a BOX monster outside the current team', () => {
  const game = gameState()
  game.growthShards = 3
  game.box.reserve = { instanceId: 'reserve', speciesId: 'm007', level: 5, xp: 0 }
  const blocked = redeemGrowthShards(game, {
    redemptionId: 'shard-use-2',
    instanceId: 'reserve',
    applyXp: (monster, xp) => ({ ...monster, xp: monster.xp + xp })
  })
  assert.equal(blocked.ok, false)
  assert.equal(blocked.reason, 'TARGET_NOT_IN_CURRENT_TEAM')
})

test('capture Battle XP recipients are the battle-start team only and exclude the newly caught instance', () => {
  assert.deepEqual(captureBattleXpRecipients(['a', 'b', 'a', 'caught', 'c'], 'caught'), ['a', 'b', 'c'])
  const result = settleCaptureSuccess(gameState(), {
    resolutionId: 'battle-4:capture',
    capturedMonster: captured('caught'),
    teamAtStart: ['starter', 'caught']
  })
  assert.deepEqual(result.settlement.battleXpRecipients, ['starter'])
})
