# ManaEvo 再建 Decision Log

重要仕様の判断を時系列で残す。実装だけで仕様を確定しない。

## Status
- PROPOSED: 候補
- CONFIRMED: 根拠確認済み
- USER-DECISION: ユーザー判断待ち/判断済み
- REVERT-TO-BASELINE: 後続の承認根拠がなく原本をCURRENTへ採用
- SUPERSEDED: 後続判断で置換
- TUNING-DEFAULT: 構造は確定、数値は現行値を暫定採用しplaytestで調整可

## Template

### D-XXX タイトル
- Status:
- Baseline:
- Later design:
- Runtime:
- Evidence of approval:
- Decision:
- Reason:
- Affected areas:
- Tests required:

---

## D-001 正本の優先順位
- Status: CONFIRMED
- Baseline: `mana-evo-terra-FINAL-CORRECTED` を原本とする。
- Later design: 現行 `design/` にはPRレビュー・runtime完了報告・後続UX設計が混在。
- Runtime: 現行実装は参考事実であり正本ではない。
- Evidence of approval: 2026-08-25 ユーザー明示。
- Decision: ユーザー明示決定 > 原本 > 承認済み後続変更 > current canonical > master > runtime > review history。
- Reason: 実装先行で仕様が変質した履歴があり、runtimeを正とすると設計復旧不能になるため。
- Affected areas: 全体。
- Tests required: なし（governance）。

## D-002 再建方式
- Status: CONFIRMED
- Baseline: 原本をそのまま実装する前提だった。
- Later design: 原本以降に多数の試行錯誤・承認済み改善が存在。
- Runtime: 既存の学習基盤・ゲームエンジン・master・PWA・testsには再利用価値が高い。
- Evidence of approval: 2026-08-25 ユーザー明示。
- Decision: 全面rewriteでも原本巻き戻しでもなく、baseline rescue → diff → canonicalization → targeted rebuild とする。
- Reason: 完成速度と仕様一貫性を両立するため。
- Affected areas: 全体。
- Tests required: 現行回帰 + canonical acceptance。

## D-003 active monster scope
- Status: SUPERSEDED / CONFIRMED_CHANGE
- Baseline: 84系列 / 239体。No.239=`シラユキヒメ`。
- Later design/runtime: 83系列 / No.001〜238。
- Evidence of approval: `USER-DECISION-EVIDENCE.md` UDE-001（2026-08-24 user explicit）。
- Decision: active game/master/dex/image-required scopeはNo.001〜238 / 83系列。No.239はbaseline/referenceに保全しゲームへ出さない。
- Affected areas: monster master / dex / art / runtime / tests。
- Tests required: active 238、No.239 absent、baseline 239 retained。

## D-004 捕獲方式と「わ」
- Status: SUPERSEDED / CONFIRMED_CHANGE
- Baseline: 勝利後CAPTURE、HP非依存、最大3投、ぎん×1.5、きん×2.0。
- Evidence of approval: UDE-002（2026-08-24 user explicit）。
- Decision: 戦闘中、敵HP50%以下で捕獲可能。ほし1.0 / ぎん1.2 / きん1.5 / にじ100%、非にじ最終上限92%、1戦最大3投。
- Note: 原本の4つの星が順に点灯して輪が完成する演出は、後続で廃止承認がないため維持。
- Tests required: eligibility / multipliers / cap / 3 throws / temporal 4-stage animation。

## D-005 Kids Quest学習の権威
- Status: CONFIRMED
- Baseline: `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` はKids Quest最新mainを学習source of truthとし、ManaEvo独自再実装を禁止。
- Runtime: `src/kids-quest-study` がactive、`src/study` はlegacy/regression系。
- Decision: 学年・科目・問題・SRS・習熟・試練・先取り等の学習ロジックはKids Quest固定sourceを維持。ManaEvoはゲーム報酬bridgeのみ持つ。
- Tests required: Kids Quest source SHA / learning regression / active routing。

## D-006 学習→ticket / ring報酬
- Status: CONFIRMED + REVERT-TO-BASELINE（一部）
- Baseline: core all clear ticket+3。追加問題1問クリアごとticket+1、上限なし。ticket 7日/FEFO。
- Later explicit decision: PR #5の「今回ユーザーが確定した仕様」により ring economy は daily完了star+3 / 追加学習3正解ごとstar+1 / unit MASTER silver+1 / hard MASTER gold+1 へ変更。
- Runtime drift: extra 3問中2問でtask全体ticket+1、追加学習star+1欠落。
- Decision: Kids Questのextra task形状（3問）は維持するが、ManaEvo reward bridgeは原本どおり追加問題1問クリアごとticket+1・上限なしへ戻す。ringは後続明示決定を採用し、追加3正解ごとのstar+1も実装する。
- Tests required: core+3 / per-extra-question ticket / no cap / ring grants / 7-day FEFO。

## D-007 ticket battle lifecycle
- Status: SUPERSEDED / CONFIRMED_CHANGE
- Baseline: battle開始では非消費、勝利確定時に1枚消費、敗北/逃走は非消費で同一encounter保持。
- Later explicit decision: PR #5 user-confirmed ticket reservation lifecycle。
- Decision: battle開始時に1枚reserve。勝利/捕獲成功で消費確定。敗北/明示離脱は同じ期限lotを返却。crash/reloadはactiveBattle再開で二重消費しない。
- Tests required: reserve/refund/commit/idempotency/original-expiry。

## D-008 進化アイテム取得
- Status: REVERT-TO-BASELINE
- Baseline: 学習→探索ポイント。5ptで探索1回、通常素材80% / 進化アイテム20%、地域別5連続不発後の6回目開始時にその地域の進化アイテムを1個選択保証。1日上限なし。地域ボス初回撃破でも地域アイテム1個。
- Later design/runtime: 32専用進化trial初回保証へ置換。
- Evidence of approval: exact置換を承認したユーザー証拠をPhase 1.5で回収できず。
- Decision: CURRENTは原本探索方式。専用trialを進化アイテム唯一の取得源として扱わない。trialを残す場合は別目的として正本承認が必要。
- Tests required: points / 5pt spend / 20% / per-area pity / 6th choice / persistence / boss bonus。

## D-009 地域ボス挑戦条件
- Status: REVERT-TO-BASELINE
- Baseline: 地域別 `progressPoints >= 12 && uniqueSkillCount >= 2`。core task初回+1、mastery milestone+2、chapter test初回+3。新地域は0pt/空集合から開始。ボス撃破で次地域解放。
- Later design/runtime: boss unlockを探索clear数5へ置換。
- Evidence of approval: 5-clearへの明示承認をPhase 1.5で回収できず。
- Decision: 入口/中盤/奥地の後続route構造とは共存させるが、boss challenge gateは原本の学習進行12pt+2skillをCURRENTとする。探索clear数5をその代替条件にはしない。
- Tests required: per-area reset/persist / points / 2 unique skills / boss→next area。

## D-010 重複捕獲
- Status: REVERT-TO-BASELINE
- Baseline: 初回捕獲は自動加入。2匹目以降は `なかまにする`（別instance）/ `おうえんにかえる`（そだちのかけら+1）の2択。かけら3個で任意の手持ち1体へ育成XP+30。
- Runtime: duplicateでも常に新instanceをBOXへ追加。
- Evidence of approval: baseline分岐を削除するユーザー承認をPhase 1.5で回収できず。
- Decision: duplicate choice + growth shardをCURRENTへ復元する。
- Tests required: first auto-join / duplicate choice / shard inventory / 3→XP30 / no duplicate rewards。

## D-011 ワールド・自力進化
- Status: CONFIRMED_CHANGE + TUNING-DEFAULT
- Baseline: Area1〜4、最終形通常wild不可等の原則。
- Later explicit direction: UDE-005「自分で育てて進化させる体験」を強化するworld/zone方向。
- Decision: `area`（原データ分類）と冒険配置レイヤを分離。入口/中盤/奥地。第2形態の初回入手は自力進化、自力進化後のみ後半wild解禁。`evolutionDiscoveries`で自力進化を別記録。最終形は通常wild捕獲不可。過去areaへ戻り育成差を実感できる。
- Tuning default: 現行 zone Lv帯（A1 5–22 / A2 18–38 / A3 32–58 / A4 50–80 / EX 70–100）やzone clear数はplaytest用暫定値。プロダクト正本ではなくbalance tuningとして調整可。
- Tests required: discovery gate / final wild ban / location persist / level clamp / return-to-old-area advantage。

## D-012 ボス再戦
- Status: CONFIRMED_CHANGE
- Evidence of approval: UDE-003。
- Decision: story/area bossは育成後の通常再戦で相対的に楽になる。初回snapshotを通常再戦で固定し、challenge再戦のみ再scale可。balance version更新でsnapshotを再評価する場合、新snapshotを1回保存し以後再固定する。
- Runtime drift: invalid old-version snapshotから新planを計算してもreplacement snapshotを保存しない不具合あり。
- Tests required: first snapshot / normal lock / challenge rescale / version replacement then lock。

## D-013 UI再建原則
- Status: CONFIRMED（原則） / canonical draft要補正
- Evidence: baseline画面思想 + UDE-006 + PR #39 audit。
- Decision: 旧UIへ新UIを積み増さない。通常画面は子どもの主判断を1つに絞り、詳細はprogressive disclosure。Adventureでworld route+Area tabs、常設search/filter、大量stage一覧を同時表示しない。CSSの権威をload-order/`!important`にしない。
- Correction before promotion: Captureは子ども向け5段階/おすすめ表示を主、正確な%は詳細補助とする（baseline 08）。Homeは学習未完了ならStudy、完了後はAdventureを基本primaryとし、Evolutionは該当flow内でfull-screen rewardとして扱う。PR #39 draftをそのまま無条件CURRENTへ昇格しない。
- Tests required: 390px first viewport / one dominant CTA / child-flow E2E / no duplicate navigation surfaces。

## D-014 モンスター説明・画像正本
- Status: CONFIRMED
- Baseline: `scripts/monster-visual-briefs.json` にfamilyごとの motif / concept / personalityArc / palette / graphicCore と各stageのdescription / expressionAndPose / silhouetteが存在。No.001〜238のsourceデータは原本比較で一致。
- Decision: キャラ説明は新規創作から始めずbaseline visual briefsを救出・正式化する。active 238についてfamily continuityを維持し、既存生成画像は候補として全件監査、合格を正式化、NGのみ再生成する。
- Art rules: 5〜8歳向け、2〜4頭身中心、全身、透明/白背景、小表示で識別、同系列は顔/配色/象徴部位の最低2要素を継承、既存IP模倣禁止。
- Tests/acceptance: 238 identity mapping / family continuity / asset manifest / formal-vs-placeholder contract。

## D-015 司令塔交代・進捗復元・実成果物gate
- Status: CONFIRMED
- Baseline: Worker handoffと古い `WORK-QUEUE.md` の状態表記だけでは、司令塔交代時に再建全体の意図・現在gate・実成果物の有無を復元できず、最新会話やWorker完了報告へ過度に依存する余地があった。
- Later design: PR #80で `REBUILD-START-HERE.md` に司令塔復元プロトコルを追加し、`WORK-QUEUE.md` をライブ進捗正本から履歴/番号索引へ再分類、`HANDOFF-TEMPLATE.md` をWorker専用と明確化した。
- Runtime: 影響なし。
- Evidence of approval: 2026-08-26 ユーザーが司令塔引き継ぎ不足を指摘し、既存ガバナンス資料の確認・誤り修正を明示依頼。PR #80および後続レビュー。
- Decision: 司令塔交代時は新しい固定handoff正本を増やさず、`REBUILD-START-HERE.md` → `DECISION-LOG.md` → CURRENT → 現在Phase計画 → base branch / PR / branch / 実成果物 → Acceptance/review gate の順で現在地を復元する。現在地は最大Work Item番号やWorkerの完了文言ではなく、Acceptanceを満たした最後のgateで判定する。必須成果物に画像・バイナリ・実機確認・デプロイ等がある場合は、担当能力を着手前に確認し、能力不足の設計資料・prompt・generation packetを実成果物の代替として完了扱いしない。
- Reason: 最新会話だけによる計画変更、古い進捗コピーの陳腐化、設計完了と実装/実画像完了の混同、能力不足Workerへの誤委任を防止するため。
- Affected areas: 全Work Item governance / commander handoff / Worker handoff。プロダクト仕様・runtimeには影響しない。
- Tests required: governance review。実際の各Work Itemでは、そのWork Item固有Acceptanceに必要な実成果物・テスト・目視確認を別途要求する。

## D-016 CANDIDATE monster art の段階的production公開
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: D-014および `design/current/09-MONSTER-MASTER-ART-SPEC.md` は、通常child-facing runtimeではFORMAL artのみを解決し、CANDIDATEは明示review toolingだけでpreviewする契約としていた。
- Later runtime/release: W-303 / W-304 / W-305でQA・binary handoff・candidate ingestionを通過した実画像49体を、explicit candidate-art overlayとしてplaytest previewへ載せ、その後productionへ公開した。release evidenceは `design/rebuild/release/PRODUCTION-CANDIDATE-ART-ROLLOUT.md`。
- Evidence of approval: 2026-08-27 ユーザー明示「もう本番であげて、キャラを徐々に増やすでいい」。
- Decision: 全238体のFORMAL完了をproduction公開条件にしない。Phase 4のvisual QA、candidate-safe WebP、binary handoff/refetch、candidate ingestion、provenance/checksum等のcandidate gateを満たしたspecies / Work Itemは、ユーザーが承認したproduction candidate-art rolloutの対象として段階的に通常ゲームへ表示してよい。これはFORMAL promotionではなく、manifestのstateをFORMALへ偽装してはならない。productionで表示するCANDIDATEは、検証済みscopeを明示的に列挙・追跡できるoverlay/allowlist等で管理し、ファイル存在やspecies番号範囲から推測して自動昇格しない。m239は引き続き除外する。
- Supersedes: D-014 / `09-MONSTER-MASTER-ART-SPEC.md` の「CANDIDATEはnormal gameplayへ出さない」というruntime eligibility制限のみを、この明示的な段階公開運用の範囲で置換する。FORMALの意味、W-321 cross-attribute QA、W-322 explicit FORMAL approval、originality/family continuity、asset QA・handoff・ingestion・provenanceの各gateは置換しない。
- Reason: 完成済みの実画像を使って実際のゲームを早期にplaytestし、以後も完成した属性から価値を本番へ届けつつ、FORMAL承認とproduction visibilityを混同しないため。
- Affected areas: monster-art runtime resolution / production release / Phase 4 candidate rollout。monster identity、active scope、FORMAL approval semanticsには影響しない。
- Tests required: production-visible candidate allowlistのexact scope / no implicit promotion / m239 absent / candidate asset existence+integrity / runtime fallback / FORMAL count/state不変 / build + child-flow smoke test。

## D-017 捕獲ボール化とiPhone UI playtest補正
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: 捕獲資源は子ども向けにも「ほしのわ / ぎんのわ / きんのわ / にじのわ」と表示し、4つの星が順に点灯して輪が完成するpresentationを採用していた。D-013はiPhone first viewport、progressive disclosure、exact %をsecondaryにするUI原則を固定していた。
- Runtime before decision: 捕獲選択は文字中心で、投げる物体の存在・投球・命中・包み込みが視覚化されていなかった。focused learning headerはiPhone safe-areaを十分所有せず、問題visualが小さいケース、top-level tab間でwindow scroll位置が漏れるケース、Battleの視覚階層と日本語改行が弱いケースが実機playtestで確認された。
- Evidence of approval: 2026-08-28 ユーザーがiPhone実機スクリーンショットとともに、問題画像拡大、status bar非干渉、tab別scroll、Battle/UIリッチ化、捕獲道具のボール化、投球/GET成否motion、学習UIと改行の全面改善を明示要求。「○○のわ」は子どもから不評でボール形状・名称へ変更することを明示。
- Decision: 捕獲domainのstable item keys `star / silver / gold / rainbow`、倍率 `1.0 / 1.2 / 1.5 / rainbow guaranteed`、非rainbow 92% cap、HP50% gate、最大3投、最終成功確率と4段階presentationの分離は変更しない。通常child-facing名称・視覚表現は **ほしボール / ぎんボール / きんボール / にじボール** とし、マナエボ独自の球形capture deviceとして描く。捕獲presentationは **1個のボールを投げる → 命中/包み込み → 4つの星を時間順に確認 → 成功時に閉じてGET / 失敗時に開放** の一連flowとする。既存作品の固有デザイン、配色配置、形状、演出タイミングを複製せず、「投げる→待つ→結果」という一般的なinteraction grammarのみ参考にする。
- UI decision: focused learningを含むinteractive surfaceはiPhone safe-areaを明示所有する。top-level 5画面はそれぞれ独立scroll位置を保持し、新しいtop-level destinationへ他画面のscroll位置を持ち込まない。focused flowは上端から開始し、終了時は元top-levelのscrollへ戻す。問題visualは375〜430px classでも問題文と同等以上の主役として読める寸法にする。Battleはarena / current state / command deckを分離し、技・相性・GET可能状態を一画面で判断しやすくする。狭いカードで日本語が1〜2文字単位に崩れる改行を許容しない。
- Supersedes: D-004 / D-006 / D-013およびCapture CURRENT内の「わ」という**child-facing名称・物体表現**と旧presentation記述だけを本Decisionで置換する。domain key、報酬量、捕獲確率、economy、4段階の意味は置換しない。
- Reason: 5〜8歳のchild playtestでは抽象的な「わ」より、投げる対象・待つ時間・結果が身体的に理解できる具体物の方が選択と結果の因果を理解しやすい。UI側でも画面間scroll leakage、safe-area衝突、小さすぎる問題visual、文字の不自然な分断は操作コストと認知負荷を増やすため。
- Affected areas: child-facing learning reward copy / Home resource display / Battle / Capture / HowTo / focused learning layout / top-level navigation scroll ownership / responsive typography。save/domain key migrationは不要。
- Tests required: stable capture keys and probabilities unchanged / child-facing ball labels / exactly one visual throw before domain 4-star frames / failed sequence never shows 4 completed stars / safe-area header / 375〜430px problem visual / top-level per-view scroll memory + Battle focused reset/restore / Battle command hierarchy / no `!important` / WebKit child journey。

## D-018 共通アカウント・クラウドセーブ・テストデータ
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: ManaEvoは端末内のManaEvo-owned storageを正本とし、stable child profile IDで学習・game stateを分離し、Parentからprofile切替とbackup/export/importを行う。端末間同期・オンラインアカウントは必須ではなかった。
- Runtime before decision: learning envelope、game `gameByProfile`、学習→ゲーム報酬bridgeはlocalStorage中心で、iPhone / iPad間では自動共有されない。monster個体は`instanceId / speciesId / level / xp / held item`等を保持し、学習側は学年・習熟・SRS・英語・試練・履歴等を保持する。
- Evidence of approval: 2026-08-28 ユーザーが、子どもがiPad・保護者端末など複数端末で利用するためDB保存とID/PWログインを要求。その後、最後のSupabase project枠をManaEvo専用ではなく今後の自作ゲームでも利用できる汎用backendにし、家族アカウント内でパパ・まさき・ウタノ等のplayer profileを切り替え、端末ごとに普段使うplayerを記憶し、全開放/第1形態/第2形態のテストデータとbackupを持つ案を明示承認した。
- Decision — account/backend: Family Opsとは分離した汎用personal-app backendを使用し、認証ユーザーは複数の自作appで共有可能とする。各appの保存データは`app_id`で分離し、ManaEvoは`app_id = mana-evo`を使用する。ManaEvoの通常認証は保護者向けemail + passwordとし、端末sessionを保持して毎回の再ログインを要求しない。password resetは認証基盤の回復フローを使う。clientへsecret/service-role credentialを配布しない。
- Decision — profile/device ownership: Auth accountとchild/player profileは別概念とする。1つの家族アカウント内にパパ・まさき・ウタノ等のstable profileを追加でき、各profileのlearning/game progressを混在させない。**どのprofileをこの端末で開くかだけはdevice-local preference**とし、iPadでまさきを選んでもiPhoneのcurrent playerを変更しない。cloud payloadはactive profile selectionを共有device authorityにしない。
- Decision — complete cloud snapshot: cloud saveは図鑑数などの要約だけでなく、既存ManaEvo-owned progressを復元可能なversioned snapshotとして扱う。少なくともprofile registry、各profileのlearning state、学習→game reward bridge、game envelopeを同じsave revisionへ束ねる。gameにはmonster individual ID/species/level/XP/held item、BOX/team/dex、ticket/capture/evolution resources、world/adventure、evolution discovery、active battle等を含み、learningには学年/先取り、mastery/unit stats、SRS/review/mistake、English、star trial、streak/history/daily/settings等を含む。local storageはoffline/cacheとして残し、cloudを端末間共有の持続層とする。
- Decision — concurrency/migration/backup: saveにはschema/content versionとrevisionを持たせ、将来のapp構造変更・monster追加をstable IDと明示migrationで吸収する。新monsterは旧saveで未発見/未所持として自然に扱い、species/instanceの並び順をidentityにしない。別端末でcloud revisionが進み、同時にlocalにも未同期変更がある場合はlast-write-winsで自動消去せずconflictとして保護者に選択させる。manual backupに加え、上書き・競合解決・復元・将来のmigration等の破壊的境界では事前snapshotを残す。
- Decision — test data: テストは通常の家族profileとしてcloud progressへ混ぜない。テスト開始時に実local stateを退避し、cloud syncを停止し、画面上にTEST表示を常設する。初期fixtureとして **全開放・全active species確認 / 全第1形態の進化確認 / 全第2形態の最終進化確認** を用意し、master/evolution dataから生成して将来のmonster追加や進化変更へ追従させる。終了時は退避した実データへ完全復元する。
- Supersedes: `design/current/07-SAVE-PROFILES-PARENT-PWA.md` の端末内saveを唯一の通常持続層として読む部分、およびbackupを手動export/importだけで満たす解釈を本Decisionの範囲で置換する。stable profile identity、learning/game同一profile ownership、Kids Quest分離、Parent adult-control、migration idempotency、GitHub Pages/PWA境界は維持する。
- Reason: 端末ごとの保存だけでは家族の複数端末利用で継続性が失われる。一方、current playerまでcloud共有すると複数端末が互いの画面状態を奪うため、progressとdevice preferenceを分離する必要がある。また、開発中の大規模UI/game/art変更を安全かつ高速に確認するには、実セーブを汚さない再生成可能fixtureと世代backupが必要なため。
- Affected areas: Save / Profiles / Parent / auth / cloud persistence / local cache / backup / test tooling / deployment configuration。Kids Quest source write authority、monster identity/master、game rule自体は変更しない。
- Tests required: RLS own-user isolation / no anon write / no client secret / email session persistence+recovery / full learning+game+reward roundtrip / profile A↔B isolation / per-device active-profile independence / optimistic revision conflict / offline local continuity / backup+restore / migration idempotency / test-mode no-cloud-write+exact restore / all-active-species fixture / stage1+stage2 evolution fixture / build + iPhone/WebKit smoke test。
