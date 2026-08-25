# W-213 Monster Asset Audit

## 1. Scope

This report executes W-213 against the Phase 3 Wave B canonical baseline.

- Repository: `syoudai0514/mana-evo`
- Base branch: `rebuild/canonical-governance`
- Base commit: `28e1b8a522df0a14d5a37075ebea0f7444ecfa5f`
- Active scope: `m001` through `m238`
- Explicitly excluded: `m239`
- Canonical state source:
  - `design/current/09-MONSTER-MASTER-ART-SPEC.md`
  - `design/current/monster-asset-manifest.json`
  - `design/current/monsters/descriptions-001-080.json`
  - `design/current/monsters/descriptions-081-160.json`
  - `design/current/monsters/descriptions-161-238.json`

No runtime/source/test file is changed by W-213. No image is generated, regenerated, or promoted.

The range-complete machine-readable inventory is `design/rebuild/asset-audit/W-213-MONSTER-ASSET-INVENTORY.csv`. Each row represents a homogeneous contiguous range; `firstNo`/`lastNo`/`count` coverage was validated to equal exactly 1-238 with no overlap.

## 2. Audit method

The audit used the CURRENT canonical contract as authority and treated historical runtime labels only as evidence.

1. Pinned the audit to the exact base commit above.
2. Read the full recursive Git tree for that commit. The GitHub tree response was complete (`truncated: false`).
3. Enumerated all per-species files under `public/monsters/` and checked for off-path `mNNN` assets elsewhere in the repository.
4. Compared repository presence with every manifest row from `m001` through `m238` and validated the CSV range union as exactly 238 unique IDs.
5. Reviewed historical marker/manifest/status files and the historical commits/PR associated with the existing candidate assets.
6. Inspected candidate container/declared dimensions where repository evidence makes that directly reviewable.
7. Compared candidate Git blob SHAs to detect exact-content duplicates.
8. Kept CURRENT approval semantics from the master-art spec: repository existence or historical “formal” wording is not sufficient to establish `FORMAL`.

## 3. Result summary

| Check | Result |
| --- | --- |
| Active species IDs | 238 exactly (`m001`-`m238`) |
| Missing IDs in audit inventory | 0 |
| Duplicate IDs in audit inventory | 0 |
| `FORMAL` | 0 |
| `CANDIDATE` | 20 |
| `PLACEHOLDER` | 218 |
| Candidate species reviewable now | 20 (`m001`-`m020`) |
| Species genuinely missing a per-ID art asset | 218 (`m021`-`m238`) |
| Per-ID candidate files present | 30 files |
| Off-path per-ID candidate files found | 0 |
| Exact-content duplicate candidate blobs | 0 |
| Active `m239` row/file required | No; explicitly excluded |

This exactly matches the CURRENT canonical state counts. Therefore `design/current/monster-asset-manifest.json` is not changed by W-213.

## 4. Repository asset inventory

### 4.1 `m001`-`m010`

Each species has both:

- `public/monsters/mNNN.webp`
- `public/monsters/mNNN.svg`

CURRENT state remains `CANDIDATE`.

The CURRENT manifest prefers the WebP for review. Historical `public/monsters/formal-v1-001-010.json` declares the ten WebP files as 128x128. A direct header spot-check of `m001.webp` also resolves to 128x128. The later SVG replacements are 96x96 SVG wrappers containing embedded WebP data.

Historical files/commits call these assets “formal”, “temporary-formal”, “approved”, or “generated formal art”. Those labels predate the CURRENT approval contract. No CURRENT explicit approval record that satisfies the master-art spec was found, so none is promoted to `FORMAL`.

### 4.2 `m011`-`m020`

Each species has one per-ID SVG:

- `public/monsters/m011.svg` through `public/monsters/m020.svg`

CURRENT state remains `CANDIDATE`.

The historical PR that introduced the set says the images were user-approved as provisional formal art and explicitly notes they could later be replaced with 512px WebP assets. Under the CURRENT contract that historical statement is evidence only, not a CURRENT approval record.

Dimensions observable from the committed SVG roots:

| Range | Wrapper |
| --- | --- |
| `m011`-`m015` | SVG 96x96, embedded WebP |
| `m016`-`m020` | SVG 64x64, embedded WebP |

The heterogeneous candidate resolution is a review consideration, not a basis for automatic rejection or promotion.

### 4.3 `m021`-`m238`

No per-ID art asset exists in the repository for this range.

CURRENT state remains `PLACEHOLDER`.

These 218 species are genuinely blocked on art availability for visual approval. They are not treated as candidates merely because legacy sprite sheets exist.

## 5. Approval evidence audit

### CURRENT approval

No candidate has a CURRENT explicit approval record satisfying `design/current/09-MONSTER-MASTER-ART-SPEC.md`.

Result:

- `m001`-`m020`: remain `CANDIDATE`
- `m021`-`m238`: remain `PLACEHOLDER`
- `FORMAL`: remains 0

### Historical evidence retained, not promoted

Relevant historical evidence exists:

- `.formal-v1-marker.txt`
- `formal-v1-001-010.json`
- `docs/formal-image-status-001-010.md`
- `docs/monster-production-status.md`
- historical commits for `m001`-`m010`
- historical PR #30 for `m011`-`m020`

This evidence is useful for review provenance but does not override CURRENT state semantics.

## 6. Missing, broken, duplicate, and path-drift inventory

### Missing

- `m021`-`m238`: 218 per-ID assets missing.
- `m001`-`m020`: no missing preferred/current candidate path.

### Broken/path drift

No broken repository path was found for any CURRENT candidate path, and no off-path per-ID `mNNN` asset was found elsewhere in the complete recursive tree.

The SVG candidates are self-contained data-URI wrappers, so they do not depend on a separate relative image path.

Binary visual decoding of every WebP payload is not independently re-performed by this repository-structure audit. The ten WebP files are present/non-empty and their historical manifest declares a consistent 128x128 set; `m001.webp` was header spot-checked as 128x128.

### Exact duplicates

No two per-ID candidate files share the same Git blob SHA, so no exact-content duplicate exists among the 30 candidate files.

A separate legacy sprite sheet is duplicated byte-for-byte at:

- `public/monsters/manaevo-monsters-v1.webp`
- `src/game/manaevo-monsters-v1.webp`

That sheet is excluded from canonical per-species asset selection by the master-art spec. W-213 records the duplication but does not modify or delete either legacy file because runtime/source ownership is outside this work item.

## 7. Family continuity reviewability

The three CURRENT description shards provide the normalized per-species review context for all active `m001`-`m238`, including family/stage plus motif, family concept, personality arc/context, and visual description fields.

This separates review readiness from asset availability:

- `m001`-`m020`: `REVIEWABLE_NOW_WITH_CANONICAL_CONTEXT`
  - candidate asset exists
  - canonical family/motif/personality context exists
  - next action is CURRENT visual approval review
- `m021`-`m238`: `CONTEXT_READY_ASSET_MISSING`
  - canonical family/motif/personality context exists
  - visual continuity cannot be judged until a per-ID art asset exists

No new art direction or family interpretation is introduced by this audit.

## 8. Actionable queue

1. Review `m001`-`m020` against the CURRENT description/motif/personality/family continuity context.
2. If a candidate is accepted, record explicit CURRENT approval evidence before changing its state to `FORMAL`.
3. Supply per-ID art for `m021`-`m238` in a work item that owns image production; W-213 does not generate art.
4. Treat the 128/96/64 resolution variation as a visual-review input; do not infer approval state from resolution alone.
5. Handle the duplicated legacy sprite-sheet copy only under an owning runtime/cleanup work item if cleanup is desired.

## 9. W-213 acceptance

- [x] `m001` through `m238` are inventoried exactly once.
- [x] No active ID gap is present.
- [x] No duplicate active ID is present.
- [x] `m239` is excluded.
- [x] File existence/path is classified for every active species.
- [x] `FORMAL` / `CANDIDATE` / `PLACEHOLDER` state is reported without historical-label promotion.
- [x] Approval evidence is separated into CURRENT vs historical evidence.
- [x] Dimensions/format are recorded where inspectable.
- [x] Reviewable-now candidates are separated from genuinely missing art.
- [x] Missing/broken/path-drift/exact-duplicate findings are recorded.
- [x] Family continuity reviewability is explicitly classified.
- [x] No runtime/source/test file is changed.
- [x] No image is generated or regenerated.
- [x] No new specification is introduced.
