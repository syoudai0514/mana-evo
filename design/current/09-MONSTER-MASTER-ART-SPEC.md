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

## 3. Identity / art-facing master fields

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

## 6. Art states and three separate questions

The art system must never collapse these three questions into one:

1. **Does a candidate binary exist in the repository / candidate history?**
2. **Is that candidate explicitly visible in current production?**
3. **Has that species been explicitly approved as FORMAL?**

They are different states/evidence streams.

### PLACEHOLDER

No eligible production/formal species art is selected for this ID. Runtime uses the canonical placeholder while keeping correct species identity.

### CANDIDATE

A candidate revision exists but has not been promoted to FORMAL.

A candidate can be:

- review-only / repository candidate;
- production-visible candidate under D-016.

Neither is FORMAL.

### FORMAL

Requires explicit CURRENT approval evidence for that species after identity/family/originality/readability review.

FORMAL is not inferred from:

- filename
- branch/PR name
- successful image load
- production visibility
- historical `formal-v1` labels
- candidate QA PASS alone

## 7. W-302 state model: manifest, provenance and production overlay

The existing Phase 4 tooling deliberately separates state responsibilities.

### 7.1 `monster-asset-manifest.json`

`design/current/monster-asset-manifest.json` is the **W-109 approval-state / initial inventory companion used by W-302 tooling and FORMAL promotion guards**.

Important current behavior:

- candidate ingestion **does not rewrite this manifest just because a new CANDIDATE WebP is ingested**;
- its historical `FORMAL / CANDIDATE / PLACEHOLDER` counts therefore must **not** be interpreted as a live count of every later generated candidate binary;
- it remains useful for stable active scope and approval semantics;
- explicit FORMAL promotion may update the per-ID FORMAL state / formal asset / approval evidence under the promotion workflow.

Therefore the old manifest count `FORMAL 0 / CANDIDATE 20 / PLACEHOLDER 218` is **not evidence that only 20 candidate binaries exist today**. It describes the pre-Phase-4 W-109 approval/inventory snapshot unless later promotion explicitly changes it.

Do **not** "fix" this drift by blindly marking every ingested candidate FORMAL or by mutating manifest semantics without also redesigning the W-302 queue/tests/tooling.

### 7.2 Candidate provenance / binary evidence

Actual later candidate revisions are evidenced by the relevant:

- candidate-ingestion output;
- per-species candidate provenance/history where present;
- exact `public/monsters/mNNN.webp` binary;
- Work Item / PR artifact evidence;
- checksum/refetch validation.

This evidence answers "candidate exists"; it still does not answer "FORMAL approved".

### 7.3 Production visibility

D-016 production visibility is a third layer.

Current main uses the explicit production candidate overlay in `src/game/playtestCandidateArt.js`.

That allowlist answers "this CANDIDATE may appear in normal production gameplay" without changing it to FORMAL.

Long term, this allowlist should be generated/validated from a single candidate registry/provenance source so that one-species replacement does not require manually maintaining parallel lists. A generator must validate real bytes and exact IDs, and must never infer FORMAL approval.

## 8. Progressive production rollout — D-016

FORMAL completion of all 238 species is not required before useful art appears in production.

A species may become production-visible as CANDIDATE only when the relevant candidate-production gate has real evidence, including as applicable:

- actual candidate binary
- correct species ownership
- family/stage visual QA
- candidate-safe WebP
- exact scope validation
- binary handoff/refetch integrity
- provenance/checksum
- explicit production allowlist inclusion

Production candidate visibility must be explicit; never infer it from "a file exists" or an ID range.

## 9. Current production art state

### Production-visible CANDIDATE overlay

Current `main` contains the PR #98 explicit overlay covering **184 species** from:

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

Those exclusions remain **production facts** until a later candidate integration is actually merged into `main`.

Open integration/review PRs are not production state merely because they contain more images.

### Review-only legacy candidates

`m019` and `m020` still have historical per-ID SVG candidate files in main, but they are not part of PR #98's 184-species production overlay.

### FORMAL

Current FORMAL count remains `0` until explicit formal-approval/promotion evidence is recorded.

## 10. Runtime resolver contract

All child-facing monster rendering must converge on one stable-ID resolver or generated equivalent.

Conceptual result:

```text
resolveMonsterArt(speciesId) -> {
  speciesId,
  approvalState,         // PLACEHOLDER | CANDIDATE | FORMAL
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
5. Missing/broken assets fail safely.
6. Never infer approval/visibility from number ranges or file extensions.
7. `m239` never enters active resolution.

Current `src/game/playtestCandidateArt.js` is an implementation layer for production visibility, not a replacement for approval semantics.

## 11. Candidate replacement / maintainability

Future species image replacement must remain one-species-addressable.

Required properties:

- stable path `public/monsters/mNNN.webp`
- provenance/checksum per candidate revision
- previous candidate revision recoverable/auditable
- replacing one species does not require editing unrelated species data
- generated candidate index/allowlist validates actual bytes before exposing an asset
- no automatic FORMAL promotion

## 12. Phase 4 final gates

Candidate production and production visibility do not eliminate later quality gates.

### Cross-attribute QA

Before broad FORMAL promotion, review across active species for:

- duplicate silhouettes
- type-internal template repetition
- family continuity
- stage readability
- small-size readability
- background/crop/alpha issues
- existing-IP similarity concerns

### FORMAL promotion

FORMAL promotion requires explicit approval evidence.

Promotion must update the approval-state source expected by the promotion workflow, including:

- per-ID FORMAL state
- formal asset path/revision
- approval evidence
- generated runtime state if the final resolver requires it

No worker may silently promote all production-visible candidates simply because they have been used successfully in playtest/production.

## 13. Acceptance

A conforming art system verifies:

- active scope exactly m001〜m238 / 83 families;
- m239 excluded;
- m236 name guard preserved;
- exact visual brief provenance used;
- family continuity/originality/style rules preserved;
- file existence ≠ FORMAL;
- candidate ingestion ≠ FORMAL;
- production-visible CANDIDATE ≠ FORMAL;
- W-109 manifest snapshot is not misread as live candidate-binary inventory;
- candidate existence and production visibility are tracked by their actual evidence streams;
- current main production overlay is exactly the merged allowlist, not open-PR inventory;
- broken/missing assets fail safely;
- per-species replacement remains stable-ID based;
- FORMAL promotion requires explicit approval evidence.
