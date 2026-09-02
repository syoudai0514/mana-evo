import { DEVICE_PROFILE_KEY } from './cloudSaveModel.js'

export function rememberDeviceProfile(profileId) {
  const id = String(profileId || '').trim()
  if (!id) return
  try { localStorage.setItem(DEVICE_PROFILE_KEY, id) } catch {}
}
