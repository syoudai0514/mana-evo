import { createLearningRewardMeta } from './learningRewardPolicy.js'

export const LEARNING_REWARD_STORE_KEY = 'mana-evo:learning-reward-bridge:v1'

function profileIdOf(value) {
  return String(value || 'child-1')
}

function uniqueById(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const result = []
  for (const entry of value) {
    const id = String(entry?.id || '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    result.push(entry)
  }
  return result.slice(-4000)
}

export function normalizeLearningRewardRuntime(value = {}) {
  return {
    version: 1,
    pendingGameRewards: uniqueById(value?.pendingGameRewards),
    pendingProgressionSignals: uniqueById(value?.pendingProgressionSignals),
    learningRewardMeta: createLearningRewardMeta(value?.learningRewardMeta)
  }
}

function readEnvelope() {
  try {
    const raw = globalThis.localStorage?.getItem(LEARNING_REWARD_STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' && parsed.byProfile && typeof parsed.byProfile === 'object'
      ? parsed
      : { version: 1, byProfile: {} }
  } catch {
    return { version: 1, byProfile: {} }
  }
}

export function loadLearningRewardRuntime(profileId = 'child-1') {
  const envelope = readEnvelope()
  return normalizeLearningRewardRuntime(envelope.byProfile?.[profileIdOf(profileId)])
}

export function saveLearningRewardRuntime(profileId, runtime) {
  const id = profileIdOf(profileId)
  const envelope = readEnvelope()
  const next = {
    version: 1,
    byProfile: {
      ...(envelope.byProfile || {}),
      [id]: normalizeLearningRewardRuntime(runtime)
    }
  }
  try { globalThis.localStorage?.setItem(LEARNING_REWARD_STORE_KEY, JSON.stringify(next)) } catch {}
  return next.byProfile[id]
}

export function acknowledgeLearningGameRewards(runtime, ids) {
  const remove = new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || '')))
  const next = normalizeLearningRewardRuntime(runtime)
  return {
    ...next,
    pendingGameRewards: next.pendingGameRewards.filter((reward) => !remove.has(String(reward.id)))
  }
}

export function acknowledgeLearningProgressionSignals(runtime, ids) {
  const remove = new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || '')))
  const next = normalizeLearningRewardRuntime(runtime)
  return {
    ...next,
    pendingProgressionSignals: next.pendingProgressionSignals.filter((signal) => !remove.has(String(signal.id)))
  }
}
