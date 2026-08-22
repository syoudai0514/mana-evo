// Mana Evo compatibility shim for copied Kids Quest learning UI.
// No Kids Quest game state is copied; learning-facing exports come from the adapter.
export {
  REVIEW_BATCH_MAX,
  STAR_TRIAL_PASS_CORRECT,
  STAR_TRIAL_QUESTIONS,
  activeReviewSrs,
  activeStatsDomainId,
  missedCount,
  needsReviewLesson,
  skillOf,
  starTrialInfo,
  useGame
} from '../adapters/manaEvoLearningRuntime.jsx'
