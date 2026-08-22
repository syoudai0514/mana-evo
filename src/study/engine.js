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

function completeDailyItem(next, questionId) {
  if (!next.daily.questionIds.includes(questionId)) return 0
  if (!next.daily.completedQuestionIds.includes(questionId)) next.daily.completedQuestionIds.push(questionId)
  next.daily.answered = Math.min(DAILY_REQUIRED, next.daily.completedQuestionIds.length)
  let ticketDelta = 0
  if (!next.daily.completed && next.daily.completedQuestionIds.length >= DAILY_REQUIRED) {
    next.daily.completed = true
    if (!next.daily.rewardClaimed) {
      next.daily.rewardClaimed = true
      ticketDelta = DAILY_TICKET_REWARD
    }
  }
  return ticketDelta
}

export function answerQuestion(state, question, selected, { context = 'daily', today = dayNumber(), elapsedMs = null } = {}) {
  let next = normalizeStudyState(state, today)
  if (context === 'daily' && !next.daily.questionIds.length) next = startDailySession(next, today).state
  const correct = selected === question.answer
  const priorTodayForQuestion = next.answers.filter((a) => a.questionId === question.id && a.day === today)
  const fastWrong = !correct && Number.isFinite(elapsedMs) && elapsedMs < FAST_WRONG_MS
  const answer = { questionId: question.id, subject: question.subject, unitId: question.unitId, correct, day: today, context, elapsedMs: Number.isFinite(elapsedMs) ? elapsedMs : null, fastWrong }
  next.answers.push(answer)

  const difficultyResult = applyResult(next.skills[question.subject] || makeSkill(), correct)
  next.skills[question.subject] = difficultyResult.skill
  next.subjectStreaks[question.subject] = correct ? (next.subjectStreaks[question.subject] || 0) + 1 : 0
  next.units[question.unitId] = updateUnit(next.units[question.unitId], question, correct, today, priorTodayForQuestion.length === 0)

  next.srs[question.subject] ||= {}
  const itemKey = question.itemKey || question.id
  const scheduled = scheduleAnswer(next.srs[question.subject][itemKey], correct, today)
  next.srs[question.subject][itemKey] = scheduled.entry

  let ticketDelta = 0
  if (context === 'daily') {
    if (fastWrong) next.daily.fastWrong += 1
    next.daily.suspicious = next.daily.fastWrong >= Math.ceil(DAILY_REQUIRED / 2)
    if (correct) ticketDelta += completeDailyItem(next, question.id)
  }
  // Free study is intentionally never a bypass around the daily five-subject baseline.
  if (context === 'free' && correct && next.daily.completed) ticketDelta += FREE_STUDY_TICKET_REWARD

  return {
    state: next,
    correct,
    fastWrong,
    needsRemediation: context === 'daily' && !correct,
    ticketDelta,
    unit: next.units[question.unitId],
    difficulty: difficultyResult
  }
}

export function completeRemediation(state, question, { context = 'daily', today = dayNumber() } = {}) {
  let next = normalizeStudyState(state, today)
  if (context !== 'daily') return { state: next, completed: false, ticketDelta: 0 }
  if (!next.daily.questionIds.length) next = startDailySession(next, today).state
  const hadWrongAttempt = next.answers.some((a) => a.day === today && a.questionId === question.id && a.context === 'daily' && !a.correct)
  if (!hadWrongAttempt) return { state: next, completed: false, ticketDelta: 0 }
  if (!next.daily.remediatedQuestionIds.includes(question.id)) next.daily.remediatedQuestionIds.push(question.id)
  const ticketDelta = completeDailyItem(next, question.id)
  return { state: next, completed: true, ticketDelta }
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
