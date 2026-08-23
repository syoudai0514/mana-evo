# Kids Quest → Mana Evo 学習基盤 移植台帳

この文書は「Kids Quest に引きずられてゲーム全体をコピーする」のではなく、学習資産だけを安全に再利用するための台帳です。

## 原則

- 移植元: `syoudai0514/kids-quest` `main`
- 移植先: `syoudai0514/mana-evo`
- Kids Quest 本体は変更しない
- `src/kids-quest-study/` を学習専用ソーススナップショットとして保持する
- `itemKey` / `unitId` を互換境界として使う
- battle / monsters / weapons / missions 等のゲーム固有資産はコピーしない
- キャラクターアート・正式名称は Mana Evo 側で別管理し、現段階では placeholder を使う

## コピー済み学習資産

Kids Quest `main` の学習専用資産は `src/kids-quest-study/` へ機械的にコピー済みです。コピー元の正確なcommit SHAは `SOURCE_COMMIT.txt` に保存します。

含むもの:

- `data/content/**` の各教科学習データ
- 学年、漢字、授業カード、書き順
- SRS、難易度、learningUnits、review、trial、英語、TTS等の学習エンジン
- 問題表示、書字、英語発音、自由学習、章末問題等の学習UI候補

含めないもの:

- battle / battleTickets
- monsters / monsterAssets / monsterMaster / monsterProgress
- weapons
- missions
- planets
- その他 Kids Quest 固有のゲーム進行

## Mana Evo実行系へ接続済み

| Kids Quest資産 | Mana Evo | 状態 |
|---|---|---|
| `engine/srs.js` | `src/study/srs.js` | スナップショットを直接re-exportして実行 |
| `engine/difficulty.js` | `src/study/difficulty.js` | スナップショットを直接re-exportして実行 |
| `itemKey` / `unitId` | `src/study/questions.js` / `engine.js` | 互換境界として利用 |
| 単元MASTER条件 | `src/study/engine.js` | Kids Quest `unitReady`互換。4回挑戦 / 初回正解3 / 別日2 / unitごとのitemRequirement |
| 苦手・得意に応じる学習 | `src/study/engine.js` | Kids Quest difficulty skillを利用 |

## コピー済みだが現行UIへ段階接続中

以下はファイル自体はすでに `src/kids-quest-study/` にあります。現在の最小縦切りではまだ全件をMana Evo画面へ接続していません。

- 全学年・全教科の問題生成
- `learningUnits.js` の全単元台帳
- `lessons.js` の「まず教えてから解く」授業カード
- 漢字・読解・書字・書き順
- 算数の全kindと学年別問題生成
- 英語ネイティブ音声キャッシュ / 発音系
- 理科・社会・生活・道徳
- 章の試練 / 学年最終試練
- 復習画面・保護者向け学習状況

これは「未コピー」ではなく「コピー済み・接続待ち」です。

## Mana Evo側の新規ゲーム実装

- 基本学習5問 → バトルチケット3枚 + ほしのわ3個
- 自由学習1問正解 → バトルチケット1枚（daily完了後・回数上限なし）
- 追加学習3正解ごと → ほしのわ1個、MASTER → 上位の「わ」
- マップ / 固定Lvステージ
- 18タイプ / 4技 / タイプ一致 / タイプ相性 / 手持ち3体 / 交代
- 敵HP50%以下から「わ」で捕獲 / 4段階★判定
- ボックス / 図鑑 / 通常進化 / 進化までの残りレベル表示
- 正式特殊変身名: ギガシンカ / キョダイバースト
- `スター覚醒` は現行最終レビューにないため不採用

## 接続完了ゲート

Kids Quest学習資産を「Mana Evoへ完全接続済み」と呼ぶには、以下を満たす。

1. Kids Quest の `unitId` と Mana Evo の単元台帳に欠落がない
2. 学年別の問題数・教科数を自動検証する
3. SRS の旧データ互換テストを通す
4. 難易度調整の上げ下げを自動テストする
5. 基本学習の報酬は1日1回だけ
6. 自由学習は正解時だけチケット+1
7. 単元MASTER報酬は初回達成時だけ
8. 学習進捗とゲーム進捗を別データとして保存する
9. 正式キャラ画像の有無が学習ロジックに影響しない
10. 全学年の授業・問題・書字・音声・試練がMana Evo画面から到達可能
11. iPhone実機で主要導線を確認する
12. `npm test && npm run build` が成功する
