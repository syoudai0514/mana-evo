import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  CONTEXTUAL_CHILD_FLOWS,
  FOCUSED_APP_VIEWS,
  TOP_LEVEL_CHILD_VIEWS,
  isFocusedAppView,
  shouldShowTopLevelNavigation
} from '../src/navigation/viewOwnership.js'

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const navigation = fs.readFileSync(new URL('../src/navigation/AppNavigation.jsx', import.meta.url), 'utf8')
const adventure = fs.readFileSync(new URL('../src/game/screens/AdventureScreen.jsx', import.meta.url), 'utf8')

test('top-level child navigation has exactly the canonical five owners', () => {
  assert.deepEqual(TOP_LEVEL_CHILD_VIEWS, ['home', 'study', 'adventure', 'monsters', 'howto'])
  for (const label of ['ホーム', 'まなぶ', 'ぼうけん', 'モンスター', 'あそびかた']) assert.ok(navigation.includes(label), label)
  for (const flow of CONTEXTUAL_CHILD_FLOWS) assert.ok(!TOP_LEVEL_CHILD_VIEWS.includes(flow), flow)
  assert.ok(!TOP_LEVEL_CHILD_VIEWS.includes('parent'))
})

test('focused and active-battle states do not compete with top navigation', () => {
  assert.deepEqual(FOCUSED_APP_VIEWS, ['activity', 'free', 'review', 'trial', 'dictionary', 'parent'])
  for (const view of FOCUSED_APP_VIEWS) {
    assert.equal(isFocusedAppView(view), true)
    assert.equal(shouldShowTopLevelNavigation(view), false)
  }
  assert.equal(shouldShowTopLevelNavigation('adventure'), true)
  assert.equal(shouldShowTopLevelNavigation('adventure', { activeBattle: true }), false)
  assert.match(app, /shouldShowTopLevelNavigation\(view,\{activeBattle\}\)/)
})

test('each top-level destination owns scroll position and focused flows start at top', () => {
  assert.match(app, /scrollByViewRef = useRef\(Object\.create\(null\)\)/)
  assert.match(app, /isTopLevelChildView\(view\) && !activeBattle/)
  assert.match(app, /scrollByViewRef\.current\[view\] \|\| 0/)
  assert.match(app, /window\.scrollTo\(\{ top: target, left: 0, behavior: 'auto' \}\)/)
  assert.match(app, /scrollByViewRef\.current\[view\] = window\.scrollY/)
  assert.match(app, /\[view, activeBattle\]/)
})

test('bottom adventure navigation always opens the adventure map', () => {
  assert.match(navigation, /onClick=\{\(\) => onNavigate\(id\)\}/)
  assert.doesNotMatch(app, /setView\(dailyCompleted\?'adventure':'study'\)/)
})

test('home adventure card always opens the map and never redirects to study', () => {
  assert.match(app, /onClick=\{\(\)=>go\('adventure'\)\}/)
  assert.doesNotMatch(app, /go\(canAdventure\?'adventure':'study'\)/)
})

test('study remains a top-level destination while learning activities are focused', () => {
  assert.ok(TOP_LEVEL_CHILD_VIEWS.includes('study'))
  assert.ok(FOCUSED_APP_VIEWS.includes('activity'))
  assert.ok(FOCUSED_APP_VIEWS.includes('dictionary'))
})

test('how-to adventure navigation opens the map even before daily study is complete', () => {
  assert.match(app, /goAdventure=\{\(\)=>setView\('adventure'\)\}/)
})

test('battle gate receives the same numeric day representation as the game engine', () => {
  assert.match(app, /dailyDay=\{today\} today=\{today\}/)
  assert.match(adventure, /dailyDay === liveToday/)
  assert.doesNotMatch(app, /dailyDay=\{learning\.daily\?\.date\}/)
})
