import { RUNTIME_MONSTER_ASSETS } from './runtimeMaster.generated.js'
import { isActiveMonsterSpeciesId } from './monsterData.js'

const ART_STATES = new Set(['FORMAL', 'CANDIDATE', 'PLACEHOLDER'])

function hasApprovalEvidence(value) {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return value === true
}

function baseResolution(speciesId, state, extra = {}) {
  return {
    speciesId,
    state,
    src: null,
    isFormal: false,
    isCandidatePreview: false,
    integrityIssue: null,
    ...extra
  }
}

export function resolveMonsterArtEntry(speciesId, entry, mode = 'runtime') {
  if (!isActiveMonsterSpeciesId(speciesId)) {
    return baseResolution(speciesId, 'MISSING', { integrityIssue: 'inactive-or-unknown-species' })
  }

  const state = ART_STATES.has(entry?.state) ? entry.state : 'MISSING'
  if (state === 'FORMAL') {
    const hasPath = typeof entry?.formalAsset === 'string' && entry.formalAsset.trim().length > 0
    const approved = hasApprovalEvidence(entry?.approvalEvidence)
    const exists = entry?.formalAssetExists !== false
    if (hasPath && approved && exists) {
      return baseResolution(speciesId, state, {
        src: entry.formalAsset,
        isFormal: true
      })
    }
    return baseResolution(speciesId, state, { integrityIssue: 'formal-asset-integrity' })
  }

  if (mode === 'review' && state === 'CANDIDATE' && entry?.candidateAsset && entry?.candidateAssetExists !== false) {
    return baseResolution(speciesId, state, {
      src: entry.candidateAsset,
      isCandidatePreview: true
    })
  }

  return baseResolution(speciesId, state)
}

export function resolveMonsterArt(speciesId, mode = 'runtime') {
  return resolveMonsterArtEntry(speciesId, RUNTIME_MONSTER_ASSETS[speciesId], mode)
}

export function fallbackMonsterArt(resolution, reason = 'load-error') {
  return baseResolution(resolution?.speciesId || null, resolution?.state || 'MISSING', {
    integrityIssue: reason
  })
}
