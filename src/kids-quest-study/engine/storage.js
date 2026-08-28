import { exportGameEnvelope, importGameEnvelope } from '../../game/saveStore.js'

const KEY = 'mana-evo:kids-quest-learning:v2'
export const LOCAL_SAVE_CHANGED_EVENT = 'manaevo:local-save-changed'

function emitLocalSaveChanged(source = 'learning') {
  if (typeof globalThis.dispatchEvent !== 'function' || typeof globalThis.CustomEvent !== 'function') return
  try { globalThis.dispatchEvent(new CustomEvent(LOCAL_SAVE_CHANGED_EVENT, { detail: { source } })) } catch {}
}

export function loadState() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); emitLocalSaveChanged('learning') } catch {}
}
export function clearState() {
  try { localStorage.removeItem(KEY); emitLocalSaveChanged('learning-clear') } catch {}
}
export const EXPORT_MARKER = 'mana-evo-learning-save'
export function serializeForExport(state) {
  return JSON.stringify({
    marker: EXPORT_MARKER,
    formatVersion: 3,
    exportedAt: new Date().toISOString(),
    state,
    gameEnvelope: exportGameEnvelope(state?.activeProfileId || 'child-1')
  }, null, 2)
}
export function parseImport(text) {
  const obj = JSON.parse(text)
  if (obj?.marker === EXPORT_MARKER && obj.state && typeof obj.state === 'object') {
    if (obj.gameEnvelope) importGameEnvelope(obj.gameEnvelope, obj.state.activeProfileId || 'child-1')
    return obj.state
  }
  if (obj && typeof obj === 'object' && (obj.version || obj.skills || obj.gradeMax != null)) return obj
  throw new Error('ひきつぎデータの形式が ちがいます')
}
export function todayKey(d = new Date()) {
  const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
export function migrateContentVersion(saved, contentVersion) { return { ...saved, contentVersion } }
export function profileSnapshot(state) { const { profiles:_p, activeProfileId:_a, ...snapshot } = state || {}; return snapshot }
export function saveProfileSnapshot(profiles, profileId, name, state) {
  return { ...(profiles||{}), [profileId]: { name, state: profileSnapshot(state) } }
}
