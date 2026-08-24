import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

test('bottom adventure navigation always opens the adventure map', () => {
  assert.match(source, /<button[^>]*onClick=\{\(\)=>setView\('adventure'\)\}[^>]*>🗺️<span>ぼうけん<\/span>/)
  assert.doesNotMatch(source, /setView\(dailyCompleted\?'adventure':'study'\)/)
})

test('home adventure card always opens the map and never redirects to study', () => {
  assert.match(source, /onClick=\{\(\)=>go\('adventure'\)\}/)
  assert.doesNotMatch(source, /go\(canAdventure\?'adventure':'study'\)/)
})

test('study hub keeps bottom navigation available', () => {
  assert.doesNotMatch(source, /\['activity','free','review','trial','dictionary','parent','study'\]\.includes\(view\)/)
  assert.match(source, /className=\{view==='study'\?'active':''\} onClick=\{\(\)=>setView\('study'\)\}/)
})

test('how-to adventure navigation opens the map even before daily study is complete', () => {
  assert.match(source, /goAdventure=\{\(\)=>setView\('adventure'\)\}/)
})
