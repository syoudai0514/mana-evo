# ManaEvo 再建 Decision Log

重要仕様の判断を時系列で残す。実装だけで仕様を確定しない。

更新日: 2026-08-29

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
- Later override: **D-022 Battle V6がextra battle-ticket rateのみを `5 correct extra answers -> ticket +1` へ後続置換する。** D-006のdaily core +3、additional 3 correct -> star+1、MASTER silver/gold、FEFO等の非競合部分は維持。

## D-007 ticket battle lifecycle
- Status: SUPERSEDED / CONFIRMED_CHANGE
- Baseline: battle開始では非消費、勝利確定時に1枚消費、敗北/逃走は非消費で同一encounter保持。
- Later explicit decision: PR #5 user-confirmed ticket reservation lifecycle。
- Decision: battle開始時に1枚reserve。勝利/捕獲成功で消費確定。敗北/明示離脱は同じ期限lotを返却。crash/reloadはactiveBattle再開で二重消費しない。
- Tests required: reserve/refund/commit/idempotency/original-expiry。
- Later override: **D-022 Battle V6がplayed loss / explicit abandonのrefundをcommitへ変更する。** exact reservation、FEFO、crash/reload resume、idempotencyは維持。

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
- Tuning default: 2026-08-25時点 zone Lv帯（A1 5–22 / A2 18–38 / A3 32–58 / A4 50–80 / EX 70–100）やzone clear数はplaytest用暫定値。
- Later tuning override: **D-022がcurrent production bandsをA1 5–16 / A2 14–27 / A3 24–40 / A4 37–58 / EX 55–100へ更新する。** route clear数等の非競合tuningは別。
- Tests required: discovery gate / final wild ban / location persist / level clamp / return-to-old-area advantage。

## D-012 ボス再戦
- Status: CONFIRMED_CHANGE
- Evidence of approval: UDE-003。
- Decision: story/area bossは育成後の通常再戦で相対的に楽になる。初回snapshotを通常再戦で固定し、challenge再戦のみ再scale可。balance version更新でsnapshotを再評価する場合、新snapshotを1回保存し以後再固定する。
- Runtime drift: invalid old-version snapshotからnew planを計算してもreplacement snapshotを保存しない不具合あり。
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

## D-019 Vercelを唯一のproduction canonical hostとする
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: `design/current/07-SAVE-PROFILES-PARENT-PWA.md` はGitHub Pagesをofficial production host、`https://syoudai0514.github.io/mana-evo/`をcanonical URL、`/mana-evo/`をproduction base pathとし、Vercelをnon-authoritative preview/supporting environmentとしていた。
- Runtime before decision: GitHub Pages main-push workflowが残る一方、Vercel Git deploymentもpreview目的で再有効化され、repository homepageは`https://mana-evo.vercel.app`、Vercel main deploymentも実機playtestに継続利用されていた。D-018でSupabase Auth / password recovery / multi-device cloud saveを導入するため、2つの本番候補URLと2種類のbase/scopeを維持する運用コストが顕在化した。
- Evidence of approval: 2026-08-28 ユーザーがGitHub PagesとVercelの両案を改めて比較した上で、「じゃぁVercelで一本化よろしく！」と明示決定。
- Decision: ManaEvoの**唯一のproduction canonical hostはVercel**とし、canonical production URLを`https://mana-evo.vercel.app/`、production app base/scopeを`/`とする。GitHubはsource / PR / CI authority、Vercelはproduction + PR Preview、SupabaseはAuth / DB / Cloud Saveを担当する。GitHub Pagesのmain自動production deploymentは廃止し、PWA manifest `id/start_url/scope`、canonical/OG metadata、Service Worker registration/scope、release readiness、Supabase AuthのSite URL / production redirectはVercel production originへ統一する。
- Preview rule: Vercel Previewはproduction authorityではないが、PRごとの実機確認環境として使用してよい。Supabase AuthでPreviewを検証する場合のみ必要最小限のpreview redirectを追加許可する。Preview URLをcanonical metadataやPWA identityへ書き込まない。
- Supersedes: `design/current/07-SAVE-PROFILES-PARENT-PWA.md` section 7 / 10 / Hosting acceptanceにあるGitHub Pages production authority、D-018末尾の「GitHub Pages/PWA境界は維持する」という部分、および過去のVercel非authority判断を本Decisionで置換する。Kids Questの別repository/app/storage ownershipは変更しない。
- Reason: Supabase自体は静的GitHub Pagesでも利用可能だが、ManaEvoの現在の開発ではAuth redirect、password recovery、PWA identity、Service Worker scope、PR Preview、iPhone実機確認を一つのroot production originへ統一した方が運用・検証・将来拡張が単純になるため。
- Affected areas: hosting / deployment / canonical metadata / PWA manifest / Service Worker / release readiness / Supabase Auth URLs / preview policy / CURRENT W-107 hosting sections。game rules、save payload semantics、monster art approval semanticsには影響しない。
- Tests required: production root build / canonical+OG exact Vercel URL / manifest id+start_url+scope exact Vercel URL / no `/mana-evo/` production-base dependency / SW root scope + update/offline continuity / GitHub Pages deploy workflow absent / Vercel production READY / Supabase confirmation+recovery redirect to Vercel / iPhone PWA install+relaunch smoke。

## D-020 Evolution pacing V5
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: encounter XP poolをbattle-start team全員へ大きく配る構造により、production playtestで初日から複数monsterが進化できるほど育成速度が速くなった。
- Runtime before decision: ordinary encounter XP poolは110等で、eligible team membersへのsettlementが進化ペースを早めていた。
- Evidence of approval: 2026-08-28 production playtest後、PR #104 `Balance V5: slow first-day evolution pacing` をユーザー要求に基づきmainへmerge。
- Decision: encounter XP poolはcompat/reporting上維持するが、active battlerの受取はpoolの**40%**。他のeligible teammateはactive受取量の**40%**（poolの16% before later modifiers）。学習で得るticket量はこのV5では変更しない。level-evolution speciesを高Lvで捕獲した場合、次のlevel evolution thresholdの少なくとも**5 levels手前**へcapture levelをbufferする。既存save/progressは自動rewrite/rollbackしない。
- Reason: 「捕まえる→育てる→自分で進化させる」時間を確保し、初日で進化体験を消費し尽くさないため。
- Affected areas: Battle XP settlement / capture level initialization / evolution pacing。学習仕様、Monster Art、既存save levelは変更しない。
- Tests required: 110 pool→active44 / teammate18のrounding contract、first-day evolution pacing、capture buffer、existing battle/capture/evolution regression。

## D-021 Cloud conflictをchild gameplayから外す
- Status: CONFIRMED_CHANGE
- Baseline / D-018: same-profile cloud conflictはsilent last-write-wins禁止、Parentが解決する。
- Runtime before decision: logged-in child gameplay中にもcloud/account FABやconflict modalが出て、`今すぐ同期`を押しても同じconflict検出へ戻るため、子どもの通常flowを妨げた。
- Evidence of approval: 2026-08-28 playtest問題を受けたPR #105 / #107がmainへmerge。
- Decision: normal logged-in child gameplayではcloud/account FABを常設しない。conflict検出だけでmodalをauto-openしない。conflict pending中もlocal saveを継続する。sync attention / cloud-vs-device overwrite choiceはParent-owned surfaceへ集約し、既存Parent PIN protectionを維持する。fresh/unauthenticated login entry、Parent内management、TEST等の必要経路は残す。
- Reason: cloud conflictはadult-ownedであり、学習・冒険・battle中の子どもへ解決責務を押しつけないため。
- Affected areas: child UI / Parent / cloud sync presentation。cloud revision/backup/save semantics自体はD-018を維持。
- Tests required: no child conflict FAB / no auto-modal / local save continues while pending / Parent conflict action reachable+PIN protected / stale conflict clears after resolution。

## D-022 Battle V6 — study-first pacing / fair fight / played-ticket cost / post-KO capture
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: D-006はextra 1clearごとticket+1、D-007はloss/explicit abandonでreservation refund。旧battle tuningはSTAB1.5 / crit1.5 / random0.90〜1.00等。D-011旧level bandsはより高く広かった。captureはHP<=50%の生存中windowのみ。
- Runtime/problem evidence: child playtestでone-hit win/lossが多い、高Lvactive + 低Lvbenchでenemyが弱くなる、loss/refundがfree retry loopになる、XP/world progressionが速すぎる、turn順が分かりづらい、KOするとwild capture機会を失う問題が確認された。
- Evidence of approval: 2026-08-29 user requirementsを受けたPR #110 `Battle V6: study-first pacing, fair fights, post-KO capture` がmainへmerge。production merged main commit `f3017bda0724d398bc35c959df34316f5e9e35bd`。
- Decision — additional study ticket: daily core `ticket+3`は維持。daily core完了後のqualifying `extra` correct **5回ごとにticket+1**。freeはdirect ticket0。D-006のadditional 3 correct -> star+1、MASTER silver/gold等は維持。
- Decision — played ticket settlement: battle start exact reservationは維持。win / capture success / **loss / explicit voluntary abandon** はreserved ticketをconsume/commit。reload / crash / Safari終了等のtechnical interruptionはsame `activeBattle` resumeし、追加reserve/consumeしない。
- Decision — damage tuning: STAB **1.25**、critical chance 1/16、critical multiplier **1.35**、damage random **0.92〜1.00**。type effectiveness/immunity semanticsは維持。
- Decision — normal fair-fight invariant: ordinary encounterのreferenceはactive battlerを主とし、**weak benchを加えることでnormal referenceをactive-only powerより下げてはいけない**。強いactive + 弱い控えによるenemy downscale exploitを禁止する。already-cleared old normal stageは完全追従せず、育成差を感じられるrepeat capを維持する。
- Runtime drift note: merged #110の `0.70 * activePower + 0.30 * strongestSupportPower` はsupportが弱いとactive-onlyを下回り得るため、上記invariantを完全には満たさない。これはproduct decisionではなく既知implementation drift。open Draft PR #111がhotfix対象としているが、mergeされるまで「修正済み」とは扱わない。
- Decision — normal tuning defaults: weak target0.86/xp90、normal0.96/110、strong1.03/125、rare1.08/145、elite1.13/165。normal repeat reference capは約1.10、defensive mastery floor約0.70。tuning値は将来playtest変更可だがD-023により同PRでCURRENT同期する。
- Decision — boss tuning: team/roster/carry floorを考慮し、弱いteam swapでfirst snapshotを不当に下げない。current C/B/A/S/EX targetは1.04/1.10/1.16/1.22/1.30、HP1.30/1.45/1.60/1.75/1.90、ATK1.00/1.03/1.05/1.08/1.10、DEF1.02/1.05/1.07/1.10/1.12、XP pool180/200/220/250/300。balance version 6。D-012 snapshot/rematch原則は維持。
- Decision — Battle XP: D-020のactive/team distribution後、player-vs-enemy level gap multiplierを適用。playerがenemyより`>=15`高い→0.15、`>=10`→0.25、`>=6`→0.50、enemyがplayerより`>=3`高い→1.15、`>=5`高い→1.25、その他1.00。old-area farmingを最速育成経路にしない。
- Decision — world bands: A1 **5–16** (5–8 / 9–12 / 13–16)、A2 **14–27** (14–18 / 19–23 / 24–27)、A3 **24–40** (24–29 / 30–35 / 36–40)、A4 **37–58** (37–44 / 45–51 / 52–58)、EX **55–100**。
- Decision — post-KO capture: ordinary capturable wildをKOした後にもcapture opportunityを残す。boss/captureDisabled/specialは対象外。KOでsettleしたBattle XPをpost-KO capture successで再付与しない。new captured instanceへそのbattle XPをretroactive付与しない。same battleのcapture attempts total max3を維持。KO/turn presentation完了前にpost-KO CTAをactionableにしない。
- Decision — terminal settlement / presentation: move / Protect / switch / failed capture / end-turn status等、どのaction pathからterminal outcomeへ到達しても同じauthoritative settlementを通す。HP/KO/action presentationと操作CTAを同期し、UI path差でticket/reward/outcomeを変えない。
- Reason: game reward optimizationを学習時間・適正challenge・育成体験と整合させ、弱bench/free-retry/old-area XP farm等のゲーム側抜け道を減らす。
- Affected areas: W-101 ticket earning / W-102 battle+XP / W-103 post-KO capture / W-105 world tuning / W-106 battle presentation / W-108 acceptance。
- Tests required: 430/390/375 WebKit、ticket exactly-once、V6 damage constants、weak-bench active floor、boss snapshot、XP gap/order、post-KO no-double-XP、terminal-path convergence、KO presentation gate。

## D-023 Canonical Design Sync Gate
- Status: CONFIRMED / USER-DECISION
- Baseline / problem: 再建でCURRENTを作った後も、複数司令塔がruntime/productionを更新するたびに、設計書更新が別作業・後追いになり、次司令塔が古いCURRENTを読むかruntimeを独自正本化する循環が再発した。PR #81は司令塔復元を強化したが、「product change PRとowning designの恒久同期」まではCIで強制していなかった。
- Evidence of approval: 2026-08-29 ユーザーが「各司令塔に更新依頼はするけど恒久的に同期取れる仕組みづくりして欲しい」「あなたが把握していることはちゃんと設計書更新して」と明示要求。
- Decision: **product behavior changeとowning CURRENT updateを同じPR/change setで扱う。** protected runtime/art pathを変更するPRは本文に `Canonical-Impact: changed|none`、`Canonical-Domains:`、`Canonical-Reason:` を宣言する。`changed`ならowning `design/current/**` contractと本Decision Logを同じPRで変更する。`none`なら具体理由を書き、Reviewerがcontract changeなしを確認する。
- Machine-readable ownership: `design/current/canonical-sync-map.json` がruntime/art path→owning CURRENT domainをprocess metadataとして保持する。これはgameplay authorityではない。
- CI: `scripts/verify-canonical-sync.mjs` をPR CIで実行し、protected path changeに対するimpact宣言漏れ、`changed`なのにowning CURRENT未更新、Decision Log未更新、`none`理由不足をfailする。
- PR workflow: `.github/pull_request_template.md` で上記宣言とAcceptance evidenceを標準化する。
- Stateful companion rule: asset manifest/generated master/runtime allowlist等は可能な限りgenerate/verifyする。ただしfile existence、candidate QA、production visibilityからFORMAL approval等の**意味的承認を自動推測してはいけない**。
- Reason: 「あとで設計書を直す」を通常経路から排除し、司令塔が変わっても実装と正本の同期判断自体を忘れられないようにするため。
- Affected areas: all PR governance / commander / worker / CURRENT maintenance / CI。D-023導入だけではgameplay ruleを変更しない。
- Tests required: canonical-sync unit test / PR CI gate / full normal CI。意味判断はReviewer responsibilityとして残す。

## D-024 司令塔担当変更
- Status: CONFIRMED / USER-DECISION
- Baseline / prior state: D-015は司令塔交代時の復元手順を定義していたが、直近の旧司令塔チャット自体はactive commanderとして作業していた。
- Runtime: 影響なし。
- Evidence of approval: 2026-08-29 ユーザーが旧司令塔について「司令塔出来ません。司令塔切り替えます」と明示し、続けてPR #113のCanonical Syncルールを確認した上で「担当変更をCURRENT設計とDecision Logまで同期してから続けてください」と指示。
- Decision: ManaEvoのactive commander / Reviewer責務は旧司令塔チャットから後継司令塔へ移管する。旧司令塔チャットはactive planning authorityではなくhistorical evidenceとして扱う。後継司令塔はD-015 / `REBUILD-START-HERE.md` の復元プロトコルを実行し、旧司令塔の直近結論を無条件に継承せず、GitHub実状態とAcceptance evidenceから現在地を再判定する。
- Reason: 司令塔の判断品質低下をユーザーが明示的に認定し、担当交代を決定したため。担当変更自体もD-023に従いCURRENTとDecision Logへ同じchange setで同期する。
- Affected areas: commander assignment / handoff governance / CURRENT entry。gameplay、runtime、Monster Art rule、既存product decisionsは変更しない。
- Tests required: governance review。後継司令塔によるD-015 recovery完了確認。

## D-025 VOID — unmerged Draft #111 20秒rule
- Status: VOID / NEVER CURRENT
- Evidence: open Draft PR #111内で`5 correct + minimum 20s qualifying study time`がD-025名で提案・実装候補化されたがmainへmergeされていない。その後PR #115の二段階独立design reviewで、hard time gateはwaiting optimizationを作り高習熟児を不当に遅くするため却下された。
- Decision: D-025という識別子を後からCURRENT仕様として引用しない。20秒hard reward gate、continuous weighted Learning Value、challenge/recovery multiplierはいずれも未承認proposalとして扱う。
- Reason: unmerged draftの番号だけが将来検索で正本と誤認されることを防ぐため。
- Affected areas: governance / historical review only。
- Tests required: stale test prohibition。

## D-026 A+ semantic learning economy + Battle V6 production-review conformance
- Status: CONFIRMED_CHANGE / USER-DECISION / INDEPENDENT-DESIGN-REVIEW-PASS
- Baseline / prior CURRENT: D-022はdaily core後`5 qualifying extra correct -> ticket+1`まで確定していたが、`qualifying`のsemantic境界が曖昧で、main runtimeでは`additionalCorrectTotal`をextra/free/okawari共通加算していたため`free 4 + extra 1 -> ticket`が成立し得た。formal masteryが2日必要なためmastery確定前のsame-knowledge farm余地もあった。Battle側にはweak-bench active floor未達、pre-KO capture level-gap XP bypass、stale post-KO replay、end-turn DOT terminal settlement driftが独立production reviewで確認された。
- Design evidence: PR #115で学習→game economyを二段階独立review。weighted Learning Value / hard 20s gateを却下し、A+ binary semantic qualificationへ単純化。第二reviewのpromotion blockerだった(1) one ticket内same `knowledgeId` max3/5、(2) presentation-time provenance固定をproposalへ反映後、reviewer verdictは **DESIGN PASS — PROMOTE A+ TO CURRENT** に更新。2026-08-29 userがそのreview結果を提示し、実装・releaseを明示承認。
- Decision — A+ threshold: daily core `ticket+3`は維持。daily core完了後、`taskKind=extra`の**semantic qualifying correct 5回でticket+1**。fractional Learning Valueやhard time gateは使わない。
- Decision — qualifying intents: 出題提示時点で`learningIntent = adaptive | srs_due | reinforcement | revealed_retry`を固定する。`adaptive` current/unmastered、due SRS、genuine later reinforcement retrievalは各1。mastered non-due、revealed-answer immediate retry/acknowledgement、miss/`わからない`、free、okawari、duplicate semantic eventはticket progress 0。miss/support自体にbonusはなく、genuine recoveryも最大1。
- Decision — per-ticket diversity: **1 ticketを構成中の5 qualifying correctのうち同一`knowledgeId`は最大3。** これは直近5問sliding windowではない。同一knowledgeが3件入った後の4件目はKids Quest learning/other approved rewardへ通常反映するがticket bucketへ積まない。ticket完成後はnew bucket。capでrejectされたsemantic eventは観測済みとして保持し、bucket reset後にreplayしてcountできない。
- Decision — stable provenance/idempotency: reward bridgeへpresentation-time eligibility、`knowledgeId`、`unitId/skillId`、`questionInstanceId`、reinforcementの`originQuestionInstanceId`、stable `rewardEventId`を運ぶ。回答後のmutated mastery stateからintentを推測しない。partial ticket bucket/observed semantic IDsはprofile-ownedでreload/cloud/profile switchを跨いでexactly-once。
- Decision — high performer/time: 1〜2秒のgenuine correctをspeedだけで無効化しない。時間はP10/P50/P90/rolling learning:game ratio等のtelemetryに使うがticket eligibilityへminimum secondsを入れない。
- Decision — Battle conformance: D-022のproduct intentを実装へ一致させ、ordinary normal referenceは`max(activePower, 0.70*active + 0.30*strongestSupport)`。Battle XPはV5 distribution後にrecipient pre-settlement levelでV6 level-gap multiplierを適用してから`gainXp/evolution`へ渡し、KO/pre-KO capture/duplicate/evolution-crossingで同policy。post-KO captureはsecond XPなし。post-KO captureはcurrent persisted `game.activeBattle`/snapshotをauthorityとし、stale replayをball decrement/settlement前にside-effect-free reject。move/Protect/switch/failed capture/end-turn statusでenemy HP0ならsame-turn terminal settlement。Battle presentation中は次CTAをgate。
- Decision — existing levels: runtime/migrationで既存production levelを自動downgrade/normalizeしない。以前の一回限りDB correction方針を維持。
- Decision — owner-facing companion: product design変更PRではdeveloper canonicalと同時に`design/current/USER-GUIDE.md`を初心者向けに更新し、merge前に「これまで/変更後/理由/子どもへの影響/守ること」をuserへ表示する。最終再建releaseまでに全体版を完成し、その後も恒久的に最新化する。
- History note: 2026-08-29にmainへ一時ファイル作成→即削除の2 no-op-equivalent commitsが入ったが、最終tree差分は0でproduct/runtime/canonical内容への変更なし。本product-changeはその後current mainから専用branchで実施する。
- Reason: gameを多く遊びたい子が合理的に最適化しても、easy/mastered/replay/waiting/free-mode exploitではなくcurrent-fit retrieval、due SRS、genuine recoveryが最短経路になるようにし、同時にBattle側の既知runtime driftで学習economyを迂回できないようにするため。
- Affected areas: W-101 learning rewards / W-102 Battle+XP/ticket / W-103 capture / W-108 acceptance / canonical governance + owner-facing companion。Monster Art、FORMAL/CANDIDATE、existing-save level correction、PR #107 cloud child UXは変更しない。
- Tests required: A+ semantic qualification / per-ticket3-of-5 / free+okawari leakage / due SRS / reinforcement vs revealed retry / fast learner / semantic replay / profile+reload; weak-bench active floor; XP +6/+10/+15 and enemy +3/+5 across KO/capture/evolution; stale post-KO ball safety; end-turn DOT terminal convergence; exact reserved ticket loss/abandon/FEFO/expiration; cloud child UX regression; WebKit 375/390/430; full npm test/build/release readiness/canonical sync.

## D-027 保護者Google認証と認証方法の明示
- Status: CONFIRMED_CHANGE / USER-DECISION
- Baseline / prior CURRENT: D-018は通常の保護者cloud認証をemail + passwordとして確定し、実runtimeも`CloudAccountShell`でemail/password signup/signin/recoveryのみを提供していた。画面の「パスワード」はGoogle passwordとの違いを説明せず、Google OAuthの入口もなかった。
- Runtime / backend evidence: 2026-08-29時点のshared Supabase Authを確認すると、登録済みidentityはemail providerのみで、Google identityは存在しない。したがって現在のManaEvo accountがGmailアドレスでも、Google OAuth登録済みであることを意味しない。一方、ユーザー実機ではGmailアドレスとgeneric password欄が並び、Googleのパスワードを入れるべきか判断できず`Invalid login credentials`へ到達した。
- Evidence of approval: 2026-08-29 ユーザーが実機account/cloud-save画面を提示し、「認証ないよ？」「マジか。頼むわ」「設計書も直してね」とGoogleログイン経路と設計同期の修正を明示依頼。
- Decision — supported methods: Parent/family cloud loginは **(1) email + ManaEvo/Supabase password** と **(2) Google OAuth（provider設定済みの場合）** を別のlogin methodとして提供する。Gmailアドレスであること自体からGoogle認証方式を推測しない。
- Decision — credential safety: ManaEvoはGoogle account passwordを入力させず、受信・保存・検証・proxyしない。Google credentialはGoogle自身の認証surfaceでのみ扱う。email/password欄は`ManaEvo用パスワード`と明記し、「Googleアカウントのパスワードを入力しない」ことを画面上で説明する。password recoveryもManaEvo/Supabase email credentialの回復でありGoogle password resetではない。
- Decision — provider capability: Google CTAはSupabase Auth provider availabilityを確認し、実際にGoogle providerが有効な場合だけactionableとする。provider未設定時は「管理者設定待ち」と明示し、Google passwordをemail loginへ試させるfallbackを作らない。既存email/password login/recoveryはprovider未設定でも維持する。
- Decision — cloud ownership / linking: cloud ownershipはemail文字列ではなくstable Supabase Auth user UUID (`auth.uid()`)。既存の**verified-email** userが同じverified emailのGoogle OAuthを追加する場合は、Supabase Authのautomatic identity linkingを利用し、同じAuth user UUIDにGoogle identityを追加して既存ManaEvo cloud save ownerを維持する。安全なlinkを確認できない場合は、メール文字列だけでsilent merge/duplicate-owner migrationを行わずadult recoveryへ止める。
- Decision — redirects / secrets: production email confirmation、ManaEvo password recovery、Google OAuth returnはcanonical `https://mana-evo.vercel.app/`へ戻す。Google Client ID/Secret等のprovider設定はGoogle/Supabaseの管理surfaceで行い、特にClient Secretをrepository/browser bundle/通常ManaEvo入力欄へ配置しない。Preview redirectはD-019の必要最小限ルールを維持する。
- Decision — Parent PIN: local Parent PINとcloud account authenticationは引き続き別概念。Google loginを追加してもParent-owned destructive controlsのPIN gateを弱めない。
- External configuration gate: runtimeにGoogle OAuth経路を実装しただけではproduction Google login完成とは扱わない。Google Cloud Web OAuth clientとSupabase Google providerの有効化、redirect設定、same-user cloud continuityの実証がrelease evidenceとして必要。秘密情報をチャットへ貼ることは要求しない。
- Supersedes: D-018の「通常認証はemail + password」を**唯一の認証方法と読む部分だけ**を置換する。D-018のAuth account/profile分離、`auth.uid()` ownership、RLS、cloud snapshot、conflict/backup/test-mode、session persistenceは維持する。
- Reason: Googleで登録した認識の保護者が再ログイン時にGoogle passwordをManaEvoへ入力してしまう認知・security trapをなくし、端末変更時のcloud recoveryを分かりやすくする。同時に、login method追加で既存cloud ownerが分裂する事故を防ぐため。
- Affected areas: W-107 save-platform / Parent account auth UI / Supabase Auth integration / W-108 acceptance / owner-facing USER-GUIDE。学習、battle、capture、evolution、Monster Artのproduct ruleは変更しない。
- Tests required: provider settings detection / Google authorize URL + canonical redirect / explicit UI wording / no Google-password collection / existing email login+recovery regression / OAuth callback session / same verified-email same Auth user UUID + cloud owner continuity / RLS / no provider secret in source/browser / iPhone WebKit account flow / canonical sync.
