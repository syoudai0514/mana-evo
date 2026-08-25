import { createGameState, normalizeGameState } from './progression.js'

export const GAME_SAVE_KEY = 'mana-evo-save-v2'
export const LEGACY_GAME_SAVE_KEY = 'mana-evo-save-v1'
export const GAME_SAVE_FORMAT_VERSION = 2
export const GAME_SAVE_EVENT = 'manaevo:game-save-imported'

function profileIdOf(value, fallback = 'child-1') {
  const id = value == null ? '' : String(value).trim()
  return id || fallback
}

function readJson(key) {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeEnvelope(envelope, { emit = false } = {}) {
  try {
    globalThis.localStorage?.setItem(GAME_SAVE_KEY, JSON.stringify(envelope))
    if (emit && typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent(GAME_SAVE_EVENT))
    }
  } catch {
    // Local storage can be unavailable in private/restricted browsing. Runtime state still works in memory.
  }
  return envelope
}

export function isSupportedGameEnvelope(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  if (raw.formatVersion === GAME_SAVE_FORMAT_VERSION) {
    return !!raw.gameByProfile && typeof raw.gameByProfile === 'object' && !Array.isArray(raw.gameByProfile)
  }
  return !!raw.game && typeof raw.game === 'object' && !Array.isArray(raw.game)
}

export function normalizeGameEnvelope(raw, fallbackProfileId = 'child-1') {
  const fallback = profileIdOf(fallbackProfileId)
  const source = raw && typeof raw === 'object' ? raw : {}
  if (source.formatVersion === GAME_SAVE_FORMAT_VERSION && source.gameByProfile && typeof source.gameByProfile === 'object' && !Array.isArray(source.gameByProfile)) {
    const gameByProfile = {}
    for (const [rawId, game] of Object.entries(source.gameByProfile)) {
      const id = profileIdOf(rawId, null)
      if (!id) continue
      gameByProfile[id] = normalizeGameState(game)
    }
    return { formatVersion: GAME_SAVE_FORMAT_VERSION, gameByProfile }
  }

  const legacyGame = source.game && typeof source.game === 'object' ? source.game : null
  return {
    formatVersion: GAME_SAVE_FORMAT_VERSION,
    gameByProfile: legacyGame ? { [fallback]: normalizeGameState(legacyGame) } : {}
  }
}

export function loadGameEnvelope(fallbackProfileId = 'child-1') {
  const current = readJson(GAME_SAVE_KEY)
  if (current) return normalizeGameEnvelope(current, fallbackProfileId)

  const legacy = readJson(LEGACY_GAME_SAVE_KEY)
  const migrated = normalizeGameEnvelope(legacy, fallbackProfileId)
  if (legacy) writeEnvelope(migrated)
  return migrated
}

export function loadGameForProfile(profileId = 'child-1') {
  const id = profileIdOf(profileId)
  const envelope = loadGameEnvelope(id)
  return normalizeGameState(envelope.gameByProfile[id] || createGameState())
}

export function saveGameForProfile(profileId, game) {
  const id = profileIdOf(profileId)
  const envelope = loadGameEnvelope(id)
  envelope.gameByProfile[id] = normalizeGameState(game)
  writeEnvelope(envelope)
  return envelope.gameByProfile[id]
}

export function exportGameEnvelope(fallbackProfileId = 'child-1') {
  return loadGameEnvelope(fallbackProfileId)
}

export function importGameEnvelope(raw, fallbackProfileId = 'child-1') {
  if (!isSupportedGameEnvelope(raw)) throw new Error('unsupported ManaEvo game save format')
  const envelope = normalizeGameEnvelope(raw, fallbackProfileId)
  return writeEnvelope(envelope, { emit: true })
}
