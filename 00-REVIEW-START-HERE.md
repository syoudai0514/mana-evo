# Mana Evo レビュー開始点

このブランチは、レビュー用の固定スナップショットです。

## レビュー対象
- Repository: `syoudai0514/mana-evo`
- Source branch: `terra/mana-evo-final-design-vertical-slice`
- Source HEAD: `1281287a64b36f897e617da72fd2b152155fdc6b`
- PR: #3 `feat: 最終レビュー準拠の冒険・捕獲・育成縦切り`
- Base: `main` (`3adf51637046679a722e8445579b439a85b50254`)
- CI: GitHub Actions run `32575588653` / Test + Build = SUCCESS

このレビュー用ブランチは上記HEADから分岐し、レビュー資料だけを追加しています。実装レビューは `src/`, `tests/`, `docs/`, `README.md` を対象にしてください。

## 最重要前提
1. `syoudai0514/kids-quest` 本体は変更しない。
2. Kids Quest の学習部分は Mana Evo にコピーして再利用する。
3. Kids Quest のゲーム部分はコピーせず、Mana Evo 側で独立実装する。
4. キャラクター画像・正式名は未確定。現状はプレースホルダーでよい。
5. 正式な特殊変身名は `ギガシンカ` / `キョダイバースト`。`スター覚醒` は正式仕様ではない。
6. 子どもが「捕まえたい・育てたい・進化させたいから勉強する」ループを最優先する。

## まず読む順番
1. `01-UNRESOLVED-DECISIONS.md`
2. `02-IMPLEMENTATION-STATUS.md`
3. `03-REVIEW-CHECKLIST.md`
4. `docs/KIDS_QUEST_STUDY_MIGRATION.md`
5. `src/game/` → `src/study/` → `src/App.jsx`

## 現在の縦切り
`基本学習 → チケット → マップ → バトル → 捕獲 → 手持ち/ボックス/図鑑 → XP/レベル → 通常進化`

レビューでは、単なるコード品質だけでなく、最終ゲーム仕様とのズレ・子どもが迷うUX・学習がゲーム報酬へ正しくつながっているかを重点的に確認してください。
