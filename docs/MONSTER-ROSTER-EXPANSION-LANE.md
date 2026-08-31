# ManaEvo Monster Roster Expansion Lane

Status: **REVIEW-READY DESIGN / NOT YET AN ACTIVE ROSTER EXPANSION**  
Date: 2026-08-31

## 1. Purpose

The current production roster is `m001`–`m238`, with `m239` explicitly excluded. If the product later needs more monsters, expansion must be easy for the user without pretending that “adding a picture” is the whole job.

The desired user experience is still ChatGPT-first:

```text
User: モンスターをもう1つ3段進化で増やしたい。水タイプで。
  ↓
CURRENT AUTO-READ
  ↓
2〜3 FAMILY CONCEPTS
  ↓
USER SELECTS
  ↓
3-stage art + metadata proposal
  ↓
USER SELECTS / APPROVES
  ↓
ROSTER EXPANSION PR
  ↓
CI / MAIN / PRODUCTION / LIVE VERIFY
```

The user should not manually allocate IDs, edit CSV/JSON, calculate family numbers, or reconcile art/runtime/manifest counts.

## 2. Important boundary

**Existing FORMAL replacement and new roster expansion are different lanes.**

`formal-replacement.mjs` must refuse unknown IDs. New IDs are never smuggled through FAST LANE.

Why: adding a new active monster changes more than art. It can affect identity metadata, growth/balance master, evolution transitions, adventure placement, runtime generation, save compatibility, dex counts, art manifest/revisions, tests and production expectations.

## 3. m239 policy

Current `m239` is an explicitly excluded historical/reference ID. The expansion default is:

- do not silently reclaim `m239`;
- keep it reserved/excluded;
- append new active IDs after all currently active/reserved IDs;
- with the current baseline, the next three-stage family is therefore proposed as `m240`, `m241`, `m242`;
- only an explicit product-owner decision may change the m239 reservation policy.

This avoids reinterpreting old artifacts or hidden assumptions attached to m239.

## 4. Dry-run ID/family planner

Before any expansion mutation:

```bash
npm run plan:monster-roster -- --family-size 3
```

`scripts/monster-art/roster-expansion-plan.mjs` is **DRY_RUN_ONLY**. It reads CURRENT manifest and description shards and proposes:

- next append-only species IDs while skipping excluded/reserved IDs;
- next family number;
- resulting species count;
- resulting family count.

It does not edit any master, image, manifest, runtime or production file.

For the current 238 baseline it should propose:

```text
familyNo: 84
speciesIds: m240, m241, m242
resultingSpeciesCount: 241
```

## 5. Why expansion is not enabled by only changing canonicalScope

Several current parts of the repository intentionally encode the 238-species closeout baseline. Known examples include:

- `scripts/generate-runtime-master.mjs` — expects exactly 238 growth rows;
- `scripts/finalize-monster-runtime.mjs` — fixed description shards / `ACTIVE_IDS` / m001-m238 scope checks / runtime metadata counts;
- `scripts/monster-art/candidate-ingestion.mjs` — current active-ID guard is 1–238 and rejects m239;
- `scripts/monster-art/generate-candidate-index.mjs` — current candidate file parser caps IDs at 238;
- `scripts/monster-art/attribute-queue.mjs` — historical Phase-4 queue has 238/83 expectations;
- `scripts/monster-art/visual-audit.mjs` — current audit scope is 238;
- tests across runtime/game/release layers assert the current roster/counts.

Those checks are useful today because they prevent accidental expansion. When expansion is intentional, they must be changed deliberately and consistently — not bypassed one by one until CI turns green.

## 6. Two-PR expansion strategy

To avoid a large mixed PR, the first future expansion should use two stages.

### PR A — Roster Capacity

No new monster is active yet. Refactor fixed roster-size assumptions so CURRENT canonical scope becomes the source of truth where appropriate.

Goals:

- preserve existing m001–m238 behavior byte/semantics-compatible;
- keep m239 reserved;
- make description shard discovery extensible;
- make art/revision/audit tooling read active IDs from CURRENT instead of hard-coded 238 where safe;
- make runtime generators accept an intentionally expanded canonical master while still validating exact identity sets;
- replace “must equal 238” tests with “must equal CURRENT canonical roster” only where the number itself is not a game rule;
- retain explicit regression fixtures proving the original 238 identities were not modified.

This PR should be reviewable as infrastructure only.

### PR B — New Family Content

After capacity is ready, add the selected family as one scoped content unit:

- new species identity/description rows;
- family/stage/type/motif/concept;
- growth/balance data;
- evolution transitions/items when applicable;
- world/adventure placement policy;
- final selected art for every new species;
- provenance/history baseline;
- manifest/revision entries;
- runtime generation;
- tests;
- production/live verification.

Existing 238 species should not be cosmetically or semantically modified in this PR unless explicitly requested.

## 7. ChatGPT family design flow

The default family creation session should be simple.

Example:

```text
User: 水タイプを3体増やしたい
Assistant: CURRENTを読んで、既存familyとの重複を避けたA/B/Cのfamily conceptを提示
User: B
Assistant: stage1/stage2/stage3の画像案をセットで提示
User: 2番のセット
Assistant: metadata + art expansion bundleを作成
```

The generated proposal should automatically include a compact review card:

- proposed IDs/familyNo;
- names;
- type;
- stages;
- motif/family concept;
- evolution method proposal;
- intended area/encounter role;
- visual family continuity;
- existing families intentionally differentiated from.

The user should approve the **family concept and visual set**, not edit low-level master files.

## 8. Expansion bundle concept

A future expansion bundle should carry both content metadata and art, rather than using an art-only replacement bundle.

Conceptual shape:

```text
manifest.json
family.json
m240.webp
m241.webp
m242.webp
```

The receiving tool must validate actual binaries and exact scope just like FAST LANE, plus validate metadata relationships before repository mutation.

Do not implement a permissive “copy these files somewhere” importer. The future importer should fail closed on missing master fields, duplicate IDs/families, invalid evolution targets, stale CURRENT base, or unexpected changes to existing species.

## 9. Expansion acceptance gates

A roster expansion is complete only when all relevant layers agree.

Required categories:

1. **Identity** — exact new IDs, family, stages, names, type and descriptions.
2. **Art** — every new active species has release-ready 512×512 transparent WebP and visual QA.
3. **Master/runtime** — generated runtime contains exactly old active IDs + planned new IDs, excluding reserved IDs.
4. **Evolution** — transitions are valid and cannot point to missing/reserved species.
5. **World/gameplay** — new species have an intentional acquisition/encounter path; no unreachable or accidental early-game placement.
6. **Save compatibility** — existing saves still load and existing stable IDs retain meaning.
7. **Manifest/revisions** — scope/counts/revisions include the new roster exactly.
8. **Regression** — existing species semantic changes = 0 unless explicitly declared.
9. **CI/build** — current full suite/build/E2E green.
10. **Production** — deployed commit matches `main`; live new species revision/images are verified.

## 10. Rollback model for newly added species

A new roster family is more than a visual replacement, so production rollback must not simply delete WebPs.

If a newly added family must be withdrawn after release:

- decide whether IDs remain active-but-unavailable, become reserved, or require a forward content fix;
- preserve save compatibility for any player who may already own/encounter the new IDs;
- do not reuse released IDs for a different species identity;
- prefer a forward corrective release over silently rewriting stable IDs.

Stable species IDs are product data once released.

## 11. What is implemented now vs later

Implemented in the current maintenance-lanes change:

- dry-run append-only ID/family planner;
- explicit m239 reservation handling;
- FAST LANE rejects unknown/new IDs;
- documented two-PR capacity/content expansion procedure;
- tests for ID allocation and stale-scope failure.

Not implemented yet, intentionally:

- changing runtime from 238 to a larger roster;
- an automatic new-family master importer;
- new species content/art;
- m239 reuse.

Those should be implemented only when an actual roster expansion is requested, against the then-current game/master design. Pre-expanding production today would create risk without user value.

## 12. Principle

**Replacement should be fast. Expansion should be structured. Neither should make the user do release bookkeeping.**

Related:

- `docs/MONSTER-ART-FAST-LANE.md`
- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/REPOSITORY-RELEASE-GUARD.md`
- `design/current/monster-asset-manifest.json`
