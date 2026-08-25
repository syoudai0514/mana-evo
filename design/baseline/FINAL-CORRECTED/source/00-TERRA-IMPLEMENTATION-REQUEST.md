# Terra 実装依頼 — マナエボ FINAL CORRECTED

## P0: repository安全ルール

**唯一の実装先は `syoudai0514/mana-evo` です。**

`syoudai0514/kids-quest` は学習基盤の参照元としてのみ使い、次の操作を禁止します。

- commit / push
- pull request作成・merge
- repository rename / archive / delete
- Pages / Actions / repository settings変更
- Kids Quest側のコード修正
- force push

**`kids-quest` を `mana-evo` にrenameしてはいけません。両repoは別アプリとして維持します。**

作業開始前、最初のcommit前、push直前の3回、対象worktree/remote/repositoryを確認し、書き込み先が `syoudai0514/mana-evo` であることを確認してください。違っていれば作業を止めてManaEvo worktreeへ移動してください。

## 依頼

作業順は `13-EXECUTION-FLOW.md` のGate 0→8を守ること。

1. `syoudai0514/mana-evo` の作業開始時点の最新 `origin/main` を取得し、**そこを唯一の実装worktree**にする。
2. `syoudai0514/kids-quest` の作業開始時点の最新 `main` を**read-only参照**として取得する。
3. Kids Questの学習基盤を調査し、`12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` に従ってManaEvoへコピー・移植する。
4. 学習部分を独自にゼロから作り直さず、Kids Questの現在の挙動・教材・テストを基準にする。
5. その上に、このZIPのManaEvo独自ゲーム仕様を実装する。
6. テスト・セルフレビュー後、**`mana-evo/main` にのみpush**し、GitHub Pages `/mana-evo/` の公開確認まで完了する。
7. 実装再レビュー用ZIPを作成する。

**計画だけで終了禁止。** 調査 → 学習基盤移植 → ManaEvoゲーム実装 → テスト → セルフレビュー → `mana-evo/main` 反映 → GitHub Pages公開確認 → 再レビューZIP作成まで進めてください。

## ブランド固定値

- 正式名称: **マナエボ**
- 英字表記: **ManaEvo**
- GitHub: **`mana-evo`**
- キャッチコピー: **まなびが、進化になる。**
- 世界観: **まなぶと「マナ」が生まれる。マナの力で冒険し、仲間を育て、進化させよう。**
- `マナ` は物語上の共通概念。**新しい消費通貨を追加しない。**
- 新規コード命名: camelCase=`manaEvo`、定数prefix=`MANA_EVO`。

## 学習基盤の必須方針

`12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` が正本です。最低限次を守ってください。

- 学年/科目/問題データ/習熟判定/SRS/復習/英語/TTS/進級/学年戻し/保護者設定など、Kids Questで既に成立している学習仕様は**再設計しない**。
- Kids Questの実コードとテストを基準に、必要な依存を含めてManaEvoへ移植する。
- パスやアーキテクチャの都合で変更する場合も**意味・挙動を維持**し、差分理由を報告する。
- Kids Questからコピーしたsource SHAと主要移植ファイル/モジュール一覧を完了報告へ記録する。
- 既存学習テストを可能な限りManaEvo側へ持ってきてPASSさせる。
- 新ゲームとの接続点以外を「ついでに改善」しない。

## 保存データの安全ルール

**ManaEvoとKids Questは別アプリです。保存領域を共有書き込みしてはいけません。**

- ManaEvoは `mana-evo:*` 等の独立namespaceを使う。
- Kids QuestのlocalStorage/IndexedDBキーは**read-only**。ManaEvoから更新・削除しない。
- 既存Kids Quest進捗を引き継ぐ場合は、互換項目を一度だけManaEvo namespaceへコピーする。
- importは冪等。何回起動しても二重XP/二重チケット/二重所持を作らない。
- import成功後もKids Quest元データを削除しない。
- 以後ManaEvoとKids Questは独立して進行する。ライブ同期しない。
- Service Worker / Cache Storageもアプリ所有prefix/scopeを分離し、Kids Quest側cacheを消さない。

## 正本

- repository分離 / 学習基盤移植: `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- ブランド / PWA / 保存namespace: `10-BRAND-AND-REPOSITORY-SPEC.md`
- キャラ名 / 画像設定: `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` + `scripts/families.mjs` + `scripts/monster-visual-briefs.json`
- ゲーム仕様: `08-gameplay-state-spec.md` > scripts > `06/07` > `03` > `01/02`

## ゲーム仕様の必須条件

- 基本学習ノルマ達成 → バトルチケット+3
- 追加問題1問 → チケット+1、日次上限なし
- チケットは獲得日ごとに7日保持し、期限が近いものから消費。0時一括消去は禁止
- きんのわ → 追加4問中3正解
- 勝利確定時だけチケット1枚消費。敗北/逃走/画面離脱では消費しない
- 敗北/逃走/画面離脱では同じ `encounterId` を保持
- 捕獲成功または3投失敗でのみ `RESOLVED`
- 地域2〜4は直前地域ボス初回撃破で順次解放
- 地域ボス条件 = 12pt + 異なるskill 2つ以上。進行は地域別、新地域は0pt/空集合
- 未解放地域の野生/探索/アイテム参照禁止
- 探索5pt/回、日次上限なし。同地域5回連続不発→6回目開始時に進化アイテム1個選択保証
- `まもる`=100%防御、次ターン再使用不可
- ギガ=全ステータス×1.35、HP割合維持
- キョダイバースト=HP×2/攻撃×1.2/3ターン、解除時HP割合維持
- ギガ/バーストは種族単位で排他、1バトル全体で1回
- 同種2匹目以降は「なかま / おうえん」選択
- そだちのかけら3個=30XP
- 捕獲主UIは★＋日本語ラベル。4星→輪完成。4回の物理揺れを必須にしない

## PWA / GitHub Pages

- Kids Quest `/kids-quest/` は**既存のまま維持**。redirectや置換を行わない。
- ManaEvoは `https://syoudai0514.github.io/mana-evo/` を正規URLとして構築する。
- ManaEvoのmanifest/start_url/scope/id/base/router/SW/cache/assetsを `/mana-evo/` 用に設定する。
- Kids QuestのPages/Actions/manifest/SWには触らない。
- 同一origin上の別アプリなので、storage/cache keyの衝突テストを必須にする。

## 必須テスト

既存テストに加え `99-IMPLEMENTATION-REVIEW-CHECKLIST.md` を自動化できる範囲で回帰テスト化する。特に、

- **Kids Questの最新学習基盤を参照していることを示すsource SHA/移植manifest**
- Kids Quest主要学習テスト相当がManaEvoでもPASS
- ManaEvo操作後もKids Quest保存キー/IndexedDB/cacheが不変
- Kids Quest既存進捗のread-only importを複数回実行して重複なし
- 勝利確定前後のチケット数、敗北/逃走/再読込
- チケット7日expiry、複数獲得日のFEFO消費
- 捕獲1〜3投、成功/失敗、同encounter再開
- 地域ボス11→12pt、skill 1→2、地域解放前後
- 探索5回不発→6回目保証
- `まもる` cooldown
- ギガ/バースト変身・解除・0HP
- 改名前キャラ名を含むManaEvo save → 新表示名で同一個体として復元
- PWAオフライン起動、更新、Service Worker scope/cache

## 画像assetsの扱い

- `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` と `scripts/monster-visual-briefs.json` が正本。
- Kids Quest既存画像はread-onlyで棚卸しし、正本に適合するものだけ**ManaEvoへコピーして**再利用する。Kids Quest側assetを変更しない。
- 未制作画像があっても404を出さないfallbackを実装し、未制作asset一覧を報告する。
- 画像生成環境が無い場合、独断で大量の仮画像を最終assetとして確定しない。

## 完了条件

1. `mana-evo` worktreeであることを確認してから実装を開始。
2. Kids Quest source SHAと学習基盤の移植manifestを記録。
3. 学習移植の回帰テストをPASSさせてからゲーム接続を進める。
4. lint/typecheck/unit/integration/build/E2E等、利用可能な検証をPASS。
5. Kids Quest repo/Pages/save/cacheが変更されていないことを確認。
6. 差分をセルフレビューし、不要変更・独自学習再実装・旧仕様復活がないことを確認。
7. `mana-evo/origin/main` 最新と安全に統合。
8. **`syoudai0514/mana-evo` の `main` にのみpush**。
9. GitHub Pages `/mana-evo/` のdeploy完了・公開URL・主要asset・PWA起動を確認。
10. 最終commit SHA、source Kids Quest SHA、テスト結果、保存分離/進捗import結果、公開URLを報告。
11. 実装再レビュー用ZIPを作成。

「実装予定」「計画しました」で終了せず、上記完了条件まで進めてください。
