# ManaEvo 再建 — START HERE

更新日: 2026-08-26
状態: REBUILD GOVERNANCE

この文書は、ManaEvo 再建作業の唯一の入口です。

## 司令塔は最初に必ず読む

新しい司令塔 / Reviewer は、直近チャットや直近Work Itemだけを見て計画を作ってはいけない。

必読順序:

1. `REBUILD-START-HERE.md`（この文書）
2. `design/rebuild/COMMANDER-HANDOFF.md`
3. `design/rebuild/DECISION-LOG.md`
4. `design/current/00-START-HERE.md`
5. 現在のPhase計画
6. 現在のWork Item成果物 / handoff
7. その後に最新ユーザー発言を評価する

司令塔交代はプロジェクト記憶のリセットを意味しない。再建の経緯・正本順位・既決事項・現在のgateを理解できていない状態では、新しい作戦やWorker指示を作らない。

### ユーザー発言の扱い

ユーザー発言は、まず以下へ分類する。

- 質問 / 確認
- 懸念 / リスク指摘
- 提案 / 候補案
- 明示的な仕様・運用変更決定

質問・懸念・提案を、そのまま新仕様や計画変更として扱わない。まず既存CURRENT、DECISION-LOG、Phase計画、既決事項と照合し、`既に対策済み / 説明不足 / 本当の計画ギャップ / 新規明示決定が必要` のどれかを司令塔が判断する。

詳細と過去の失敗事例は `design/rebuild/COMMANDER-HANDOFF.md` を正本とする。

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
9. 司令塔は直近会話だけで既存計画を上書きしない。
10. 現在のWork Itemが実際のAcceptance/gateを満たす前に、次のWork Itemへ進んだことにしない。

## 役割分担

### 司令塔 / Reviewer
- 原本・履歴・現行設計・実装を横断して正本を判定する。
- 再建全体の経緯・既決事項・現在位置を保持する。
- 最新ユーザー発言を既存計画と照合し、質問/懸念/提案/明示決定を区別する。
- 作業単位を `WORK-QUEUE.md` に切る。
- 各作業チャットへ依頼するための handoff を作る。
- PRをレビューし、正本適合・回帰・UXを確認する。
- 仕様変更が本当に必要な場合だけユーザー判断へ上げる。
- 設計資料完成と、実装/生成/実機レビュー完了を混同しない。

### Worker / SOL 作業チャット
- 指定された work item のみ実施する。
- 自分で仕様を拡張しない。
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

※ 1 の「ユーザーの明示決定」は、質問や懸念の表明まで自動的に含むものではない。明示的な変更意思・承認を確認する。

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

## チャット分岐ルール

以下のどれかに該当したら、Worker作業は新しいチャットへ分岐する。

- 1 work item が複数の大領域へ広がった
- 仕様判断が3件以上発生した
- 変更ファイルが概ね10ファイルを超える
- 同じ説明を繰り返し始めた
- Workerが原本/正本の優先順位に迷った
- PRレビューで根本方針の再確認が必要になった

分岐時は必ず `design/rebuild/HANDOFF-TEMPLATE.md` の形式で引き継ぐ。

司令塔チャットを交代する場合は、Worker handoffだけでは不十分。`design/rebuild/COMMANDER-HANDOFF.md` を読んで再建全体の状態を復元する。

## 禁止事項

- 「今のコードがこうだから」で仕様を決定する
- 既存UIを残したまま新UIを上に足す
- 過去レビュー文書をCURRENT正本として扱う
- CI PASSを仕様妥当性の証明にする
- 仕様不明を推測で埋める
- ユーザーの確認質問を新仕様として扱う
- 直近の会話だけを理由に承認済みPhase計画を再設計する
- 設計/プロンプト/レビュー資料だけで、実画像生成や実装が完了したと扱う
- mainへ直接大規模変更を入れる
