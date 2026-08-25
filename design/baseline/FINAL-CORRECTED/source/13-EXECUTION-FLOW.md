# Terra 作業フロー概要

この順番を崩さない。各Gateを通過してから次へ進む。

## Gate 0: repository誤操作防止

1. `syoudai0514/mana-evo` と `syoudai0514/kids-quest` が**別repoとして存在**することを確認。
2. ManaEvo worktreeで `pwd` / `git remote -v` / branch / statusを確認。
3. Kids Questはread-only参照と宣言し、write操作をしない。
4. 両repoの開始時HEAD SHAを記録。

**失敗条件:** 実装worktreeがKids Quest、またはKids Questへpush可能な操作を実行しようとしている。→ 作業停止。

## Gate 1: Kids Quest学習基盤の棚卸し

1. Kids Quest最新mainから学習関連コード/data/testを特定。
2. 学年・科目・問題・習熟・SRS・英語/TTS・進級・学年戻し・保護者設定・保存schemaを確認。
3. source pathと依存関係をimport manifestへ記録。

**ここではKids Questを変更しない。**

## Gate 2: ManaEvoへ学習基盤をコピー

1. 必要な学習コード/data/testと依存をManaEvoへコピー。
2. ManaEvo固有storage namespaceへ適合。
3. Kids Quest相当の学習テストをManaEvoでPASSさせる。
4. 学習内容・習熟ロジックを勝手に再設計していないことをdiffレビュー。

**Gate 2がPASSするまでバトル等の大型実装へ進まない。**

## Gate 3: ManaEvoゲームを接続

1. 学習完了 → チケット/探索/XP等のイベント接続。
2. バトル・遭遇・捕獲・図鑑・育成・進化を実装。
3. ギガ/キョダイバースト・地域解放・探索天井等を正本どおり実装。
4. 画像はvisual bible準拠。未制作assetは安全なfallback。

## Gate 4: 保存と共存確認

1. ManaEvoがManaEvo固有storageへwriteすることを確認。
2. ManaEvo操作前後でKids Quest localStorage/IndexedDB/cache snapshotが不変であることを確認。
3. Kids Quest既存進捗をimportする場合はread-only one-way・冪等であることを確認。
4. `/kids-quest/` と `/mana-evo/` を両方開き、SW/cache/storageが干渉しないことを確認。

## Gate 5: 全回帰テスト

- Kids Quest由来の学習回帰
- ManaEvoゲーム状態
- セーブ/ロード/再読込
- PWA/offline/update
- 375〜390px級viewportの主要導線
- build/lint/typecheck/unit/integration/E2Eの利用可能なもの全部

FAILをskipや期待値弱体化で隠さない。

## Gate 6: Git操作

1. push直前に再度 `pwd` / `git remote -v` / branch確認。
2. `mana-evo/origin/main` 最新を取り込む。
3. **`syoudai0514/mana-evo` のmainだけへpush。**
4. Kids Quest repoに変更が無いことを再確認。

## Gate 7: 公開確認

1. ManaEvo GitHub Pages deploy完了を確認。
2. `https://syoudai0514.github.io/mana-evo/` の表示・assets・主要導線・PWAを確認。
3. Kids Quest `/kids-quest/` が従来どおり動くことを確認。

## Gate 8: 再レビュー用成果物

再レビューZIPへ最低限含める。

- 最終差分または変更ファイル一覧
- ManaEvo最終SHA
- Kids Quest参照source SHA
- 学習import manifest
- 学習でKids Questから意図的に変えた差分と理由
- テスト結果
- storage/SW/cache分離結果
- 公開URL/公開確認結果
- 未制作asset/既知制約

ここまで終えて初めて「完了」。
