// PLAYTEST-ONLY: explicit CANDIDATE artwork overlay for PR #84.
// Do not merge this mapping into canonical runtime and do not treat these assets as FORMAL.
// Scope is exactly W-303 + W-304 + W-305 (49 species).
export const PLAYTEST_CANDIDATE_ART = Object.freeze({
  // W-303 grass — 16
  m001: '/monsters/m001.webp',
  m002: '/monsters/m002.webp',
  m003: '/monsters/m003.webp',
  m040: '/monsters/m040.webp',
  m041: '/monsters/m041.webp',
  m042: '/monsters/m042.webp',
  m082: '/monsters/m082.webp',
  m083: '/monsters/m083.webp',
  m084: '/monsters/m084.webp',
  m085: '/monsters/m085.webp',
  m086: '/monsters/m086.webp',
  m087: '/monsters/m087.webp',
  m134: '/monsters/m134.webp',
  m135: '/monsters/m135.webp',
  m136: '/monsters/m136.webp',
  m235: '/monsters/m235.webp',

  // W-304 fire — 12
  m004: '/monsters/m004.webp',
  m005: '/monsters/m005.webp',
  m006: '/monsters/m006.webp',
  m055: '/monsters/m055.webp',
  m056: '/monsters/m056.webp',
  m057: '/monsters/m057.webp',
  m058: '/monsters/m058.webp',
  m059: '/monsters/m059.webp',
  m060: '/monsters/m060.webp',
  m211: '/monsters/m211.webp',
  m212: '/monsters/m212.webp',
  m213: '/monsters/m213.webp',

  // W-305 water — 21
  m007: '/monsters/m007.webp',
  m008: '/monsters/m008.webp',
  m009: '/monsters/m009.webp',
  m037: '/monsters/m037.webp',
  m038: '/monsters/m038.webp',
  m039: '/monsters/m039.webp',
  m073: '/monsters/m073.webp',
  m074: '/monsters/m074.webp',
  m075: '/monsters/m075.webp',
  m076: '/monsters/m076.webp',
  m077: '/monsters/m077.webp',
  m078: '/monsters/m078.webp',
  m128: '/monsters/m128.webp',
  m129: '/monsters/m129.webp',
  m130: '/monsters/m130.webp',
  m131: '/monsters/m131.webp',
  m132: '/monsters/m132.webp',
  m133: '/monsters/m133.webp',
  m214: '/monsters/m214.webp',
  m215: '/monsters/m215.webp',
  m216: '/monsters/m216.webp'
})

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
