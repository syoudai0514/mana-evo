# W-217 Monster Art Production / Review Operator Guide

Status: production preparation only  
Branch: `rebuild/w-217-monster-art-production-plan`  
Runtime/image changes in W-217: none

## 1. What this guide is for

A later art worker should be able to take one `batchId` from `W-217-MONSTER-ART-PRODUCTION-QUEUE.json` and start review/production without reconstructing project history.

The queue is family-first. A family is never split into conflicting visual directions merely to make equal-sized batches.

CURRENT authorities for this work are:

- `design/current/09-MONSTER-MASTER-ART-SPEC.md`
- `design/current/monsters/descriptions-001-080.json`
- `design/current/monsters/descriptions-081-160.json`
- `design/current/monsters/descriptions-161-238.json`
- `design/rebuild/asset-audit/W-213-MONSTER-ASSET-AUDIT.md`
- `design/rebuild/asset-audit/W-213-MONSTER-ASSET-INVENTORY.csv`

Do not use runtime labels, historical `formal-v1` wording, or another domain document as a shortcut around the W-109 monster identity/art contract.

## 2. Queue state that must not be changed by preparation

W-213 establishes the exact repository state used here:

| Scope | Count | State now | Work path |
| --- | ---: | --- | --- |
| `m001-m020` | 20 | `CANDIDATE` | review existing candidate |
| `m021-m238` | 218 | `PLACEHOLDER` / per-ID art missing | later new-art production |
| `m239` | 0 active | excluded | none |

W-217 does **not** promote any species to `FORMAL`, generate an image, edit the asset manifest, or change runtime/source/tests.

## 3. Taking one batch

1. Open `W-217-MONSTER-ART-PRODUCTION-QUEUE.json` and select one `batchId` (`B01` through `B12`).
2. Select every `familyAssignments` row with that `batchId`. Do not omit a family member.
3. For each `speciesId`, resolve exactly one row from the three CURRENT normalized description shards.
4. Carry the resolved row into the art/review packet **verbatim**. Required fields are:
   - `no`
   - `speciesId`
   - `name`
   - `familyNo`
   - `stage`
   - `type`
   - `motif`
   - `familyConcept`
   - `personalityArc`
   - `personalityArcContext`
   - `description`
   - `graphicCore`
   - `expressionAndPose`
   - `silhouette`
5. Determine the work path only from W-213 state:
   - `m001-m020`: review the existing candidate; do not silently replace or approve it.
   - `m021-m238`: later worker produces a new candidate because no per-ID asset currently exists.
6. Use target name `public/monsters/mNNN.webp`, where `mNNN` is the stable `speciesId`.
7. Review the entire family together before accepting an individual stage.

This direct `speciesId` lookup is deliberate: it keeps the production queue machine-readable while avoiding a second copied canonical lore/master that could drift from CURRENT.

## 4. Family continuity rule

Where a family has multiple stages, the visual progression must read as one lineage:

- stage 1: younger / rounder / friendly or simple enough for the family concept;
- middle stage: signature feature visibly develops while the earlier identity remains recognizable;
- final stage: strength or role is clear from silhouette without excessive decoration.

Preserve at least two of these across the family:

- face identity;
- color identity;
- signature body feature.

The normalized `motif`, `familyConcept`, `personalityArc`, `graphicCore`, `expressionAndPose`, and `silhouette` fields are constraints, not prompts to invent extra lore.

Two-stage families remain two-stage. Single-stage families remain single-stage; do not manufacture missing stages.

## 5. Special continuity case: F007

`F007 = m019 / m020 / m021` is intentionally all in `B01`.

- `m019-m020`: existing `CANDIDATE` review path.
- `m021`: missing-art production path.

The work paths differ, but the visual direction does not. A later worker must review the two candidates and produce/review `m021` as one family. Do not redesign `m021` independently and then force the existing family to match it.

## 6. Batch plan

| Batch | Families | Species | Count | Candidate review | Missing art |
| --- | --- | --- | ---: | ---: | ---: |
| B01 | F001-F007 | m001-m021 | 21 | 20 | 1 |
| B02 | F008-F014 | m022-m042 | 21 | 0 | 21 |
| B03 | F015-F021 | m043-m063 | 21 | 0 | 21 |
| B04 | F022-F028 | m064-m084 | 21 | 0 | 21 |
| B05 | F029-F035 | m085-m105 | 21 | 0 | 21 |
| B06 | F036-F042 | m106-m124 | 19 | 0 | 19 |
| B07 | F043-F049 | m125-m144 | 20 | 0 | 20 |
| B08 | F050-F056 | m145-m165 | 21 | 0 | 21 |
| B09 | F057-F063 | m166-m186 | 21 | 0 | 21 |
| B10 | F064-F070 | m187-m207 | 21 | 0 | 21 |
| B11 | F071-F077 | m208-m228 | 21 | 0 | 21 |
| B12 | F078-F083 | m229-m238 | 10 | 0 | 10 |
| **Total** | **F001-F083** | **m001-m238** | **238** | **20** | **218** |

This gives 12 independent family-coherent batches, inside the requested practical target of roughly 10-15 batches for parallel production/review.

## 7. Acceptance checklist for every later art batch

Before a produced/reviewed asset can move beyond candidate review, verify all of the following:

- [ ] stable `speciesId` matches the intended monster;
- [ ] displayed/canonical name matches the CURRENT normalized W-109 companion row;
- [ ] no text is baked into the image;
- [ ] transparent or clean white background;
- [ ] full body is visible and signature features are not cropped;
- [ ] face, type impression, and signature feature remain readable at small game size;
- [ ] family continuity is obvious across available stages;
- [ ] stage progression is visually meaningful rather than a recolor-only change;
- [ ] no unrelated family reuses the same defining silhouette/template;
- [ ] no specific existing-IP character is imitated in silhouette, face, markings, color arrangement, props, or pose;
- [ ] target is `public/monsters/mNNN.webp`;
- [ ] target is below 1 MB when later formalized;
- [ ] explicit CURRENT approval evidence exists before changing state to `FORMAL`.

A successful file write or visual load is not approval evidence.

## 8. W-217 validation

The machine-readable queue is constructed with these invariants:

- active species: exactly `m001-m238` = 238;
- active families: exactly F001-F083 = 83;
- each family is assigned to exactly one batch;
- batch species counts sum to 238;
- candidate-review counts sum to 20;
- missing-art counts sum to 218;
- `m239` appears only as an excluded ID, never as a batch member;
- no image path outside `public/monsters/mNNN.webp` is introduced as a future formal target;
- no art state is changed by W-217.

If a later worker finds a CURRENT source conflict, stop that species/family and follow `REBUILD-START-HERE.md` precedence. Do not resolve a product conflict by inventing a new visual fact.
