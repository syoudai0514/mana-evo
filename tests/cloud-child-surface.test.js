import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')

test('cloud conflict never auto-opens account UI during child play', () => {
  const conflictStart = shell.indexOf('setConflict({')
  const syncEnd = shell.indexOf('}, [config.configured, maybeBackupCloud, setMeta, testMode])', conflictStart)
  assert.ok(conflictStart >= 0)
  assert.ok(syncEnd > conflictStart)
  const conflictTail = shell.slice(conflictStart, syncEnd)
  assert.equal(conflictTail.includes('setOpen(true)'), false)
  assert.match(conflictTail, /同期保留・端末には保存済み/)
})

test('healthy child flow stays cloud-silent while real attention may show only a save warning FAB', () => {
  assert.match(shell, /const childCloudAttention = !!session && !parentScreenOpen && \(!!conflict \|\| status\.includes\('同期エラー'\)\)/)
  assert.match(shell, /const showAccountFab = !session \|\| recoveryMode \|\| parentScreenOpen \|\| childCloudAttention/)
  assert.match(shell, /accountFabWarn \? '保存確認'/)
  assert.equal(shell.includes("childCloudAttention = !!session && !parentScreenOpen && status.includes('クラウド同期待ち')"), false)
})

test('manual conflict resolution remains Parent-owned and includes comparison evidence', () => {
  assert.match(shell, /conflict \? <p><strong>同期は保護者確認待ちです。<\/strong>/)
  assert.match(shell, /下の「保護者専用」で比較して残すデータを選んでください。/)
  assert.match(shell, /最終ローカル保存目安/)
  assert.match(shell, /最終更新:/)
  assert.match(shell, /revision/)
  assert.match(shell, /時刻が新しいだけで正しいとは限りません/)
  assert.match(shell, /クラウド側を使う/)
  assert.match(shell, /この端末側を使う/)
})
