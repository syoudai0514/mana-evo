# ManaEvo 再建監査 — バトル・捕獲・育成・進化・特殊形態

更新日: 2026-08-25  
担当: Worker 3 / SOL③  
対象PR: #37  
監査branch: `rebuild/battle-capture-evolution-audit`  
状態: **PHASE 1.5 RE-AUDIT / AUDIT ONLY**  
変更制約: **このMarkdown以外の `src/**` / `tests/**` / current design は変更しない**

---

## 0. 結論

Phase 1の前回監査を、Phase 1.5 governance、司令塔による exact FINAL-CORRECTED 確認結果、回収済みユーザー明示判断、current design、runtime の順で再判定した。

今回の最重要修正は次の4点。

1. **捕獲仕様は `CONFIRMED_CHANGE`。**  
   FINAL-CORRECTED は勝利後 `CAPTURE`、HP非依存、ぎん×1.5、きん×2.0、最大3投。後続ユーザー明示判断により、現在は戦闘中HP50%以下、ほし×1.0 / ぎん×1.2 / きん×1.5 / にじ100%、非にじ92%cap、1戦3投へ変更済み。
2. **進化アイテムの「32専用trial初回保証」は `CONFIRMED_CHANGE` ではなく `UNRESOLVED`。**  
   exact baseline は「探索ポイント5ptで探索 / 進化アイテム20% / 地域別5連続不発後6回目に選択保証」。currentの32専用trialへの置換は実装・レビュー済みだが、その**置換そのものをユーザーが明示承認した証拠は確認できない**。
3. **前回の2件の implementation drift は維持。**  
   `balanceVersion` 更新後のboss snapshot再固定不全、捕獲4段階演出の時間的sequence不足はいずれも再現可能な current-intent/runtime 不一致。
4. **ギガ/バーストの核となる数値は baseline と current が一致。**  
   ギガ12体、バースト8体、ギガ全能力×1.35、バースト HP×2 / ATK×1.2 / 3turn、バースト技 power110 / accuracy95 は `SAME`。

### exact baselineの扱い

司令塔 `PHASE-1-COMMANDER-REVIEW.md` は exact archive 32ファイルを直接展開・確認済みであり、このWorkerへの再監査指示でも下記baseline事実が direct-confirmed として渡されている。

一方、このWorker実行環境では archive bytes 自体はretrievableではなく、PR #35にもまだpayloadが保存されていない。そのため本監査では、**司令塔/ユーザーが exact archive 直接確認済みと明示した事項だけを A-direct-confirmed として昇格**し、それ以外のbaseline内容を推測で補完しない。

この扱いにより、前回の「AはすべてA-indirect」という制約は解除するが、未確認項目を `SAME` に推定することもしない。

---

## 1. governance / 証拠順位

最初に `rebuild/canonical-governance` の以下を確認した。

- `REBUILD-START-HERE.md`
- `design/rebuild/USER-DECISION-EVIDENCE.md`
- `design/rebuild/PHASE-1-COMMANDER-REVIEW.md`
- `design/rebuild/DECISION-LOG.md`

適用順位:

1. ユーザー明示決定
2. exact FINAL-CORRECTED baseline
3. 原本以降の承認済み変更
4. current canonical/design
5. data master
6. runtime
7. tests / review / CI

実装済み・PR merge済み・CI PASSだけでは「承認済み仕様」と判定しない。

### 判定ラベル

| ラベル | 意味 |
|---|---|
| `SAME` | baselineとcurrentの内容が同じと確認できる |
| `CONFIRMED_CHANGE` | baselineから変わったが、後続ユーザー承認が確認できる |
| `IMPLEMENTATION_DRIFT` | current intent / user decision とruntimeがずれている |
| `UNRESOLVED` | baseline差分または後続承認のどちらかが不足し、一意に正本化できない |

---

## 2. exact FINAL-CORRECTED — 今回の直接確認済みbaseline

重点原本:

- `08-gameplay-state-spec.md`
- `07-wild-encounter-and-capture-design.md`
- `06-battle-and-progression-design.md`
- `scripts/battle.mjs`
- `scripts/capture.mjs`
- `scripts/forms.mjs`
- `scripts/items.mjs`
- `scripts/rewards.mjs`

A-direct-confirmed:

### 捕獲

```text
ENCOUNTERED → BATTLING → WON → CAPTURE → RESOLVED
```

- 勝利後CAPTURE方式
- HP非依存
- 最大3投
- ぎんのわ ×1.5
- きんのわ ×2.0

### 特殊形態

- ギガ対象 12
- キョダイバースト対象 8
- ギガ: 全能力 ×1.35
- バースト: HP ×2 / ATK ×1.2 / 3turn
- バースト技: power 110 / accuracy 95

### 進化アイテム取得

```text
探索ポイント 5pt
→ 探索
→ 進化アイテム 20%
→ 地域ごとに5連続不発なら
→ 6回目は地域内の対象進化アイテムを選択保証
```

このbaseline acquisitionは、currentの「32遷移ごとの専用evolutionTrial初回クリア保証」と明確に異なる。

---

## 3. 回収済みユーザー明示判断

`USER-DECISION-EVIDENCE.md` のうち本監査へ直接効くもの:

### UDE-002 — 戦闘中捕獲と「わ」性能

2026-08-24 user explicit:

- 敵HP50%以下から捕獲可能
- ほし ×1.00
- ぎん ×1.20
- きん ×1.50
- にじ 100%
- 非にじ最終成功率上限 92%
- 1バトル最大3投

→ baseline捕獲方式との競合は **ユーザー明示判断が優先**。

### UDE-003 — ボス再戦は育成で楽になる

- story / area boss は、育成後の通常再戦でプレイヤーが有利になれること
- プレイヤーLvへ完全追従して成長を相殺しないこと

→ boss snapshot / rematchのcurrent intent判定に使用する。

### UDE-005 — 自分で育てて進化させる方向

- `design/20-world-map-evolution-progression.md` 系の「自分で育てて進化させる体験」強化は方向性として承認済み
- **ただし個々の細目まで無条件承認した証拠ではない**

### 未回収として明記されている事項

`USER-DECISION-EVIDENCE.md` は次を明示的に未回収としている。

- baseline探索ポイント方式 → current専用進化trial
- duplicate capture の `なかまにする / おうえんにかえる`
- `育ちのかけら`

このため、PR本文・design・runtimeが一致していてもユーザー承認へ昇格させない。

---

## 4. バトル再監査

| 項目 | Baseline | Current intent / runtime | 再判定 |
|---|---|---|---|
| ticket消費状態遷移 | exact direct詳細は今回指示で未提示 | `startBattle()`でFEFO ticketを消費/予約、`activeBattle`へsource保持。勝利/捕獲成功は確定、敗北/明示離脱は元期限で返却、reloadはactiveBattle復帰 | `UNRESOLVED`。current契約は強いがbaseline差分とユーザー個別承認をこのWorkerでは確定できない |
| battle開始 | exact direct詳細は今回指示で未提示 | 今日の基本学習完了 + stage解放 + ticket + activeBattleなし | `UNRESOLVED`。学習/ticket Workerのexact再監査と合わせて正本化すべき |
| 敗北 | exact direct詳細は今回指示で未提示 | 控え生存なら強制交代、全滅でloss | `UNRESOLVED` |
| 敗北/離脱ticket返却 | baseline差分 direct未確定 | current runtimeはexactly-once返却 + 元期限維持 | `UNRESOLVED`。runtimeを承認証拠にしない |
| 再戦 | baseline direct詳細は今回指示で未提示 | 通常stageはsoft scale/repeat cap、story bossはsnapshot固定、challengeのみrescale | bossの「育成後に楽」はUDE-003で `CONFIRMED_CHANGE` 相当。通常stage細目は別途 provenance 要 |
| HP/ATK/DEF/SPD | 前回復元値とcurrentは一致するが、今回A-direct明示対象外 | `statsFromBase()`の4能力式、隠しIV/EVなし | `UNRESOLVED`（exact同一性を推定しない） |
| XP | 前回復元値とcurrentは一致するが、今回A-direct明示対象外 | `totalXp(L)=round(6*(L-1)^1.9)`, Lv100 | `UNRESOLVED`（baseline direct再引用待ち） |
| 技 | baseline direct詳細は今回指示で未提示 | 4技 + 共通`まもる`、formal move master | `UNRESOLVED`。共通`まもる`は後続追加だが個別ユーザー承認の証拠とbaseline差分を分離して扱う |
| タイプ | FINAL-CORRECTEDが18タイプ体系であることは後続復元と整合 | currentも18タイプ | 現行18タイプ維持。exact file-level同一性はbaseline preservation後に最終 `SAME` 固定 |
| 同速 | direct baseline不明 | currentはplayer先手 | `UNRESOLVED` |

### runtime確認: boss snapshot

`startBattle()` は現在:

```js
const existingSnapshot = ticket.game.bossBalanceSnapshots?.[stage.id] || null
const balancePlan = buildEnemyPlan(..., existingSnapshot, { challenge })

if (balancePlan?.snapshot && !challenge && !existingSnapshot) {
  nextGame.bossBalanceSnapshots[stage.id] = structuredClone(balancePlan.snapshot)
}
```

`buildEnemyPlan()` 側は古い `balanceVersion` のsnapshotをinvalidとして新plan/new snapshotを生成できる。しかし `existingSnapshot` 自体はtruthyなため、**新snapshotが保存されない**。

→ 詳細は §10 DRIFT-1。

---

## 5. 捕獲再監査

### 5.1 state / timing

Baseline:

```text
ENCOUNTERED
→ BATTLING
→ WON
→ CAPTURE
→ RESOLVED
```

Current:

- `battle.status === fighting`
- enemy HP > 0
- HP ratio <= 0.5
- 最大3投
- 失敗時は敵turn
- 成功時にbattleを `caught` 終了

**判定: `CONFIRMED_CHANGE`**

後続ユーザー明示判断 UDE-002 がbaselineより優先する。

### 5.2 「わ」倍率

| わ | Baseline | Current | 判定 |
|---|---:|---:|---|
| ほし | baseline標準 | ×1.00 | current維持 |
| ぎん | ×1.50 | ×1.20 | `CONFIRMED_CHANGE` |
| きん | ×2.00 | ×1.50 | `CONFIRMED_CHANGE` |
| にじ | baseline direct値は今回指示で未提示 | 100% | UDE-002によりcurrentは `CONFIRMED_CHANGE` として採用 |
| 非にじcap | baseline direct値は今回指示で未提示 | 92% | UDE-002によりcurrentは `CONFIRMED_CHANGE` として採用 |

### 5.3 最大投数

- baseline: 最大3投
- current: 最大3投

**数値自体は `SAME`**。

ただし「勝利後CAPTUREで3投」から「戦闘中HP50%以下で3投」へstate machineが変わっているため、捕獲全体は `CONFIRMED_CHANGE`。

### 5.4 current capture formula

runtime:

```text
base = clamp(0.12,
  0.34 + missingHpRatio * 0.62 - catchRank * 0.07,
  0.90)
final = clamp(0.01, base * ringMultiplier, 0.92)
```

にじは1.0保証。

この**base formulaの具体定数**はユーザー明示変更証拠を確認できないため、コードを正本化しない。

**判定: `UNRESOLVED`**

### 5.5 duplicate capture

current runtime `attemptCapture()` は、同一speciesを既に所有していても:

- 新しいinstanceを `box` へ追加
- `dex.caught[speciesId]=true`
- teamが3未満なら自動加入

までを一律実行する。

一方、再建証拠台帳には `なかまにする / おうえんにかえる` と `育ちのかけら` が未回収事項として残る。

**判定: `UNRESOLVED`**

runtimeの「常に別instanceとして仲間化」を正本へ昇格しない。反対に、未承認の `おうえんにかえる / 育ちのかけら` も勝手に復活させない。

### 5.6 捕獲4段階演出

current intent:

- `design/01` は「わ + ★★★★」の4段階演出を要求
- Phase 1 Commander Review もexact baseline再確認後に本件をdrift候補として維持

runtime:

```js
for (const roll of samples.slice(0, 4)) {
  if (roll <= perStarChance) stars += 1
  else break
}
nextBattle.captureStars = stars
```

4判定を一括で終え、UIは最終 `captureStars` を `★/☆` として表示する。1→2→3→4の時間的sequenceを保証するstate/event/testがない。

**判定: `IMPLEMENTATION_DRIFT`**

確率仕様ではなくUX契約の不足。

---

## 6. 通常進化再監査

### current runtimeの3方式

```text
level
stone
held_item_levelup
```

- `level`: 指定Lv到達
- `stone`: stone所持、進化時1個消費
- `held_item_levelup`: 指定item装備中の「次の実LvUP」でready
- held itemは進化後も保持
- 進化後もinstance/Lv/XPを維持しspeciesを切替

### 判定

3方式そのものについて、今回のA-direct-confirmed項目にはexact条件全文が含まれない。

したがって:

- 3方式の存在: current契約として確認済み
- baselineとの完全一致: **`UNRESOLVED`**
- `held_item_levelup` の「固定Lvなし + 次の実LvUP」: current reviewで強く固定されているが、baseline差分をユーザー承認済み変更と断定しない

実装済みだからという理由で `CONFIRMED_CHANGE` へ上げない。

---

## 7. 進化アイテム取得 — 重要再分類

### 7.1 exact baseline

FINAL-CORRECTED:

```text
探索ポイント 5ptを使う
→ 探索
→ 進化アイテム 20%
→ 地域別に不発回数を持つ
→ 5連続不発後、6回目は対象アイテムを選択保証
```

### 7.2 current

`design/14e-evolution-item-acquisition-master.csv` / `design/18` / PR #15:

- stone 21遷移
- held_item_levelup 11遷移
- 計32遷移
- transitionごとに専用 `evolutionTrial`
- 初回クリアで必要item 1個保証
- area gate + source species owned + 今日の基本学習完了
- random/課金なし

runtimeもstage first-clear rewardとして実装済み。

### 7.3 承認証拠追跡

確認したもの:

- `USER-DECISION-EVIDENCE.md`
- `PHASE-1-COMMANDER-REVIEW.md`
- PR #15本文 / review履歴
- `design/17`, `design/18`, `design/19`
- 後続world/evolution承認 UDE-005 の範囲
- 過去会話の明示判断再検索

結果:

- 「自分で育てて進化させる」方向は承認済み
- PR #15で32trialは設計・実装・merge済み
- **しかし「探索ポイント5pt + 20% + 6回目保証を廃止し、32専用trial初回保証へ置き換える」ことをユーザーが明示承認した証拠は確認できない**
- `USER-DECISION-EVIDENCE.md` 自身もこのdeltaを未回収としている

### 再判定

**`UNRESOLVED`**

前回監査の `CONFIRMED_CHANGE` は誤りとして訂正する。

これは「current trialを即削除してbaselineへ戻す」という意味ではない。正しい次工程は、司令塔がユーザー判断または追加承認証拠を取り、探索方式 / trial方式 / 統合案のどれをcurrent canonicalにするか決めること。

---

## 8. ギガシンカ再監査

### 8.1 対象12

003 / 006 / 009 / 051 / 054 / 072 / 090 / 121 / 153 / 156 / 159 / 186

- baseline exact: 12
- current: 12

**判定: `SAME`**

### 8.2 効果

- baseline exact: 全能力 ×1.35
- current runtime: `GIGA_MULTIPLIER = 1.35` を HP/ATK/DEF/SPD 全てへ適用
- battle終了まで継続
- HP割合維持

核となる倍率:

**判定: `SAME`**

### 8.3 取得条件

current:

- 最終形
- ギガキー永久・非消費
- 種族別ギガコア永久・非消費
- 最終進化 → 専用challenge/boss → 勝利 → core解放
- Area1 bossで共通ギガキー取得へ具体化

過去ユーザー判断では、この「最終進化 + 専用challenge/boss + 永久非消費」のspecial-form方向は明示的に受け入れられている。

ただし今回A-direct-confirmed項目にはbaseline取得条件全文がないため、baselineとの「変更/同一」までは断定しない。

**current canonical status: CONFIRMED**  
**baseline delta classification: `UNRESOLVED`**

---

## 9. キョダイバースト再監査

### 9.1 対象8

060 / 066 / 133 / 136 / 142 / 165 / 171 / 174

- baseline exact: 8
- current: 8

**判定: `SAME`**

No.142の表示名はcurrent 238体masterの `ヘラクレオン` へ後続統一済み。対象ID `m142` は維持。

### 9.2 効果

| 項目 | Baseline exact | Current runtime | 判定 |
|---|---:|---:|---|
| HP | ×2.0 | ×2.0 | `SAME` |
| ATK | ×1.2 | ×1.2 | `SAME` |
| 持続 | 3turn | 3turn | `SAME` |
| 専用技 power | 110 | 110 | `SAME` |
| 専用技 accuracy | 95 | 95 | `SAME` |

currentは4技枠のfinisher/identity枠をburst技へ置換し、5つ目の技にはしない。

この「4枠置換」は後続実装詳細なので、baseline exact同一性は別論点。

### 9.3 取得条件

current:

- 最終形
- 種族別 `burstMarks`
- 最終進化 → 専用challenge/boss → 勝利 → mark永久解放
- Giga/Burstはparty全体で1戦1特殊形態

これも後続ユーザー判断でspecial-form取得方向自体は承認済み。

**current canonical status: CONFIRMED**  
**baseline delta classification: `UNRESOLVED`**

---

## 10. IMPLEMENTATION_DRIFT

### DRIFT-1 — balanceVersion変更後boss snapshot再固定不全

#### current intent

- story/area bossは初回snapshotを基準に通常再戦固定
- 育成後はプレイヤーが有利になる（UDE-003）
- challenge再戦だけcurrent powerへrescale
- `design/20` ではbalanceVersion更新時に旧snapshotを再評価可能
- 再評価した場合も、その新snapshotへ**一度再固定**される必要がある

#### runtime

`balance.js` は旧version snapshotをinvalidと判定し、新snapshotを作る。

しかし `engine.js/startBattle()` は:

```js
if (balancePlan?.snapshot && !challenge && !existingSnapshot) {
  nextGame.bossBalanceSnapshots[stage.id] = structuredClone(balancePlan.snapshot)
}
```

のため、invalidな旧snapshotが存在すると `existingSnapshot` がtruthyのままになり、新snapshotを保存しない。

#### 結果

balanceVersion更新後の通常再戦が、毎回その時点のplayer powerで再計算され得る。これは「育成で楽になる」を相殺しうる。

**判定: `IMPLEMENTATION_DRIFT` — 維持**

必要な後続test:

1. old-version snapshotを持つsaveを用意
2. 通常boss開始
3. new snapshotへ置換保存
4. playerを育成
5. 2回目通常再戦でもnew snapshot固定
6. challengeだけrescale

### DRIFT-2 — 捕獲4段階演出のtemporal contract不足

#### exact/current intent

Phase 1 Commander Reviewはexact baseline再確認後も本件をdrift候補として維持。current `design/01` も4段階「わ + ★★★★」演出を要求する。

#### runtime

- 4 rollを1関数呼び出し内で同期評価
- `captureStars` に最終個数だけ保存
- UIは最終 `★/☆` を表示
- 1→2→3→4の進行state/event/timer契約がない
- testも時間sequenceを固定しない

**判定: `IMPLEMENTATION_DRIFT` — 維持**

確率計算は触らず、表示イベントを段階化する後続実装が必要。

---

## 11. スター覚醒再監査

current design/runtimeは明確に「スター覚醒なし」。

- `design/01`: 不採用
- `design/09`: 使わない
- `design/18`: スター覚醒なし
- PR #15: スター覚醒なし
- legacy saveの `starShards` / `starAwakened` はcurrentへ残さない
- 過去ユーザー判断でもManaEvo formal featureとしてスター覚醒を採用しない方向が確認済み

今回のA-direct-confirmed一覧には「FINAL-CORRECTEDにスター覚醒が存在した/しなかった」の明示確認は含まれないため、baseline差分として `SAME` / `CHANGE` を捏造しない。

**current canonical status: NO STAR AWAKENING — CONFIRMED**  
**baseline delta classification: `UNRESOLVED`**

重要: `UNRESOLVED` は「スター覚醒を復活させる」という意味ではない。current user decisionが優先されるため、再建実装で `starShards`, `starAwakened`, `gigaStones` を正式仕様へ戻してはいけない。

---

## 12. boss snapshot再監査

boss snapshotのbaseline起源そのものは、今回A-direct-confirmed項目からは最終断定しない。

しかしcurrent canonical intentについてはUDE-003が十分強い。

- 初見は成立させる
- 通常再戦で育成成果を相殺しない
- 育てれば楽になる

したがって、snapshot実装のprovenanceがbaseline由来かlater design由来かにかかわらず、**現在のruntimeがこのユーザー決定を破るならimplementation drift** と判定できる。

DRIFT-1はこの理由で確定維持する。

---

## 13. 再分類サマリ

### `SAME`

- 捕獲最大3投という数値
- ギガ対象12
- バースト対象8
- ギガ全能力×1.35
- バースト HP×2
- バースト ATK×1.2
- バースト 3turn
- バースト技 power110 / accuracy95

### `CONFIRMED_CHANGE`

- 勝利後CAPTURE → 戦闘中HP50%以下捕獲
- HP非依存 → HPを捕獲条件/確率へ使用
- ぎん ×1.5 → ×1.2
- きん ×2.0 → ×1.5
- にじ100%
- 非にじ92%cap
- 捕獲失敗で敵turn
- story/area bossを育成後の通常再戦で楽にできるcurrent intent

### `IMPLEMENTATION_DRIFT`

1. balanceVersion更新後boss snapshot再固定不全
2. 捕獲4段階animationのtemporal contract不足

### `UNRESOLVED`

- ticket消費/返却stateのbaseline差分と個別承認
- battle開始条件のbaseline差分
- 敗北/通常再戦細目
- stats / XP / 4技 / 同速等のexact baseline同一性
- current base capture chanceの具体定数
- duplicate capture（常に別instance化 vs `なかまにする / おうえんにかえる`）
- `育ちのかけら`
- 通常進化3方式のbaseline完全一致
- stone / held-itemのexact baseline条件差分
- **探索ポイント方式 → 32専用進化trial初回保証**
- Giga/Burst取得条件のbaseline delta（currentルール自体はユーザー承認済み）
- Star Awakeningのbaseline delta（currentは不採用CONFIRMED）

---

## 14. 前回監査からの訂正点

| 前回 | 今回 | 理由 |
|---|---|---|
| Aは全面的にA-indirect | direct-confirmed事項をA-directへ昇格 | Commanderがexact 32 filesを展開確認済み、Phase 1.5で明示事実が供給された |
| capture timing/multiplier変更の承認根拠がPR中心 | UDE-002 user explicitを最優先 | 明示ユーザー判断を回収済み |
| 32専用evolutionTrial = `CONFIRMED_CHANGE` | **`UNRESOLVED`** | baselineと明確に異なるが、その置換のユーザー明示承認が見つからない |
| Giga/Burst数値はA-indirect | **`SAME`** | exact baselineで12/8と主要数値を確認済み |
| boss driftは後続design中心 | UDE-003 user decisionでも直接支持 | 「育成で楽になる」が明示決定 |
| capture animation drift | **維持** | exact再確認後のCommander Reviewでもretain |

---

## 15. 次工程へ渡す判断要求

1. **進化アイテム取得方式を司令塔判断へ上げる。**  
   baseline探索方式とcurrent trial方式を、実装済みという理由だけで決めない。
2. **duplicate captureをcanonicalizeする。**  
   currentの常時仲間化を正にするか、`なかまにする / おうえんにかえる / 育ちのかけら` を採用するか、承認証拠またはユーザー判断が必要。
3. **DRIFT-1をLogic Alignment work itemへ。**  
   invalid old boss snapshotをnew snapshotへ一度置換保存する。
4. **DRIFT-2をUX/Logic Acceptanceへ。**  
   capture resultを4段階時間sequenceとして実装・testする。
5. Star Awakeningは復活させない。

---

## 16. 主要証拠

### Governance

- `REBUILD-START-HERE.md` @ `rebuild/canonical-governance`
- `design/rebuild/USER-DECISION-EVIDENCE.md`
- `design/rebuild/PHASE-1-COMMANDER-REVIEW.md`
- `design/rebuild/DECISION-LOG.md`

### Baseline重点原本

- `08-gameplay-state-spec.md`
- `07-wild-encounter-and-capture-design.md`
- `06-battle-and-progression-design.md`
- `scripts/battle.mjs`
- `scripts/capture.mjs`
- `scripts/forms.mjs`
- `scripts/items.mjs`
- `scripts/rewards.mjs`

### Current design

- `design/01-catch-and-evolution-design.md`
- `design/06-battle-and-progression-design.md`
- `design/09-special-forms-master.md`
- `design/11-battle-character-boss-review.md`
- `design/12-detailed-balance-design-for-sol-review.md`
- `design/14e-evolution-item-acquisition-master.csv`
- `design/17-sol-pr15-review-amendment.md`
- `design/18-sol-pr15-fix-resolution.md`
- `design/19-sol-pr15-runtime-completion.md`
- `design/20-world-map-evolution-progression.md`

### PR / history

- PR #15 — 238 master / battle / evolution runtime; 32 evolution trials implemented
- PR #26 — capture/special-form hardening
- PR #27/#28/#29 — world/self-evolution progression
- PR #31/#32 — UI; game logic itself was stated as preserved

### Runtime

- `src/game/engine.js`
- `src/game/balance.js`
- `src/game/progression.js`
- `src/game/content.js`
- `src/game/GameScreens.jsx`

---

## 17. Worker handoff

- 成果物更新: `design/rebuild/audit/battle-capture-evolution-audit.md` のみ
- `src/**`: 変更なし
- `tests/**`: 変更なし
- 新規PR: 作成なし
- 既存PR: #37を継続更新
- exact再監査で確定した重要訂正: **専用進化trialは `UNRESOLVED`**
- 維持drift: **boss snapshot再固定不全 / 捕獲4段階sequence不足**
