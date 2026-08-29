import test from 'node:test'
import assert from 'node:assert/strict'
import {
  inferCanonicalDomains,
  parseCanonicalDeclaration,
  validateCanonicalSync
} from '../scripts/verify-canonical-sync.mjs'

const map = {
  decisionLog: 'design/rebuild/DECISION-LOG.md',
  impactMarkers: {
    impact: 'Canonical-Impact',
    domains: 'Canonical-Domains',
    reason: 'Canonical-Reason'
  },
  domains: {
    learning: {
      runtimePrefixes: ['src/kids-quest-study/'],
      runtimeFiles: [],
      currentDocs: ['design/current/01-LEARNING-REWARDS.md']
    },
    battle: {
      runtimePrefixes: [],
      runtimeFiles: ['src/game/balance.js'],
      currentDocs: ['design/current/02-BATTLE-TICKETS-BALANCE.md']
    }
  }
}

test('infers protected canonical domains from changed runtime paths', () => {
  const hits = inferCanonicalDomains([
    'src/game/balance.js',
    'src/kids-quest-study/state/runtime.js',
    'README.md'
  ], map)
  assert.deepEqual([...hits.keys()], ['learning', 'battle'])
})

test('parses canonical impact declaration', () => {
  assert.deepEqual(parseCanonicalDeclaration(`
Canonical-Impact: changed
Canonical-Domains: battle, learning
Canonical-Reason: user-approved behavior change
`, map), {
    impact: 'changed',
    domains: ['battle', 'learning'],
    reason: 'user-approved behavior change'
  })
})

test('fails protected behavior change without CURRENT and decision-log updates', () => {
  const result = validateCanonicalSync({
    files: ['src/game/balance.js'],
    body: 'Canonical-Impact: changed\nCanonical-Domains: battle\nCanonical-Reason: balance change',
    map
  })
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /CURRENT docs were updated/)
  assert.match(result.errors.join('\n'), /DECISION-LOG/)
})

test('passes behavior change when owning CURRENT and decision log change together', () => {
  const result = validateCanonicalSync({
    files: [
      'src/game/balance.js',
      'design/current/02-BATTLE-TICKETS-BALANCE.md',
      'design/rebuild/DECISION-LOG.md'
    ],
    body: 'Canonical-Impact: changed\nCanonical-Domains: battle\nCanonical-Reason: approved battle contract change',
    map
  })
  assert.equal(result.ok, true)
})

test('allows implementation-only change only with explicit no-impact reason', () => {
  const result = validateCanonicalSync({
    files: ['src/game/balance.js'],
    body: 'Canonical-Impact: none\nCanonical-Reason: refactor only; behavior and constants are unchanged',
    map
  })
  assert.equal(result.ok, true)
  assert.ok(result.warnings.length > 0)
})

test('rejects missing declaration for protected runtime changes', () => {
  const result = validateCanonicalSync({
    files: ['src/kids-quest-study/state/runtime.js'],
    body: '',
    map
  })
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /Canonical-Impact/)
})

test('ignores docs-only changes', () => {
  const result = validateCanonicalSync({
    files: ['design/current/00-START-HERE.md'],
    body: '',
    map
  })
  assert.equal(result.ok, true)
})
