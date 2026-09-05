import test from 'node:test'
import assert from 'node:assert/strict'

import {
  focusedEnglishReviewKey,
  isActualMistakeReviewOpportunity,
  shouldIncrementConquered
} from '../src/kids-quest-study/engine/reviewSemantics.js'

test('focused English practice only forces the selected word on the first question', () => {
  assert.equal(focusedEnglishReviewKey('ten', 0), 'enw:ten')
  assert.equal(focusedEnglishReviewKey('ten', 1), null)
  assert.equal(focusedEnglishReviewKey('ten', 2), null)
  assert.equal(focusedEnglishReviewKey('ten', 3), null)
})

test('correct-only due SRS review is not labeled as overcoming a mistake', () => {
  const state = { srs: { suuji: { 'skill:math:add': { due: 10, lapses: 0 } } } }
  assert.equal(isActualMistakeReviewOpportunity({
    state,
    domainId: 'suuji',
    statsDomainId: 'suuji',
    itemKey: 'skill:math:add',
    today: 10
  }), false)
})

test('due SRS review with a real lapse is a mistake-overcoming opportunity', () => {
  const state = { srs: { suuji: { 'skill:math:add': { due: 10, lapses: 1 } } } }
  assert.equal(isActualMistakeReviewOpportunity({
    state,
    domainId: 'suuji',
    statsDomainId: 'suuji',
    itemKey: 'skill:math:add',
    today: 10
  }), true)
})

test('English correct-only review never claims a mistake', () => {
  const state = { englishWordStats: { ten: { wrong: 0, nextDue: 10 } } }
  assert.equal(isActualMistakeReviewOpportunity({
    state,
    domainId: 'english',
    itemKey: 'enw:ten',
    today: 10
  }), false)
})

test('English review with actual wrong history can trigger mistake-overcoming feedback', () => {
  const state = { englishWordStats: { ten: { wrong: 1, nextDue: 10 } } }
  assert.equal(isActualMistakeReviewOpportunity({
    state,
    domainId: 'english',
    itemKey: 'enw:ten',
    today: 10
  }), true)
})

test('same-task reinforcement can acknowledge a real mistake before the next scheduled day', () => {
  const state = { englishWordStats: { ten: { wrong: 1, nextDue: 11 } } }
  assert.equal(isActualMistakeReviewOpportunity({
    state,
    domainId: 'english',
    itemKey: 'enw:ten',
    today: 10,
    reinforcement: true
  }), true)
})

test('hard English keeps using generic SRS lapse history', () => {
  const state = { srs: { 'hard:english': { 'hard:eng:grammar-1': { lapses: 1, due: 10 } } } }
  assert.equal(isActualMistakeReviewOpportunity({
    state,
    domainId: 'english',
    statsDomainId: 'hard:english',
    itemKey: 'hard:eng:grammar-1',
    today: 10
  }), true)
})

test('conquered counter only increments for mastered items with actual lapse history', () => {
  assert.equal(shouldIncrementConquered({
    entryBefore: { lapses: 0 }, correct: true, wasDue: true, mastered: true, hard: false
  }), false)
  assert.equal(shouldIncrementConquered({
    entryBefore: { lapses: 1 }, correct: true, wasDue: true, mastered: true, hard: false
  }), true)
})
