import test from 'node:test'
import assert from 'node:assert/strict'

import { QUESTIONS } from '../src/study/questions.js'
import {
  answerQuestion,
  completeRemediation,
  createStudyState,
  pickFreeStudyQuestion,
  remainingDailyQuestions,
  startDailySession
} from '../src/study/engine.js'
import { makeSkill, applyResult, hintLevel } from '../src/study/difficulty.js'
import { scheduleNext } from '../src/study/srs.js'
import { addTickets, createGameState } from '../src/game/progression.js'
import { startBattle } from '../src/game/engine.js'

test('Kids Quest SRS compatibility: correct answers expand interval', () => {
  const first = scheduleNext(null, true, 100)
  assert.equal(first.entry.box, 1)
  assert.equal(first.entry.due, 101)
  const second = scheduleNext(first.entry, true, 101)
  assert.equal(second.entry.box, 2)
  assert.equal(second.entry.due, 104)
})

test('Kids Quest SRS compatibility: miss resets box without losing lapse count', () => {
  const result = scheduleNext({ box: 3, due: 100, lapses: 1 }, false, 100)
  assert.deepEqual(result.entry, { box: 0, due: 100, lapses: 2 })
})

test('adaptive difficulty rises after 3 correct in the latest 4', () => {
  let skill = makeSkill()
  for (const correct of [true, true, false, true]) skill = applyResult(skill, correct).skill
  assert.equal(skill.level, 3)
})

test('adaptive difficulty adds scaffold after repeated misses', () => {
  let skill = makeSkill()
  for (const correct of [false, true, false, true, false]) skill = applyResult(skill, correct).skill
  assert.equal(hintLevel(skill), 2)
})

test('daily five-subject study grants exactly 3 tickets once', () => {
  let study = createStudyState()
  const started = startDailySession(study, 200)
  study = started.state
  assert.equal(started.questions.length, 5)
  let reward = 0
  for (const question of started.questions) {
    const outcome = answerQuestion(study, question, question.answer, { context: 'daily', today: 200, elapsedMs: 3000 })
    study = outcome.state
    reward += outcome.ticketDelta
  }
  assert.equal(study.daily.completed, true)
  assert.equal(reward, 3)

  const extra = answerQuestion(study, started.questions[0], started.questions[0].answer, { context: 'daily', today: 200, elapsedMs: 3000 })
  assert.equal(extra.ticketDelta, 0)
})

test('free study before daily completion grants 0 tickets; after daily completion grants +1', () => {
  let study = createStudyState()
  const freeQuestion = QUESTIONS.find((q) => !q.hard)
  const before = answerQuestion(study, freeQuestion, freeQuestion.answer, { context: 'free', today: 300, elapsedMs: 3000 })
  assert.equal(before.ticketDelta, 0)

  const started = startDailySession(before.state, 300)
  study = started.state
  for (const q of started.questions) study = answerQuestion(study, q, q.answer, { context: 'daily', today: 300, elapsedMs: 3000 }).state
  const after = answerQuestion(study, freeQuestion, freeQuestion.answer, { context: 'free', today: 300, elapsedMs: 3000 })
  assert.equal(after.ticketDelta, 1)
})

test('five fast wrong taps do not unlock the daily reward', () => {
  let study = createStudyState()
  const started = startDailySession(study, 320)
  study = started.state
  let reward = 0
  for (const q of started.questions) {
    const wrong = q.choices.find((choice) => choice !== q.answer)
    const result = answerQuestion(study, q, wrong, { context: 'daily', today: 320, elapsedMs: 100 })
    study = result.state
    reward += result.ticketDelta
  }
  assert.equal(reward, 0)
  assert.equal(study.daily.completed, false)
  assert.equal(study.daily.completedQuestionIds.length, 0)
  assert.equal(study.daily.suspicious, true)
})

test('wrong -> remediation -> confirmation completes one learning item without treating it as correct', () => {
  let study = createStudyState()
  const started = startDailySession(study, 330)
  study = started.state
  const q = started.questions[0]
  const wrong = q.choices.find((choice) => choice !== q.answer)
  const miss = answerQuestion(study, q, wrong, { context: 'daily', today: 330, elapsedMs: 2500 })
  assert.equal(miss.state.daily.completedQuestionIds.length, 0)
  const remediated = completeRemediation(miss.state, q, { context: 'daily', today: 330 })
  assert.equal(remediated.completed, true)
  assert.deepEqual(remediated.state.daily.completedQuestionIds, [q.id])
  assert.equal(remediated.ticketDelta, 0)
})

test('daily quit after 2 and resume keeps the same remaining 3 requirements', () => {
  let study = createStudyState()
  const first = startDailySession(study, 350)
  study = first.state
  const ids = [...first.state.daily.questionIds]
  for (const q of first.questions.slice(0, 2)) study = answerQuestion(study, q, q.answer, { context: 'daily', today: 350, elapsedMs: 3000 }).state
  const resumed = startDailySession(study, 350)
  assert.deepEqual(resumed.state.daily.questionIds, ids)
  const remaining = remainingDailyQuestions(resumed.state, 350)
  assert.equal(remaining.length, 3)
  assert.deepEqual(remaining.map((q) => q.subject), first.questions.slice(2).map((q) => q.subject))
})

test('one-item normal unit is eventually masterable', () => {
  let study = createStudyState()
  const q = QUESTIONS.find((item) => item.unitId === 'math:make10')
  for (const today of [400, 401, 402, 402]) study = answerQuestion(study, q, q.answer, { context: 'free', today, elapsedMs: 3000 }).state
  assert.equal(study.units[q.unitId].itemRequirement, 1)
  assert.equal(study.units[q.unitId].mastered, true)
})

test('every vertical-slice normal unit is eventually masterable with valid learning', () => {
  const units = [...new Set(QUESTIONS.filter((q) => !q.hard).map((q) => q.unitId))]
  for (const unitId of units) {
    let study = createStudyState()
    const pool = QUESTIONS.filter((q) => !q.hard && q.unitId === unitId)
    for (let i = 0; i < 4; i++) {
      const q = pool[i % pool.length]
      study = answerQuestion(study, q, q.answer, { context: 'free', today: 500 + i, elapsedMs: 3000 }).state
    }
    assert.equal(study.units[unitId].mastered, true, `${unitId} must be masterable`)
  }
})

test('due SRS item is selected before a non-due item in the same subject', () => {
  let study = createStudyState()
  study.daily.day = 600
  study.srs.kokugo = {
    'w:small-tsu': { box: 2, due: 600, lapses: 0 },
    'w:inu': { box: 2, due: 700, lapses: 0 }
  }
  const started = startDailySession(study, 600)
  const kokugo = started.questions.find((q) => q.subject === 'kokugo')
  assert.equal(kokugo.itemKey, 'w:small-tsu')
})

test('daily question selection follows the subject difficulty skill', () => {
  const easy = createStudyState()
  easy.daily.day = 610
  easy.skills.sansu = { ...makeSkill(), level: 2 }
  const easyQ = startDailySession(easy, 610).questions.find((q) => q.subject === 'sansu')

  const strong = createStudyState()
  strong.daily.day = 610
  strong.skills.sansu = { ...makeSkill(), level: 6 }
  const strongQ = startDailySession(strong, 610).questions.find((q) => q.subject === 'sansu')
  assert.ok(strongQ.difficulty >= easyQ.difficulty)
  assert.equal(strongQ.id, 'm0-3')
})

test('hard mastery is reachable after repeated success on separate days', () => {
  let study = createStudyState()
  const hard = QUESTIONS.find((q) => q.hard)
  for (const today of [700, 701, 702]) study = answerQuestion(study, hard, hard.answer, { context: 'free', today, elapsedMs: 3000 }).state
  assert.equal(study.units[hard.unitId].hardMastered, true)
})

test('one study-earned ticket opens exactly one fixed-level stage battle', () => {
  const game = addTickets(createGameState(), 1)
  const result = startBattle(game, '1-1')
  assert.equal(result.ok, true)
  assert.equal(result.game.tickets, 0)
  assert.equal(result.battle.enemy.level, 5)
  assert.equal(result.game.battlesStarted, 1)
  assert.deepEqual(result.game.activeBattle, result.battle)
})
