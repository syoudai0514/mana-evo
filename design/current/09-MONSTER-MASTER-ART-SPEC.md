# ManaEvo CURRENT — Monster Master / Art Contract

Status: **CURRENT — W-109 + D-016 production-visibility override**  
Date: 2026-08-29  
Scope: active monster identity/master slice and monster-art resolution contract

> **重要:** W-109のidentity / visual provenance / FORMAL approval rulesは維持する。後続D-016により「normal runtimeはFORMALのみ」という旧visibility制約だけが置換され、validated CANDIDATEをexplicit allowlistでproduction表示できる。candidate visibilityはFORMAL approvalではない。末尾§13を必ず併読する。

## 1. Authority

This document follows the rebuild precedence and does not make runtime authoritative.

1. `design/rebuild/DECISION-LOG.md` D-003 / D-014 / D-016
2. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
3. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/monster-visual-briefs.json`
4. exact baseline `design/baseline/FINAL-CORRECTED/source/11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
5. Phase 1.5 `design/rebuild/audit/monster-world-progression-audit.md`
6. current data/runtime only as derived implementation evidence

Phase 1.5 recorded broad agreement for No.001-238 between recovered baseline family data and the current master identity slice for No/name, source area, type, family/stage information and evolution method/parameter. W-114 identified one name-normalization exception: exact baseline family F081 / No.236 is `ホシラディア`, while later derived CSV data contains `ソラリオン` without approval evidence. The exact baseline name therefore remains CURRENT.

## 2. Active registry and stable IDs

- Active game/master/dex/image-required scope is **No.001-238 / 83 families**.
- `No.239 シラユキヒメ` is preserved in immutable baseline/reference only and excluded from active registry/dex/encounters/required-image scope.
- Historical baseline remains 84 families / 239 species.

Stable species IDs are `m001` ... `m238`.

Rules:

- `speciesId` immutable and independent of display name.
- display-name change never changes speciesId/save/asset key.
- asset names prefer stable IDs such as `m001.webp`.
- active IDs exactly contiguous m001-m238; m239 reference-only.
- monster number is identity, not an array index to renumber.

### 2.1 m236 canonical-name guard

- Stable ID / No.: `m236` / No.236
- **CURRENT official display name: `ホシラディア`**
- exact baseline source: F081 in `families.mjs` + Graphics Bible / visual brief.
- later `design/13d-monster-growth-area4-part2.csv` value `ソラリオン` is derived-data drift without approved rename.
- do not rename m236/save/art key because of that CSV.

## 3. Canonical monster-master slice

W-109 owns only identity/art-facing data. Battle tuning, encounter placement, evolution conditions/items and special-form mechanics remain owned by their domain CURRENT documents.

Each active species has canonical identity fields:

| Field | Meaning | Authority |
|---|---|---|
| `no` | stable No.001-238 | D-003 + baseline order |
| `speciesId` | stable `mNNN` ID | stable-ID contract |
| `name` | current official display name | baseline Graphics Bible / exact baseline data |
| `familyNo` | family number | exact baseline `families.mjs` |
| `stage` | 1-based family stage | exact baseline `families.mjs` |
| `maxStage` | family stage count | exact baseline `families.mjs` |
| `type` | canonical type ID | exact baseline `families.mjs` |
| `sourceArea` | original source `area` 1-4 | exact baseline `families.mjs` |
| `previousSpeciesId` | previous family stage or null | derived from exact family order |
| `nextSpeciesId` | next evolution species or null | exact family chain/evolution link |

Family membership/stage order must not be changed to fit runtime. `sourceArea` is separate from Adventure placement/zone layer owned by W-105. W-109 fixes evolution identity links only; level/item/held-item semantics are W-104.

## 4. Description and visual-data provenance

Do not invent 238 replacement descriptions. Exact baseline `monster-visual-briefs.json` is the source for:

- family motif
- family concept
- personalityArc
- palette guidance
- graphicCore
- per-stage description
- per-stage expressionAndPose
- per-stage silhouette

Graphics Bible is naming/art-rule cross-check. W-110/W-111/W-112 CURRENT shards must extract baseline provenance faithfully.

Historical 0822 boards may be used as **visual reference evidence** but do not override CURRENT names/types/family identity.

## 5. Canonical art rules

A candidate can become FORMAL only if it satisfies baseline/D-014 rules.

### Audience and expression

- primary audience ages 5-8
- preserve coolness, mystery and safe scariness; not every species uniformly cute
- dark/ghost/poison not grotesque enough for young-child rejection
- no universal sparkling friendly eyes; expression/pose follows personality

### Composition

- primarily 2-4 heads tall
- front to slight three-quarter view
- full body visible
- transparent or production-safe white during review where allowed
- face/type/signature feature readable small
- no text inside species image

### Evolution continuity

- Stage 1: younger/rounder; immaturity visible
- Stage 2: signature develops and reads intermediate
- final: strength/role reads from silhouette without excessive decoration
- family preserves at least two of face identity, color identity, signature body feature

### Originality and production

- do not imitate silhouette/face/markings/color arrangement/props/pose of a specific existing-IP character
- do not mass-reuse one ear/horn/eye/limb template across unrelated families
- different families distinguishable by silhouette
- stable-ID asset naming
- Giga/Burst assets separate variants preserving base-species identity; W-104 owns mechanics/targets

## 6. Asset state model

Repository file existence is **not** approval evidence.

### `FORMAL`

Reviewed against CURRENT + exact baseline brief, passed identity/family/originality/readability, and has explicit CURRENT approval evidence.

D-016 does **not** weaken FORMAL requirements.

### `CANDIDATE`

A repository candidate revision exists but CURRENT FORMAL approval is pending. Historical `formal`, `formal-v1`, `temporary-formal` labels do not auto-upgrade it.

D-016 allows some CANDIDATE revisions to be production-visible through an explicit allowlist after candidate gate. They remain CANDIDATE.

### `PLACEHOLDER`

No production/formal species art selected for that stable ID; use canonical placeholder while preserving correct identity.

## 7. One MonsterArt resolution contract

All child-facing rendering must converge on one stable-ID resolver rather than screen-specific path guessing.

Conceptually after D-016:

```text
resolveMonsterArt(speciesId) -> {
  speciesId,
  approvalState,        // PLACEHOLDER | CANDIDATE | FORMAL
  productionVisible,
  src,
  isFormal,
  approvalEvidence
}
```

Current rules:

1. FORMAL + valid approval evidence may render.
2. Explicit D-016 production-visible CANDIDATE may render as candidate art.
3. Review-only CANDIDATE does not become production-visible just because a file exists.
4. Otherwise placeholder.
5. Never infer approval/visibility from ID ranges or file extensions.
6. Missing/broken selected asset fails safely.
7. m239 never enters active resolution.

The old W-109 rule “normal gameplay may render only FORMAL” is **superseded only by D-016's explicit production-CANDIDATE exception**. It remains true that arbitrary/review-only candidates may not silently render.

## 8. W-109 repository inventory snapshot — historical approval/inventory baseline

The original W-109 inventory on `rebuild/canonical-governance` was:

| IDs | Detected per-ID assets | Historical evidence | W-109 state |
|---|---|---|---|
| m001-m010 | `.webp` + `.svg` | temporary-formal / visual-QA marker | CANDIDATE / PENDING_AUDIT |
| m011-m020 | `.svg` | no CURRENT approval record | CANDIDATE / PENDING_AUDIT |
| m021-m238 | none | none | PLACEHOLDER |

Original manifest counts:

- FORMAL: 0
- CANDIDATE: 20
- PLACEHOLDER: 218
- active asset objects: 238

**These counts are not a live count of all later Phase 4 candidate binaries.** See §13.2.

Legacy sprite sheets are not one-per-stable-ID canonical assets and do not create FORMAL status.

## 9. Runtime delta — historical note

The original W-109 runtime delta about `PlaceholderMonster.jsx` and No.001-020 path heuristics was a 2026-08-25 implementation observation. Later D-016 rollout and candidate mapping changed runtime visibility behavior.

The enduring rule is not “use this specific old resolver”; it is:

- stable ID ownership
- explicit production eligibility
- no path/range-based approval inference
- safe fallback
- no automatic FORMAL promotion

## 10. Asset-manifest schema and W-302 semantics

`design/current/monster-asset-manifest.json` contains one asset object for every active stable ID m001-m238 and is used by W-302 tooling as the W-109 approval-state / initial-inventory companion.

Important Phase 4 behavior:

- `candidate-ingestion.mjs` intentionally **does not rewrite this manifest merely because a new candidate WebP is ingested**;
- therefore its original `FORMAL0 / CANDIDATE20 / PLACEHOLDER218` counts are not today's live candidate-binary inventory;
- candidate existence is evidenced by candidate ingestion/provenance/history, actual `public/monsters/mNNN.webp`, and Work Item/PR validation;
- production visibility is a separate D-016 allowlist/registry concern;
- FORMAL promotion remains approval-evidence gated and may update FORMAL state/asset evidence through the promotion workflow.

Do not "synchronize" the manifest by marking every generated/production-visible image FORMAL. Do not silently redesign W-302 queue/test semantics just to make the old counts look like a live inventory counter.

When a species becomes FORMAL, its approval-state representation must carry explicit formal asset + approval evidence; file copy or successful load alone is insufficient.

## 11. Validation / Acceptance

W-109 + D-016 alignment requires:

- active IDs exactly m001-m238, count238
- family count83
- m239 absent active, retained reference
- stable IDs independent of names
- m236 official `ホシラディア`
- identity provenance exact baseline, not runtime guesses
- visual descriptions exact baseline briefs
- art rules D-014 / Graphics Bible
- every active ID represented in approval-state manifest
- file existence never implies FORMAL
- production-visible CANDIDATE never implies FORMAL
- production eligibility explicit per species
- no production state inferred merely from open PR inventory
- missing/broken assets fail safely

## 12. Follow-up

Remaining work is asset review/repair/integration, not specification invention:

- audit candidates against exact family/stage brief
- freeze/pass good candidates
- normalize/repair only where safe
- regenerate only failed/missing designs
- cross-attribute QA before FORMAL promotion
- FORMAL only with explicit approval evidence

---

## 13. 2026-08-29 D-016 production visibility addendum

### 13.1 Three separate questions

The system must never collapse:

1. **candidate binary exists?**
2. **candidate is production-visible?**
3. **species is FORMAL-approved?**

These are separate evidence streams.

### 13.2 Current production state on `main`

PR #98 merged an explicit production CANDIDATE overlay covering **184 species** from:

- W-303 grass
- W-304 fire
- W-305 water
- W-307 normal
- W-308 flying
- W-310 ground
- W-311 rock
- W-312 steel
- W-314 fight
- W-315 fairy
- W-316 psychic
- W-317 ice
- W-318 ghost
- W-320 dragon

PR #98 explicitly excluded:

- W-306 electric
- W-309 bug
- W-313 poison
- W-319 dark
- m239

Current main's explicit runtime overlay is `src/game/playtestCandidateArt.js`.

Open PRs containing more art do **not** become production state until merged.

`m019` and `m020` still have historical SVG candidate files in main but are not in PR #98's 184 production overlay; they demonstrate why repository candidate existence and production visibility must remain separate.

Current FORMAL count remains **0** until explicit promotion approval evidence exists.

### 13.3 Candidate gate before production visibility

Production-visible CANDIDATE must have real candidate evidence appropriate to its Work Item, such as:

- actual binary
- correct species ownership
- family/stage visual QA
- candidate-safe WebP
- exact scope validation
- handoff/refetch integrity
- checksum/provenance where applicable
- explicit production allowlist/registry inclusion

`generation packet` or review text without an actual image is not candidate production completion.

### 13.4 Maintainability requirement

Future species replacement must remain one-species-addressable:

- stable `public/monsters/mNNN.webp`
- auditable candidate revision/provenance
- old revision recoverable where applicable
- no unrelated species edits required for one replacement
- candidate index/allowlist should be generated/validated from a single source rather than hand-maintained in parallel
- generator may infer validated candidate **availability**, but never FORMAL approval

### 13.5 Cross-attribute / FORMAL gates

Production CANDIDATE rollout does not eliminate:

- 238-scope cross-attribute visual QA
- duplicate/template detection
- family continuity
- small-size readability
- alpha/background/crop checks
- IP-similarity review
- explicit FORMAL approval/promotion

Successful production use is not automatic FORMAL evidence.
