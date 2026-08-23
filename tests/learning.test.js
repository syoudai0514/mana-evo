import test from 'node:test'
import assert from 'node:assert/strict'

import { QUESTIONS } from '../src/study/questions.js'
import {
  acknowledgeExplanation,
  answerQuestion,
  answerReinforcementQuestion,
  createStudyState,
  reinforcementQuestionFor,
  remainingDailyQuestions,
  startDailySession
} from '../src/study/engine.js'
import { makeSkill, applyResult, hintLevel } from '../src/study/difficulty.js'
import { scheduleNext } from '../src/study/srs.js'
import { availableTicketCount, createGameState, grantLearningReward } from '../src/game/progression.js'
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

test('legacy daily five-subject runtime grants exactly 3 tickets and 3 star rings once', () => {
  let study = createStudyState()
  const started = startDailySession(study, 200)
  study = started.state
  assert.equal(started.questions.length, 5)
  let ticketReward = 0
  let starReward = 0
  for (const question of started.questions) {
    const outcome = answerQuestion(study, question, question.answer, { context: 'daily', today: 200, elapsedMs: 3000 })
    study = outcome.state
    ticketReward += outcome.ticketDelta
    starReward += outcome.captureItemDelta.star
  }
  assert.equal(study.daily.completed, true)
  assert.equal(ticketReward, 3)
  assert.equal(starReward, 3)

  const extra = answerQuestion(study, started.questions[0], started.questions[0].answer, { context: 'daily', today: 200, elapsedMs: 3000 })
  assert.equal(extra.ticketDelta, 0)
  assert.equal(extra.captureItemDelta.star, 0)
})

test('free study never grants battle tickets, before or after daily completion', () => {
  let study = createStudyState()
  const freeQuestion = QUESTIONS.find((q) => !q.hard)
  const before = answerQuestion(study, freeQuestion, freeQuestion.answer, { context: 'free', today: 300, elapsedMs: 3000 })
  assert.equal(before.ticketDelta, 0)
  assert.equal(before.captureItemDelta.star, 0)

  const started = startDailySession(before.state, 300)
  study = started.state
  for (const q of started.questions) study = answerQuestion(study, q, q.answer, { context: 'daily', today: 300, elapsedMs: 3000 }).state
  const after = answerQuestion(study, freeQuestion, freeQuestion.answer, { context: 'free', today: 300, elapsedMs: 3000 })
  assert.equal(after.ticketDelta, 0)
  assert.equal(after.captureItemDelta.star, 0)
})

test('repeated free study correct answers do not mint tickets or star rings', () => {
  let study = startDailySession(createStudyState(), 310).state
  for (const q of startDailySession(study, 310).questions) study = answerQuestion(study, q, q.answer, { context: 'daily', today: 310, elapsedMs: 3000 }).state
  const q = QUESTIONS.find((item) => !item.hard)
  let tickets = 0
  let stars = 0
  for (let i = 0; i < 6; i++) {
    const result = answerQuestion(study, q, q.answer, { context: 'free', today: 310, elapsedMs: 3000 })
    study = result.state
    tickets += result.ticketDelta
    stars += result.captureItemDelta.star
  }
  assert.equal(tickets, 0)
  assert.equal(stars, 0)
  assert.equal(study.daily.extraCorrect, 0)
})

test('five fast wrong taps do not unlock daily reward or complete any item', () => {
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

test('wrong + explanation acknowledgement alone still does not complete a daily item', () => {
  let study = startDailySession(createStudyState(), 330).state
  const q = startDailySession(study, 330).questions[0]
  const wrong = q.choices.find((choice) => choice !== q.answer)
  const miss = answerQuestion(study, q, wrong, { context: 'daily', today: 330, elapsedMs: 2500 })
  const ack = acknowledgeExplanation(miss.state, q, { context: 'daily', today: 330 })
  assert.equal(ack.acknowledged, true)
  assert.equal(ack.state.daily.completedQuestionIds.length, 0)
  assert.equal(ack.state.daily.completed, false)
})

test('wrong + explanation + correct retry completes one non-suspicious learning item', () => {
  let study = startDailySession(createStudyState(), 340).state
  const q = startDailySession(study, 340).questions[0]
  const wrong = q.choices.find((choice) => choice !== q.answer)
  const miss = answerQuestion(study, q, wrong, { context: 'daily', today: 340, elapsedMs: 2500 })
  const ack = acknowledgeExplanation(miss.state, q, { context: 'daily', today: 340 })
  const retry = answerQuestion(ack.state, q, q.answer, { context: 'daily', today: 340, elapsedMs: 2500 })
  assert.equal(retry.correct, true)
  assert.equal(retry.needsReinforcement, false)
  assert.deepEqual(retry.state.daily.completedQuestionIds, [q.id])
  assert.equal(retry.ticketDelta, 0)
})

test('suspicious fast-wrong flow requires a separate reinforcement success before completion', () => {
  let study = startDailySession(createStudyState(), 345).state
  const session = startDailySession(study, 345)
  study = session.state
  // Trigger suspicious state with three fast misses on three requirements.
  for (const q of session.questions.slice(0, 3)) {
    const wrong = q.choices.find((choice) => choice !== q.answer)
    study = answerQuestion(study, q, wrong, { context: 'daily', today: 345, elapsedMs: 100 }).state
  }
  assert.equal(study.daily.suspicious, true)
  const original = session.questions[0]
  study = acknowledgeExplanation(study, original, { context: 'daily', today: 345 }).state
  const retry = answerQuestion(study, original, original.answer, { context: 'daily', today: 345, elapsedMs: 2500 })
  assert.equal(retry.needsReinforcement, true)
  assert.equal(retry.state.daily.completedQuestionIds.includes(original.id), false)
  const check = reinforcementQuestionFor(retry.state, original)
  const reinforced = answerReinforcementQuestion(retry.state, original, check, check.answer, { today: 345, elapsedMs: 2500 })
  assert.equal(reinforced.completed, true)
  assert.equal(reinforced.state.daily.completedQuestionIds.includes(original.id), true)
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

test('unit and hard mastery grant silver and gold rings through game reward domain', () => {
  const initial = createGameState()
  const normal = grantLearningReward(initial, { unitMastered: true, today: 800 })
  assert.equal(normal.captureItems.silver, 1)
  const hard = grantLearningReward(normal, { hardMastered: true, today: 800 })
  assert.equal(hard.captureItems.gold, 1)
})

test('a carried ticket cannot start a new battle before today daily is complete', () => {
  const day = 900
  const game = grantLearningReward(createGameState(), { ticketDelta: 1, today: day })
  assert.equal(availableTicketCount(game, day + 1), 1)
  const blocked = startBattle(game, '1-1', { dailyCompleted: false, today: day + 1 })
  assert.equal(blocked.ok, false)
  assert.equal(blocked.reason, 'DAILY_NOT_COMPLETED')
  assert.equal(availableTicketCount(blocked.game, day + 1), 1)
})

test('one study-earned ticket opens exactly one fixed-level stage after daily gate', () => {
  const day = 910
  const game = grantLearningReward(createGameState(), { ticketDelta: 1, today: day })
  const result = startBattle(game, '1-1', { dailyCompleted: true, today: day })
  assert.equal(result.ok, true)
  assert.equal(availableTicketCount(result.game, day), 0)
  assert.equal(result.battle.enemy.level, 5)
  assert.equal(result.game.battlesStarted, 1)
  assert.deepEqual(result.game.activeBattle, result.battle)
})
