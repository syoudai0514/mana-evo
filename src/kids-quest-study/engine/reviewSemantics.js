import { normalizeEnglishKey } from '../data/content/english.js'

export function focusedEnglishReviewKey(focusWordId, questionIndex = 0) {
  const id = String(focusWordId || '').trim()
  return id && Number(questionIndex) === 0 ? `enw:${id}` : null
}

function englishProgressEntry(state, itemKey) {
  const key = normalizeEnglishKey(itemKey)
  if (key.startsWith('ena:')) return state?.englishAlphabetStats?.[key.slice(4)]
  if (key.startsWith('enp:') || key.startsWith('eng:')) return state?.englishPhraseStats?.[key.slice(4)]
  if (key.startsWith('enw:')) return state?.englishWordStats?.[key.slice(4)]
  return null
}

export function isActualMistakeReviewOpportunity({
  state,
  domainId,
  statsDomainId = domainId,
  itemKey,
  today,
  reinforcement = false
}) {
  if (!itemKey) return false

  if (domainId === 'english' && !String(statsDomainId).startsWith('hard:')) {
    const entry = englishProgressEntry(state, itemKey)
    if (!entry || (entry.wrong || 0) <= 0) return false
    return reinforcement || (entry.nextDue ?? Infinity) <= today
  }

  const entry = state?.srs?.[statsDomainId]?.[itemKey]
  if (!entry || (entry.lapses || 0) <= 0) return false
  return reinforcement || (entry.due ?? Infinity) <= today
}

export function shouldIncrementConquered({ entryBefore, correct, wasDue, mastered, hard }) {
  return !hard && Boolean(correct) && Boolean(wasDue) && Boolean(mastered) && (entryBefore?.lapses || 0) > 0
}
