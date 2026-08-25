export const ADDITIONAL_LEARNING_KINDS = Object.freeze(['extra', 'okawari', 'free'])

export const LEARNING_ANTI_SPAM = Object.freeze({
  minimumSignalsToHoldBonus: 2,
  signalWindow: 8,
  veryFastAnswerMs: 650,
  veryFastRatio: 0.75,
  highErrorRatio: 0.55,
  repeatedQuestionRatio: 0.50,
  sameChoiceRatio: 0.80,
  hardQuestionFastRatio: 0.65,
  releaseAfterNormalAnswers: 3,
  uiMessage: 'ゆっくり もんだいを みて 3もん とこう！ できたら ごほうび さいかい！'
})

function positiveInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function stringOrNull(value) {
  const text = String(value || '').trim()
  return text || null
}

function normalizeAnswer(value = {}) {
  return {
    correct: value.correct === true,
    elapsedMs: Number.isFinite(Number(value.elapsedMs)) ? Math.max(0, Number(value.elapsedMs)) : null,
    questionId: stringOrNull(value.questionId),
    choiceKey: stringOrNull(value.choiceKey),
    hard: value.hard === true
  }
}

function normalizeRewardList(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value.filter((entry) => {
    const id = stringOrNull(entry?.id)
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function createLearningRewardMeta(saved = {}) {
  const hold = saved?.hold && typeof saved.hold === 'object' ? saved.hold : {}
  return {
    additionalCorrectTotal: positiveInt(saved?.additionalCorrectTotal),
    answerWindow: Array.isArray(saved?.answerWindow)
      ? saved.answerWindow.slice(-LEARNING_ANTI_SPAM.signalWindow).map(normalizeAnswer)
      : [],
    hold: {
      active: hold.active === true,
      normalAnswers: positiveInt(hold.normalAnswers),
      verificationPassed: hold.verificationPassed === true,
      gameRewards: normalizeRewardList(hold.gameRewards),
      progressionSignals: normalizeRewardList(hold.progressionSignals)
    }
  }
}

export function isAdditionalLearningTask(kind) {
  return ADDITIONAL_LEARNING_KINDS.includes(String(kind || ''))
}

function ratio(count, total) {
  return total > 0 ? count / total : 0
}

function maxValueRatio(values, total) {
  if (!total || !values.length) return 0
  const counts = new Map()
  let max = 0
  for (const value of values) {
    if (value == null) continue
    const next = (counts.get(value) || 0) + 1
    counts.set(value, next)
    if (next > max) max = next
  }
  return ratio(max, total)
}

export function analyzeLearningAntiSpam(rawWindow) {
  const window = (Array.isArray(rawWindow) ? rawWindow : [])
    .slice(-LEARNING_ANTI_SPAM.signalWindow)
    .map(normalizeAnswer)
  const total = window.length
  if (total < LEARNING_ANTI_SPAM.signalWindow) {
    return {
      suspicious: false,
      signalCount: 0,
      signals: [],
      metrics: { total }
    }
  }

  const fast = window.filter((entry) => entry.elapsedMs != null && entry.elapsedMs < LEARNING_ANTI_SPAM.veryFastAnswerMs).length
  const errors = window.filter((entry) => !entry.correct).length
  const hardAnswers = window.filter((entry) => entry.hard)
  const hardFast = hardAnswers.filter((entry) => entry.elapsedMs != null && entry.elapsedMs < LEARNING_ANTI_SPAM.veryFastAnswerMs).length
  const questionIds = window.map((entry) => entry.questionId).filter(Boolean)
  const choiceKeys = window.map((entry) => entry.choiceKey).filter(Boolean)

  const metrics = {
    total,
    veryFastRatio: ratio(fast, total),
    errorRatio: ratio(errors, total),
    repeatedQuestionRatio: maxValueRatio(questionIds, total),
    sameChoiceRatio: maxValueRatio(choiceKeys, total),
    hardQuestionFastRatio: ratio(hardFast, hardAnswers.length)
  }

  const signals = []
  if (metrics.veryFastRatio >= LEARNING_ANTI_SPAM.veryFastRatio) signals.push('very-fast')
  if (metrics.errorRatio >= LEARNING_ANTI_SPAM.highErrorRatio) signals.push('high-error')
  if (metrics.repeatedQuestionRatio >= LEARNING_ANTI_SPAM.repeatedQuestionRatio) signals.push('repeated-question')
  if (metrics.sameChoiceRatio >= LEARNING_ANTI_SPAM.sameChoiceRatio) signals.push('same-choice')
  if (hardAnswers.length > 0 && metrics.hardQuestionFastRatio >= LEARNING_ANTI_SPAM.hardQuestionFastRatio) signals.push('hard-fast')

  return {
    suspicious: signals.length >= LEARNING_ANTI_SPAM.minimumSignalsToHoldBonus,
    signalCount: signals.length,
    signals,
    metrics
  }
}

export function recordAdditionalLearningAnswer(savedMeta, answer) {
  const meta = createLearningRewardMeta(savedMeta)
  const entry = normalizeAnswer(answer)
  const answerWindow = [...meta.answerWindow, entry].slice(-LEARNING_ANTI_SPAM.signalWindow)
  const analysis = analyzeLearningAntiSpam(answerWindow)
  const wasHolding = meta.hold.active
  let hold = { ...meta.hold }
  let justHeld = false
  let justReleased = false

  if (wasHolding) {
    const isNormalAnswer = entry.elapsedMs == null || entry.elapsedMs >= LEARNING_ANTI_SPAM.veryFastAnswerMs
    const normalAnswers = isNormalAnswer ? hold.normalAnswers + 1 : 0
    const verificationPassed = hold.verificationPassed || (isNormalAnswer && entry.correct)
    if (normalAnswers >= LEARNING_ANTI_SPAM.releaseAfterNormalAnswers && verificationPassed) {
      hold = { ...hold, active: false, normalAnswers: 0, verificationPassed: false }
      justReleased = true
    } else {
      hold = { ...hold, normalAnswers, verificationPassed }
    }
  } else if (analysis.suspicious) {
    justHeld = true
    hold = { ...hold, active: true, normalAnswers: 0, verificationPassed: false }
  }

  const previousCorrectTotal = meta.additionalCorrectTotal
  const additionalCorrectTotal = previousCorrectTotal + (entry.correct ? 1 : 0)
  const starMilestones = Math.max(0, Math.floor(additionalCorrectTotal / 3) - Math.floor(previousCorrectTotal / 3))

  return {
    meta: { ...meta, answerWindow, additionalCorrectTotal, hold },
    analysis,
    starMilestones,
    justHeld,
    justReleased
  }
}

function pendingHasId(pending, id) {
  return Array.isArray(pending) && pending.some((entry) => String(entry?.id || '') === id)
}

function heldHasId(meta, bucket, id) {
  return meta.hold[bucket].some((entry) => String(entry?.id || '') === id)
}

export function queueLearningReward(savedMeta, pending, reward, {
  protectedBonus = false,
  bucket = 'gameRewards'
} = {}) {
  const meta = createLearningRewardMeta(savedMeta)
  const id = stringOrNull(reward?.id)
  const current = Array.isArray(pending) ? pending : []
  if (!id || pendingHasId(current, id) || heldHasId(meta, bucket, id)) {
    return { meta, pending: current, queued: false, held: false }
  }

  if (protectedBonus && meta.hold.active) {
    return {
      meta: {
        ...meta,
        hold: { ...meta.hold, [bucket]: [...meta.hold[bucket], reward] }
      },
      pending: current,
      queued: true,
      held: true
    }
  }
  return { meta, pending: [...current, reward], queued: true, held: false }
}

export function releaseHeldLearningRewards(savedMeta, pendingGameRewards, pendingProgressionSignals) {
  const meta = createLearningRewardMeta(savedMeta)
  if (meta.hold.active) {
    return {
      meta,
      pendingGameRewards: Array.isArray(pendingGameRewards) ? pendingGameRewards : [],
      pendingProgressionSignals: Array.isArray(pendingProgressionSignals) ? pendingProgressionSignals : [],
      released: false
    }
  }

  const appendUnique = (pending, held) => {
    const next = Array.isArray(pending) ? [...pending] : []
    const ids = new Set(next.map((entry) => String(entry?.id || '')))
    for (const entry of held) {
      const id = stringOrNull(entry?.id)
      if (!id || ids.has(id)) continue
      ids.add(id)
      next.push(entry)
    }
    return next
  }

  const pendingGame = appendUnique(pendingGameRewards, meta.hold.gameRewards)
  const pendingSignals = appendUnique(pendingProgressionSignals, meta.hold.progressionSignals)
  const released = meta.hold.gameRewards.length > 0 || meta.hold.progressionSignals.length > 0
  return {
    meta: {
      ...meta,
      hold: { ...meta.hold, gameRewards: [], progressionSignals: [] }
    },
    pendingGameRewards: pendingGame,
    pendingProgressionSignals: pendingSignals,
    released
  }
}
