import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')

test('cloud conflict never auto-opens account UI during child play', () => {
  const conflictStart = shell.indexOf('setConflict({ cloud, localPayload })')
  const syncEnd = shell.indexOf('}, [config.configured, maybeBackupCloud, setMeta, testMode])', conflictStart)
  assert.ok(conflictStart >= 0)
  assert.ok(syncEnd > conflictStart)
  const conflictTail = shell.slice(conflictStart, syncEnd)
  assert.equal(conflictTail.includes('setOpen(true)'), false)
  assert.match(conflictTail, /同期保留・端末には保存済み/)
})

test('sync attention is surfaced only on the Parent screen, not as a child warning FAB', () => {
  assert.match(shell, /const showAccountFab = !session \|\| recoveryMode \|\| parentScreenOpen/)
  assert.match(shell, /const accountFabWarn = parentScreenOpen && needsCloudAttention/)
  assert.equal(shell.includes('parentScreenOpen || needsCloudAttention'), false)
})

test('manual sync does not pretend to resolve a same-profile conflict', () => {
  assert.match(shell, /conflict \? <p><strong>同期は保護者確認待ちです。<\/strong>/)
  assert.match(shell, /下の「保護者専用」で残すデータを選んでください。/)
  assert.match(shell, /クラウド側を使う/)
  assert.match(shell, /この端末側を使う/)
})
