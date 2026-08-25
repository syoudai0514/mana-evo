# ManaEvo CURRENT — Battle / Tickets / Boss Balance

更新日: 2026-08-25  
Work Item: W-102  
状態: **PHASE 2 CURRENT CANONICAL CANDIDATE**  
対象: バトル開始条件、戦闘ルール、ticket lifecycle、battle XP、boss balance / rematch

> この文書は、W-102 の実装に必要な CURRENT 契約を一か所に集約する。runtime は実装状況の確認にのみ使い、仕様根拠にはしない。
> 捕獲の成功率・「わ」・重複捕獲・捕獲演出は W-103 (`design/current/03-CAPTURE-DUPLICATES.md`) の責務であり、この文書では定義しない。

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
- reserve ticketは §5 に従い返却する。
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

### 5.3 terminal outcome

| outcome | ticket |
|---|---|
| 勝利 | reserveを**消費確定** |
| 捕獲成功 | reserveを**消費確定** |
| 敗北 | 元lot / 元期限で**1枚返却** |
| 明示的な `にげる / やめる / abandon` | 元lot / 元期限で**1枚返却** |
| reload / crash / Safari終了 | **返却も追加reserveもしない**。同じactiveBattleをresume |

返却時点ですでに元ticket期限を過ぎている場合、期限を延長して復活させない。

### 5.4 exactly-once

同じbattleについて:

- reserveは1回だけ
- refundは最大1回
- commitは最大1回
- reward resolutionも最大1回

`battleId / battleResolutionId` 等の冪等キー、または同等の永続状態で二重処理を防ぐ。

### 5.5 explicit abandonと技術中断を分ける

ユーザーが明示的にbattleをやめた操作だけが `abandon`。

- browser close
- PWA background kill
- reload
- crash
- accidental navigationからの復帰可能な中断

は自動abandonにしない。

boss画面で子ども向け文言を `にげる` にするか `やめる` にするかはW-106のUI責務。domainには明示abandon + refund契約を持たせる。

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

### 6.4 STAB

**STAB = 1.5**。

自分のtypeとmove typeが一致するとdamageへ×1.5。一致しなければ×1.0。

### 6.5 critical / random

- critical: **1/16**
- critical multiplier: **1.5**
- player / enemyとも同率
- damage random: **0.90〜1.00**

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
- 現行の具体zone Lv帯はW-105で `TUNING-DEFAULT` として管理する。
- `NORMAL_DIFFICULTY` のtarget multiplier、repeat cap等の現在値はplaytest用実装値であり、ユーザー決定として固定しない。

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

### 10.1 共通XP contract

- victoryでbattle XPを得る。
- battle開始時teamにいた最大3体へ **同額**付与する。
- activeに出なかった個体も `teamAtStart` にいれば同額。
- defeat / explicit abandonではbattle XPを付与しない。

exact baselineの初期balance値:

- 通常battle勝利: **40〜80 XP（相手Lvによる）**
- boss勝利: **300 XP（初回のみ）**

PR #5では最終XP値はplaytest調整対象として明示されているため、40〜80 / 300を「永久固定の製品数値」にはしない。ただし後続で別の正式XP式が承認された証拠はないので、runtimeの90〜165等をユーザー決定へ昇格させてもいけない。

実装時はXP値をconfig化し、**team全員同額 / defeat 0 / boss初回bonusをrepeatへ無条件複製しない**という構造を守る。

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

challenge modeの個別reward / ticket価格はD-012では確定していない。battle ticketを使用するbattleとして扱う場合は §5 lifecycleを必ず適用するが、challenge専用追加costを勝手に作らない。

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

一方、PR #5は最終のenemy HP / move power等をplaytest調整対象としている。したがってこれらの**数値**はbalance configとして扱い、構造を壊さない範囲で調整可能。現在runtimeのrank別 multiplierをユーザー決定として固定しない。

---

## 12. Defeat / abandon / crash state contract

### defeat

```text
fighting
  -> active faint + reserve alive : needs_switch
  -> team all faint               : lost
```

`lost` 到達時:

- reward 0
- ticket refund exactly once
- clear/retry後に新battle開始可能

### explicit abandon

`fighting / needs_switch` からユーザーが明示的にやめる:

- ticket refund exactly once
- `activeBattle` を終了
- 次回は新規battle gateを通る

### crash / reload

- `activeBattle` を保存したままresume
- battle HP / active instance / turn / enemy HP / boss state / ticket reservation / RNGに必要なstateを復元
- reward / ticket / attackを二重処理しない

### finished battle clear

`won / caught / lost` の結果を画面から閉じる操作は、すでに解決したticket / rewardを再処理しない。

---

## 13. Runtime delta ledger — 実装時に合わせる箇所

この表はruntimeを正本化するためではなく、CURRENTへ実装を合わせるための差分一覧。

| 項目 | CURRENT | 現runtime | 判定 |
|---|---|---|---|
| daily gate | 当日daily core未完了なら新規battle不可 | domain gateあり | ALIGN |
| ticket start | reserve | inventoryから減算しsourceをactiveBattleへ保持 | 挙動は概ねALIGN。`ticketCommitted=true`等の名前を仕様根拠にしない |
| loss / abandon | 元期限でrefund | refund実装あり | ALIGN |
| reload/crash | same activeBattle resume | activeBattle保存あり | ALIGN |
| STAB | **1.5** | **1.2** | **IMPLEMENTATION_DRIFT** |
| critical | 1/16 ×1.5 | damage計算に存在しない | **IMPLEMENTATION_DRIFT** |
| damage random | 0.90〜1.00 | damage計算に存在しない | **IMPLEMENTATION_DRIFT** |
| speed tie | random | `>=`でplayer先手 | **IMPLEMENTATION_DRIFT** |
| protect | 4 move枠内の正式move | speciesの4 movesとは別action | **IMPLEMENTATION_DRIFT / model mismatch** |
| status 4種 | burn/paralysis/poison/sleep | battle engineに一式未接続 | **IMPLEMENTATION_DRIFT** |
| AI input read | 禁止 | switch後のactiveを見てenemy move選択 | **IMPLEMENTATION_DRIFT** |
| boss normal rematch | snapshot lock | valid snapshotはlock | ALIGN |
| old balanceVersion | 1回replacementして再lock | new planを作れても旧snapshot存在時は保存しない | **IMPLEMENTATION_DRIFT (D-012)** |
| boss big move | telegraph構造、数値はtuning | rank別power、accuracy 100 | STRUCTURE概ねALIGN / tuning要監査 |
| normal enemy scaling | zone clamp + old-area growth feel | soft scale + repeat cap | 構造候補。具体倍率はTUNINGでありcanonical固定しない |
| battle XP | team同額、baseline 40〜80 / boss初回300、数値tuning可 | normal 90〜165 / boss 180〜300を毎勝利 | **BALANCE / REWARD ALIGNMENT REQUIRED** |
| battle Mana | 正式式の根拠不足 | stage.mana付与 | **NOT CANONICALIZED** |

特にD-012 drift:

```js
if (balancePlan?.snapshot && !challenge && !existingSnapshot) {
  // old-version existingSnapshot が truthy だと replacement を保存できない
}
```

実装では「existing snapshotが存在するか」ではなく「**current versionとして有効か / replacementが必要か**」で保存判定する。

---

## 14. Implementation acceptance for W-102 consumer

W-102を実装するworkerは、古いdesign文書を読み直さなくても少なくとも次をtestできること。

1. daily未完了 + 有効持越しticket => new battle拒否。
2. daily完了 + unlocked stage + ticket => FEFO lotを1枚reserve。
3. reload => same activeBattle、ticket追加減算なし。
4. defeat => 元期限lotへ1枚refund、reward 0。
5. explicit abandon => 元期限lotへ1枚refund。
6. win => refundなし、reserve消費確定、reward exactly once。
7. capture success => ticket消費確定だけをW-103結果から受け取る。
8. team最大3 / active1 / voluntary switch 1 action / forced switch free。
9. 4stat式・XP curveが本書どおり。
10. STAB 1.5、type0=0damage、critical、0.90〜1.00 randomをtest。
11. speed tieが固定player先手にならない。
12. protect 100% block + next turn unavailable。
13. status 4種とbattle終了clear。
14. enemy AIがplayer inputを後読みしない。
15. boss初回通常battleでsnapshot保存。
16. player育成後の通常boss再戦は同snapshotで相対的に楽になる。
17. challengeだけcurrent powerへrescaleし、normal snapshotを壊さない。
18. old `balanceVersion` snapshot => replacementを1回保存し、その後再lock。
19. boss first-clear XPを通常再戦へ無条件に再付与しない。
20. battle Manaは別canonical根拠確定まで新規仕様を創作しない。

---

## 15. BLOCKED DECISION

W-102のcore implementationを止めない未確定は2点。

1. **製品上の最終level cap** — runtime互換値100はあるが、明示product decisionとしては未回収。
2. **battle由来Manaの正式付与式** — runtime値のみでは正本化しない。

この2点以外は、本文のCURRENT contractに従って実装可能。
