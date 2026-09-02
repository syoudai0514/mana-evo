import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const home = app.slice(app.indexOf('function Home'), app.indexOf('function StudyHub'))
const study = app.slice(app.indexOf('function StudyHub'), app.indexOf('export default function App'))

test('W-214 Home has one contextual primary branch for each daily-learning state', () => {
  assert.match(home, /dailyCompleted\s*\n\s*\? <button className="battle" onClick=\{\(\)=>go\('adventure'\)\}>🗺️ ぼうけんへ！<\/button>\s*\n\s*: <button className="primary" onClick=\{\(\)=>go\('study'\)\}>📖 まなぶ！<\/button>/)
  assert.doesNotMatch(home, /canAdventure/)
  assert.equal((home.match(/home-primary-actions/g) || []).length, 1)
})

test('W-214 Home keeps only compact next-action context and partner motivation', () => {
  for (const label of ['brand-partner', 'つかえるチケット', 'いまのぼうけん', 'つぎのシンカ']) assert.ok(home.includes(label), label)
  for (const stale of ['home-flow-strip', 'きょうの ながれ', 'ゲームせつめい', 'home-guide-panel']) assert.ok(!home.includes(stale), stale)
  assert.ok(!home.includes('<span>マナ</span><strong>💎'))
})

test('W-214 Study puts required learning first and keeps optional modes always visible', () => {
  const requiredIndex = study.indexOf('きょうの ミッション')
  const optionalIndex = study.indexOf('study-other-modes')
  assert.ok(requiredIndex >= 0)
  assert.ok(optionalIndex > requiredIndex)
  assert.ok(!study.includes('<details className="study-secondary-modes">'))
  assert.ok(study.includes('<h2>ほかの まなび</h2>'))
  for (const optional of ['じゆうべんきょう', 'とっくん', 'ほしのしれん', 'えいごずかん']) assert.ok(study.includes(optional), optional)
})

test('W-214 Study removes implementation wording and states canonical extra-learning rewards', () => {
  for (const stale of ['Kids Quest 学習エンジン', '学習エンジン', '3もん中2もん', 'ticket+1']) assert.ok(!study.includes(stale), stale)
  assert.ok(study.includes('1もん クリアするたび 🎫チケット+1 と 🧭たんさくポイント+1'))
  assert.ok(study.includes('ついかの せいかいが 3こ たまるたび ほしボール+1'))
  assert.ok(study.includes('⚡ ついかチャレンジ（3もん）'))
})
