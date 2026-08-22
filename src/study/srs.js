// Copied from syoudai0514/kids-quest/src/engine/srs.js and kept intentionally compatible.
// Interval repetition (Leitner-style): 1d -> 3d -> 7d -> 14d -> 30d.
export const BOX_DAYS = [0, 1, 3, 7, 14, 30]
export const MAX_BOX = BOX_DAYS.length - 1

export function dayNumber(d = new Date()) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor(local.getTime() / 86400000)
}

export function makeEntry(today = dayNumber()) {
  return { box: 0, due: today, lapses: 0 }
}

export function scheduleNext(entry, correct, today = dayNumber()) {
  const cur = entry || makeEntry(today)
  if (!correct) {
    return {
      entry: { box: 0, due: today, lapses: (cur.lapses || 0) + 1 },
      mastered: false
    }
  }
  const box = Math.min(MAX_BOX, (cur.box || 0) + 1)
  return {
    entry: { box, due: today + BOX_DAYS[box], lapses: cur.lapses || 0 },
    mastered: box >= MAX_BOX && (cur.box || 0) < MAX_BOX
  }
}

export function isDue(entry, today = dayNumber()) {
  return !!entry && (entry.due ?? 0) <= today
}

export function scheduleAnswer(entry, correct, today = dayNumber()) {
  if (correct && entry && !isDue(entry, today)) return { entry, mastered: false, advanced: false }
  return { ...scheduleNext(entry, correct, today), advanced: true }
}

export function dueKeys(srs, domainId, today = dayNumber(), limit = Infinity) {
  const byKey = (srs && srs[domainId]) || {}
  return Object.entries(byKey)
    .filter(([, e]) => isDue(e, today))
    .sort((a, b) => (a[1].due ?? 0) - (b[1].due ?? 0))
    .slice(0, limit)
    .map(([k]) => k)
}

export function dueEntries(srs, today = dayNumber(), limit = Infinity) {
  const out = []
  for (const [domainId, byKey] of Object.entries(srs || {})) {
    for (const [key, entry] of Object.entries(byKey || {})) {
      if (isDue(entry, today)) out.push({ domainId, key, entry })
    }
  }
  out.sort((a, b) => (a.entry.due ?? 0) - (b.entry.due ?? 0))
  return limit === Infinity ? out : out.slice(0, limit)
}

export function dueCount(srs, today = dayNumber()) {
  let n = 0
  for (const byKey of Object.values(srs || {})) {
    for (const e of Object.values(byKey || {})) if (isDue(e, today)) n++
  }
  return n
}

export function boxCounts(srs) {
  const counts = new Array(MAX_BOX + 1).fill(0)
  for (const byKey of Object.values(srs || {})) {
    for (const e of Object.values(byKey || {})) {
      counts[Math.min(MAX_BOX, Math.max(0, e.box || 0))]++
    }
  }
  return counts
}

export function daysUntilNext(srs, today = dayNumber()) {
  let min = Infinity
  for (const byKey of Object.values(srs || {})) {
    for (const e of Object.values(byKey || {})) {
      const d = (e.due ?? 0) - today
      if (d > 0 && d < min) min = d
    }
  }
  return min === Infinity ? null : min
}

export function migrateMissed(missed, today = dayNumber()) {
  const srs = {}
  for (const [domainId, keys] of Object.entries(missed || {})) {
    if (!Array.isArray(keys)) continue
    srs[domainId] = {}
    for (const key of keys) srs[domainId][key] = { box: 0, due: today, lapses: 1 }
  }
  return srs
}
