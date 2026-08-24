# Mana Evo 正本設計スナップショット — 2026-08-24

この `design/` は PR #5 以降の実装レビューで仕様基準を固定するための**レビュー用正本スナップショット**です。

## 優先順位

1. このスナップショットに明記された、ユーザー承認済みの決定
2. `sol_game_review_for_claude_v3.md` の最新訂正方針
3. `sol_game_review_for_claude_v2.md`
4. 上記と矛盾しない最新モック
5. PR内の実装状況文書

PRの `UNRESOLVED` は設計を上書きしません。過去に確定した仕様が後続のレビュー資料で一時的に未決扱いされていても、根拠資料から復元できたものは確定仕様へ戻します。

## PR #15 — SOLレビュー中の優先順位

**No.001〜238 runtime実装は、別SOLの設計レビュー完了までロックします。**

レビュー開始点はリポジトリ直下 `SOL-REVIEW-REQUEST-PR15-BALANCE.md`。

実装・レビューでは以下を優先して参照します。

1. `design/12-detailed-balance-design-for-sol-review.md`
   - Lv成長 / BST / 8ロール / XP / 技 / 通常敵 / ボス / 捕獲 / にじのわ / 特殊形態を統合した最新詳細設計
   - ユーザー承認済みの「初回ストーリーボス捕獲不可→撃破後入手導線」「にじのわ長期達成中心」「エリア難度の基本割当」を含む
   - R1〜R5は別SOLに意見を求めるレビュー論点
2. `design/13-monster-growth-master-238.md` + `13a`〜`13d` CSV
   - No.001〜238全体の設定 / role / base4能力 / BST / 進化 / Lv1/5/10/20/30/50/100能力値
3. `design/14a-evolution-balance-area1.csv`〜`14d-evolution-balance-area4.csv`
   - 155進化遷移の能力差・トリガー監査
4. `design/15-sol-review-validation-report.md`
   - 元資料照合・238体完全性・能力式・BST・進化非減少の機械検証結果
5. `design/09-special-forms-master.md`
   - ギガ12体 / キョダイバースト8体の具体No./名前/タイプ、取得物、効果、排他条件
6. `design/11-battle-character-boss-review.md`
   - 238体投入前レビューで確定したnormal/boss referencePower分離、XP方針、8ロール、技帯域、ボスAI等
7. `design/10-initial-balance-master.md`
   - 初期実装値と調整トリガーの旧統合正本。12/11と競合する箇所は12→11を優先
8. `design/06-battle-and-progression-design.md`
   - 基礎バトル/育成/敵ボス構造
9. `design/08-balance-tuning-policy.md`
   - バランス調整運用の補足
10. `01-UNRESOLVED-DECISIONS.md`
   - 本当に残っている未決・SOLレビュー待ちだけ。確定済み仕様を未決へ戻さない

## 重要

- `スター覚醒` は不採用。現行仕様へ再導入しない。
- 特殊形態は `ギガシンカ` / `キョダイバースト`。
- ギガ12体・バースト8体は実装前設計から復元済みで、再選定しない。
- Kids Quest本体は変更しない。学習部分のみMana Evoへ再利用する。
- 正式キャラ画像は別工程。正式画像が完成済みのキャラは正式画像、未完成キャラはplaceholderで進め、ゲームロジックを画像待ちにしない。
- 本番中に子ども個人へ合わせてXP/技威力/捕獲率/敵倍率を自動変更しない。
- **SOL判定 `GO`、または指摘反映後の `GO WITH FIX` になるまでは、13系CSVをruntime masterへコピーしない。**

## SOLレビュー候補の現在値

- active: No.001〜238 exactly
- 83系列 / 18タイプ
- 155進化 = level123 / stone21 / held-item+levelup11
- ギガ12 / バースト8 / 重複0
- Lv能力式: `HP=floor(baseHP*Lv/50)+Lv+10`、他3能力=`floor(base*Lv/50)+5`
- 通常敵: 現在の手持ちだけでソフトスケーリング
- ボス: 初回戦力snapshot固定、通常再戦は固定、チャレンジ再戦だけ再スケール
- 初回ストーリーボス: `catchable:false`、撃破後に同種入手導線
- にじのわ: 100%、通常章末には配らず長期達成報酬中心

詳細数値は12〜15を正とする。

## 現在の実装状態に関する注意

PR #15には戦闘バランス基盤の一部コードが既に存在しますが、**今回作成したNo.001〜238の詳細成長マスターはまだruntimeへ投入していません。** 正式ID migration、QAモード、238体画像registry、技マスター、ボスAI、特殊形態実動作も未完了です。

設計文書に238体ルール・具体値があることと、238体runtime実装が完了していることを混同しないでください。

## 元資料スコープ

元 `families.mjs` をflattenすると239体あり、No.239は `シラユキヒメ`。現行ManaEvoの有効範囲はNo.001〜238なので、No.239は元資料保全のみでactive masterへ入れません。

元資料と今回238体CSVの照合結果は `design/15-sol-review-validation-report.md` に記録します。
