import { QUESTIONS, SUBJECTS } from './questions.js'

// Kids Quest の毎日ミッションを ManaEvo 側のゲーム層から独立して保持する。
// 元実装: 5タスク / 国語・算数5問 / 通常4問 / 道徳2問。
// 現在の ManaEvo 縦切りは5科目なので、国語・算数=5問、その他=4問で固定する。
export const CORE_TASK_COUNT = 5
export const CORE_QUESTION_COUNTS = Object.freeze({
  kokugo: 5,
  sansu: 5,
  english: 4,
  rika: 4,
  thinking: 4
})
export const DAILY_TICKET_REWARD = 3
export const DAILY_STAR_REWARD = 3
export const EXTRA_QUESTION_COUNT = 3
export const EXTRA_PASS_CORRECT = 2
export const EXTRA_TICKET_REWARD = 1

function freshDaily(today) {
  return {
    day: today,
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
  }
}

function questionScore(question, state, today) {
  const attempts = (state.answers || []).filter((answer) => answer.questionId === question.id)
  const wrong = attempts.filter((answer) => !answer.correct).length
  const skill = state.skills?.[question.subject] || {}
  const targetDifficulty = Math.max(1, Math.min(3, Math.ceil((Number(skill.level) || 1) / 2)))
  const itemKey = question.itemKey || question.id
  const srs = state.srs?.[question.subject]?.[itemKey]
  const dueBoost = srs?.due != null && srs.due <= today ? 1000 : 0
  const difficultyFit = question.difficulty === targetDifficulty
    ? 30
    : -Math.abs(question.difficulty - targetDifficulty) * 8
  return dueBoost + difficultyFit + wrong * 8 - attempts.length * 0.5
}

function rankedPool(state, subjectId, today, { hard = false } = {}) {
  const grade = state.subjectGrades?.[subjectId] ?? 0
  return QUESTIONS
    .filter((question) => question.subject === subjectId && question.grade <= grade && !!question.hard === hard)
    .sort((a, b) => questionScore(b, state, today) - questionScore(a, state, today) || a.id.localeCompare(b.id))
}

function slotsForSubject(state, subjectId, count, today, prefix = 'core') {
  const pool = rankedPool(state, subjectId, today)
  if (!pool.length) return []
  return Array.from({ length: count }, (_, index) => ({
    slotId: `${prefix}:${subjectId}:${index + 1}`,
    questionId: pool[index % pool.length].id
  }))
}

function buildMission(state, today, legacyCompleted = false) {
  const tasks = SUBJECTS.slice(0, CORE_TASK_COUNT).map((subject) => ({
    taskId: `core:${subject.id}`,
    subject: subject.id,
    questionCount: CORE_QUESTION_COUNTS[subject.id] || 4,
    slots: slotsForSubject(state, subject.id, CORE_QUESTION_COUNTS[subject.id] || 4, today)
  })).filter((task) => task.slots.length > 0)
  const allSlotIds = tasks.flatMap((task) => task.slots.map((slot) => slot.slotId))
  return {
    version: 1,
    day: today,
    tasks,
    completedSlotIds: legacyCompleted ? allSlotIds : [],
    completed: legacyCompleted,
    rewardClaimed: legacyCompleted
  }
}

export function ensureKidsQuestMission(study, today) {
  const next = structuredClone(study || {})
  if (!next.daily || next.daily.day !== today) next.daily = freshDaily(today)
  const existing = next.daily.kidsQuestMission
  if (existing?.day === today && Array.isArray(existing.tasks)) return next

  // 旧「合計5問」版ですでに当日報酬を受け取ったセーブは、同じ日に二重報酬にしない。
  // 翌日から Kids Quest 基準の5タスクへ自然に切り替わる。
  const legacyCompleted = next.daily.completed === true && next.daily.rewardClaimed === true
  const mission = buildMission(next, today, legacyCompleted)
  next.daily.kidsQuestMission = mission
  next.daily.questionIds = mission.tasks.flatMap((task) => task.slots.map((slot) => slot.slotId))
  next.daily.completedQuestionIds = [...mission.completedSlotIds]
  next.daily.answered = mission.completedSlotIds.length
  next.daily.completed = mission.completed
  next.daily.rewardClaimed = mission.rewardClaimed
  return next
}

export function missionProgress(study, today) {
  const mission = study?.daily?.kidsQuestMission
  if (!mission || mission.day !== today) return null
  const done = new Set(mission.completedSlotIds || [])
  const tasks = mission.tasks.map((task) => {
    const completed = task.slots.filter((slot) => done.has(slot.slotId)).length
    return {
      ...task,
      completed,
      remaining: Math.max(0, task.slots.length - completed),
      done: completed >= task.slots.length
    }
  })
  const totalQuestions = tasks.reduce((sum, task) => sum + task.slots.length, 0)
  const completedQuestions = tasks.reduce((sum, task) => sum + task.completed, 0)
  return {
    mission,
    tasks,
    totalQuestions,
    completedQuestions,
    remainingQuestions: Math.max(0, totalQuestions - completedQuestions),
    completedTasks: tasks.filter((task) => task.done).length,
    remainingTasks: tasks.filter((task) => !task.done).length,
    completed: mission.completed || (totalQuestions > 0 && completedQuestions >= totalQuestions)
  }
}

export function nextMissionQuestion(study, today, taskId) {
  const progress = missionProgress(study, today)
  const task = progress?.tasks.find((entry) => entry.taskId === taskId)
  if (!task) return null
  const done = new Set(progress.mission.completedSlotIds || [])
  const slotIndex = task.slots.findIndex((slot) => !done.has(slot.slotId))
  if (slotIndex < 0) return null
  const slot = task.slots[slotIndex]
  const question = QUESTIONS.find((entry) => entry.id === slot.questionId)
  if (!question) return null
  return {
    ...question,
    missionSlotId: slot.slotId,
    missionTaskId: task.taskId,
    missionPosition: slotIndex + 1,
    missionQuestionCount: task.slots.length
  }
}

export function completeMissionSlot(study, today, slotId) {
  const next = ensureKidsQuestMission(study, today)
  const mission = next.daily.kidsQuestMission
  const allSlots = mission.tasks.flatMap((task) => task.slots)
  if (!allSlots.some((slot) => slot.slotId === slotId)) {
    return { state: next, justCompleted: false, ticketDelta: 0, captureItemDelta: { star: 0 } }
  }

  if (!mission.completedSlotIds.includes(slotId)) mission.completedSlotIds.push(slotId)
  const complete = mission.completedSlotIds.length >= allSlots.length && allSlots.length > 0
  const justCompleted = complete && !mission.completed
  mission.completed = complete
  if (justCompleted) mission.rewardClaimed = true

  next.daily.questionIds = allSlots.map((slot) => slot.slotId)
  next.daily.completedQuestionIds = [...mission.completedSlotIds]
  next.daily.answered = mission.completedSlotIds.length
  next.daily.completed = complete
  next.daily.rewardClaimed = mission.rewardClaimed

  return {
    state: next,
    justCompleted,
    ticketDelta: justCompleted ? DAILY_TICKET_REWARD : 0,
    captureItemDelta: { star: justCompleted ? DAILY_STAR_REWARD : 0 }
  }
}

export function buildExtraPlan(study, today, subjectId) {
  const slots = slotsForSubject(study, subjectId, EXTRA_QUESTION_COUNT, today, `extra:${today}`)
  return slots.map((slot, index) => {
    const question = QUESTIONS.find((entry) => entry.id === slot.questionId)
    return question ? { ...question, extraSlotId: slot.slotId, extraPosition: index + 1 } : null
  }).filter(Boolean)
}

export function extraTicketReward(correctCount, answeredCount = EXTRA_QUESTION_COUNT) {
  if (answeredCount < EXTRA_QUESTION_COUNT) return 0
  return correctCount >= EXTRA_PASS_CORRECT ? EXTRA_TICKET_REWARD : 0
}
