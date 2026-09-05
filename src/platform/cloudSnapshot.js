import { exportGameEnvelope, importGameEnvelope } from '../game/saveStore.js'
import { loadState, profileSnapshot, saveState } from '../kids-quest-study/engine/storage.js'
import { exportLearningRewardEnvelope, importLearningRewardEnvelope } from '../kids-quest-study/state/learningRewardStore.js'
import { createTestGameFixture, TEST_FIXTURE_LABELS } from './testFixtures.js'
import { profileDisplayName } from './profileUi.js'
import {
  DEVICE_PROFILE_KEY,
  TEST_MODE_KEY,
  TEST_RETURN_KEY,
  makeCloudPayload
} from './cloudSaveModel.js'

function clone(value) {
  return value == null ? value : structuredClone(value)
}

function readLocal(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function writeLocal(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}

function removeLocal(key) {
  try { localStorage.removeItem(key) } catch {}
}

export function profilesForPersistence(learning) {
  const profiles = clone(learning?.profiles || {})
  const activeId = learning?.activeProfileId
  if (activeId) {
    profiles[activeId] = {
      ...(profiles[activeId] || {}),
      state: profileSnapshot(learning)
    }
  }
  return profiles
}

function profilesForDisplay(learning) {
  const profiles = profilesForPersistence(learning)
  return Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [id, {
    ...profile,
    name: profileDisplayName(profile)
  }]))
}

export function currentDeviceProfileId() {
  return readLocal(DEVICE_PROFILE_KEY) || loadState()?.activeProfileId || null
}

export function getLocalProfiles() {
  const learning = loadState() || {}
  const profiles = profilesForDisplay(learning)
  return {
    activeProfileId: learning.activeProfileId || null,
    deviceProfileId: currentDeviceProfileId(),
    profiles
  }
}

export function captureCloudPayload() {
  const learning = loadState() || {}
  const profiles = profilesForPersistence(learning)
  const activeId = learning.activeProfileId || Object.keys(profiles)[0] || 'child-1'
  return makeCloudPayload({
    learning: {
      version: learning.version ?? null,
      contentVersion: learning.contentVersion ?? null,
      profiles
    },
    gameEnvelope: exportGameEnvelope(activeId),
    learningRewardEnvelope: exportLearningRewardEnvelope()
  })
}

export function captureExactLocalSnapshot() {
  const learning = loadState() || {}
  return {
    learning: clone(learning),
    gameEnvelope: exportGameEnvelope(learning.activeProfileId || 'child-1'),
    learningRewardEnvelope: exportLearningRewardEnvelope(),
    deviceProfileId: currentDeviceProfileId()
  }
}

function restoreLearningEnvelope(cloudLearning, preferredProfileId = null) {
  const profiles = clone(cloudLearning?.profiles || {})
  const ids = Object.keys(profiles)
  if (!ids.length) throw new Error('cloud save has no profiles')
  const preferred = preferredProfileId && profiles[preferredProfileId] ? preferredProfileId : ids[0]
  const selected = clone(profiles[preferred]?.state || {})
  return {
    ...selected,
    version: cloudLearning?.version ?? selected.version,
    contentVersion: cloudLearning?.contentVersion ?? selected.contentVersion,
    activeProfileId: preferred,
    profiles
  }
}

export function applyCloudPayload(payload, { preferredProfileId = currentDeviceProfileId(), emitLocal = false } = {}) {
  if (!payload?.learning?.profiles || !payload?.gameEnvelope) throw new Error('invalid ManaEvo cloud payload')
  const learning = restoreLearningEnvelope(payload.learning, preferredProfileId)
  saveState(learning, { emit: emitLocal })
  importGameEnvelope(payload.gameEnvelope, learning.activeProfileId, { emitLocal })
  if (payload.learningRewardEnvelope) importLearningRewardEnvelope(payload.learningRewardEnvelope, { emit: emitLocal })
  writeLocal(DEVICE_PROFILE_KEY, learning.activeProfileId)
  return learning.activeProfileId
}

export function switchDeviceProfile(profileId) {
  const learning = loadState() || {}
  const profiles = profilesForPersistence(learning)
  if (!profiles[profileId]) throw new Error('unknown profile')
  const next = {
    ...clone(profiles[profileId].state || {}),
    version: learning.version,
    contentVersion: learning.contentVersion,
    activeProfileId: profileId,
    profiles
  }
  saveState(next)
  writeLocal(DEVICE_PROFILE_KEY, profileId)
  return profileId
}

export function getTestMode() {
  const raw = readLocal(TEST_MODE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function beginTestMode(kind) {
  if (getTestMode()) throw new Error('test mode already active')
  const before = captureExactLocalSnapshot()
  writeLocal(TEST_RETURN_KEY, JSON.stringify(before))

  const sourceLearning = loadState() || {}
  const sourceProfileId = sourceLearning.activeProfileId || Object.keys(sourceLearning.profiles || {})[0] || 'child-1'
  const sourceProfile = sourceLearning.profiles?.[sourceProfileId]?.state || profileSnapshot(sourceLearning)
  const testProfileId = `test-${kind}`
  const testLearning = {
    ...clone(sourceProfile),
    activeProfileId: testProfileId,
    profiles: {
      [testProfileId]: {
        name: `🧪 ${TEST_FIXTURE_LABELS[kind] || kind}`,
        state: clone(sourceProfile)
      }
    }
  }
  if (testLearning.daily) {
    testLearning.daily = {
      ...testLearning.daily,
      coreDone: true,
      coreIndex: Array.isArray(testLearning.daily.coreTasks) ? testLearning.daily.coreTasks.length : testLearning.daily.coreIndex
    }
  }
  saveState(testLearning)
  importLearningRewardEnvelope({ version: 1, byProfile: {} })
  importGameEnvelope({ formatVersion: 2, gameByProfile: { [testProfileId]: createTestGameFixture(kind) } }, testProfileId)
  writeLocal(TEST_MODE_KEY, JSON.stringify({ kind, label: TEST_FIXTURE_LABELS[kind] || kind, startedAt: Date.now() }))
  return testProfileId
}

export function endTestMode() {
  const raw = readLocal(TEST_RETURN_KEY)
  if (!raw) throw new Error('test return snapshot not found')
  const before = JSON.parse(raw)
  if (!before?.learning || !before?.gameEnvelope) throw new Error('invalid test return snapshot')
  saveState(before.learning)
  importGameEnvelope(before.gameEnvelope, before.learning.activeProfileId || 'child-1')
  if (before.learningRewardEnvelope) importLearningRewardEnvelope(before.learningRewardEnvelope)
  if (before.deviceProfileId) writeLocal(DEVICE_PROFILE_KEY, before.deviceProfileId)
  else removeLocal(DEVICE_PROFILE_KEY)
  removeLocal(TEST_MODE_KEY)
  removeLocal(TEST_RETURN_KEY)
}
