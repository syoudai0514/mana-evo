# ManaEvo Monster Art Final Visual QA — Phase 1

Generated from actual decoded candidate pixels on PR #108 branch. **Audit only; no candidate mutation.**

## Inventory gate

- species: 238 / 238
- missing: 0
- duplicate species assignment: 0
- extra active species: 0
- m239: absent from active scope
- provenance matched to candidate bytes/SHA: 238 / 238

## Classification

TOTAL: 238

KEEP: 104

NORMALIZE: 29

REPAIR: 92

REGENERATE: 0

MANUAL_REVIEW: 13

### KEEP
m001, m002, m003, m004, m005, m006, m007, m008, m009, m010, m012, m016, m017, m018, m019, m020, m021, m022, m023, m024, m025, m026, m027, m028, m029, m030, m031, m032, m033, m037, m038, m039, m043, m044, m055, m056, m059, m061, m062, m063, m067, m068, m069, m070, m071, m072, m073, m074, m075, m076, m077, m078, m079, m080, m082, m083, m084, m085, m086, m087, m094, m095, m096, m100, m101, m102, m112, m117, m118, m128, m131, m132, m137, m138, m139, m145, m155, m156, m163, m164, m165, m166, m168, m172, m173, m174, m181, m182, m183, m197, m198, m199, m200, m201, m211, m214, m217, m223, m224, m225, m226, m227, m228, m237

### NORMALIZE
m013, m014, m015, m057, m058, m060, m109, m110, m111, m113, m114, m140, m146, m147, m154, m178, m179, m180, m196, m202, m203, m204, m212, m213, m218, m219, m232, m233, m234

### REPAIR
m034, m035, m036, m040, m041, m042, m046, m047, m048, m049, m050, m051, m052, m053, m054, m064, m065, m066, m088, m089, m090, m091, m092, m093, m097, m098, m099, m103, m104, m105, m106, m107, m108, m115, m116, m119, m120, m121, m122, m123, m124, m125, m126, m127, m134, m135, m136, m143, m144, m148, m149, m150, m151, m152, m153, m157, m158, m159, m160, m161, m162, m169, m170, m171, m175, m176, m177, m184, m185, m186, m187, m188, m189, m190, m191, m192, m193, m194, m195, m205, m206, m207, m208, m209, m210, m220, m221, m222, m229, m235, m236, m238

### REGENERATE
none

### MANUAL_REVIEW
m011, m045, m081, m129, m130, m133, m141, m142, m167, m215, m216, m230, m231

## Key findings

- background suspicion: 92 — m034, m035, m036, m040, m041, m042, m046, m047, m048, m049, m050, m051, m052, m053, m054, m064, m065, m066, m088, m089, m090, m091, m092, m093, m097, m098, m099, m103, m104, m105, m106, m107, m108, m115, m116, m119, m120, m121, m122, m123, m124, m125, m126, m127, m134, m135, m136, m143, m144, m148, m149, m150, m151, m152, m153, m157, m158, m159, m160, m161, m162, m169, m170, m171, m175, m176, m177, m184, m185, m186, m187, m188, m189, m190, m191, m192, m193, m194, m195, m205, m206, m207, m208, m209, m210, m220, m221, m222, m229, m235, m236, m238
- crop risk: 105 — m011, m034, m035, m036, m040, m041, m042, m045, m046, m047, m048, m049, m050, m051, m052, m053, m054, m064, m065, m066, m081, m088, m089, m090, m091, m092, m093, m097, m098, m099, m103, m104, m105, m106, m107, m108, m115, m116, m119, m120, m121, m122, m123, m124, m125, m126, m127, m129, m130, m133, m134, m135, m136, m141, m142, m143, m144, m148, m149, m150, m151, m152, m153, m157, m158, m159, m160, m161, m162, m167, m169, m170, m171, m175, m176, m177, m184, m185, m186, m187, m188, m189, m190, m191, m192, m193, m194, m195, m205, m206, m207, m208, m209, m210, m215, m216, m220, m221, m222, m229, m230, m231, m235, m236, m238
- scale outlier: 18 — m013, m014, m015, m057, m060, m154, m178, m179, m180, m202, m203, m212, m213, m218, m219, m232, m233, m234
- family continuity concerns: 21 — F014, F016, F017, F022, F030, F031, F033, F035, F036, F039, F041, F042, F043, F046, F049, F051, F054, F055, F058, F060, F071
- style-quality outliers: 0 — none

## Smallest apparent species — TOP 20
- m013 (F005, S1, normal) — H 23.4%
- m232 (F079, S1, normal) — H 24.5%
- m014 (F005, S2, normal) — H 29.1%
- m233 (F079, S2, normal) — H 30.3%
- m015 (F005, S3, normal) — H 35.3%
- m234 (F079, S3, normal) — H 37.0%
- m219 (F074, S3, electric) — H 49.8%
- m213 (F072, S3, fire) — H 50.0%
- m218 (F074, S2, electric) — H 50.0%
- m202 (F069, S1, ghost) — H 50.2%
- m180 (F061, S3, electric) — H 53.3%
- m057 (F019, S3, fire) — H 54.3%
- m178 (F061, S1, electric) — H 54.3%
- m179 (F061, S2, electric) — H 54.3%
- m154 (F053, S1, steel) — H 62.5%
- m212 (F072, S2, fire) — H 63.9%
- m203 (F069, S2, ghost) — H 67.2%
- m060 (F020, S3, fire) — H 67.6%
- m006 (F002, S3, fire) — H 68.8%
- m155 (F053, S2, steel) — H 75.0%

## Largest apparent species — TOP 20
- m034 (F012, S1, rock) — H 100.0%
- m035 (F012, S2, rock) — H 100.0%
- m036 (F012, S3, rock) — H 100.0%
- m040 (F014, S1, grass) — H 100.0%
- m041 (F014, S2, grass) — H 100.0%
- m042 (F014, S3, grass) — H 100.0%
- m046 (F016, S1, fight) — H 100.0%
- m047 (F016, S2, fight) — H 100.0%
- m048 (F016, S3, fight) — H 100.0%
- m049 (F017, S1, fairy) — H 100.0%
- m050 (F017, S2, fairy) — H 100.0%
- m051 (F017, S3, fairy) — H 100.0%
- m052 (F018, S1, psychic) — H 100.0%
- m053 (F018, S2, psychic) — H 100.0%
- m054 (F018, S3, psychic) — H 100.0%
- m064 (F022, S1, rock) — H 100.0%
- m065 (F022, S2, rock) — H 100.0%
- m066 (F022, S3, rock) — H 100.0%
- m088 (F030, S1, fight) — H 100.0%
- m089 (F030, S2, fight) — H 100.0%

## Strongest center offset — TOP 20
- m202 (F069) — offset 0.1295 (x -0.0307, y 0.1259)
- m058 (F020) — offset 0.1046 (x 0.0105, y 0.1041)
- m213 (F072) — offset 0.0943 (x 0.0533, y -0.0778)
- m140 (F048) — offset 0.0912 (x 0.0401, y -0.0820)
- m167 (F057) — offset 0.0879 (x 0.0577, y 0.0664)
- m043 (F015) — offset 0.0832 (x -0.0130, y 0.0822)
- m085 (F029) — offset 0.0821 (x -0.0204, y 0.0795)
- m005 (F002) — offset 0.0786 (x -0.0784, y -0.0056)
- m142 (F048) — offset 0.0741 (x 0.0695, y -0.0256)
- m024 (F008) — offset 0.0732 (x 0.0543, y -0.0490)
- m110 (F037) — offset 0.0731 (x -0.0728, y -0.0070)
- m038 (F013) — offset 0.0717 (x 0.0713, y -0.0075)
- m023 (F008) — offset 0.0713 (x 0.0499, y -0.0510)
- m060 (F020) — offset 0.0709 (x -0.0033, y 0.0708)
- m006 (F002) — offset 0.0696 (x -0.0692, y -0.0067)
- m112 (F038) — offset 0.0687 (x 0.0048, y 0.0685)
- m067 (F023) — offset 0.0678 (x -0.0672, y -0.0089)
- m145 (F050) — offset 0.0660 (x -0.0284, y 0.0596)
- m076 (F026) — offset 0.0659 (x 0.0285, y -0.0594)
- m211 (F072) — offset 0.0655 (x -0.0655, y 0.0013)

## Background suspicion species
- m034: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m035: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m036: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m040: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m041: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m042: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m046: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m047: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m048: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m049: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m050: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m051: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m052: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m053: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m054: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m064: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m065: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m066: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m088: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m089: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m090: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m091: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m092: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m093: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m097: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m098: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m099: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m103: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m104: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m105: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m106: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m107: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m108: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m115: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m116: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m119: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m120: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m121: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m122: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m123: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m124: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m125: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m126: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m127: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m134: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m135: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m136: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m143: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m144: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m148: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m149: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m150: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m151: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m152: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m153: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m157: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m158: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m159: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m160: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m161: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m162: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m169: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m170: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m171: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m175: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m176: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m177: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m184: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m185: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m186: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m187: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m188: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m189: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m190: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m191: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m192: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m193: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m194: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m195: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m205: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m206: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m207: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m208: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m209: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m210: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m220: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m221: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m222: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m229: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m235: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m236: fully/nearly opaque rectangular canvas; pixel-level background cleanup required
- m238: fully/nearly opaque rectangular canvas; pixel-level background cleanup required

## Crop-risk species
- m011: bbox 95.0% × 99.7%, touches 1 edges
- m034: bbox 100.0% × 100.0%, touches 4 edges
- m035: bbox 100.0% × 100.0%, touches 4 edges
- m036: bbox 100.0% × 100.0%, touches 4 edges
- m040: bbox 100.0% × 100.0%, touches 4 edges
- m041: bbox 100.0% × 100.0%, touches 4 edges
- m042: bbox 100.0% × 100.0%, touches 4 edges
- m045: bbox 91.6% × 98.8%, touches 1 edges
- m046: bbox 100.0% × 100.0%, touches 4 edges
- m047: bbox 100.0% × 100.0%, touches 4 edges
- m048: bbox 100.0% × 100.0%, touches 4 edges
- m049: bbox 100.0% × 100.0%, touches 4 edges
- m050: bbox 100.0% × 100.0%, touches 4 edges
- m051: bbox 100.0% × 100.0%, touches 4 edges
- m052: bbox 100.0% × 100.0%, touches 4 edges
- m053: bbox 100.0% × 100.0%, touches 4 edges
- m054: bbox 100.0% × 100.0%, touches 4 edges
- m064: bbox 100.0% × 100.0%, touches 4 edges
- m065: bbox 100.0% × 100.0%, touches 4 edges
- m066: bbox 100.0% × 100.0%, touches 4 edges
- m081: bbox 91.8% × 99.2%, touches 1 edges
- m088: bbox 100.0% × 100.0%, touches 4 edges
- m089: bbox 100.0% × 100.0%, touches 4 edges
- m090: bbox 100.0% × 100.0%, touches 4 edges
- m091: bbox 100.0% × 100.0%, touches 4 edges
- m092: bbox 100.0% × 100.0%, touches 4 edges
- m093: bbox 100.0% × 100.0%, touches 4 edges
- m097: bbox 100.0% × 100.0%, touches 4 edges
- m098: bbox 100.0% × 100.0%, touches 4 edges
- m099: bbox 100.0% × 100.0%, touches 4 edges
- m103: bbox 100.0% × 100.0%, touches 4 edges
- m104: bbox 100.0% × 100.0%, touches 4 edges
- m105: bbox 100.0% × 100.0%, touches 4 edges
- m106: bbox 100.0% × 100.0%, touches 4 edges
- m107: bbox 100.0% × 100.0%, touches 4 edges
- m108: bbox 100.0% × 100.0%, touches 4 edges
- m115: bbox 100.0% × 100.0%, touches 4 edges
- m116: bbox 100.0% × 100.0%, touches 4 edges
- m119: bbox 100.0% × 100.0%, touches 4 edges
- m120: bbox 100.0% × 100.0%, touches 4 edges
- m121: bbox 100.0% × 100.0%, touches 4 edges
- m122: bbox 100.0% × 100.0%, touches 4 edges
- m123: bbox 100.0% × 100.0%, touches 4 edges
- m124: bbox 100.0% × 100.0%, touches 4 edges
- m125: bbox 100.0% × 100.0%, touches 4 edges
- m126: bbox 100.0% × 100.0%, touches 4 edges
- m127: bbox 100.0% × 100.0%, touches 4 edges
- m129: bbox 99.2% × 96.9%, touches 1 edges
- m130: bbox 100.0% × 99.4%, touches 3 edges
- m133: bbox 87.5% × 100.0%, touches 2 edges
- m134: bbox 100.0% × 100.0%, touches 4 edges
- m135: bbox 100.0% × 100.0%, touches 4 edges
- m136: bbox 100.0% × 100.0%, touches 4 edges
- m141: bbox 99.4% × 99.8%, touches 2 edges
- m142: bbox 99.4% × 99.8%, touches 2 edges
- m143: bbox 100.0% × 100.0%, touches 4 edges
- m144: bbox 100.0% × 100.0%, touches 4 edges
- m148: bbox 100.0% × 100.0%, touches 4 edges
- m149: bbox 100.0% × 100.0%, touches 4 edges
- m150: bbox 100.0% × 100.0%, touches 4 edges
- m151: bbox 100.0% × 100.0%, touches 4 edges
- m152: bbox 100.0% × 100.0%, touches 4 edges
- m153: bbox 100.0% × 100.0%, touches 4 edges
- m157: bbox 100.0% × 100.0%, touches 4 edges
- m158: bbox 100.0% × 100.0%, touches 4 edges
- m159: bbox 100.0% × 100.0%, touches 4 edges
- m160: bbox 100.0% × 100.0%, touches 4 edges
- m161: bbox 100.0% × 100.0%, touches 4 edges
- m162: bbox 100.0% × 100.0%, touches 4 edges
- m167: bbox 97.5% × 98.6%, touches 1 edges
- m169: bbox 100.0% × 100.0%, touches 4 edges
- m170: bbox 100.0% × 100.0%, touches 4 edges
- m171: bbox 100.0% × 100.0%, touches 4 edges
- m175: bbox 100.0% × 100.0%, touches 4 edges
- m176: bbox 100.0% × 100.0%, touches 4 edges
- m177: bbox 100.0% × 100.0%, touches 4 edges
- m184: bbox 100.0% × 100.0%, touches 4 edges
- m185: bbox 100.0% × 100.0%, touches 4 edges
- m186: bbox 100.0% × 100.0%, touches 4 edges
- m187: bbox 100.0% × 100.0%, touches 4 edges
- m188: bbox 100.0% × 100.0%, touches 4 edges
- m189: bbox 100.0% × 100.0%, touches 4 edges
- m190: bbox 100.0% × 100.0%, touches 4 edges
- m191: bbox 100.0% × 100.0%, touches 4 edges
- m192: bbox 100.0% × 100.0%, touches 4 edges
- m193: bbox 100.0% × 100.0%, touches 4 edges
- m194: bbox 100.0% × 100.0%, touches 4 edges
- m195: bbox 100.0% × 100.0%, touches 4 edges
- m205: bbox 100.0% × 100.0%, touches 4 edges
- m206: bbox 100.0% × 100.0%, touches 4 edges
- m207: bbox 100.0% × 100.0%, touches 4 edges
- m208: bbox 100.0% × 100.0%, touches 4 edges
- m209: bbox 100.0% × 100.0%, touches 4 edges
- m210: bbox 100.0% × 100.0%, touches 4 edges
- m215: bbox 81.8% × 100.0%, touches 2 edges
- m216: bbox 93.6% × 99.6%, touches 1 edges
- m220: bbox 100.0% × 100.0%, touches 4 edges
- m221: bbox 100.0% × 100.0%, touches 4 edges
- m222: bbox 100.0% × 100.0%, touches 4 edges
- m229: bbox 100.0% × 100.0%, touches 4 edges
- m230: bbox 99.8% × 99.0%, touches 1 edges
- m231: bbox 99.8% × 99.8%, touches 2 edges
- m235: bbox 100.0% × 100.0%, touches 4 edges
- m236: bbox 100.0% × 100.0%, touches 4 edges
- m238: bbox 100.0% × 100.0%, touches 4 edges

## Family continuity concerns
- F014 (m040/m041/m042) — adjacent stages unusually similar: m040-m041, m041-m042
- F016 (m046/m047/m048) — adjacent stages unusually similar: m046-m047
- F017 (m049/m050/m051) — adjacent stages unusually similar: m050-m051
- F022 (m064/m065/m066) — adjacent stages unusually similar: m064-m065
- F030 (m088/m089/m090) — adjacent stages unusually similar: m088-m089
- F031 (m091/m092/m093) — adjacent stages unusually similar: m091-m092, m092-m093
- F033 (m097/m098/m099) — adjacent stages unusually similar: m097-m098, m098-m099
- F035 (m103/m104/m105) — adjacent stages unusually similar: m103-m104, m104-m105
- F036 (m106/m107/m108) — adjacent stages unusually similar: m107-m108
- F039 (m115/m116) — adjacent stages unusually similar: m115-m116
- F041 (m119/m120/m121) — adjacent stages unusually similar: m119-m120
- F042 (m122/m123/m124) — adjacent stages unusually similar: m123-m124
- F043 (m125/m126/m127) — adjacent stages unusually similar: m126-m127
- F046 (m134/m135/m136) — adjacent stages unusually similar: m134-m135, m135-m136
- F049 (m143/m144) — adjacent stages unusually similar: m143-m144
- F051 (m148/m149/m150) — adjacent stages unusually similar: m149-m150
- F054 (m157/m158/m159) — adjacent stages unusually similar: m157-m158
- F055 (m160/m161/m162) — adjacent stages unusually similar: m160-m161, m161-m162
- F058 (m169/m170/m171) — adjacent stages unusually similar: m170-m171
- F060 (m175/m176/m177) — adjacent stages unusually similar: m175-m176, m176-m177
- F071 (m208/m209/m210) — adjacent stages unusually similar: m208-m209, m209-m210

## Style-quality outliers
- none

## Method / conservatism

- Pixel metrics are decoded from the actual WebP candidates, not manifest metadata alone.
- Alpha/background, bbox, centroid, edge contact, connected components, color/saturation/luminance and rendering-density proxies are machine-measured.
- Family continuity uses silhouette occupancy + palette similarity as a **screening heuristic**. Semantic identity/material/signature-feature judgments are not inferred from numbers; suspicious families are routed to MANUAL_REVIEW and family contact sheets.
- Apparent-height guidance (roughly 70–85%, preferred ~72–82%) is not a hard fail gate.
- REGENERATE is intentionally not assigned from ambiguous machine evidence. Uncertain cases become MANUAL_REVIEW.
- No FORMAL promotion is performed.

Canonical-Impact: none

Canonical-Reason: Adds non-destructive final visual audit evidence and tooling under the existing CURRENT Monster Art contract; no product/art semantics changed.
