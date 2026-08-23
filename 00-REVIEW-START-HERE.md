# Mana Evo PR #5 — 設計承認反映・再レビュー入口

## レビュー対象

- Repository: `syoudai0514/mana-evo`
- PR: `#5 fix: PR4レビュー P0/P1対応`
- Branch: `terra/mana-evo-pr4-review-fixes`
- このZIPは、2026-08-23の設計書基準レビュー後にユーザー承認を反映した再レビュー用です。

GitHubへpush後の確定HEAD/CI結果は `PACKAGE-METADATA.txt` に記録します。

## 今回ユーザーが正式承認した仕様

1. バトル開始時にチケット1枚reserve。
   - **敗北: 返却**
   - **明示的な逃走/やめる: 返却**
   - 勝利/捕獲成功: 消費確定
   - reload/crash: activeBattle再開、追加消費なし
2. 「わ」: ほし×1.00 / ぎん×1.20 / きん×1.50 / にじ100%、非にじ92%上限。
3. 学習報酬: dailyほし+3、追加3正解ごとほし+1、単元MASTERぎん+1、hard MASTERきん+1。

## レビュー優先順

1. `design/` — 今回の正本スナップショット
2. `docs/PR5_DESIGN_REVIEW_FIXES.md` — 指摘→実装対応
3. `tests/*.test.js` — Acceptance Tests
4. 実ソース `src/`
5. `01-UNRESOLVED-DECISIONS.md` — 本当に残った未決/実装待ちのみ

## 最重要チェック

- 誤答→説明確認だけではdaily項目が完了しないこと
- 高速誤答連打で報酬を得られないこと
- 前日チケットがあっても今日の基本5問未完了なら新規バトル不可
- チケット7日TTL/期限近い順
- 敗北/明示逃走でチケット返却、勝利/捕獲で消費
- reloadで同じbattleをresume
- 4種の「わ」の性能差、にじ100%
- 学習から「わ」が実際に増えること
- 実マスタにlevel/stone/held_item_levelが存在しE2E進化できること
- スター覚醒が現行機能として存在しないこと

## マージ方針

この再レビューでP0/P1 GOを確認するまで `main` へマージしない。
