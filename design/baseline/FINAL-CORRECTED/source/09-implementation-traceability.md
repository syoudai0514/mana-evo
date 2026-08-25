# 実装トレーサビリティ

Terraが「どの要件をどこで確認するか」を固定する。レビュー履歴ではなく現行仕様だけを対象にする。

| 領域 | 仕様正本 | 機械可読・テスト |
|---|---|---|
| repo分離 / Kids Quest read-only / 学習移植 | `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` | source SHA, import manifest, 学習回帰test |
| ブランド/PWA/Pages/storage分離 | `10-BRAND-AND-REPOSITORY-SPEC.md` | `scripts/brand.json`, storage/SW/cache coexistence test |
| モンスター名・系列・進化・図鑑 | `02-dex.md` | `scripts/families.mjs`, `scripts/check2.mjs` |
| キャラ設定・画像制作 | `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` | `scripts/monster-visual-briefs.json` |
| チケット/遭遇/地域/探索/重複捕獲 | `08-gameplay-state-spec.md` | `scripts/rewards.mjs`, `scripts/wildEncounter.mjs`, `scripts/check2.mjs` |
| バトル/XP/AI/特殊変身 | `06-battle-and-progression-design.md` | `scripts/battle.mjs`, `scripts/forms.mjs` |
| 野生出現/捕獲確率 | `07-wild-encounter-and-capture-design.md` | `scripts/capture.mjs`, `scripts/wildEncounter.mjs` |
| 子ども向け画面 | `03-screens-catch-and-raise.md` | 実装側UI/E2E/viewport test |
| 進化アイテム | `01-catch-and-evolution-design.md`, `08-gameplay-state-spec.md` | `scripts/items.mjs` |
| 最終受入条件 | `99-IMPLEMENTATION-REVIEW-CHECKLIST.md` | mana-evo repoのlint/typecheck/unit/integration/build/E2E |

## 衝突時

- P0 repo分離・学習移植: `12` を最優先。
- ブランド/PWA/storage: `10` を優先。
- モンスター名・画像設定: `11` + `families.mjs` / visual briefs。
- ゲーム状態遷移: `08`。
- 数値: 対応する `scripts/*.mjs`。
- 過去版・GitHub上の旧コメントから「kids-questをrenameする」等の旧前提を復活させない。
