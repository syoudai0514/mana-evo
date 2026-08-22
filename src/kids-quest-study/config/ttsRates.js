export const TTS_RATE_PRESETS = Object.freeze([
  { label: 'ゆっくり', value: 0.5 },
  { label: 'ふつう', value: 0.7 },
  { label: 'はやめ', value: 0.9 }
])
export const DEFAULT_TTS_RATE = 0.7
const NARRATOR_LENGTH_SCALE_BY_RATE = Object.freeze({ 0.5: 2.667, 0.7: 2, 0.9: 1.5 })
const NARRATOR_LENGTH_SCALE_BASE = 1.6
export function narratorLengthScale(rate) {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_TTS_RATE
  return NARRATOR_LENGTH_SCALE_BY_RATE[safeRate] || Math.max(0.9, Math.min(3.6, NARRATOR_LENGTH_SCALE_BASE / safeRate))
}
export function migrateTtsRate(value) {
  if (value === 0.84 || value === 0.6) return 0.5
  if (value === 0.96 || value === 0.8) return 0.7
  if (value === 1.08 || value === 1.2) return 0.9
  return Number.isFinite(value) ? value : DEFAULT_TTS_RATE
}
