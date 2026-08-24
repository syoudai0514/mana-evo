# ManaEvo 238体 正式化進捗

最終更新: 2026-08-24 14:56 JST
作業ブランチ: `chatgpt/monster-master-238`
PR: #15 `feat: 238体正式マスターと戦闘バランス基盤`

## 今回のゴール

- No.001〜No.238 を正式モンスターIDとして一元管理する。
- 名前・属性・進化系列・HP・こうげき・ぼうぎょ・すばやさ・レベル成長・進化条件・出現・捕獲をゲームロジックへ接続する。
- 正式画像が完成済みのキャラは正式画像、未完成のキャラはplaceholderを使う。画像待ちで育成・進化を止めない。
- 既存セーブの旧speciesIdを正式IDへmigrationする。
- Kids Quest由来の学習部分は変更しない。
- PR Previewには `?qa=monster-master` の専用QA状態を用意し、基礎キャラ取得・進化条件達成・必要進化アイテム所持済みで確認できるようにする。

## 正本

- バトル/育成: `design/06-battle-and-progression-design.md`
- バランス初期値/調整運用: `design/10-initial-balance-master.md`（`08` と競合時はこちら優先）
- ギガ/バースト対象: `design/09-special-forms-master.md`
- 未決事項: `01-UNRESOLVED-DECISIONS.md`
- 有効範囲: No.001〜238。No.239は元資料に保全するが現行ゲームでは有効化しない。

## 復元済みの特殊形態対象

### ギガシンカ 12体

No.003 ジュランガ / 006 グレンドウ / 009 ワダツラ / 051 マシュランテ / 054 メンタリオン / 072 ライテイガ / 090 センガンジ / 121 ヒョウガルド / 153 キュウビガミ / 156 ガードヴァルツ / 159 イワガミラ / 186 ニジリュウガ

### キョダイバースト 8体

No.060 アカリガルド / 066 ゲンコツヅラ / 133 カイテイリオ / 136 センジュガ / 142 カブトレクス / 165 テラガイア / 171 フドウザン / 174 テンショウガ

復元コミット: `7116ebdb84a2b91021d81623b0723772117a1d73` (`design: ギガ12体とバースト8体の対象を正本へ復元`)

## 実装進捗（コード投入済み基準）

| 工程 | 状態 | 実態 |
|---|---|---|
| 作業ブランチ/PR/進捗台帳 | ✅ | PR #15 Draft / open |
| バトル正本更新 | ✅ | `design/06` |
| バランス初期値・調整運用 | ✅ | `design/10`、`design/08` |
| ギガ12/バースト8の対象復元 | ✅ | `design/09` |
| Lv能力値計算 | ✅ | `src/game/balance.js` |
| combatPower/referencePower | ✅ | `src/game/balance.js` |
| 通常敵ソフトスケーリング基盤 | ✅ | engine接続済み |
| ボス初回snapshot固定基盤 | ✅ | engine + save v5 |
| チャレンジ再戦再スケーリング基盤 | ✅ | balance基盤あり |
| No.001〜238正式master本体 | ⬜ | **まだPRに未投入** |
| 238体の正式基礎値/進化条件 | ⬜ | ルールは確定、master本体未投入 |
| ギガ/バーストflagを正式IDへ反映 | ⬜ | 対象は確定、master本体未投入 |
| 正式画像/placeholder registry | ⬜ | 未投入 |
| 旧19 species→正式ID migration | ⬜ | 未投入 |
| `?qa=monster-master` | ⬜ | 未投入 |
| 238体validator | ⬜ | バランス基盤テストのみ投入済み |
| main merge / Production | ⬜ | 未実施 |

## 初期バランス値

`design/10-initial-balance-master.md` を正とする。

- XP累計: `round(6 * (Lv - 1)^1.9)` / Lv上限100
- 標準XP目安: 最低210 / 標準350 / がんばった日600
- Lv能力: HP=`floor(baseHp*Lv/50)+Lv+10`、他=`floor(base*Lv/50)+5`
- 基準BST: 第1形態200 / 中間270 / 最終340 / 単体最終380
- 技威力帯: 40 / 60 / 80 / 100、バースト110
- STAB: ×1.5、急所1/16×1.5、乱数0.90〜1.00
- 捕獲: HP50%以下、最大3投、ほし1.00/ぎん1.20/きん1.50/にじ100%、非にじ92%上限
- 通常敵: weak 0.82 / normal 0.92 / strong 1.02 / rare 1.065 / elite 1.12
- ボスRank C/B/A/S/EX: targetPower 1.02/1.08/1.14/1.20/1.28、HP 1.20/1.35/1.50/1.65/1.80

調整担当は実装担当。238体master接続、進化/技/捕獲/敵設定変更、main merge前、再現可能な実機違和感をトリガーに自動シミュレーションと回帰テストを実施し、数値変更はPRで記録する。本番中に子ども個人へ合わせて裏で自動調整しない。

## 現在のCI / Preview

PR head `a7963d32c15fe600dd38bbce9889605010ad0060` 時点:

- Vercel Preview: ✅ success
- GitHub Actions CI #113: ❌ failure
- Test: 78件中75 PASS / 3 FAIL
- Build: Test失敗のため未実行

3件のFAIL:

1. `tests/game.test.js` の「fixed stage / enemy Lv5」期待値が、承認済みソフトスケーリング仕様と不一致（actual Lv53）。
2. legacy save version期待値が4のまま。現実装はsave version 5。
3. `tests/learning.test.js` の「fixed-level stage Lv5」期待値が、ソフトスケーリング仕様と不一致（actual Lv4）。

新設したLv能力・combatPower・ボスsnapshot固定・チャレンジ再戦のバランステストはPASSしている。次担当は旧仕様テストを新正本へ更新し、CIをGreenに戻してから238体master接続を進める。

## QA Preview 完成条件

`?qa=monster-master` は通常セーブとは別にする。

- 全基礎種を取得済み。
- 各進化遷移の進化前個体をBOXへ用意。
- レベル進化は必要Lv到達済み。
- いし進化は必要石を所持。
- もちもの+Lvアップ進化は必要品所持/装備/必要Lv達成済み。
- ギガ12体は最終形 + ギガキー + 該当ギガコア所持済み。
- バースト8体は最終形 + 該当バーストのしるし所持済み。
- 全ステージ開放、捕獲用「わ」とチケットを十分所持。
- 正式画像完成済みキャラとplaceholderキャラを同じ正式masterで確認できる。

## 次のゲート

1. CIの旧固定Lv/旧save-versionテスト3件を正本仕様へ更新してGreen化。
2. No.001〜238正式master本体をPRへ投入。
3. 238体のbase stats / role / rarity / 進化条件を接続し、155進化遷移validatorを通す。
4. `gigaEligible` 12体 / `burstEligible` 8体を正式IDでmasterへ反映。
5. 画像registry・legacy migration・QAモードを実装。
6. `design/10` のmain merge前必須バランスゲートを全実行。
7. GitHub CI / Vercel Preview / iPhone QAを確認。
8. レビュー完了後にmain merge → Production確認。
