import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { applyCloudPayload } from '../src/platform/cloudSnapshot.js'
import { makeCloudPayload } from '../src/platform/cloudSaveModel.js'
import { importGameEnvelope, LOCAL_SAVE_CHANGED_EVENT as GAME_LOCAL_SAVE_CHANGED_EVENT } from '../src/game/saveStore.js'
import { saveState } from '../src/kids-quest-study/engine/storage.js'

function installBrowserStorage() {
  const values = new Map()
  const previous = {
    localStorage: globalThis.localStorage,
    CustomEvent: globalThis.CustomEvent,
    dispatchEvent: globalThis.dispatchEvent
  }
  const events = []
  globalThis.localStorage = {
    getItem: (key) => values.has(String(key)) ? values.get(String(key)) : null,
    setItem: (key, value) => values.set(String(key), String(value)),
    removeItem: (key) => values.delete(String(key)),
    clear: () => values.clear()
  }
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) { this.type = type; this.detail = options.detail }
  }
  globalThis.dispatchEvent = (event) => { events.push(event); return true }
  return {
    events,
    restore() {
      if (previous.localStorage === undefined) delete globalThis.localStorage
      else globalThis.localStorage = previous.localStorage
      if (previous.CustomEvent === undefined) delete globalThis.CustomEvent
      else globalThis.CustomEvent = previous.CustomEvent
      if (previous.dispatchEvent === undefined) delete globalThis.dispatchEvent
      else globalThis.dispatchEvent = previous.dispatchEvent
    }
  }
}

function cloudPayload() {
  return makeCloudPayload({
    learning: {
      version: 4,
      contentVersion: 16,
      profiles: {
        p1: { name: 'P1', state: { daily: null, skills: {} } }
      }
    },
    gameEnvelope: { formatVersion: 2, gameByProfile: { p1: {} } },
    learningRewardEnvelope: { version: 1, byProfile: { p1: {} } },
    capturedAt: '2026-09-05T00:00:00.000Z'
  })
}

test('applying a cloud snapshot does not masquerade as a new local save', () => {
  const browser = installBrowserStorage()
  try {
    applyCloudPayload(cloudPayload(), { preferredProfileId: 'p1' })
    const localSaveEvents = browser.events.filter((event) => event.type === GAME_LOCAL_SAVE_CHANGED_EVENT)
    assert.equal(localSaveEvents.length, 0)
  } finally {
    browser.restore()
  }
})

test('normal local learning and game writes still request cloud sync', () => {
  const browser = installBrowserStorage()
  try {
    saveState({ activeProfileId: 'p1', profiles: {} })
    importGameEnvelope({ formatVersion: 2, gameByProfile: { p1: {} } }, 'p1')
    const localSaveEvents = browser.events.filter((event) => event.type === GAME_LOCAL_SAVE_CHANGED_EVENT)
    assert.equal(localSaveEvents.length, 2)
  } finally {
    browser.restore()
  }
})

test('conflict UX resolves once and keeps backup restore as recovery-only UI', () => {
  const shell = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')
  assert.match(shell, /保存データが2つあります/)
  assert.match(shell, /残したい方を1つ選ぶと、この保存確認は終わります/)
  assert.match(shell, /クラウドのデータにそろえる/)
  assert.match(shell, /この端末のデータを残す/)
  assert.match(shell, /resolvingConflict\.current = true/)
  assert.match(shell, /applyCloudPayload\(chosenCloud\.payload\)/)
  assert.match(shell, /const settledLocalPayload = captureCloudPayload\(\)/)
  assert.match(shell, /setConflict\(null\)/)
  assert.match(shell, /setOpen\(false\)/)
  assert.match(shell, /<details className="cloud-card cloud-recovery">/)
})
