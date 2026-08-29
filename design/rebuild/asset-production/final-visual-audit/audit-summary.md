# ManaEvo Monster Art Final Visual QA — Phase 1

Generated from actual decoded candidate pixels on PR #108 branch, then cross-checked visually with the 238-species overview and targeted family sheets. **Audit only; no candidate mutation.**

## Inventory gate

- species: 238 / 238
- missing: 0
- duplicate species assignment: 0
- extra active species: 0
- m239: absent from active scope
- provenance matched to candidate bytes/SHA: 238 / 238

## Final classification after manual visual QA

TOTAL: 238

KEEP: 120

NORMALIZE: 10

REPAIR: 92

REGENERATE: 0

MANUAL_REVIEW: 16

### KEEP
m001, m002, m003, m004, m005, m006, m007, m008, m009, m010, m015, m016, m017, m018, m019, m020, m021, m022, m023, m024, m025, m026, m027, m028, m029, m030, m031, m032, m033, m037, m038, m039, m043, m044, m055, m056, m057, m058, m059, m060, m061, m062, m063, m067, m068, m069, m070, m071, m072, m073, m074, m075, m076, m077, m078, m079, m080, m082, m083, m084, m085, m086, m087, m094, m095, m096, m100, m101, m102, m109, m110, m111, m112, m113, m114, m117, m118, m128, m131, m132, m137, m138, m139, m140, m145, m146, m147, m154, m155, m156, m163, m164, m165, m166, m168, m172, m173, m174, m181, m182, m183, m196, m197, m198, m199, m200, m201, m204, m211, m212, m213, m214, m217, m223, m224, m225, m226, m227, m228, m237

### NORMALIZE
m013, m014, m178, m179, m180, m202, m203, m218, m219, m232

### REPAIR
m034, m035, m036, m040, m041, m042, m046, m047, m048, m049, m050, m051, m052, m053, m054, m064, m065, m066, m088, m089, m090, m091, m092, m093, m097, m098, m099, m103, m104, m105, m106, m107, m108, m115, m116, m119, m120, m121, m122, m123, m124, m125, m126, m127, m134, m135, m136, m143, m144, m148, m149, m150, m151, m152, m153, m157, m158, m159, m160, m161, m162, m169, m170, m171, m175, m176, m177, m184, m185, m186, m187, m188, m189, m190, m191, m192, m193, m194, m195, m205, m206, m207, m208, m209, m210, m220, m221, m222, m233, m234, m236, m238

### REGENERATE
none

### MANUAL_REVIEW
m011, m012, m045, m081, m129, m130, m133, m141, m142, m167, m215, m216, m229, m230, m231, m235

## Key findings

- background suspicion: 92 — m034, m035, m036, m040, m041, m042, m046, m047, m048, m049, m050, m051, m052, m053, m054, m064, m065, m066, m088, m089, m090, m091, m092, m093, m097, m098, m099, m103, m104, m105, m106, m107, m108, m115, m116, m119, m120, m121, m122, m123, m124, m125, m126, m127, m134, m135, m136, m143, m144, m148, m149, m150, m151, m152, m153, m157, m158, m159, m160, m161, m162, m169, m170, m171, m175, m176, m177, m184, m185, m186, m187, m188, m189, m190, m191, m192, m193, m194, m195, m205, m206, m207, m208, m209, m210, m220, m221, m222, m229, m235, m236, m238
- crop risk (excluding alpha-opaque background edges): 13 — m011, m045, m081, m129, m130, m133, m141, m142, m167, m215, m216, m230, m231
- scale outlier after shape-aware visual review: 14 — m013, m014, m015, m140, m178, m179, m180, m202, m203, m218, m219, m232, m233, m234
- confirmed family continuity concerns: 2 — F004, F078
- style-quality outliers: 0 — none

## Manual visual overrides

- m012: **MANUAL_REVIEW** — Manual visual QA: F004 stage2 m011 and stage3 m012 are effectively the same creature/pose; final-stage differentiation is unresolved.
- m057: **KEEP** — Manual visual QA: horizontal final-stage silhouette fills the card width and has strong apparent presence; low bbox height is shape-driven, not underscaling.
- m058: **KEEP** — Manual visual QA: bbox is centered; alpha centroid is bottom-heavy because the flame/body mass is intentionally lower in the silhouette, not because canvas placement is wrong.
- m060: **KEEP** — Manual visual QA: wide final-stage silhouette has sufficient apparent presence; low bbox height is shape-driven.
- m109: **KEEP** — Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m110: **KEEP** — Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m111: **KEEP** — Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m113: **KEEP** — Manual visual QA: tall/narrow lantern silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m114: **KEEP** — Manual visual QA: tall/narrow lantern silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m146: **KEEP** — Manual visual QA: tall/narrow book-spirit silhouette is well centered and sufficiently large; width alone does not justify normalization.
- m147: **KEEP** — Manual visual QA: tall/narrow book-spirit silhouette is well centered and sufficiently large; width alone does not justify normalization.
- m154: **KEEP** — Manual visual QA: wide armored body fills the production card strongly; reduced height is body-plan driven.
- m196: **KEEP** — Manual visual QA: tall stage1 bird silhouette has strong presence and is appropriately smaller in width than evolved winged stages.
- m204: **KEEP** — Manual visual QA: tall final-stage ghost silhouette has strong presence; narrow width is body-plan driven.
- m212: **KEEP** — Manual visual QA: wide-wing stage2 bird has strong apparent size; low bbox height is wing/body-plan driven.
- m213: **KEEP** — Manual visual QA: wide-wing final-stage bird fills the card width and is bbox-centered; alpha-centroid offset is caused by asymmetric wing/tail mass.
- m229: **MANUAL_REVIEW** — Manual visual QA: F078 stage1 is scene-backed and reads as a small dark cat-like creature while stages2/3 read as large winged poison creatures; family/body-plan continuity is unresolved and background repair alone may be insufficient.
- m233: **REPAIR** — Manual visual QA: tiny character also contains a detached stray fragment at left; normalization alone cannot remove the pixel artifact.
- m234: **REPAIR** — Manual visual QA: visible text/label-like marks appear above the creature; normalization alone cannot remove this production-unsafe pixel artifact.
- m235: **MANUAL_REVIEW** — Manual visual QA: image is dominated by a horizontal forest/tree scene rather than an unambiguous isolated monster; safe separation of creature from scenery is uncertain.

## Smallest apparent species — TOP 20
- m232 (F079, S1, normal) — H 24.5% / W 20.9%
- m233 (F079, S2, normal) — H 30.3% / W 36.6%
- m234 (F079, S3, normal) — H 37.0% / W 37.7%
- m219 (F074, S3, electric) — H 49.8% / W 61.3%
- m213 (F072, S3, fire) — H 50.0% / W 83.6%
- m218 (F074, S2, electric) — H 50.0% / W 69.7%
- m057 (F019, S3, fire) — H 54.3% / W 83.4%
- m180 (F061, S3, electric) — H 56.8% / W 77.0%
- m179 (F061, S2, electric) — H 58.0% / W 82.4%
- m178 (F061, S1, electric) — H 58.6% / W 74.8%
- m202 (F069, S1, ghost) — H 62.1% / W 35.7%
- m154 (F053, S1, steel) — H 62.5% / W 90.2%
- m212 (F072, S2, fire) — H 63.9% / W 81.6%
- m060 (F020, S3, fire) — H 67.6% / W 83.4%
- m006 (F002, S3, fire) — H 68.8% / W 85.5%
- m013 (F005, S1, normal) — H 72.1% / W 51.0%
- m014 (F005, S2, normal) — H 75.0% / W 57.6%
- m155 (F053, S2, steel) — H 75.0% / W 89.5%
- m026 (F009, S2, electric) — H 75.8% / W 79.5%
- m056 (F019, S2, fire) — H 76.2% / W 81.8%

## Largest apparent species — TOP 20
- m034 (F012, S1, rock) — H 100.0% / W 100.0%
- m035 (F012, S2, rock) — H 100.0% / W 100.0%
- m036 (F012, S3, rock) — H 100.0% / W 100.0%
- m040 (F014, S1, grass) — H 100.0% / W 100.0%
- m041 (F014, S2, grass) — H 100.0% / W 100.0%
- m042 (F014, S3, grass) — H 100.0% / W 100.0%
- m046 (F016, S1, fight) — H 100.0% / W 100.0%
- m047 (F016, S2, fight) — H 100.0% / W 100.0%
- m048 (F016, S3, fight) — H 100.0% / W 100.0%
- m049 (F017, S1, fairy) — H 100.0% / W 100.0%
- m050 (F017, S2, fairy) — H 100.0% / W 100.0%
- m051 (F017, S3, fairy) — H 100.0% / W 100.0%
- m052 (F018, S1, psychic) — H 100.0% / W 100.0%
- m053 (F018, S2, psychic) — H 100.0% / W 100.0%
- m054 (F018, S3, psychic) — H 100.0% / W 100.0%
- m064 (F022, S1, rock) — H 100.0% / W 100.0%
- m065 (F022, S2, rock) — H 100.0% / W 100.0%
- m066 (F022, S3, rock) — H 100.0% / W 100.0%
- m088 (F030, S1, fight) — H 100.0% / W 100.0%
- m089 (F030, S2, fight) — H 100.0% / W 100.0%

## Strongest alpha-centroid offset — TOP 20
- m058 (F020) — alpha offset 0.1046, bbox-center offset (0.0000, 0.0020)
- m213 (F072) — alpha offset 0.0943, bbox-center offset (0.0000, -0.0098)
- m167 (F057) — alpha offset 0.0879, bbox-center offset (-0.0010, -0.0068)
- m043 (F015) — alpha offset 0.0832, bbox-center offset (0.0361, -0.0186)
- m085 (F029) — alpha offset 0.0821, bbox-center offset (0.0000, 0.0000)
- m005 (F002) — alpha offset 0.0786, bbox-center offset (0.0000, 0.0010)
- m142 (F048) — alpha offset 0.0741, bbox-center offset (0.0029, -0.0010)
- m024 (F008) — alpha offset 0.0732, bbox-center offset (0.0107, 0.0010)
- m110 (F037) — alpha offset 0.0731, bbox-center offset (-0.0020, 0.0000)
- m038 (F013) — alpha offset 0.0717, bbox-center offset (0.0010, 0.0000)
- m023 (F008) — alpha offset 0.0713, bbox-center offset (0.0117, -0.0020)
- m060 (F020) — alpha offset 0.0709, bbox-center offset (0.0010, 0.0117)
- m006 (F002) — alpha offset 0.0696, bbox-center offset (0.0000, 0.0000)
- m112 (F038) — alpha offset 0.0687, bbox-center offset (0.0430, 0.0010)
- m067 (F023) — alpha offset 0.0678, bbox-center offset (0.0166, 0.0000)
- m145 (F050) — alpha offset 0.0660, bbox-center offset (0.0098, 0.0000)
- m076 (F026) — alpha offset 0.0659, bbox-center offset (0.0225, 0.0010)
- m211 (F072) — alpha offset 0.0655, bbox-center offset (-0.0010, -0.0010)
- m100 (F034) — alpha offset 0.0653, bbox-center offset (0.0461, -0.0008)
- m141 (F048) — alpha offset 0.0642, bbox-center offset (0.0029, -0.0010)

## Background suspicion species
- m034
- m035
- m036
- m040
- m041
- m042
- m046
- m047
- m048
- m049
- m050
- m051
- m052
- m053
- m054
- m064
- m065
- m066
- m088
- m089
- m090
- m091
- m092
- m093
- m097
- m098
- m099
- m103
- m104
- m105
- m106
- m107
- m108
- m115
- m116
- m119
- m120
- m121
- m122
- m123
- m124
- m125
- m126
- m127
- m134
- m135
- m136
- m143
- m144
- m148
- m149
- m150
- m151
- m152
- m153
- m157
- m158
- m159
- m160
- m161
- m162
- m169
- m170
- m171
- m175
- m176
- m177
- m184
- m185
- m186
- m187
- m188
- m189
- m190
- m191
- m192
- m193
- m194
- m195
- m205
- m206
- m207
- m208
- m209
- m210
- m220
- m221
- m222
- m229
- m235
- m236
- m238

## Crop-risk species
- m011: visible alpha reaches canvas edge after excluding opaque-background cases
- m045: visible alpha reaches canvas edge after excluding opaque-background cases
- m081: visible alpha reaches canvas edge after excluding opaque-background cases
- m129: visible alpha reaches canvas edge after excluding opaque-background cases
- m130: visible alpha reaches canvas edge after excluding opaque-background cases
- m133: visible alpha reaches canvas edge after excluding opaque-background cases
- m141: visible alpha reaches canvas edge after excluding opaque-background cases
- m142: visible alpha reaches canvas edge after excluding opaque-background cases
- m167: visible alpha reaches canvas edge after excluding opaque-background cases
- m215: visible alpha reaches canvas edge after excluding opaque-background cases
- m216: visible alpha reaches canvas edge after excluding opaque-background cases
- m230: visible alpha reaches canvas edge after excluding opaque-background cases
- m231: visible alpha reaches canvas edge after excluding opaque-background cases

## Confirmed family continuity concerns
- F004 (m010/m011/m012) — Manual visual QA: stage2 m011 and stage3 m012 are effectively duplicate in body, pose and detail, so final-stage differentiation is not established.
- F078 (m229/m230/m231) — Manual visual QA: m229 stage1 has a materially different body-plan/scene treatment from winged m230/m231; family continuity requires human decision.

## Style-quality outliers
- none

## Method / conservatism

- Pixel metrics come from decoded actual WebP candidates.
- Alpha/background, bbox, margins, centroid, edge contact, connected components and rendering-density/color proxies are machine-measured.
- Machine outputs are screening evidence, not final semantic judgments. The full overview was visually reviewed and targeted family sheets were used where a machine metric or family relationship was ambiguous.
- Horizontal wings/tails, tall narrow bodies and asymmetric mass are not failed solely because bbox height or alpha centroid differs from a square-body norm.
- Alpha-opaque backgrounds are excluded from crop-risk counting because their canvas edge is background, not evidence of monster clipping.
- REGENERATE remains 0: unresolved content/family cases are conservatively MANUAL_REVIEW.
- No FORMAL promotion is performed.

Canonical-Impact: none

Canonical-Reason: Adds non-destructive final visual audit evidence and tooling under the existing CURRENT Monster Art contract; no product/art semantics changed.
