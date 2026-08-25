import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const battle = fs.readFileSync('src/game/screens/BattleScreen.jsx', 'utf8')
const capture = fs.readFileSync('src/game/screens/CapturePanel.jsx', 'utf8')

test('W-216 uses the active Kids Quest day representation and no legacy day helper', () => {
  assert.ok(battle.includes("../../kids-quest-study/engine/srs.js"))
  assert.ok(!battle.includes("../../study/srs.js"))
})

test('W-216 capture UI consumes domain presentation frames without a UI reroll', () => {
  assert.ok(battle.includes('result.capturePresentation?.frames'))
  assert.ok(capture.includes('sequence?.frames'))
  assert.ok(capture.includes('setTimeout'))
  assert.ok(capture.includes("data-lit-stars={lit}"))
  assert.ok(capture.includes('successSequence ? 4 : 3'))
  assert.ok(!battle.includes('Math.random'))
  assert.ok(!capture.includes('Math.random'))
})

test('W-216 keeps star/Japanese/recommendation primary and exact percentage secondary', () => {
  assert.ok(capture.includes('capture-ease-stars'))
  assert.ok(capture.includes('おすすめ！'))
  assert.ok(capture.includes('<details className="capture-details">'))
  assert.ok(capture.includes('くわしい かくりつ'))
  assert.ok(capture.includes('setSelectedRing(option.id)'))
  assert.ok(capture.includes('onCapture(selected.id)'))
})

test('W-216 first capture copy keeps the new instance in BOX without claiming automatic team insertion', () => {
  assert.ok(battle.includes('べつの1たいとして ボックスに入ったよ'))
  assert.ok(battle.includes('チームは「モンスター」で えらべるよ'))
  assert.ok(!battle.includes('自動でチーム入り'))
})

test('W-216 duplicate choice is rendered from persisted settlement state and resolved by shared runtime', () => {
  assert.ok(battle.includes('game.captureDomain?.settlements?.[captureResolutionId]'))
  assert.ok(battle.includes("captureSettlement?.status === 'pending_duplicate_choice'"))
  assert.ok(battle.includes('resolveDuplicateCaptureChoice'))
  assert.ok(battle.includes('なかまにする'))
  assert.ok(battle.includes('おうえんにかえる'))
})

test('W-216 growth shards redeem only through current-team buttons and canonical API', () => {
  assert.ok(battle.includes('redeemGrowthShardXp'))
  assert.ok(battle.includes('GROWTH_SHARD_RULE.shardsPerUse'))
  assert.ok(battle.includes('GROWTH_SHARD_RULE.xpPerUse'))
  assert.ok(battle.includes('game.team.map((instanceId)'))
  assert.ok(battle.includes('growth-shard-targets'))
})

test('W-216 hands automatic battle/capture/shard evolutions to EvolutionCelebration once, without manual retrigger', () => {
  assert.ok(battle.includes('result.rewards?.evolutionsByInstance'))
  assert.ok(battle.includes('result.evolutionsByInstance'))
  assert.ok(battle.includes('if (result.evolution) enqueueEvolutions'))
  assert.ok(battle.includes('seenEvolutionKeys'))
  assert.ok(battle.includes('EvolutionCelebration'))
  assert.ok(!battle.includes('evolveInstance'))
  assert.ok(!battle.includes('canNormalEvolve'))
  assert.ok(!battle.includes('✨ いま シンカする！'))
})

test('W-216 removes obsolete transition-trial reward copy', () => {
  assert.ok(!battle.includes('stage?.evolutionReward'))
  assert.ok(!battle.includes('初回クリアなら シンカアイテムをGET'))
})
