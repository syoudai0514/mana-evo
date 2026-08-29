import test from 'node:test'
import assert from 'node:assert/strict'

import {
  analyzeLearningAntiSpam,
  createLearningRewardMeta,
  queueLearningReward,
  recordAdditionalLearningAnswer,
  recordExtraQualifyingCorrect,
  releaseHeldLearningRewards
} from '../src/kids-quest-study/state/learningRewardPolicy.js'
import {
  deriveLearningRewardRuntime,
  EXTRA_CORRECT_PER_BATTLE_TICKET,
  MAX_SAME_KNOWLEDGE_PER_BATTLE_TICKET
} from '../src/kids-quest-study/state/learningRewardRuntime.js'
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

function extraAnswer(id, correct = true, {
  knowledgeId = `skill:${id}`,
  learningIntent = 'adaptive',
  ticketQualifyingAtPresentation = true,
  rewardEventId = `reward:${id}`,
  elapsedMs = 2200,
  taskKind = 'extra'
} = {}) {
  return {
    type: 'ANSWER',
    domainId: 'suuji',
    taskKind,
    correct,
    itemKey: knowledgeId,
    unitId: null,
    elapsedMs,
    choiceKey: correct ? `ok-${id}` : `ng-${id}`,
    question: {
      questionInstanceId: id,
      knowledgeId,
      itemKey: `n:${id}`,
      learningIntent,
      ticketQualifyingAtPresentation,
      rewardEventId
    }
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

test('A+ pays one ticket for five semantic qualifying EXTRA correct answers', () => {
  assert.equal(EXTRA_CORRECT_PER_BATTLE_TICKET, 5)
  assert.equal(MAX_SAME_KNOWLEDGE_PER_BATTLE_TICKET, 3)
  const state = learningState()
  let runtime = {}
  for (let index = 1; index <= 4; index += 1) runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer(`q${index}`))
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.ticketDelta > 0).length, 0)

  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('q5'))
  const tickets = runtime.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket')
  const explore = runtime.pendingProgressionSignals.filter((signal) => signal.kind === 'extra-question-clear')
  assert.equal(tickets.length, 1)
  assert.equal(tickets[0].ticketDelta, 1)
  assert.equal(explore.reduce((sum, signal) => sum + signal.explorationPointDelta, 0), 5)
})

test('A+ same-knowledge 3/5 guard applies to the current ticket bucket, not the last five answers', () => {
  let meta = createLearningRewardMeta()
  for (const eventId of ['a1', 'a2', 'a3']) {
    const recorded = recordExtraQualifyingCorrect(meta, { eventId, knowledgeId: 'skill:A' })
    assert.equal(recorded.accepted, true)
    meta = recorded.meta
  }
  const blocked = recordExtraQualifyingCorrect(meta, { eventId: 'a4', knowledgeId: 'skill:A' })
  assert.equal(blocked.accepted, false)
  assert.equal(blocked.reason, 'SAME_KNOWLEDGE_CAP')
  meta = blocked.meta
  assert.deepEqual(meta.extraTicketBucketKnowledgeIds, ['skill:A', 'skill:A', 'skill:A'])

  meta = recordExtraQualifyingCorrect(meta, { eventId: 'b1', knowledgeId: 'skill:B' }).meta
  const completes = recordExtraQualifyingCorrect(meta, { eventId: 'c1', knowledgeId: 'skill:C' })
  assert.equal(completes.ticketMilestones, 1)
  assert.deepEqual(completes.meta.extraTicketBucketKnowledgeIds, [])

  // A is allowed again in the next ticket bucket. The cap is per ticket, not a
  // sliding recent-answer window.
  const nextTicketA = recordExtraQualifyingCorrect(completes.meta, { eventId: 'a5', knowledgeId: 'skill:A' })
  assert.equal(nextTicketA.accepted, true)
  assert.deepEqual(nextTicketA.meta.extraTicketBucketKnowledgeIds, ['skill:A'])

  // The previously blocked semantic event is consumed and cannot be replayed
  // after the bucket resets to sneak into the next ticket.
  const replayBlocked = recordExtraQualifyingCorrect(nextTicketA.meta, { eventId: 'a4', knowledgeId: 'skill:A' })
  assert.equal(replayBlocked.accepted, false)
  assert.equal(replayBlocked.reason, 'DUPLICATE_SEMANTIC_EVENT')
})

test('same-knowledge blocked answers still count for generic learning rewards but not ticket progress', () => {
  const state = learningState()
  let runtime = {}
  for (let i = 1; i <= 4; i += 1) {
    runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer(`same-${i}`, true, {
      knowledgeId: 'skill:same', rewardEventId: `same-event-${i}`
    }))
  }
  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 4)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 3)
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket').length, 0)
})

test('free and okawari never leak into A+ ticket progress', () => {
  const state = learningState()
  let runtime = {}
  for (const id of ['free1', 'free2', 'free3', 'free4']) {
    runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer(id, true, { taskKind: 'free' }))
  }
  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('ok1', true, { taskKind: 'okawari' }))
  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('extra1'))
  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 6)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket').length, 0)
})

test('A+ provenance distinguishes due SRS, reinforcement, mastered non-due, and revealed retry', () => {
  const state = learningState()
  let runtime = {}
  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('srs', true, {
    learningIntent: 'srs_due', knowledgeId: 'skill:srs', rewardEventId: 'event:srs'
  }))
  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('reinforce', true, {
    learningIntent: 'reinforcement', knowledgeId: 'skill:reinforce', rewardEventId: 'event:reinforce'
  }))
  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('mastered', true, {
    learningIntent: 'adaptive', ticketQualifyingAtPresentation: false, knowledgeId: 'skill:mastered', rewardEventId: 'event:mastered'
  }))
  runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer('revealed', true, {
    learningIntent: 'revealed_retry', ticketQualifyingAtPresentation: false, knowledgeId: 'skill:revealed', rewardEventId: 'event:revealed'
  }))
  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 4)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 2)
})

test('fast genuine mastery is not time-gated and semantic replay is exactly-once across reload', () => {
  const state = learningState()
  let runtime = {}
  const answers = [
    extraAnswer('f1', true, { elapsedMs: 100, knowledgeId: 'skill:A', rewardEventId: 'event:f1' }),
    extraAnswer('f2', true, { elapsedMs: 100, knowledgeId: 'skill:A', rewardEventId: 'event:f2' }),
    extraAnswer('f3', true, { elapsedMs: 100, knowledgeId: 'skill:A', rewardEventId: 'event:f3' }),
    extraAnswer('f4', true, { elapsedMs: 100, knowledgeId: 'skill:B', rewardEventId: 'event:f4' }),
    extraAnswer('f5', true, { elapsedMs: 100, knowledgeId: 'skill:C', rewardEventId: 'event:f5' })
  ]
  for (const action of answers) runtime = deriveLearningRewardRuntime(runtime, state, state, action)
  assert.equal(runtime.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket').length, 1)

  const reloaded = JSON.parse(JSON.stringify(runtime))
  const replay = deriveLearningRewardRuntime(reloaded, state, state, answers[4])
  assert.equal(replay.learningRewardMeta.extraQualifyingCorrectTotal, 5)
  assert.equal(replay.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket').length, 1)
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
    runtime = deriveLearningRewardRuntime(runtime, state, state, extraAnswer(id, true, { taskKind: 'free' }))
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
    ...extraAnswer('master-normal', true, { taskKind: 'free' }), unitId: 'u1'
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
