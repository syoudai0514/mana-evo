# ManaEvo Rebuild — Phase 4 Monster Art Production

Status: **ACTIVE — ART STREAM / ATTRIBUTE-FIRST PLAN**

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
11. `design/rebuild/asset-reference/0822/HISTORICAL-REFERENCE-INDEX.md`

Active scope is exactly `m001-m238` / 83 families. `m239` remains excluded.

Current approval state before Phase 4:
- FORMAL: 0
- CANDIDATE: 20 (`m001-m020`)
- PLACEHOLDER: 218 (`m021-m238`)

## Historical visual reference policy

The user supplied `0822まとめ.zip` during Phase 4 planning. It contains 34 historical ManaEvo design/review boards, including type-grouped proposal sheets, area/whole-set review sheets, and late-number individual proposal boards around No.206-239.

This is valuable **visual reference**, but is not CURRENT authority or approval evidence.

Every art worker must use this sequence:
1. CURRENT species/family identity and description first.
2. Existing CURRENT candidate asset second, when one exists.
3. Historical 0822 visual proposal/reference third.
4. Preserve useful historical silhouette/palette/evolution direction when compatible with CURRENT.
5. Regenerate only when prior art conflicts with CURRENT, fails family/type differentiation, originality, child readability, crop/background/size rules, or technical requirements.

Historical names/counts/No.239 must never override CURRENT.

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

## Core production decision — ATTRIBUTE FIRST

Phase 4 production is **not** divided by contiguous No ranges.

Primary production/review unit is the monster's CURRENT `type` / attribute.

Reason:
- If the same type is split across unrelated workers/batches, independent workers can converge on the same elemental aura, color formula, horn/wing/ear template, body plan, or silhouette without seeing each other.
- A single type owner can compare every family of that attribute at once and deliberately diversify motif, anatomy, palette, silhouette, effects, personality and final-form presence.

Rules:
- One attribute = one owning Work Item / art-direction owner.
- All families of that attribute are visible to that owner together.
- Family is never split.
- If an attribute is large, its owner may work in internal waves, but it stays one ownership/work item and one anti-duplication matrix.
- No two independent workers may separately establish visual language for the same attribute.
- Before production, W-302 mechanically verifies that each active family is type-consistent. Any mixed-type family is BLOCKED for commander review instead of being silently split.

---

## W-301 — Global style calibration / visual constitution

Type: visual calibration / human-review gate

Purpose: lock **global rendering language**, not one monster anatomy.

Required work:
1. Review CURRENT art contract, existing m001-m020 candidates, and the 0822 historical reference pack.
2. Calibrate using multiple attributes, not one type only. Minimum representative families:
   - F001 m001-m003 — grass, existing candidate/reference
   - F002 m004-m006 — fire, existing candidate/reference
   - F003 m007-m009 — water, existing candidate/reference
   - F008 m022-m024 — bug, missing CURRENT per-ID asset and useful production test
3. Define global rules for:
   - rendering/detail density
   - head/body proportion range
   - eye/face treatment range
   - material/light treatment
   - outline/edge treatment
   - background/transparency
   - amount of elemental VFX allowed
   - stage1/middle/final escalation
   - how dark/scary designs stay child-safe without becoming cute clones
4. Do **not** lock one shared anatomy, ear, horn, eye, wing or limb template.
5. Record the approved global direction in `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md` only after commander/user approval.
6. No FORMAL promotions.

Acceptance:
- representative families still look intentionally different
- family continuity reads clearly within each family
- grass/fire/water/bug do not look like recolored versions of one base creature
- style can extend to all 18 types without forcing one silhouette

---

## W-302 — Historical-reference ingestion + attribute queue + candidate QA automation

Branch: `rebuild/w-302-monster-art-ingestion`
Type: tooling/reference preparation only; no FORMAL approval

Primary ownership:
- read-only historical-reference ingest/index
- generated attribute-first production queue
- candidate ingestion/validation scripts
- art-production review ledgers/templates
- tests for those scripts

Required work:
1. Ingest the user-supplied `0822まとめ.zip` as **historical visual reference only** under a clearly separated reference path. Preserve source provenance. Do not present it as CURRENT asset art.
2. Generate manageable review contact sheets/indexes so later type owners can inspect prior proposals without requiring the original chat attachment.
3. Generate a machine-readable **attribute-first queue** directly from CURRENT description shards for active m001-m238.
4. Validate exactly 18 CURRENT types and 83 active families; validate each family is assigned exactly once and is not split across type owners.
5. For each type, generate:
   - all familyNos
   - all speciesIds
   - existing CURRENT candidate paths
   - historical-reference availability/index
   - CURRENT motif/familyConcept pointers
   - review state
6. Add deterministic candidate ingestion keyed by `mNNN`.
7. Validate active ID m001-m238, reject m239/unknown IDs.
8. Enforce target WebP under 1 MB for repository candidate ingestion.
9. Preserve old/new candidate provenance/checksum before replacement.
10. Generate a machine-readable review ledger containing speciesId, familyNo, stage, type, checksum, review status, notes and historical-reference pointer.
11. Do not change `monster-asset-manifest.json` to FORMAL.
12. Provide a separate explicit later promotion command that refuses to run without approval evidence; do not execute it in W-302.
13. Tests cover ID/path/type/family validation, m239 rejection, provenance preservation and no accidental FORMAL promotion.

Acceptance:
- later type workers need only GitHub; they do not need the original chat ZIP
- candidate ingestion is repeatable and review-safe
- type queue covers m001-m238 exactly once
- same type is not split among independent art owners
- no game/runtime rule changes

---

## Phase 4B — 18 attribute-owned art batches

Starts after W-301 style lock and W-302 attribute queue are complete.

Each Work Item owns **all CURRENT families of that type**. Exact membership is generated by W-302; do not hard-code No ranges from historical boards.

### W-303 — grass
### W-304 — fire
### W-305 — water
### W-306 — electric
### W-307 — normal
### W-308 — flying
### W-309 — bug
### W-310 — ground
### W-311 — rock
### W-312 — steel
### W-313 — poison
### W-314 — fight
### W-315 — fairy
### W-316 — psychic
### W-317 — ice
### W-318 — ghost
### W-319 — dark
### W-320 — dragon

Common W-303..W-320 rules:
1. Read the W-302 attribute queue and take the complete attribute ownership set.
2. Build an **attribute anti-duplication matrix before generation/review**. For every family record:
   - motif
   - base anatomy/body plan
   - signature feature
   - dominant palette
   - silhouette category
   - elemental VFX language
   - personality/expression
   - final-stage visual role
3. Review all existing/historical proposals for the attribute side-by-side before generating replacements.
4. Existing candidate/reference is a starting point, not disposable work.
5. Keep useful prior visual identity when compatible with CURRENT.
6. Generate/regenerate by family, never disconnected individual stages.
7. Ensure unrelated families of the same type are more than recolors or aura swaps.
8. Within a family preserve at least two continuity signals while making stage growth meaningful.
9. Keep prior candidate when comparison is needed; preserve old/new evidence.
10. Output remains CANDIDATE. No FORMAL promotion.
11. Record per-species PASS / REGENERATE / BLOCKED and per-family continuity notes.
12. Do not edit gameplay/runtime/domain rules.

Attribute-owner acceptance:
- every CURRENT family/species of that type handled exactly once
- no same-type family pair reuses the same defining silhouette/template
- palettes/VFX are not a single formula repeated across the type
- historical designs were considered and disposition recorded: KEEP / REFINE / REGENERATE
- small-size readability and family progression pass

---

## W-321 — Cross-attribute visual QA

Starts only after W-303..W-320 candidate production is complete.

Required checks across all 238:
- ID/name mapping exact
- 83 family continuity review
- stage progression
- duplicate silhouette/template detection across **all types**
- same-type diversity and cross-type distinctness
- palette/VFX overuse
- small-size readability
- crop/background/text compliance
- originality review
- file size/path integrity
- 0822 historical-reference disposition accounted for

Output:
- complete 238-species QA ledger
- only PASS candidates can enter formal-approval review
- failures return to the owning **attribute** batch; do not paper over them

---

## W-322 — FORMAL approval / manifest / release

Starts only after explicit CURRENT approval evidence exists for reviewed candidates.

Required work:
1. Update `design/current/monster-asset-manifest.json` per approved species with `FORMAL`, `formalAsset`, and approval evidence.
2. Run asset revision generation and integrity validation.
3. Verify normal runtime resolves FORMAL only and placeholders remain for any unapproved species.
4. Run full unit/integration, production build, release verifier, and iPhone WebKit E2E.
5. Update final release checklist with actual FORMAL/CANDIDATE/PLACEHOLDER counts.
6. Do not claim full product completion unless active m001-m238 all have the required approved state for release.
7. After final commander review, prepare the rebuild branch for merge to `main`; do not merge to main from a worker.
