# Mana Evo（マナエボ）

Kids Quest の**完成済み学習基盤を正本としてそのまま実行し**、ゲーム部分だけを ManaEvo として発展させるリポジトリです。

## 絶対方針

- `syoudai0514/kids-quest` 本体は変更しない
- **学習フロー・問題・単元・難易度・復習・授業・自由学習・しれん・学年進行・先取り・音声は Kids Quest を正本とし、ManaEvo 都合で簡略化しない**
- バトル／捕獲／育成／進化は ManaEvo 専用として実装する
- Kids Quest 由来の学習仕様を変更する場合は、実装より先に仕様変更として明示して合意する

## 学習実行系

ManaEvo の「まなぶ」は `src/study` の初期縦切り簡易実装ではなく、`src/kids-quest-study/` の Kids Quest 学習ランタイムを直接実行する。

実行接続済み:

- `ActivityPlayer`：全学年の問題生成、アダプティブ難易度、ヒント、誤答補強、「わからない」、トレース、英語
- `LessonScreen`：新単元・苦手単元の「まず教えてから解く」授業
- `ReviewScreen`：ライトナー式SRSによる「とっくん」
- `FreeStudyScreen`：好きな教科の自由勉強（チケットなし）
- `ChapterTestScreen`：ほしのしれん。1日6問、別日2回＝12問中9問＋必須単元条件
- `EnglishDictionaryScreen`：英語ずかん、発音、単語別4問練習
- 学年 `grade / gradeMax`、必須単元台帳、保護者による先取り解放、選択学年の下限制御
- 通常／むずかしいモードを別の習熟度・復習台帳で管理
- 書字進捗、英単語・フレーズ・アルファベット進捗、授業履歴、教科別正解率
- 子どもプロフィール、学習データのバックアップ／復元
- つくよみちゃんの端末内ニューラル音声（`piper-plus` + `onnxruntime-web`、モデルを端末保存、文章は外部TTSへ送信しない）

`SOURCE_COMMIT.txt` はコピー元 Kids Quest main のSHAを固定する。現在は `ddfe594789890aef6958bf169bf50dccb72f818e`。

`tests/full-kidsquest-runtime.test.js` は、ManaEvoの実行Appが旧 `src/study/engine.js` / `src/study/questions.js` を再び使わないこと、主要学習画面・状態・つくよみちゃん・5教科ミッションを自動検証する。

> `src/study/` は旧セーブ互換と回帰テストのため残す legacy 実装であり、**画面の実行経路からは使用禁止**。

## 基本ループ（Kids Quest 基準）

1. 今日の**5つの教科タスク**を学習する
   - 国語・算数: 各5問
   - 通常教科: 各4問
   - 道徳: 該当日は2問
2. 5タスクをすべて完了すると、バトルチケット3枚 + ほしのわ3個
3. 今日の基本を終えた日だけ新規バトル開始可能
4. 18タイプ・4技・交代を使ってバトル
5. HPを減らして4種類の「わ」で捕獲（最大3投）
6. もっと学びたい場合は**自由勉強**。好きな教科を選べるがチケットは出ない
7. もっとバトルしたい場合は**追加チャレンジ3問**。3問中2問正解でチケット+1
8. 単元MASTER／むずかしいMASTERで学習報酬をゲーム側へbridgeする

### 「わからない」を消さない

Kids Quest と同じく、問題には `🤔 わからない（こたえを みる）` を残す。

- 適当に選択肢を押す代わりに「わからない」を選べる
- 記録上は誤答として扱う
- 正解と解説を見せる
- 再回答／補強／後日の復習につなげる

## チケット

- 基本学習: 5教科タスクをすべて完了して3枚
- 追加チャレンジ: 3問中2問正解で1枚
- 自由勉強: 0枚
- 獲得日を含む7日間保持
- 期限の近いものから消費
- 新規バトル開始時に1枚reserveして `activeBattle` に出所を保存
- 敗北・明示的な「やめる/逃げる」: 1枚返却
- 勝利・捕獲成功: 消費確定
- reload / Safari終了 / crash: 同じ `activeBattle` を再開し追加消費しない

## 「わ」

| 種類 | 初期性能 |
|---|---:|
| ほしのわ | ×1.00 |
| ぎんのわ | ×1.20 |
| きんのわ | ×1.50 |
| にじのわ | 100% |

非にじは92%上限。「わ」は期限なし。

## 2026-08-23 P0回帰の経緯

初期縦切りで、Kids Quest 学習ランタイムを接続せず、ManaEvo 側に「全科目合計5問」「自由学習1問正解＝チケット+1」という簡略版を新設していた。その後 Kids Quest 学習ソースをコピーしても、画面は簡略版 `src/study` を実行し続けていたため、授業・SRS・しれん・先取り・つくよみちゃん等が使われていなかった。

この状態をP0/要件レベルの不具合として修正し、実行routing・状態管理・音声依存を Kids Quest 学習基盤へ切り替えた。以後、旧簡易学習ランタイムを画面から再接続しないことをCIで固定する。

## バトル・育成

- 18タイプ、手持ち3体、場に1体、各4技、交代可能
- 敵はステージ固定レベル帯
- 個体別HP保持。交代全回復なし
- 捕獲失敗は敵ターン
- 通常進化は `level / stone / held_item_level`
- 石・もちものをステージ報酬から獲得し、詳細UIから進化可能

## 特殊形態

採用:

- **ギガシンカ**
- **キョダイバースト**

不採用:

- **スター覚醒**

ギガキー/種族ギガコア/バーストのしるしは永久・非消費の所有権として扱う。ギガシンカの基本取得ループ（最終進化→専用チャレンジ/ボス→勝利→種族コア→永久解放）と、キョダイバーストの1戦1回・3ターン・ギガとの同時使用不可は既決。

## Monster Art / Asset Release

238体のper-ID Monster Artは2026-08-31のfinal closeoutで全active speciesがFORMALになっています。Active scopeは `m001-m238`、`m239`は除外です。

現在状態を判断するときは、チャット記録や古い進捗文書ではなく `design/current/monster-asset-manifest.json` と現在のProduction revisionを確認してください。

運用資料:

- 現在状況: [`docs/monster-production-status.md`](docs/monster-production-status.md)
- 最終引き継ぎ: [`docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`](docs/MONSTER-ART-FINAL-HANDOFF-20260831.md)
- 今後の差し替え手順: [`docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`](docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md)
- 実務Tips/失敗パターン: [`docs/MONSTER-ART-TIPS-AND-PITFALLS.md`](docs/MONSTER-ART-TIPS-AND-PITFALLS.md)
- Global style / final image contract: [`design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`](design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md)
- GitHub binary handoff: [`design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`](design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md)
- Candidate/Formal tooling reference: [`design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md`](design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md)

大規模238体再生成フェーズは終了しており、今後はゲーム内・実画像レビューで具体的な問題が見つかったspeciesだけをtargeted maintenanceします。

画像作業では `GENERATED/REPAIRED → VISUAL QA → ART READY → REGISTERED → FORMAL → MAIN → DEPLOYED → LIVE VERIFIED` を別gateとして扱い、「画像ができた」「FORMALになった」「本番配信済み」を混同しません。

## 開発

Node.js 24以上を使用する。

```bash
npm install
npm test
npm run build
```

CIでは `npm audit --audit-level=high`、全テスト、production buildを必須にする。

### ゲームコンセプト正本

ワールド・進化・育成の最新方針は [`design/20-world-map-evolution-progression.md`](design/20-world-map-evolution-progression.md) を参照してください。
