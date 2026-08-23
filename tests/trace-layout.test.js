import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('trace canvas always has a sized relative container', () => {
  const css = read('src/kids-quest-study/styles/trace-mobile.css')
  assert.match(css, /\.trace-box\s*\{[\s\S]*position:\s*relative/)
  assert.match(css, /\.trace-box\s*\{[\s\S]*aspect-ratio:\s*1\s*\/\s*1/)
  assert.match(css, /\.trace-box\s*\{[\s\S]*overflow:\s*hidden/)
})

test('trace action buttons stay in normal flow below canvas', () => {
  const css = read('src/kids-quest-study/styles/trace-mobile.css')
  assert.match(css, /\.hp-bar\s*\+\s*\.row\.wrap/)
  assert.doesNotMatch(css, /\.hp-bar\s*\+\s*\.row\.wrap\s*\{[^}]*position:\s*(?:absolute|fixed)/s)
  assert.match(css, /flex-wrap:\s*nowrap/)
})

test('trace mobile overrides load after shared app styles', () => {
  const main = read('src/main.jsx')
  const appStyles = main.indexOf("import './styles.css'")
  const traceStyles = main.indexOf("import './kids-quest-study/styles/trace-mobile.css'")
  assert.ok(appStyles >= 0)
  assert.ok(traceStyles > appStyles)
})
