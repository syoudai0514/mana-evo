import { unitReady } from '../engine/learningUnits.js'
import {
  createLearningRewardMeta,
  isAdditionalLearningTask,
  queueLearningReward,
  recordAdditionalLearningAnswer,
  releaseHeldLearningRewards
} from './learningRewardPolicy.js'
import { normalizeLearningRewardRuntime } from './learningRewardStore.js'

export const EXTRA_CORRECT_PER_BATTLE_TICKET = 5

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

      // Study must remain the main activity. Real play telemetry showed an
      // average learning answer at ~7.8s and a battle at ~15.5s before V6
      // animations. Paying one battle per correct answer inverted the intended
      // time budget. Five correct extra answers now earn one battle ticket.
      const correctTotal = Math.max(0, Number(result.learningRewardMeta.additionalCorrectTotal) || 0)
      if (correctTotal > 0 && correctTotal % EXTRA_CORRECT_PER_BATTLE_TICKET === 0) {
        const milestone = Math.floor(correctTotal / EXTRA_CORRECT_PER_BATTLE_TICKET)
        result = queueGame(result, {
          id: `extra-ticket:${milestone}`,
          ticketDelta: 1,
          captureItemDelta: {},
          kind: 'extra-learning-ticket'
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
