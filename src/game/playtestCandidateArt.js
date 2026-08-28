// Progressive production CANDIDATE artwork overlay.
// These assets passed their Work Item candidate-ingestion gates but are NOT FORMAL.
// Exact explicit scope: W-303/304/305/307/308/310/311/312/314/315/316/317/318/320 = 184 species.
// W-306, W-309, W-313, W-319 and m239 are intentionally excluded.
const PRODUCTION_CANDIDATE_SPECIES = Object.freeze([
  // W-303 grass — 16
  'm001','m002','m003','m040','m041','m042','m082','m083','m084','m085','m086','m087','m134','m135','m136','m235',
  // W-304 fire — 12
  'm004','m005','m006','m055','m056','m057','m058','m059','m060','m211','m212','m213',
  // W-305 water — 21
  'm007','m008','m009','m037','m038','m039','m073','m074','m075','m076','m077','m078','m128','m129','m130','m131','m132','m133','m214','m215','m216',
  // W-307 normal — 17
  'm010','m011','m012','m013','m014','m015','m100','m101','m102','m117','m118','m181','m182','m183','m232','m233','m234',
  // W-308 flying — 12
  'm016','m017','m018','m094','m095','m096','m172','m173','m174','m223','m224','m225',
  // W-310 ground — 13
  'm031','m032','m033','m061','m062','m063','m160','m161','m162','m163','m164','m165','m237',
  // W-311 rock — 10
  'm034','m035','m036','m064','m065','m066','m157','m158','m159','m238',
  // W-312 steel — 12
  'm067','m068','m069','m154','m155','m156','m196','m197','m198','m199','m200','m201',
  // W-314 fight — 15
  'm046','m047','m048','m088','m089','m090','m091','m092','m093','m169','m170','m171','m220','m221','m222',
  // W-315 fairy — 11
  'm049','m050','m051','m115','m116','m175','m176','m177','m208','m209','m210',
  // W-316 psychic — 12
  'm052','m053','m054','m097','m098','m099','m143','m144','m193','m194','m195','m236',
  // W-317 ice — 12
  'm103','m104','m105','m119','m120','m121','m122','m123','m124','m125','m126','m127',
  // W-318 ghost — 12
  'm109','m110','m111','m112','m113','m114','m145','m146','m147','m202','m203','m204',
  // W-320 dragon — 9
  'm184','m185','m186','m187','m188','m189','m190','m191','m192'
])

export const PLAYTEST_CANDIDATE_ART = Object.freeze(
  Object.fromEntries(PRODUCTION_CANDIDATE_SPECIES.map((speciesId) => [speciesId, `/monsters/${speciesId}.webp`]))
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
