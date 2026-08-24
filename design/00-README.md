# Mana Evo 正本設計スナップショット — 2026-08-24

この `design/` は PR #15 で No.001〜238正式masterと戦闘バランスを実装するための**レビュー用正本スナップショット**です。

現在の状態は **SOL REVIEW READY / runtime実装ロック中** です。

別SOLが `SOL-REVIEW-REQUEST-PR15-BALANCE.md` をレビューし、判定が `GO`、または指摘反映後の `GO WITH FIX` になるまで、No.001〜238正式runtime master・XP・技・ボスAI・捕獲・特殊形態の本実装へ進みません。

## レビュー開始順

1. `SOL-REVIEW-REQUEST-PR15-BALANCE.md`
2. `design/12-detailed-balance-design-for-sol-review.md`
3. `design/15-sol-review-validation-report.md`
4. `design/13-monster-growth-master-238.md`
5. `design/13a`〜`13d` の成長CSV（合計238体）
6. `design/14a`〜`14d` の進化比較CSV（合計155遷移）
7. `design/09-special-forms-master.md`
8. `design/11-battle-character-boss-review.md`
9. `design/10-initial-balance-master.md`
10. `design/06-battle-and-progression-design.md`
11. `01-UNRESOLVED-DECISIONS.md`

## 数値・仕様競合時の優先順位

レビュー前は、より新しく詳細化された以下を優先する。

1. `design/12-detailed-balance-design-for-sol-review.md`
2. `design/13*` / `design/14*` の個別master
3. `design/11-battle-character-boss-review.md`
4. `design/09-special-forms-master.md`（特殊形態の具体対象はこの文書が正）
5. `design/10-initial-balance-master.md`
6. `design/06-battle-and-progression-design.md`
7. `design/08-balance-tuning-policy.md`

特に以下は旧資料より新仕様を優先する。

- STAB: **×1.20**
- 初期版: **急所なし / ダメージ乱数なし**
- 戦闘ロール: 8種 `balanced / attacker / speed / guard / hpTank / defenseTank / slowPower / fastGlass`
- 通常敵とボスでreferencePowerを分離
- 初回ストーリー/エリアボスは捕獲不可
- 進化は進化後に4基礎能力が下がらない

## 238体 詳細設計データ

`design/13-monster-growth-master-238.md` を索引とする。

- active: No.001〜238 = **238体**
- 83系列
- 18タイプ
- 155進化 = level 123 / stone 21 / held-item+levelup 11
- No.239はruntime対象外
- 全238体に基礎HP / 攻撃 / 防御 / 素早さ、BST、role、catch情報、進化情報を設定
- 全238体に Lv1 / 5 / 10 / 20 / 30 / 50 / 100 の実能力を算出
- 全155進化で基礎4能力非減少

機械検証結果は `design/15-sol-review-validation-report.md` を正とする。

## 特殊形態 — 確定済み

- `スター覚醒` は不採用。
- 特殊形態は `ギガシンカ` / `キョダイバースト`。
- ギガ12体・バースト8体は実装前設計から復元済みで、再選定しない。
- 具体No./名前/タイプは `design/09-special-forms-master.md` が正。
- ギガとバーストは同一種族で重複なし。
- でんせつ級は対象外。

## 学習部分

- Kids Quest本体は変更しない。
- 完成済みのKids Quest学習部分をMana Evoへ再利用する。
- 学習→チケット→探索/バトル→捕獲→育成→進化の循環を維持する。

## 画像

- 正式キャラ画像は別工程。
- 正式画像が完成済みのキャラは正式画像を使う。
- 未完成キャラはplaceholderで進め、ゲームロジックを画像待ちにしない。

## 本番中のバランス変更

- 子ども個人に合わせ、XP/技威力/捕獲率/敵倍率を裏で自動変更しない。
- 初期値はレビュー・自動シミュレーション・QAを通して共通設定として調整する。
- 数%〜十数%の調整は根拠と回帰結果をPRへ残す。
- ゲーム思想を変える変更はユーザー判断を取る。

## 現在の実装状態

PR #15には以下の**基盤コード**は既に存在する。

- Lv能力値計算
- combatPower
- normal/boss referencePower分離
- 通常敵ソフトスケーリング基盤
- ボス初回snapshot / challenge再戦基盤
- boss snapshot save version 5
- balance単体テスト

一方、以下はSOLレビュー通過後に実装する。

- No.001〜238正式runtime master
- 238体個別base stats / roles / catch / evolution runtime接続
- XP正本式 / Battle XP
- formal moves
- boss予告大技AI
- ギガ/バースト実発動
- 画像registry
- save migration
- `?qa=monster-master`
- 238体validator / 全バランスシミュレーション

設計データがGitHubに揃っていることとruntime実装完了を混同しない。

## レビュー判断待ち

現在の判断待ちは `01-UNRESOLVED-DECISIONS.md` の R1〜R5 に限定する。

- R1 powerTier seed
- R2 手持ち3体Battle XP
- R3 ボス大技への共通 `まもる`
- R4 healer/support由来キャラのcombatRole変換
- R5 にじのわ供給量

それ以外の確定済み仕様を未決へ戻さない。
