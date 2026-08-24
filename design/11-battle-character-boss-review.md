# バトル／キャラ／ボス バランス再レビュー確定事項

更新日: 2026-08-24
対象: PR #15 `chatgpt/monster-master-238`
状態: **SOL FIX APPLIED / runtime実装可・main merge不可**

この文書は `design/06-battle-and-progression-design.md` / `design/10-initial-balance-master.md` より新しい確定差分であり、PR #15では本書と `design/12-detailed-balance-design-for-sol-review.md`、`design/17-sol-pr15-review-amendment.md`、`design/18-sol-pr15-fix-resolution.md` を優先する。

---

## 1. 戦力基準 — 通常敵とボスを分離する

### 通常敵

通常敵は現在の**手持ち1〜3体だけ**を見る。

```text
currentTeamPower = 手持ち1〜3体の平均combatPower
```

BOXの高Lv個体は通常敵を強くしない。

未クリアstageは:

```text
normalReferencePower = currentTeamPower
```

初回クリア時に:

```text
stage.firstClearReferencePower = その戦闘開始時のnormalReferencePower
```

を保存する。

既クリアstage再戦は:

```text
repeatCap = stage.firstClearReferencePower * 1.10
normalReferencePower = min(currentTeamPower, repeatCap)
```

とする。

これにより:

- 弱い新規キャラで戻れば敵も弱くなり、育成を阻害しない。
- 同じ主力が+20%以上育って戻れば敵は+10%で頭打ちになり、LvUPの成長実感が出る。
- 初回snapshotを下限に使わない。弱い育成チームを過去戦力まで引き上げてはいけない。

**受入条件**

- 初回時点よりプレイヤー戦力+20%で同stage再戦 → 平均決着ターンが最低1ターン短縮。
- 低Lv育成チームで戻る → 過去snapshotが敵の下限にならない。
- 未クリアstageはcurrent team追従。
- 1.10は初期値。simulation結果により1.05〜1.10の範囲だけ調整可。

### ストーリー／エリアボス

初見ボスだけ:

```text
teamWeighted   = 手持ち上位3体 50% / 30% / 20%
rosterWeighted = 所持上位3体 50% / 30% / 20% * 0.85
carryFloor     = 所持最強1体 * 0.80
bossReferencePower = max(teamWeighted, rosterWeighted, carryFloor)
```

を使いsnapshot保存する。

- 通常再戦: snapshot固定。
- challenge再戦: 現在戦力へ再scale。
- タイプ相性・ギガ・バーストの攻略メリットは敵側で相殺しない。

---

## 2. XP曲線とチーム育成

累積XP:

```text
totalXp(L) = round(6 * (L - 1)^1.9)
xpToNext(L) = totalXp(L+1) - totalXp(L)
Lv上限 = 100
```

通常戦XP:

| difficulty | XP |
|---|---:|
| weak | 90 |
| normal | 110 |
| strong | 125 |
| rare | 145 |
| elite | 165 |

ボスXP:

| Rank | XP |
|---|---:|
| C | 180 |
| B | 200 |
| A | 220 |
| S | 250 |
| EX | 300 |

### XP配布

戦闘開始時の手持ち最大3体へ、勝利または捕獲成功時に**同じBattle XPを100%ずつ**付与する。

- BOX控えは対象外。
- 戦闘中に瀕死になっても開始時メンバーなら対象。
- 捕獲したばかりの敵個体はその捕獲戦XPの対象外。
- 捕獲成功でも撃破と同額XP。
- 捕獲成功時Manaは撃破時の50%でよい。

標準3戦normalで1体あたり約330XP/日を初期基準とする。

---

## 3. 238体ロールとidentity

初期238体のstat roleは次の8種。

| role | HP | 攻撃 | 防御 | 素早さ |
|---|---:|---:|---:|---:|
| balanced | 27% | 27% | 24% | 22% |
| attacker | 24% | 38% | 20% | 18% |
| speed | 22% | 32% | 16% | 30% |
| guard | 32% | 20% | 36% | 12% |
| hpTank | 38% | 24% | 22% | 16% |
| defenseTank | 28% | 22% | 38% | 12% |
| slowPower | 30% | 38% | 24% | 8% |
| fastGlass | 20% | 34% | 14% | 32% |

`combatRoleV2` は**内部の生成・監査メタデータ**であり、子ども向けUIにそのまま表示しない。実戦の強み判定・シミュレーションは実能力値を使う。

進化では前段階4能力をfloorとして保持し、growthBudgetだけを新role比率で配る。155進化で4能力非減少を維持する。

### semantic validator

最低限、次を人間レビューflagとして検出する。

```text
fastGlass:   baseSpeed > baseDefense && baseDefense/BST <= 0.22
slowPower:   baseSpeed が4能力中最低
hpTank:      baseHP >= baseDefense
defenseTank: baseDefense >= baseAttack
guard:       baseDefense >= baseSpeed
```

違反は自動FAILではなくレビューflag。ただしNo.142のような大きな不一致を無視してUI/AIへロール名を流用してはいけない。

**No.142 ヘラクレオン**は `fastGlass` に対し HP106 / ATK87 / DEF111 / SPD63 で大きく不一致。正式runtimeでは実能力値を正とし、fastGlass前提の説明・AI処理を禁止する。

### healer/support由来のidentity

stat roleへhealer/supportを復活させない。一方、設定上「きずをなおす」「いのちをもどす」等が強い個体は技効果でidentityを残す。

強いidentity watch:

- 041 / 050 / 098 / 209 / 210 / 235

追加watch:

- 042 / 049 / 051 / 099 / 115 / 116 / 175 / 176 / 177 / 208
- 181 / 182 は「技を覚える／つなげる」を個別moveで表現する。

推奨最小回復effect:

```text
effect.type = heal
healRatio = 0.20
usesPerBattle = 1
```

- 100%確定。
- 1行動消費。
- 1戦1回。
- 初期版は自分または現在の味方だけを対象にし、複雑な対象選択を増やさない。

---

## 4. formal move master

正式技は最低限:

```text
moveId
name
type
power
accuracy
effect
role // stable / coverage / strong / finisher / guard / heal ...
```

を持つ。

最終形の初期基本形:

```text
stable   : power 40〜60 / accuracy 100
coverage : power 60 / accuracy 100 / 主STABと異なる相性用途
strong   : power 80 / accuracy 95
finisher : power 100 / accuracy 90
```

- STAB = 1.20。
- ダメージ乱数なし。
- 初期版の通常急所なし。
- 4技すべてを同タイプ・同効果にしない。
- 各最終形は代表的な相性ケースで**最低2技に少なくとも1ケースずつ合理的な選択理由**が必要。
- formal master生成後、非劣位技validatorを必ず通す。

---

## 5. ボスAIと共通「まもる」

通常敵は期待ダメージ最大を基本とし、プレイヤー入力を見てから行動を変えない。

ボスは予告大技を持つ。

- C/B: 通常2〜3回 → 予告 → 大技
- A: 通常2回 → 予告 → 大技
- S/EX: 通常1〜2回 → 予告 → 大技
- 予告大技は命中100%。
- 同じ大技を連続使用しない。
- 初見で予告なし満タン即死を作らない。

共通 `まもる`:

- 成功100%。
- 1行動消費。
- その敵行動のダメージ／状態を防ぐ。
- 次ターン連続使用不可。
- ボス予告大技にも有効。

### 子ども向けUI条件

予告ターンに同一画面で:

```text
つぎに おおわざ！
まもるなら いま
```

を表示し、`まもる` ボタンを視覚的に強調する。攻撃／交代も選べる状態は維持する。

---

## 6. 捕獲とcatchRank — P0解消済み

`catchRarity` は各形態自身の捕獲難度軸。`powerTier` と別フィールド。

正式式:

```text
rarityRank(common) = 1
rarityRank(rare)   = 2
rarityRank(epic)   = 3
rarityRank(legend) = 4

catchRank = min(5, rarityRank(monster.catchRarity) + (monster.stage - 1))
```

**同系列第1形態のrarityは使わない。**

例:

- No.010 common stage1 → 1
- No.011 common stage2 → 2
- No.012 rare stage3 → 4
- No.064 common stage1 → 1
- No.065 rare stage2 → 3
- No.066 epic stage3 → 5

`catchable:false` / `wildCatchable:false` は捕獲不可を優先し、catchRankで代用しない。

全238体CSVについて上式と一致することをvalidatorで確認する。

捕獲共通:

- HP50%以下。
- 1戦最大3投。
- ほし×1.00 / ぎん×1.20 / きん×1.50 / にじ100%。
- 非にじ上限92%。

---

## 7. 通常進化 — P0解消済み

### level

`level:N` 到達で進化Ready。

### stone

石を1個消費して即時進化。固定Lvなし。

### held_item_levelup

**固定必要Lvは存在しない。**

正式仕様:

1. 指定もちものを装備。
2. その状態で**次の実LvUP**が発生。
3. `evolutionReady=true`。
4. 進化演出から進化。
5. 進化後ももちものは装備状態を維持。

装備しただけでは進化しない。別のもちものへ変更した場合はreadyを解除し、再び指定もちもの装備中のLvUPが必要。

---

## 8. 進化アイテムのunlockMilestone / earliestAcquisition — P1解消済み

stone 21遷移 / held-item 11遷移は、**遷移ごとの専用「しんかの しれん」初回クリア報酬**として必要アイテムを1個保証する。

これにより同じ石を複数系列が使っても、238体コンプリートに必要な個数をランダムなしで保証する。

### areaEvolutionGate

各遷移には次のgateを持つ。

| source area | unlockMilestone |
|---:|---|
| 1 | `evo-a1`: エリア1主ルート50%到達 |
| 2 | `evo-a2`: エリア1ボス撃破 + エリア2主ルート35%到達 |
| 3 | `evo-a3`: エリア2ボス撃破 + エリア3主ルート35%到達 |
| 4 | `evo-a4`: エリア3ボス撃破 + エリア4主ルート35%到達 |

実装時の「50%/35%」は `ceil(mainRouteStageCount * ratio)` でstage数へ変換する。

### transition trial unlock

その遷移のtrialは:

```text
areaEvolutionGate cleared
AND source species owned
AND 今日の基本学習完了
```

で挑戦可能。

初回クリアで、その遷移に必要なstone/held itemを**必ず1個**付与する。ランダムドロップなし。各遷移1回限り。

したがって:

```text
unlockMilestone = areaEvolutionGate + sourceSpeciesOwned
earliestAcquisition = transitionTrial first clear
```

となる。

- stoneは21遷移分、必要数を保証。
- held itemは11遷移分、必要数を保証。
- `steelplate` のような共有itemも遷移単位で報酬を持つ。
- 取得条件を「運」や有料通貨へ依存させない。

---

## 9. 特殊形態

具体対象は `design/09-special-forms-master.md`。

ギガ12体:
003 / 006 / 009 / 051 / 054 / 072 / 090 / 121 / 153 / 156 / 159 / 186

バースト8体:
060 / 066 / 133 / 136 / **142 ヘラクレオン** / 165 / 171 / 174

- スター覚醒なし。
- 重複なし。
- ギガ: 全能力×1.35、戦闘終了まで。
- バースト: HP×2 / ATK×1.2 / 3turn / 専用技110・命中95%。
- referencePowerは未発動特殊形態を先読みしない。
- 1battleで特殊変身はparty合計1回。
- 正式runtime投入前にギガ/バースト相対強度simulationを行い、一方が全状況で上位互換にならないことを確認する。

---

## 10. runtime実装ゲート

PR #15で設計fix後、runtime実装は開始してよい。ただしmain merge前に必ず:

1. 238体 / 83系列 / 18タイプ / 155進化を再validator。
2. catchRank 238/238一致。
3. held_item_levelup 11遷移が固定Lvなし・装備だけでは発火せずLvUPでready。
4. 進化アイテム32遷移にunlockMilestone/earliestAcquisitionがある。
5. normal repeat capのsimulation受入条件を満たす。
6. team XP 100% × 開始時最大3体、捕獲成功も同額。
7. formal movesのschema/非劣位技validator。
8. role semantic flagを出力し、No.142を含むflagを人間レビュー。
9. healer identity個体のmove effectを確認。
10. `まもる` とボス予告UIをE2E確認。
11. ギガ/バースト相対強度simulation。
12. CI green / Vercel Preview QA。

FAILが残る状態ではmainへmergeしない。
