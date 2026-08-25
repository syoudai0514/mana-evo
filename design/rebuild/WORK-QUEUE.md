# ManaEvo 再建 Work Queue

司令塔が作業を分割し、Worker SOLチャットへ渡すための唯一の作業台帳。

## Priority
- P0: 完成阻害・仕様正本・主要UX
- P1: 重要機能整合
- P2: 品質・整理・改善

## Status
- TODO / ASSIGNED / IN-PROGRESS / REVIEW / DONE / BLOCKED

## Phase 1 / 1.5

| ID | Pri | Work item | Status | Evidence |
|---|---|---|---|---|
| W-001 | P0 | FINAL-CORRECTED baseline rescue | DONE | PR #35 |
| W-002 | P0 | Learning/ticket audit | DONE | PR #36 |
| W-003A | P0 | Battle/capture/evolution audit | DONE | PR #37 |
| W-004A | P0 | Monster/world/progression audit | DONE | PR #38 |
| W-005A | P0 | UI architecture/screen draft audit | DONE | PR #39 |

All five are merged into `rebuild/canonical-governance`. Commander final decisions are in `design/rebuild/DECISION-LOG.md` and `PHASE-2-COMMANDER-REVIEW.md`.

## Phase 2 — parallel CURRENT canonicalization

Detailed instructions are authoritative in `design/rebuild/PHASE-2-WORK-ITEMS.md`.

| ID | Pri | Work item | Status | Deliverable |
|---|---|---|---|---|
| W-101 | P0 | Learning/rewards canonical | TODO | `design/current/01-LEARNING-REWARDS.md` |
| W-102 | P0 | Battle/ticket/boss-balance canonical | TODO | `design/current/02-BATTLE-TICKETS-BALANCE.md` |
| W-103 | P0 | Capture/duplicate canonical | TODO | `design/current/03-CAPTURE-DUPLICATES.md` |
| W-104 | P0 | Evolution/items/special forms canonical | TODO | `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md` |
| W-105 | P0 | World/progression canonical | TODO | `design/current/05-WORLD-PROGRESSION.md` |
| W-106 | P0 | UI/navigation canonical | TODO | `design/current/06-UI-SCREEN-CONTRACT.md` |
| W-107 | P1 | Save/profiles/Parent/PWA canonical | TODO | `design/current/07-SAVE-PROFILES-PARENT-PWA.md` |
| W-108 | P0 | Acceptance/test contract | TODO | `design/current/08-ACCEPTANCE-TEST-CONTRACT.md` |
| W-109 | P0 | Monster master/art contract | TODO | `design/current/09-MONSTER-MASTER-ART-SPEC.md` + asset manifest |
| W-110 | P0 | Monster descriptions 001-080 | TODO | description shard |
| W-111 | P0 | Monster descriptions 081-160 | TODO | description shard |
| W-112 | P0 | Monster descriptions 161-238 | TODO | description shard |
| W-113 | P1 | Design-folder cleanup map | TODO | `design/rebuild/DESIGN-CLEANUP-PLAN.md` |

## Phase 3 — targeted implementation

Blocked only by the canonical domain it depends on, not by unrelated art/docs.

| Workstream | Dependency | Status |
|---|---|---|
| learning/reward bridge fixes | W-101 | BLOCKED |
| battle/ticket/boss snapshot fixes | W-102 | BLOCKED |
| capture/duplicate/animation fixes | W-103 | BLOCKED |
| evolution-item/exploration fixes | W-104 | BLOCKED |
| world/boss-gate fixes | W-105 | BLOCKED |
| Home/Adventure/Battle/Monster UI rebuild | W-106 + relevant game domain | BLOCKED |
| save/PWA/platform cleanup | W-107 | BLOCKED |
| test refactor/E2E | W-108 + implementation domains | BLOCKED |
| MonsterArt resolver/asset formalization | W-109 | BLOCKED |
| final design folder reorganization | W-113 + current canonical complete | BLOCKED |
| end-to-end release gate | all P0 implementation workstreams | BLOCKED |

## Worker rule

Workerは1チャットにつき原則1 work item。隣接項目まで勝手に実装しない。仕様判断は `DECISION-LOG.md` に従い、根拠がなければ `BLOCKED DECISION` として司令塔へ返す。
