# ManaEvo Rebuild — Phase 1 Commander Review

Date: 2026-08-25
Scope: PR #35〜#39

## Overall judgment

Phase 1の5並列監査は有効。特にUI構造問題、239→238変更履歴、学習runtimeの二重構造、battle/capture/evolutionの実装drift候補を特定できた。

ただし5Workerすべてが PR #35 の `FINAL-CORRECTED payload未取得` を前提にしているため、監査結果は exact baseline による再判定が必要。

司令塔側では `mana-evo-terra-FINAL-CORRECTED(3).zip` を正常展開し、原本32ファイルを確認済み。

主要原本:
- `00-START-HERE.md`
- `00-TERRA-IMPLEMENTATION-REQUEST.md`
- `01-catch-and-evolution-design.md`
- `02-dex.md`
- `03-screens-catch-and-raise.md`
- `06-battle-and-progression-design.md`
- `07-wild-encounter-and-capture-design.md`
- `08-gameplay-state-spec.md`
- `09-implementation-traceability.md`
- `10-BRAND-AND-REPOSITORY-SPEC.md`
- `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
- `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- `13-EXECUTION-FLOW.md`
- `99-IMPLEMENTATION-REVIEW-CHECKLIST.md`
- `scripts/*` 18 files

## PR #35 — W-001 baseline rescue

Status: INCOMPLETE / continue same PR.

Good:
- baselineとcurrentを混同しないREADME/handoffを作成。
- 原本未取得時にmanifestを捏造しなかった。

Required:
- exact 32 files import
- immutable payload
- SHA-256 manifest
- file count verification
- current design path comparison
- handoff update

## PR #36 — learning / tickets

Status: GOOD AUDIT, RE-AUDIT REQUIRED.

Exact baseline confirms:
- Kids Quest latest main is learning source of truth; do not rebuild learning logic independently.
- core task 5 / basic quota reward structure exists in baseline.
- basic all-clear ticket +3.
- extra question ticket +1, no daily cap.
- baseline ring economy differs from current.
- ticket lots retain 7 days / FEFO.

Need separate later approved changes from drift using `USER-DECISION-EVIDENCE.md` and Git history.

## PR #37 — battle / capture / evolution

Status: GOOD AUDIT, RE-AUDIT REQUIRED.

Strong implementation drift candidates retained:
- boss snapshot is not re-persisted after invalid balanceVersion snapshot replacement.
- capture 4-step/star sequence lacks temporal UI contract.

Exact baseline confirms:
- post-victory capture state machine `ENCOUNTERED → BATTLING → WON → CAPTURE → RESOLVED`.
- silver ×1.5 / gold ×2.0 baseline.
- giga 12 / burst 8 and exact core special-form values.
- evolution item acquisition baseline is exploration-points + 20% rare drop + per-area 6th-run pity choice.

Recovered user evidence confirms current HP<=50% capture + ring multipliers as a later approved change.

## PR #38 — monster / world / progression

Status: GOOD AUDIT, MATERIAL RECLASSIFICATION REQUIRED.

Exact baseline confirms:
- 84 families / 239 monsters.
- No.239 `シラユキヒメ` exists as area4 ice special-event completed entity.

Recovered user evidence confirms later explicit decision:
- current active master No.001〜238.
- No.239 remains source/reference only and is excluded from current game runtime.

Therefore 239→238 is `CONFIRMED_CHANGE`, not unresolved.

World/self-evolution direction also has recovered user approval evidence; exact details must be reclassified against baseline.

## PR #39 — UI architecture

Status: STRONG / KEEP ROOT FINDINGS / BASELINE RECHECK REQUIRED.

P0 structural findings remain highly credible:
- CSS authority by load order / overrides / `!important` rather than screen ownership.
- old UI + new UI accumulation.
- Home/Battle/Monster information overload.
- ambiguous navigation ownership.
- `kids-quest-study` and `src/study` duality.
- multi-source MonsterArt resolution.
- tests lock selectors/load order more than child experience.

Before implementation, exact baseline `03-screens` / `09-traceability` and later approved UI changes must be used to produce canonical screen contracts.

## Commander gate

Do not begin broad implementation yet.

Next 5 parallel tasks:
1. Complete W-001 exact baseline preservation.
2. Re-audit learning/ticket using exact baseline + recovered user decisions.
3. Re-audit battle/capture/evolution using exact baseline + recovered user decisions.
4. Re-audit monster/world/progression using exact baseline + recovered user decisions.
5. Re-audit UI and produce canonical screen-contract draft; no UI implementation yet.

After these 5 return, commander will produce `design/current/*` canonical specs and unlock targeted implementation work in parallel.
