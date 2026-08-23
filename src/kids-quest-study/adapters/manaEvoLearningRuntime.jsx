import React, { createContext, useContext } from 'react'
import { makeSkill } from '../engine/difficulty.js'
import { dayNumber, dueEntries } from '../engine/srs.js'
import { domainsForGrade } from '../engine/activities.js'

export const STAR_TRIAL_PASS_CORRECT = 9
export const STAR_TRIAL_QUESTIONS = 12
export const REVIEW_BATCH_MAX = 6
export const QUESTIONS_PER_TASK = 4
export const CORE_TASK_COUNT = 5

const fallbackState = {
  grade: 0,
  gradeMax: 0,
  skills: {},
  srs: {},
  reviewSrs: {},
  starTrials: {},
  unitStats: {},
  conquered: 0,
  settings: {}
}
const RuntimeContext = createContext({ state: fallbackState, dispatch: () => {} })

export function ManaEvoLearningRuntimeProvider({ state, dispatch, children }) {
  return <RuntimeContext.Provider value={{ state: state || fallbackState, dispatch: dispatch || (() => {}) }}>{children}</RuntimeContext.Provider>
}

export function useGame() {
  return useContext(RuntimeContext)
}

export function skillOf(state, domainId) {
  return state?.skills?.[domainId] || makeSkill()
}

export function activeStatsDomainId(_state, domainId) {
  return domainId
}

export function needsReviewLesson(state, domainId) {
  return !!state?.reviewLessons?.[domainId]
}

export function activeReviewSrs(state) {
  return state?.reviewSrs || state?.srs || {}
}

export function missedCount(state) {
  return dueEntries(activeReviewSrs(state), dayNumber()).length
}

export function starTrialInfo(state, grade) {
  const rounds = state?.starTrials?.[grade]?.rounds || []
  const today = dayNumber()
  const todayDone = rounds.some((round) => Number(round.day ?? round.date) === today)
  return { rounds, todayDone }
}

let taskSeq = 0
function makeTask(domainId, kind, questionCount = QUESTIONS_PER_TASK) {
  return {
    uid: `${kind}_${domainId}_${Date.now()}_${taskSeq++}`,
    kind,
    domainId,
    questionCount
  }
}

// Kids Quest main の missions.js と同じ「5タスクを回す」選び方。
// 国語・算数は毎日、道徳は週2回程度、残りは学年に応じて日替わり。
function weeklyDomains(grade, today) {
  const available = new Set(domainsForGrade(grade).map((domain) => domain.id))
  const elective = (grade >= 3 ? ['kaku', 'rika', 'shakai', 'english'] : ['kaku', 'seikatsu', 'english'])
    .filter((id) => available.has(id))
  const day = ((today % 7) + 7) % 7
  const ids = ['yomu', 'suuji'].filter((id) => available.has(id))
  const moralDay = day === 1 || day === 5
  if (moralDay && available.has('doutoku')) ids.push('doutoku')
  for (let index = 0; ids.length < CORE_TASK_COUNT && elective.length; index++) {
    const id = elective[(day * 2 + index) % elective.length]
    if (!ids.includes(id)) ids.push(id)
  }
  return ids.slice(0, CORE_TASK_COUNT)
}

export function buildCoreMission(grade = 0, today = dayNumber()) {
  return weeklyDomains(grade, today).map((domainId) => {
    const questionCount = domainId === 'yomu' || domainId === 'suuji'
      ? 5
      : domainId === 'doutoku'
        ? 2
        : QUESTIONS_PER_TASK
    return makeTask(domainId, 'core', questionCount)
  })
}

export function buildFreeTask(domainId) {
  // Kids Quest と同じく自由勉強は1タスク4問。チケット付与はゲーム層で行わない。
  return makeTask(domainId, 'free', QUESTIONS_PER_TASK)
}

export function buildExtraTask(index = 0, grade = 0, today = dayNumber()) {
  const ids = weeklyDomains(grade, today + index)
  const domainId = ids[index % Math.max(1, ids.length)]
  return makeTask(domainId, 'extra', 3)
}

const noop = () => {}
export const sfx = {
  tap: noop,
  pop: noop,
  reward: noop,
  fanfare: noop,
  swoosh: noop,
  levelUp: noop,
  correct: noop,
  wrongSoft: noop
}
