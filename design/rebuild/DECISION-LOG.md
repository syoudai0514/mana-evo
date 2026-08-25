# ManaEvo 再建 Decision Log

重要仕様の判断を時系列で残す。実装だけで仕様を確定しない。

## Status
- PROPOSED: 候補
- CONFIRMED: 根拠確認済み
- USER-DECISION: ユーザー判断待ち/判断済み
- REVERT-TO-BASELINE: 原本へ戻す
- SUPERSEDED: 後続判断で置換

## Template

### D-XXX タイトル
- Status:
- Baseline:
- Later design:
- Runtime:
- Evidence of approval:
- Decision:
- Reason:
- Affected areas:
- Tests required:

---

## D-001 正本の優先順位
- Status: CONFIRMED
- Baseline: `mana-evo-terra-FINAL-CORRECTED` を原本とする。
- Later design: 現行 `design/` にはPRレビュー・runtime完了報告・後続UX設計が混在。
- Runtime: 現行実装は参考事実であり正本ではない。
- Evidence of approval: 2026-08-25 ユーザー明示。
- Decision: ユーザー明示決定 > 原本 > 承認済み後続変更 > current canonical > master > runtime > review history。
- Reason: 実装先行で仕様が変質した履歴があり、runtimeを正とすると設計復旧不能になるため。
- Affected areas: 全体。
- Tests required: なし（governance）。

## D-002 再建方式
- Status: CONFIRMED
- Baseline: 原本をそのまま実装する前提だった。
- Later design: 原本以降に多数の試行錯誤・承認済み改善が存在。
- Runtime: 既存の学習基盤・ゲームエンジン・master・PWA・testsには再利用価値が高い。
- Evidence of approval: 2026-08-25 ユーザー明示。
- Decision: 全面rewriteでも原本巻き戻しでもなく、baseline rescue → diff → canonicalization → targeted rebuild とする。
- Reason: 完成速度と仕様一貫性を両立するため。
- Affected areas: 全体。
- Tests required: 現行回帰 + canonical acceptance。
