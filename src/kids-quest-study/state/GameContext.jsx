import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { GameProvider as CoreGameProvider, useGame as useCoreGame } from './GameContextCore.jsx'
import { deriveLearningRewardRuntime } from './learningRewardRuntime.js'
import {
  acknowledgeLearningGameRewards,
  acknowledgeLearningProgressionSignals,
  loadLearningRewardRuntime,
  saveLearningRewardRuntime
} from './learningRewardStore.js'

// Kids Quest core contract remains implemented unchanged in GameContextCore.jsx.
// Actions: ANSWER CLEAR_TASK PICK_CORE_TASK LESSON_SEEN STAR_TRIAL_RESULT SET_GRADE
// FORCE_GRADE_MAX LOWER_GRADE_MAX SET_MIN_SELECTABLE_GRADE ENGLISH_SPEAKING_DONE SET_SETTING.
// Preserved state: unitStats writingStats englishWordStats englishPhraseStats starTrials
// lessonSeen domainAccuracy srs. W-201 only observes transitions and replaces reward delivery.

export {
  REVIEW_BATCH_MAX,
  STAR_TRIAL_QUESTIONS,
  STAR_TRIAL_ROUNDS,
  STAR_TRIAL_PASS_CORRECT,
  REVIEW_LESSON_RATE,
  skillsForGrade,
  skillOf,
  masteryProgress,
  missedCount,
  needsReviewLesson,
  starTrialInfo,
  normalizeSaved,
  activeReviewSrs,
  activeStatsDomainId
} from './GameContextCore.jsx'

const RewardContext = createContext(null)

function RewardLayer({ children }) {
  const { state: coreState, dispatch: coreDispatch } = useCoreGame()
  const profileId = coreState.activeProfileId || 'child-1'
  const [runtimeHolder, setRuntimeHolder] = useState(() => ({
    profileId,
    value: loadLearningRewardRuntime(profileId)
  }))
  const previousCoreRef = useRef(coreState)
  const actionRef = useRef({ seq: 0, action: null })
  const processedSeqRef = useRef(0)

  const updateRuntime = useCallback((updater) => {
    setRuntimeHolder((holder) => {
      const current = holder.profileId === profileId ? holder.value : loadLearningRewardRuntime(profileId)
      return { profileId, value: updater(current) }
    })
  }, [profileId])

  useEffect(() => {
    if (runtimeHolder.profileId === profileId) return
    saveLearningRewardRuntime(runtimeHolder.profileId, runtimeHolder.value)
    setRuntimeHolder({ profileId, value: loadLearningRewardRuntime(profileId) })
  }, [profileId, runtimeHolder])

  useEffect(() => {
    saveLearningRewardRuntime(runtimeHolder.profileId, runtimeHolder.value)
  }, [runtimeHolder])

  useEffect(() => {
    const previous = previousCoreRef.current
    previousCoreRef.current = coreState
    const observed = actionRef.current

    if (observed.seq !== processedSeqRef.current && observed.action) {
      processedSeqRef.current = observed.seq
      updateRuntime((current) => deriveLearningRewardRuntime(current, previous, coreState, observed.action))
    }

    // The imported Kids Quest snapshot still emits its pre-rebuild reward payloads.
    // Hide and acknowledge those here so only W-201 canonical events reach ManaEvo.
    const legacyIds = (coreState.pendingGameRewards || []).map((reward) => reward.id).filter(Boolean)
    if (legacyIds.length) coreDispatch({ type: 'ACK_GAME_REWARDS', ids: legacyIds })
  }, [coreState, coreDispatch, updateRuntime])

  const dispatch = useCallback((action) => {
    if (action?.type === 'ACK_GAME_REWARDS') {
      updateRuntime((current) => acknowledgeLearningGameRewards(current, action.ids))
      coreDispatch(action)
      return
    }
    if (action?.type === 'ACK_PROGRESSION_SIGNALS') {
      updateRuntime((current) => acknowledgeLearningProgressionSignals(current, action.ids))
      return
    }
    actionRef.current = { seq: actionRef.current.seq + 1, action }
    coreDispatch(action)
  }, [coreDispatch, updateRuntime])

  const runtime = runtimeHolder.profileId === profileId
    ? runtimeHolder.value
    : loadLearningRewardRuntime(profileId)

  const state = useMemo(() => ({
    ...coreState,
    pendingGameRewards: runtime.pendingGameRewards,
    pendingProgressionSignals: runtime.pendingProgressionSignals,
    learningRewardMeta: runtime.learningRewardMeta
  }), [coreState, runtime])

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])
  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>
}

export function GameProvider({ children }) {
  return <CoreGameProvider><RewardLayer>{children}</RewardLayer></CoreGameProvider>
}

export function useGame() {
  const context = useContext(RewardContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}
