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