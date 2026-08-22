# Mana Evo 実装状況

## 1. 完了済み / CI確認済み
- PR #3 HEAD: `1281287a64b36f897e617da72fd2b152155fdc6b`
- GitHub Actions: Test + Build = SUCCESS
- Kids Quest本体は未変更
- Kids Quest学習資産を `src/kids-quest-study/` へコピー済み
- コピー元Kids Quest SHAは `src/kids-quest-study/SOURCE_COMMIT.txt` に固定
- Kids QuestのSRSと難易度調整はMana Evo実行系から直接利用
- 基本学習5問 → バトルチケット3枚
- 自由学習の正解 → チケット+1
- 18タイプ/相性表
- 4技
- 手持ち3体
- 戦闘中交代
- 固定Lv帯のステージ敵
- HPを削って捕獲へ移る縦切り
- ★★★★捕獲 → 手持ち/ボックス/図鑑
- XP/レベルアップ
- レベル通常進化
- 旧v1セーブから新版への移行
- `スター覚醒` を正式実装から除外
- 正式キャラ未確定のためプレースホルダー表示

## 2. コピー済みだが、Mana Evo実行系へ全接続していない
`src/kids-quest-study/` には以下を含む。
- 全教科contentデータ
- hard問題
- 学年定義
- 漢字データ
- 授業カード
- 書き順データ
- learningUnits
- review/SRS
- English/TTS系
- 問題表示コンポーネント
- 書字コンポーネント
- 自由学習画面
- 章末テスト画面
- Lesson/Review画面

現状はこの全てをMana Evoの現行UIから呼んでいるわけではない。レビューでは「コピー済み = 完全移植済み」と誤認しないこと。

## 3. 現在プレースホルダー/仮値
- キャラクター名/画像
- 種族構成
- 進化系列データ
- 敵配置
- ステージ数
- HP/攻撃/技威力
- XPカーブ
- 捕獲率
- 一部の報酬量

## 4. 未実装または次工程
- Kids Quest全問題生成器のMana Evo UI接続
- 授業→問題の導線
- 書字/トレース
- 英語音声の正式接続
- 章末/学年試練
- 通常進化の「いし」「もちもの+レベルアップ」
- ギガシンカ実戦処理
- キョダイバースト実戦処理
- ギガ/バースト対象種族の正式マスタ
- 正式な捕獲用「わ」4種類の経済/入手ルール完全実装
- ワールド/エリア本実装
- 正式キャラクター画像への差替え

## 5. 重要な設計境界
- `src/kids-quest-study/`: Kids Questからコピーした学習スナップショット
- `src/study/`: Mana Evo実行系の学習接続層
- `src/game/`: Mana Evo独自ゲーム
- `speciesId`: キャラクター見た目/名称を後から差し替える境界
- `unitId` / `itemKey`: Kids Quest学習互換の境界

この境界を崩して、Kids QuestゲームロジックをMana Evoへ持ち込まないこと。
