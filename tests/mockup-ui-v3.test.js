import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const screens = fs.readFileSync('src/game/GameScreens.jsx', 'utf8')
const styles = fs.readFileSync('src/styles.css', 'utf8')

test('approved five-tab navigation is present in the child game shell', () => {
  for (const label of ['ホーム','まなぶ','ぼうけん','モンスター','あそびかた']) assert.ok(app.includes('>' + label + '</span>'), label)
  assert.ok(app.includes('game-bottom-nav'))
})

test('home exposes the approved six-step learning to evolution loop', () => {
  for (const label of ['まなぶ','チケットGET','ぼうけん','バトル','つかまえる','そだてる・シンカ']) assert.ok(app.includes(label), label)
  assert.ok(app.includes('いまの じょうきょう'))
  assert.ok(app.includes('ゲームせつめい'))
})

test('adventure UI exposes world route, daily five and recommendation meaning', () => {
  assert.ok(screens.includes('world-overview-card'))
  assert.ok(screens.includes('daily-ticket-summary'))
  for (const tag of ['おすすめ','未GET','育成向け','初回']) assert.ok(screens.includes(tag), tag)
})

test('battle and evolution keep the mockup primary actions visible', () => {
  assert.ok(screens.includes('capture-main-cta'))
  assert.ok(screens.includes('わを なげる'))
  assert.ok(screens.includes('✨ いま シンカする！'))
  assert.ok(screens.includes('シンカの ほうほう'))
  assert.ok(screens.includes('シンカの せつめい'))
})

test('mockup visual system is installed', () => {
  assert.ok(styles.includes('Mockup UI v3'))
  assert.ok(styles.includes('--me-gold'))
})
