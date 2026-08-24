# SOL 全力レビュー追補 — PR #15 実装前詳細設計

更新日: 2026-08-24
対象PR: #15 `chatgpt/monster-master-238`
位置づけ: `design/16-sol-pr15-full-review.md` の**追補・修正正本**

## 判定

**NO-GO 継続 / runtime実装ロック継続**

`SOL-REVIEW-REQUEST-PR15-BALANCE.md` の指定順どおり、設計書 → 238体成長CSV → 155進化比較CSV → 特殊形態 → バトル/ボス設計まで確認した。

238体の基礎4能力、BST、Lv成長式、155進化の4能力非減少、XP曲線、ボスsnapshot思想、ギガ12体/バースト8体のID割当は大枠で良い。

ただし、実装者が一意に解釈できない正本衝突と、人間レビューでしか見つからないidentity不整合が残っているため、まだruntimeへ投入しない。

この文書は `design/16` より新しい。**下記で明示的に変更した判断は、この文書を優先する。** それ以外の `design/16` の指摘は維持する。

---

## 1. P0 — catchRankは「各形態自身のcatchRarity」を正とする

### 1.1 design/16から判断を修正する

`design/16` は、`design/12` の文章を優先して「同系列第1形態のrank + stage補正」で13系CSVを再生成する方針としていた。

しかし `design/12` 自身が master schema で次を明記している。

```text
catchRarity // 捕獲難度軸
powerTier   // 戦闘力予算軸。catchRarityとは別
```

各形態に別々の `catchRarity` を保持している以上、その値を捕獲難度計算で無視するのはデータモデルと矛盾する。また中間形態は `wildCatchable=True` の個体が多く、各形態のrare/epic差は実際の捕獲体験へ反映されるべき。

したがって、**13系CSVの現在の生成意味を正とし、design/11・design/12の文章側を同期する。**

### 1.2 正式catchRank生成式

```text
rarityRank(common) = 1
rarityRank(rare)   = 2
rarityRank(epic)   = 3
rarityRank(legend) = 4

catchRank = min(5, rarityRank(monster.catchRarity) + (stage - 1))
```

例:

- No.010 common stage1 → 1
- No.011 common stage2 → 2
- No.012 rare stage3 → 4
- No.064 common stage1 → 1
- No.065 rare stage2 → 3
- No.066 epic stage3 → 5
- No.235 legend standalone stage1 → 4

`catchable:false` / `wildCatchable:false` は捕獲不可判定を優先し、catchRankを捕獲不可の代用品にしない。

### 1.3 必須validator

全238体について上式を再計算しCSVと一致させる。不一致1件でもruntime master投入不可。

**この修正では13系CSVをcatchRank理由で再生成しない。文章正本をCSVへ合わせる。**

---

## 2. P0 — No.142 の特殊形態マスター名が238体正本と不一致

`design/09-special-forms-master.md` はキョダイバースト対象 No.142 を **カブトレクス** と記載している。

一方、238体正式成長CSVでは:

```text
No.142
id = m142
name = ヘラクレオン
family = カブトチ
burstEligible = True
```

となっている。

`m142` という正式IDが同じなので発動対象のID自体は変えない。しかし、名前が二重のままだと以下が壊れる。

- 図鑑表示
- 専用チャレンジ/ボス名
- バースト解放メッセージ
- 攻略本/手順書
- QA期待値
- 画像・キャラ名の紐付け

### 正式判断

**現行238体masterの正式名 `ヘラクレオン` を正とする。**

`design/09`、PR本文、今後のformal masterで No.142 / `m142` は `ヘラクレオン` に統一する。

対象IDは変更しない。キョダイバースト8体の構成も変更しない。

---

## 3. P1 — `combatRoleV2` を「実能力を表すロール」として扱うには追加検証が必要

進化時に4能力非減少を保証する方式は正しい。一方、前形態の能力をfloorとして残すため、進化先ロールを大きく変更すると、**ロール名と実際の能力配分が一致しない**ことがある。

明確な例:

```text
No.142 ヘラクレオン
combatRoleV2 = fastGlass
baseHP       = 106
baseAttack   = 87
baseDefense  = 111
baseSpeed    = 63
```

`fastGlass` なのに防御が最大で、素早さも低い。これは単なる数値誤差ではなく、前形態 No.141 のguard系能力をfloorとして継承した結果。

### 正式対応

1. `combatRoleV2` は**子ども向けUIの表示ラベルに使わない**。内部の成長配分/設計メタデータとする。
2. 実戦の強み判定・敵シミュレーションは必ず実能力値から行う。
3. role変更系列に対するsemantic validatorを追加する。
4. No.142 は個別レビュー必須。`fastGlass` のまま「高速紙耐久キャラ」として扱うことは禁止。

### semantic validator最低条件

厳密な全ロール同型化はしないが、少なくとも以下を検出する。

```text
fastGlass:
  baseSpeed > baseDefense
  かつ baseDefense / BST <= 0.22

slowPower:
  baseSpeed が4能力中最低

hpTank:
  baseHP >= baseDefense

defenseTank:
  baseDefense >= baseAttack

guard:
  baseDefense >= baseSpeed
```

違反は自動FAILではなく**人間レビュー必須フラグ**とし、No.142のような極端な不一致を機械的に見逃さない。

---

## 4. P1 — healer/supportのidentityは「技名だけ」では解決しない

`design/16` の強いidentity watchは妥当:

- 041
- 050
- 098
- 209
- 210
- 235

加えて 042 / 049 / 051 / 099 / 115 / 116 / 175 / 176 / 177 / 208 を監視する。

ただし、説明文に「きずが なおる」「いのちを もどす」と書かれているのに、formal move masterで攻撃技へそれらしい名前を付けるだけでは不十分。

### 正式受入条件

強いidentity watch個体には、次のどちらかを必須とする。

**A. 戦闘効果を実装する（推奨）**

初期版でも複雑なhealerロールを復活させず、限定的な回復効果だけ持てるようにする。

最小案:

```text
effect.type = heal
healRatio   = 0.20
usesPerBattle = 1
```

- 1戦1回
- 最大HPの20%回復
- 隠し乱数なし
- 1行動消費
- 対象選択を増やしたくない初期版では「自分」または「現在の味方」に限定

**B. 世界観上の回復であり戦闘回復ではないことを説明文で明確化する**

ただし、キャラ設定を数値都合で弱めるよりAを優先する。

`combatRoleV2` は hpTank/balanced のままでよい。**stat roleとmove identityを分離する。**

---

## 5. P1 — 通常敵の成長実感は「既クリアstage上限」で両立させる

現行の「現在手持ちだけでsoft scale」は、新規取得キャラを育てやすい点で良い。

しかし既クリアstageまで毎回100%追従すると、学習→XP→LvUPの結果が戦闘時間へ出にくい。

抽象的な「simulationで調整」だけでは実装者が迷うため、初期候補を固定する。

### 初期候補

初回挑戦/未クリアstage:

```text
normalReferencePower = currentTeamAverageCombatPower
```

初回クリア時:

```text
stage.firstClearReferencePower = currentTeamAverageCombatPower
```

既クリアstage再戦:

```text
repeatCap = stage.firstClearReferencePower * 1.10
normalReferencePower = min(currentTeamAverageCombatPower, repeatCap)
```

これにより:

- 弱い新規キャラ3体で戻る → 敵も下がるので育成しやすい
- 同じ主力が+20%以上成長して戻る → 敵は+10%で頭打ちになり、成長差が出る
- BOXの強キャラは通常敵を勝手に強くしない

### 受入条件

- 初回時点から手持ち戦力+20%で同stage再戦 → 平均決着ターンが最低1ターン短縮
- 低Lv育成チームで戻った場合 → 初回snapshotが下限として敵を引き上げない
- 未クリアstageは従来どおりcurrent team追従

1.10は初期値。simulationで1.05〜1.10の範囲調整は可。

---

## 6. P1 — formal move masterの最低スキーマと「選ぶ理由」を固定する

40/60/80/100の威力profile自体は使ってよい。ただし威力だけでは100技が支配しやすい。

formal move masterは最低限:

```text
moveId
name
type
power
accuracy
effect
role // stable / coverage / strong / finisher / guard / heal 等
```

を持つ。

### 最終形の初期基本形

```text
stable   : 40〜60 / 命中100
coverage : 60     / 命中100 / 主STABと異なる相性用途
strong   : 80     / 命中95
finisher : 100    / 命中90
```

すべて同タイプ・同効果にしない。

### 必須受入条件

各最終形について、代表的な相性ケースを流したとき**4技中最低2技に、少なくとも1ケースで選ぶ合理的理由があること。**

No.181 / 182 の「技を覚える/つなげる」設定は、全員共通の威力表だけで終わらせず個別moveレビュー対象とする。

---

## 7. P2 — 共通 `まもる` は採用。ただしボス予告時の認知負荷を下げる

R3は `design/16` のとおり採用でよい。

- 成功100%
- 1行動消費
- 次ターン連続使用不可
- 予告大技のダメージ/状態を防ぐ

追加UI条件:

- ボスが大技を予告したターンは `まもる` を目立たせる
- 「つぎに おおわざ！」→「まもるなら いま」の因果を同一画面で示す
- 選ばなくても攻撃/交代は可能
- 予告大技を知らないことによる初見即死を作らない

子ども向けでは選択肢を増やすことより、「なぜ今このボタンを使うのか」が分かることを優先する。

---

## 8. R1〜R5 最終回答

### R1 powerTier seed

**YES。** `powerTierV1 = source catchRarity` を初期seedとして採用してよい。

ただし別フィールド維持。No.018 / 021、No.235〜237はsimulation監視。post-clear standalone legend 235〜237のBST456は通常最終340前後より大きく強いので、通常敵poolへ混ぜない。

### R2 Team全員100% Battle XP

**YES。** 戦闘開始時の最大3体へ100%。BOX・捕獲直後個体は対象外。

好きな3体を連れていくことを成長速度低下の罰にしない。新キャラ試用の切替コストを下げる。

### R3 共通まもる

**YES。** 上記UI条件込みで採用。

### R4 healer/support変換

**枠組みYES / identity対応必須。** hpTank/balancedへのstat変換は維持し、強い回復設定はmove effectで表現する。

### R5 にじのわ

**YES。** 小1〜小6なら学年初回6 + 全エリア後EX1 = 最大7個を初期上限とする。ランダムなし、章末定期配布なし。

年長など学年枠を追加する場合は総供給数を明示再計算する。

---

## 9. 238体 / 155進化の最終レビュー結果

### PASS

- No.001〜238 = 238体
- 83系列
- 18タイプ
- 155進化 = level123 / stone21 / held-item_levelup11
- BST合計整合
- Lv1/5/10/20/30/50/100能力式整合
- 155進化の基礎4能力低下0
- ギガ12 / バースト8のID重複0
- No.239 runtime混入0

### 実装前FIX

1. catchRank文章正本を「各形態自身のcatchRarity + stage補正」へ統一
2. held_item_levelupを固定Lvなしへ統一
3. No.142の正式名を `ヘラクレオン` へ統一
4. stone/held itemの `earliestAcquisition` を正本化
5. 通常敵既クリアstageのrepeat capを実装/検証
6. formal move masterにtype/effect/roleと非劣位技ゲートを追加
7. healer identityの最小回復effectを決定
8. role semantic validatorを追加しNo.142を重点再レビュー
9. `design/12` の成長CSV/進化CSV参照名を実ファイル構成へ同期
10. 特殊形態20体の通常/ギガ/バーストsimulationを追加

---

## 10. 再レビューでGO WITH FIXへ上げる条件

以下を全て満たすこと。

- 上記実装前FIX 1〜9を設計へ反映
- 238体validator再実行
- 155進化validator再実行
- catchRank全238一致
- held-item 11件の「装備だけでは進化しない / 次の実LvUPでReady」確認
- stone21 + held11の最速取得時点検証
- No.142 ID/名前/role/special flagの一貫性確認
- formal move非劣位ゲートPASS
- healer identity対象の効果/説明矛盾0
- 通常敵+20%成長時の再戦短縮ゲートPASS

それまでは正式runtime master、formal moves、boss AI、catch、giga/burstの本実装へ進まない。

---

## 11. Supabase / Vercel

今回の作業は実装前設計レビューであり、ManaEvo用Supabase projectは現時点で接続一覧に存在しない。DB変更は不要。

Vercelには `mana-evo` projectがGitHub連携済みだが、設計レビューでproduction deployする理由はない。PRブランチの設計修正を正本化し、runtime実装・CI・QA後にPreview/Production確認へ進む。
