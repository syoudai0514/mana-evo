# W-303 Grass — Real Image / Art Ready Result

Status: **ART READY / INGESTION BLOCKED**

Work Item: `W-303`  
Attribute: `grass`  
Branch: `rebuild/w-303-grass-attribute-production`

## Base synchronization

- latest canonical base consumed: `b2f4face6ff1b332449df7c4ebbcc45b7211b186`
- W-303 sync merge commit: `81401197710b4d34db132b39a0b2b7806b92fdce`
- branch remains behind=0 from `rebuild/canonical-governance`

## Representative real-image review

The user directly reviewed real generated images and explicitly approved:

- F001: m001 → m002 → m003
- F028: m082 → m083 → m084, after correcting the earlier literal-gate/scenery final into a proper monster
- F029: m085 → m086 → m087

These 9 species remain approved as real-image direction and candidate-safe export.

## Remaining grass production

The remaining families were produced without another user design gate, per instruction:

- F014: m040 → m041 → m042
- F046: m134 → m135 → m136
- F080: m235

Visual QA used CURRENT + `PHASE-4-STYLE-LOCK.md` + the existing W-303 anti-duplication matrix. Family-role separation remains:

- F001 = horizontal defensive mass
- F014 = walking root + flower
- F028 = hanging / arcing vine line
- F029 = succulent + radial bloom
- F046 = vertical ancient habitat tree
- F080 = monumental axial world tree

## Candidate-safe export state

All 16 W-303 species now have local 512x512 WebP exports, all strictly below 1,000,000 bytes. Per-ID exports use clean white background and exclude baked name/ID/type/UI/frame content.

Full checksum table is recorded in `W-303-ART-READY-RESULT.md` and `W-303-GRASS-REVIEW-LEDGER.json`.

## Gate separation

- real image generation: **16 / 16**
- visual QA: **16 / 16 PASS**
- candidate-safe export: **16 / 16**
- local SHA-256: **16 / 16**
- repository candidate ingestion: **0 / 16**
- FORMAL promotion: **0**

Repository ingestion remains blocked only because the current environment cannot faithfully place these generated binaries into a repository checkout and execute W-302 `candidate-ingestion.mjs`, including archive/provenance behavior for m001-m003. No ingestion is simulated and no provenance/checksum is fabricated.

## Current W-303 state

**ART READY / INGESTION BLOCKED** — not COMPLETE.

The remaining Acceptance gate is repository candidate ingestion for all 16 species, archive/provenance for existing candidates, repository checksums, and final repository-state validation.

No FORMAL promotion. No main merge. W-304+ and W-321/W-322 remain not started.
