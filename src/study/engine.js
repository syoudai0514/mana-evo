import { QUESTIONS, SUBJECTS, questionsFor } from './questions.js'
import { dayNumber, scheduleAnswer } from './srs.js'
import { applyResult, makeSkill } from './difficulty.js'

export const DAILY_REQUIRED = 5
export const DAILY_TICKET_REWARD = 3
export const FREE_STUDY_TICKET_REWARD = 1

const initialSkills = () => Object.fromEntries(SUBJECTS.map((s) => [s.id, makeSkill()]))
const initialGrades = () => Object.fromEntries(SUBJECTS.map((s) => [s.id, 0]))

export const createStudyState = () => ({
  answers: [],
  units: {},
  srs: {},
  skills: initialSkills(),
  subjectStreaks: {},
  subjectGrades: initialGrades(),
  daily: { day: dayNumber(), answered: 0, completed: false, rewardClaimed: false }
})

export function normalizeStudyState(state, today = dayNumber()) {
  const next = state ? structuredClone(state) : createStudyState()
  if (!next.daily || next.daily.day !== today) {
    next.daily = { day: today, answered: 0, completed: false, rewardClaimed: false }
  }
  next.answers ||= []
  next.units ||= {}
  next.srs ||= {}
  next.skills ||= initialSkills()
  next.subjectStreaks ||= {}
  next.subjectGrades ||= initialGrades()
  for (const subject of SUBJECTS) next.skills[subject.id] ||= makeSkill()
  return next
}

export function pickDailyQuestions(state) {
  const normalized = normalizeStudyState(state)
  return SUBJECTS.map((subject) => {
    const grade = normalized.subjectGrades[subject.id] ?? 0
    const pool = questionsFor({ subject: subject.id, grade, hard: false })
    const priorToday = new Set(normalized.answers.filter((a) => a.day === normalized.daily.day).map((a) => a.questionId))
    return pool.find((q) => !priorToday.has(q.id)) || pool[normalized.daily.day % Math.max(1, pool.length)]
  }).filter(Boolean)
}

function questionScore(question, state, mode) {
  const attempts = state.answers.filter((a) => a.questionId === question.id)
  const wrong = attempts.filter((a) => !a.correct).length
  const skill = state.skills?.[question.subject] || makeSkill()
  const targetDifficulty = Math.max(1, Math.min(3, Math.ceil(skill.level / 2)))
  let score = 0
  if (mode === 'weak') score += wrong * 5 + (skill.miss || 0) * 2
  if (mode === 'strong') score += (skill.streak || 0) * question.difficulty
  if (mode === 'challenge') score += question.hard ? 20 : question.difficulty * 3
  if (mode === 'recommended') score += wrong * 4 + (question.difficulty === targetDifficulty ? 6 : 0)
  return score - attempts.length * 0.3
}

export function pickFreeStudyQuestion(state, { mode = 'recommended', subject = null } = {}) {
  const normalized = normalizeStudyState(state)
  const subjects = subject ? [subject] : SUBJECTS.map((s) => s.id)
  const pool = QUESTIONS.filter((q) => {
    if (!subjects.includes(q.subject)) return false
    const grade = normalized.subjectGrades[q.subject] ?? 0
    if (q.grade > grade) return false
    if (mode === 'challenge') return q.hard === true
    return !q.hard
  })
  return [...pool].sort((a, b) => questionScore(b, normalized, mode) - questionScore(a, normalized, mode))[0] || null
}

function updateUnit(unit, question, correct, today, firstAttemptForQuestion) {
  const next = unit ? structuredClone(unit) : {
    attempts: 0,
    correctAttempts: 0,
    firstTryCorrect: 0,
    days: [],
    itemKeys: [],
    hardCorrect: 0,
    mastered: false,
    hardMastered: false
  }
  next.attempts += 1
  if (correct) next.correctAttempts = (next.correctAttempts || 0) + 1
  if (correct && firstAttemptForQuestion) next.firstTryCorrect += 1
  if (correct && !next.days.includes(today)) next.days.push(today)
  if (correct && question.itemKey && !next.itemKeys.includes(question.itemKey)) next.itemKeys.push(question.itemKey)
  if (correct && question.hard) next.hardCorrect += 1

  if (question.hard) {
    // The vertical slice may have one challenge item per hard unit. Require repeat success
    // across separate days instead of making a second item mandatory before the full
    // Kids Quest hard-content pool is migrated.
    next.hardMastered = next.attempts >= 3 && next.hardCorrect >= 2 && next.days.length >= 2
  } else {
    next.mastered = next.attempts >= 4 && next.firstTryCorrect >= 3 && next.days.length >= 2 && next.itemKeys.length >= 2
  }
  return next
}

export function answerQuestion(state, question, selected, { context = 'daily', today = dayNumber() } = {}) {
  const next = normalizeStudyState(state, today)
  const correct = selected === question.answer
  const priorForQuestion = next.answers.filter((a) => a.questionId === question.id)
  const answer = { questionId: question.id, subject: question.subject, unitId: question.unitId, correct, day: today, context }
  next.answers.push(answer)

  const difficultyResult = applyResult(next.skills[question.subject] || makeSkill(), correct)
  next.skills[question.subject] = difficultyResult.skill
  next.subjectStreaks[question.subject] = correct ? (next.subjectStreaks[question.subject] || 0) + 1 : 0
  next.units[question.unitId] = updateUnit(next.units[question.unitId], question, correct, today, priorForQuestion.length === 0)

  next.srs[question.subject] ||= {}
  const scheduled = scheduleAnswer(next.srs[question.subject][question.itemKey], correct, today)
  next.srs[question.subject][question.itemKey] = scheduled.entry

  let ticketDelta = 0
  if (context === 'daily') {
    next.daily.answered += 1
    if (!next.daily.completed && next.daily.answered >= DAILY_REQUIRED) {
      next.daily.completed = true
      if (!next.daily.rewardClaimed) {
        next.daily.rewardClaimed = true
        ticketDelta += DAILY_TICKET_REWARD
      }
    }
  }
  if (context === 'free' && correct) ticketDelta += FREE_STUDY_TICKET_REWARD

  return {
    state: next,
    correct,
    ticketDelta,
    unit: next.units[question.unitId],
    difficulty: difficultyResult
  }
}

export function unitMastery(unit) {
  const value = unit || { attempts: 0, firstTryCorrect: 0, days: [], itemKeys: [] }
  return {
    attempts: Math.min(1, (value.attempts || 0) / 4),
    firstTry: Math.min(1, (value.firstTryCorrect || 0) / 3),
    days: Math.min(1, (value.days || []).length / 2),
    variety: Math.min(1, (value.itemKeys || []).length / 2),
    mastered: !!value.mastered,
    hardMastered: !!value.hardMastered
  }
}

export function subjectMastery(state, subject) {
  const units = Object.entries(state?.units || {}).filter(([unitId]) => {
    const q = QUESTIONS.find((question) => question.unitId === unitId)
    return q?.subject === subject && !q.hard
  })
  if (!units.length) return 0
  return units.filter(([, unit]) => unit.mastered).length / units.length
}

export function canAdvanceSubjectGrade(state, subject) {
  return subjectMastery(state, subject) >= 1
}
