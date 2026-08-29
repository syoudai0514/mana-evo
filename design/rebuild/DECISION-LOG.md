# ManaEvo 再建 Decision Log

更新日: 2026-08-29  
役割: **承認された変更理由を残す正本 decision ledger**

実装だけで仕様を確定しない。権威順位・同期ルールは `REBUILD-START-HERE.md` に従う。

## Status

- `PROPOSED`: 候補。CURRENTではない
- `CONFIRMED`: 根拠確認済み
- `CONFIRMED_CHANGE`: 後続の承認済み変更
- `USER-DECISION`: 明示ユーザー決定を含む
- `REVERT-TO-BASELINE`: 後続承認がなく原本をCURRENTへ採用
- `SUPERSEDED`: 後続決定で置換
- `TUNING-DEFAULT`: 構造は確定、数値はplaytest調整可

---

## D-001 正本の優先順位

- Status: CONFIRMED
- Evidence: 2026-08-25 ユーザー明示。
- Decision: `ユーザー明示決定 > exact baseline > 承認済み後続変更 > design/current > data master > runtime > review/history`。
- Guard: 質問・懸念・提案を自動的にユーザー明示決定へ昇格しない。
- Reason: runtime先行の仕様漂流を防ぐ。

## D-002 再建方式

- Status: CONFIRMED
- Evidence: 2026-08-25 ユーザー明示。
- Decision: 全面rewriteでもbaselineへの機械的巻き戻しでもなく、`baseline rescue → diff → canonicalization → targeted rebuild`。
- Reason: 完成速度と一貫性を両立する。

## D-003 active monster scope

- Status: SUPERSEDED / CONFIRMED_CHANGE
- Baseline: 84 families / 239 species、No.239=`シラユキヒメ`。
- Evidence: `USER-DECISION-EVIDENCE.md` UDE-001。
- Decision: active game/master/dex/image-required scopeはNo.001〜238 / 83 families。m239はbaseline/referenceにのみ保持する。
- Tests: active238、m239 absent、baseline239 retained。

## D-004 捕獲基本ルール

- Status: CONFIRMED_CHANGE
- Baseline: post-win capture、HP非依存、最大3投、旧倍率。
- Evidence: UDE-002。
- Decision: 通常の戦闘中captureはenemy HP `<=50%`で解禁。stable keysは`star/silver/gold/rainbow`、倍率`1.0/1.2/1.5/rainbow guaranteed`、non-rainbow cap `92%`、最大3投。
- Note: child-facing名称/物体表現はD-017で後続変更。

## D-005 Kids Quest学習の権威

- Status: CONFIRMED
- Decision: 学年・問題・SRS・mastery・試練・先取り・English/TTS等はKids Quest sourceを維持し、ManaEvo側で独自簡略化しない。ManaEvoはlearning → game reward bridgeだけを所有する。
- Runtime evidence: active snapshot `src/kids-quest-study/**`、`src/study/**`はlegacy/regression。

## D-006 学習→ticket / capture-item reward

- Status: SUPERSEDED IN PART / CONFIRMED
- Original reconstructed rule: daily core +3 ticket、追加問題単位ticket等。
- Later explicit reward economy: daily core complete `star +3`、additional learning 3 correctごと`star +1`、normal MASTER `silver +1`、hard MASTER `gold +1`。
- Current override: Battle V6のadditional ticket rateはD-022で `extra 5 correct -> ticket +1` に変更。
- Decision: capture-item milestone側は維持し、ticket earningはD-022を優先する。

## D-007 battle ticket reservation lifecycle

- Status: SUPERSEDED IN PART
- Earlier confirmed rule: battle startで1枚reserve、win/capture commit、loss/explicit leave refund、reload/crash resume。
- Current override: Battle V6 D-022により**played loss / explicit abandonもcommit**へ変更。
- Still valid: exact source lot reservation、FEFO、reload/crash resume、double-reserve禁止、idempotent settlement。

## D-008 進化アイテム取得

- Status: REVERT-TO-BASELINE
- Baseline: 学習→exploration point、5ptで探索、通常素材80% / evolution item20%、地域別5連続不発後の6回目開始時に地域item選択保証、1日上限なし、地域boss初回bonus。
- Later runtime drift: 専用進化trialだけを取得源にした。
- Decision: baseline探索方式をCURRENTへ戻す。trialを唯一の取得源にしない。

## D-009 地域boss challenge gate

- Status: REVERT-TO-BASELINE
- Decision: area別 `progressPoints >=12 && uniqueSkillCount >=2`。
- Learning signals: core first clear `+1`、mastery milestone `+2`、chapter/star-trial first pass `+3`。
- Guard: adventure clear数だけでboss gateを置換しない。

## D-010 重複捕獲

- Status: REVERT-TO-BASELINE
- Decision: first catchは独立instanceを自動でBOXへ。duplicateは `なかまにする` / `おうえんにかえる` の2択。後者は`そだちのかけら +1`。3個で任意owned monsterへ育成XP +30。
- Guard: settlementはexactly-once。

## D-011 world / self-evolution discovery

- Status: CONFIRMED_CHANGE + TUNING-DEFAULT
- Evidence: UDE-005。
- Decision: baseline `sourceArea`とAdventure placement layerを分離。入口/中盤/奥地。第2形態のfirst acquisitionはself-evolution、`evolutionDiscoveries`後のみ後半wildを解禁。final evolutionはordinary wild捕獲不可。
- Tuning: zone clear count / level bandsはplaytest調整可。Current production bandsはD-022で更新。
- Product goal: 育てて進化する体験と、旧areaへ戻ったときの成長実感を守る。

## D-012 boss rematch

- Status: CONFIRMED_CHANGE
- Evidence: UDE-003。
- Decision: story/area bossのordinary rematchはfirst valid snapshotをlockし、育成後は相対的に楽になる。challenge rematchのみrescale可。balance version更新でold snapshot invalidならreplacementを1回保存し再lockする。

## D-013 UI再建原則

- Status: CONFIRMED
- Decision: old UIへnew UIを積み増さない。通常画面はchildの主判断を1つに絞りprogressive disclosure。Homeは未学習ならStudy、完了後Adventureをprimary。Adventureでworld/area/大量stage/search/filterを同時に並べない。CSS authorityをload-order/`!important`にしない。
- Capture: child-facing ease/recommendationを主、exact %はsecondary。
- Responsive: iPhone first viewport / one dominant CTAを守る。

## D-014 monster description / art authority

- Status: CONFIRMED
- Baseline: `monster-visual-briefs.json` にfamily motif/concept/personality/palette/graphicCoreとstage description/expression/silhouetteが存在。
- Decision: active238のdescription/artは新規創作から始めずbaseline briefsを救出。family continuityを維持し、existing/generated artはauditしてpassing assetをcandidate/formal化、NGのみrepair/regenerateする。
- Art rules: 5〜8歳、2〜4頭身中心、full body、transparent/white、small-size readability、family continuity、no specific-IP imitation。
- Later runtime visibility override: D-016。

## D-015 司令塔交代 / progress recovery / tangible artifact gate

- Status: CONFIRMED
- Evidence: 2026-08-26 ユーザーが引き継ぎ不足を指摘。PR #80/#81。
- Decision: 新しい固定Commander handoff正本を増やさず、`REBUILD-START-HERE → Decision Log → CURRENT → Phase plan → GitHub branch/PR/artifact → Acceptance`で現在地を復元する。
- Current position: 最大Work Item番号やWorkerの完了文言ではなく、Acceptanceを満たした最後のgate。
- Capability rule: image/binary/device/deploy等が必須なら着手前に能力確認。能力不足のprompt/generation packetを実成果物として完了扱いしない。`BLOCKED CAPABILITY`で早期分業する。

## D-016 CANDIDATE monster art の段階的production公開

- Status: CONFIRMED_CHANGE / USER-DECISION
- Evidence: 2026-08-27 ユーザー明示「もう本番であげて、キャラを徐々に増やすでいい」。
- Prior rule: normal runtimeはFORMALのみ、CANDIDATEはreview tooling限定。
- Decision: candidate gate（実binary、visual QA、candidate-safe WebP、handoff/refetch、provenance/checksum等）を通過し、production allowlistへ明示されたspeciesは、**CANDIDATEのままproduction表示可**。
- Guard: production visibility ≠ FORMAL。file existenceやID rangeから自動昇格しない。m239除外。W-321/W-322 final QA/FORMAL semanticsは維持。

## D-017 捕獲ボール化 / iPhone UI playtest補正

- Status: CONFIRMED_CHANGE / USER-DECISION
- Evidence: 2026-08-28 iPhone実機playtest。
- Decision — capture names: child-facing `ほしボール / ぎんボール / きんボール / にじボール`。stable keys / probability / economyは変更しない。
- Decision — capture presentation: `1個のボールを1回投げる → 命中/包み込み → 4 stars temporal sequence → close/GET or release`。UI再抽選禁止。既存IP固有ball design/timingをコピーしない。
- Decision — iPhone UI: focused learning safe-area ownership、top-level別scroll memory、focused flow top-start/restore、問題visual拡大、Battle arena/state/command hierarchy、日本語の不自然な1〜2文字折返し回避。

## D-018 共通account / cloud save / TEST data

- Status: CONFIRMED_CHANGE / USER-DECISION
- Evidence: 2026-08-28 ユーザー明示。
- Account/backend: Family Opsとは分離した汎用personal-app backend。ManaEvo=`app_id: mana-evo`。保護者email/password、session保持、password recovery、client secret/service-role禁止。
- Profile/device: auth accountとplayer profileを分離。1 account内複数profile。端末で普段開くprofileはdevice-local preferenceで、別端末のcurrent playerを奪わない。
- Save: learning + game + reward bridgeを同じversioned revisionへ束ねるcomplete cloud snapshot。localStorageはoffline/cache。
- Concurrency: same-profile divergenceをsilent last-write-winsで消さず保護者解決。破壊的境界でbackup。
- TEST: real/cloudと隔離し、全active species / stage1 evolution / stage2 evolution等の再生成可能fixtureを用意。終了時exact restore。

## D-019 Vercelを唯一のproduction canonical hostとする

- Status: CONFIRMED_CHANGE / USER-DECISION
- Evidence: 2026-08-28 ユーザー「Vercelで一本化」。
- Decision: production canonical=`https://mana-evo.vercel.app/`、base/scope=`/`。GitHub=source/PR/CI、Vercel=production+PR Preview、Supabase=Auth/DB/Cloud Save。
- Supersedes: GitHub Pages production authority、`/mana-evo/` production base、Vercel non-authority判断。
- Guard: Preview URLをcanonical metadata/PWA identityにしない。

## D-020 Evolution pacing V5

- Status: CONFIRMED_CHANGE / USER-DECISION
- Evidence: production playtest後のPR #104 `Balance V5: slow first-day evolution pacing`、main merge 2026-08-28。
- Problem: encounter XP poolをbattle-start team全員へ大きく配り、初日から複数進化できるほど育成が速かった。
- Decision:
  - encounter XP poolはcompat/reporting上維持;
  - active battlerはpoolの`40%`;
  - other eligible teammateはactive受取量の`40%`（poolの16% before later modifiers）;
  - learning-earned ticket amountsはこのV5では変更しない;
  - captured level-evolution monsterは次のlevel evolution thresholdの少なくとも`5 levels`手前へcapture levelをbuffer;
  - existing save/progressをrewrite/rollbackしない。
- Tests: 110 pool→active44 / teammate18（rounding semantics含む）、first-day evolution pacing、capture evolution buffer、existing regressions。

## D-021 Cloud conflictをchild gameplayから外す

- Status: CONFIRMED_CHANGE
- Evidence: PR #105 / #107 production UX fixes、main merge 2026-08-28。
- Problem: logged-in child gameplayへcloud/account FABやconflict modalが割り込み、`今すぐ同期`が解決しないのに子どもの操作を止めていた。
- Decision:
  - normal logged-in child gameplayでcloud/account FABを常設しない;
  - conflict detectionだけでmodalをauto-openしない;
  - conflict pending中もlocal saveは継続;
  - conflict attention / overwrite choiceはParent-owned UIへ;
  - Parent PIN protectionを維持;
  - unauthenticated login entry / TEST management等の必要経路は残す。
- Reason: sync conflictはadult-ownedであり、child learning/game loopを中断させない。

## D-022 Battle V6 — study-first pacing / fair fight / played-ticket cost / post-KO capture

- Status: CONFIRMED_CHANGE / USER-DECISION
- Evidence: 2026-08-29 production playtest要求、PR #110 `Battle V6: study-first pacing, fair fights, post-KO capture`、main merge commit `f3017bda0724d398bc35c959df34316f5e9e35bd`。
- Problems:
  - one-hit win/lossが多い;
  - high-level carry + weak benchでenemyが弱くなりすぎる;
  - loss/refundでfree retry loopになり得る;
  - XP/world pacingが速すぎる;
  - additional learningに対してgame accessが多すぎる;
  - turn order/KO feedbackが弱い;
  - KOするとwild capture機会を失う。
- Decision — additional study ticket:
  - daily core `ticket +3`は維持;
  - qualifying `extra` correct **5回ごとにticket +1**;
  - free studyはdirect ticket 0;
  - additional 3 correct -> `star +1`等の既存capture-item milestoneは維持。
- Decision — played ticket settlement:
  - battle start exact reservationは維持;
  - win/capture success/loss/explicit abandonはreserved ticketをconsume/commit;
  - reload/crash/Safari terminationはresumeし二重consumeしない。
- Decision — fair-fight scaling:
  - ordinary encounterはactive battlerを主referenceとし、weak benchを入れてenemyをactive-onlyより弱くできないことをproduct invariantとする;
  - bossはteam/roster/carry floorを含め、weak-team swapでfirst snapshotを下げない;
  - old cleared normal stagesは完全追従せず、育成後に相対的に楽になるrepeat capを維持。
- Runtime drift note: main #110の70% active +30% support式はsupportが弱い場合にactive-onlyを下回り得る。これは上記invariantに対する既知driftであり、後続hotfix対象。bugをCURRENTへ昇格しない。
- Decision — damage tuning:
  - STAB `1.25`;
  - critical `1/16`, multiplier `1.35`;
  - damage random `0.92〜1.00`;
  - type effectiveness/immunity semantics維持。
- Decision — Battle XP:
  - D-020のV5 distribution後、player vs enemy level gapでmultiplier;
  - `+15 =>0.15`, `+10=>0.25`, `+6=>0.50`, enemy +3=>`1.15`, enemy +5=>`1.25`;
  - old-area farmingを最速育成経路にしない。
- Decision — world recommendation bands:
  - A1 `5〜16` (5-8 / 9-12 / 13-16)
  - A2 `14〜27` (14-18 / 19-23 / 24-27)
  - A3 `24〜40` (24-29 / 30-35 / 36-40)
  - A4 `37〜58` (37-44 / 45-51 / 52-58)
  - EX `55〜100`
- Decision — post-KO capture:
  - ordinary capturable wildをKOした後にもcapture opportunityを残す;
  - boss/captureDisabledは対象外;
  - KOでsettleしたBattle XPをcapture successで再付与しない;
  - newly captured monsterへそのbattle XPをretroactive付与しない;
  - KO/turn presentation完了前にpost-KO CTAを押せる状態にしない。
- Decision — turn settlement/presentation:
  - move/protect/switch/failed-capture/end-turn status等、どのaction pathからterminal outcomeになっても共通settlementへ;
  - HP/KO表示と操作CTAの順序を同期させる。
- Tests: 430/390/375 WebKit、ticket exactly-once、damage constants、weak-bench guard、XP gap/order、post-KO no-double-XP、terminal-path convergence。

## D-023 Canonical Design Sync Gate

- Status: CONFIRMED / USER-DECISION
- Evidence: 2026-08-29 ユーザーが、複数司令塔で実装が進むたび設計書が陳腐化したことを指摘し、**恒久的に同期を取れる仕組み**と、把握済み仕様の設計書反映を明示要求。
- Problem: 司令塔が各PRの実装を完了しても、CURRENT/Decision Log更新が後回しになり、次の司令塔が古い設計を読むかruntimeを独自に正本化する循環が再発した。
- Decision:
  1. product behavior changeとowning CURRENT updateを**同じPR/change set**で行う;
  2. protected runtime/art path変更PRは `Canonical-Impact: changed|none` / `Canonical-Domains:` / `Canonical-Reason:` を明示;
  3. `changed`ならowning `design/current/**` + 本Decision Logを同PRで更新;
  4. `none`なら具体理由を要求しReviewerがcontract changeなしを確認;
  5. `design/current/canonical-sync-map.json`でruntime path→owning domainをmachine-readable管理;
  6. CI `scripts/verify-canonical-sync.mjs`で宣言漏れ / CURRENT未更新 / Decision Log未更新をfail;
  7. stateful companionは可能な限りgenerate/verifyし、file existenceやproduction visibilityからFORMAL等のapprovalを推測しない。
- Reason: 「あとで設計書を直す」を通常運用から排除し、どの司令塔でも設計と実装の同期判断を忘れられないようにする。
- Affected areas: all PR governance / commander / worker / CURRENT maintenance / CI。ゲーム仕様自体は、このgateを導入しただけでは変更しない。
- Tests: canonical-sync unit tests + PR CI gate + normal full CI。
