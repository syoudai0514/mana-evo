import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { payloadHash } from '../src/platform/cloudSaveModel.js'
import {
  applyRemotePayloadIfLocalUnchanged,
  sameCloudSnapshot,
  waitForRemoteWithLocalGuard
} from '../src/platform/cloudSyncRaceSafety.js'

const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function payload(progress) {
  return {
    appId: 'mana-evo',
    saveSchemaVersion: 1,
    learning: { version: 1, contentVersion: 1, profiles: { child: { name: 'child', state: { progress } } } },
    gameEnvelope: { formatVersion: 2, gameByProfile: { child: { battlesWon: progress } } },
    learningRewardEnvelope: { version: 1, byProfile: { child: { progress } } }
  }
}

test('local save during remote fetch invalidates a destructive PULL before apply', async () => {
  let local = payload(1)
  const capturedHash = payloadHash(local)
  const remote = deferred()
  const guardedFetch = waitForRemoteWithLocalGuard({
    capturedHash,
    captureLocal: () => local,
    remoteOperation: () => remote.promise
  })

  local = payload(2)
  remote.resolve({ revision: 2, payload: payload(9) })
  const fetched = await guardedFetch
  assert.equal(fetched.localUnchanged, false)

  let applied = false
  const didApply = applyRemotePayloadIfLocalUnchanged({
    capturedHash,
    captureLocal: () => local,
    remotePayload: fetched.value.payload,
    applyRemote: () => { applied = true }
  })
  assert.equal(didApply, false)
  assert.equal(applied, false)
  assert.equal(local.learning.profiles.child.state.progress, 2)
})

test('local save during MERGE write keeps newer local progress and forbids stale merged apply', async () => {
  let local = payload(3)
  const capturedHash = payloadHash(local)
  const remoteWrite = deferred()
  const guardedWrite = waitForRemoteWithLocalGuard({
    capturedHash,
    captureLocal: () => local,
    remoteOperation: () => remoteWrite.promise
  })

  local = payload(4)
  remoteWrite.resolve({ revision: 7, payload: payload(30) })
  const written = await guardedWrite
  assert.equal(written.localUnchanged, false)

  let applied = false
  const didApply = applyRemotePayloadIfLocalUnchanged({
    capturedHash,
    captureLocal: () => local,
    remotePayload: written.value.payload,
    applyRemote: () => { applied = true }
  })
  assert.equal(didApply, false)
  assert.equal(applied, false)
  assert.equal(local.learning.profiles.child.state.progress, 4)
})

test('Parent conflict choice detects cloud revision or payload drift', () => {
  const shown = { revision: 11, payload: payload(1) }
  assert.equal(sameCloudSnapshot(shown, { revision: 11, payload: payload(1) }), true)
  assert.equal(sameCloudSnapshot(shown, { revision: 12, payload: payload(1) }), false)
  assert.equal(sameCloudSnapshot(shown, { revision: 11, payload: payload(2) }), false)
})

test('runtime wires local mutation guards around fetch, merge write and destructive apply boundaries', () => {
  assert.match(shell, /waitForRemoteWithLocalGuard\(\{[\s\S]*remoteOperation: fetchMainSave/)
  assert.match(shell, /decision\.action === 'merge'[\s\S]*waitForRemoteWithLocalGuard\(\{[\s\S]*updateMainSave\(decision\.payload, cloud\.revision\)/)
  assert.match(shell, /if \(!updated\.localUnchanged\)[\s\S]*requestSafeRerun\(\)[\s\S]*return[\s\S]*setMeta\(valid\.user\.id, row\)/)
  assert.match(shell, /decision\.action === 'pull'[\s\S]*localSnapshotStillCurrent\(localHash, captureCloudPayload\)[\s\S]*applyCloudPayload\(cloud\.payload\)/)
})

test('Parent choice re-fetches live cloud with local guard before either destructive resolution', () => {
  const chooseCloudStart = shell.indexOf('const chooseCloud')
  const chooseLocalStart = shell.indexOf('const chooseLocal')
  const backupStart = shell.indexOf('const manualBackup')
  const chooseCloudBlock = shell.slice(chooseCloudStart, chooseLocalStart)
  const chooseLocalBlock = shell.slice(chooseLocalStart, backupStart)
  for (const block of [chooseCloudBlock, chooseLocalBlock]) {
    assert.match(block, /const fetched = await waitForRemoteWithLocalGuard\(\{/)
    assert.match(block, /capturedHash: displayedLocalHash/)
    assert.match(block, /captureLocal: captureCloudPayload/)
    assert.match(block, /remoteOperation: fetchMainSave/)
    assert.match(block, /const latestCloud = fetched\.value/)
    assert.match(block, /if \(!fetched\.localUnchanged\)/)
    assert.match(block, /sameCloudSnapshot\(displayedCloud, latestCloud\)/)
    assert.match(block, /refreshConflictEvidence/)
  }
  assert.match(chooseCloudBlock, /const finalCloud = await fetchMainSave\(\)/)
  assert.match(chooseCloudBlock, /sameCloudSnapshot\(latestCloud, finalCloud\)/)
  assert.match(chooseLocalBlock, /updateMainSave\(finalLocal, latestCloud\.revision\)/)
  assert.match(chooseLocalBlock, /const refreshedCloud = await fetchMainSave\(\)/)
})

test('transient failures stay child-silent until three consecutive failures', () => {
  assert.match(shell, /CLOUD_SYNC_ATTENTION_FAILURES = 3/)
  assert.match(shell, /failures >= CLOUD_SYNC_ATTENTION_FAILURES[\s\S]*'同期エラー・端末には保存済み'[\s\S]*'同期待ち・端末には保存済み'/)
  const startup = shell.slice(shell.indexOf('getValidSession().then'), shell.indexOf('useEffect(() => {\n    const root'))
  assert.doesNotMatch(startup, /setStatus\('同期エラー/)
})
