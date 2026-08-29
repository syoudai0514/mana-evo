# ManaEvo CURRENT — Battle / Tickets / Boss Balance

更新日: 2026-08-29  
Work Item: W-102  
状態: **CURRENT — read the 2026-08-29 D-022 override at the end before implementing superseded sections**  
対象: バトル開始条件、戦闘ルール、ticket lifecycle、battle XP、boss balance / rematch

> この文書は、W-102 の実装に必要な CURRENT 契約を一か所に集約する。runtime は実装状況の確認にのみ使い、仕様根拠にはしない。
> 捕獲の成功率・「わ」・重複捕獲・捕獲演出は W-103 (`design/current/03-CAPTURE-DUPLICATES.md`) の責務であり、この文書では定義しない。
>
> **重要:** 2026-08-29のBattle V6明示決定（Decision D-022）が、本文中の旧ticket settlement / STAB・critical・random / Battle XP / enemy scaling tuningの該当箇所を後続置換している。本文の非競合ルールは維持し、末尾の「Battle V6 override」を必ず併読する。

---

## 0. 権威と根拠

適用順位は `REBUILD-START-HERE.md` / D-001 に従う。

1. ユーザー明示決定
2. exact baseline `design/baseline/FINAL-CORRECTED/source/`
3. 承認済み後続変更
4. current canonical
5. data master
6. runtime
7. tests / review history

本書で直接使用した主要証拠:

- `design/rebuild/DECISION-LOG.md`
  - D-007 ticket reservation lifecycle
  - D-011 world / enemy level direction
  - D-012 boss rematch / snapshot
- `design/rebuild/USER-DECISION-EVIDENCE.md`
  - UDE-003 bossは育成後の通常再戦で楽になる
- PR #5 本文・同梱review doc
  - 当日daily未完了では持越しticketでも新規battle不可
  - battle開始時1枚reserve
  - 敗北 / 明示離脱で元期限の1枚を返却
  - 勝利 / 捕獲成功で消費確定
  - reload / Safari終了 / crashはactiveBattle再開、追加消費なし
  - ticketは獲得日を含む7日、FEFO
- exact baseline
  - `06-battle-and-progression-design.md`
  - `08-gameplay-state-spec.md`
  - `scripts/battle.mjs`
- 承認済み後続方向
  - `design/20-world-map-evolution-progression.md`
- Phase 1.5 evidence
  - `design/rebuild/audit/battle-capture-evolution-audit.md`

---

## 1. 境界 / 他CURRENTとの責務分離

### W-101 Learning / Rewards

W-102 は「daily core 完了済みか」という boolean / dated completion fact を受け取る。dailyの5 task、問題数、`わからない`、SRS、mastery、ticket付与は W-101 を正とする。

### W-103 Capture / Duplicates

W-102 が知るのは次だけ。

- `capture success` は battle terminal outcome の1つ
- `capture success` では reserve 済みticketの消費を確定する
- capture failure が battle を継続するか等の捕獲内ルールは W-103

捕獲率、HP条件、「わ」倍率、最大投数、重複選択をこの文書から実装してはいけない。

### W-104 Evolution / Special Forms

Giga / Burst の対象、取得条件、変身効果の正本は W-104。W-102 は battle engine が特殊形態の能力補正を安全に扱える境界だけを持つ。

### W-105 World / Progression

stage / encounter が解放済みか、boss challenge gate、zone Lv帯は W-105 が正本。W-102 は「解放済みbattle target」だけを開始できる。

---

## 2. 新規battle開始gate

新しいbattleは、**以下をすべて満たすときだけ**開始できる。

1. 当日の daily core が完了済み。
2. 対象stage / encounter が W-105 のルールで解放済み。
3. 有効なbattle ticketが1枚以上ある。
4. teamに有効なmonsterが1〜3体いる。
5. battle開始時に場へ出せるactive monsterがteam内にいる。
6. 別の `activeBattle` が存在しない。

### daily gateは持越しticketでも迂回不可

前日以前から有効なticketを持っていても、**当日のdaily core未完了なら新規battleを開始できない**。これはUIだけでなくdomain / engine側のgateにする。

### resumeは「新規battle」ではない

`activeBattle` が保存されている状態で reload / Safari終了 / crash / PWA再起動した場合は、そのbattleを再開する。

- 再開時にticketをもう1枚reserveしない。
- 翌日になっていても、既存battleのresumeを「新規battle」としてdaily gateで拒否しない。
- 技術中断を `abandon` とみなさない。

---

## 3. Team / active / switch

### team

- team最大: **3体**
- 場に出るmonster: **1体**
- battle開始時のteamを `teamAtStart` 相当で固定し、battle中のHPを個体単位で持つ。
- battle中の交代でHPを全回復させない。

### voluntary switch

- 生存しているteam memberへ交代できる。
- voluntary switchは **1行動を消費**する。
- 交代そのものは相手の通常攻撃より先に成立し、その後に相手の行動を受ける。

### forced switch

active monsterのHPが0になり、控えに生存個体がいる場合:

- battleは終了しない。
- 次の生存個体を選ぶ `needs_switch` 相当状態へ移る。
- faint後のforced switchは **追加1turnを消費しない**。

### defeat

team全員のbattle HPが0なら敗北。

- battle報酬は0。
- stage clearにはしない。
- reserve ticket settlementは**末尾のD-022 overrideを優先**する。
- 次の新規battleでは通常の開始状態へ戻す。敗北を理由に恒久ペナルティを付けない。

---

## 4. Stats / Level / XP curve

### 4.1 battle statは4つだけ

- HP / たいりょく
- ATK / こうげき
- DEF / ぼうぎょ
- SPD / すばやさ

`とくこう` / `とくぼう` は作らない。個体値 / 努力値も導入しない。同じspecies・同じLv・同じ変身補正なら同じbattle statになる。

### 4.2 Lvから実数値への変換

species base statを `baseHP / baseATK / baseDEF / baseSPD` とすると:

```text
HP    = floor(baseHP  × Lv / 50) + Lv + 10
ATK   = floor(baseATK × Lv / 50) + 5
DEF   = floor(baseDEF × Lv / 50) + 5
SPD   = floor(baseSPD × Lv / 50) + 5
```

特殊形態による倍率は、W-104の契約に従ってこの実数値計算へ適用する。

### 4.3 monster XP curve

```text
totalXp(L) = round(6 × (L - 1)^1.9)
```

次Lvに必要なXPは `totalXp(L+1) - totalXp(L)`。

### 4.4 Lv上限

現runtimeはLv100でclampしているが、exact baseline / 回収済みユーザー判断から「Lv100を製品上の最終上限」とする明示決定は今回確認できなかった。

**BLOCKED DECISION（非blocking）**: product上のlevel cap。  
CURRENT実装互換として既存Lv100 clampを変更する根拠はないため、別決定が出るまでは既存save互換値を維持してよいが、Lv100を新しい製品決定として引用してはいけない。

---

## 5. Battle ticket reservation lifecycle — D-007

### 5.1 ticket inventory

- ticketは獲得日を含む **7日間** 有効。
- lot単位で `earnedAt/earnedDay` と `expiresAt/expiresDay` 相当を保持する。
- 使用順は **FEFO**（期限が最も近いlotから）。
- 期限切れlotは利用不可。

### 5.2 start = reserve

新規battle開始が全gateを通過した時点で、FEFO lotから1枚を **reserve** する。

実装上inventoryから一時的にcountを減らす方式でもよいが、意味は「消費確定」ではない。`activeBattle` に少なくとも次を保存する。

```text
ticketReservation = {
  sourceLotId,
  earnedAt/earnedDay,
  expiresAt/expiresDay
}
```

### 5.3 terminal outcome — D-022で一部置換

この節の旧refund表はD-022で後続置換された。**現在は末尾overrideのplayed-battle settlementを正とする。**

旧D-007では敗北/明示abandonでrefundしていたが、Battle V6ではplayed loss / explicit abandonもcommitする。

### 5.4 exactly-once

同じbattleについて:

- reserveは1回だけ
- terminal settlementは1回だけ
- reward resolutionも1回だけ

`battleId / battleResolutionId` 等の冪等キー、または同等の永続状態で二重処理を防ぐ。

### 5.5 explicit abandonと技術中断を分ける

ユーザーが明示的にbattleをやめた操作だけが `abandon`。

- browser close
- PWA background kill
- reload
- crash
- accidental navigationからの復帰可能な中断

は自動abandonにしない。

boss画面で子ども向け文言を `にげる` にするか `やめる` にするかはW-106のUI責務。

---

## 6. Moves / type / damage

### 6.1 move slots

- 1体が同時に持てるmoveは **最大4つ**。
- 5つ目を覚えるときだけ、どれと入れ替えるか選ぶ。
- 忘れたmoveは `おもいだす` で再取得可能にする。
- `まもる` は正式なmoveであり、4枠ルールの外に常設される第5battle actionとして扱わない。

### 6.2 baseline move power bands

CURRENTの基礎bandは exact baselineを継承する。

| power | 位置づけ | accuracy |
|---:|---|---:|
| 40 | 追加効果つき小技 | 100 |
| 60 | 標準主力 | 100 |
| 80 | 強い技 | 95 |
| 100 | 専用 / finishing技 | 90 |
| 110 | Burst専用 | 95 |

個別move masterはdata masterを参照する。特殊形態側のmove置換詳細はW-104。

### 6.3 type

- battle type systemは18タイプ。
- 相性倍率は `2 / 1 / 0.5 / 0`。
- immunity (`0`) は必ず0 damage。最低1damageの下駄を入れない。
- 複合typeをdataが持つ場合は各defender type倍率の積で計算できるengine構造にするが、active monster masterのtype構成自体はW-109を正とする。

### 6.4 STAB — D-022で置換

旧値1.5はBattle V6で置換。現在値は末尾overrideの`1.25`。

### 6.5 critical / random — D-022で置換

旧 `critical multiplier 1.5 / random 0.90〜1.00` はBattle V6で置換。現在値は末尾overrideを正とする。

### 6.6 damage formula

```text
base = floor(
  floor((2 × Lv / 5 + 2) × power × ATK / DEF) / 50
) + 2

damage = floor(base × STAB × type × critical × random)
```

- `type == 0` なら先に0を返す。
- それ以外は最低1damage。

### 6.7 turn order

- SPDが高い側が先。
- SPD同値は **ランダム**。
- voluntary switchは通常攻撃より先に交代成立。
- forced switchは無料。

---

## 7. Protect / まもる

`まもる` は正式採用済み。

| 項目 | CURRENT |
|---|---|
| 成功率 | 100% |
| damage | そのturnのdamageを100%防ぐ |
| status | そのturnのstatus effectも防ぐ |
| PP / gauge | 不要 |
| 連続使用 | 不可 |
| cooldown | 使用後の次1turnは選べない |

使用直後は子どもに「つぎは まもるを つかえないよ！」相当を明示する。

bossの大技予告では、少なくとも以下の3つの意味ある選択が成立すること。

- まもる
- こうたい
- 攻撃で押し切る

---

## 8. Status effects

exact baselineでbattle statusは4つに限定する。

| status | 効果 | duration |
|---|---|---|
| やけど | ATK ×0.7、turn終了時 最大HPの1/16 damage | battle終了まで |
| まひ | SPD ×0.5、25%で行動不能 | battle終了まで |
| どく | turn終了時 最大HPの1/8 damage | battle終了まで |
| ねむり | 行動不能 | 1〜3turn、攻撃を受けると起きる |

- こんらんは入れない。
- battle終了ですべて治る。
- 同一statusは重複しない。
- ほのおはやけど無効、でんきはまひ無効、どく/はがねはどく無効。
- statusは捕獲率へ影響させない。捕獲側のCURRENT詳細はW-103。

---

## 9. Enemy battle model / AI

### 9.1 enemy stats

enemyもplayerと同じ4stat式・type相性・damage式を使う。敵だけ別の見えないIV/EVを持たせない。

bossのHP/ATK/DEF等を強化する場合は明示的なbalance multiplierとして扱う。

### 9.2 level policy — D-011との接続

enemy levelはplayer Lvへ完全追従させない。

approved world directionは:

```text
enemyLevel = clamp(zone.minLv, softScaledLevel, zone.maxLv)
```

- zone Lv帯が上下限。
- 強いteamで過去zoneへ戻ったときは敵が無限追従せず、育成差を実感できる。
- current production zone Lv帯はW-105末尾のBattle V6 overrideを正とする。
- normal difficultyのtarget multiplier、repeat cap等はplaytest tuningであり、変更時はcanonical-sync gateで本書を同PR更新する。

### 9.3 AI input readingは禁止

**敵はplayerのそのturnの入力を見てから最適行動へ変更しない。**

特に:

- playerが交代を選んだ後に、交代先へ有利なmoveへ差し替えない。
- playerがmoveを選んだ後に、そのmoveを見てcounterへ差し替えない。

AIの行動はplayer input確定前に決定するか、少なくとも同じ結果になる情報境界を守る。

baselineのAI方針:

- wild: 有利moveがあれば70%で選択、なければ高power中心
- boss: 有利moveを優先、HP半分以下で1回attack up、status成功率を抑制

これらの細かな確率はAI tuning値として調整可能だが、**input reading禁止**はproduct contractである。

---

## 10. Battle XP / Mana

### 10.1 Battle XP — D-020 / D-022で置換

旧本文の「teamAtStart全員へ同額」「baseline 40〜80 / boss300」記述は、Evolution pacing V5（D-020）とBattle V6（D-022）で後続置換された。

現在の配分・level-gap multiplierは末尾overrideを正とする。

defeat / explicit abandonではBattle XPを付与しないという構造は維持する。

### 10.2 Mana

current runtimeにはstageごとのMana付与が存在するが、W-102で確認したexact baseline / user decisionには「battle勝利Manaの正式式・固定量」の十分な根拠がない。

**BLOCKED DECISION（非blocking）**: battle由来Manaの正式な付与式。  
既存runtime値を「CURRENT正本」として引用しない。W-101等のMana/reward canonicalで根拠が確定するまで、新しい量を創作しない。

---

## 11. Boss balance / rematch — D-012

### 11.1 product goal

story / area bossは、初回時に適正な強さを持たせつつ、playerが育成してから通常再戦した場合は **相対的に楽になる**。

player Lv / combat powerへ毎回完全追従して、育成差を相殺してはいけない。

### 11.2 first normal encounter snapshot

story / area bossの **最初の通常battle開始時** にboss balance snapshotを作り、battle action開始前に永続化する。

snapshotは少なくとも次を再現できる情報を持つ。

```text
bossSnapshot = {
  stageId,
  bossId,
  lockedLevel,
  statMultipliers,
  referencePower,
  targetPower,
  balanceVersion
}
```

first win時ではなくfirst normal encounter開始時に固定する理由は、初回敗北後に育成して戻った子が「育てたのにbossも同じだけ強くなった」と感じるのを防ぐため。

### 11.3 normal rematch

有効なsnapshotがある通常再戦では:

- current team powerで再scaleしない。
- `lockedLevel / statMultipliers` 等をsnapshotから再利用する。
- playerのLv / stat / evolutionが上がった分だけ相対的に有利になる。

### 11.4 challenge rematch

challenge再戦だけはcurrent player powerを使って再scaleしてよい。

- challenge planは通常snapshotを上書きしない。
- challengeを終えた後の通常再戦は、元のnormal snapshotへ戻る。

challenge modeの個別reward / ticket価格はD-012では確定していない。battle ticketを使用するbattleとして扱う場合は current ticket lifecycleを必ず適用するが、challenge専用追加costを勝手に作らない。

### 11.5 balanceVersion replacement

balance ruleを互換不能に変更し、保存済みsnapshotの `balanceVersion` がcurrent versionと一致しない場合:

1. 旧snapshotをinvalidと判定。
2. **通常battle開始時に1回だけ** current ruleで新snapshotを計算。
3. 新snapshotを旧snapshotへ置換して永続化。
4. そのbattle以後の通常再戦は新snapshotへ再固定。
5. playerがさらに育っても毎回再計算しない。
6. challengeだけは別途current powerへrescale可能。

`balanceVersion` 更新のたびに通常bossが毎回playerへ追従する状態は仕様違反。

### 11.6 boss tuningと大技

exact baselineは「予告 → 次turn大技」と `まもる / こうたい / 押し切る` の判断をboss戦の山場にしている。この構造は維持する。

baselineの検証値は:

- 予告turn側 power 50
- 大技 power 170
- 大技 accuracy 90%
- boss HP目安 同Lv帯の1.6倍

一方、最終のenemy HP / move power等はplaytest調整対象。構造を壊さない範囲でconfig調整可能で、current rank別 tuningは末尾overrideを参照する。

---

## 12. Defeat / abandon / crash state contract — D-022で一部置換

### defeat

```text
fighting
  -> active faint + reserve alive : needs_switch
  -> team all faint               : lost
```

`lost` 到達時:

- reward 0
- **ticketはBattle V6でcommit**
- result clear後のretryは新battleとして新しいticket gateを通る

### explicit abandon

`fighting / needs_switch` からユーザーが明示的にやめる:

- **reserved ticketをcommit**
- `activeBattle` を終了
- 次回は新規battle gateを通る

### crash / reload

- `activeBattle` を保存したままresume
- battle HP / active instance / turn / enemy HP / boss state / ticket reservation / RNGに必要なstateを復元
- reward / ticket / attackを二重処理しない

### finished battle clear

`won / caught / lost` の結果を画面から閉じる操作は、すでに解決したticket / rewardを再処理しない。

---

## 13. Runtime delta ledger — historical note

この旧ledgerは2026-08-25時点の差分記録であり、D-020/D-022後のruntimeに対してそのまま「現runtime」と読んではいけない。

特にSTAB / critical / random / ticket loss settlement / XPは後続で意図的に変更済み。

D-012 snapshot replacement、AI input-read禁止、move/status model等の非競合事項は引き続き監査対象。

---

## 14. BLOCKED DECISION

W-102 coreを止めない未確定:

1. **製品上の最終level cap** — runtime互換値100はあるが、明示product decisionとしては未回収。
2. **battle由来Manaの正式付与式** — runtime値のみでは正本化しない。

---

## 15. 2026-08-29 Battle V6 override — D-020 / D-022

この節は上の旧節と競合する場合に**後勝ち**するCURRENT overrideである。非競合のmove slots / type / Protect / status / AI boundary / boss snapshot等は上の本文を維持する。

### 15.1 Study-first ticket settlement

- battle start: exact FEFO ticketを1枚reserve。
- win: commit。
- capture success: commit。
- **played loss: commit。refundしない。**
- **explicit voluntary abandon: commit。refundしない。**
- reload / Safari終了 / crash: same activeBattle resume。追加reserve/commitしない。

目的はloss/abandonによるfree retry/reroll loopを防ぐこと。技術中断をabandon扱いしてはいけない。

### 15.2 Battle V6 damage tuning

- STAB: **1.25**
- critical chance: **1/16**
- critical multiplier: **1.35**
- damage random: **0.92〜1.00**
- type effectiveness: `2 / 1 / 0.5 / 0`
- immunity: 0 damage

formula構造は本文§6.6を維持する。

### 15.3 Normal fair-fight invariant

product invariant:

```text
normalReferencePower >= activeMonsterPower
```

強いactive1体 + 弱いbenchを入れることで、通常enemyをactive単体基準より弱くしてはいけない。

Current main #110 implementationは `0.70 * active + 0.30 * strongestSupport` を使うため、supportが弱い場合にactive-onlyを下回り得る。これは**既知のimplementation drift**であり、product ruleではない。open PR #111がこのhotfixを扱っているが、mergeされるまではruntime修正済みとは扱わない。

Current V6 normal tuning:

| difficulty | target | encounter XP pool |
|---|---:|---:|
| weak | 0.86 | 90 |
| normal | 0.96 | 110 |
| strong | 1.03 | 125 |
| rare | 1.08 | 145 |
| elite | 1.13 | 165 |

already-cleared normal stageはfirst-clear referenceを基準にrepeat capを持ち、育成後に旧areaが相対的に楽になる。Current repeat reference capは約`1.10`、defensive mastery floorは約`0.70`。

### 15.4 Boss V6 tuning

Boss referenceはteam/roster/carry floorを考慮し、弱い入替でfirst snapshotを不当に下げない。

Current tuning:

| rank | target | HP | ATK | DEF | XP pool |
|---|---:|---:|---:|---:|---:|
| C | 1.04 | 1.30 | 1.00 | 1.02 | 180 |
| B | 1.10 | 1.45 | 1.03 | 1.05 | 200 |
| A | 1.16 | 1.60 | 1.05 | 1.07 | 220 |
| S | 1.22 | 1.75 | 1.08 | 1.10 | 250 |
| EX | 1.30 | 1.90 | 1.10 | 1.12 | 300 |

Current carry floorはおよそ`0.80 * strongest roster power`、softened roster referenceはおよそ`0.85 * weighted roster power`。数値はplaytest tuningで、変更時はこのCURRENTも同PR更新する。

balance version: **6**。

### 15.5 Evolution pacing V5 + Battle XP V6

D-020 base distribution:

- active battler: encounter poolの`40%`
- other eligible teammate: active受取量の`40%`（poolの16% before later modifiers）

D-022 level-gap multiplier:

| player minus enemy level | multiplier |
|---|---:|
| `>= +15` | 0.15 |
| `>= +10` | 0.25 |
| `>= +6` | 0.50 |
| normal band | 1.00 |
| enemy >= player +3 | 1.15 |
| enemy >= player +5 | 1.25 |

old-area easy farmingを最速育成経路にしない。XP throttlingはfinal XP/level/evolution settlementの一部として扱い、表示だけ後補正にしない。

### 15.6 Post-KO capture bridge

通常capturable wildをKOした後にもpost-KO capture opportunityを残す。

- boss / captureDisabled / special battleは対象外。
- KO時にsettleしたBattle XPはexactly once。
- post-KO capture successでBattle XPを再付与しない。
- newly captured monsterへそのbattle XPをretroactive付与しない。
- turn/KO presentation完了前にpost-KO CTAをactionableにしない。

Capture probability/items/duplicate settlementはW-103を正とする。

### 15.7 Common terminal settlement

move / Protect / voluntary switch / failed capture / end-turn DOT等、どのaction pathからwin/loss/KOへ到達しても同じauthoritative settlementを通す。

UIの表示順序の違いでticket/reward/outcomeが変わってはいけない。

### 15.8 Acceptance addendum

- played loss/explicit abandon consumes exact reservation。
- crash/reloadはdouble consumeなし。
- STAB1.25 / crit1.35 / random0.92〜1.00。
- normal referenceはactive-only floorを下回らない。
- weak bench exploit不可。
- V5 XP distribution + V6 level-gap multiplier。
- post-KO capture no double XP。
- terminal settlement converges across all action paths。
- KO presentation完了前にpost-KO CTAを進めない。
