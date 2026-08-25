import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const navigation = fs.readFileSync('src/navigation/AppNavigation.jsx', 'utf8')
const adventure = fs.readFileSync('src/game/screens/AdventureScreen.jsx', 'utf8')
const battle = fs.readFileSync('src/game/screens/BattleScreen.jsx', 'utf8')
const capture = fs.readFileSync('src/game/screens/CapturePanel.jsx', 'utf8')
const monster = fs.readFileSync('src/game/screens/MonsterScreen.jsx', 'utf8')
const evolution = fs.readFileSync('src/game/screens/EvolutionOverlay.jsx', 'utf8')
const styles = fs.readFileSync('src/styles.css', 'utf8')

test('approved five-tab navigation is present in the child game shell', () => {
  for (const label of ['ホーム','まなぶ','ぼうけん','モンスター','あそびかた']) assert.ok(navigation.includes(label), label)
  assert.ok(navigation.includes('game-bottom-nav'))
  for (const label of ['バトル','つかまえる','ずかん','シンカ']) assert.ok(!navigation.includes('>' + label + '</span>'), label)
})

test('home exposes the approved six-step learning to evolution loop', () => {
  for (const label of ['まなぶ','チケットGET','ぼうけん','バトル','つかまえる','そだてる・シンカ']) assert.ok(app.includes(label), label)
  assert.ok(app.includes('いまの じょうきょう'))
  assert.ok(app.includes('ゲームせつめい'))
})

test('adventure UI exposes world route, daily five and recommendation meaning', () => {
  assert.ok(adventure.includes('world-overview-card'))
  assert.ok(adventure.includes('daily-ticket-summary'))
  for (const tag of ['おすすめ','未GET','育成向け','初回']) assert.ok(adventure.includes(tag), tag)
})

test('battle capture and evolution keep the mockup primary actions visible', () => {
  assert.ok(capture.includes('capture-main-cta'))
  assert.ok(capture.includes('わを なげる'))
  assert.ok(battle.includes('✨ いま シンカする！'))
  assert.ok(monster.includes('シンカの ほうほう'))
  assert.ok(monster.includes('シンカの せつめい'))
  assert.ok(evolution.includes('evolution-overlay'))
})

test('mockup visual system is installed', () => {
  assert.ok(styles.includes('Mockup UI v3'))
  assert.ok(styles.includes('--me-gold'))
})
