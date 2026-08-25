# Monster / World / Progression specification drift audit

- Worker: SOL④ / Worker 4
- Date: 2026-08-25
- Repository: `syoudai0514/mana-evo`
- Audit branch: `rebuild/w4-monster-world-progression-audit`
- Governance base: `rebuild/canonical-governance`
- Scope: モンスター図鑑・進化系列・ワールド・ゲーム進行の BASELINE / CURRENT DESIGN / RUNTIME / Git history 差分監査
- Non-goal: この文書では 238 / 239、ワールド構造、学年報酬等の仕様決定・runtime修正を行わない。

## 0. Governance / audit rule

`REBUILD-START-HERE.md`、`design/rebuild/DECISION-LOG.md`、`WORK-QUEUE.md`、`HANDOFF-TEMPLATE.md` を先に確認した。

再建時の優先順位は次の通り。

1. ユーザーが明示的に決めた仕様
2. `mana-evo-terra-FINAL-CORRECTED` 原本
3. 後続で承認された変更
4. 現行 design
5. data master
6. runtime
7. review / CI

したがって、現行mainやCIが動いていることだけでは「正しい仕様」の証拠にしない。

### BASELINE source availability limitation

W-001 branch `rebuild/w-001-final-corrected-baseline` の `design/baseline/FINAL-CORRECTED/README.md` を確認したところ、指定原本 `mana-evo-terra-FINAL-CORRECTED(3).zip` の実体はまだ取得できておらず、原本source payload保存数は **0**、完全性は **BLOCKED** である。

このため本監査の BASELINE は二段階で扱う。

- **A: exact baseline bytes** — 現在未取得。W-001完了後に再照合必須。
- **B: recovered baseline evidence** — PR #15 の検証文書・diffが、当時参照できていた `mana-evo-terra-FINAL-CORRECTED` の `scripts/families.mjs` 等を機械比較した記録。

Bは重要な証拠だが、Aの代替とはしない。

## 1. Executive findings

1. PR #15 の復元検証記録は、原 `scripts/families.mjs` を flatten すると **84系列 / 239体**、No.239 は **シラユキヒメ** と明記している。
2. 現行 design / generator / tests / runtime は **No.001〜238 / 83系列** を強制し、No.239 を除外している。
3. Git上で追える最初の明示的な238化は、2026-08-24 16:18 JST の commit `9837c36536b032ede4246492d0f79afc231cc5a4` (`design: add 238-monster growth review index`)。ここで「No.239 シラユキヒメは元資料保全のみで、現行238体masterには含めません」と記載された。
4. しかし同commit/PRの説明は「現行238体を対象にする」という結果を述べるだけで、**なぜ239から238へ変更する必要があったか**の理由は記録されていない。PR #15 conversationにも No.239 除外を承認するユーザーコメントは見つからなかった。
5. No.001〜238については、PR #15 の source validation が原 `families.mjs` と **名前 / area / type / rank / role / stage / 設定 / 進化条件の不一致0件** と記録している。したがって238体の中身自体は、少なくとも当時参照できた原本から高い再現性で復元されている。
6. 2026-08-25 の PR #27 / #29 で、ワールドは Area1〜4 + EX、各エリア入口/中盤/奥地、第2形態の初回自力進化、進化後の奥地野生解放、zone Lv帯、進化Lvのworld補正等へ大きく変更された。これらは現行designに「ユーザー承認済み」と書かれているが、GitHub PR conversation上に独立した承認コメントはないため、再建governance上は exact approval evidence の回収が必要。
7. Kids Quest学習runtimeには年長〜小6の学年・先取り解放がある。一方、進級時の「学年報酬キャラ」付与や、学年進級でManaEvoワールドを直接解放するruntimeは確認できない。
8. 図鑑=種族、BOX=捕獲個体、手持ち最大3体、`seen/caught`、進化系列表示という構造は、旧design snapshotと現runtimeが一致している。

---

## 2. Audit items

### 2.1 原本239体 / 84系列 → 現行238体 / 83系列

**BASELINE**

Recovered baseline evidence: `design/15-sol-review-validation-report.md` は、復元元を `mana-evo-design-v10-terra-ready` / `mana-evo-terra-FINAL-CORRECTED` の `scripts/families.mjs` 等とし、`families.mjs` flatten結果を **84系列 / 239体** と記録する。

Exact archive bytesはW-001未完了のため未再検証。

**CURRENT DESIGN**

- `design/13-monster-growth-master-238.md`: No.001〜238、83系列。
- `design/00-README.md`: No.001〜238 / 83系列を現行runtimeとして記載。
- `design/15-sol-review-validation-report.md`: No.239を「資料保全のみでruntime候補から除外」と記載。

**RUNTIME**

- `scripts/generate-runtime-master.mjs` が `growth.length !== 238` をthrowし、238体を強制。
- `tests/pr15-master.test.js` が 238体 / 83系列 / No.239不在を固定assert。
- PR #15 final runtime completionも238 speciesを前提。

**EVIDENCE**

- First explicit tracked exclusion: commit `9837c36536b032ede4246492d0f79afc231cc5a4`, 2026-08-24 16:18 JST。
- 同commit: `No.239 シラユキヒメは元資料保全のみで、現行238体masterには含めません。`
- PR #15 merge commit: `6ae781bf041a5c3f6685846a753f7aac7c76e09f`, 2026-08-24。
- PR #15 bodyは「No.239 runtime混入0」を合格条件としている。
- PR #15 merged conversation内に `239` の変更理由・承認コメントは見つからない。
- GitHub issue検索でも239変更理由を示すissueは見つからない。
- 記録されている「理由」は「現行ManaEvoの有効範囲はNo.001〜238」という自己参照的説明であり、239→238変更の根拠ではない。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

- 238/239をこの監査で決めない。
- W-001でexact `FINAL-CORRECTED` を救出後、`scripts/families.mjs` と関連dex資料を再計数する。
- その後、239除外を明示承認した会話/decisionの証拠が回収できなければ、ユーザー決定事項として238/239を改めて解決する。
- 解決まで現行runtimeの238を「暫定実装状態」として扱い、canonical決定とは扱わない。

### 2.2 No.239 シラユキヒメ

**BASELINE**

Recovered evidenceでは No.239 `シラユキヒメ` が原 `families.mjs` に存在した。

**CURRENT DESIGN**

`design/13` / `design/15` は名前のみ資料保全し、active masterから除外。

**RUNTIME**

generator / testsとも `m239` を許容しない。画像・stage・dex registryにもactive entryなし。

**EVIDENCE**

PR #15で除外されたことは追跡できるが、削除理由・ユーザー承認のGit証拠は見つからない。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

原本救出後に No.239 の family / area / type / role / stage / encounter / evolution / boss/event性を実物から回収し、その情報を見てから採否を決定する。現時点で新規創作して戻さない。

### 2.3 No.001〜238 の各進化系列

**BASELINE**

PR #15 validationは、原 `families.mjs` とNo.001〜238を比較し、`stage / maxStage / evolution method / evolution param` を含む不一致 **0件** と記録。

**CURRENT DESIGN**

83系列、155進化。内訳 level 123 / stone 21 / held_item_levelup 11。

**RUNTIME**

`generate-runtime-master.mjs` が155遷移を読み込み、`tests/pr15-master.test.js` が件数・方式をassert。

**EVIDENCE**

`design/15-sol-review-validation-report.md` §3, §8。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

No.001〜238の系列構造は維持候補。ただしW-001 exact baseline取得後に全155遷移を再照合する。84系列目は別項目として未解決のままにする。

### 2.4 84系列目

**BASELINE**

Recovered evidenceでは84系列存在。

**CURRENT DESIGN**

83系列のみactive。

**RUNTIME**

83系列固定test。

**EVIDENCE**

239除外と同時に84→83となっている。84系列目の詳細はexact archive未救出のため、このrepo内だけでは完全復元できない。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

No.239のexact family定義を原本から回収してから判断。

### 2.5 18タイプ

**BASELINE**

PR #15 validationはNo.001〜238について原 `families.mjs` の `type` 照合不一致0件とし、active dataに18タイプすべて存在すると記録。

**CURRENT DESIGN**

18タイプ。

**RUNTIME**

`src/game/content.js` に normal / fire / water / electric / grass / ice / fighting / poison / ground / flying / psychic / bug / rock / ghost / dragon / dark / steel / fairy の18種。`tests/pr15-master.test.js` も18をassert。

**EVIDENCE**

Source comparison + current runtime/testが一致。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

維持候補。No.239のtypeのみ原本救出後に追加確認。

### 2.6 制作上のarea配置

**BASELINE**

PR #15 validationはNo.001〜238の `area` を原 `families.mjs` と照合し、不一致0件。

**CURRENT DESIGN**

growth masterのproduction `area` は保持。一方 `design/20` はproduction areaと実際の `adventureArea / zone` を分離可能とした。

**RUNTIME**

`worldProgression.js` は `sourceArea: stage.area` を保持しつつ、A1の第2形態をAdventure A3奥地、A2の第2形態をA4奥地へ送る等、別の `adventureArea` を付加する。

**EVIDENCE**

- 原area値保存: `design/15` source comparison。
- 冒険配置変更: PR #27 / `src/game/worldProgression.js`。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

production area field自体は維持候補。冒険配置の後続変更は次項で別判定する。

### 2.7 Area1〜4 / EX

**BASELINE**

Recovered source dataはproduction Area1〜4を持つ。EXを独立「第5の冒険area」とするexact baseline証拠は、原本未救出のため未確認。

**CURRENT DESIGN**

`design/20`: Area1 Lv5–22 / Area2 18–38 / Area3 32–58 / Area4 50–80 / EX 70–100。

**RUNTIME**

`worldProgression.js` は内部 `WORLD_AREA_META` にarea 1〜5を持ち、5を `EX いせかい` とする。通常UIはArea1〜4とEXを分けて表示。EXは4ボス全クリア後解放。

**EVIDENCE**

PR #27で明示的に現構造を導入。PR body / design本文は「当初設計思想を戻す」と記載するが、exact baseline bytesなし。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

Area1〜4は強い維持候補。EXの位置付け（独立area / event / postgame）を原本と再比較してcanonicalizeする。

### 2.8 入口 / 中盤 / 奥地

**BASELINE**

Exact baseline未確認。

**CURRENT DESIGN**

各Area1〜4を入口/中盤/奥地の3段階とする。中盤は入口野生2初回クリア、奥地は中盤野生2初回クリア。

**RUNTIME**

`WORLD_AREA_META` が各エリア3zonesを保持。`adventureZoneProgress()` が前zoneの野生2clearを要求。

**EVIDENCE**

PR #27で3zone構造、PR #29で2clearの逐次gateを追加。両PRのconversationに独立したユーザー承認コメントはない。`design/20` 自身は「ユーザー承認済み」と記載。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

実装品質の問題ではなくcanonical approval証拠の問題。原本比較＋当時のユーザー承認ログを回収し、確認できた場合のみ `CONFIRMED_CHANGE` へ昇格。

### 2.9 通常野生出現

**BASELINE**

PR #15 validationは原資料と `encounterPool / wildCatchable / capturePolicy` を含むNo.001〜238の設定を復元し、active masterで wild 155 / evolutionOnly 79 / event完成個体4 と記録。

**CURRENT DESIGN**

第1形態は通常wild。単段階種は例外としてwild可。第2形態は自力進化後のみ奥地wild。最終形は通常wild不可。

**RUNTIME**

Generatorはmasterの `wildCatchable` からwild stageを作り、その後 `worldProgression.js` が形態別に表示/gateを上書きする。

**EVIDENCE**

元のwildCatchableデータは保存されている一方、動的gate/relocationはPR #27/#29の後続レイヤ。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

「どの種がwild候補か」と「いつ/どこでwild表示するか」を分離してcanonicalizeする。前者はsource一致の維持候補、後者は後続変更として承認確認が必要。

### 2.10 第2形態の野生

**BASELINE**

Exact baselineの出現タイミング・地域gateは未再取得。原masterのwildCatchable自体はNo.001〜238で復元一致。

**CURRENT DESIGN**

初回入手は必ず自力進化。一度自力進化したspeciesだけ、奥地で同形態wildを解禁。

**RUNTIME**

- `requiresEvolutionDiscoverySpeciesId`
- `evolutionDiscoveries`
- `evolveInstance()` 成功時に記録
- `isStageUnlocked()` がその記録を要求
- `tests/world-progression.test.js` が自力進化前lock / 後unlockをassert

**EVIDENCE**

PR #27で導入、PR #29で `dex.caught` ではなく専用 `evolutionDiscoveries` へ強化。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

ゲーム思想としては現行「自分で育てて進化」に整合するが、baseline差分としてはapproval証拠回収待ち。仕様は勝手に戻さない/固定しない。

### 2.11 最終形態の野生

**BASELINE**

後続designは「当初設計の最終形野生不可を復活」と明記。PR #15復元masterも `wildCatchable / encounterPool` を原資料から保持している。

**CURRENT DESIGN**

最終進化形は通常wildに出さない。ボス等で見ることはあっても通常捕獲不可。

**RUNTIME**

`worldProgression.js` が `hidden=true`, `captureDisabled=true`, `finalEvolutionOnly=true`。world testで違反0をassert。

**EVIDENCE**

Baselineのexact bytesは未取得だが、PR #27が「復活」と明記し、原master比較記録とも矛盾しない。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

維持候補。W-001後に `wildEncounter.mjs` で最終確認。

### 2.12 ボス / ボス解放条件

**BASELINE**

Recovered principleとして「ボス撃破で次エリア解放」が `design/20` に「当初設計から維持・復活」と記録。exact unlock countは未確認。

**CURRENT DESIGN**

各Area1〜4にarea boss。大量図鑑埋めではなく、当面5探索clearでboss解放。boss撃破で次area解放。

**RUNTIME**

- `worldProgression.js`: area bossの `minAreaClears=5`
- `isStageUnlocked()`: `areaGateBossId` と `minAreaClears`
- `GameScreens.jsx`: next areaは前area boss clearでunlock
- `tests/world-progression.test.js`: 4boss / 5clear gateをassert

**EVIDENCE**

「次areaをbossで開ける」原則は維持記録あり。具体的な `5探索` はPR #27の後続設計。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

boss→next areaは維持候補。`5探索` という具体数はbaseline/approval確認後に確定する。

### 2.13 学年 / 先取り

**BASELINE**

Kids Quest移植対象として学年・先取りシステムが存在する。exact ManaEvo originalとの結合仕様はW-001原本未救出のため未確認。

**CURRENT DESIGN**

`design/00` はKids Quest完成済み学習runtimeと先取りを維持すると記載。

**RUNTIME**

`src/kids-quest-study/data/grades.js`:

- 年長〜小6
- 現在学年MASTER後に次学年解放
- 解放済み学年は行き来可

`GameContext.jsx`:

- `grade`, `gradeMax`, `pendingGradeUp`
- ほしのしれん合格で `gradeMax + 1`
- 保護者設定で選択可能学年を制御

**EVIDENCE**

学習runtimeとしては明確に実装済み。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

学習側の先取り機構は維持候補。ゲーム側reward/worldとの関係は別項目で未解決。

### 2.14 学年報酬キャラ

**BASELINE**

今回の重点項目だが、exact `FINAL-CORRECTED` が未救出のため原本の具体的な学年→キャラ割当を確認できない。

**CURRENT DESIGN**

現行 `design/00` / `design/20` に学年報酬キャラの具体masterはない。PR #15 validationの未決事項には「にじのわ供給量（学年初回+1）」はあるが、学年報酬monsterの確定表ではない。

**RUNTIME**

`STAR_TRIAL_RESULT` で進級解放は行うが、monster rewardを `pendingGameRewards` に積む処理はない。ManaEvo bridge `grantLearningReward()` が扱うのもticket / capture item / unit/hard masteryで、species grantはない。

**EVIDENCE**

現runtimeに学年報酬キャラ付与pathなし。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

原本の学年報酬キャラ表/ルールをW-001で回収してから、CURRENTから消えた仕様なのか、原本でも未確定だったのかを判定する。現時点でキャラを創作・割当しない。

### 2.15 学年 / 先取りとワールド解放の関係

**BASELINE**

Exact relation未確認。

**CURRENT DESIGN**

学習の学年解放とゲームworld unlockは別軸。worldはboss/route clear主体。

**RUNTIME**

`isStageUnlocked()` は学年/gradeを参照しない。Area2〜4は前area boss、EXはArea1〜4 boss clearで解放。

**EVIDENCE**

Current runtimeにgrade gateなし。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

原本に「学年ごとのエリア/報酬キャラ」連携があるかを回収してから判断。学年と世界進行を勝手に結合・分離しない。

### 2.16 ワールド解放

**BASELINE**

Recovered principle: boss撃破で次area解放。

**CURRENT DESIGN**

- Area1初期解放
- Area2〜4: 前area boss
- EX: 4area boss全clear
- zone: 前zone wild 2clear

**RUNTIME**

上記を `GameScreens.jsx`, `engine.js`, `worldProgression.js` で実装。

**EVIDENCE**

Area間boss gateは「当初原則」記録と一致。zone gate / EX細部は後続変更。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

Area間boss gateを強い維持候補、zone/EX細部をapproval確認対象として分離する。

### 2.17 進化と地域進行の関係

**BASELINE**

原進化Lv値はPR #15で原資料から復元されたが、current zone Lv帯導入前の値だったとPR #29が記録する。exact baselineの地域進行との関係は未再確認。

**CURRENT DESIGN**

- 第2形態自力進化→後半area奥地wild解放
- 捕獲直後の即進化を避けるためlevel進化thresholdをworld Lv帯へ合わせて上方補正
- original levelは `evolution.originalLevel` に保存

**RUNTIME**

`generate-runtime-master.mjs`:

- stage1 level evolution: encounter zone max +4以上
- 3段階後段: 前段実効Lv+10以上 + area floor
- stone / held_item_levelupは補正対象外

**EVIDENCE**

PR #29で意図的に追加。原CSV値を破棄せずruntime overlayとして保持している点は監査可能。

**CLASSIFICATION**

`UNRESOLVED`

**RECOMMENDATION**

原値保全は継続する。world補正の採否は「承認済み後続変更」と確認できるまでcanonical確定しない。

### 2.18 「自分で育てて進化させる」体験

**BASELINE**

後続資料はこれを「当初設計思想」として復元対象にしている。`design/01` も中心ループを「捕まえたい / 育てたい / 進化させたい / 次を見たい → だから学ぶ」と記録。

**CURRENT DESIGN**

`design/20`: 「強いキャラを拾うゲームではなく、学んで、出会って、自分で育て、自分で進化」。

**RUNTIME**

- 第2形態初回自力進化gate
- 最終形wild不可
- battle resultから即「いま シンカする！」
- homeに次進化目標
- evolutionDiscoveries

**EVIDENCE**

原則レベルでは旧design snapshot / restored concept / current runtimeが同方向。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

中心体験として維持候補。具体的なzone/gate数値は別項目で監査する。

### 2.19 図鑑 / BOX / チーム

**BASELINE**

`design/02-dex-200.md` snapshot:

- 図鑑 = 種族
- BOX = 捕まえた個体
- `みていない / みつけた / つかまえた`
- 進化系列で表示
- 手持ち3体

**CURRENT DESIGN**

同構造を維持。

**RUNTIME**

- save: `box`, `team`, `dex.seen`, `dex.caught`
- `setTeam()` 最大3体
- capture成功で個体をBOXへ追加、teamが2体以下なら自動加入
- evolutionはinstanceId/Lv/XPを保ったままspeciesId更新
- Monster UIで手持ち出し入れ、Lv/XP/type/進化条件を表示

**EVIDENCE**

旧design snapshotと現runtimeの概念が一致。

**CLASSIFICATION**

`SAME`

**RECOMMENDATION**

維持候補。239採否が決まった場合のみdex総数/registryを追随させる。

---

## 3. 238 / 239 Git timeline

| JST | Git evidence | Meaning |
|---|---|---|
| 2026-08-24 16:18 | `9837c36536b032ede4246492d0f79afc231cc5a4` | 238体growth review index追加。No.239シラユキヒメをmasterから除外と初めて明文化。 |
| 2026-08-24 | `eda8679746e00eb19bb8de870c20a4794964de12` | 238体正式化の進捗台帳を追加。 |
| 2026-08-24 | PR #15 `chatgpt/monster-master-238` | 238 species / 83 families / No239混入0をruntime gate化。 |
| 2026-08-24 | `6ae781bf041a5c3f6685846a753f7aac7c76e09f` | PR #15 main merge。238がproduction runtimeへ固定。 |
| 2026-08-25 | PR #35 W-001 | 再建側でも「238/239の仕様判断をしない」と明記。exact原本ZIP未取得。 |

### Change reason found

Gitに残る文言は以下のみ。

> `現行ManaEvoの有効範囲は No.001〜238のため、元資料No.239 シラユキヒメは資料保全のみでruntime候補から除外した。`

これは「なぜ有効範囲が238になったか」の根拠を説明していない。

### User approval evidence found

- PR #15 conversation: No.239除外を承認する明示コメント **なし**。
- `239` を理由付きで決めたissue **なし**。
- PR #15のMERGE GOはruntime品質判定としては強いが、再建governance上の「239→238仕様変更をユーザーが明示承認した証拠」と同一視しない。

結論: **238/239の変更理由・明示承認はGitHub上では回収できていない。**

---

## 4. Current runtime evidence map

| Topic | Runtime / test evidence |
|---|---|
| 238 / 83 / 18 | `scripts/generate-runtime-master.mjs`, `tests/pr15-master.test.js` |
| 155 evolutions | generator + `tests/pr15-master.test.js` |
| Area/zone | `src/game/worldProgression.js` |
| area/zone unlock | `src/game/engine.js` `isStageUnlocked`, `adventureZoneProgress` |
| stage2 self-evolve unlock | `evolutionDiscoveries`, `evolveInstance`, world progression test |
| final form wild ban | `hidden + captureDisabled`, world progression test |
| boss unlock | `minAreaClears=5`, previous boss gate |
| EX unlock | `requiresAllAreasCleared` / UI `exUnlocked` |
| grade / ahead learning | `src/kids-quest-study/data/grades.js`, `GameContext.jsx` |
| learning→game reward bridge | `pendingGameRewards` → `grantLearningReward()` |
| grade reward monster | runtime path not found |
| dex / box / team | `progression.js`, `engine.js`, `GameScreens.jsx` |

---

## 5. Classification summary

### SAME

- No.001〜238の進化系列（exact archive再確認は残る）
- 18タイプ
- No.001〜238のproduction area field
- 最終形を通常wildに出さないという原則
- Kids Quest側の学年・先取り機構
- 「自分で育てて進化」の中心体験
- 図鑑 / BOX / 手持ち3体の基本構造

### CONFIRMED_CHANGE

今回のGitHub evidenceだけで、再建governanceの意味で「原本差分 + 明示ユーザー承認」を独立に証明できた項目は **0件**。

`design/20` は「ユーザー承認済み」と自己記載しているため有力な後続承認候補だが、PR #27/#29 conversationに承認発言がなく、exact decision sourceをまだ回収できていない。確認後に該当項目を `CONFIRMED_CHANGE` へ昇格可能。

### IMPLEMENTATION_DRIFT

今回確認範囲では、CURRENT DESIGNに明記されているのにruntimeだけが明確に反対挙動をする、という確定的な項目は見つからなかった。

ただし「学年報酬キャラ」はCURRENT DESIGN自体に具体masterがないため、runtime未実装を直ちに `IMPLEMENTATION_DRIFT` とは分類できない。

### UNRESOLVED

- 239→238 / 84→83
- No.239 / 84系列目
- EXの原本上の位置付け
- 入口/中盤/奥地の後続zone設計の承認証拠
- wildの後続表示/gateロジック
- 第2形態自力進化後wild解禁
- boss 5探索clearという具体gate
- 学年報酬キャラ
- 学年/先取りとworld unlockの結合有無
- zone/EXを含むworld unlock細部
- world Lv帯に合わせた進化Lvruntime補正

---

## 6. Recommendation / handoff

1. **W-001 exact baseline救出を最優先**。`scripts/families.mjs`, `scripts/wildEncounter.mjs`, `02-dex.md`, world/progression関連原本を再取得する。
2. W-001完了後、このauditのBASELINE欄をexact bytesで再照合する。
3. 238/239は、原本239確認後も「238に変えた明示承認」が見つからなければユーザー決定事項へ上げる。Worker判断で決めない。
4. PR #27/#29のworld変更について、当時のユーザー会話/decision evidenceを回収できれば、該当 `UNRESOLVED` を `CONFIRMED_CHANGE` へ変更する。
5. 学年報酬キャラは原本に存在するかを確認し、存在するなら CURRENT DESIGN / RUNTIME の欠落として次段監査で `IMPLEMENTATION_DRIFT` へ再分類する。
6. canonical decisionが終わるまで、238/239・学年報酬・world gateのruntime修正をこのWorkerでは行わない。

## 7. Files reviewed

Governance / baseline:

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md`
- `design/rebuild/WORK-QUEUE.md`
- `design/rebuild/HANDOFF-TEMPLATE.md`
- `rebuild/w-001-final-corrected-baseline:design/baseline/FINAL-CORRECTED/README.md`

Current design / historical design evidence:

- `design/00-README.md`
- `design/01-catch-and-evolution-design.md`
- `design/02-dex-200.md`
- `design/03-screens-catch-and-raise.md`
- `design/06-battle-and-progression-design.md`
- `design/11-battle-character-boss-review.md`
- `design/13-monster-growth-master-238.md`
- `design/15-sol-review-validation-report.md`
- `design/19-sol-pr15-runtime-completion.md`
- `design/20-world-map-evolution-progression.md`
- `design/DESIGN-SOURCE-METADATA.txt`

Runtime / generator / tests:

- `scripts/generate-runtime-master.mjs`
- `src/game/content.js`
- `src/game/worldProgression.js`
- `src/game/progression.js`
- `src/game/engine.js`
- `src/game/GameScreens.jsx`
- `src/App.jsx`
- `src/kids-quest-study/data/grades.js`
- `src/kids-quest-study/state/GameContext.jsx`
- `tests/pr15-master.test.js`
- `tests/world-progression.test.js`

Git history / PR evidence:

- PR #15
- PR #27
- PR #29
- PR #35
- commit `9837c36536b032ede4246492d0f79afc231cc5a4`
- commit `eda8679746e00eb19bb8de870c20a4794964de12`
- merge commit `6ae781bf041a5c3f6685846a753f7aac7c76e09f`

## 8. Final audit status

**AUDIT COMPLETE WITH BASELINE INPUT BLOCKER**

差分調査・Git trace・CURRENT/RUNTIME横断は完了した。ただし exact `FINAL-CORRECTED` archive未救出のため、BASELINEの最終確証が必要な項目は `UNRESOLVED` のまま残した。仕様変更・runtime変更は行っていない。
