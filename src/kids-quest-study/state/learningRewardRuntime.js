import { unitReady } from '../engine/learningUnits.js'
import {
  createLearningRewardMeta,
  isAdditionalLearningTask,
  queueLearningReward,
  recordAdditionalLearningAnswer,
  recordExtraQualifyingCorrect,
  releaseHeldLearningRewards
} from './learningRewardPolicy.js'
import { normalizeLearningRewardRuntime } from './learningRewardStore.js'

export const EXTRA_CORRECT_PER_BATTLE_TICKET = 5
export const MAX_SAME_KNOWLEDGE_PER_BATTLE_TICKET = 3

const QUALIFYING_LEARNING_INTENTS = new Set(['adaptive', 'srs_due', 'reinforcement'])

function statsIdFor(action = {}) {
  const domainId = String(action.domainId || '')
  const hard = String(action.question?.itemKey || action.itemKey || '').startsWith('hard:')
  return { domainId, hard, statsId: hard ? `hard:${domainId}` : domainId }
}

function questionInstanceId(action = {}) {
  return String(action.question?.questionInstanceId || '').trim()
}

function queueGame(runtime, reward, protectedBonus = false) {
  const queued = queueLearningReward(
    runtime.learningRewardMeta,
    runtime.pendingGameRewards,
    reward,
    { protectedBonus, bucket: 'gameRewards' }
  )
  return { ...runtime, learningRewardMeta: queued.meta, pendingGameRewards: queued.pending }
}

function queueProgression(runtime, signal, protectedBonus = false) {
  const queued = queueLearningReward(
    runtime.learningRewardMeta,
    runtime.pendingProgressionSignals,
    signal,
    { protectedBonus, bucket: 'progressionSignals' }
  )
  return { ...runtime, learningRewardMeta: queued.meta, pendingProgressionSignals: queued.pending }
}

function releaseHeld(runtime) {
  const released = releaseHeldLearningRewards(
    runtime.learningRewardMeta,
    runtime.pendingGameRewards,
    runtime.pendingProgressionSignals
  )
  return {
    ...runtime,
    learningRewardMeta: released.meta,
    pendingGameRewards: released.pendingGameRewards,
    pendingProgressionSignals: released.pendingProgressionSignals
  }
}

function skillLevel(state, grade, statsId) {
  return Number(state?.skills?.[grade]?.[statsId]?.level) || 0
}

function unitIsReady(state, grade, statsId, unitId) {
  return unitId ? unitReady(state?.unitStats?.[grade]?.[statsId]?.[unitId]) : false
}

function dayKey(state) {
  return String(state?.daily?.date || '')
}

// ActivityPlayer historically built rewardEventId with questionInstanceId.
// questionInstanceId may legitimately change when a partially completed EXTRA
// task is re-generated after reload. The semantic authority for exactly-once is
// the persisted task occurrence + presentation slot, not the random question.
// Keep accepting the historical shape while canonicalizing it to a stable slot.
function stableExtraSlotId(question = {}) {
  const raw = String(question.rewardEventId || '').trim()
  if (!raw) return ''
  const parts = raw.split(':')
  if (parts.length >= 4 && parts[1] === 'extra') {
    return `extra-slot:${parts[0]}:${parts[2]}:${parts[3]}`
  }
  return raw
}

function semanticExtraQualification(action, nextLearning) {
  if (action?.taskKind !== 'extra' || nextLearning?.daily?.coreDone !== true || action?.correct !== true) {
    return { qualifies: false, reason: 'NOT_QUALIFYING_EXTRA' }
  }

  const question = action?.question || {}
  let learningIntent = String(question.learningIntent || '')
  let ticketQualifyingAtPresentation = question.ticketQualifyingAtPresentation === true

  // Normal English uses a dedicated Kids Quest SRS/mastery store. Its
  // classification is now frozen by the English generator while the question
  // is being presented. Settlement consumes that metadata and never re-reads
  // mastery/SRS state after the answer. Explicit reinforcement/revealed-retry
  // provenance from ActivityPlayer remains authoritative for those two paths.
  if (
    String(action?.domainId || '') === 'english' &&
    !String(question.itemKey || '').startsWith('hard:') &&
    !['reinforcement', 'revealed_retry'].includes(learningIntent) &&
    question.englishLearningIntentAtPresentation
  ) {
    learningIntent = String(question.englishLearningIntentAtPresentation)
    ticketQualifyingAtPresentation = question.englishTicketQualifyingAtPresentation === true
  }

  if (!QUALIFYING_LEARNING_INTENTS.has(learningIntent)) {
    return {
      qualifies: false,
      reason: learningIntent === 'revealed_retry' ? 'REVEALED_RETRY' : 'MISSING_OR_INVALID_PROVENANCE'
    }
  }
  if (!ticketQualifyingAtPresentation) {
    return { qualifies: false, reason: 'NON_QUALIFYING_AT_PRESENTATION' }
  }

  const knowledgeId = String(question.knowledgeId || action.itemKey || '').trim()
  const rewardEventId = stableExtraSlotId(question)
  if (!knowledgeId || !rewardEventId) return { qualifies: false, reason: 'MISSING_SEMANTIC_ID' }
  return { qualifies: true, knowledgeId, rewardEventId, learningIntent }
}

function recordExtraBattleTicketProgress(runtime, nextLearning, action) {
  const semantic = semanticExtraQualification(action, nextLearning)
  if (!semantic.qualifies) return runtime

  const recorded = recordExtraQualifyingCorrect(runtime.learningRewardMeta, {
    eventId: semantic.rewardEventId,
    knowledgeId: semantic.knowledgeId
  })
  let result = { ...runtime, learningRewardMeta: recorded.meta }
  if (!recorded.accepted || !recorded.ticketMilestones) return result

  result = queueGame(result, {
    id: `extra-ticket:${recorded.milestone}`,
    ticketDelta: 1,
    captureItemDelta: {},
    kind: 'extra-learning-ticket'
  }, true)
  return result
}

function deriveAnswer(runtime, previous, next, action) {
  const grade = previous?.grade ?? next?.grade ?? 0
  const { hard, statsId } = statsIdFor(action)
  let result = runtime

  if (isAdditionalLearningTask(action.taskKind)) {
    const policy = recordAdditionalLearningAnswer(result.learningRewardMeta, {
      correct: action.correct === true,
      elapsedMs: action.elapsedMs,
      questionId: questionInstanceId(action) || action.itemKey,
      choiceKey: action.choiceKey,
      hard
    })
    result = { ...result, learningRewardMeta: policy.meta }
    if (policy.justReleased) result = releaseHeld(result)

    // A+ ticket economy: only an EXTRA answer whose semantic provenance was
    // fixed at presentation may advance the ticket bucket. Free / okawari,
    // revealed retries, mastered non-due repeats and duplicate semantic slots
    // cannot subsidize battle time.
    result = recordExtraBattleTicketProgress(result, next, action)

    if (action.correct === true && action.taskKind === 'extra' && next?.daily?.coreDone === true) {
      const stableSlot = stableExtraSlotId(action.question)
      const instanceId = questionInstanceId(action)
      const exploreIdentity = stableSlot || instanceId
      if (exploreIdentity) {
        const exploreId = `extra:${dayKey(next)}:${next.daily?.extraIndex || 0}:${exploreIdentity}:explore`
        result = queueProgression(result, {
          id: exploreId,
          kind: 'extra-question-clear',
          explorationPointDelta: 1,
          worldProgressDelta: 0,
          dayKey: dayKey(next)
        }, true)
      }
    }

    for (let index = 0; index < policy.starMilestones; index += 1) {
      const milestone = Math.floor(result.learningRewardMeta.additionalCorrectTotal / 3) - index
      result = queueGame(result, {
        id: `additional-star:${milestone}`,
        ticketDelta: 0,
        captureItemDelta: { star: 1 },
        kind: 'additional-learning-star'
      }, true)
    }
  }

  const previousLevel = skillLevel(previous, grade, statsId)
  const nextLevel = skillLevel(next, grade, statsId)
  if (nextLevel > previousLevel) {
    result = queueProgression(result, {
      id: `skill-level:${grade}:${statsId}:${nextLevel}`,
      kind: 'mastery-milestone',
      explorationPointDelta: 2,
      worldProgressDelta: 2,
      skillId: statsId,
      dayKey: dayKey(next)
    })
  }

  const unitId = action.unitId
  if (unitId && !unitIsReady(previous, grade, statsId, unitId) && unitIsReady(next, grade, statsId, unitId)) {
    result = queueGame(result, {
      id: `unit:${grade}:${statsId}:${unitId}`,
      ticketDelta: 0,
      captureItemDelta: hard ? { gold: 1 } : { silver: 1 },
      kind: hard ? 'hard-unit-master' : 'unit-master'
    })
  }

  return result
}

function deriveClearTask(runtime, previous, next, action) {
  let result = runtime
  if (action.kind !== 'core') return result

  const clearedIndex = Math.max(0, Number(previous?.daily?.coreIndex) || 0)
  const domainId = String(action.domainId || previous?.daily?.coreTasks?.[clearedIndex]?.domainId || '')
  result = queueProgression(result, {
    id: `core-task:${dayKey(next)}:${clearedIndex}:${domainId}`,
    kind: 'core-task-first-clear',
    explorationPointDelta: 0,
    worldProgressDelta: 1,
    skillId: domainId || null,
    dayKey: dayKey(next)
  })

  if (previous?.daily?.coreDone !== true && next?.daily?.coreDone === true) {
    result = queueGame(result, {
      id: `daily:${dayKey(next)}`,
      ticketDelta: 3,
      captureItemDelta: { star: 3 },
      kind: 'daily-core-complete'
    })
    result = queueProgression(result, {
      id: `daily:${dayKey(next)}:explore`,
      kind: 'daily-core-complete',
      explorationPointDelta: 2,
      worldProgressDelta: 0,
      dayKey: dayKey(next)
    })
  }
  return result
}

function deriveStarTrial(runtime, previous, next, action) {
  const grade = Number(action.grade)
  const wasPassed = previous?.testPassed?.[grade]?.passed === true
  const isPassed = next?.testPassed?.[grade]?.passed === true
  if (wasPassed || !isPassed) return runtime
  return queueProgression(runtime, {
    id: `chapter:${grade}:pass`,
    kind: 'chapter-test-first-pass',
    explorationPointDelta: 5,
    worldProgressDelta: 3,
    dayKey: dayKey(next)
  })
}

export function deriveLearningRewardRuntime(savedRuntime, previousLearning, nextLearning, action = {}) {
  let runtime = normalizeLearningRewardRuntime(savedRuntime)
  switch (action.type) {
    case 'ANSWER':
      runtime = deriveAnswer(runtime, previousLearning, nextLearning, action)
      break
    case 'CLEAR_TASK':
      runtime = deriveClearTask(runtime, previousLearning, nextLearning, action)
      break
    case 'STAR_TRIAL_RESULT':
      runtime = deriveStarTrial(runtime, previousLearning, nextLearning, action)
      break
    default:
      break
  }
  return { ...runtime, learningRewardMeta: createLearningRewardMeta(runtime.learningRewardMeta) }
}
