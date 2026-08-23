import { QUESTIONS, SUBJECTS, questionsFor } from './questions.js'
import { dayNumber, scheduleAnswer } from './srs.js'
import { applyResult, makeSkill } from './difficulty.js'
import { unitReady as kidsQuestUnitReady } from '../kids-quest-study/engine/learningUnits.js'

export const DAILY_REQUIRED = 5
export const DAILY_TICKET_REWARD = 3
export const FREE_STUDY_TICKET_REWARD = 1
export const FAST_WRONG_MS = 1500

const initialSkills = () => Object.fromEntries(SUBJECTS.map((s) => [s.id, makeSkill()]))
const initialGrades = () => Object.fromEntries(SUBJECTS.map((s) => [s.id, 0]))
const newDaily = (day = dayNumber()) => ({
  day,
  questionIds: [],
  completedQuestionIds: [],
  remediatedQuestionIds: [],
  explanationAcknowledgedQuestionIds: [],
  remediationPassedQuestionIds: [],
  reinforcementPassedQuestionIds: [],
  extraCorrect: 0,
  answered: 0,
  completed: false,
  rewardClaimed: false,
  fastWrong: 0,
  suspicious: false
})

export const createStudyState = () => ({
  answers: [],
  units: {},
  srs: {},
  skills: initialSkills(),
  subjectStreaks: {},
  subjectGrades: initialGrades(),
  daily: newDaily()
})

function normalizeDaily(daily, today) {
  if (!daily || daily.day !== today) return newDaily(today)
  const migrated = { ...newDaily(today), ...daily }
  migrated.questionIds = Array.isArray(daily.questionIds) ? [...new Set(daily.questionIds)] : []
  migrated.completedQuestionIds = Array.isArray(daily.completedQuestionIds) ? [...new Set(daily.completedQuestionIds)] : []
  migrated.remediatedQuestionIds = Array.isArray(daily.remediatedQuestionIds) ? [...new Set(daily.remediatedQuestionIds)] : []
  migrated.explanationAcknowledgedQuestionIds = Array.isArray(daily.explanationAcknowledgedQuestionIds) ? [...new Set(daily.explanationAcknowledgedQuestionIds)] : []
  migrated.remediationPassedQuestionIds = Array.isArray(daily.remediationPassedQuestionIds) ? [...new Set(daily.remediationPassedQuestionIds)] : []
  migrated.reinforcementPassedQuestionIds = Array.isArray(daily.reinforcementPassedQuestionIds) ? [...new Set(daily.reinforcementPassedQuestionIds)] : []
  migrated.extraCorrect = Math.max(0, Number(daily.extraCorrect) || 0)
  // Old saves only stored `answered`, which could count wrong taps. Never reconstruct
  // completion from that unsafe counter. Preserve an already-claimed daily reward only.
  if (!Array.isArray(daily.completedQuestionIds)) {
    migrated.completedQuestionIds = []
    if (daily.completed && daily.rewardClaimed) {
      migrated.completed = true
      migrated.answered = DAILY_REQUIRED
    } else {
      migrated.completed = false
      migrated.rewardClaimed = false
      migrated.answered = 0
    }
  }
  migrated.answered = migrated.completed ? DAILY_REQUIRED : Math.min(DAILY_REQUIRED, migrated.completedQuestionIds.length)
  migrated.fastWrong = Math.max(0, Number(migrated.fastWrong) || 0)
  migrated.suspicious = !!migrated.suspicious
  return migrated
}

export function normalizeStudyState(state, today = dayNumber()) {
  const next = state ? structuredClone(state) : createStudyState()
  next.daily = normalizeDaily(next.daily, today)
  next.answers ||= []
  next.units ||= {}
  next.srs ||= {}
  next.skills ||= initialSkills()
  next.subjectStreaks ||= {}
  next.subjectGrades ||= initialGrades()
  for (const subject of SUBJECTS) next.skills[subject.id] ||= makeSkill()
  return next
}

function srsEntryFor(question, state) {
  const key = question.itemKey || question.id
  return state.srs?.[question.subject]?.[key] || null
}

function isDue(question, state, today = state.daily?.day ?? dayNumber()) {
  const entry = srsEntryFor(question, state)
  return entry?.due != null && entry.due <= today
}

function targetDifficulty(state, subject) {
  const skill = state.skills?.[subject] || makeSkill()
  return Math.max(1, Math.min(3, Math.ceil((Number(skill.level) || 1) / 2)))
}

function selectionScore(question, state, { mode = 'recommended', today = state.daily?.day ?? dayNumber() } = {}) {
  const attempts = state.answers.filter((a) => a.questionId === question.id)
  const wrong = attempts.filter((a) => !a.correct).length
  const skill = state.skills?.[question.subject] || makeSkill()
  const target = targetDifficulty(state, question.subject)
  const dueBoost = isDue(question, state, today) ? 1000 : 0
  const difficultyFit = question.difficulty === target ? 30 : -Math.abs(question.difficulty - target) * 8
  let score = dueBoost + difficultyFit
  if (mode === 'weak') score += wrong * 12 + (skill.miss || 0) * 3
  if (mode === 'strong') score += (skill.streak || 0) * question.difficulty * 2
  if (mode === 'challenge') score += question.hard ? 60 : question.difficulty * 4
  if (mode === 'recommended') score += wrong * 8
  return score - attempts.length * 0.5
}

function chooseForSubject(state, subjectId) {
  const grade = state.subjectGrades[subjectId] ?? 0
  const pool = questionsFor({ subject: subjectId, grade, hard: false })
  return [...pool].sort((a, b) => selectionScore(b, state) - selectionScore(a, state) || a.id.localeCompare(b.id))[0] || null
}

export function startDailySession(state, today = dayNumber()) {
  const next = normalizeStudyState(state, today)
  if (!next.daily.questionIds.length && !next.daily.completed) {
    next.daily.questionIds = SUBJECTS.map((subject) => chooseForSubject(next, subject.id)?.id).filter(Boolean).slice(0, DAILY_REQUIRED)
  }
  return { state: next, questions: pickDailyQuestions(next, today) }
}

export function pickDailyQuestions(state, today = state?.daily?.day ?? dayNumber()) {
  const normalized = normalizeStudyState(state, today)
  const ids = normalized.daily.questionIds.length
    ? normalized.daily.questionIds
    : SUBJECTS.map((subject) => chooseForSubject(normalized, subject.id)?.id).filter(Boolean).slice(0, DAILY_REQUIRED)
  return ids.map((id) => QUESTIONS.find((q) => q.id === id)).filter(Boolean)
}

export function remainingDailyQuestions(state, today = state?.daily?.day ?? dayNumber()) {
  const normalized = normalizeStudyState(state, today)
  const completed = new Set(normalized.daily.completedQuestionIds)
  return pickDailyQuestions(normalized, today).filter((q) => !completed.has(q.id))
}

function questionScore(question, state, mode) {
  return selectionScore(question, state, { mode })
}

export function pickFreeStudyQuestion(state, { mode = 'recommended', subject = null } = {}) {
  const normalized = normalizeStudyState(state, state?.daily?.day ?? dayNumber())
  const subjects = subject ? [subject] : SUBJECTS.map((s) => s.id)
  const pool = QUESTIONS.filter((q) => {
    if (!subjects.includes(q.subject)) return false
    const grade = normalized.subjectGrades[q.subject] ?? 0
    if (q.grade > grade) return false
    if (mode === 'challenge') return q.hard === true
    return !q.hard
  })
  return [...pool].sort((a, b) => questionScore(b, normalized, mode) - questionScore(a, normalized, mode) || a.id.localeCompare(b.id))[0] || null
}

function itemRequirementFor(question) {
  const count = new Set(QUESTIONS.filter((q) => q.unitId === question.unitId && !!q.hard === !!question.hard).map((q) => q.itemKey).filter(Boolean)).size
  return Math.min(2, Math.max(1, count || 1))
}

function updateUnit(unit, question, correct, today, firstAttemptForPresentation) {
  const next = unit ? structuredClone(unit) : {
    attempts: 0,
    correctAttempts: 0,
    firstTryCorrect: 0,
    days: [],
    itemKeys: [],
    itemRequirement: itemRequirementFor(question),
    hardCorrect: 0,
    mastered: false,
    hardMastered: false
  }
  next.itemRequirement = itemRequirementFor(question)
  next.attempts += 1
  if (correct) next.correctAttempts = (next.correctAttempts || 0) + 1
  if (correct && firstAttemptForPresentation) next.firstTryCorrect += 1
  if (correct && !next.days.includes(today)) next.days.push(today)
  if (correct && question.itemKey && !next.itemKeys.includes(question.itemKey)) next.itemKeys.push(question.itemKey)
  if (correct && question.hard) next.hardCorrect += 1

  if (question.hard) {
    next.hardMastered = next.attempts >= 3 && next.hardCorrect >= 2 && next.days.length >= 2
  } else {
    next.mastered = kidsQuestUnitReady({
      attempts: next.attempts,
      firstAttemptCorrect: next.firstTryCorrect,
      successDays: next.days,
      itemKeys: next.itemKeys,
      itemRequirement: next.itemRequirement
    }, next.itemRequirement)
  }
  return next
}

function emptyCaptureDelta() {
  return { star: 0, silver: 0, gold: 0, rainbow: 0 }
}

function completeDailyItem(next, questionId) {
  const reward = { ticketDelta: 0, captureItemDelta: emptyCaptureDelta() }
  if (!next.daily.questionIds.includes(questionId)) return reward
  if (!next.daily.completedQuestionIds.includes(questionId)) next.daily.completedQuestionIds.push(questionId)
  next.daily.answered = Math.min(DAILY_REQUIRED, next.daily.completedQuestionIds.length)
  if (!next.daily.completed && next.daily.completedQuestionIds.length >= DAILY_REQUIRED) {
    next.daily.completed = true
    if (!next.daily.rewardClaimed) {
      next.daily.rewardClaimed = true
      reward.ticketDelta = DAILY_TICKET_REWARD
      reward.captureItemDelta.star = 3
    }
  }
  return reward
}

function mergeCaptureDelta(a = emptyCaptureDelta(), b = emptyCaptureDelta()) {
  return Object.fromEntries(['star', 'silver', 'gold', 'rainbow'].map((id) => [id, (a[id] || 0) + (b[id] || 0)]))
}

function recordAttempt(next, question, selected, { context, today, elapsedMs = null } = {}) {
  const correct = selected === question.answer
  const priorTodayForQuestion = next.answers.filter((a) => a.questionId === question.id && a.day === today)
  const fastWrong = !correct && Number.isFinite(elapsedMs) && elapsedMs < FAST_WRONG_MS
  next.answers.push({
    questionId: question.id,
    subject: question.subject,
    unitId: question.unitId,
    correct,
    day: today,
    context,
    elapsedMs: Number.isFinite(elapsedMs) ? elapsedMs : null,
    fastWrong
  })

  const difficultyResult = applyResult(next.skills[question.subject] || makeSkill(), correct)
  next.skills[question.subject] = difficultyResult.skill
  next.subjectStreaks[question.subject] = correct ? (next.subjectStreaks[question.subject] || 0) + 1 : 0
  next.units[question.unitId] = updateUnit(next.units[question.unitId], question, correct, today, priorTodayForQuestion.length === 0)

  next.srs[question.subject] ||= {}
  const itemKey = question.itemKey || question.id
  const scheduled = scheduleAnswer(next.srs[question.subject][itemKey], correct, today)
  next.srs[question.subject][itemKey] = scheduled.entry
  return { correct, fastWrong, difficultyResult }
}

export function reinforcementQuestionFor(state, originalQuestion) {
  if (!originalQuestion) return null
  const grade = state?.subjectGrades?.[originalQuestion.subject] ?? originalQuestion.grade ?? 0
  const pool = QUESTIONS.filter((q) =>
    !q.hard && q.subject === originalQuestion.subject && q.grade <= grade && q.id !== originalQuestion.id
  )
  return [...pool].sort((a, b) => {
    const sameUnitA = a.unitId === originalQuestion.unitId ? 1 : 0
    const sameUnitB = b.unitId === originalQuestion.unitId ? 1 : 0
    return sameUnitB - sameUnitA || selectionScore(b, state) - selectionScore(a, state) || a.id.localeCompare(b.id)
  })[0] || originalQuestion
}

export function answerQuestion(state, question, selected, { context = 'daily', today = dayNumber(), elapsedMs = null } = {}) {
  let next = normalizeStudyState(state, today)
  if (context === 'daily' && !next.daily.questionIds.length) next = startDailySession(next, today).state
  const hadWrongBefore = next.answers.some((a) => a.day === today && a.questionId === question.id && a.context === 'daily' && !a.correct)
  const attempt = recordAttempt(next, question, selected, { context, today, elapsedMs })

  let ticketDelta = 0
  let captureItemDelta = emptyCaptureDelta()
  let needsRemediation = false
  let needsReinforcement = false

  if (context === 'daily') {
    if (attempt.fastWrong) next.daily.fastWrong += 1
    next.daily.suspicious = next.daily.fastWrong >= Math.ceil(DAILY_REQUIRED / 2)

    if (!attempt.correct) {
      needsRemediation = true
    } else if (!hadWrongBefore) {
      const reward = completeDailyItem(next, question.id)
      ticketDelta += reward.ticketDelta
      captureItemDelta = mergeCaptureDelta(captureItemDelta, reward.captureItemDelta)
    } else {
      const acknowledged = next.daily.explanationAcknowledgedQuestionIds.includes(question.id)
      if (!acknowledged) {
        // A caller cannot bypass remediation simply by calling answerQuestion again.
        needsRemediation = true
      } else {
        if (!next.daily.remediationPassedQuestionIds.includes(question.id)) next.daily.remediationPassedQuestionIds.push(question.id)
        if (next.daily.suspicious && !next.daily.reinforcementPassedQuestionIds.includes(question.id)) {
          needsReinforcement = true
        } else {
          if (!next.daily.remediatedQuestionIds.includes(question.id)) next.daily.remediatedQuestionIds.push(question.id)
          const reward = completeDailyItem(next, question.id)
          ticketDelta += reward.ticketDelta
          captureItemDelta = mergeCaptureDelta(captureItemDelta, reward.captureItemDelta)
        }
      }
    }
  }

  if (context === 'free' && attempt.correct && next.daily.completed) {
    ticketDelta += FREE_STUDY_TICKET_REWARD
    next.daily.extraCorrect += 1
    if (next.daily.extraCorrect % 3 === 0) captureItemDelta.star += 1
  }

  return {
    state: next,
    correct: attempt.correct,
    fastWrong: attempt.fastWrong,
    needsRemediation,
    needsReinforcement,
    ticketDelta,
    captureItemDelta,
    unit: next.units[question.unitId],
    difficulty: attempt.difficultyResult
  }
}

export function acknowledgeExplanation(state, question, { context = 'daily', today = dayNumber() } = {}) {
  let next = normalizeStudyState(state, today)
  if (context !== 'daily') return { state: next, acknowledged: false }
  if (!next.daily.questionIds.length) next = startDailySession(next, today).state
  const hadWrongAttempt = next.answers.some((a) => a.day === today && a.questionId === question.id && a.context === 'daily' && !a.correct)
  if (!hadWrongAttempt) return { state: next, acknowledged: false }
  if (!next.daily.explanationAcknowledgedQuestionIds.includes(question.id)) next.daily.explanationAcknowledgedQuestionIds.push(question.id)
  return { state: next, acknowledged: true }
}

export function answerReinforcementQuestion(state, originalQuestion, checkQuestion, selected, { today = dayNumber(), elapsedMs = null } = {}) {
  let next = normalizeStudyState(state, today)
  const remediationPassed = next.daily.remediationPassedQuestionIds.includes(originalQuestion.id)
  if (!next.daily.suspicious || !remediationPassed) {
    return { state: next, correct: false, completed: false, ticketDelta: 0, captureItemDelta: emptyCaptureDelta(), reason: 'REINFORCEMENT_NOT_REQUIRED' }
  }

  const attempt = recordAttempt(next, checkQuestion, selected, { context: 'reinforcement', today, elapsedMs })
  if (!attempt.correct) {
    return { state: next, correct: false, completed: false, needsRemediation: true, ticketDelta: 0, captureItemDelta: emptyCaptureDelta() }
  }

  if (!next.daily.reinforcementPassedQuestionIds.includes(originalQuestion.id)) next.daily.reinforcementPassedQuestionIds.push(originalQuestion.id)
  if (!next.daily.remediatedQuestionIds.includes(originalQuestion.id)) next.daily.remediatedQuestionIds.push(originalQuestion.id)
  const reward = completeDailyItem(next, originalQuestion.id)
  return {
    state: next,
    correct: true,
    completed: true,
    ticketDelta: reward.ticketDelta,
    captureItemDelta: reward.captureItemDelta
  }
}

// Backward-compatible name kept only for old callers/tests. It now acknowledges the
// explanation and deliberately does NOT complete the daily item.
export function completeRemediation(state, question, options = {}) {
  const result = acknowledgeExplanation(state, question, options)
  return { state: result.state, completed: false, acknowledged: result.acknowledged, ticketDelta: 0, captureItemDelta: emptyCaptureDelta() }
}

export function unitMastery(unit) {
  const value = unit || { attempts: 0, firstTryCorrect: 0, days: [], itemKeys: [], itemRequirement: 2 }
  const requirement = Math.max(1, value.itemRequirement || 2)
  return {
    attempts: Math.min(1, (value.attempts || 0) / 4),
    firstTry: Math.min(1, (value.firstTryCorrect || 0) / 3),
    days: Math.min(1, (value.days || []).length / 2),
    variety: Math.min(1, (value.itemKeys || []).length / requirement),
    mastered: !!value.mastered,
    hardMastered: !!value.hardMastered
  }
}

export function requiredNormalUnitIds(state, subject) {
  const grade = state?.subjectGrades?.[subject] ?? 0
  return [...new Set(QUESTIONS.filter((q) => q.subject === subject && !q.hard && q.grade <= grade).map((q) => q.unitId))]
}

export function subjectMastery(state, subject) {
  const required = requiredNormalUnitIds(state, subject)
  if (!required.length) return 0
  return required.filter((unitId) => state?.units?.[unitId]?.mastered).length / required.length
}

export function canAdvanceSubjectGrade(state, subject) {
  return subjectMastery(state, subject) >= 1
}
