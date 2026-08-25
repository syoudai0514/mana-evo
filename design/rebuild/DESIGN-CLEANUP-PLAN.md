# ManaEvo Design Folder Cleanup Plan

Date: 2026-08-25  
Work Item: W-113  
Inventory base: `rebuild/canonical-governance` @ `a18209b075ba7338665941d5aed3732b767ffb2e`

## 1. Purpose

This document inventories the complete `design/` tree at the Phase 2 canonicalization base and classifies every file into one of five authority classes:

- `CURRENT_CANONICAL`
- `DATA_MASTER`
- `SUPPORTING_EVIDENCE`
- `HISTORY`
- `OBSOLETE_OR_SUPERSEDED`

It also defines the target folder/index structure and a safe link-migration sequence. This work item **does not move, delete, or rewrite any existing design/baseline file**.

The classification is about authority, not usefulness. Historical review/runtime-completion documents may remain valuable evidence, but they must never outrank product/game/UI canonical documents.

## 2. Authority rule

During rebuild, use this reading order:

1. explicit user decisions;
2. `design/rebuild/DECISION-LOG.md` commander decisions;
3. accepted `design/current/**` canonical documents as they are promoted;
4. validated `DATA_MASTER` files, only within the product rules fixed by canonical documents;
5. `SUPPORTING_EVIDENCE`;
6. `HISTORY`;
7. `OBSOLETE_OR_SUPERSEDED` only for archaeology/regression explanation.

`runtime`, CI success, PR completion, review status, or a filename containing `master` does **not** by itself grant canonical authority.

### Hard guardrails

- `design/19-sol-pr15-runtime-completion.md` is `HISTORY`, not specification authority.
- PR review/fix-resolution documents are `HISTORY`, not specification authority.
- A `DATA_MASTER` may provide IDs, rows, numeric seeds, or mappings, but if it conflicts with a `CURRENT_CANONICAL` product/game/UI rule, the canonical document wins and the master must be corrected.
- `design/baseline/FINAL-CORRECTED/source/**` is immutable historical source and remains `SUPPORTING_EVIDENCE`; it is not automatically current behavior.
- `design/14e-evolution-item-acquisition-master.csv` is explicitly superseded by D-008 because its dedicated-trial acquisition rule conflicts with the restored exploration-based item acquisition.

## 3. Inventory summary

The base commit contains **82 files under `design/`**:

| Class | Count |
|---|---:|
| CURRENT_CANONICAL | 1 |
| DATA_MASTER | 13 |
| SUPPORTING_EVIDENCE | 49 |
| HISTORY | 12 |
| OBSOLETE_OR_SUPERSEDED | 7 |
| **Total** | **82** |

Additionally, repository-root `REBUILD-START-HERE.md` is the current rebuild-governance entry point and is treated as `CURRENT_CANONICAL` governance, but it is outside the 82-file `design/` count.

## 4. Complete classification — current `design/` root

### CURRENT_CANONICAL

None at the old `design/` root. Phase 2 is creating `design/current/**`; the old root must not be mistaken for current canonical simply because some files call themselves “正本”.

### DATA_MASTER

These are structured/operational data sources or tuning masters. They remain subordinate to current canonical rules.

- `design/09-special-forms-master.md`
- `design/10-initial-balance-master.md`
- `design/13a-monster-growth-area1.csv`
- `design/13b-monster-growth-area2-part1.csv`
- `design/13b-monster-growth-area2-part2.csv`
- `design/13c-monster-growth-area3-part1.csv`
- `design/13c-monster-growth-area3-part2.csv`
- `design/13d-monster-growth-area4-part1.csv`
- `design/13d-monster-growth-area4-part2.csv`
- `design/14a-evolution-balance-area1.csv`
- `design/14b-evolution-balance-area2.csv`
- `design/14c-evolution-balance-area3.csv`
- `design/14d-evolution-balance-area4.csv`

Notes:

- `09-special-forms-master.md` contains the concrete 12 Giga / 8 Burst target mapping that D-014/W-104 can consume, but effect semantics still follow canonical rules.
- `10-initial-balance-master.md` is a tuning/master seed. Numeric values may be `TUNING-DEFAULT`; it is not a license to override later product decisions.
- The `13*` and `14a-d` CSVs are derived detailed data. Before final promotion they must be checked against the accepted W-102/W-104/W-105/W-109 canonicals.

### SUPPORTING_EVIDENCE

- `design/07-parent-controls.md`
- `design/12-detailed-balance-design-for-sol-review.md`
- `design/13-monster-growth-master-238.md`
- `design/17-hosting-pwa.md`
- `design/20-world-map-evolution-progression.md`
- `design/21-mockup-ui-visual-system.md`
- `design/22-premium-ui-v4.md`
- `design/DESIGN-SOURCE-METADATA.txt`

These may contain approved ideas or useful derivations, but they are inputs to canonicalization, not final authority. In particular, later UI/world documents must be filtered through D-011/D-013 and the W-105/W-106 canonicals rather than promoted wholesale.

### HISTORY

- `design/08-balance-tuning-policy.md`
- `design/11-battle-character-boss-review.md`
- `design/15-sol-review-validation-report.md`
- `design/16-sol-pr15-full-review.md`
- `design/17-sol-pr15-review-amendment.md`
- `design/18-sol-pr15-fix-resolution.md`
- `design/19-sol-pr15-runtime-completion.md`

These files explain review/runtime history. They must never be linked from the final “current specification” index as normative sources.

### OBSOLETE_OR_SUPERSEDED

- `design/00-README.md`
- `design/01-catch-and-evolution-design.md`
- `design/02-dex-200.md`
- `design/03-screens-catch-and-raise.md`
- `design/06-battle-and-progression-design.md`
- `design/14e-evolution-item-acquisition-master.csv`

Reasons:

- `design/00-README.md` explicitly ranks runtime-completion/history as specification authority, conflicting with D-001 and rebuild governance.
- `design/02-dex-200.md` is structurally obsolete against the confirmed active No.001–238 scope.
- the older catch/screen/battle-progression docs are being replaced by domain canonicals W-102 through W-106 and may contain pre-rebuild assumptions;
- `14e` encodes dedicated evolution-trial first-clear acquisition, superseded by D-008 exploration-based acquisition.

## 5. Complete classification — immutable baseline

All 35 files under `design/baseline/FINAL-CORRECTED/` are `SUPPORTING_EVIDENCE` and must remain at their existing path unchanged.

### Baseline control/provenance files — SUPPORTING_EVIDENCE

- `design/baseline/FINAL-CORRECTED/CURRENT-DESIGN-MISSING.md`
- `design/baseline/FINAL-CORRECTED/MANIFEST.sha256`
- `design/baseline/FINAL-CORRECTED/README.md`

### Exact baseline source — SUPPORTING_EVIDENCE

- `design/baseline/FINAL-CORRECTED/source/00-START-HERE.md`
- `design/baseline/FINAL-CORRECTED/source/00-TERRA-IMPLEMENTATION-REQUEST.md`
- `design/baseline/FINAL-CORRECTED/source/01-catch-and-evolution-design.md`
- `design/baseline/FINAL-CORRECTED/source/02-dex.md`
- `design/baseline/FINAL-CORRECTED/source/03-screens-catch-and-raise.md`
- `design/baseline/FINAL-CORRECTED/source/06-battle-and-progression-design.md`
- `design/baseline/FINAL-CORRECTED/source/07-wild-encounter-and-capture-design.md`
- `design/baseline/FINAL-CORRECTED/source/08-gameplay-state-spec.md`
- `design/baseline/FINAL-CORRECTED/source/09-implementation-traceability.md`
- `design/baseline/FINAL-CORRECTED/source/10-BRAND-AND-REPOSITORY-SPEC.md`
- `design/baseline/FINAL-CORRECTED/source/11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
- `design/baseline/FINAL-CORRECTED/source/12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- `design/baseline/FINAL-CORRECTED/source/13-EXECUTION-FLOW.md`
- `design/baseline/FINAL-CORRECTED/source/99-IMPLEMENTATION-REVIEW-CHECKLIST.md`
- `design/baseline/FINAL-CORRECTED/source/scripts/battle.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/brand.json`
- `design/baseline/FINAL-CORRECTED/source/scripts/build-md.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/capture.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/check2.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/forms.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/gen-battle-md.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/gen-visual-briefs.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/gen-wild-md.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/items.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/monster-name-aliases.json`
- `design/baseline/FINAL-CORRECTED/source/scripts/monster-visual-briefs.json`
- `design/baseline/FINAL-CORRECTED/source/scripts/retune.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/rewards.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/simulate.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/types.mjs`
- `design/baseline/FINAL-CORRECTED/source/scripts/wildEncounter.mjs`

Baseline scripts are classified as evidence rather than live `DATA_MASTER` because this folder is an immutable historical snapshot. Canonicalization may extract values from them, but it must not mutate them or treat them as automatically current.

## 6. Complete classification — `design/rebuild/`

### CURRENT_CANONICAL

- `design/rebuild/DECISION-LOG.md`

This is the current commander decision authority during rebuild. Once all decisions are incorporated into accepted `design/current/**` documents, the commander may later demote it to evidence/history; W-113 does not do that.

### SUPPORTING_EVIDENCE

- `design/rebuild/PHASE-2-COMMANDER-REVIEW.md`
- `design/rebuild/USER-DECISION-EVIDENCE.md`
- `design/rebuild/audit/battle-capture-evolution-audit.md`
- `design/rebuild/audit/learning-ticket-audit.md`
- `design/rebuild/audit/monster-world-progression-audit.md`
- `design/rebuild/audit/ui-architecture-audit.md`

These explain why commander decisions were made and provide traceability, but the final product rules must be stated in `design/current/**` rather than requiring implementers to reconstruct them from audits.

### HISTORY

- `design/rebuild/HANDOFF-TEMPLATE.md`
- `design/rebuild/PHASE-1-COMMANDER-REVIEW.md`
- `design/rebuild/PHASE-2-WORK-ITEMS.md`
- `design/rebuild/WORK-QUEUE.md`
- `design/rebuild/handoffs/W-001-FINAL-CORRECTED-baseline-rescue.md`

These are operational/rebuild history. Some remain actively useful while Phase 2 is running, but they are not product specification authority.

### OBSOLETE_OR_SUPERSEDED

- `design/rebuild/canonical-draft/UI-SCREEN-CONTRACT.md`

PR #39’s draft is explicitly subject to D-013 corrections and W-106 promotion, so it must not be consumed as final UI canonical.

## 7. Supplemental governance outside `design/`

- `REBUILD-START-HERE.md` — `CURRENT_CANONICAL` governance entry point during rebuild.

It defines rebuild precedence and the prohibition on treating runtime as authority. The eventual product-facing design index should point users to `design/current/00-START-HERE.md`, while rebuild contributors may still begin from repository-root `REBUILD-START-HERE.md` until Phase 2 closes.

## 8. Target final folder/index structure

No physical move is performed by W-113. The target structure after commander review is:

```text
design/
├── 00-README.md                         # thin redirect/index only
├── current/                             # normative product/game/UI canonicals
│   ├── 00-START-HERE.md
│   ├── 01-LEARNING-REWARDS.md
│   ├── 02-BATTLE-TICKETS-BALANCE.md
│   ├── 03-CAPTURE-DUPLICATES.md
│   ├── 04-EVOLUTION-ITEMS-SPECIAL-FORMS.md
│   ├── 05-WORLD-PROGRESSION.md
│   ├── 06-UI-SCREEN-CONTRACT.md
│   ├── 07-SAVE-PROFILES-PARENT-PWA.md
│   ├── 08-ACCEPTANCE-TEST-CONTRACT.md
│   ├── 09-MONSTER-MASTER-ART-SPEC.md
│   ├── monster-asset-manifest.json
│   └── monsters/
│       ├── descriptions-001-080.json
│       ├── descriptions-081-160.json
│       └── descriptions-161-238.json
├── master/                              # validated structured/tuning data subordinate to current/
│   ├── special-forms/
│   ├── balance/
│   ├── monsters/
│   └── evolution/
├── evidence/                            # traceability, not normative behavior
│   ├── user-decisions/
│   ├── audits/
│   └── later-design/
├── history/                             # PR/review/runtime/rebuild chronology
│   ├── reviews/
│   ├── runtime/
│   └── rebuild/
├── archive/
│   └── superseded/                      # explicitly replaced/unsafe docs
└── baseline/
    └── FINAL-CORRECTED/                 # immutable; keep path/content unchanged
```

### Final index contract

`design/current/00-START-HERE.md` must be the only normative design entry point. It should:

1. list W-101 through W-109 current canonical documents by domain;
2. list machine-readable current artifacts (`monster-asset-manifest.json`, description shards);
3. state that `master/` cannot override `current/`;
4. link evidence/history/baseline only under clearly labeled non-normative sections;
5. state the active monster scope (No.001–238 / 83 families; No.239 baseline reference only);
6. carry a short precedence rule: user decision > current canonical > validated data master > evidence/history/runtime.

`design/00-README.md` should eventually become a small compatibility shim pointing to `design/current/00-START-HERE.md`; its current runtime-authority content must not remain as an alternate entry point.

## 9. Proposed migration mapping

### A. Current root → `master/`

After domain canonical review validates them:

- `design/09-special-forms-master.md` → `design/master/special-forms/targets.md`
- `design/10-initial-balance-master.md` → `design/master/balance/initial-tuning.md`
- `design/13a-*` through `design/13d-*` → `design/master/monsters/`
- `design/14a-*` through `design/14d-*` → `design/master/evolution/`

Do not move a master merely because its filename says `master`; compare it to the accepted canonical first. Conflicting rows must be corrected or archived, not silently carried forward.

### B. Current root → `evidence/`

After the relevant W documents are accepted:

- `design/07-parent-controls.md` → `design/evidence/later-design/`
- `design/12-detailed-balance-design-for-sol-review.md` → `design/evidence/later-design/`
- `design/13-monster-growth-master-238.md` → `design/evidence/later-design/`
- `design/17-hosting-pwa.md` → `design/evidence/later-design/`
- `design/20-world-map-evolution-progression.md` → `design/evidence/later-design/`
- `design/21-mockup-ui-visual-system.md` → `design/evidence/later-design/`
- `design/22-premium-ui-v4.md` → `design/evidence/later-design/`
- `design/DESIGN-SOURCE-METADATA.txt` → `design/evidence/later-design/`

### C. Current root → `history/`

- `design/08-balance-tuning-policy.md` → `design/history/reviews/`
- `design/11-battle-character-boss-review.md` → `design/history/reviews/`
- `design/15-sol-review-validation-report.md` → `design/history/reviews/`
- `design/16-sol-pr15-full-review.md` → `design/history/reviews/`
- `design/17-sol-pr15-review-amendment.md` → `design/history/reviews/`
- `design/18-sol-pr15-fix-resolution.md` → `design/history/reviews/`
- `design/19-sol-pr15-runtime-completion.md` → `design/history/runtime/`

### D. Current root/rebuild → `archive/superseded/`

- current contents of `design/00-README.md` → archive copy, then replace original path with compatibility pointer;
- `design/01-catch-and-evolution-design.md`
- `design/02-dex-200.md`
- `design/03-screens-catch-and-raise.md`
- `design/06-battle-and-progression-design.md`
- `design/14e-evolution-item-acquisition-master.csv`
- `design/rebuild/canonical-draft/UI-SCREEN-CONTRACT.md`

### E. Rebuild evidence/history after Phase 2

- `USER-DECISION-EVIDENCE.md` and `audit/**` → `design/evidence/user-decisions/` / `design/evidence/audits/`;
- commander reviews, work queue, work-item definitions, templates, handoffs → `design/history/rebuild/` after Phase 2 closes;
- `DECISION-LOG.md` stays authoritative during rebuild and is only demoted after every live decision is represented in accepted `design/current/**`.

### F. Baseline

`design/baseline/FINAL-CORRECTED/**` stays exactly where it is. Link migration must update references **to** it if surrounding files move, but must not rename, move, edit, regenerate, or normalize the baseline itself.

## 10. Link migration plan

Perform link migration only in a later cleanup implementation work item, after W-101 through W-113 commander review.

1. **Promote the canonical index first.** Create `design/current/00-START-HERE.md` and ensure every accepted current domain is reachable from it.
2. **Build a reference graph before moving files.** Search repository Markdown/JSON/JS/test files for every path to be moved. Record inbound links so no move is blind.
3. **Rewrite normative links before history moves.** Product/readme/runtime developer links must point to `design/current/**`, never to review/runtime-completion history.
4. **Move validated data masters.** Update references from current docs to `design/master/**`; keep the statement that canonical semantics outrank master rows.
5. **Move evidence/history/archive in separate commits.** This keeps reviewable provenance and makes accidental authority changes visible.
6. **Preserve a compatibility entry at `design/00-README.md`.** Replace its dangerous runtime-authority content with a short pointer to `design/current/00-START-HERE.md` only after the canonical index exists.
7. **Do not create redirect stubs for every obsolete file.** Prefer updating all inbound links; add a stub only when an external/stable link is known to require it. Otherwise stubs risk recreating multiple “entry points”.
8. **Add non-normative banners to history/evidence indexes.** Their index pages must say they cannot override `design/current/**`.
9. **Validate with repository-wide link checks.** Acceptance for the later cleanup is zero broken internal design links and zero normative links from current docs to runtime-completion/review documents.
10. **Keep baseline hash verification separate.** Any later cleanup touching the surrounding tree must still show baseline file count/hash unchanged.

## 11. Anti-drift rules for future contributors

- A new product/game/UI rule belongs in `design/current/**`, not in a PR completion report.
- A review report may say an implementation passes; it may not become the specification by virtue of being newer.
- A runtime-completion note records what code did at that moment. It is never sufficient evidence that the behavior was approved.
- A new structured master must declare which current canonical document governs its semantics.
- Tuning values must explicitly identify whether they are fixed product decisions or `TUNING-DEFAULT`.
- Evidence documents must link **to** the canonical decision they support; canonical docs should not require readers to reverse-engineer the rule from history.
- No document under `history/` or `archive/` may be listed in the normative section of `design/current/00-START-HERE.md`.

## 12. W-113 acceptance check

- [x] Entire current `design/` tree inventoried: 82 files.
- [x] Every file assigned to exactly one required class.
- [x] New rebuild governance/audit/handoff documents included.
- [x] Immutable FINAL-CORRECTED baseline explicitly preserved and not edited.
- [x] Runtime-completion/review history explicitly prevented from outranking canonical product/game/UI documents.
- [x] Final folder/index structure proposed.
- [x] Link migration sequence proposed.
- [x] No files moved or deleted in W-113.
- [x] No `src/**`, `tests/**`, runtime, or baseline source changes made.
