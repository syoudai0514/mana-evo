# ManaEvo 再建 Work Item Index

Status: **HISTORICAL / NUMBERING INDEX — NOT LIVE PROGRESS AUTHORITY**

このファイルは、ManaEvo再建で使用してきたWork Item番号体系とPhaseの関係を確認するための索引である。

以前は「唯一の作業台帳」として開始したが、Phase進行後にW-101以降の状態更新が追随せず、実際の進捗と乖離した。今後は、古い状態を次の司令塔が誤認することを避けるため、**ライブ進捗の正本として使用しない**。

## 現在地の判定方法

現在の進捗・次に実行すべきWork Itemは、必ず次の順で判定する。

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/00-START-HERE.md`
4. 現在PhaseのWork Item計画文書
5. 対象Work Itemのbranch / PR /成果物 / Acceptance / review gate
6. 必要に応じて直前のCommander Review / Final Review

このファイルの古いStatus表記や履歴だけを根拠に、Work Itemを開始・完了・次へ進行してはいけない。

## Phase 1 / 1.5 — baseline rescue / audits

- W-001 — FINAL-CORRECTED baseline rescue
- W-002 — Learning/ticket audit
- W-003A — Battle/capture/evolution audit
- W-004A — Monster/world/progression audit
- W-005A — UI architecture/screen draft audit

Historical evidence:
- PR #35〜#39
- `design/rebuild/PHASE-1-COMMANDER-REVIEW.md`
- `design/rebuild/PHASE-2-COMMANDER-REVIEW.md`
- `design/rebuild/DECISION-LOG.md`

## Phase 2 — CURRENT canonicalization

Authoritative historical plan:
- `design/rebuild/PHASE-2-WORK-ITEMS.md`

Work Items:
- W-101 — Learning/rewards canonical
- W-102 — Battle/ticket/boss-balance canonical
- W-103 — Capture/duplicate canonical
- W-104 — Evolution/items/special forms canonical
- W-105 — World/progression canonical
- W-106 — UI/navigation canonical
- W-107 — Save/profiles/Parent/PWA canonical
- W-108 — Acceptance/test contract
- W-109 — Monster master/art contract
- W-110 — Monster descriptions 001-080
- W-111 — Monster descriptions 081-160
- W-112 — Monster descriptions 161-238
- W-113 — Design-folder cleanup map
- W-114 — CURRENT normalization / `design/current/00-START-HERE.md`

Completion/history evidence:
- `design/rebuild/PHASE-2-FINAL-REVIEW.md`
- `design/current/00-START-HERE.md`

## Phase 3 — targeted runtime/UI/release implementation

Authoritative historical plans:
- `design/rebuild/PHASE-3-WORK-ITEMS.md`
- `design/rebuild/PHASE-3-WAVE-B-WORK-ITEMS.md`
- `design/rebuild/PHASE-3-WAVE-C-WORK-ITEMS.md`
- `design/rebuild/PHASE-3-WAVE-D-WORK-ITEMS.md`

Work Item range:
- W-201〜W-220

Phase 3 rebuilt runtime/domain alignment, shared integration, child-facing UI, E2E, iPhone/CSS, PWA and release hardening according to CURRENT. Exact completion or review evidence must be read from the Phase 3 plans, PRs and final release artifacts rather than inferred from this index.

## Phase 4 — Monster Art production

Authoritative active/historical Phase 4 plan:
- `design/rebuild/PHASE-4-MONSTER-ART-WORK-ITEMS.md`

Work Items:
- W-301 — Global style calibration / visual constitution
- W-302 — Historical-reference ingestion / attribute queue / candidate QA automation
- W-303〜W-320 — 18 attribute-owned art batches
- W-321 — Cross-attribute visual QA
- W-322 — FORMAL approval / manifest / release

**Do not record a copied "current W-xxx" status here.** Phase 4 progresses frequently; the current gate must be read from the Phase 4 plan plus the actual current Work Item branch/output/review evidence.

## Worker rule

Workerは1チャットにつき原則1 Work Item。隣接項目まで勝手に実装しない。仕様判断は `DECISION-LOG.md` とCURRENTに従い、根拠がなければ `BLOCKED DECISION` として司令塔へ返す。

司令塔はWork Item番号だけで作業を推測せず、必ず現在Phase計画の当該Work Item定義・Acceptance・所有範囲を読む。
