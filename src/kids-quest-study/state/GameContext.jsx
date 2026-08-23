import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, todayKey, profileSnapshot, saveProfileSnapshot } from '../engine/storage.js'
import { makeSkill, applyResult } from '../engine/difficulty.js'
import { buildCoreMission } from '../engine/missions.js'
import { DOMAINS } from '../engine/activities.js'
import { MAX_GRADE } from '../data/grades.js'
import { dayNumber, isDue, scheduleAnswer, scheduleNext, dueCount } from '../engine/srs.js'
import { DEFAULT_TTS_RATE, migrateTtsRate } from '../config/ttsRates.js'
import { persistentReviewSnapshot } from '../engine/reviewKey.js'
import { advanceEnglishProgress, emptyEnglishProgress, englishDueEntries } from '../engine/englishProgress.js'
import { recordUnitResult, promotionResult, unitLedger, unitReady } from '../engine/learningUnits.js'
import { freshDailyMission, lowerGradeProgress } from '../engine/gradeReset.js'
import { activeReviewSrs, activeStatsDomainId } from '../engine/reviewMode.js'
export { activeReviewSrs, activeStatsDomainId } from '../engine/reviewMode.js'

export const REVIEW_BATCH_MAX = 8
export const STAR_TRIAL_QUESTIONS = 6
export const STAR_TRIAL_ROUNDS = 2
export const STAR_TRIAL_PASS_CORRECT = 9
const CONTENT_VERSION = 16

function freshSkills() {
  return Object.fromEntries(DOMAINS.map((domain) => [domain.id, makeSkill()]))
}

export function skillsForGrade(state, grade = state.grade) {
  return state.skills?.[grade] || freshSkills()
}

export function skillOf(state, domainId, grade = state.grade) {
  return skillsForGrade(state, grade)[domainId] || makeSkill()
}

export function masteryProgress(state) {
  const ledger = unitLedger(state.grade)
  if (!ledger.length) return 0
  const done = ledger.filter(({ domainId, unitId }) => unitReady(state.unitStats?.[state.grade]?.[domainId]?.[unitId])).length
  return done / ledger.length
}

export function missedCount(state) {
  return dueCount(activeReviewSrs(state)) + englishDueEntries(state, dayNumber()).length
}

export const REVIEW_LESSON_RATE = 0.6
export function needsReviewLesson(state, domainId, grade = state.grade) {
  const a = state.domainAccuracy?.[`${grade}:${domainId}`]
  return !!a && a.n >= 5 && a.c / a.n < REVIEW_LESSON_RATE
}

export function starTrialInfo(state, grade = state.grade) {
  const rounds = state.starTrials?.[grade]?.rounds || []
  const relevant = rounds.slice(-STAR_TRIAL_ROUNDS)
  const correct = relevant.reduce((sum, round) => sum + (round.correct || 0), 0)
  const total = relevant.reduce((sum, round) => sum + (round.total || 0), 0)
  const last = relevant[relevant.length - 1]
  return {
    rounds: relevant,
    correct,
    total,
    remainingRounds: Math.max(0, STAR_TRIAL_ROUNDS - relevant.length),
    todayDone: last?.day === dayNumber(),
    passed: promotionResult(state, grade).passed
  }
}

function settingsForCurrentVersion(saved = {}) {
  const savedRate = migrateTtsRate(saved.ttsRate)
  return {
    tts: saved.tts ?? true,
    ttsRate: savedRate ?? DEFAULT_TTS_RATE,
    ttsRateScheme: 'dictionary-v4',
    ttsVolume: saved.ttsVolume ?? 0.9,
    ttsVoice: saved.ttsVoice === 'device' ? 'device' : 'neural',
    sfx: saved.sfx ?? true,
    bgm: false,
    showLifeEndTopics: saved.showLifeEndTopics ?? false,
    mode: saved.mode === 'hard' ? 'hard' : 'normal',
    minSelectableGrade: Math.max(0, Number(saved.minSelectableGrade) || 0)
  }
}

function createInitialState() {
  const today = todayKey()
  return {
    version: 4,
    contentVersion: CONTENT_VERSION,
    createdAt: Date.now(),
    grade: 0,
    gradeMax: 0,
    pendingGradeUp: null,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    conquered: 0,
    skills: { 0: freshSkills() },
    srs: {},
    unitStats: {},
    writingStats: {},
    englishWordStats: {},
    englishPhraseStats: {},
    englishAlphabetStats: {},
    reviewQuestions: {},
    testPassed: {},
    starTrials: {},
    lessonSeen: {},
    domainAccuracy: {},
    daily: freshDailyMission(today, 0),
    settings: settingsForCurrentVersion(),
    history: {},
    pendingGameRewards: []
  }
}

function normalizeProfileSaved(saved) {
  const fresh = createInitialState()
  if (!saved || typeof saved !== 'object') return fresh
  const gradeMax = Math.max(0, Math.min(MAX_GRADE, Number(saved.gradeMax) || 0))
  const grade = Math.max(0, Math.min(gradeMax, Number(saved.grade) || 0))
  const sameDay = saved.daily?.date === todayKey()
  const daily = sameDay
    ? { ...freshDailyMission(todayKey(), grade), ...saved.daily }
    : freshDailyMission(todayKey(), grade)
  daily.coreDone = daily.coreDone === true || daily.coreIndex >= daily.coreTasks.length
  const next = {
    ...fresh,
    ...saved,
    version: 4,
    contentVersion: CONTENT_VERSION,
    grade,
    gradeMax,
    settings: settingsForCurrentVersion(saved.settings),
    skills: saved.skills && typeof saved.skills === 'object' ? saved.skills : { 0: freshSkills() },
    srs: saved.srs || {},
    unitStats: saved.unitStats || {},
    writingStats: saved.writingStats || {},
    englishWordStats: saved.englishWordStats || {},
    englishPhraseStats: saved.englishPhraseStats || {},
    englishAlphabetStats: saved.englishAlphabetStats || {},
    reviewQuestions: saved.reviewQuestions || {},
    testPassed: saved.testPassed || {},
    starTrials: saved.starTrials || {},
    lessonSeen: saved.lessonSeen || {},
    domainAccuracy: saved.domainAccuracy || {},
    history: saved.history || {},
    pendingGameRewards: Array.isArray(saved.pendingGameRewards) ? saved.pendingGameRewards : [],
    daily
  }
  if (!next.skills[grade]) next.skills = { ...next.skills, [grade]: freshSkills() }
  for (let g = 0; g <= gradeMax; g++) {
    if (g > 0 && !next.testPassed[g - 1]) {
      next.testPassed[g - 1] = { rate: 1, passed: true, at: next.createdAt, grandfathered: true }
    }
  }
  return next
}

export function normalizeSaved(saved) {
  const envelope = saved?.profiles && typeof saved.profiles === 'object' ? saved : null
  const activeProfileId = envelope?.activeProfileId && envelope.profiles[envelope.activeProfileId] ? envelope.activeProfileId : 'child-1'
  const base = normalizeProfileSaved(envelope ? envelope.profiles[activeProfileId]?.state : saved)
  const profiles = { ...(envelope?.profiles || {}) }
  profiles[activeProfileId] = {
    name: profiles[activeProfileId]?.name || 'ぼうけんしゃ 1',
    state: profileSnapshot(base)
  }
  return { ...base, activeProfileId, profiles }
}

function rolloverIfNeeded(state) {
  const today = todayKey()
  if (state.daily?.date === today) return state
  const history = { ...state.history }
  if (state.daily?.attemptsToday > 0) {
    history[state.daily.date] = {
      clears: state.daily.tasksClearedToday,
      correct: state.daily.correctToday,
      attempts: state.daily.attemptsToday,
      perDomain: state.daily.perDomainToday,
      ticketsEarned: state.daily.ticketsEarnedToday
    }
  }
  return { ...state, history, daily: freshDailyMission(today, state.grade) }
}

function yesterdayKey() { return todayKey(new Date(Date.now() - 86400000)) }
function addDomainTally(perDomain, domainId, correct) {
  const cur = perDomain?.[domainId] || { correct: 0, attempts: 0 }
  return { ...(perDomain || {}), [domainId]: { correct: cur.correct + (correct ? 1 : 0), attempts: cur.attempts + 1 } }
}

function switchGrade(state, grade) {
  if (grade === state.grade) return state
  const tasks = buildCoreMission(grade)
  return {
    ...state,
    grade,
    skills: state.skills[grade] ? state.skills : { ...state.skills, [grade]: freshSkills() },
    daily: {
      ...state.daily,
      coreTasks: tasks,
      coreIndex: Math.min(state.daily.coreIndex, tasks.length),
      coreDone: state.daily.coreIndex >= tasks.length
    }
  }
}

function enqueueReward(state, reward) {
  const queue = state.pendingGameRewards || []
  if (queue.some((entry) => entry.id === reward.id)) return state
  return { ...state, pendingGameRewards: [...queue, reward] }
}

function reduceProfile(state, action) {
  switch (action.type) {
    case 'ROLLOVER': return rolloverIfNeeded(state)

    case 'SET_GRADE': {
      const min = state.settings?.minSelectableGrade || 0
      const grade = Math.max(min, Math.min(state.gradeMax, Number(action.grade) || 0))
      return switchGrade(state, grade)
    }

    case 'SET_MIN_SELECTABLE_GRADE': {
      const minSelectableGrade = Math.max(0, Math.min(state.gradeMax, Number(action.grade) || 0))
      const next = { ...state, settings: { ...state.settings, minSelectableGrade } }
      return next.grade < minSelectableGrade ? switchGrade(next, minSelectableGrade) : next
    }

    case 'ANSWER': {
      const { domainId, correct, itemKey, unitId } = action
      const grade = state.grade
      const hard = String(action.question?.itemKey || itemKey || '').startsWith('hard:')
      const statsId = hard ? `hard:${domainId}` : domainId
      const gradeSkills = skillsForGrade(state)
      const { skill: newSkill } = applyResult(gradeSkills[statsId] || makeSkill(), correct)
      const today = todayKey()
      const streak = state.lastActiveDate === today ? state.streak : state.lastActiveDate === yesterdayKey() ? state.streak + 1 : 1
      const lastActiveDate = today

      let srs = state.srs
      let reviewQuestions = state.reviewQuestions || {}
      let conquered = state.conquered
      if (itemKey && (domainId !== 'english' || hard)) {
        const byKey = srs[statsId] || {}
        const prev = byKey[itemKey]
        const wasDue = isDue(prev, dayNumber())
        const { entry, mastered } = scheduleAnswer(prev, correct, dayNumber())
        srs = { ...srs, [statsId]: { ...byKey, [itemKey]: entry } }
        if (action.question && domainId !== 'suuji') {
          const snapshot = persistentReviewSnapshot(domainId, action.question, itemKey)
          if (snapshot) reviewQuestions = { ...reviewQuestions, [statsId]: { ...(reviewQuestions[statsId] || {}), [itemKey]: snapshot } }
        }
        if (!hard && correct && wasDue && mastered) conquered += 1
      }

      const previousUnitReady = unitId ? unitReady(state.unitStats?.[grade]?.[statsId]?.[unitId]) : false
      const unitStats = recordUnitResult(state.unitStats, grade, statsId, unitId, correct, dayNumber(), itemKey)
      const currentUnitReady = unitId ? unitReady(unitStats?.[grade]?.[statsId]?.[unitId]) : false

      let englishWordStats = state.englishWordStats || {}
      let englishPhraseStats = state.englishPhraseStats || {}
      let englishAlphabetStats = state.englishAlphabetStats || {}
      if (domainId === 'english' && !hard && action.englishItemKey) {
        const rawKey = String(action.englishItemKey).split('#')[0]
        const isPhrase = rawKey.startsWith('enp:') || rawKey.startsWith('eng:')
        const isAlphabet = rawKey.startsWith('ena:')
        const key = rawKey.replace(/^(?:en[wap]?|eng):/, '')
        const stats = isAlphabet ? englishAlphabetStats : isPhrase ? englishPhraseStats : englishWordStats
        const next = advanceEnglishProgress(stats[key] || emptyEnglishProgress(dayNumber()), correct, dayNumber())
        if (isAlphabet) englishAlphabetStats = { ...englishAlphabetStats, [key]: next }
        else if (isPhrase) englishPhraseStats = { ...englishPhraseStats, [key]: next }
        else englishWordStats = { ...englishWordStats, [key]: next }
      }

      let writingStats = state.writingStats || {}
      if (domainId === 'kaku' && action.question?.target) {
        const key = `${grade}:${action.question.target}`
        const prev = writingStats[key] || { attempts: 0, successDays: [], guideSeen: false, freeSuccess: false }
        const day = dayNumber()
        const successDays = correct && !prev.successDays.includes(day) ? [...prev.successDays, day].slice(-12) : prev.successDays
        writingStats = { ...writingStats, [key]: { ...prev, attempts: prev.attempts + 1, successDays, guideSeen: prev.guideSeen || action.question.stage === 'trace', freeSuccess: prev.freeSuccess || (correct && action.question.stage === 'free' && prev.successDays.some((d) => d < day)) } }
      }

      const accKey = `${grade}:${statsId}`
      const prevAcc = state.domainAccuracy?.[accKey] || { c: 0, n: 0 }
      let acc = { c: prevAcc.c + (correct ? 1 : 0), n: prevAcc.n + 1 }
      if (acc.n > 20) acc = { c: Math.round(acc.c / 2), n: Math.round(acc.n / 2) }

      let next = {
        ...state,
        skills: { ...state.skills, [grade]: { ...gradeSkills, [statsId]: newSkill } },
        streak, lastActiveDate, srs, unitStats, writingStats,
        englishWordStats, englishPhraseStats, englishAlphabetStats,
        reviewQuestions, conquered,
        domainAccuracy: { ...state.domainAccuracy, [accKey]: acc },
        daily: {
          ...state.daily,
          correctToday: state.daily.correctToday + (correct ? 1 : 0),
          attemptsToday: state.daily.attemptsToday + 1,
          perDomainToday: addDomainTally(state.daily.perDomainToday, domainId, correct)
        }
      }
      if (!previousUnitReady && currentUnitReady) {
        next = enqueueReward(next, {
          id: `unit:${grade}:${statsId}:${unitId}`,
          ticketDelta: 0,
          captureItemDelta: {},
          unitMastered: !hard,
          hardMastered: hard
        })
      }
      return next
    }

    case 'ENGLISH_SPEAKING_DONE': {
      const rawKey = String(action.itemKey || '').split('#')[0]
      if (rawKey.startsWith('ena:')) return state
      const isPhrase = rawKey.startsWith('enp:')
      const key = rawKey.replace(/^en[wp]?:/, '')
      if (!key) return state
      const stats = isPhrase ? state.englishPhraseStats : state.englishWordStats
      const prev = stats?.[key] || emptyEnglishProgress(dayNumber())
      const nextStats = { ...stats, [key]: { ...prev, speakingCount: (prev.speakingCount || 0) + 1 } }
      return isPhrase ? { ...state, englishPhraseStats: nextStats } : { ...state, englishWordStats: nextStats }
    }

    case 'CLEAR_TASK': {
      const kind = action.kind
      let daily = { ...state.daily, tasksClearedToday: state.daily.tasksClearedToday + 1 }
      let next = { ...state }
      if (kind === 'core') {
        const coreIndex = daily.coreIndex + 1
        const wasDone = daily.coreDone
        daily = { ...daily, coreIndex, coreDone: coreIndex >= daily.coreTasks.length }
        next = { ...next, daily }
        if (!wasDone && daily.coreDone) {
          next = enqueueReward(next, { id: `daily:${daily.date}`, ticketDelta: 3, captureItemDelta: { star: 3 } })
        }
      } else if (kind === 'okawari') {
        next = { ...next, daily: { ...daily, okawariIndex: daily.okawariIndex + 1 } }
      } else if (kind === 'extra') {
        const extraIndex = daily.extraIndex + 1
        daily = { ...daily, extraIndex }
        if (state.daily.coreDone && !action.suspicious && Number(action.accuracy) >= 2 / 3) {
          daily.ticketsEarnedToday += 1
          next = { ...next, daily }
          next = enqueueReward(next, { id: `extra:${daily.date}:${extraIndex}`, ticketDelta: 1, captureItemDelta: {} })
        } else next = { ...next, daily }
      } else {
        next = { ...next, daily }
      }
      return next
    }

    case 'PICK_CORE_TASK': {
      const { coreTasks, coreIndex } = state.daily
      const index = Number(action.index)
      if (!Number.isInteger(index) || index < coreIndex || index >= coreTasks.length || index === coreIndex) return state
      const next = [...coreTasks]
      ;[next[coreIndex], next[index]] = [next[index], next[coreIndex]]
      return { ...state, daily: { ...state.daily, coreTasks: next } }
    }

    case 'STAR_TRIAL_RESULT': {
      const grade = action.grade
      const round = {
        correct: action.correct || 0,
        total: action.total || STAR_TRIAL_QUESTIONS,
        correctDomains: [...new Set((action.results || []).filter((r) => r.correct).map((r) => r.domainId))],
        unitIds: [...new Set((action.results || []).map((r) => r.unitId).filter(Boolean))],
        day: dayNumber(),
        at: Date.now()
      }
      const oldRounds = state.starTrials?.[grade]?.rounds || []
      const rounds = [...oldRounds, round].slice(-STAR_TRIAL_ROUNDS)
      const testState = { ...state, starTrials: { ...state.starTrials, [grade]: { rounds: oldRounds.slice(-1) } } }
      const result = promotionResult(testState, grade, round)
      let gradeMax = state.gradeMax
      let pendingGradeUp = state.pendingGradeUp
      let testPassed = state.testPassed
      if (result.passed) {
        testPassed = { ...testPassed, [grade]: { rate: result.correct / result.total, passed: true, at: Date.now(), starTrial: true } }
        if (grade >= gradeMax && gradeMax < MAX_GRADE) { gradeMax = grade + 1; pendingGradeUp = grade + 1 }
      }
      let srs = state.srs
      let reviewQuestions = state.reviewQuestions || {}
      for (const item of action.results || []) {
        if (item.correct || !item.domainId || !item.itemKey) continue
        const byKey = srs[item.domainId] || {}
        const { entry } = scheduleNext(byKey[item.itemKey], false, round.day)
        srs = { ...srs, [item.domainId]: { ...byKey, [item.itemKey]: entry } }
        const snapshot = persistentReviewSnapshot(item.domainId, item.question, item.itemKey)
        if (snapshot) reviewQuestions = { ...reviewQuestions, [item.domainId]: { ...(reviewQuestions[item.domainId] || {}), [item.itemKey]: snapshot } }
      }
      return { ...state, starTrials: { ...state.starTrials, [grade]: { rounds } }, testPassed, gradeMax, pendingGradeUp, srs, reviewQuestions }
    }

    case 'LESSON_SEEN': {
      const key = `${action.grade}:${action.domainId}`
      return { ...state, lessonSeen: { ...state.lessonSeen, [key]: (state.lessonSeen[key] || 0) + 1 } }
    }

    case 'FORCE_GRADE_MAX': return { ...state, gradeMax: Math.max(state.gradeMax, Math.min(MAX_GRADE, Number(action.gradeMax) || 0)) }
    case 'LOWER_GRADE_MAX': return lowerGradeProgress(state, action.gradeMax)
    case 'SET_SETTING': return { ...state, settings: { ...state.settings, [action.key]: action.value } }
    case 'ACK_GAME_REWARDS': {
      const ids = new Set(action.ids || [])
      return { ...state, pendingGameRewards: (state.pendingGameRewards || []).filter((reward) => !ids.has(reward.id)) }
    }
    case 'RESET_ALL': return createInitialState()
    case 'IMPORT_STATE': return normalizeSaved(action.data)
    default: return state
  }
}

function reducer(state, action) {
  if (action.type === 'IMPORT_STATE') return normalizeSaved(action.data)
  if (action.type === 'RESET_ALL') return normalizeSaved(createInitialState())
  if (action.type === 'CREATE_PROFILE') {
    const id = `child-${Date.now().toString(36)}`
    const fresh = createInitialState()
    const profiles = {
      ...saveProfileSnapshot(state.profiles, state.activeProfileId || 'child-1', state.profiles?.[state.activeProfileId]?.name || 'ぼうけんしゃ 1', state),
      [id]: { name: String(action.name || '').trim() || `ぼうけんしゃ ${Object.keys(state.profiles || {}).length + 1}`, state: profileSnapshot(fresh) }
    }
    return { ...fresh, activeProfileId: id, profiles }
  }
  if (action.type === 'SWITCH_PROFILE') {
    const target = state.profiles?.[action.profileId]
    if (!target?.state || action.profileId === state.activeProfileId) return state
    const next = normalizeProfileSaved(target.state)
    const profiles = {
      ...state.profiles,
      [state.activeProfileId]: { ...state.profiles[state.activeProfileId], state: profileSnapshot(state) },
      [action.profileId]: { ...target, state: profileSnapshot(next) }
    }
    return { ...next, activeProfileId: action.profileId, profiles }
  }
  if (action.type === 'RENAME_PROFILE') {
    const id = action.profileId || state.activeProfileId
    const name = String(action.name || '').trim()
    if (!name || !state.profiles?.[id]) return state
    return { ...state, profiles: { ...state.profiles, [id]: { ...state.profiles[id], name } } }
  }
  const next = reduceProfile(state, action)
  const activeProfileId = state.activeProfileId || 'child-1'
  const profiles = saveProfileSnapshot(state.profiles, activeProfileId, state.profiles?.[activeProfileId]?.name || 'ぼうけんしゃ 1', next)
  return { ...next, activeProfileId, profiles }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => normalizeSaved(loadState()))
  useEffect(() => { saveState(state) }, [state])
  useEffect(() => { const id = setInterval(() => dispatch({ type: 'ROLLOVER' }), 60000); return () => clearInterval(id) }, [])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}
