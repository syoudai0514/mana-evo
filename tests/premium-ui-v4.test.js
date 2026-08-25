import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const screens = fs.readFileSync('src/game/GameScreens.jsx', 'utf8')
const monster = fs.readFileSync('src/game/PlaceholderMonster.jsx', 'utf8')
const main = fs.readFileSync('src/main.jsx', 'utf8')
const css = fs.readFileSync('src/premium-ui-v4.css', 'utf8')

test('header resources are named instead of ambiguous bare icons', () => {
  for (const label of ['チケット','マナ','ほしのわ']) assert.ok(app.includes(label), label)
  assert.ok(app.includes('game-header'))
  assert.ok(css.includes('safe-area-inset-top'))
  assert.ok(css.includes('safe-area-inset-bottom'))
})

test('premium CSS loads after runtime CSS so it can be the visual authority', () => {
  const runtime = main.indexOf("import './game/runtime.css'")
  const premium = main.indexOf("import './premium-ui-v4.css'")
  assert.ok(runtime >= 0)
  assert.ok(premium > runtime)
})

test('adventure is rendered as a premium world map with large encounter art', () => {
  assert.ok(screens.includes('premium-world-map'))
  assert.ok(screens.includes('encounter-art'))
  assert.ok(css.includes('.world-area-route:before'))
  assert.ok(css.includes('.zone-grid:before'))
})

test('monster team uses showcase cards and large selected art', () => {
  assert.ok(screens.includes('monster-hq-hero'))
  assert.ok(screens.includes('team-showcase'))
  assert.ok(screens.includes('showcase />'))
  assert.ok(screens.includes('size={178}'))
  assert.ok(monster.includes('requestedSize'))
})

test('star resource is explicitly documented as ほしのわ', () => {
  assert.ok(app.includes('ほしのわ：モンスターをGETするときに使う'))
  assert.ok(css.includes('.resource-pill.star'))
})
