# Kids Quest → Mana Evo 学習基盤 移植台帳

この文書は「Kids Quest に引きずられてゲーム全体をコピーする」のではなく、学習資産だけを安全に再利用するための台帳です。

## 原則

- 移植元: `syoudai0514/kids-quest` `main`
- 移植先: `syoudai0514/mana-evo`
- Kids Quest 本体は変更しない
- `itemKey` / `unitId` を互換境界として使う
- バトル、モンスター、図鑑、武器などのゲーム固有実装はコピーしない
- キャラクターアートは Mana Evo 側で別管理し、現段階では placeholder を使う

## 実移植済み

| Kids Quest | Mana Evo | 状態 | 備考 |
|---|---|---|---|
| `src/engine/srs.js` | `src/study/srs.js` | 移植済み | 0/1/3/7/14/30日のライトナー式SRS互換 |
| `src/engine/difficulty.js` | `src/study/difficulty.js` | 移植済み | 直近正誤による難易度UP/DOWN・hintLevel互換 |
| `itemKey` / `unitId` の考え方 | `src/study/questions.js` / `engine.js` | 互換化済み | 全問題移植の受け皿 |
| 単元MASTER条件 | `src/study/engine.js` | 実装済み | 4回挑戦 / 初回正解3 / 別日2 / 2形式 |
| 苦手・得意に応じる学習 | `src/study/engine.js` | 実装済み | Kids Quest difficulty の skill を利用 |

## Mana Evo 側で新規実装

- 基本学習5問 → バトルチケット3枚
- 自由学習1問正解 → バトルチケット1枚（回数上限なし）
- おすすめ / 苦手克服 / 得意を伸ばす / チャレンジ
- 学習報酬 → Mana / スターのかけら
- バトルチケット消費 → バトル → XP / レベル / 通常進化
- スター覚醒 / ギガ進化 / キョダイバーストの解放判定
- Mana Evo 専用 UI / セーブ

## 現在の縦切りで未移植の Kids Quest 学習資産

以下は「捨てる」のではなく、互換レイヤーへ次に載せる対象です。

- 全学年の問題データ
- `learningUnits.js` の全単元台帳
- `lessons.js` の「まず教えてから解く」授業カード
- 国語の漢字・読解・書字データ
- 算数の全kindと学年別問題生成
- 英語のネイティブ音声キャッシュ / 発音系
- 理科・社会・生活・道徳コンテンツ
- 書き順 / トレース
- 章の試練 / 学年最終試練
- 復習画面・保護者向け学習状況

## 移植ゲート

全問題データを移すときは、以下を満たすまで「移植完了」と呼ばない。

1. Kids Quest の `unitId` と Mana Evo の単元台帳に欠落がない
2. 学年別の問題数・教科数を自動検証する
3. SRS の旧データ互換テストを通す
4. 難易度調整の上げ下げを自動テストする
5. 基本学習の報酬は1日1回だけ
6. 自由学習は正解時だけチケット+1
7. 単元MASTER報酬は初回達成時だけ
8. 学習進捗とゲーム進捗を別データとして保存する
9. 正式キャラ画像の有無が学習ロジックに影響しない
10. `npm test && npm run build` が成功する
