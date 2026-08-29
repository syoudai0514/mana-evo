import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')
const gameSave = fs.readFileSync(new URL('../src/game/saveStore.js', import.meta.url), 'utf8')
const learningSave = fs.readFileSync(new URL('../src/kids-quest-study/engine/storage.js', import.meta.url), 'utf8')
const useCases = fs.readFileSync(new URL('../design/current/07A-CLOUD-SYNC-USE-CASES.md', import.meta.url), 'utf8')

test('every local game and learning save emits the shared cloud-dirty event', () => {
  assert.match(gameSave, /LOCAL_SAVE_CHANGED_EVENT = 'manaevo:local-save-changed'/)
  assert.match(gameSave, /emitLocalSaveChanged\('game'\)/)
  assert.match(learningSave, /LOCAL_SAVE_CHANGED_EVENT = 'manaevo:local-save-changed'/)
  assert.match(learningSave, /emitLocalSaveChanged\('learning'\)/)
})

test('cloud autosync uses short debounce plus a hard maximum dirty window', () => {
  assert.match(shell, /CLOUD_SYNC_DEBOUNCE_MS = 800/)
  assert.match(shell, /CLOUD_SYNC_MAX_DIRTY_MS = 4000/)
  assert.match(shell, /if \(!syncMaxTimer\.current\)/)
  assert.match(shell, /setTimeout\(\(\) => \{[\s\S]*flushSync\(\{ quiet: true \}\)[\s\S]*CLOUD_SYNC_MAX_DIRTY_MS/)
})

test('cloud sync retries or flushes on resume, reconnect, background and page exit', () => {
  assert.match(shell, /addEventListener\('online', flushQuietly\)/)
  assert.match(shell, /addEventListener\('focus', flushQuietly\)/)
  assert.match(shell, /addEventListener\('pagehide', flushQuietly\)/)
  assert.match(shell, /document\.addEventListener\('visibilitychange', onVisibilityChange\)/)
  assert.match(shell, /document\.visibilityState === 'hidden'/)
})

test('profile switch flushes the current profile before changing active profile and reloading', () => {
  const start = shell.indexOf('const switchProfile')
  const end = shell.indexOf('const startTest', start)
  const block = shell.slice(start, end)
  assert.match(block, /await flushSync\(\{ quiet: true \}\)/)
  assert.match(block, /switchDeviceProfile\(profileId\)/)
  assert.ok(block.indexOf('await flushSync') < block.indexOf('switchDeviceProfile(profileId)'))
  assert.ok(block.indexOf('switchDeviceProfile(profileId)') < block.indexOf('window.location.reload()'))
})

test('overlapping sync requests are serialized and request one rerun instead of racing writes', () => {
  assert.match(shell, /const syncInFlight = useRef\(null\)/)
  assert.match(shell, /const syncRerunRequested = useRef\(false\)/)
  assert.match(shell, /if \(syncInFlight\.current\) \{[\s\S]*syncRerunRequested\.current = true[\s\S]*return syncInFlight\.current/)
  assert.match(shell, /do \{[\s\S]*syncRerunRequested\.current = false[\s\S]*await syncNow\([\s\S]*\} while \(syncRerunRequested\.current\)/)
  assert.match(shell, /syncInFlight\.current = pending/)
})

test('local progress remains authoritative while cloud delivery is pending', () => {
  assert.match(shell, /クラウド同期待ち・端末には保存済み/)
  assert.match(shell, /同期待ち・端末には保存済み/)
})

test('normal child flow stays cloud-silent and only real attention states show save warning', () => {
  assert.match(shell, /const childCloudAttention = !!session && !parentScreenOpen && \(!!conflict \|\| status\.includes\('同期エラー'\)\)/)
  assert.match(shell, /const showAccountFab = !session \|\| recoveryMode \|\| parentScreenOpen \|\| childCloudAttention/)
  assert.match(shell, /accountFabWarn \? '保存確認'/)
  assert.doesNotMatch(shell, /childCloudAttention[\s\S]{0,100}同期待ち/)
})

test('CURRENT cloud use-case contract explicitly protects conflicts, offline recovery and in-flight races', () => {
  assert.match(useCases, /U6[\s\S]*CONFLICT/)
  assert.match(useCases, /U7[\s\S]*LOCAL ONLY/)
  assert.match(useCases, /U8[\s\S]*Immediate sync\/reconcile/)
  assert.match(useCases, /U12[\s\S]*Flush\/sync A before reload\/switch boundary/)
  assert.match(useCases, /U16[\s\S]*Coalesce\/serialize/)
  assert.match(useCases, /U20[\s\S]*Local save survives/)
  assert.match(useCases, /Child-visible cloud status policy/)
  assert.match(useCases, /保存確認/)
})
