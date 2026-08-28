import { CANDIDATE_ART_SPECIES } from './candidateArt.generated.js'

// CANDIDATE preview only. The generated registry is rebuilt from the exact
// public WebP + per-species candidate provenance pair, so replacement does not
// require maintaining another hand-written species list.
export const PLAYTEST_CANDIDATE_ART = Object.freeze(
  Object.fromEntries(CANDIDATE_ART_SPECIES.map((speciesId) => [speciesId, `/monsters/${speciesId}.webp`]))
)

export function resolvePlaytestCandidateArt(speciesId) {
  const src = PLAYTEST_CANDIDATE_ART[speciesId]
  if (!src) return null
  return {
    speciesId,
    state: 'CANDIDATE',
    src,
    isFormal: false,
    isCandidatePreview: true,
    integrityIssue: null
  }
}
