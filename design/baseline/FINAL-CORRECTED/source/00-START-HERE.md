# マナエボ — Terra最終実装パッケージ START HERE

## P0: 絶対に間違えてはいけないリポジトリ前提

このZIPは **新しい独立アプリ `syoudai0514/mana-evo` を実装するための正本**です。

- **実装先・commit先・push先は `syoudai0514/mana-evo` だけ。**
- **`syoudai0514/kids-quest` は読み取り専用の参照元。commit / push / PR / rename / archive / delete / repository settings変更を一切しない。**
- **`kids-quest` を `mana-evo` にrenameしてはいけない。** 2つは今後も別repo・別アプリとして共存させる。
- 学習基盤は `kids-quest` の作業開始時点の最新 `main` を調査し、**その実装を基準にManaEvoへコピー・移植する。学習エンジンや教材体系をゼロから独自に作り直さない。**
- ManaEvo側で必要な変更は **ManaEvo側だけ**に行う。
- GitHub Pagesも共存する。Kids Questの `/kids-quest/` は壊さず、ManaEvoは `/mana-evo/` に公開する。

作業開始前とpush直前に、Terraは必ず `pwd` / `git remote -v` / 対象repositoryを確認し、**書き込み対象が `syoudai0514/mana-evo` であることを確認する。**

## このZIPの目的

レビュー履歴保管用ではなく、**既存のKids Quest学習基盤を安全に再利用しながら、ManaEvo独自の冒険・バトル・捕獲・探索・育成・進化を `mana-evo` に実装し、公開まで完了するための実装パッケージ**です。

正式ブランドは次で固定します。

- 正式名称: **マナエボ**
- 英字表記: **ManaEvo**
- GitHub: **`mana-evo`**
- キャッチコピー: **まなびが、進化になる。**

世界観の核は、**「まなぶと『マナ』が生まれる。マナの力で冒険し、仲間を育て、進化させよう。」** です。

## Terraが最初に読む順番

1. `00-TERRA-IMPLEMENTATION-REQUEST.md`
2. `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` — 学習基盤を作り直さないための最重要正本
3. `13-EXECUTION-FLOW.md` — 誤操作を防ぐ実装Gate順
4. `10-BRAND-AND-REPOSITORY-SPEC.md` — repo分離/PWA/保存領域/ブランドの正本
5. `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` — キャラ名/グラフィックの正本
6. `scripts/families.mjs` / `scripts/monster-visual-briefs.json`
7. `08-gameplay-state-spec.md`
8. その他 `scripts/*.mjs`
9. `06-battle-and-progression-design.md` / `07-wild-encounter-and-capture-design.md`
10. `03-screens-catch-and-raise.md`
11. `01-catch-and-evolution-design.md` / `02-dex.md`
12. `09-implementation-traceability.md`
13. `99-IMPLEMENTATION-REVIEW-CHECKLIST.md`

## 領域別の正本

- repository分離 / Kids Quest read-only / 学習基盤移植: **`12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`**
- ブランド / ManaEvo PWA / 保存namespace: **`10-BRAND-AND-REPOSITORY-SPEC.md`**
- モンスター名 / キャラクター設定 / 画像生成: **`11` + `families.mjs` + `monster-visual-briefs.json`**
- バトル / 捕獲 / 探索 / 進化: **`08` > scripts > `06/07` > `03` > `01/02`**

下位文書やGitHub上の古いコメントを理由に、このP0前提を変更してはいけません。

## 特に誤解禁止

- Kids Questは**残す**。ManaEvoは**別repoで新しく作る**。
- 学習機能はKids Questから再利用する。独自再設計しない。
- ManaEvoの保存は独立namespace。Kids Questの保存キーへ書かない。
- 既存Kids Quest進捗を引き継ぐ場合も、**Kids Quest保存をread-onlyで読み、ManaEvo側へ一方向コピー**する。共有状態にしない。
- `area` は制作・データ分類、`adventureRegion` はゲーム内地域。
- 地域2〜4は直前地域ボス初回撃破で順次解放。
- アイテムは地域解放時に自動付与しない。解放地域の探索ドロップ候補になる。
- 子ども向け捕獲UIは ★＋日本語ラベルが主表示。%は補助値。
- キャラ改名は表示名の改善。安定monsterId/dexIdを名前に合わせて変更しない。
- 他作品の名称・UI・画像・演出・文章・音声を模倣しない。
