# ManaEvo CURRENT — Monster Master / Art Contract

Status: **CURRENT CANONICAL CANDIDATE (W-109; commander review required)**  
Date: 2026-08-25  
Scope: active monster identity/master slice and monster-art resolution contract only

## 1. Authority

This document follows the rebuild precedence and does not make runtime authoritative.

1. `design/rebuild/DECISION-LOG.md` D-003 / D-014
2. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
3. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/monster-visual-briefs.json`
4. exact baseline `design/baseline/FINAL-CORRECTED/source/11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
5. Phase 1.5 `design/rebuild/audit/monster-world-progression-audit.md`
6. current data/runtime only as derived implementation evidence

Phase 1.5 recorded broad agreement for No.001-238 between recovered baseline family data and the current master identity slice for No/name, source area, type, family/stage information and evolution method/parameter. W-114 identified one name-normalization exception that must not be hidden by that summary: exact baseline family F081 / No.236 is `ホシラディア`, while later derived CSV data contains `ソラリオン` without approval evidence. The exact baseline name therefore remains CURRENT. Current data-master rows may be used as a derived implementation source only after such canonical normalization; they are not authority for unrelated runtime tuning or unapproved name changes.

## 2. Active registry and stable IDs

- Active game/master/dex/image-required scope is **No.001-238 / 83 families**.
- `No.239 シラユキヒメ` is preserved in the immutable baseline/reference only and is excluded from the active registry, active dex, encounters and required-image scope.
- The historical baseline remains 84 families / 239 species.

Stable species IDs are `m` + zero-padded three-digit number: `m001` ... `m238`.

Rules:

- `speciesId` is immutable and independent of display name.
- Display-name changes never change `speciesId`, save references or asset keys.
- Asset names prefer stable IDs such as `m001.webp`.
- Active IDs are exactly the contiguous set `m001` through `m238`; `m239` is reference-only.
- Monster number is identity, not an array index to be renumbered after removal.

### 2.1 m236 canonical-name guard

- Stable ID / No.: `m236` / No.236
- **CURRENT official display name: `ホシラディア`**
- Exact-baseline source: family F081 in `scripts/families.mjs` and the matching Graphics Bible / visual brief material.
- Later `design/13d-monster-growth-area4-part2.csv` value `ソラリオン` has no approved-change evidence and is treated as derived-data drift, not as a canonical rename.
- Do not rename `m236`, its save references or art key because of that CSV drift.

## 3. Canonical monster-master slice

W-109 owns only identity/art-facing data. Battle tuning, encounter placement, evolution conditions/items and special-form mechanics remain owned by their domain CURRENT documents.

Each active species has the following canonical identity fields:

| Field | Meaning | Authority |
|---|---|---|
| `no` | stable No.001-238 | D-003 + baseline order |
| `speciesId` | stable `mNNN` ID | stable-ID contract |
| `name` | current official display name | baseline Graphics Bible / exact baseline data |
| `familyNo` | family number from recovered family order | exact baseline `families.mjs` |
| `stage` | 1-based family stage | exact baseline `families.mjs` |
| `maxStage` | family stage count | exact baseline `families.mjs` |
| `type` | canonical type ID | exact baseline `families.mjs` |
| `sourceArea` | original source `area` 1-4 | exact baseline `families.mjs` |
| `previousSpeciesId` | previous family stage or null | derived from exact family order |
| `nextSpeciesId` | next evolution species or null | exact family chain/evolution link |

Family membership and stage order must not be changed to fit current runtime behavior. `sourceArea` is the baseline production/master area and is separate from the later Adventure placement/zone layer owned by W-105. W-109 fixes evolution identity links only; level/item/held-item semantics are owned by W-104.

## 4. Description and visual-data provenance

Do not invent 238 replacement descriptions. The exact baseline `scripts/monster-visual-briefs.json` is the source for:

- family `motif`
- family `concept`
- `personalityArc`
- palette guidance
- `graphicCore`
- per-stage `description`
- per-stage `expressionAndPose`
- per-stage `silhouette`

The Graphics Bible is the naming/art-rule cross-check. W-110/W-111/W-112 may materialize species description shards, but must extract this baseline provenance faithfully.

## 5. Canonical art rules

A candidate can become FORMAL only if it satisfies these baseline/D-014 rules.

### Audience and expression

- Primary audience: ages 5-8.
- Preserve coolness, mystery and safe scariness; do not make every species uniformly cute.
- Dark/ghost/poison designs must not become grotesque enough for young-child rejection.
- Do not give every species the same sparkling friendly eyes; expression/pose follows baseline personality.

### Composition

- Primarily 2-4 heads tall.
- Front to slight three-quarter view.
- Full body visible.
- Transparent or white background.
- Face, type impression and signature feature remain readable at small in-game size.
- No text inside monster images.

### Evolution continuity

- Stage 1: younger/rounder; weakness or immaturity is visible.
- Stage 2: signature feature develops and still reads as an intermediate state.
- Final stage: strength/role reads from silhouette without excessive decoration.
- A family preserves at least two of: face identity, color identity, signature body feature.

### Originality and production

- Do not imitate the silhouette, face, markings, color arrangement, props or pose of a specific existing-IP character.
- Do not mass-reuse one ear/horn/eye/limb template across unrelated families.
- Different families remain distinguishable by silhouette.
- Per-species asset names use stable IDs; display-name changes do not rename the asset key.
- Giga/Burst assets are separate variants and preserve base-species identifying features; W-104 owns their mechanics/targets.

## 6. Asset state model

Repository file existence is **not** approval evidence.

### `FORMAL`

A per-species image that has been reviewed against this CURRENT contract and the exact baseline brief, passed identity/family-continuity/originality/readability checks, and has explicit CURRENT approval evidence recorded. Only FORMAL art is eligible for normal child-facing runtime resolution.

### `CANDIDATE`

A repository image exists but CURRENT approval evidence is pending. Historical labels such as `formal`, `formal-v1` or `temporary-formal` do not automatically upgrade it. Candidate art may be previewed in explicit art-review tooling but must not be silently represented as CURRENT-approved art in normal gameplay.

### `PLACEHOLDER`

No CURRENT-approved per-species asset is available. Runtime uses the canonical non-final placeholder while preserving the correct species ID/name/type/stage identity.

## 7. One MonsterArt resolution contract

All child-facing rendering must converge on one manifest-driven resolver rather than screen-specific path guessing.

```text
resolveMonsterArt(speciesId, mode = "runtime") -> {
  state,
  src,
  speciesId,
  isFormal
}
```

Normal-runtime rules:

1. Resolve `speciesId` through `design/current/monster-asset-manifest.json` or a generated runtime equivalent.
2. Return a species asset only when its state is `FORMAL`, approval evidence is present and the approved asset exists.
3. Otherwise return the canonical placeholder for that same `speciesId`.
4. Never promote `CANDIDATE` because an image request succeeds.
5. Never infer approval from number ranges such as `no <= 20`.
6. Never hard-code `.svg`/`.webp` preference by number range; the approved manifest entry chooses the path.
7. Art-review tooling may explicitly request candidate preview; normal gameplay may not silently do so.
8. Missing/broken FORMAL assets fail safely to placeholder and are surfaced as asset-integrity defects.

A generated runtime manifest must preserve FORMAL/CANDIDATE/PLACEHOLDER and approval evidence; it may not collapse them into `exists=true`.

## 8. Current repository inventory (evidence, not approval)

Inventory on base `rebuild/canonical-governance`, under `public/monsters/`:

| IDs | Detected per-ID assets | Historical evidence | CURRENT state |
|---|---|---|---|
| m001-m010 | `.webp` + `.svg` | `temporary-formal` / visual-QA marker | `CANDIDATE / PENDING_AUDIT` |
| m011-m020 | `.svg` | no CURRENT approval record detected | `CANDIDATE / PENDING_AUDIT` |
| m021-m238 | none | none | `PLACEHOLDER` |

W-109 inventory totals:

- FORMAL: **0**
- CANDIDATE: **20**
- PLACEHOLDER: **218**
- Active asset objects: **238**

The historical `temporary-formal` tag for m001-m010 is retained as evidence but does not bypass the D-014 audit. Legacy sprite sheets (`manaevo-monsters-v1.webp`, `manaevo-monsters-v3.webp`) are not one-per-stable-ID canonical assets and do not create FORMAL status.

## 9. Current runtime delta — documented only

Current `src/game/PlaceholderMonster.jsx` is implementation evidence, not authority. It tries `/monsters/{speciesId}.svg` for No.001-020 before `officialImageUrl`, then falls back to generated placeholder UI. This conflicts with the canonical resolver because it selects by number/path heuristic and can display an unapproved candidate. A later implementation work item must replace that heuristic; W-109 does not edit `src/**`.

## 10. Asset-manifest schema

`design/current/monster-asset-manifest.json` contains an `assets` object with **one per-species object for every active stable ID m001-m238**. The JSON key itself is `speciesId`; every value records at least `state`.

Current repository evidence that is identical over contiguous ranges may be stored once in `repositoryInventory` / `candidatePreference`. This keeps the inventory auditable without duplicating path/tag metadata 238 times while still preserving 238 individual asset-state objects.

When a species becomes FORMAL, its per-ID asset object must add an explicit `formalAsset` and `approvalEvidence`. A file copy or successful load alone is insufficient. Additional audit metadata may be added later without changing the stable ID.

## 11. Validation / Acceptance

W-109 is acceptable only if:

- active IDs are exactly m001-m238 and count = 238;
- active family count = 83;
- m239 is absent from active assets and retained in baseline/reference;
- stable IDs do not depend on display names;
- **m236 CURRENT official name is `ホシラディア`; unapproved later `ソラリオン` data is drift and does not override it;**
- family/stage/type/sourceArea/evolution-link provenance comes from exact baseline, not runtime guesses;
- visual descriptions point to exact baseline visual briefs;
- art rules match D-014 / Graphics Bible;
- every active ID has exactly one manifest asset object;
- no image is marked FORMAL/APPROVED solely because a file exists;
- current asset inventory is recorded without modifying/regenerating images;
- normal MonsterArt resolution uses only approved FORMAL art, otherwise placeholder;
- no `src/**`, `tests/**`, baseline source or another Work Item output is modified.

## 12. Follow-up

No new product decision is required by W-109. Remaining work is asset review, not specification invention: audit each candidate against its exact family/stage brief, formalize passing assets, and regenerate only failed/missing assets in later art work. Until then, unapproved images remain CANDIDATE and missing images remain PLACEHOLDER.
