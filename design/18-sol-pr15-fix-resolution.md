# SOL PR #15 修正完了判定 — GO WITH FIX

更新日: 2026-08-24
対象PR: #15 `chatgpt/monster-master-238`
位置づけ: `design/16` / `design/17` のレビュー指摘に対する修正完了記録

## 最終判定

**GO WITH FIX / runtime実装アンロック / Draft継続 / main mergeはまだ不可**

`design/16-sol-pr15-full-review.md` と `design/17-sol-pr15-review-amendment.md` はレビュー時点の監査記録として残す。状態判定が衝突する場合は、本書を最新判定として優先する。

P0の正本衝突はすべて解消し、P1で要求した受入条件も詳細設計・機械検証へ落とし込んだ。したがって、No.001〜238正式runtime master、formal moves、boss AI、特殊形態の**実装作業を開始してよい**。

ただし、本書は「設計が実装可能になった」判定であり、「PR #15をmainへmergeしてよい」判定ではない。下記の残runtime gate完了まではDraftとmain merge lockを維持する。

---

## 1. P0 解消結果

### P0-1 catchRank正本衝突 — RESOLVED

正式式を次に統一した。

```text
rarityRank(common)=1
rarityRank(rare)=2
rarityRank(epic)=3
rarityRank(legend)=4
catchRank = min(5, rarityRank(monster.catchRarity) + (stage - 1))
```

- 系列第1形態のrarityは使わない。
- `wildCatchable=false` / `catchable=false` を捕獲不可判定として優先。
- `design/11` / `design/12` を238体CSVの意味へ同期。
- `tests/pr15-master.test.js` が全238体を再計算し、不一致1件でもCIを落とす。

### P0-2 held_item_levelup固定Lv矛盾 — RESOLVED

正式仕様:

```text
指定もちもの装備
→ その状態で次の実LvUP
→ evolutionReady=true
→ 進化演出
```

- 固定Lv条件なし。
- 装備しただけでは進化しない。
- 別もちものへ付替えた場合はready解除。
- 進化後も指定もちものは装備維持。
- 11遷移の14系CSVはすべてこの意味で一致。
- runtime縦切りも `held_item_levelup` + `evolutionReady` へ変更済み。

### P0-3 No.142名前不一致 — RESOLVED

唯一の正本:

```text
No.142
id = m142
name = ヘラクレオン
burstEligible = true
```

旧名 `カブトレクス` は特殊形態正本から除去。キョダイバースト対象ID m142自体は変更していない。

---

## 2. P1 設計・受入条件の反映結果

### P1-1 進化アイテム最速入手時点 — RESOLVED AS DESIGN

`design/14e-evolution-item-acquisition-master.csv` を追加。

- stone 21遷移。
- held_item_levelup 11遷移。
- 合計32遷移すべてに `unlockMilestone` / `unlockRule` / `earliestAcquisition` / `grantCount` を定義。
- 各遷移の専用 `evolutionTrial` 初回クリアで必要itemを1個保証。
- ランダム・有料通貨へ依存しない。
- 同じitemを複数系列が使ってもtransition単位で必要数を保証。

area gate:

```text
evo-a1 = area1主ルート50%
evo-a2 = area1ボス + area2主ルート35%
evo-a3 = area2ボス + area3主ルート35%
evo-a4 = area3ボス + area4主ルート35%
```

trial unlock:

```text
area gate cleared
AND source species owned
AND 今日の基本学習完了
```

### P1-2 通常敵追従で成長実感が消える — RESOLVED / RUNTIME BASE IMPLEMENTED

未クリア:

```text
normalReferencePower = current team 1〜3体 average combatPower
```

初回クリア:

```text
stage.firstClearReferencePower = battle開始時referencePower
```

既クリア:

```text
repeatCap = firstClearReferencePower * 1.10
normalReferencePower = min(currentTeamPower, repeatCap)
```

- BOXは通常敵scaleへ入れない。
- 過去snapshotを下限へ使わないため、低Lv新規キャラ育成を邪魔しない。
- `normalStageSnapshots` をsave version 6へ追加済み。
- `tests/balance.test.js` で上方capと弱team非floorを検証済み。

### P1-3 高威力技1択化 — RESOLVED AS DESIGN / SCHEMA IMPLEMENTED

formal move minimum schema:

```text
moveId
name
type
power
accuracy
effect
role
```

- vertical-slice runtime moveはこのschemaへ移行済み。
- 最終形は stable / coverage / strong / finisher を基準。
- 各最終形で最低2技に代表相性ケース上の合理的選択理由を持たせる。
- 238体formal move master作成後、非劣位技validatorを追加することをmerge gateとする。

### P1-4 healer/support identity — RESOLVED AS DESIGN

stat roleにhealer/supportを戻さず、技effectでidentityを表現する。

推奨最小回復:

```text
effect.type = heal
healRatio = 0.20
usesPerBattle = 1
```

強いwatch:
041 / 050 / 098 / 209 / 210 / 235。

追加watch:
042 / 049 / 051 / 099 / 115 / 116 / 175 / 176 / 177 / 208。

181 / 182は「技を覚える／つなげる」固有identityをformal moveで表現する。

### P1-5 combatRoleV2 semantic mismatch — RESOLVED AS DESIGN / VALIDATOR IMPLEMENTED

`combatRoleV2` は内部生成・監査メタデータ。子ども向けUIや戦闘AIは実能力値を正とする。

最低review flag:

```text
fastGlass:   baseSpeed > baseDefense && baseDefense/BST <= .22
slowPower:   speed is lowest
hpTank:      HP >= DEF
defenseTank: DEF >= ATK
guard:       DEF >= SPD
```

No.142はfastGlass条件に合わないことをvalidatorで意図的にflag確認済み。実能力 HP106 / ATK87 / DEF111 / SPD63 をruntime truthとする。

### P1-6 設計参照ファイル名 — RESOLVED

`design/12` を実在構成へ同期。

- 成長: 7 CSV。
- 進化: 4 CSV。
- 進化item取得: 14e 1 CSV。

### P1-7 ギガ/バースト相対強度 — ACCEPTANCE DEFINED / SIMULATION PENDING

対象IDは確定のまま変更しない。

- ギガ12。
- バースト8。
- overlap 0。
- スター覚醒なし。

正式runtime投入後、同一基準敵へ通常 / ギガ / バーストをsimulationし、一方が全状況で上位互換にならないことを確認する。これはmain merge gateとして残す。

---

## 3. 今回runtimeへ反映した基礎仕様

### XP

```text
totalXp(L) = round(6 * (L - 1)^1.9)
Lv cap = 100
```

勝利・捕獲成功時、**戦闘開始時の手持ち最大3体へBattle XPを100%ずつ**付与。

- BOX控え0%。
- 瀕死でも開始時teamなら100%。
- 捕獲した敵はその捕獲戦XPを受け取らない。
- 捕獲成功でも撃破と同額XP。

### normal stage

- current team soft scale。
- first-clear reference保存。
- cleared repeat cap ×1.10。
- save version 6。

### evolution

- held item装備だけでは不可。
- 実LvUP時に `evolutionReady`。
- stone rewardの縦切りは初回クリアのみ付与へ修正。

### formal move schema

vertical sliceを `accuracy / effect / role` 対応へ移行。敵の技選択は `power * accuracy * type effectiveness` を基準にする。

---

## 4. 自動検証結果

GitHub Actions CI run #154:

- Node 24。
- `npm audit --audit-level=high`: **0 vulnerabilities**。
- `npm test`: **92 tests / 92 pass / 0 fail**。
- `npm run build`: **success**。

PR15専用validatorが確認する内容:

- 238体 / No.001〜238欠番0・重複0。
- 83系列。
- 18タイプ。
- No.239混入0。
- catchRank 238/238正式式一致。
- ギガ12 / バースト8 / overlap0。
- No.142 = m142 / ヘラクレオン / burst true。
- 155進化 = level123 / stone21 / held11。
- 155遷移の基礎4能力低下0。
- held11の固定Lv表現0。
- item進化32/32にdeterministic acquisition masterあり。
- No.142 role semantic flagを検出。

Vercel Preview:

- head `9ebb256e` のPreview deploymentは **READY**。
- targetはPreview (`target=null`)。Productionは変更していない。

Supabase:

- 接続済み一覧にManaEvo用Supabase projectは存在しないため、今回DB migration/deployはなし。

---

## 5. main mergeまでに残るruntime gate

以下は**仕様未決ではなく、確定仕様の実装・simulation待ち**。

1. No.001〜238正式runtime master投入。
2. 238体formal move master作成・非劣位技validator。
3. healer/support identity watch個体のmove effect実装・レビュー。
4. No.181 / 182固有move identity実装。
5. role semantic flag全件を人間レビューし、必要な説明/AI誤用を除去。
6. `まもる` 100% / 連続不可 / ボス予告UI E2E。
7. boss初回snapshot / 通常再戦固定 / challenge再scaleの実コンテンツE2E。
8. normal repeat capについて、+20%成長時に平均決着turnが最低1短縮するsimulation。
9. ギガ / バースト相対強度simulation。
10. 進化trial32件の実stage/reward実装。
11. 最終CI green / Vercel Preview QA。

これらがgreenになるまではPR #15をDraftのまま維持し、mainへmergeしない。

---

## 6. 結論

前回 `NO-GO` の理由だった「実装者が一意に解釈できない設計衝突」は解消した。

**PR #15はここから正式runtime実装へ進めてよい。**

次の判定点は「設計レビュー」ではなく、上記runtime gateを満たした時点の **MERGE GO / NO-GO** とする。
