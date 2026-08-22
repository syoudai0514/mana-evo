import React, { createContext, useContext } from 'react'
import { makeSkill } from '../engine/difficulty.js'
import { dayNumber, dueEntries } from '../engine/srs.js'
import { domainsForGrade } from '../engine/activities.js'

export const STAR_TRIAL_PASS_CORRECT = 9
export const STAR_TRIAL_QUESTIONS = 12
export const REVIEW_BATCH_MAX = 6

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

export function buildFreeTask(domainId) {
  return { uid: `free_${domainId}_${Date.now()}`, kind: 'free', domainId, questionCount: 5 }
}

export function buildCoreMission(grade = 0) {
  return domainsForGrade(grade).map((domain, index) => ({ uid: `core_${grade}_${domain.id}_${index}`, kind: 'core', domainId: domain.id, questionCount: 1 }))
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
