import { unitReady } from '../engine/learningUnits.js'
import { dayNumber } from '../engine/srs.js'
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

function profileDayNumber(state) {
  const key = dayKey(state)
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return dayNumber()
  const [, year, month, day] = match
  return dayNumber(new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0))
}

function englishProgressEntry(state, knowledgeId) {
  const key = String(knowledgeId || '')
  if (key.startsWith('enw:')) return state?.englishWordStats?.[key.slice(4)] || null
  if (key.startsWith('ena:')) return state?.englishAlphabetStats?.[key.slice(4)] || null
  if (key.startsWith('enp:')) return state?.englishPhraseStats?.[key.slice(4)] || null
  if (key.startsWith('eng:')) return state?.englishPhraseStats?.[key.slice(4)] || null
  return null
}

// English keeps its own Kids Quest SRS/mastery state instead of unitReady().
// `previousLearning` is the immutable reducer snapshot immediately before the
// ANSWER mutation, so this is a presentation/pre-answer safety validation, not
// a post-answer inference from mutated mastery. It prevents mastered non-due
// English pools from becoming an A+ farm while preserving due retrieval.
function validateEnglishPresentationState(previousLearning, action, semantic) {
  if (String(action?.domainId || '') !== 'english') return semantic
  if (!semantic.qualifies || semantic.learningIntent === 'reinforcement') return semantic

  const entry = englishProgressEntry(previousLearning, semantic.knowledgeId)
  if (!entry) return semantic
  const mastered = Number(entry.stage) >= 5
  const due = Number(entry.nextDue) <= profileDayNumber(previousLearning)

  if (mastered && !due) {
    return { qualifies: false, reason: 'MASTERED_NON_DUE_ENGLISH' }
  }
  if (due) {
    return { ...semantic, learningIntent: 'srs_due' }
  }
  return semantic
}

function semanticExtraQualification(action, nextLearning) {
  if (action?.taskKind !== 'extra' || nextLearning?.daily?.coreDone !== true || action?.correct !== true) {
    return { qualifies: false, reason: 'NOT_QUALIFYING_EXTRA' }
  }
  const question = action?.question || {}
  const learningIntent = String(question.learningIntent || '')
  if (!QUALIFYING_LEARNING_INTENTS.has(learningIntent)) {
    return { qualifies: false, reason: learningIntent === 'revealed_retry' ? 'REVEALED_RETRY' : 'MISSING_OR_INVALID_PROVENANCE' }
  }
  if (question.ticketQualifyingAtPresentation !== true) {
    return { qualifies: false, reason: 'NON_QUALIFYING_AT_PRESENTATION' }
  }
  const knowledgeId = String(question.knowledgeId || action.itemKey || '').trim()
  const rewardEventId = String(question.rewardEventId || '').trim()
  if (!knowledgeId || !rewardEventId) return { qualifies: false, reason: 'MISSING_SEMANTIC_ID' }
  return { qualifies: true, knowledgeId, rewardEventId, learningIntent }
}

function recordExtraBattleTicketProgress(runtime, previousLearning, nextLearning, action) {
  const baseSemantic = semanticExtraQualification(action, nextLearning)
  const semantic = validateEnglishPresentationState(previousLearning, action, baseSemantic)
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
    // revealed retries, mastered non-due repeats and duplicate semantic events
    // cannot subsidize battle time.
    result = recordExtraBattleTicketProgress(result, previous, next, action)

    if (action.correct === true && action.taskKind === 'extra' && next?.daily?.coreDone === true) {
      const instanceId = questionInstanceId(action)
      if (instanceId) {
        const exploreId = `extra:${dayKey(next)}:${next.daily?.extraIndex || 0}:${instanceId}:explore`
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
