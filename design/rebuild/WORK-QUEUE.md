# ManaEvo 再建 Work Queue

司令塔が作業を分割し、Worker SOLチャットへ渡すための唯一の作業台帳。

## Priority
- P0: 完成阻害・仕様正本・主要UX
- P1: 重要機能整合
- P2: 品質・整理・改善

## Status
- TODO / ASSIGNED / IN-PROGRESS / REVIEW / DONE / BLOCKED

| ID | Pri | Work item | Scope | Status | Deliverable |
|---|---|---|---|---|---|
| W-001 | P0 | 原本Baseline Rescue | 添付FINAL-CORRECTED一式をGitHubで原本保全 | TODO | `design/baseline/FINAL-CORRECTED/` |
| W-002 | P0 | 仕様差分台帳 | 原本 vs 現行design vs runtime | TODO | `design/rebuild/SPEC-DIFF-LEDGER.md` |
| W-003 | P0 | 学習・報酬正本化 | Kids Quest、基本学習、追加学習、チケット、わ | TODO | `design/current/01-LEARNING-REWARDS.md` |
| W-004 | P0 | ワールド・捕獲・進化正本化 | ワールド、ボス、捕獲、進化、アイテム | TODO | current canonical 3文書 |
| W-005 | P0 | 238/239・特殊形態判定 | monster scope、系列、ギガ/バースト | TODO | Decision Log + master方針 |
| W-006 | P0 | UX canonical | HOME/ADVENTURE/BATTLE/MONSTERの表示・非表示・CTA | TODO | `design/current/07-UI-UX.md` |
| W-007 | P0 | Home再建 | current UX正本に従い旧新UI混在解消 | BLOCKED | PR + E2E |
| W-008 | P0 | Adventure再建 | ワールド→ゾーン→今日の出会いを主導線化 | BLOCKED | PR + E2E |
| W-009 | P1 | Battle/Capture再建 | 正本確定後UI/logic alignment | BLOCKED | PR + tests |
| W-010 | P1 | Monster/Evolution再建 | 育成・進化を主役に再構成 | BLOCKED | PR + tests |
| W-011 | P1 | Legacy整理 | `src/study` 等の重複/adapter/legacy判定 | TODO | inventory + cleanup PR |
| W-012 | P1 | Test contract再編 | class存在テスト→ユーザー体験契約中心 | TODO | test refactor PR |
| W-013 | P1 | PWA/画像統合確認 | Pages、SW、正式画像fallback、iPhone | TODO | audit + PR if needed |
| W-014 | P0 | End-to-end release gate | 子どもが最初から進化まで遊べる | BLOCKED | release checklist |

## Dependency

- W-001 → W-002
- W-002 → W-003/W-004/W-005/W-006
- W-003〜W-006 → W-007〜W-010
- W-007〜W-013 → W-014

## Worker rule

Workerは1チャットにつき原則1 work item。隣接項目まで勝手に実装しない。
