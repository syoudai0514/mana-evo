import { CLOUD_APP_ID, CLOUD_SAVE_SCHEMA_VERSION, CLOUD_SLOT_MAIN } from './cloudSaveModel.js'

const AUTH_SESSION_KEY = 'shared-apps:supabase-session:v1'

function env(name) {
  try { return String(import.meta.env?.[name] || '').trim() } catch { return '' }
}

export function cloudConfig() {
  const url = env('VITE_SHARED_SUPABASE_URL').replace(/\/$/, '')
  const key = env('VITE_SHARED_SUPABASE_PUBLISHABLE_KEY')
  return { url, key, configured: /^https:\/\//.test(url) && !!key }
}

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function storeSession(session) {
  if (!session?.access_token || !session?.refresh_token) return null
  const expiresAt = Number(session.expires_at) || Math.floor(Date.now() / 1000) + Math.max(60, Number(session.expires_in) || 3600)
  const normalized = { ...session, expires_at: expiresAt }
  try { localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(normalized)) } catch {}
  return normalized
}

export function clearSession() {
  try { localStorage.removeItem(AUTH_SESSION_KEY) } catch {}
}

async function authFetch(path, { method = 'POST', body = null, accessToken = null } = {}) {
  const { url, key, configured } = cloudConfig()
  if (!configured) throw new Error('クラウド保存がまだ設定されていません')
  const response = await fetch(`${url}/auth/v1${path}`, {
    method,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    ...(body == null ? {} : { body: JSON.stringify(body) })
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || '認証に失敗しました')
  return data
}

export async function signInWithPassword(email, password) {
  const session = await authFetch('/token?grant_type=password', { body: { email, password } })
  return storeSession(session)
}

export async function signUpWithPassword(email, password, redirectTo = null) {
  const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''
  const data = await authFetch(`/signup${suffix}`, {
    body: { email, password, data: { app_id: CLOUD_APP_ID } }
  })
  if (data?.access_token) storeSession(data)
  return data
}

export async function requestPasswordReset(email, redirectTo) {
  const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''
  return authFetch(`/recover${suffix}`, { body: { email } })
}

export async function updatePassword(password) {
  const session = await getValidSession()
  if (!session) throw new Error('ログインが必要です')
  return authFetch('/user', { method: 'PUT', body: { password }, accessToken: session.access_token })
}

export async function signOut() {
  const session = readSession()
  try {
    if (session?.access_token) await authFetch('/logout', { accessToken: session.access_token })
  } catch {}
  clearSession()
}

export function consumeAuthHash() {
  if (typeof window === 'undefined' || !window.location.hash) return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return null
  const session = storeSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(params.get('expires_in')) || 3600,
    token_type: params.get('token_type') || 'bearer',
    user: null
  })
  const type = params.get('type')
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  return { session, type }
}

async function refreshSession(session) {
  if (!session?.refresh_token) return null
  try {
    const next = await authFetch('/token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } })
    return storeSession(next)
  } catch {
    clearSession()
    return null
  }
}

async function fetchUser(session) {
  if (!session?.access_token) return null
  try {
    const user = await authFetch('/user', { method: 'GET', accessToken: session.access_token })
    const next = { ...session, user }
    try { localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(next)) } catch {}
    return next
  } catch { return session }
}

export async function getValidSession() {
  let session = readSession()
  if (!session) return null
  const now = Math.floor(Date.now() / 1000)
  if (!session.expires_at || session.expires_at <= now + 60) session = await refreshSession(session)
  if (!session) return null
  if (!session.user?.id) session = await fetchUser(session)
  return session?.user?.id ? session : null
}

async function dataFetch(path, { method = 'GET', body = null, prefer = null } = {}) {
  const session = await getValidSession()
  if (!session) throw new Error('ログインが必要です')
  const { url, key, configured } = cloudConfig()
  if (!configured) throw new Error('クラウド保存がまだ設定されていません')
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    ...(body == null ? {} : { body: JSON.stringify(body) })
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(data?.message || data?.details || `クラウド保存エラー (${response.status})`)
  return { data, session }
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`
}

export async function fetchMainSave() {
  const session = await getValidSession()
  if (!session) return null
  const query = `app_saves?select=revision,schema_version,payload,updated_at&user_id=${eq(session.user.id)}&app_id=${eq(CLOUD_APP_ID)}&slot_id=${eq(CLOUD_SLOT_MAIN)}&limit=1`
  const { data } = await dataFetch(query)
  return Array.isArray(data) ? data[0] || null : null
}

export async function insertMainSave(payload) {
  const session = await getValidSession()
  if (!session) throw new Error('ログインが必要です')
  const row = {
    user_id: session.user.id,
    app_id: CLOUD_APP_ID,
    slot_id: CLOUD_SLOT_MAIN,
    revision: 1,
    schema_version: CLOUD_SAVE_SCHEMA_VERSION,
    payload
  }
  const { data } = await dataFetch('app_saves?select=revision,schema_version,payload,updated_at', {
    method: 'POST', body: row, prefer: 'return=representation'
  })
  return Array.isArray(data) ? data[0] || null : null
}

export async function updateMainSave(payload, expectedRevision) {
  const session = await getValidSession()
  if (!session) throw new Error('ログインが必要です')
  const query = `app_saves?select=revision,schema_version,payload,updated_at&user_id=${eq(session.user.id)}&app_id=${eq(CLOUD_APP_ID)}&slot_id=${eq(CLOUD_SLOT_MAIN)}&revision=${eq(expectedRevision)}`
  const { data } = await dataFetch(query, {
    method: 'PATCH',
    body: { revision: Number(expectedRevision) + 1, schema_version: CLOUD_SAVE_SCHEMA_VERSION, payload, updated_at: new Date().toISOString() },
    prefer: 'return=representation'
  })
  return Array.isArray(data) ? data[0] || null : null
}

export async function createBackup(payload, revision, reason = 'manual') {
  const session = await getValidSession()
  if (!session) throw new Error('ログインが必要です')
  const { data } = await dataFetch('app_save_backups?select=id,revision,reason,created_at', {
    method: 'POST',
    body: {
      user_id: session.user.id,
      app_id: CLOUD_APP_ID,
      slot_id: CLOUD_SLOT_MAIN,
      revision: Math.max(0, Number(revision) || 0),
      schema_version: CLOUD_SAVE_SCHEMA_VERSION,
      reason,
      payload
    },
    prefer: 'return=representation'
  })
  return Array.isArray(data) ? data[0] || null : null
}

export async function listBackups(limit = 30) {
  const session = await getValidSession()
  if (!session) return []
  const query = `app_save_backups?select=id,revision,reason,created_at,payload&user_id=${eq(session.user.id)}&app_id=${eq(CLOUD_APP_ID)}&slot_id=${eq(CLOUD_SLOT_MAIN)}&order=created_at.desc&limit=${Math.max(1, Math.min(100, Number(limit) || 30))}`
  const { data } = await dataFetch(query)
  return Array.isArray(data) ? data : []
}
