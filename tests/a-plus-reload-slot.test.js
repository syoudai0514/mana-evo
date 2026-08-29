import test from 'node:test'
import assert from 'node:assert/strict'

import { deriveLearningRewardRuntime } from '../src/kids-quest-study/state/learningRewardRuntime.js'

function learningState() {
  return {
    grade: 0,
    skills: { 0: { suuji: { level: 2 } } },
    unitStats: {},
    testPassed: {},
    daily: {
      date: '2026-08-29',
      coreDone: true,
      coreIndex: 5,
      extraIndex: 7,
      coreTasks: []
    }
  }
}

function regeneratedSlotAnswer(questionInstanceId, knowledgeId) {
  return {
    type: 'ANSWER',
    domainId: 'suuji',
    taskKind: 'extra',
    correct: true,
    elapsedMs: 1500,
    choiceKey: 'ok',
    itemKey: knowledgeId,
    question: {
      questionInstanceId,
      knowledgeId,
      itemKey: knowledgeId,
      learningIntent: 'adaptive',
      ticketQualifyingAtPresentation: true,
      // ActivityPlayer's presentation ID can contain the regenerated question
      // fingerprint, but reward settlement must canonicalize the same persisted
      // EXTRA task occurrence + qIndex to one semantic slot.
      rewardEventId: `2026-08-29:extra:7:0:${questionInstanceId}:adaptive:`
    }
  }
}

test('reload + regenerated q0 with a different questionInstanceId cannot add A+ progress twice', () => {
  const state = learningState()
  const first = regeneratedSlotAnswer('question-before-reload', 'skill:addition')
  let runtime = deriveLearningRewardRuntime({}, state, state, first)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
  assert.deepEqual(runtime.learningRewardMeta.extraTicketBucketKnowledgeIds, ['skill:addition'])

  // Simulate persisted runtime followed by UI/task reload and a newly generated
  // qIndex=0 question with a different content fingerprint.
  runtime = JSON.parse(JSON.stringify(runtime))
  const regenerated = regeneratedSlotAnswer('different-question-after-reload', 'skill:subtraction')
  const replay = deriveLearningRewardRuntime(runtime, state, state, regenerated)

  assert.equal(replay.learningRewardMeta.extraQualifyingCorrectTotal, 1)
  assert.deepEqual(replay.learningRewardMeta.extraTicketBucketKnowledgeIds, ['skill:addition'])
  assert.equal(replay.pendingGameRewards.filter((reward) => reward.kind === 'extra-learning-ticket').length, 0)
})
