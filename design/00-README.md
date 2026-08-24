# Mana Evo 正本設計スナップショット — 2026-08-24

この `design/` は PR #15 で No.001〜238正式masterと戦闘バランスを実装するための**レビュー用正本スナップショット**です。

現在の状態は **SOL REVIEWED / NO-GO / runtime実装ロック継続** です。

SOL全力レビュー結果は `design/16-sol-pr15-full-review.md`。P0/P1修正・再バリデーション後に判定を `GO WITH FIX` 以上へ更新するまで、No.001〜238正式runtime master・XP・技・ボスAI・捕獲・特殊形態の本実装へ進みません。

## レビュー実施順

`SOL-REVIEW-REQUEST-PR15-BALANCE.md` の指定どおり、以下を順番に確認済み。

1. `design/12-detailed-balance-design-for-sol-review.md`
2. `design/15-sol-review-validation-report.md`
3. `design/13-monster-growth-master-238.md`
4. `design/13a`〜`13d` の成長CSV（実体7ファイル、合計238体）
5. `design/14a`〜`14d` の進化比較CSV（合計155遷移）
6. `design/09-special-forms-master.md`
7. `design/11-battle-character-boss-review.md`

レビュー結果・P0/P1/P2・R1〜R5回答は `design/16-sol-pr15-full-review.md` を参照。

## 数値・仕様競合時の優先順位

SOLレビュー後は以下を優先する。

1. `design/16-sol-pr15-full-review.md` — 今回レビューで確定した判断と実装前ブロッカー
2. `design/12-detailed-balance-design-for-sol-review.md`
3. `design/13*` / `design/14*` の個別master
4. `design/11-battle-character-boss-review.md`
5. `design/09-special-forms-master.md`（特殊形態の具体対象はこの文書が正）
6. `design/10-initial-balance-master.md`
7. `design/06-battle-and-progression-design.md`
8. `design/08-balance-tuning-policy.md`

特に以下は旧資料より新仕様を優先する。

- STAB: **×1.20**
- 初期版: **急所なし / ダメージ乱数なし**
- 戦闘ロール: 8種 `balanced / attacker / speed / guard / hpTank / defenseTank / slowPower / fastGlass`
- 通常敵とボスでreferencePowerを分離
- 初回ストーリー/エリアボスは捕獲不可
- 進化は進化後に4基礎能力が下がらない
- `held_item_levelup`: **固定Lv条件なし。指定アイテム装備後の次の実LvUPでReady**（design/11の旧「必要Lv」表記は修正対象）

## SOLレビューで見つかった実装前ブロッカー

詳細は `design/16-sol-pr15-full-review.md`。

### P0

1. `catchRank` の正本文言と13系CSV生成値が不一致。現行優先順位では `design/12` の「同系列第1形態基準」を正としてCSV再生成 + validator追加が必要。
2. `held_item_levelup` の固定Lv有無が `design/11` と `design/12` / 14系CSVで矛盾。最新 `design/12` の「固定Lvなし」へ統一が必要。

### P1

1. stone21 / held-item11 の最速入手時点を正本化しないと進化体験日数を検証できない。
2. 通常敵の常時完全追従ソフトスケールではLv成長実感が弱くなるため、既クリア通常戦の成長実感ゲートが必要。
3. formal move masterに高威力1択化を防ぐ非劣位技ルールが必要。
4. healer由来の一部個体は説明文と `hpTank` 体験がズレるため、formal move masterでidentity確認が必要。

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

機械検証結果は `design/15-sol-review-validation-report.md`。SOLによる設計判断は `design/16-sol-pr15-full-review.md` を正とする。

## R1〜R5 結果

- **R1 GO:** `powerTierV1 = source catchRarity` を初期seedとして採用。現時点で印象ベースの個別補正はしない。
- **R2 GO:** 戦闘開始時の手持ち最大3体へ全員100% Battle XPを採用。
- **R3 GO:** 共通 `まもる`（成功100%、次ターン連続不可）を採用。
- **R4 FIX:** 8role変換方針は維持するが、No.041 / 050 / 098 / 209 / 210 / 235ほかをmove identityレビュー対象とする。
- **R5 GO:** にじのわは各学年初回+1 / 全エリア後EX初回+1 / ランダムなし / 章末なし。

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

一方、以下はSOLレビューP0/P1解消後に実装する。

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

## runtime実装ロック解除条件

1. `design/16-sol-pr15-full-review.md` のP0を解消
2. P1受入条件を設計へ追加
3. 238体 / 155進化 / catchRank / item evolution / normal growth / formal movesを再バリデーション
4. SOL判定を `GO WITH FIX` 以上へ更新

それまでは正式runtime masterへ進まない。
