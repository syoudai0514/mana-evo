import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const adventure = fs.readFileSync('src/game/screens/AdventureScreen.jsx', 'utf8')
const monsterScreen = fs.readFileSync('src/game/screens/MonsterScreen.jsx', 'utf8')
const monster = fs.readFileSync('src/game/PlaceholderMonster.jsx', 'utf8')
const main = fs.readFileSync('src/main.jsx', 'utf8')
const css = fs.readFileSync('src/premium-ui-v4.css', 'utf8')

test('header resources are named instead of ambiguous bare icons', () => {
  for (const label of ['チケット','マナ','ほしのわ']) assert.ok(app.includes(label), label)
  assert.ok(app.includes('game-header'))
  assert.ok(css.includes('safe-area-inset-top'))
  assert.ok(css.includes('safe-area-inset-bottom'))
})

test('visual authority is screen-scoped instead of load-order or important based', () => {
  assert.ok(main.includes("import './premium-ui-v4.css'"))
  for (const owner of [
    '.app-shell .game-bottom-nav',
    '.howto-screen .howto-hero',
    '.adventure-map .premium-world-map',
    '.battle-screen-v2 .battle-arena-v2',
    '.monster-screen-v2 .monster-tabs',
    '.parent-gate-screen .parent-gate-card',
    '.evolution-overlay .evolution-celebration-card'
  ]) assert.ok(css.includes(owner), owner)
  assert.equal(css.includes('!important'), false)
  assert.equal(main.includes('premium-ui-v5.css'), false)
})

test('390 and 375 portrait contracts are explicit and keep the child shell bounded', () => {
  assert.ok(css.includes('@media(max-width:390px)'))
  assert.ok(css.includes('@media(max-width:375px)'))
  assert.ok(css.includes('overflow-x:clip'))
  assert.ok(css.includes('repeat(5,minmax(0,1fr))'))
  assert.ok(css.includes('.home-screen .home-primary-actions button{min-height:50px'))
  assert.ok(css.includes('.battle-screen-v2 .move-grid button{min-height:62px'))
  assert.ok(css.includes('.parent-gate-screen .primary.huge{min-height:50px'))
})

test('adventure is rendered as a premium world map with large encounter art', () => {
  assert.ok(adventure.includes('premium-world-map'))
  assert.ok(adventure.includes('encounter-art'))
  assert.ok(css.includes('.world-area-route:before'))
  assert.ok(css.includes('.zone-grid:before'))
})

test('monster team uses showcase cards and large selected art', () => {
  assert.ok(monsterScreen.includes('monster-hq-hero'))
  assert.ok(monsterScreen.includes('team-showcase'))
  assert.ok(monsterScreen.includes('showcase />'))
  assert.ok(monsterScreen.includes('size={178}'))
  assert.ok(monster.includes('requestedSize'))
})

test('star resource is explicitly documented as ほしのわ', () => {
  assert.ok(app.includes('ほしのわ：モンスターをGETするときに使う'))
  assert.ok(css.includes('.resource-pill.star'))
})
