import { createGameState, normalizeGameState } from './progression.js'

export const GAME_SAVE_KEY = 'mana-evo-save-v2'
export const LEGACY_GAME_SAVE_KEY = 'mana-evo-save-v1'
export const GAME_SAVE_EVENT = 'manaevo:game-save-imported'

const profileIdOf = (value) => String(value || 'child-1')

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

export function normalizeGameEnvelope(raw, fallbackProfileId = 'child-1') {
  const fallback = profileIdOf(fallbackProfileId)
  const source = raw && typeof raw === 'object' ? raw : {}
  if (source.formatVersion === 2 && source.gameByProfile && typeof source.gameByProfile === 'object' && !Array.isArray(source.gameByProfile)) {
    return {
      formatVersion: 2,
      gameByProfile: Object.fromEntries(
        Object.entries(source.gameByProfile).map(([id, game]) => [profileIdOf(id), normalizeGameState(game)])
      )
    }
  }

  const legacyGame = source.game && typeof source.game === 'object' ? source.game : null
  return {
    formatVersion: 2,
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
  const envelope = normalizeGameEnvelope(raw, fallbackProfileId)
  return writeEnvelope(envelope, { emit: true })
}
