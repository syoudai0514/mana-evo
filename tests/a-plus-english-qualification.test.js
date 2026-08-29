import test from 'node:test'
import assert from 'node:assert/strict'

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

function englishExtra({ rewardEventId, learningIntent = 'adaptive' } = {}) {
  return {
    type: 'ANSWER',
    domainId: 'english',
    taskKind: 'extra',
    correct: true,
    elapsedMs: 500,
    choiceKey: 'ok',
    itemKey: 'enw:apple',
    question: {
      itemKey: 'enw:apple',
      knowledgeId: 'enw:apple',
      questionInstanceId: `enw:apple#${rewardEventId}`,
      rewardEventId,
      learningIntent,
      ticketQualifyingAtPresentation: true
    }
  }
}

test('A+ blocks mastered non-due English adaptive questions even when generic unit mastery is unavailable', () => {
  const previous = stateWithEnglishProgress({
    correct: 12,
    wrong: 0,
    stage: 5,
    nextDue: 40000,
    lastDay: 20000
  })
  const next = structuredClone(previous)
  const runtime = deriveLearningRewardRuntime({}, previous, next, englishExtra({ rewardEventId: 'english-mastered-nondue' }))

  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 1)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 0)
  assert.deepEqual(runtime.learningRewardMeta.extraTicketBucketKnowledgeIds, [])
})

test('A+ keeps due mastered English retrieval eligible and still has no time gate', () => {
  const previous = stateWithEnglishProgress({
    correct: 12,
    wrong: 0,
    stage: 5,
    nextDue: 0,
    lastDay: 1
  })
  const next = structuredClone(previous)
  const runtime = deriveLearningRewardRuntime({}, previous, next, englishExtra({ rewardEventId: 'english-mastered-due' }))

  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
  assert.deepEqual(runtime.learningRewardMeta.extraTicketBucketKnowledgeIds, ['enw:apple'])
})

test('reinforcement English retrieval remains eligible even when the underlying item is mastered/non-due', () => {
  const previous = stateWithEnglishProgress({
    correct: 12,
    wrong: 1,
    stage: 5,
    nextDue: 40000,
    lastDay: 20000
  })
  const next = structuredClone(previous)
  const runtime = deriveLearningRewardRuntime({}, previous, next, englishExtra({
    rewardEventId: 'english-reinforcement',
    learningIntent: 'reinforcement'
  }))

  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
})
