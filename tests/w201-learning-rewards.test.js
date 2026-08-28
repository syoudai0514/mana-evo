import test from 'node:test'
import assert from 'node:assert/strict'

import {
  analyzeLearningAntiSpam,
  createLearningRewardMeta,
  queueLearningReward,
  recordAdditionalLearningAnswer,
  releaseHeldLearningRewards
} from '../src/kids-quest-study/state/learningRewardPolicy.js'
import { deriveLearningRewardRuntime, EXTRA_CORRECT_PER_BATTLE_TICKET } from '../src/kids-quest-study/state/learningRewardRuntime.js'
import {
  applyLearningGameReward,
  applyLearningGameRewards,
  projectLearningProgressionSignals
} from '../src/game/learningRewardBridge.js'

function learningState(overrides = {}) {
  return {
    grade: 0,
    skills: { 0: { suuji: { level: 2 }, 'hard:suuji': { level: 2 } } },
    unitStats: {},
    testPassed: {},
    daily: {
      date: '2026-08-25',
      coreDone: true,
      coreIndex: 5,
      extraIndex: 0,
      coreTasks: [
        { domainId: 'yomu' }, { domainId: 'suuji' }, { domainId: 'kaku' },
        { domainId: 'seikatsu' }, { domainId: 'english' }
      ]
    },
    ...overrides
  }
}

function extraAnswer(id, correct = true) {
  return {
    type: 'ANSWER',
    domainId: 'suuji',
    taskKind: 'extra',
    correct,
    itemKey: `skill:${id}`,
    unitId: null,
    elapsedMs: 2200,
    choiceKey: correct ? `ok-${id}` : `ng-${id}`,
    question: { questionInstanceId: id, itemKey: `n:${id}` }
  }
}

test('anti-spam requires two independent signals in the full eight-answer window', () => {
  const onlyFast = Array.from({ length: 8 }, (_, index) => ({
    correct: true,
    elapsedMs: 100,
    questionId: `q${index}`,
    choiceKey: `c${index}`,
    hard: false
  }))
  const oneSignal = analyzeLearningAntiSpam(onlyFast)
  assert.equal(oneSignal.suspicious, false)
  assert.deepEqual(oneSignal.signals, ['very-fast'])

  const spam = Array.from({ length: 8 }, () => ({
    correct: false,
    elapsedMs: 100,
    questionId: 'same-question',
    choiceKey: 'left',
    hard: true
  }))
  const multiple = analyzeLearningAntiSpam(spam)
  assert.equal(multiple.suspicious, true)
  assert.ok(multiple.signalCount >= 2)
  assert.ok(multiple.signals.includes('very-fast'))
  assert.ok(multiple.signals.includes('high-error'))
})

test('held additional bonuses survive and release after three normal answers with a correct verification', () => {
  let meta = createLearningRewardMeta()
  for (let i = 0; i < 8; i++) {
    meta = recordAdditionalLearningAnswer(meta, {
      correct: false, elapsedMs: 100, questionId: 'repeat', choiceKey: 'left', hard: true
    }).meta
  }
  assert.equal(meta.hold.active, true)

  const queued = queueLearningReward(meta, [], { id: 'extra:q1', ticketDelta: 1 }, { protectedBonus: true })
  assert.equal(queued.held, true)
  meta = queued.meta

  for (let i = 0; i < 3; i++) {
    const answer = recordAdditionalLearningAnswer(meta, {
      correct: true, elapsedMs: 2500, questionId: `normal-${i}`, choiceKey: `choice-${i}`, hard: false
    })
    meta = answer.meta
  }
  assert.equal(meta.hold.active, false)
  const released = releaseHeldLearningRewards(meta, [], [])
  assert.equal(released.pendingGameRewards.length, 1)
  assert.equal(released.pendingGameRewards[0].id, 'extra:q1')
})

test('daily core transition emits canonical reward exactly once plus exploration and progress signals', () => {
  const previous = learningState({ daily: { ...learningState().daily, coreDone: false, coreIndex: 4 } })
  const next = learningState({ daily: { ...learningState().daily, coreDone: true, coreIndex: 5 } })
  const action = { type: 'CLEAR_TASK', kind: 'core', domainId: 'english' }
  const first = deriveLearningRewardRuntime({}, previous, next, action)
  assert.equal(first.pendingGameRewards.length, 1)
  assert.deepEqual(first.pendingGameRewards[0].captureItemDelta, { star: 3 })
  assert.equal(first.pendingGameRewards[0].ticketDelta, 3)
  assert.equal(first.pendingProgressionSignals.find((signal) => signal.kind === 'daily-core-complete')?.explorationPointDelta, 2)
  assert.equal(first.pendingProgressionSignals.find((signal) => signal.kind === 'core-task-first-clear')?.worldProgressDelta, 1)

  const duplicate = deriveLearningRewardRuntime(first, previous, next, action)
  assert.equal(duplicate.pendingGameRewards.length, 1)
  assert.equal(duplicate.pendingProgressionSignals.length, 2)
})

test('five correct extra questions pay one battle ticket while every correct extra still pays exploration', () => {
  assert.equal(EXTRA_CORRECT_PER_BATTLE_TICKET, 5)
  const state = learningState()
  let runtime = {}
  for (let index = 1; index <= 4; index += 1) runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer(`q${index}`, true))
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.ticketDelta > 0).length, 0)

  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('q5', true))
  const tickets = runtime.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket')
  const explore = runtime.pendingProgressionSignals.filter((signal) => signal.kind === 'extra-question-clear')
  assert.equal(tickets.length, 1)
  assert.equal(tickets[0].ticketDelta, 1)
  assert.equal(explore.reduce((sum, signal) => sum + signal.explorationPointDelta, 0), 5)

  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('wrong', false))
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket').length, 1)
})

test('every three correct additional-learning answers emits star +1 with a persisted counter', () => {
  const state = learningState()
  let runtime = {}
  for (const id of ['a', 'b', 'c']) runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer(id, true))
  const starRewards = runtime.pendingGameRewards.filter((reward) => reward.kind === 'additional-learning-star')
  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 3)
  assert.equal(starRewards.length, 1)
  assert.equal(starRewards[0].captureItemDelta.star, 1)

  const reloaded = JSON.parse(JSON.stringify(runtime))
  let continued = reloaded
  for (const id of ['d', 'e', 'f']) continued = deriveLearningRewardRuntime(continued, state, state, extraAnswer(id, true))
  assert.equal(continued.learningRewardMeta.additionalCorrectTotal, 6)
  assert.equal(continued.pendingGameRewards.filter((reward) => reward.kind === 'additional-learning-star').length, 2)
})

test('free study never mints battle tickets while still contributing to additional-learning star progress', () => {
  const state = learningState()
  let runtime = {}
  for (const id of ['free1', 'free2', 'free3']) {
    const action = { ...extraAnswer(id, true), taskKind: 'free' }
    runtime = deriveLearningRewardRuntime(runtime, state, state, action)
  }
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.ticketDelta > 0).length, 0)
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.kind === 'additional-learning-star').length, 1)
})

test('normal and hard MASTER transitions mint silver and gold once', () => {
  const almost = { attempts: 3, firstAttemptCorrect: 2, successDays: [1], itemKeys: ['a'] }
  const mastered = { attempts: 4, firstAttemptCorrect: 3, successDays: [1, 2], itemKeys: ['a', 'b'] }

  const prevNormal = learningState({ unitStats: { 0: { suuji: { u1: almost } } } })
  const nextNormal = learningState({ unitStats: { 0: { suuji: { u1: mastered } } } })
  const normal = deriveLearningRewardRuntime({}, prevNormal, nextNormal, {
    ...extraAnswer('master-normal', true), taskKind: 'free', unitId: 'u1'
  })
  assert.equal(normal.pendingGameRewards.find((reward) => reward.kind === 'unit-master')?.captureItemDelta.silver, 1)

  const prevHard = learningState({ unitStats: { 0: { 'hard:suuji': { hu1: almost } } } })
  const nextHard = learningState({ unitStats: { 0: { 'hard:suuji': { hu1: mastered } } } })
  const hard = deriveLearningRewardRuntime({}, prevHard, nextHard, {
    type: 'ANSWER', domainId: 'suuji', taskKind: 'free', correct: true, unitId: 'hu1',
    itemKey: 'hard:n:test', elapsedMs: 2000, choiceKey: 'ok',
    question: { itemKey: 'hard:n:test', questionInstanceId: 'hard-q' }
  })
  assert.equal(hard.pendingGameRewards.find((reward) => reward.kind === 'hard-unit-master')?.captureItemDelta.gold, 1)
})

test('skill level milestone emits exploration +2 and world progress +2 without changing learning XP', () => {
  const previous = learningState({ skills: { 0: { suuji: { level: 2 } } } })
  const next = learningState({ skills: { 0: { suuji: { level: 3 } } } })
  const runtime = deriveLearningRewardRuntime({}, previous, next, extraAnswer('level-up', true))
  const signal = runtime.pendingProgressionSignals.find((entry) => entry.kind === 'mastery-milestone')
  assert.equal(signal.explorationPointDelta, 2)
  assert.equal(signal.worldProgressDelta, 2)
})

test('first qualifying chapter pass emits exploration +5 and world progress +3 only once', () => {
  const previous = learningState({ testPassed: {} })
  const next = learningState({ testPassed: { 0: { passed: true, starTrial: true } } })
  const action = { type: 'STAR_TRIAL_RESULT', grade: 0 }
  const first = deriveLearningRewardRuntime({}, previous, next, action)
  const chapter = first.pendingProgressionSignals.find((entry) => entry.kind === 'chapter-test-first-pass')
  assert.equal(chapter.explorationPointDelta, 5)
  assert.equal(chapter.worldProgressDelta, 3)

  const repeat = deriveLearningRewardRuntime(first, next, next, action)
  assert.equal(repeat.pendingProgressionSignals.filter((entry) => entry.kind === 'chapter-test-first-pass').length, 1)
})

test('game bridge is exactly-once, creates seven-day ticket lots, and never mints learning rainbow', () => {
  const initial = { ticketGrants: [], tickets: 0, captureItems: { star: 0, silver: 0, gold: 0, rainbow: 4 }, appliedLearningRewardIds: [] }
  const reward = { id: 'daily:2026-08-25', ticketDelta: 3, captureItemDelta: { star: 3, rainbow: 99 } }
  const once = applyLearningGameReward(initial, reward, { today: 100 })
  assert.equal(once.applied, true)
  assert.equal(once.game.ticketGrants[0].earnedDay, 100)
  assert.equal(once.game.ticketGrants[0].expiresDay, 107)
  assert.equal(once.game.captureItems.star, 3)
  assert.equal(once.game.captureItems.rainbow, 4)

  const twice = applyLearningGameReward(once.game, reward, { today: 100 })
  assert.equal(twice.applied, false)
  assert.equal(twice.game.tickets, 3)
  assert.equal(twice.game.captureItems.star, 3)
})

test('bridge applies multiple rewards and progression projection deduplicates semantic ids', () => {
  const initial = { ticketGrants: [], captureItems: {}, appliedLearningRewardIds: [] }
  const batch = applyLearningGameRewards(initial, [
    { id: 'q1', ticketDelta: 1 },
    { id: 'q2', ticketDelta: 1 },
    { id: 'q1', ticketDelta: 1 }
  ], { today: 200 })
  assert.equal(batch.game.tickets, 2)
  assert.deepEqual(batch.appliedIds, ['q1', 'q2'])

  const projected = projectLearningProgressionSignals([
    { id: 's1', explorationPointDelta: 2, worldProgressDelta: 2 },
    { id: 's1', explorationPointDelta: 2, worldProgressDelta: 2 },
    { id: 's2', explorationPointDelta: 5, worldProgressDelta: 3 }
  ])
  assert.equal(projected.explorationPointDelta, 7)
  assert.equal(projected.worldProgressDelta, 5)
  assert.deepEqual(projected.acceptedIds, ['s1', 's2'])
})
