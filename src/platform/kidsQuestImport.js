export const KIDS_QUEST_LEGACY_STORAGE_KEY = 'hoshizora-quest:v1'
export const KIDS_QUEST_IMPORT_MARKER_KEY = 'mana-evo:kids-quest-import:v1'
export const KIDS_QUEST_IMPORT_FORMAT_VERSION = 1

const LEARNING_FIELDS = [
  'version', 'contentVersion', 'createdAt', 'grade', 'gradeMax', 'pendingGradeUp',
  'xp', 'streak', 'lastActiveDate', 'conquered', 'skills', 'srs', 'unitStats',
  'writingStats', 'englishWordStats', 'englishPhraseStats', 'englishAlphabetStats',
  'reviewQuestions', 'testPassed', 'starTrials', 'lessonSeen', 'domainAccuracy',
  'daily', 'history'
]

const SETTING_FIELDS = [
  'tts', 'ttsRate', 'ttsVolume', 'ttsVoice', 'sfx', 'showLifeEndTopics',
  'mode', 'minSelectableGrade'
]

function stableProfileId(value) {
  const id = typeof value === 'string' ? value.trim() : ''
  return id || null
}

function readJson(storage, key) {
  try {
    const raw = storage?.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function sourceFingerprint(raw) {
  let hash = 0x811c9dc5
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function isCompatibleLearningState(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && (value.version != null || value.gradeMax != null || value.skills || value.srs)
}

function copyLearningSnapshot(source) {
  if (!isCompatibleLearningState(source)) return null
  const snapshot = {}
  for (const key of LEARNING_FIELDS) {
    if (source[key] !== undefined) snapshot[key] = source[key]
  }
  if (source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings)) {
    snapshot.settings = Object.fromEntries(
      SETTING_FIELDS.filter((key) => source.settings[key] !== undefined)
        .map((key) => [key, source.settings[key]])
    )
  }
  // Kids Quest game/monster fields and queued ManaEvo reward events are intentionally never copied.
  snapshot.pendingGameRewards = []
  return snapshot
}

function sourceProfiles(source) {
  const profiles = source?.profiles
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) return null
  const entries = Object.entries(profiles)
    .map(([rawId, profile]) => {
      const id = stableProfileId(rawId)
      const state = copyLearningSnapshot(profile?.state)
      if (!id || !state) return null
      return [id, { name: String(profile?.name || '').trim() || id, state }]
    })
    .filter(Boolean)
  return entries.length ? Object.fromEntries(entries) : null
}

export function inspectKidsQuestProgress({ storage = globalThis.localStorage } = {}) {
  let raw = null
  try { raw = storage?.getItem(KIDS_QUEST_LEGACY_STORAGE_KEY) || null } catch { raw = null }
  if (!raw) return { status: 'not-found' }

  let source
  try { source = JSON.parse(raw) } catch { return { status: 'incompatible' } }

  const profiles = sourceProfiles(source)
  if (profiles) {
    const requested = stableProfileId(source.activeProfileId)
    const activeProfileId = requested && profiles[requested] ? requested : Object.keys(profiles)[0]
    return {
      status: 'ready',
      fingerprint: sourceFingerprint(raw),
      activeProfileId,
      profiles,
      sourceVersion: source.version ?? null
    }
  }

  const state = copyLearningSnapshot(source)
  if (!state) return { status: 'incompatible' }
  return {
    status: 'ready',
    fingerprint: sourceFingerprint(raw),
    activeProfileId: null,
    profiles: null,
    state,
    sourceVersion: source.version ?? null
  }
}

export function importKidsQuestProgress(currentState, { storage = globalThis.localStorage } = {}) {
  const inspection = inspectKidsQuestProgress({ storage })
  if (inspection.status !== 'ready') return { ...inspection, state: currentState }

  const marker = readJson(storage, KIDS_QUEST_IMPORT_MARKER_KEY)
  if (marker?.formatVersion === KIDS_QUEST_IMPORT_FORMAT_VERSION && marker.fingerprint === inspection.fingerprint) {
    return { status: 'already-imported', state: currentState, marker }
  }

  const currentProfiles = currentState?.profiles && typeof currentState.profiles === 'object'
    ? currentState.profiles
    : {}
  let activeProfileId = stableProfileId(currentState?.activeProfileId) || 'child-1'
  let profiles = { ...currentProfiles }
  let activeSnapshot

  if (inspection.profiles) {
    profiles = { ...profiles, ...inspection.profiles }
    activeProfileId = inspection.activeProfileId
    activeSnapshot = inspection.profiles[activeProfileId].state
  } else {
    activeSnapshot = inspection.state
    const currentName = String(currentProfiles[activeProfileId]?.name || '').trim() || 'ぼうけんしゃ 1'
    profiles[activeProfileId] = { name: currentName, state: activeSnapshot }
  }

  const nextState = {
    ...activeSnapshot,
    activeProfileId,
    profiles
  }
  const nextMarker = {
    formatVersion: KIDS_QUEST_IMPORT_FORMAT_VERSION,
    sourceKey: KIDS_QUEST_LEGACY_STORAGE_KEY,
    sourceVersion: inspection.sourceVersion,
    fingerprint: inspection.fingerprint
  }

  try { storage?.setItem(KIDS_QUEST_IMPORT_MARKER_KEY, JSON.stringify(nextMarker)) } catch {}
  return { status: 'imported', state: nextState, marker: nextMarker }
}
