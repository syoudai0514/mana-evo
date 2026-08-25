# ManaEvo CURRENT — Monster Master / Art Contract

Status: **CURRENT CANONICAL (W-109)**  
Date: 2026-08-25  
Scope: active monster identity/master slice and monster-art resolution contract only

## 1. Authority and scope

This document is the CURRENT contract for monster identity and monster art. It does not make runtime behavior authoritative and it does not replace the exact baseline archive.

Evidence precedence used here:

1. `design/rebuild/DECISION-LOG.md` D-003 and D-014
2. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
3. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/monster-visual-briefs.json`
4. exact baseline `design/baseline/FINAL-CORRECTED/source/11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
5. Phase 1.5 audit `design/rebuild/audit/monster-world-progression-audit.md`
6. current data/runtime only as derived evidence, never as authority

The Phase 1.5 comparison found zero mismatches for No.001-238 between the recovered baseline family data and the current master identity slice for No/name, area, type, family/stage information and evolution method/parameter. That permits the existing data-master rows to be used as a derived implementation source for the fields explicitly certified below; it does not certify unrelated runtime tuning fields.

## 2. Active registry

### 2.1 Active scope

- Active game/master/dex/image-required scope: **No.001-238**.
- Active family count: **83 families**.
- `No.239 シラユキヒメ` remains preserved in baseline/reference only.
- No.239 must not be added to the active species registry, active dex target, encounter target, or required image set.
- The baseline remains 84 families / 239 species and must not be edited to hide No.239.

This is D-003 and is not a tuning choice.

### 2.2 Stable species identity

The stable species identifier is:

```text
speciesId = "m" + zero-padded 3-digit monster number
```

Examples: `m001`, `m010`, `m142`, `m238`.

Rules:

- `speciesId` is immutable for a species.
- Display-name changes must never change `speciesId`.
- Asset file names and saved references must prefer `speciesId`, not Japanese display names.
- Active IDs are exactly the contiguous set `m001` through `m238`.
- `m239` is reference-only and excluded from the active set.
- Monster number is identity, not an array index that may be renumbered after removals.

The current data-master convention (`design/13*-monster-growth-*.csv`) already uses this `mNNN` convention and is consistent with the stable-ID rule in the baseline Graphics Bible.

## 3. Canonical monster-master slice

W-109 canonicalizes only the identity/art-facing slice below. Battle numbers, encounter tuning, world placement overlay, evolution acquisition rules and special-form behavior remain owned by their respective CURRENT documents.

Each active species must expose at least:

| Field | Canonical meaning | Authority |
|---|---|---|
| `no` | stable No.001-238 | D-003 + baseline order |
| `speciesId` | stable `mNNN` ID | stable-ID contract |
| `name` | current official display name | baseline Graphics Bible / exact baseline data |
| `familyNo` | stable family number within active baseline-derived registry | exact baseline family order |
| `stage` | 1-based position inside its family | exact baseline `families.mjs` |
| `maxStage` | number of stages in that family | exact baseline `families.mjs` |
| `type` | family/species type ID | exact baseline `families.mjs` |
| `sourceArea` | original source `area` 1-4 | exact baseline `families.mjs` |
| `previousSpeciesId` | previous stage or null | derived from exact family order |
| `nextSpeciesId` | next evolution species or null | exact family order/evolution link |

### 3.1 Family/stage derivation

- Preserve family membership and stage order from exact baseline `families.mjs`.
- No species may be moved to a different family merely to fit current runtime behavior.
- `familyNo` is stable once assigned from the recovered family order.
- `stage` is the member position within that family, starting at 1.
- `maxStage` is the number of members in that family.
- `previousSpeciesId` is null for stage 1; otherwise it is the immediately preceding family member.
- `nextSpeciesId` is null for a completed/final member; otherwise it is the evolution target recorded by the baseline family chain.

W-109 does **not** redefine level thresholds, item semantics or special-form mechanics. Those belong to W-104. The identity link (`from species -> next species`) is canonical here; the evolution method/condition is canonicalized in W-104.

### 3.2 Source area vs adventure placement

`sourceArea` is the baseline production/master `area` and must be retained. It is not the same thing as the later adventure placement layer (`adventureArea` / zone). W-105 owns adventure placement. Do not overwrite `sourceArea` to match runtime encounter placement.

## 4. Description and visual-data provenance

Do not create 238 descriptions from scratch.

The exact baseline `scripts/monster-visual-briefs.json` is the visual-description source for the active species. It provides:

- family `motif`
- family `concept`
- `personalityArc`
- palette guidance
- `graphicCore`
- per-stage `description`
- per-stage `expressionAndPose`
- per-stage `silhouette`

The exact baseline Graphics Bible is the naming/art-rule cross-check. W-110, W-111 and W-112 materialize the species description shards; those shards must extract this provenance faithfully rather than inventing replacement lore.

If a displayed name and a stable ID ever disagree, the stable ID owns identity and the current official display name owns presentation. Renaming must not break save or asset references.

## 5. Canonical art rules

The following are mandatory for any candidate seeking FORMAL status.

### Audience

- Primary audience: ages 5-8.
- Preserve monster coolness, mystery and a small amount of safe scariness; do not make every species uniformly cute.
- Dark/ghost/poison designs must not become grotesque enough to cause young-child rejection.

### Composition

- Primarily 2-4 heads tall.
- Front to slight three-quarter view.
- Full body must be visible.
- Background must be transparent or white.
- At small in-game size, face, type impression and the signature body feature must remain readable.
- Do not place text inside the monster image.

### Evolution continuity

- Stage 1: rounder/younger; a weakness or immaturity should be visible.
- Stage 2: visibly develop the family signature feature and read as an intermediate growth state.
- Final stage: strength/role should read from silhouette without excessive decoration.
- Within one family, preserve at least **two** of: face identity, color identity, signature body feature.

### Expression

- Do not give every species the same sparkling friendly eyes.
- Expression/pose must reflect the baseline personality: wary, competitive, mischievous, sleepy, quietly confident, etc.

### Originality

- Do not imitate the silhouette, face, markings, color arrangement, props or pose of a specific existing-IP character.
- Do not mass-reuse one ear/horn/eye/limb template across unrelated families.
- Different families must remain distinguishable by silhouette.

### Production identity

- Per-species asset names use stable IDs such as `m001.webp`.
- Display-name changes do not rename the stable asset key.
- Giga/Burst assets are separate variants and must preserve base-species identifying features; W-104 owns special-form target/effect rules.

## 6. Asset state model

A repository file existing is **not** proof that the art is approved.

Exactly these semantic states are used by `monster-asset-manifest.json`:

### `FORMAL`

A per-species image that has:

1. been reviewed against this CURRENT art contract and the baseline visual brief for that species/family;
2. passed identity/family-continuity/originality/readability checks; and
3. explicit approval evidence recorded in the manifest/review record.

A FORMAL asset is eligible for normal child-facing runtime resolution.

### `CANDIDATE`

A repository image exists but CURRENT approval evidence has not yet been recorded.

- A previous label such as `formal`, `formal-v1` or `temporary-formal` does not automatically upgrade it.
- Candidate files are useful for audit/review and may be shown in explicit art-review tooling.
- Candidate art must not be silently represented as CURRENT-approved FORMAL art.

### `PLACEHOLDER`

No CURRENT-approved per-species asset is available.

- Runtime uses the canonical placeholder presentation.
- Placeholder must clearly be non-final and must not masquerade as a different species.
- Placeholder identity is still keyed by the correct `speciesId`, type/stage/name metadata.

## 7. MonsterArt resolution contract

All child-facing monster rendering must converge on one manifest-driven resolver. Screen-specific path guessing is prohibited.

Conceptual API:

```text
resolveMonsterArt(speciesId, mode = "runtime") -> {
  state,
  src,
  speciesId,
  isFormal
}
```

Resolution rules for normal runtime:

1. Look up `speciesId` in `design/current/monster-asset-manifest.json` or its generated runtime equivalent.
2. If the entry is `FORMAL`, has approval evidence, and the formal asset exists, return that formal asset.
3. Otherwise return the canonical placeholder for that `speciesId`.
4. Never promote a `CANDIDATE` because an image request happened to succeed.
5. Never infer approval from number ranges such as `no <= 20`.
6. Never prefer `.svg` or `.webp` by hard-coded range. The manifest chooses the approved path.
7. Art-review tooling may explicitly request candidate preview; normal gameplay may not silently do so.
8. Missing/broken FORMAL assets fail safely to placeholder and must be surfaced as an asset-integrity defect.

The generated runtime equivalent must preserve the manifest state/evidence semantics; it may not collapse `FORMAL` and `CANDIDATE` into one `exists=true` flag.

## 8. Current repository inventory (evidence, not approval)

Inventory on base `rebuild/canonical-governance`, path `public/monsters/`:

| IDs | Detected files | Repository label/evidence | CURRENT state |
|---|---|---|---|
| m001-m010 | per-ID `.webp` and `.svg` | `formal-v1-001-010.json` says `temporary-formal`; marker says visual-QA release | `CANDIDATE / PENDING_AUDIT` |
| m011-m020 | per-ID `.svg` only | no CURRENT approval record detected | `CANDIDATE / PENDING_AUDIT` |
| m021-m238 | no per-ID asset detected | none | `PLACEHOLDER` |

Therefore the W-109 manifest starts with:

- FORMAL: **0**
- CANDIDATE: **20**
- PLACEHOLDER: **218**
- active entries total: **238**

This classification deliberately does not erase the historical `temporary-formal` tag for m001-m010; it records that tag as evidence while requiring the D-014 audit before CURRENT FORMAL promotion.

Legacy sprite sheets such as `src/game/manaevo-monsters-v1.webp`, `src/game/manaevo-monsters-v3.webp`, and the copied `public/monsters/manaevo-monsters-v1.webp` are not one-per-stable-ID canonical assets and are excluded from per-ID FORMAL status.

## 9. Current runtime delta (documented, not implemented here)

Current `src/game/PlaceholderMonster.jsx` uses path/range heuristics:

- for `No.001-020` it tries `/monsters/{speciesId}.svg` first;
- only then does it try `officialImageUrl` (`/monsters/{speciesId}.webp`);
- for missing art it falls back to generated placeholder UI.

That behavior is implementation evidence only. It conflicts with the canonical manifest-driven resolver because it can select an unapproved candidate and because it prefers SVG by number range. A later implementation work item must replace this heuristic with the contract in section 7. W-109 does not edit `src/**`.

## 10. Asset-manifest schema

`design/current/monster-asset-manifest.json` contains exactly one object for each active stable ID m001-m238.

Per-entry fields in W-109 inventory:

- `no`: zero-padded monster number
- `speciesId`: stable ID
- `state`: `FORMAL | CANDIDATE | PLACEHOLDER`
- `approval`: current approval state
- `formalAsset`: approved runtime asset path, null until FORMAL
- `candidateAsset`: preferred review candidate path, null when none detected
- `repositoryAssets`: detected per-ID files
- `repositoryTag`: historical repository tag such as `temporary-formal-v1`, if any

A later art-audit promotion changes a species to FORMAL only when it records both the approved asset and explicit approval evidence. File copy alone is insufficient.

## 11. Validation / Acceptance

W-109 is acceptable only if all of the following remain true:

- active IDs are exactly m001-m238;
- active species count is 238;
- active family count is 83;
- m239 is absent from active manifest and preserved in baseline/reference;
- stable IDs do not depend on display names;
- family/stage/type/sourceArea/evolution-link provenance points to exact baseline, not runtime guesses;
- visual descriptions point to exact baseline visual briefs;
- art rules match D-014 / baseline Graphics Bible;
- every active ID has exactly one manifest row/object;
- no image is marked FORMAL/APPROVED solely because a file exists;
- current asset inventory is recorded without modifying/regenerating images;
- normal MonsterArt resolution is manifest-driven and uses only approved FORMAL assets, otherwise placeholder;
- no `src/**`, `tests/**`, baseline source, or another Work Item output is modified.

## 12. Non-blocking follow-up

No new product decision is required by W-109. The unresolved work is **asset review**, not specification invention: audit each current candidate against its exact family/stage brief, formalize passing assets, regenerate only failed/missing assets in later art work. Until that happens, the manifest correctly keeps unapproved images as CANDIDATE and missing images as PLACEHOLDER.
