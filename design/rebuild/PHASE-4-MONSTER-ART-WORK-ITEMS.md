# ManaEvo Rebuild — Phase 4 Monster Art Production

Status: **ACTIVE — ART STREAM**

Base branch: `rebuild/canonical-governance`

Engineering rebuild is complete. This phase owns the remaining formal monster-art stream only.

## Authorities

Read in order:
1. `REBUILD-START-HERE.md`
2. `design/current/00-START-HERE.md`
3. `design/current/09-MONSTER-MASTER-ART-SPEC.md`
4. `design/current/monster-asset-manifest.json`
5. `design/current/monsters/descriptions-001-080.json`
6. `design/current/monsters/descriptions-081-160.json`
7. `design/current/monsters/descriptions-161-238.json`
8. `design/rebuild/asset-audit/W-213-MONSTER-ASSET-AUDIT.md`
9. `design/rebuild/asset-production/W-217-MONSTER-ART-PRODUCTION-QUEUE.json`
10. `design/rebuild/asset-production/W-217-OPERATOR-GUIDE.md`

Active scope is exactly `m001-m238` / 83 families. `m239` remains excluded.

Current approval state before Phase 4:
- FORMAL: 0
- CANDIDATE: 20 (`m001-m020`)
- PLACEHOLDER: 218 (`m021-m238`)

## Non-negotiable art rules

- Ages 5-8, but do not make every monster uniformly cute.
- Primarily 2-4 heads tall; front to slight three-quarter view; full body visible.
- Transparent or clean white background; no text baked into art.
- Face, type impression, and signature feature must remain readable at small game size.
- Family continuity preserves at least two of face identity / color identity / signature body feature.
- Stage 1 younger/simple, middle visibly developed, final imposing/readable where those stages exist.
- Do not imitate a specific existing-IP character.
- Do not reuse one defining silhouette/template across unrelated families.
- Final per-species target path is `public/monsters/mNNN.webp`, below 1 MB.
- File existence is not approval. CANDIDATE must never be silently promoted to FORMAL.
- Formal approval requires explicit CURRENT approval evidence and manifest update.

## Dependency plan

Do **not** mass-generate all 238 before visual calibration.

Phase 4A first locks one representative missing-art family and the ingestion/review pipeline. After the style lock, Phase 4B runs the 12 W-217 family batches in parallel.

---

## W-301 — Style calibration family

Type: visual calibration / human-review gate

Calibration family: **F008 = m022 チクリン / m023 ハリバチ / m024 クイーンザ**
Reason: this is a complete 3-stage family with no existing per-ID candidate, so it can establish the production look without overwriting existing m001-m020 candidates.

Required work:
1. Resolve the exact three CURRENT description rows by speciesId and use them verbatim as constraints.
2. Produce a single side-by-side family calibration board using native image generation.
3. Preserve the family motif `針と女王蜂` and the personality progression.
4. Stage progression must read clearly:
   - m022: small proud needle, young/simple silhouette
   - m023: visibly grown swarm-flying protector, recognizable continuity
   - m024: imposing queen/guardian silhouette without becoming grotesque
5. No names/text inside the art.
6. Do not mark any asset FORMAL in this work item.
7. Record the accepted visual-direction rules only after commander/user visual approval.

Output after approval:
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`

Acceptance:
- all 3 stages visibly belong to one family
- not a recolor-only evolution
- small-size silhouette/readability is strong
- original character design, no specific-IP imitation
- visual direction is reusable across different motifs without forcing one anatomy/template

---

## W-302 — Candidate ingestion / QA automation

Branch: `rebuild/w-302-monster-art-ingestion`
Type: tooling only; no art generation and no FORMAL approval

Primary ownership:
- monster-art ingestion/validation scripts
- art-production review ledgers/templates
- tests for those scripts

Required work:
1. Add a deterministic operator command that accepts candidate image files keyed by `mNNN`.
2. Validate active ID m001-m238, reject m239/unknown IDs.
3. Validate image format/dimensions and enforce target WebP under 1 MB for repository candidate ingestion.
4. Write candidates only to `public/monsters/mNNN.webp` (or a clearly isolated review-candidate staging path if replacing an existing candidate would destroy comparison evidence).
5. Preserve prior candidate provenance/checksum before replacement.
6. Generate a machine-readable review ledger containing speciesId, familyNo, stage, source candidate checksum, review status, and notes.
7. Do not change `monster-asset-manifest.json` state to FORMAL.
8. Provide a separate explicit command for later FORMAL promotion that refuses to run without approval evidence; do not execute that promotion in W-302.
9. Add tests for ID/path validation, size rejection, m239 rejection, provenance preservation, and no accidental FORMAL promotion.

Acceptance:
- candidate ingestion is repeatable and review-safe
- existing candidate comparison evidence cannot be silently overwritten
- no game/runtime rule changes
- full tests/build remain green

---

## Phase 4B batch production — starts after W-301 style lock

Each batch follows W-217 exactly and keeps every family whole.

### W-303 — B01
Families F001-F007, m001-m021. Review existing m001-m020 candidates against CURRENT; regenerate only failures. Produce missing m021 in F007 continuity. Keep old/new comparison evidence.

### W-304 — B02
Families F008-F014, m022-m042. Includes the W-301 calibration family; approved calibration output is reused, not independently redesigned.

### W-305 — B03
Families F015-F021, m043-m063.

### W-306 — B04
Families F022-F028, m064-m084.

### W-307 — B05
Families F029-F035, m085-m105.

### W-308 — B06
Families F036-F042, m106-m124.

### W-309 — B07
Families F043-F049, m125-m144.

### W-310 — B08
Families F050-F056, m145-m165.

### W-311 — B09
Families F057-F063, m166-m186.

### W-312 — B10
Families F064-F070, m187-m207.

### W-313 — B11
Families F071-F077, m208-m228.

### W-314 — B12
Families F078-F083, m229-m238.

Common batch rules W-303..W-314:
- Resolve each queued species row from CURRENT normalized descriptions.
- Generate/review by **family**, never as disconnected individual monsters.
- Preserve exact stable ID/name/family/stage/type constraints.
- Keep prior candidate when comparison is required; do not destroy evidence.
- Candidate output is not FORMAL approval.
- Record per-species PASS / REGENERATE / BLOCKED and family-continuity notes.
- Do not edit gameplay/runtime/domain rules.

---

## W-315 — Cross-batch visual QA

Starts only after W-303..W-314 candidate production is complete.

Required checks across all 238:
- ID/name mapping exact
- 83 family continuity review
- stage progression
- duplicate silhouette/template detection across unrelated families
- type-distribution visual distinctness
- small-size readability
- crop/background/text compliance
- originality review
- file size/path integrity

Output:
- complete 238-species QA ledger
- only PASS candidates can enter formal-approval review
- failures return to the owning batch; do not paper over them

---

## W-316 — FORMAL approval / manifest / release

Starts only after explicit CURRENT approval evidence exists for the reviewed candidates.

Required work:
1. Update `design/current/monster-asset-manifest.json` per approved species with `FORMAL`, `formalAsset`, and approval evidence.
2. Run asset revision generation and integrity validation.
3. Verify normal runtime resolves FORMAL only and placeholders remain for any unapproved species.
4. Run full unit/integration, production build, release verifier, and iPhone WebKit E2E.
5. Update final release checklist with actual FORMAL/CANDIDATE/PLACEHOLDER counts.
6. Do not claim full product completion unless active m001-m238 all have the required approved state for release.
7. After final commander review, prepare the rebuild branch for merge to `main`; do not merge to main from a worker.
