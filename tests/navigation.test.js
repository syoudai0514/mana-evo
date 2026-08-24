import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

test('bottom adventure navigation always opens the adventure map', () => {
  assert.match(source, /onClick=\{\(\)=>setView\('adventure'\)\}>🗺️<\span>ぼうけん<\/span>/)
  assert.doesNotMatch(source, /setView\(dailyCompleted\?'adventure':'study'\)/)
})

test('how-to adventure navigation opens the map even before daily study is complete', () => {
  assert.match(source, /goAdventure=\{\(\)=>setView\('adventure'\)\}/)
})
