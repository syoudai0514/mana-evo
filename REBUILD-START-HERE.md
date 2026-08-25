# ManaEvo 再建 — START HERE

更新日: 2026-08-26
状態: REBUILD GOVERNANCE

この文書は、ManaEvo 再建作業の唯一の入口です。

## 目的

ManaEvo を、原本 `mana-evo-terra-FINAL-CORRECTED` から現在までの試行錯誤を整理し、正しい変更だけを残した一貫した学習RPGとして完成させる。

## 最重要原則

1. 現行ソースを正本と決めつけない。
2. 原本へ機械的に巻き戻さない。
3. 原本からの差分は、変更理由を確認してから採否を決める。
4. 実装完了・CI成功は「仕様が正しい」根拠にはしない。
5. PRODUCT → UX → GAME RULE → DATA MASTER → IMPLEMENTATION の順を守る。
6. 不明な仕様を作業担当が勝手に決めない。
7. ユーザーの後続承認が確認できる変更は原本より優先する。
8. 重要判断は必ず `design/rebuild/DECISION-LOG.md` に残す。
9. 直近チャットや直近Work Itemだけを根拠に、承認済み計画を上書きしない。
10. 設計・資料・promptの完成と、実装・生成・実機/実画像レビューの完了を混同しない。
11. 現在のWork Itemが実際のAcceptance / review gateを満たす前に、次のWork Itemへ進んだことにしない。
12. Work Item番号、Worker完了報告、PR作成、CI PASSのいずれも、それ単独では「Acceptanceを満たした」証拠にしない。
13. 必須成果物が画像・バイナリ・実機確認・デプロイ等を含む場合、実行担当がその能力を持つことを着手前に確認する。能力がない担当による設計資料やgeneration packetは、実成果物の代替として完了扱いしない。

## 司令塔 / Reviewer の復元プロトコル（恒久）

司令塔チャットが交代しても、プロジェクト記憶をリセットしてはいけない。新しい司令塔は、新しい作戦やWorker指示を出す前に、必ず次の順で文脈を復元する。

1. `REBUILD-START-HERE.md`（この文書）
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/00-START-HERE.md`
4. 現在対象となっているPhaseの計画文書
5. 現在のbase branch HEADと、そのPhaseに関係するopen / merged PR・branchの実状態
6. 現在対象となっているWork Itemの成果物 / review / handoff / branch状態
7. Acceptanceが要求する**実成果物の種類**と、その実在・レビュー証拠（例: 実画像、実装、生成物、実機確認、デプロイ結果）
8. 必要に応じて、そのPhaseへ至った直前のCommander Review / Final Review
9. その後に最新のユーザー発言を評価する

現在Work Item自体が不明な場合は、最新会話から推測しない。現在PhaseのWork Item定義と、base branch、open PR、recent merged PR、各branchの成果物を照合して、**Acceptanceを満たした最後のgateと、まだ満たしていない最初のgate**を特定する。

この文書には「現在W-xxx」「現在何体完了」など、進行により変化する状態を正本として書かない。現在地は毎回、現在のPhase計画とWork Item成果物から復元する。これにより、引き継ぎ資料の更新漏れで古い現在地を信じる事故を防ぐ。

`PHASE-1-COMMANDER-REVIEW.md`、`PHASE-2-COMMANDER-REVIEW.md`、`PHASE-2-FINAL-REVIEW.md` 等のCommander Reviewは、その時点の判断を残す履歴・evidenceであり、現在進捗のライブ台帳ではない。

司令塔は作戦を出す前に最低限、次を説明できなければならない。

- なぜ今回の再建を行っているか
- 正本順位は何か
- W-101以降で何をCURRENTとして固定したか
- 現在のPhaseが何を目的としているか
- 現在のWork Itemの本当のAcceptance / gateは何か
- そのAcceptanceが要求する実成果物は何か
- 実成果物が本当に存在するか、それとも設計・prompt・review資料だけか
- 実行担当に必要な能力（例: image generation / GitHub write / build / browser / deployment）があるか
- 何が既決事項で、何が未決事項か
- 最新ユーザー発言が既存計画を本当に変更するものか

説明できない場合は、推測で作戦を出さず、上記資料とGitHub実状態から文脈を復元する。

## ユーザー発言の分類ルール

ユーザーの発言がscope・仕様・計画に影響しそうな場合でも、即座に新仕様へ変換しない。まず次のどれかに分類する。

1. **質問 / 確認** — 既に決まっているか、現在計画がどうなっているかを尋ねている。
2. **懸念 / リスク指摘** — 品質低下、矛盾、運用事故などの可能性を指摘している。
3. **提案 / 候補案** — 代替案を提示しているが、既存計画の置換を明示していない。
4. **明示的な変更決定** — 既存仕様・計画・運用を変更する意思を明確に示している。

1〜3は、それだけでは新しい決定ではない。まずCURRENT、DECISION-LOG、現在Phase計画、既承認事項と照合し、司令塔が以下のどれかを判断して返す。

- 既に対策済み / 既決事項
- 既存計画の説明不足
- 実際に計画上の穴がある
- 新しい明示決定が必要

「ユーザーの明示決定」が正本順位1位であることと、「ユーザーのすべての発言を仕様変更扱いする」ことは同義ではない。

## 役割分担

### 司令塔 / Reviewer
- 原本・履歴・現行設計・実装を横断して正本を判定する。
- 再建全体の意図・既決事項・現在のPhase/gateを復元してから判断する。
- base branch / PR / branch / 実成果物を確認し、報告文だけで進捗判定しない。
- ユーザー発言を質問 / 懸念 / 提案 / 明示決定に分類する。
- 現在のPhase計画に沿って作業単位を切る。
- 各Workerへscope、Acceptance、所有範囲、必須成果物、必要実行能力を明確に渡す。
- 必要能力を持たないWorkerへ、その能力が必須のWork Itemを「完了まで」任せない。別の実行担当へ切るか、明示的に分業する。
- PRをレビューし、正本適合・回帰・UX・実成果物の存在を確認する。
- 仕様変更が本当に必要な場合だけユーザー判断へ上げる。

### Worker / SOL 作業チャット
- 指定された work item のみ実施する。
- 自分で仕様を拡張しない。
- 着手時に必須成果物と必要能力を確認し、必要能力がない場合は早期に `BLOCKED CAPABILITY` として報告する。
- 能力不足を設計資料・generation packet・仮成果物で置き換えてAcceptance達成と主張しない。
- 原本と current canonical の矛盾を見つけたら実装せず報告する。
- 変更内容・テスト・未解決点を handoff に残す。

## 正本順位（再建期間中）

1. ユーザーの明示決定
2. 原本 `mana-evo-terra-FINAL-CORRECTED`
3. 原本以降の、変更理由が確認できる承認済み仕様
4. `design/current/`（再建後に作成するCURRENT正本）
5. DATA MASTER
6. 現行実装
7. 過去レビュー・完了報告

※ 2と3が競合した場合は「後続変更が本当に承認されたか」を確認する。実装されているだけでは承認扱いにしない。

※ 1の「ユーザーの明示決定」には、確認質問・懸念・単なる候補案を自動的に含めない。

## 作業フロー

1. Baseline Rescue — 原本をGitHubに保存
2. Diff Ledger — 原本 / 後続設計 / runtime の差分台帳
3. Canonical Decisions — 意図的変更 / 勝手変更 / 不明 を分類
4. Current Canonical — 現行正式仕様を一本化
5. UX Rebuild — ホーム / ぼうけん / バトル / モンスター / あそびかた
6. Logic Alignment — 学習報酬 / 捕獲 / 進化 / ボス / 特殊形態
7. Regression — ユーザー体験契約ベースのテストへ整理
8. Release — GitHub Pagesで実機確認
9. Asset Completion — CURRENTに従う正式Monster Artの生成・レビュー・承認・反映

## 進捗・Work Item情報の扱い

`design/rebuild/WORK-QUEUE.md` はWork Item番号体系と再建履歴の索引として使う。現在の進捗・次に実行すべきWork Itemを判定するライブ正本としては使わない。

現在地は次から復元する。

1. 現在PhaseのWork Item計画文書
2. 現在のbase branch HEADと関連PR / branch状態
3. 対象Work Itemの実成果物
4. そのWork ItemのAcceptance / review gateと実際の証拠
5. 必要なら直前のCommander Review / Final Review

**現在地は「最大のWork Item番号」や「最新の完了報告」ではなく、Acceptanceを満たした最後のgateで決める。**

同じ進捗状態を複数の恒久資料へコピーしない。

## チャット分岐ルール

以下のどれかに該当したら、Worker作業は新しいチャットへ分岐する。

- 1 work item が複数の大領域へ広がった
- 仕様判断が3件以上発生した
- 変更ファイルが概ね10ファイルを超える
- 同じ説明を繰り返し始めた
- Workerが原本/正本の優先順位に迷った
- PRレビューで根本方針の再確認が必要になった

Worker分岐時は `design/rebuild/HANDOFF-TEMPLATE.md` の形式で引き継ぐ。

司令塔交代時はWorker用handoffだけで済ませず、本書の「司令塔 / Reviewer の復元プロトコル」を必ず実行する。

## 禁止事項

- 「今のコードがこうだから」で仕様を決定する
- 既存UIを残したまま新UIを上に足す
- 過去レビュー文書をCURRENT正本として扱う
- CI PASSを仕様妥当性の証明にする
- Work Item番号 / PR作成 / Worker完了報告だけでAcceptance達成と判断する
- 必須の実画像・実装・実機確認・デプロイ結果がないのに、設計資料で代替して完了扱いする
- 必要能力を持たない実行担当へ作業を任せたまま、能力不足を後工程へ持ち越す
- 仕様不明を推測で埋める
- ユーザーの確認質問・懸念をそのまま新仕様へ変換する
- 直近の会話だけを理由に承認済みPhase計画を再設計する
- 設計/プロンプト/レビュー資料だけで、実装・実画像生成・実機確認まで完了したと扱う
- 進捗情報を複数の恒久資料へコピーし、どれが最新か分からない状態を作る
- mainへ直接大規模変更を入れる
