import { applyLearningGameRewards, projectLearningProgressionSignals } from './learningRewardBridge.js'
import { explorationStatus, performEvolutionExploration } from './explorationDomain.js'
import { applyAreaBossProgressEvent, isAdventureAreaUnlocked } from './worldProgression.js'
import { withSharedRuntimeState } from './sharedRuntimeState.js'

const MAIN_AREAS = [1, 2, 3, 4]

function positiveInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function currentMainArea(game) {
  const area = Number(game?.adventureLocation?.area)
  return MAIN_AREAS.includes(area) ? area : null
}

export function applyLearningQueues(game, {
  rewards = [],
  signals = [],
  today = 0
} = {}) {
  const rewardResult = applyLearningGameRewards(withSharedRuntimeState(game), rewards, { today })
  let next = withSharedRuntimeState(rewardResult.game)
  const projected = projectLearningProgressionSignals(signals, next.appliedLearningProgressionSignalIds)
  const area = currentMainArea(next)

  for (const signal of projected.accepted) {
    next.explorePoint = positiveInt(next.explorePoint) + signal.explorationPointDelta
    if (area && signal.worldProgressDelta > 0) {
      const applied = applyAreaBossProgressEvent(next, {
        id: `learning:${signal.id}`,
        area,
        points: signal.worldProgressDelta,
        skillId: signal.skillId
      })
      if (applied.ok) next = applied.game
    }
  }

  next.appliedLearningProgressionSignalIds = [
    ...new Set([...(next.appliedLearningProgressionSignalIds || []), ...projected.acceptedIds])
  ].slice(-4000)

  return {
    game: withSharedRuntimeState(next),
    appliedRewardIds: rewardResult.appliedIds,
    appliedSignalIds: projected.acceptedIds,
    explorationPointDelta: projected.explorationPointDelta,
    worldProgressDelta: projected.worldProgressDelta,
    progressArea: area
  }
}

export function unlockedExplorationAreaIds(game) {
  return MAIN_AREAS.filter((area) => isAdventureAreaUnlocked(game, area))
}

export function explorationStatusForGame(game, areaId) {
  return explorationStatus(game, areaId, unlockedExplorationAreaIds(game))
}

export function performGameExploration(game, options = {}) {
  return performEvolutionExploration(game, {
    ...options,
    unlockedAreaIds: unlockedExplorationAreaIds(game)
  })
}
