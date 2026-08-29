import test from 'node:test'
import assert from 'node:assert/strict'

import { DOMAIN_BY_ID } from '../src/kids-quest-study/engine/activities.js'
import { deriveLearningRewardRuntime } from '../src/kids-quest-study/state/learningRewardRuntime.js'

function baseState() {
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
    englishWordStats: {},
    englishPhraseStats: {},
    englishAlphabetStats: {}
  }
}

function englishParams(state) {
  return {
    grade: state.grade,
    englishAudioAvailable: false,
    englishWordStats: state.englishWordStats,
    englishPhraseStats: state.englishPhraseStats,
    englishAlphabetStats: state.englishAlphabetStats,
    today: 20694,
    taskForm: 'word-meaning'
  }
}

function setEnglishEntry(state, itemKey, entry) {
  const next = structuredClone(state)
  if (itemKey.startsWith('enw:')) next.englishWordStats[itemKey.slice(4)] = entry
  else if (itemKey.startsWith('ena:')) next.englishAlphabetStats[itemKey.slice(4)] = entry
  else if (itemKey.startsWith('enp:')) next.englishPhraseStats[itemKey.slice(4)] = entry
  else if (itemKey.startsWith('eng:')) next.englishPhraseStats[itemKey.slice(4)] = entry
  else throw new Error(`Unexpected English item key: ${itemKey}`)
  return next
}

function presentedCase(entry, rewardEventId) {
  const seed = baseState()
  // First ask the authentic English engine for a stable semantic item, then
  // seed that exact item's persisted progress and present it again. This keeps
  // the test coupled to the real English key format instead of guessing IDs.
  const probe = DOMAIN_BY_ID.english.generateQuestion(englishParams(seed))
  const state = setEnglishEntry(seed, probe.itemKey, entry)
  const generated = DOMAIN_BY_ID.english.generateQuestion(englishParams(state), probe.itemKey)
  return {
    state,
    action: {
      type: 'ANSWER',
      domainId: 'english',
      taskKind: 'extra',
      correct: true,
      elapsedMs: 500,
      choiceKey: 'ok',
      itemKey: generated.itemKey,
      question: {
        ...generated,
        knowledgeId: generated.itemKey,
        questionInstanceId: `${generated.itemKey}#${rewardEventId}`,
        rewardEventId,
        learningIntent: generated.englishLearningIntentAtPresentation || 'adaptive',
        ticketQualifyingAtPresentation: generated.englishTicketQualifyingAtPresentation === true
      }
    }
  }
}

function mutateEntry(state, itemKey, mutator) {
  const next = structuredClone(state)
  let entry
  if (itemKey.startsWith('enw:')) entry = next.englishWordStats[itemKey.slice(4)]
  else if (itemKey.startsWith('ena:')) entry = next.englishAlphabetStats[itemKey.slice(4)]
  else entry = next.englishPhraseStats[itemKey.slice(4)]
  mutator(entry)
  return next
}

test('English generator freezes mastered non-due A+ provenance at presentation', () => {
  const { state: previous, action } = presentedCase({
    correct: 12, wrong: 0, stage: 5, nextDue: 40000, lastDay: 20000
  }, '2026-08-29:extra:0:0:english-nondue:adaptive:')

  assert.equal(action.question.englishLearningIntentAtPresentation, 'adaptive')
  assert.equal(action.question.englishMasteredAtPresentation, true)
  assert.equal(action.question.englishTicketQualifyingAtPresentation, false)

  const next = mutateEntry(previous, action.itemKey, (entry) => { entry.nextDue = 0 })
  const runtime = deriveLearningRewardRuntime({}, previous, next, action)
  assert.equal(runtime.learningRewardMeta.additionalCorrectTotal, 1)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 0)
})

test('English generator freezes due mastered retrieval as full qualifying at presentation', () => {
  const { state: previous, action } = presentedCase({
    correct: 12, wrong: 0, stage: 5, nextDue: 0, lastDay: 1
  }, '2026-08-29:extra:0:0:english-due:srs_due:')

  assert.equal(action.question.englishLearningIntentAtPresentation, 'srs_due')
  assert.equal(action.question.englishTicketQualifyingAtPresentation, true)

  const next = mutateEntry(previous, action.itemKey, (entry) => { entry.nextDue = 99999 })
  const runtime = deriveLearningRewardRuntime({}, previous, next, action)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
  assert.deepEqual(runtime.learningRewardMeta.extraTicketBucketKnowledgeIds, [action.itemKey])
})

test('reinforcement English retrieval remains eligible without settlement-time SRS inference', () => {
  const { state: previous, action } = presentedCase({
    correct: 12, wrong: 1, stage: 5, nextDue: 40000, lastDay: 20000
  }, '2026-08-29:extra:0:2:english-reinforce:reinforcement:origin')
  action.question.learningIntent = 'reinforcement'
  action.question.ticketQualifyingAtPresentation = true
  const runtime = deriveLearningRewardRuntime({}, previous, structuredClone(previous), action)
  assert.equal(runtime.learningRewardMeta.extraQualifyingCorrectTotal, 1)
})
