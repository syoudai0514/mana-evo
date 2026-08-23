import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('narrator chunks and device speech keep an audible pause between explanations', () => {
  const pacing = read('src/kids-quest-study/engine/speechPacing.js')
  assert.match(pacing, /NARRATOR_GAP_MS\s*=\s*320/)
  assert.match(pacing, /DEVICE_SPEECH_GAP_MS\s*=\s*360/)
  assert.match(pacing, /lastEndedAt/)
  assert.match(pacing, /addEventListener\('ended'/)
  assert.match(pacing, /synth\.speak\s*=\s*\(utterance\)/)
})

test('speech pacing is installed before the learning app starts', () => {
  const main = read('src/main.jsx')
  const pacingImport = main.indexOf("import './kids-quest-study/engine/speechPacing.js'")
  const appImport = main.indexOf("import App from './App.jsx'")
  assert.ok(pacingImport >= 0)
  assert.ok(pacingImport < appImport)
})
