# ManaEvo CURRENT — Monster Master / Art Contract

Status: **CURRENT CANONICAL CONTRACT**  
Date: 2026-08-31  
Origin: W-109 canonicalization; updated after 238-species FINAL ART CLOSEOUT  
Scope: active monster identity/master slice, per-ID monster-art contract, asset state and runtime resolution

## 1. Authority

This document follows rebuild precedence and does not make runtime authoritative.

1. explicit approved product-owner decisions recorded through rebuild governance;
2. `design/rebuild/DECISION-LOG.md` D-003 / D-014 and later approved decisions;
3. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`;
4. exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/monster-visual-briefs.json`;
5. exact baseline `design/baseline/FINAL-CORRECTED/source/11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`;
6. approved CURRENT normalization/materialization under `design/current/`;
7. current data/runtime only as derived implementation/release evidence.

Phase 1.5 recorded broad agreement for No.001-238 between recovered baseline family data and the current master identity slice. W-114 identified one name-normalization exception that must not be hidden by that summary: exact baseline family F081 / No.236 is `ホシラディア`, while later derived CSV data contains `ソラリオン` without approval evidence. The exact-baseline name remains CURRENT unless explicitly changed by a higher-authority decision.

Art closeout and FORMAL release evidence can prove which binary is approved; they do not independently redefine species identity, family, stage, name or motif.

## 2. Active registry and stable IDs

- Active game/master/dex/image-required scope is **No.001-238 / 83 families**.
- `No.239 シラユキヒメ` is preserved in immutable baseline/reference only and is excluded from active registry, active dex, encounters and required-image scope.
- Historical baseline remains 84 families / 239 species.

Stable species IDs are `m` + zero-padded three-digit number: `m001` ... `m238`.

Rules:

- `speciesId` is immutable and independent of display name.
- Display-name changes never change `speciesId`, save references or asset keys.
- Per-ID runtime asset names use stable IDs such as `m001.webp`.
- Active IDs are exactly the contiguous set `m001` through `m238`; `m239` is reference-only.
- Monster number is identity, not an array index to be renumbered after removal.

### 2.1 m236 canonical-name guard

- Stable ID / No.: `m236` / No.236
- **CURRENT official display name: `ホシラディア`**
- Exact-baseline source: family F081 in `scripts/families.mjs` and matching Graphics Bible / visual brief material.
- Later `design/13d-monster-growth-area4-part2.csv` value `ソラリオン` has no approved-change evidence and is treated as derived-data drift, not a canonical rename.
- Do not rename `m236`, its save references or art key because of that CSV drift.

### 2.2 m235 identity guard

Final art closeout exposed a high-risk ambiguity around `m235`. CURRENT identity is:

- species: `m235`;
- family: F080;
- name: `ユグドラシア`;
- type: grass / `くさ`;
- motif/concept: `世界樹`;
- stage: 1 of 1;
- no evolution.

**m235 is the world tree itself.**

Historical/current reference imagery that includes a small foreground creature must not be interpreted as proof that the foreground creature is m235. A future redesign must preserve the world-tree identity and must not animalize the species into deer/fox/wolf/quadruped/dragon-like anatomy simply to increase generic monster readability.

The accepted design direction is one coherent **monsterized world-tree organism**, with no scenery plate, foreground companion or rectangular collage.

## 3. Canonical monster-master slice

This contract owns identity/art-facing data. Battle tuning, encounter placement, evolution conditions/items and special-form mechanics remain owned by their domain CURRENT documents.

Each active species has the following canonical identity fields:

| Field | Meaning | Authority |
|---|---|---|
| `no` | stable No.001-238 | D-003 + baseline order |
| `speciesId` | stable `mNNN` ID | stable-ID contract |
| `name` | current official display name | baseline Graphics Bible / exact baseline data + approved changes |
| `familyNo` | family number from recovered family order | exact baseline `families.mjs` |
| `stage` | 1-based family stage | exact baseline `families.mjs` |
| `maxStage` | family stage count | exact baseline `families.mjs` |
| `type` | canonical type ID | exact baseline `families.mjs` |
| `sourceArea` | original source `area` 1-4 | exact baseline `families.mjs` |
| `previousSpeciesId` | previous family stage or null | derived from exact family order |
| `nextSpeciesId` | next evolution species or null | exact family chain/evolution link |

Family membership and stage order must not be changed to fit runtime behavior or a generated image. `sourceArea` is the baseline production/master area and is separate from Adventure placement/zone owned by W-105. Evolution identity links are separate from level/item/held-item semantics owned by W-104.

## 4. Description and visual-data provenance

Do not invent replacement canonical descriptions merely because an image is being repaired/regenerated. The exact baseline `scripts/monster-visual-briefs.json` remains provenance for:

- family `motif`;
- family `concept`;
- `personalityArc`;
- palette guidance;
- `graphicCore`;
- per-stage `description`;
- per-stage `expressionAndPose`;
- per-stage `silhouette`.

The normalized CURRENT description shards are:

- `monsters/descriptions-001-080.json`;
- `monsters/descriptions-081-160.json`;
- `monsters/descriptions-161-238.json`.

The Graphics Bible remains the naming/art-rule cross-check. Historical reference art can inform continuity but cannot override CURRENT identity.

## 5. Canonical art rules

A new/replacement binary can become CURRENT FORMAL only if it satisfies identity/style/technical review and receives explicit approval evidence.

### Audience and expression

- Primary audience: ages 5-8.
- Preserve coolness, mystery and safe scariness; do not make every species uniformly cute.
- Dark/ghost/poison designs must not become grotesque enough for young-child rejection.
- Do not give every species the same sparkling friendly eyes; expression/pose follows canonical personality.
- Non-animal concepts are not required to adopt animal ears, muzzle, paws or quadruped anatomy.

### Composition and final per-ID binary contract

Current release contract for `public/monsters/mNNN.webp`:

- exact **512×512** decoded dimensions;
- RIFF/WEBP binary;
- **true transparent background / actual alpha**;
- full intended creature visible with safe crop;
- defining/signature features remain inside the canvas;
- no accidental edge crop/contact caused by normalization;
- face/type impression/signature feature readable at small game size;
- no text/name/number/type badge/UI baked into the image;
- no checkerboard baked into pixels;
- no white/colored rectangular background plate;
- no scenery, landscape, floor, diorama or frame baked into the image;
- no unrelated second creature/companion;
- no unrelated detached fragment;
- no rectangular cut-and-paste/collage boundary.

Early production guidance that allowed clean white background was a calibration-stage allowance. It is **not** the final per-ID runtime contract after the 2026-08-31 closeout.

For newly generated/normalized art, fully transparent pixels should have RGB normalized to zero where the export path supports exact preservation, and the **decoded final WebP** should be checked. Hidden-RGB cleanliness does not replace visual QA.

### Visual QA and mechanical QA are separate

Visual QA must confirm:

- correct species identity/body plan;
- one intended creature;
- coherent complete silhouette;
- family continuity when applicable;
- no scenery/background/collage/foreign companion;
- no unrelated detached fragment;
- small-size readability.

Mechanical QA must confirm from the actual final binary:

- RIFF/WEBP;
- exact 512×512;
- actual alpha;
- byte count;
- raw SHA-256;
- safe edge/crop behavior;
- package manifest consistency when a package is used.

A technically transparent collage is a FAIL. A visually good 1024×1024 image is also a FAIL for the current contract.

### Evolution continuity

- Stage 1: younger/rounder or otherwise visibly immature where the family concept supports it.
- Stage 2: signature feature develops and still reads as an intermediate state.
- Final stage: strength/role reads from silhouette without relying only on decoration/VFX.
- A family preserves at least two stable identity signals such as face, color/material identity or signature body feature.
- Single-stage species must not be forced into an invented progression.

### Originality and production

- Do not imitate silhouette, face, markings, color arrangement, props or pose of a specific existing-IP character.
- Do not mass-reuse one ear/horn/eye/limb template across unrelated families.
- Different families remain distinguishable by silhouette/body plan/material/signature feature.
- Stable asset key follows species ID, not display-name changes.
- Giga/Burst assets are separate variants and preserve base-species identifying features; W-104 owns mechanics/targets.

More detailed visual rules are maintained in `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`.

## 6. Asset state model

Repository file existence is **not** approval evidence.

### `FORMAL`

A per-species image reviewed against CURRENT identity/art contract, accepted for normal child-facing runtime resolution, and carrying explicit CURRENT approval evidence. `formalAsset` and its approved SHA identify the exact official binary.

### `CANDIDATE`

A repository image exists but CURRENT approval evidence for that binary is pending. Historical labels such as `formal`, `formal-v1` or `temporary-formal` do not automatically upgrade it. Candidate art may be previewed only through explicit review tooling/mode.

### `PLACEHOLDER`

No CURRENT-approved per-species asset is available. Runtime must not silently substitute an unapproved candidate and call it official.

### Replacement rule

Existing species FORMAL status is **not blanket approval for a new binary**. A FORMAL binary replacement must:

- fresh-read the current FORMAL SHA;
- validate the actual replacement binary;
- preserve/archive previous binary/history as required;
- append provenance;
- receive explicit approval evidence for the replacement;
- synchronize runtime revision data;
- prove no unexpected species changed.

If incoming bytes already match the intended current FORMAL bytes, do not create duplicate replacement/provenance/history events.

## 7. MonsterArt runtime resolution contract

All child-facing rendering converges on one manifest/generated-master-driven resolver rather than screen-specific path guessing.

Current runtime implementation is `src/game/monsterArt.js`, backed by `RUNTIME_MONSTER_ASSETS` from the generated runtime master.

Conceptual contract:

```text
resolveMonsterArt(speciesId, mode = "runtime") -> {
  state,
  src,
  speciesId,
  isFormal,
  isCandidatePreview,
  integrityIssue
}
```

Runtime rules:

1. Reject inactive/unknown species such as m239 as `MISSING`.
2. For `FORMAL`, return `formalAsset` only when the path is present, approval evidence exists and generated integrity data does not report it missing.
3. A broken FORMAL asset fails closed with `formal-asset-integrity`; it is not silently reclassified as approved candidate.
4. `CANDIDATE` may expose `candidateAsset` only in explicit review mode.
5. Normal gameplay never promotes CANDIDATE because a URL loads successfully.
6. Do not infer approval from number ranges or file extensions.
7. Generated runtime data must preserve FORMAL/CANDIDATE/PLACEHOLDER state and approval evidence.

The old W-109 observation about `PlaceholderMonster.jsx` selecting early `.svg` assets by number range was an implementation delta at that time. It is **historical**, not the current runtime contract.

## 8. Current repository/release inventory

### Current state — 2026-08-31 closeout

Authoritative active manifest totals after PR #128:

- FORMAL: **238**
- CANDIDATE: **0**
- PLACEHOLDER: **0**
- Active asset objects: **238**
- Excluded: `m239`

Final closeout:

- PR #128: `FINAL CLOSEOUT: last 7 registration and 238 FORMAL`;
- main merge commit: `bc78609097fc1f486d26d6703f127fdaf235188d`;
- tests at closeout: 290/290 PASS;
- Vite production build: PASS;
- production: `https://mana-evo.vercel.app/`;
- production revision output: `https://mana-evo.vercel.app/monster-asset-revisions.json`.

The test count 290 is release evidence for that snapshot, not a permanent fixed count.

### Historical W-109 inventory snapshot

At initial W-109 canonicalization, repository evidence was:

- FORMAL 0;
- CANDIDATE 20;
- PLACEHOLDER 218.

That snapshot is preserved here only to explain the original state-model work. **It must not be used as current progress.**

Later in closeout the project also briefly had FORMAL 198 / CANDIDATE 4 / PLACEHOLDER 36. Image existence/QA did not itself formalize those remaining 40. Final release explicitly promoted the approved chosen assets and reached 238/0/0.

## 9. Final-closeout identity/technical lessons now part of the contract

### m160

A handoff package contained a visually intended candidate at actual 1024×1024. Registration stopped before mutation because exact 512×512 is mandatory. Final `m160` was normalized to a 512×512 FORMAL replacement.

Rule: validate **actual exported/received bytes**, not preview/source-canvas assumptions.

### m220 / m221

Unrelated detached right-side fragments were removed while preserving body/VFX/thin edges.

Rule: connected-component analysis may identify suspects, but visual intent review decides deletion.

### m229

A purple rectangular background plate could not be safely separated without damaging the intended character/VFX, so repair was stopped and the species was regenerated.

Rule: do not keep escalating destructive masks when repair requires semantic guessing.

### m235

Incorrect animalized and collage-like attempts were rejected despite some being visually attractive or technically transparent.

Rule: canonical identity and coherent one-creature silhouette outrank generic aesthetics and alpha-only checks.

### Approved heuristic exceptions

`m042`, `m057`, `m136`, `m202`, `m213` were explicitly accepted as closeout normalization exceptions. A future heuristic flag alone does not justify rewriting them; require a new actual defect or explicit design decision.

## 10. Asset-manifest and revision contracts

`design/current/monster-asset-manifest.json` contains one per-species object for every active stable ID `m001-m238`. The JSON key is `speciesId`; each value records at least `state` and, when FORMAL, the exact formal asset/SHA and approval evidence.

`public/monster-asset-revisions.json` is the runtime/PWA revision output and must stay synchronized with FORMAL binary revisions.

For full-roster release, completion requires both:

- manifest FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0;
- 238 matching FORMAL revision entries.

A successful GitHub merge is not enough if production still serves old revision data.

## 11. Production/release gate

Whole-roster or targeted FORMAL art changes use distinct gates:

`GENERATED/REPAIRED`
→ `VISUAL QA`
→ `ART READY`
→ `REGISTERED/REPLACED`
→ `FORMAL`
→ `MAIN`
→ `DEPLOYED`
→ `LIVE VERIFIED`

Do not use “done” to collapse these states.

For full-roster release, verify:

1. active scope exactly 238, m239 excluded;
2. intended binaries passed visual and actual-binary QA;
3. FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0;
4. revision file contains 238 intended FORMAL entries;
5. current tests pass;
6. production build passes;
7. intended commit is in main;
8. production deploy succeeds;
9. live revision endpoint serves intended states/revisions.

For targeted maintenance, counts may remain 238/0/0; therefore compare old/new target SHA and unexpected changed species, not counts alone.

## 12. Handoff/binary evidence contract

GitHub-native handoff is preferred when it can preserve exact bytes. See `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`.

If ZIP is intentionally used, include an internal `manifest.json` with at least:

- exact species scope;
- `speciesId`;
- raw bytes;
- raw SHA-256;
- width/height;
- WEBP format;
- repair/regeneration/normalization policy/source.

Receiver must independently reopen, decode and recompute the actual binaries before repository mutation. A manifest claim is not proof.

Raw-file SHA-256 and Git blob SHA are separate hash domains and must not be compared directly.

## 13. Validation / Acceptance

This CURRENT contract is satisfied only when:

- active IDs are exactly m001-m238 and count = 238;
- active family count = 83;
- m239 is absent from active assets and retained in reference/baseline only;
- stable IDs do not depend on display names;
- m236 CURRENT official name remains `ホシラディア` absent approved rename;
- m235 remains F080 `ユグドラシア` / world-tree identity absent approved redesign;
- family/stage/type/sourceArea/evolution-link provenance follows canonical evidence;
- visual descriptions remain grounded in baseline/CURRENT provenance;
- per-ID release image contract is exact 512×512 transparent WebP with coherent single-species silhouette and no baked scenery/collage/foreign fragment;
- every active ID has exactly one manifest asset object;
- no image becomes FORMAL solely because a file exists;
- runtime resolver exposes normal child-facing assets only through FORMAL + approval/integrity rules;
- replacement history/provenance is auditable;
- release/runtime revisions are synchronized;
- m239 cannot resolve as an active runtime monster.

## 14. Current operations / follow-up

Large-scale 238-species production is closed. Future work is targeted maintenance only unless a new explicit product decision reopens global production.

Use:

- `docs/monster-production-status.md` — current status;
- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md` — final closeout handoff;
- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md` — replacement procedure;
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md` — practical failure lessons;
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md` — detailed visual language;
- `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md` — exact-byte transport;
- `design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md` — candidate/formal tooling semantics;
- `design/rebuild/HANDOFF-TEMPLATE.md` — worker evidence format.
