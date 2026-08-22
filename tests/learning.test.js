import test from 'node:test'
import assert from 'node:assert/strict'

import { QUESTIONS } from '../src/study/questions.js'
import { answerQuestion, createStudyState, pickDailyQuestions } from '../src/study/engine.js'
import { makeSkill, applyResult, hintLevel } from '../src/study/difficulty.js'
import { scheduleNext } from '../src/study/srs.js'
import { addTickets, battleOnce, createGameState } from '../src/game/progression.js'

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
  const queue = pickDailyQuestions(study)
  assert.equal(queue.length, 5)
  let reward = 0
  for (const question of queue) {
    const outcome = answerQuestion(study, question, question.answer, { context: 'daily', today: 200 })
    study = outcome.state
    reward += outcome.ticketDelta
  }
  assert.equal(study.daily.completed, true)
  assert.equal(reward, 3)

  const extra = answerQuestion(study, queue[0], queue[0].answer, { context: 'daily', today: 200 })
  assert.equal(extra.ticketDelta, 0)
})

test('free study grants one ticket only for a correct answer', () => {
  const question = QUESTIONS.find((q) => !q.hard)
  const correct = answerQuestion(createStudyState(), question, question.answer, { context: 'free', today: 300 })
  const wrongChoice = question.choices.find((c) => c !== question.answer)
  const wrong = answerQuestion(createStudyState(), question, wrongChoice, { context: 'free', today: 300 })
  assert.equal(correct.ticketDelta, 1)
  assert.equal(wrong.ticketDelta, 0)
})

test('normal unit mastery needs repetition, first-try success, separate days and variety', () => {
  let study = createStudyState()
  const base = QUESTIONS.find((q) => q.subject === 'kokugo' && !q.hard)
  const variants = [
    { ...base, id: 'master-1', itemKey: 'master:a' },
    { ...base, id: 'master-2', itemKey: 'master:b' },
    { ...base, id: 'master-3', itemKey: 'master:a' },
    { ...base, id: 'master-4', itemKey: 'master:b' }
  ]
  for (let i = 0; i < variants.length; i++) {
    const outcome = answerQuestion(study, variants[i], variants[i].answer, { context: 'free', today: i < 3 ? 400 : 401 })
    study = outcome.state
  }
  assert.equal(study.units[base.unitId].mastered, true)
})

test('hard mastery is reachable after repeated success on separate days', () => {
  let study = createStudyState()
  const hard = QUESTIONS.find((q) => q.hard)
  for (const today of [500, 501, 502]) {
    const outcome = answerQuestion(study, hard, hard.answer, { context: 'free', today })
    study = outcome.state
  }
  assert.equal(study.units[hard.unitId].hardMastered, true)
})

test('battle consumes one ticket and gives monster XP', () => {
  const game = addTickets(createGameState(), 1)
  const result = battleOnce(game)
  assert.equal(result.ok, true)
  assert.equal(result.game.tickets, 0)
  assert.equal(result.game.monsters[result.game.activeMonsterId].xp, 25)
})
