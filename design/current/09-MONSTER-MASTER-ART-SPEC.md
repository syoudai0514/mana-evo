# ManaEvo CURRENT — Monster Master / Art Contract

Status: **CURRENT**  
Updated: 2026-08-29  
Owner: active monster identity / visual provenance / art-state semantics / production art resolution

## 1. Authority

Apply `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md` first.

Key decisions:

- D-003 — active scope m001〜m238 / 83 families; m239 reference-only
- D-014 — exact baseline visual briefs and family continuity are art authority
- D-016 — validated CANDIDATE art may be progressively visible in production without becoming FORMAL

Source provenance:

- `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/monster-visual-briefs.json`
- `design/baseline/FINAL-CORRECTED/source/11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
- `design/current/monsters/descriptions-*.json`

Runtime/file existence is evidence only and must not invent approval.

## 2. Active registry / stable identity

- active scope: exactly `m001`〜`m238`
- family count: 83
- `m239 / No.239 シラユキヒメ`: baseline/reference only
- stable species ID is `m` + zero-padded number
- display-name changes never change speciesId/save/asset key
- monster number is identity, not a renumberable array index

### m236 guard

CURRENT official name remains `ホシラディア`.
The later derived `ソラリオン` value has no approval evidence and must not rename `m236`.

## 3. Identity/art-facing master fields

Each active species has canonical identity fields including:

- `no`
- `speciesId`
- `name`
- `familyNo`
- `stage`
- `maxStage`
- `type`
- `sourceArea`
- previous/next family stage links

Adventure placement, battle tuning and evolution-method mechanics are owned by their own CURRENT domains and must not rewrite this identity slice.

## 4. Visual-description provenance

Do not start art production by inventing a new creature description.

For every family/stage, use the rescued baseline visual data:

- motif
- family concept
- personality arc
- palette guidance
- graphic core
- stage description
- expression / pose
- silhouette

The three CURRENT description shards materialize this data for all active `m001`〜`m238`.

Historical 0822 boards are **visual reference evidence**, not authority over CURRENT identity/names/types.

## 5. Global art rules

### Audience

- primary audience 5〜8
- not every monster must be uniformly cute
- cool / mysterious / child-safe scary is allowed
- no gore / body horror

### Composition

- primarily 2〜4 heads tall, family-specific exceptions allowed
- front to slight 3/4
- full body
- no crop
- transparent preferred; production-safe white acceptable during review where explicitly allowed
- no baked text/UI labels in final species assets
- face / type impression / signature feature readable at small size

### Family continuity

A family preserves at least two strong continuity signals, such as:

- face identity
- palette identity
- signature body feature
- material / surface motif
- structural motif

Stage progression must read as:

- Stage 1: younger / incomplete / lighter mass
- Stage 2: signature develops
- final: role/strength reads from body and silhouette, not ornament spam alone

### Anti-template / originality

- no specific existing-IP imitation
- no repeated unrelated ear/horn/eye/limb template
- no type represented only by recolor/aura
- no universal sparkling-eye face
- no universal glossy-plastic material
- unrelated families must remain distinguishable by silhouette and mass

## 6. Art states

File existence and production visibility are separate from FORMAL approval.

### PLACEHOLDER

No repository candidate eligible for the current production/review path.
Runtime uses the canonical placeholder while keeping correct identity.

### CANDIDATE

A per-species repository image exists and has not been promoted to FORMAL.

Candidate may be in one of two visibility situations:

1. **review-only candidate** — repository image exists, but is not in the explicit production allowlist;
2. **production-visible candidate** — D-016 gate passed and the exact species is explicitly included in the production candidate allowlist.

Neither situation is FORMAL.

### FORMAL

Requires explicit CURRENT approval evidence for that species after identity/family/originality/readability review.

FORMAL is not inferred from:

- filename
- branch/PR name
- successful image load
- production visibility
- historical `formal-v1` label
- candidate QA PASS alone

## 7. Progressive production rollout — D-016

FORMAL completion of all 238 species is **not** required before useful art can appear in production.

A species may become production-visible as CANDIDATE only when the relevant candidate-production gate has real evidence, including as applicable:

- actual generated/approved-for-candidate binary
- correct species ownership
- family/stage visual QA
- candidate-safe WebP
- exact scope validation
- binary handoff/refetch integrity
- provenance/checksum
- explicit production allowlist inclusion

Production candidate visibility must be explicit; never infer it from "a file exists" or an ID range.

## 8. Current production art state

### Production-visible CANDIDATE overlay

Current `main` contains an explicit production overlay from PR #98 covering **184 species** from:

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

Explicit PR #98 exclusions:

- W-306 electric
- W-309 bug
- W-313 poison
- W-319 dark
- m239

Those exclusions remain production facts until a later candidate integration is actually merged into `main`.

Open integration/review PRs are not production state merely because they contain more images.

### Existing review-only legacy candidates

`m019` and `m020` still have historical per-ID SVG candidate files in main, but they are not part of the PR #98 184-species production overlay.

Therefore CURRENT state must distinguish:

- repository candidate inventory
- production-visible candidate allowlist
- FORMAL approval

rather than using one count for all three concepts.

### FORMAL

Current FORMAL count remains `0` until explicit W-322-style approval/promotion evidence is recorded.

## 9. Runtime resolver contract

All child-facing monster rendering must converge on one stable-ID resolver or generated equivalent.

Conceptual result:

```text
resolveMonsterArt(speciesId) -> {
  speciesId,
  state,                 // PLACEHOLDER | CANDIDATE | FORMAL
  productionVisible,
  src,
  isFormal,
  approvalEvidence
}
```

Runtime rules:

1. FORMAL with valid approval evidence may render.
2. Explicit D-016 production-visible CANDIDATE may render as candidate art.
3. Review-only CANDIDATE must not become production-visible just because a file exists.
4. Otherwise use placeholder.
5. Missing/broken candidate/formal assets fail safely.
6. Never infer state/visibility from number ranges or file extensions.
7. `m239` never enters active resolution.

`src/game/playtestCandidateArt.js` currently carries the explicit production overlay. This is implementation evidence; long-term it should be generated from validated candidate state/provenance rather than manually duplicated.

## 10. Manifest contract

`design/current/monster-asset-manifest.json` must have one active asset object for every `m001`〜`m238` and must not claim that file existence equals approval.

It should distinguish at least:

- repository `state`
- `productionVisible` where applicable
- candidate asset path/evidence
- `formalAsset` only when FORMAL
- `approvalEvidence` only when explicit approval exists

State counts and production-visible counts are different metrics.

A future generator may derive repository candidate inventory and production visibility from checked-in binaries + provenance + explicit allowlist, but it must **never auto-generate FORMAL approval**.

## 11. Candidate replacement / maintainability

Future species image replacement must remain one-species-addressable.

Required properties:

- stable path `public/monsters/mNNN.webp`
- provenance/checksum per candidate revision
- previous candidate can be archived/referenced
- replacing one species must not require editing a large hand-maintained unrelated mapping
- generated candidate index/allowlist should validate actual bytes before exposing an asset

This supports continuing art repair without turning runtime image selection into manual drift.

## 12. Phase 4 final gates

Candidate production and production visibility do not eliminate later quality gates.

### Cross-attribute QA

Before broad FORMAL promotion, review across all active species for:

- duplicate silhouettes
- type-internal template repetition
- family continuity
- stage readability
- small-size readability
- background/crop/alpha issues
- existing-IP similarity concerns

### FORMAL promotion

FORMAL promotion requires explicit approval evidence.

Promotion must update:

- per-ID manifest state
- formal asset path/revision
- approval evidence
- runtime generated state if applicable

No worker may silently promote all candidates because production has been using them successfully.

## 13. Acceptance

A conforming art system verifies:

- active scope exactly m001〜m238 / 83 families;
- m239 excluded;
- m236 name guard preserved;
- exact visual brief provenance is used;
- family continuity/originality/style rules preserved;
- candidate file existence ≠ FORMAL;
- production-visible CANDIDATE ≠ FORMAL;
- production visibility is explicit per species;
- current main production overlay is exactly the merged allowlist, not open-PR inventory;
- broken/missing assets fail safely;
- per-species replacement remains stable-ID based;
- FORMAL promotion requires explicit approval evidence.
