# Kids Quest 学習基盤 → ManaEvo 移植仕様

## 1. 目的

ManaEvoの学習部分をゼロから再設計するのではなく、**既に検証・改善を重ねてきた `syoudai0514/kids-quest` の最新mainを学習基盤のsource of truthとして再利用する**。

`kids-quest` は既存アプリとして残す。ManaEvoは別repo・別アプリとして作る。

## 2. P0 repositoryルール

- source: `syoudai0514/kids-quest` 最新 `main` — **read-only**
- destination: `syoudai0514/mana-evo` 最新 `main` — **唯一のwrite先**
- `kids-quest` へのcommit / push / PR / rename / settings変更は禁止
- accidental migration commit等、ManaEvo化を目的にKids Questへ過去に入ってrevertされた変更を再利用しない
- 作業開始時に両repoのHEAD SHAを記録し、完了報告へ記載する

## 3. 「学習部分を作り直さない」の定義

次の領域は、Kids Quest最新mainの実装・データ・テストを基準にManaEvoへ移植する。

- 学年・科目・単元構成
- 問題データ / 問題生成規則
- knowledgeId / unitId / skillId / questionInstanceId 等の学習識別
- 習熟判定・星の試練・進級条件
- SRS / 復習 / 誤答追跡
- 英語コンテンツ / 音声 / TTS / 再生導線
- 学年戻し・進級履歴の扱い
- 保護者設定・選択可能学年下限等の学習制御
- ミッション生成・学習進捗
- 学習に関する保存schemaとmigrationロジック
- 既存の学習整合性テスト

Terraはこれらを「似たもの」に作り直してはいけない。**可能な限り実コード・実データ・実テストをコピーして出発点にする。**

## 4. 許される変更

ManaEvo側だけで、次のために必要な変更は許可する。

- ManaEvoの画面/ルーティングへの接続
- ManaEvo独立storage namespaceへの適合
- 学習完了イベントをチケット/探索/XP等のManaEvoゲーム報酬へ接続
- import path / module boundary / build構成への適合
- Kids Quest固有の見た目・旧ゲームUIをManaEvoブランドへ置換
- セキュリティ/クラッシュ修正等、移植に不可欠な最小変更

ただし、**学習内容や習熟ロジックを「より良くするついで」に変更しない。** 変更が必要なら理由とKids Questとの差分を完了報告へ書く。

## 5. 移植手順

1. Kids Quest最新mainをread-onlyで取得しsource SHAを固定。
2. 学習関連module/data/testとその依存を一覧化する。
3. `mana-evo` にコピーする。コピー前にdestination worktree/remoteを確認。
4. ManaEvo側でKids Quest相当の学習テストを先にPASSさせる。
5. その後、ManaEvoゲーム報酬イベントへ接続する。
6. ゲーム接続後に学習回帰テストを再実行。
7. 最終的な「source path → ManaEvo path → 変更理由」のimport manifestを再レビューZIPへ含める。

## 6. 保存データ

2つのアプリは同一GitHub Pages origin上に存在し得るため、**保存キー衝突を絶対に避ける。**

### ManaEvo新規保存

- ManaEvoのwrite先は独立namespace（例: `mana-evo:*`）。
- Kids Questの既存key/IndexedDB storeをwrite先として再利用しない。
- ManaEvo reset/delete操作でKids Questの保存を消さない。

### Kids Questから既存学習進捗を引き継ぐ場合

ManaEvo初回起動時に互換データを検出できる場合、次を満たす**read-only one-way import**を実装する。

- source Kids Questは読み取りのみ
- destination ManaEvoへコピー
- import marker/versionをManaEvo側に保持
- 冪等で、再実行しても重複しない
- source dataは削除・更新しない
- import後はライブ同期しない

優先して引き継ぐ対象は、schema互換を確認したうえで profile / grade / learning mastery / SRS / English progress / streak / relevant settings。Kids Quest旧ゲーム固有のmonster/battle状態は、ManaEvo新仕様へ安全なmappingがない限り自動importしない。

## 7. 回帰ゲート

- Kids Quest source SHA記録
- 学習関連import manifest作成
- Kids Quest主要学習テスト相当がManaEvoでPASS
- 学年/科目/問題数等の主要カウント差分を検査
- knowledgeId等の安定IDが意図せず変わっていない
- 習熟・SRS・進級・学年戻しの境界テストPASS
- 英語/TTSの主要導線PASS
- ManaEvo操作前後でKids Quest storage snapshotが不変
- one-way importを2回実行してManaEvo側データが重複しない

## 8. 禁止事項

- Kids QuestをrenameしてManaEvoにする
- Kids Quest mainへManaEvoコードをcommitする
- 学習問題をゼロから再作成する
- 学習アルゴリズムを別方式へ置換する
- Kids Questの保存キーをManaEvoの通常write先にする
- Kids QuestのService Worker/cacheをManaEvoから削除する
- 移植を理由に既存学習テストを削除・skip・弱体化する

## 9. 完了報告に必須

- Kids Quest source SHA
- ManaEvo destination SHA
- import manifest
- 学習機能でKids Questから意図的に変更した箇所と理由
- 学習回帰テスト結果
- storage分離テスト結果
- Kids Quest既存進捗importの結果（実装した場合）
