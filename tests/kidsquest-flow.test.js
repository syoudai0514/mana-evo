import test from 'node:test'
import assert from 'node:assert/strict'

import { createStudyState, normalizeStudyState } from '../src/study/engine.js'
import {
  CORE_TASK_COUNT,
  CORE_QUESTION_COUNTS,
  EXTRA_PASS_CORRECT,
  EXTRA_QUESTION_COUNT,
  completeMissionSlot,
  ensureKidsQuestMission,
  extraTicketReward,
  missionProgress,
  nextMissionQuestion
} from '../src/study/kidsQuestMission.js'

test('Kids Quest baseline is five subject tasks, not five total questions', () => {
  const today = 1200
  const study = ensureKidsQuestMission(normalizeStudyState(createStudyState(), today), today)
  const progress = missionProgress(study, today)
  assert.equal(progress.tasks.length, CORE_TASK_COUNT)
  assert.equal(progress.tasks.find((task) => task.subject === 'kokugo').slots.length, CORE_QUESTION_COUNTS.kokugo)
  assert.equal(progress.tasks.find((task) => task.subject === 'sansu').slots.length, CORE_QUESTION_COUNTS.sansu)
  assert.ok(progress.totalQuestions > CORE_TASK_COUNT)
})

test('daily reward appears only after every slot in every subject task is completed', () => {
  const today = 1201
  let study = ensureKidsQuestMission(normalizeStudyState(createStudyState(), today), today)
  const initial = missionProgress(study, today)
  const allSlots = initial.tasks.flatMap((task) => task.slots)
  let tickets = 0
  for (const slot of allSlots.slice(0, -1)) {
    const result = completeMissionSlot(study, today, slot.slotId)
    study = result.state
    tickets += result.ticketDelta
  }
  assert.equal(tickets, 0)
  assert.equal(study.daily.completed, false)

  const last = completeMissionSlot(study, today, allSlots.at(-1).slotId)
  assert.equal(last.justCompleted, true)
  assert.equal(last.ticketDelta, 3)
  assert.equal(last.captureItemDelta.star, 3)
  assert.equal(last.state.daily.completed, true)
})

test('a subject task resumes at its first unfinished slot', () => {
  const today = 1202
  let study = ensureKidsQuestMission(normalizeStudyState(createStudyState(), today), today)
  const first = nextMissionQuestion(study, today, 'core:kokugo')
  assert.ok(first)
  study = completeMissionSlot(study, today, first.missionSlotId).state
  const second = nextMissionQuestion(study, today, 'core:kokugo')
  assert.ok(second)
  assert.notEqual(second.missionSlotId, first.missionSlotId)
  assert.equal(second.missionPosition, 2)
})

test('extra ticket requires two correct answers out of three', () => {
  assert.equal(EXTRA_QUESTION_COUNT, 3)
  assert.equal(EXTRA_PASS_CORRECT, 2)
  assert.equal(extraTicketReward(0, 3), 0)
  assert.equal(extraTicketReward(1, 3), 0)
  assert.equal(extraTicketReward(2, 3), 1)
  assert.equal(extraTicketReward(3, 3), 1)
})

test('legacy five-question reward does not pay a second daily reward on migration day', () => {
  const today = 1203
  let study = normalizeStudyState(createStudyState(), today)
  study.daily.completed = true
  study.daily.rewardClaimed = true
  const migrated = ensureKidsQuestMission(study, today)
  const progress = missionProgress(migrated, today)
  assert.equal(progress.completed, true)
  const firstSlot = progress.tasks[0].slots[0]
  const duplicate = completeMissionSlot(migrated, today, firstSlot.slotId)
  assert.equal(duplicate.ticketDelta, 0)
})
