# Monster / World / Progression specification drift audit — Phase 1.5 re-audit

- Worker: SOL④ / Worker 4
- Date: 2026-08-25
- Repository: `syoudai0514/mana-evo`
- PR: #38
- Audit branch: `rebuild/w4-monster-world-progression-audit`
- Governance base: `rebuild/canonical-governance`
- Scope: monster master / world / wild encounter / progression / dex / BOX / team / duplicate capture provenance audit
- Non-goal: runtime・master・testsの変更、未承認仕様の創作

## 0. Governance and evidence rule

最初に以下を確認した。

- `REBUILD-START-HERE.md`
- `design/rebuild/USER-DECISION-EVIDENCE.md`
- `design/rebuild/PHASE-1-COMMANDER-REVIEW.md`
- `design/rebuild/DECISION-LOG.md`

再建時の優先順位は次の通り。

1. ユーザーの明示決定
2. FINAL-CORRECTED baseline
3. 原本以降の承認済み変更
4. current canonical design
5. data master
6. runtime
7. 過去レビュー / CI

したがって、`design/20` に「ユーザー承認済み」と書いてあること、PRがmerge済みであること、runtime/testがPASSしていることだけでは、全細目を `CONFIRMED_CHANGE` としない。

### 0.1 exact baselineの扱い

司令塔 `PHASE-1-COMMANDER-REVIEW.md` は、exact `mana-evo-terra-FINAL-CORRECTED(3).zip` を正常展開し、原本32ファイルを確認済みと記録している。その司令塔によるexact確認結果を本監査の最上位baseline evidenceとして使用する。

一方、このWorkerセッションからは添付ZIP bytesを直接取得できず、PR #35にもまだexact payloadは保存されていない。そのため、本監査は**司令塔がexact原本で確認済みと明記した事実以上を、直接byte確認したかのようには書かない**。

証拠レベル:

- **E0**: `USER-DECISION-EVIDENCE.md` に回収済みのユーザー明示判断
- **E1**: `PHASE-1-COMMANDER-REVIEW.md` のexact archive確認結果
- **E2**: PR #15等の原 `families.mjs` 機械比較記録
- **E3**: 後続design / PR #27 / PR #29 / runtime / tests

## 1. Re-audit executive findings

1. **239→238は `UNRESOLVED` ではない。`CONFIRMED_CHANGE`。** E1でbaselineは84系列 / 239体、No.239=`シラユキヒメ`。E0/UDE-001で2026-08-24に「現行有効master=No.001〜238、No.239は元資料に残すがゲームから除外」と明示決定済み。
2. **84→83も同じ明示変更の直接帰結として `CONFIRMED_CHANGE`。** active範囲No.001〜238は83系列で、除外されたNo.239を含むbaseline全体は84系列だった。
3. No.239は削除ではなく、**source/referenceには保存し、active runtime masterから除外**が正しい。
4. 2026-08-25のUDE-005により、**「自分で育てて進化させる」ワールド/進化方向は承認済み**。特に「第2形態の初回入手を自力進化にする」「自力進化後に第2形態wildを解禁する」「最終形を通常wildのごほうびにしない」「自力進化の発見記録を持つ」という中心方針は後続承認範囲に入る。
5. ただし、**zoneの具体Lv数値、bossの5探索clear、grade→world、学年報酬キャラ、duplicate captureの処理まで自動的に承認済みにはしない**。
6. `area` は原本由来の制作master属性として保持する。後続の冒険配置レイヤはcurrent実装上 `adventureArea` であり、依頼文の `adventureRegion` は同概念を指すものとして監査する。field名の新規変更は行わない。
7. duplicate captureはcurrent runtimeでは同speciesでも新instanceをBOXへ追加するだけで、原本候補として記録されている「なかまにする / おうえんにかえる」「育ちのかけら」の分岐がない。後続ユーザー承認も回収されていないため `UNRESOLVED` のまま、強い implementation-drift candidate とする。

---

## 2. Item-by-item reclassification

### 2.1 239体 → 238体

**BASELINE — E1/E2**

- exact FINAL-CORRECTED: **84系列 / 239体**。
- No.239は `シラユキヒメ`。
- PR #15復元記録でも原 `families.mjs` flatten = 84系列 / 239体。

**LATER USER DECISION — E0**

UDE-001:

- 2026-08-24 16:23:33 JST
- 現行有効masterは **No.001〜238**。
- No.239 `シラユキヒメ` は元資料に残すがゲームから除外。

**CURRENT**

- growth master / generator / tests / runtimeは238を固定。

**CLASSIFICATION**

`CONFIRMED_CHANGE`

**CANONICAL IMPLICATION**

238体をactive masterとする。239を戻す判断は不要。baseline archive/referenceには239を保持する。

### 2.2 84系列 → 83系列

**BASELINE — E1/E2**

- exact baseline: 84系列。
- No.001〜238 active data: 83系列。

**E0**

UDE-001がactive masterをNo.001〜238へ限定している。

**CLASSIFICATION**

`CONFIRMED_CHANGE`

**CANONICAL IMPLICATION**

active runtimeは83系列。baseline/referenceは84系列を保全する。

### 2.3 No.239 シラユキヒメ

**BASELINE — E1**

司令塔exact確認:

- No.239 = `シラユキヒメ`
- Area4
- ice系
- special-event completed entity

**E0**

UDE-001でゲームから除外、元資料には残すと明示決定。

**CLASSIFICATION**

`CONFIRMED_CHANGE`

**CANONICAL IMPLICATION**

- source/reference: retain
- active species registry / dex target / runtime encounter / image required scope: exclude
- 「存在しなかったこと」にして原本から削除しない

### 2.4 No.001〜238の系列・進化・source area

**BASELINE — E2**

PR #15 validationはNo.001〜238について原 `families.mjs` と以下を比較し、不一致0件:

- No / name
- `area`
- type
- source rank / role
- stage / maxStage
- motif / concept / description
- evolution method / param

**CURRENT**

83系列 / 155進化遷移。

**CLASSIFICATION**

`SAME`

**NOTE**

238というactive範囲自体は2.1の `CONFIRMED_CHANGE`。その範囲内の元データ内容はbaseline一致。

### 2.5 `area` と `adventureArea` / `adventureRegion`

**BASELINE — E2**

制作masterの `area` はNo.001〜238で原資料と一致。

**LATER DESIGN — E3**

`design/20` は、制作管理上の `area` とゲーム内配置 `adventure area / zone` を分離する方針を導入。

**USER APPROVAL — E0**

UDE-005は「自分で育てて進化させる」world/zone方向を後続承認済みとする。

**CLASSIFICATION**

- source `area` を保持: `SAME`
- 冒険配置を別レイヤで持てるという方針: `CONFIRMED_CHANGE`
- 個別speciesの全 relocation map: `UNRESOLVED` detail（design記載だけで全件承認とはしない）

**NOTE**

current code fieldは `adventureArea`。`adventureRegion` という別fieldを新設する根拠はない。

### 2.6 Area1〜4 / EX

**BASELINE**

- production monster dataはArea1〜4を持つ。
- exact archiveのEX位置付けについて、司令塔reviewの要約だけでは「独立第5area / event / postgame」の細目まで確認できない。

**LATER DESIGN**

`design/20`:

- Area1〜4 + EX
- EXはやりこみ領域

**E0**

UDE-005でworld方向の承認は回収済み。

**CLASSIFICATION**

- Area1〜4を基本worldとすること: `SAME`
- EXを後続world体験として持つ方向: `CONFIRMED_CHANGE`
- EXの厳密なunlock条件・第5areaとしての内部表現: `UNRESOLVED` detail

### 2.7 入口 / 中盤 / 奥地

**LATER DESIGN / PR TIMELINE — E3**

- PR #27: 各Areaを入口 / 中盤 / 奥地へ分割。
- PR #29: 入口→中盤→奥地の順次解放を追加。

**E0**

UDE-005はworld / zone / evolution directionに加え、2026-08-25 10:25 JSTに再レビュー修正の実装継続承認を記録。

**CLASSIFICATION**

- 3zone構造と順次進む方向: `CONFIRMED_CHANGE`
- 「前zoneの野生2ステージ初回clear」という**具体数2**: `UNRESOLVED` detail

理由: UDE-005は方向性承認の証拠として強いが、数値2を直接引用したユーザー決定までは証拠台帳に固定されていない。

### 2.8 zone Lv帯

**LATER DESIGN**

現行 `design/20`:

- Area1 5–22
- Area2 18–38
- Area3 32–58
- Area4 50–80
- EX 70–100

敵Lvをzone範囲でclampし、過去areaへ戻れば育成分だけ楽になる方向。

**E0**

UDE-005とUDE-003は、育成で過去敵/ボスが楽になる方向を支持する。

**CLASSIFICATION**

- **zoneごとにLv帯を持ち、完全追従させない方針**: `CONFIRMED_CHANGE`
- 上記5組の**具体min/max数値**: `UNRESOLVED`

数値はcurrent design/runtimeが一致していても、それだけでユーザー明示承認とはしない。

### 2.9 ボス解放 / world unlock

**BASELINE — canonical evidence**

`USER-DECISION-EVIDENCE.md` の未回収項目は、baseline boss unlockを「地域別学習進行12pt + unique skill 2」と記録している。

**CURRENT**

- boss: `minAreaClears=5`
- next area: previous area boss clear
- zone: previous zone clear数
- EX: Area1〜4 boss clear

**E0**

- UDE-005はworld方向を承認。
- しかし同じ `USER-DECISION-EVIDENCE.md` は、**原本の12pt + unique skill 2 → current 5探索clearとの差を未回収・要継続調査**として明示的に残している。

**CLASSIFICATION**

- boss撃破で次areaへ進む基本方向: `SAME` / 維持候補
- boss解放を「5探索clear」に変えること: `UNRESOLVED`
- EXを4boss clearで開ける具体条件: `UNRESOLVED`

ここは `design/20` の「ユーザー承認済み」表記だけで `CONFIRMED_CHANGE` に上げない。

### 2.10 第1形態 wild

**BASELINE / RECOVERED MASTER**

原masterの `wildCatchable / encounterPool` をNo.001〜238で復元。第1形態を通常探索の中心にする構造と矛盾しない。

**CURRENT / LATER**

第1形態は通常wild、単段階完成種は例外としてwild可能。

**CLASSIFICATION**

`SAME`

**CAUTION**

「全stage1を無条件wild」とはしない。原masterのevent/boss/completed entity指定を優先する。

### 2.11 第2形態 — 初回は自力進化

**BASELINE**

原masterにはwild/evolutionOnly区分があるが、currentの「全対象で初回自力進化を強制するgate」は後続強化。

**E0**

UDE-005の承認対象の中心は「自分で育てて進化させる体験」を強化すること。

**LATER DESIGN**

第2形態の初回入手は自力進化限定。

**CLASSIFICATION**

`CONFIRMED_CHANGE`

これはUDE-005の方向性そのものに含まれる。

### 2.12 自力進化後、第2形態wild解禁

**LATER DESIGN**

一度自力進化したspeciesのみ、上級/奥地wildで再遭遇可能。

**E0**

UDE-005のaffected scopeにworld / zone / evolution discoveryが明示されている。

**CLASSIFICATION**

`CONFIRMED_CHANGE`

**DETAIL**

A1系列をA3奥地、A2系列をA4奥地へ送る等の**全個別mapping**は2.5と同様に `UNRESOLVED` detail。

### 2.13 最終形 wild不可

**BASELINE / recovered evidence**

後続復元文書は「当初設計から維持・復活」と明記し、原masterのwild/evolutionOnly区分とも整合。

**E0**

UDE-005はfinal-form wild policyをaffected scopeとして回収済み。

**CLASSIFICATION**

`SAME`

**CANONICAL IMPLICATION**

通常探索で最終形を捕獲させない。ボス/強敵として姿を見ることと、通常wild捕獲は分ける。

### 2.14 `evolutionDiscoveries`

**PR TIMELINE**

- PR #27: 初回自力進化後wild解禁を導入。
- PR #29: `dex.caught` ではなく専用 `evolutionDiscoveries` へ変更。

**E0**

UDE-005は「自力進化方向」および evolution discovery をaffected scopeに含め、再レビュー修正の実装継続承認も記録。

**CLASSIFICATION**

`CONFIRMED_CHANGE`

**CANONICAL IMPLICATION**

「捕まえたこと」と「自分で進化させたこと」を別記録にする。単なる `dex.caught` 代用へ戻さない。

### 2.15 学年 / 先取り と world

**BASELINE**

Kids Quest由来の学年・先取りは存在するが、gradeとManaEvo world unlockをどう結合するかは、司令塔exact要約と回収済みユーザー判断だけでは確定できない。

**CURRENT**

- 学年解放: Kids Quest learning side
- world unlock: boss / route side
- current `isStageUnlocked()` はgradeを参照しない

**E0**

UDE-005は学年→world結合を承認した証拠ではない。

**CLASSIFICATION**

`UNRESOLVED`

学年とworldを勝手に結合もしない、分離をcanonical確定もしない。

### 2.16 学年報酬キャラ

**BASELINE / USER HISTORY**

学年報酬キャラは重要候補として過去設計議論に存在するが、回収済み `USER-DECISION-EVIDENCE.md` に具体species割当の明示決定はない。

**CURRENT**

具体masterなし。runtimeにgrade-up species grant pathなし。

**CLASSIFICATION**

`UNRESOLVED`

**RULE**

Workerがキャラを新規割当しない。原本表または後続明示決定を回収してからcanonicalizeする。

### 2.17 図鑑 / BOX / team

**BASELINE / historical design**

- 図鑑 = species
- BOX = captured instances
- `みていない / みつけた / つかまえた`
- evolution family表示
- team最大3体

**CURRENT**

- `dex.seen / dex.caught`
- `box` instance storage
- `team` 最大3
- evolutionでinstanceId/Lv/XP維持

**CLASSIFICATION**

`SAME`

238 scope決定後、dex総数のみ238へ追随する。

### 2.18 duplicate capture

**BASELINE EVIDENCE**

`USER-DECISION-EVIDENCE.md` の未回収項目に、duplicate captureの原本候補として以下が明示されている。

- `なかまにする`
- `おうえんにかえる`
- `育ちのかけら`

**CURRENT RUNTIME**

capture成功時は、同speciesを既に所持しているかに関係なく:

- `makeMonster()` で新instance作成
- `box[captured.instanceId]` へ追加
- `dex.caught[speciesId]=true`
- teamが3未満なら自動加入

duplicate専用の選択分岐はない。

**LATER APPROVAL**

原本のduplicate分岐を削除したというユーザー明示承認は回収されていない。

**CLASSIFICATION**

`UNRESOLVED`

**DRIFT RISK**

`IMPLEMENTATION_DRIFT` の強い候補。exact baseline sourceと後続approvalの最終照合で、削除承認がなければbaseline側へ戻す対象。

---

## 3. Approval scope matrix

| Topic | Baseline relation | User evidence | Result |
|---|---|---|---|
| 239→238 | baseline 239 | UDE-001 explicit | `CONFIRMED_CHANGE` |
| 84→83 | baseline 84 | UDE-001 active 001–238 | `CONFIRMED_CHANGE` |
| No.239 exclusion | baseline exists | UDE-001 explicit | `CONFIRMED_CHANGE` |
| source `area` | baseline value retained | none needed | `SAME` |
| separate adventure placement layer | later addition | UDE-005 direction | `CONFIRMED_CHANGE` |
| all relocation mappings | later detail | no direct itemized evidence | `UNRESOLVED` |
| Area1–4 | baseline structure | later reaffirmed | `SAME` |
| EX postgame direction | later/current world | UDE-005 direction | `CONFIRMED_CHANGE` |
| EX exact unlock | later detail | no explicit itemized evidence | `UNRESOLVED` |
| entrance/mid/deep direction | later zone design | UDE-005 | `CONFIRMED_CHANGE` |
| zone previous-clear count=2 | later numeric detail | not separately fixed in evidence ledger | `UNRESOLVED` |
| zone Lv band concept | later world design | UDE-003/UDE-005 | `CONFIRMED_CHANGE` |
| exact zone Lv numbers | later numeric detail | no itemized explicit decision | `UNRESOLVED` |
| boss→next area | original principle | later reaffirmed | `SAME` |
| boss unlock=5 clears | baseline differs | evidence ledger says unresolved | `UNRESOLVED` |
| first-form wild principle | original/recovered | consistent | `SAME` |
| stage2 first self-evolve | later strengthening | UDE-005 core direction | `CONFIRMED_CHANGE` |
| stage2 wild after self-evolve | later strengthening | UDE-005 core direction | `CONFIRMED_CHANGE` |
| final-form normal wild ban | original principle | UDE-005 reaffirmed | `SAME` |
| `evolutionDiscoveries` | later explicit mechanism | UDE-005 affected scope | `CONFIRMED_CHANGE` |
| grade→world | unclear | no explicit approval | `UNRESOLVED` |
| grade reward species | unclear | no concrete assignment approval | `UNRESOLVED` |
| dex/BOX/team | original | consistent | `SAME` |
| duplicate capture conversion | baseline candidate exists; runtime differs | no removal approval | `UNRESOLVED` / drift candidate |

---

## 4. Corrected 238 / 239 timeline

| JST | Evidence | Meaning |
|---|---|---|
| FINAL-CORRECTED baseline | E1 exact commander review | 84 families / 239 monsters; No.239 シラユキヒメ exists |
| 2026-08-24 16:18 | commit `9837c36536b032ede4246492d0f79afc231cc5a4` | Git上で238 master / No.239 reference-onlyを明文化 |
| 2026-08-24 16:23:33 | UDE-001 | **ユーザー明示で active No.001–238 / No.239 game除外を決定** |
| 2026-08-24 | PR #15 | 238 / 83 / No.239 absent をruntime gate化 |
| 2026-08-25 09:40–10:25 | UDE-005 | 自力進化を中心とするworld/evolution directionを後続承認 |
| 2026-08-25 Phase 1 review | Commander | PR #38はmaterial reclassification required、239→238はCONFIRMED_CHANGEと指示 |

旧auditの「GitHub conversationに239変更理由がないためUNRESOLVED」という結論は、GitHub外の過去チャットからUDE-001が回収された時点で**superseded**。

---

## 5. Current runtime evidence map

| Topic | Current evidence |
|---|---|
| 238 / 83 / 18 | generator / PR15 master tests |
| No.239 absent | generator / runtime registry tests |
| area + adventure layer | `src/game/worldProgression.js` |
| zone unlock | `adventureZoneProgress()` / `isStageUnlocked()` |
| self-evolve unlock | `evolutionDiscoveries` / `evolveInstance()` |
| final-form wild ban | `hidden + captureDisabled` |
| boss unlock | `minAreaClears=5`, area boss gates |
| grade / ahead learning | Kids Quest study runtime |
| dex / BOX / team | progression / engine / screens |
| duplicate capture | capture success always creates a new instance; no duplicate choice branch |

Runtime一致は承認証拠ではなく、上表は現状確認のためだけに使う。

---

## 6. Classification summary

### CONFIRMED_CHANGE

- 239 → 238 active monster scope
- 84 → 83 active family scope
- No.239 active runtime除外・reference保全
- production `area` と冒険配置レイヤを分離できる方針
- Area/zoneを使って育成差が出るworld方向
- 第2形態の初回自力進化
- 自力進化後の第2形態wild解禁
- `evolutionDiscoveries` で自力進化を別記録すること
- 入口 / 中盤 / 奥地というzone progressionの方向
- EXをpostgame/yari-komi worldとして持つ方向

### SAME

- No.001〜238の原系列 / 進化 / source area data
- 18タイプ
- Area1〜4を基本worldとすること
- 第1形態を通常wildの中心にする原則
- 最終進化形を通常wild捕獲させない原則
- 図鑑=species / BOX=instance / team最大3

### UNRESOLVED

- speciesごとの全 `adventureArea` relocation mapping
- entrance→mid / mid→deep の必要clear数 `2`
- exact zone Lv ranges `5–22 / 18–38 / 32–58 / 50–80 / 70–100`
- boss unlockを原本 `12pt + unique skill 2` から `5探索clear` へ変えること
- EXの厳密なunlock条件
- grade / ahead learning と world unlock の結合有無
- 学年報酬キャラの具体割当
- duplicate captureの `なかまにする / おうえんにかえる / 育ちのかけら`

### IMPLEMENTATION_DRIFT CANDIDATE

- duplicate capture: current runtimeに原本候補のduplicate分岐がない。後続削除承認がなければ次段で `IMPLEMENTATION_DRIFT` へ確定。

---

## 7. Recommendation / commander handoff

1. 238 / 83 / No.239はcanonical decisionへそのまま昇格可能。ユーザー再質問不要。
2. `design/current` 作成時は `area` と `adventureArea` を別概念として定義し、source areaを後続配置都合で書き換えない。
3. 第2形態の「初回自力進化 → discovery → wild解禁」はcanonicalへ昇格可能。
4. final form normal-wild banは維持。
5. exact zone Lv数値、2-clear zone gate、boss 5-clear、EX unlockは、UDE-005の方向性承認だけを根拠に固定しない。必要なら司令塔が追加decision evidenceを回収する。
6. grade/world、学年報酬キャラは未解決のままcurrent canonicalへ穴埋めしない。
7. duplicate captureは次段でexact baseline sourceを直接回収し、後続削除承認がなければbaseline復元候補として扱う。
8. 本Workerでは `src/**`、master、testsは変更しない。

## 8. Files / evidence reviewed

Governance:

- `REBUILD-START-HERE.md`
- `design/rebuild/USER-DECISION-EVIDENCE.md`
- `design/rebuild/PHASE-1-COMMANDER-REVIEW.md`
- `design/rebuild/DECISION-LOG.md`

Baseline / recovered original evidence:

- exact FINAL-CORRECTED facts recorded by commander
- `design/15-sol-review-validation-report.md`
- original-source comparison records for `scripts/families.mjs`
- `design/02-dex-200.md`

Later design / PR evidence:

- `design/20-world-map-evolution-progression.md`
- PR #27 `feat: restore world progression and evolution-first encounters`
- PR #29 `fix: make world progression reward actual raising`
- commit `9837c36536b032ede4246492d0f79afc231cc5a4`
- PR #15

Runtime evidence used only for present-state comparison:

- `src/game/engine.js`
- `src/game/worldProgression.js`
- current generator/tests as referenced by Phase 1 audit

## 9. Final audit status

**PHASE 1.5 RE-AUDIT COMPLETE — MATERIAL RECLASSIFICATION APPLIED**

最重要修正は、旧auditの `239→238 / 84→83 / No.239 = UNRESOLVED` を撤回し、UDE-001に基づく `CONFIRMED_CHANGE` へ更新したこと。

またUDE-005を「design/20の全細目一括承認」とは扱わず、中心方向と数値/個別mappingを分離した。これにより「自分で育てて進化」の承認済み改善は残しつつ、boss gate・zone数値・学年報酬・duplicate capture等の未回収仕様を勝手に正本化しない状態にした。
