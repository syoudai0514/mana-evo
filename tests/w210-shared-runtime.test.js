import test from 'node:test'
import assert from 'node:assert/strict'

import { RUNTIME_STAGES, STAGES } from '../src/game/content.js'
import {
  attemptCapture,
  isStageUnlocked,
  makeMonster,
  resolveDuplicateCaptureChoice,
  startBattle
} from '../src/game/engine.js'
import { addTickets, availableTicketCount, createGameState, normalizeGameState } from '../src/game/progression.js'
import { applyLearningQueues, performGameExploration } from '../src/game/sharedRuntime.js'
import { applyAreaBossProgressEvent, areaBossEligibility } from '../src/game/worldProgression.js'

function distinctSpeciesStages(stages, count) {
  const seen = new Set()
  const result = []
  for (const stage of stages) {
    if (!stage?.enemySpeciesId || seen.has(stage.enemySpeciesId)) continue
    seen.add(stage.enemySpeciesId)
    result.push(stage)
    if (result.length >= count) break
  }
  return result
}

function clearBossRoute(game, area) {
  const boss = STAGES.find((stage) => stage.id === `a${area}-boss`)
  const route = distinctSpeciesStages(STAGES
    .filter((stage) => stage.kind === 'wild' && stage.routeProgressEligible)
    .filter((stage) => Number(stage.adventureArea || stage.area) === area)
    .filter((stage) => stage.zoneId === boss.zoneGatePreviousId), 3)
  assert.equal(route.length, 3)
  game.stagesCleared = [...new Set([...(game.stagesCleared || []), ...route.map((stage) => stage.id)])]
  return boss
}

test('learning reward and progression queues apply once, persist, and feed canonical exploration/boss progress', () => {
  const day = 9000
  let game = createGameState()
  game.adventureLocation = { area: 1, zoneId: 'meadow' }
  const rewards = [{ id: 'learn:reward:1', ticketDelta: 3, captureItemDelta: { star: 2 } }]
  const signals = [
    { id: 'learn:signal:1', kind: 'mastery', explorationPointDelta: 3, worldProgressDelta: 6, skillId: 'math-a' },
    { id: 'learn:signal:2', kind: 'mastery', explorationPointDelta: 2, worldProgressDelta: 6, skillId: 'reading-a' }
  ]

  const first = applyLearningQueues(game, { rewards, signals, today: day })
  assert.equal(availableTicketCount(first.game, day), 3)
  assert.equal(first.game.captureItems.star, game.captureItems.star + 2)
  assert.equal(first.game.mana, game.mana, 'W-201 reward bridge must not create implicit Mana')
  assert.equal(first.game.explorePoint, 5)
  assert.equal(areaBossEligibility(first.game, 1).eligible, true)
  assert.deepEqual(first.appliedSignalIds, ['learn:signal:1', 'learn:signal:2'])

  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(first.game)), day)
  const replayed = applyLearningQueues(reloaded, { rewards, signals, today: day })
  assert.equal(availableTicketCount(replayed.game, day), 3)
  assert.equal(replayed.game.captureItems.star, first.game.captureItems.star)
  assert.equal(replayed.game.explorePoint, 5)
  assert.equal(replayed.game.areaBossProgress[1].points, 12)
  assert.deepEqual(replayed.appliedRewardIds, [])
  assert.deepEqual(replayed.appliedSignalIds, [])

  const explored = performGameExploration(replayed.game, { areaId: 1, rng: () => 0.99, operationId: 'explore:learning:1' })
  assert.equal(explored.ok, true)
  assert.equal(explored.game.explorePoint, 0)
  assert.equal(explored.result.kind, 'material')
})

test('route clears alone never unlock a story boss; 12 points plus two unique skills can', () => {
  let game = createGameState()
  const boss = clearBossRoute(game, 1)
  assert.equal(isStageUnlocked(game, boss), false)

  game = applyAreaBossProgressEvent(game, { id: 'boss:1:a', area: 1, points: 6, skillId: 'skill-a' }).game
  assert.equal(isStageUnlocked(game, boss), false)
  game = applyAreaBossProgressEvent(game, { id: 'boss:1:b', area: 1, points: 6, skillId: 'skill-b' }).game
  assert.equal(areaBossEligibility(game, 1).eligible, true)
  assert.equal(isStageUnlocked(game, boss), true)
})

function pendingDuplicateCapture(choice, day) {
  let game = createGameState()
  const existing = makeMonster('m001', 5, `existing-${choice}`)
  game.box[existing.instanceId] = existing
  game.dex.seen.m001 = true
  game.dex.caught.m001 = true
  game.captureItems.rainbow = 1
  game = addTickets(game, 1, day)
  const started = startBattle(game, 'a1-wild-001', { dailyCompleted: true, today: day })
  assert.equal(started.ok, true)
  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  const caught = attemptCapture(started.game, battle, [1, 1, 1, 1], 'rainbow', { today: day })
  assert.equal(caught.ok, true)
  assert.equal(caught.caught, true)
  assert.equal(caught.duplicateChoiceRequired, true)
  const resolutionId = caught.captureSettlement.resolutionId
  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(caught.game)), day)
  assert.equal(reloaded.captureDomain.settlements[resolutionId].status, 'pending_duplicate_choice')
  const resolved = resolveDuplicateCaptureChoice(reloaded, resolutionId, choice)
  assert.equal(resolved.ok, true)
  return { resolved, capturedId: caught.captured.instanceId }
}

test('duplicate capture support choice survives reload and grants exactly one growth shard', () => {
  const { resolved, capturedId } = pendingDuplicateCapture('support', 9100)
  assert.equal(resolved.game.growthShards, 1)
  assert.equal(resolved.game.box[capturedId], undefined)
  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(resolved.game)), 9100)
  assert.equal(reloaded.growthShards, 1)
})

test('duplicate capture keep choice survives reload and keeps a distinct BOX instance', () => {
  const { resolved, capturedId } = pendingDuplicateCapture('keep', 9200)
  assert.equal(resolved.game.box[capturedId]?.speciesId, 'm001')
  const sameSpecies = Object.values(resolved.game.box).filter((monster) => monster.speciesId === 'm001')
  assert.equal(sameSpecies.length, 2)
  const reloaded = normalizeGameState(JSON.parse(JSON.stringify(resolved.game)), 9200)
  assert.equal(reloaded.box[capturedId]?.speciesId, 'm001')
})

test('transition-trial acquisition is absent from shared runtime exposure and Star Awakening fields do not survive normalization', () => {
  assert.equal(RUNTIME_STAGES.some((stage) => stage.kind === 'evolution-trial'), false)
  assert.equal(RUNTIME_STAGES.some((stage) => stage.evolutionReward), false)
  const saved = createGameState()
  saved.starShards = 999
  saved.starAwakened = true
  saved.box[saved.activeMonsterId].starAwakened = true
  const normalized = normalizeGameState(saved, 9300)
  assert.equal('starShards' in normalized, false)
  assert.equal('starAwakened' in normalized, false)
  assert.equal('starAwakened' in normalized.box[normalized.activeMonsterId], false)
})
