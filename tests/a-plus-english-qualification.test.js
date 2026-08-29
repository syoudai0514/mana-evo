import test from 'node:test'
import assert from 'node:assert/strict'

import { DOMAIN_BY_ID } from '../src/kids-quest-study/engine/activities.js'
import { deriveLearningRewardRuntime } from '../src/kids-quest-study/state/learningRewardRuntime.js'

function stateWithEnglishProgress(entry) {
  return {
    grade: 0,
    skills: { 0: { english: { level: 2 } } },
    unitStats: {},
    testPassed: {},
    daily: {
      date: '2026-08-29',
      coreDone: true,
      coreIndex: 5,
      extraIndex: 0,
      coreTasks: []
    },
    englishWordStats: { apple: entry },
    englishPhraseStats: {},
    englishAlphabetStats: {}
  }
}

function presentedEnglishQuestion(state, rewardEventId, { learningIntent = null } = {}) {
  const generated = DOMAIN_BY_ID.english.generateQuestion({
    grade: state.grade,
    englishAudioAvailable: false,
    englishWordStats: state.englishWordStats,
    englishPhraseStats: state.englishPhraseStats,
    englishAlphabetStats: state.englishAlphabetStats,
    today: 20694,
    taskForm: 'word-meaning'
  }, 'enw:apple')
  const intent = learningIntent || generated.englishLearningIntentAtPresentation || 'adaptive'
  return {
    ...generated,
    knowledgeId: 'enw:apple',
    questionInstanceId: `enw:apple#${rewardEventId}`,
    rewardEventId,
    learningIntent: intent,
    ticketQualifyingAtPresentation: learningIntent === 'reinforcement'
      ? true
      : generated.englishTicketQualifyingAtPresentation,
    englishLearningIntentAtPresentation: generated.englishLearningIntentAtPresentation,
    englishMasteredAtPresentation: generated.englishMasteredAtPresentation,
    englishTicketQualifyingAtPresentation: generated.englishTicketQualifyingAtPresentation
  }
}

function englishExtra(state, { rewardEventId, learningIntent = null } = {}) {
  const question = presentedEnglishQuestion(state, rewardEventId, { learningIntent })
  return {
    type: 'ANSWER',
    domainId: 'english',
    taskKind: 'extra',
    correct: true,
    elapsedMs: 500,
    choiceKey: 'ok',
    itemKey: 'enw:apple',
    question
  }
}

test('English generator freezes mastered non-due A+ provenance at presentation', () => {
  const previous = stateWithEnglishProgress({
    correct: 12,
    wrong: 0,
    stage: 5,
    nextDue: 40000,
    lastDay: 20000
  })
  const action = englishExtra(previous, { rewardEventId: '2026-08-29:extra:0:0:english-nondue:adaptive:' })

  assert.equal(action.question.englishLearningIntentAtPresentation, 'adaptive')
  assert.equal(action.question.englishMasteredAtPresentation, true)
  assert.equal(action.question.englishTicketQualifyingAtPresentation, false)

  const next = structuredClone(previous)
  // Mutating post-answer state must not change the frozen decision.
  next.englishWordStats.apple.nextDue = 0
  const runtime = deriveLearningRewardRuntime({}, previous, next, action)
  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 1)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 0)
  assert.deepEqual(runtime.learningRewardMeta.extraTicketBucketKnowledgeIds, [])
})

test('English generator freezes due mastered retrieval as full qualifying at presentation', () => {
  const previous = stateWithEnglishProgress({
    correct: 12,
    wrong: 0,
    stage: 5,
    nextDue: 0,
    lastDay: 1
  })
  const action = englishExtra(previous, { rewardEventId: '2026-08-29:extra:0:0:english-due:srs_due:' })

  assert.equal(action.question.englishLearningIntentAtPresentation, 'srs_due')
  assert.equal(action.question.englishTicketQualifyingAtPresentation, true)

  const next = structuredClone(previous)
  // Even if the answer advances nextDue, reward settlement trusts presentation.
  next.englishWordStats.apple.nextDue = 99999
  const runtime = deriveLearningRewardRuntime({}, previous, next, action)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
  assert.deepEqual(runtime.learningRewardMeta.extraTicketBucketKnowledgeIds, ['enw:apple'])
})

test('reinforcement English retrieval remains eligible without settlement-time SRS inference', () => {
  const previous = stateWithEnglishProgress({
    correct: 12,
    wrong: 1,
    stage: 5,
    nextDue: 40000,
    lastDay: 20000
  })
  const action = englishExtra(previous, {
    rewardEventId: '2026-08-29:extra:0:2:english-reinforce:reinforcement:origin',
    learningIntent: 'reinforcement'
  })
  const next = structuredClone(previous)
  const runtime = deriveLearningRewardRuntime({}, previous, next, action)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
})
