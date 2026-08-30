# ManaEvo 再建 — START HERE

更新日: 2026-08-29  
状態: **REBUILD / CANONICAL GOVERNANCE ENTRY**

この文書は、ManaEvo の再建・司令塔交代・正本同期を行うときの最上位入口です。
日々の製品仕様は `design/current/00-START-HERE.md` から読みますが、権威順位・復元手順・同期ルールは本書を先に適用します。

## 1. 目的

ManaEvo を、原本 `mana-evo-terra-FINAL-CORRECTED` から現在までの試行錯誤を整理し、承認された変更だけを残した一貫した学習RPGとして維持する。

完成後も「実装だけ進み、設計書が古くなる」状態へ戻さないことを、この再建の恒久的な成果に含める。

## 2. 正本順位

1. ユーザーの**明示決定**
2. 原本 `mana-evo-terra-FINAL-CORRECTED`
3. 原本以降の、承認根拠を確認できる変更
4. `design/current/` のCURRENT domain contracts
5. DATA MASTER / machine-readable companions
6. 現行runtime
7. tests / review / PR完了報告 / historical documents

重要:

- ユーザーの質問・懸念・提案は、自動的に「明示決定」へ昇格しない。
- runtimeに存在するだけでは仕様承認の証拠にならない。
- CI PASS、PR作成、merge、deployだけでも仕様承認の証拠にならない。
- 原本へ機械的に戻すのも、最新runtimeを機械的に正とするのも禁止する。

## 3. 最重要原則

1. PRODUCT → UX → GAME RULE → DATA MASTER → IMPLEMENTATION の順を守る。
2. 不明な仕様をWorkerが勝手に決めない。
3. 重要判断は `design/rebuild/DECISION-LOG.md` に残す。
4. 直近チャットや直近Work Itemだけで承認済み計画を上書きしない。
5. 設計・prompt・review資料の完成と、実装・画像生成・実機確認・deploy完了を混同しない。
6. Work Item番号、Workerの「完了」報告、PR、CIのいずれも、それ単独でAcceptance達成の証拠にしない。
7. 必須成果物を作る能力がないWorkerへ「完了まで」を任せない。早期に `BLOCKED CAPABILITY` として分業する。
8. 現在地は最大Work Item番号ではなく、**Acceptanceを満たした最後のgate**で判定する。
9. 同じ変動進捗を複数の恒久資料へコピーしない。
10. production host / deployment authorityのCURRENTはD-019に従い、**Vercel `https://mana-evo.vercel.app/` が唯一のproduction canonical**。GitHub Pagesをproduction canonicalとして復活させない。

## 4. 司令塔 / Reviewer 復元プロトコル

司令塔が交代しても、引き継ぎ文だけをプロジェクト記憶としてはいけない。新司令塔は新しい計画やWorker指示を出す前に、必ず次の順で復元する。

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/00-START-HERE.md`
4. 現在対象のPhase / plan文書
5. production `main` と、作業上必要なbase branchのHEAD
6. 関連するopen / merged PR・branch
7. 実際の成果物
8. Acceptanceが要求する実成果物と、その実在証拠
9. 必要に応じてCommander Review / Final Review
10. 最後に最新ユーザー発言を評価する

現在Work Itemが不明なら最新会話から推測しない。GitHub実状態を照合し、

- Acceptanceを満たした最後のgate
- まだ満たしていない最初のgate

を特定する。

司令塔は作戦を出す前に、最低限次を説明できなければならない。

- なぜこの作業をしているか
- 正本順位
- owning CURRENT contract
- 現在のproduction / phase / gate
- 実成果物が何か
- 何が設計だけで、何が実装・生成済みか
- 必要実行能力
- 既決事項 / 未決事項
- 最新発言が仕様変更なのか、確認・懸念なのか

説明できなければ、推測せず復元を続ける。

## 5. ユーザー発言の分類

仕様・scope・計画に関係する発言はまず次に分類する。

1. **質問 / 確認**
2. **懸念 / リスク指摘**
3. **提案 / 候補案**
4. **明示的な変更決定**

1〜3だけでは新しい正本決定にしない。CURRENT / DECISION-LOG /既承認事項と照合し、

- 既に対策済み
- 説明不足
- 実際の計画穴
- 新しい明示決定が必要

のどれかを判断する。

## 6. 恒久 Canonical Sync Gate

### 6.1 原則

**product behaviorを変えるPRは、そのPRの中で設計正本も更新する。**

後から別チャットが設計書を追いかけて直す運用を通常系にしない。実装と正本を同じchange setで扱う。

protected runtime / art pathを変更するPRでは、PR本文に必ず次を宣言する。

```text
Canonical-Impact: changed | none
Canonical-Domains: <domain,...>
Canonical-Reason: <理由>
```

machine-readable ownershipは `design/current/canonical-sync-map.json` を使用する。

### 6.2 `Canonical-Impact: changed`

製品契約が変わる場合は同じPRで、最低限次を変更する。

1. owning `design/current/**` contract
2. `design/rebuild/DECISION-LOG.md`
3. runtime / tests / derived data（必要な場合）

「コードを先にmergeして設計は後日」は禁止する。

### 6.3 `Canonical-Impact: none`

refactor、既存契約への単純適合、テスト強化等で製品契約が変わらない場合のみ使用できる。

- `Canonical-Reason:` に具体理由を書く。
- CIが通っても、Reviewerは本当にcontract changeがないか確認する。
- `none` を設計更新回避の抜け道に使わない。

### 6.4 CI drift guard

`.github/workflows/ci.yml` はPRで `scripts/verify-canonical-sync.mjs` を実行する。

CIは、protected path変更について次をfailさせる。

- Canonical impact宣言なし
- `changed`なのにowning CURRENT docが未更新
- `changed`なのにDecision Logが未更新
- `none`なのに具体理由なし

CIは人間の意味判断を完全自動化するものではない。目的は、**設計同期の判断自体を忘れられなくすること**である。

### 6.5 stateful companions

asset manifest、generated master、runtime allowlistなど、実状態を表すmachine-readable companionは、可能な限り自動生成/検証する。

- file existence ≠ approval
- production visibility ≠ FORMAL
- generated stateは承認意味を推測しない
- state companionがruntimeと矛盾した場合はdriftとして修正する

## 7. 役割

### 司令塔 / Reviewer

- 正本とGitHub実状態を横断して現在地を復元する。
- Workerへscope / Acceptance / owning docs / 必須成果物 / 必要能力を渡す。
- behavior change PRではCURRENT + Decision Logの同時更新を確認する。
- 実成果物の存在を確認する。
- 仕様変更が本当に必要な場合だけユーザー判断へ上げる。

### Worker / SOL

- 指定Work Itemのみ実施する。
- 着手時にowning CURRENT contractを読む。
- 必須能力がなければ `BLOCKED CAPABILITY`。
- product contractを変えたら、同じPRでCURRENT + Decision Logを更新する。
- product contractを変えていないなら `Canonical-Impact: none` と理由を明示する。
- scope外の再設計をしない。

## 8. CURRENT / historical / progress の分離

### CURRENT

日常実装の入口は `design/current/00-START-HERE.md`。

### Decision evidence

`design/rebuild/DECISION-LOG.md` は「なぜCURRENTが変わったか」を残す。

### Historical

以下は履歴・evidenceであり、現在進捗のライブ正本ではない。

- `design/rebuild/WORK-QUEUE.md`
- old Phase plans
- Commander Reviews
- Final Reviews
- old PR review docs

`WORK-QUEUE.md` に「現在W-xxx」を再び持たせない。

### Dynamic progress

現在地はGitHubから毎回復元する。

- production/main HEAD
- relevant branch / PR
- actual artifacts
- Acceptance / review gate

## 9. Release / production authority

現在の責務分離:

- **GitHub**: source / PR / CI
- **Vercel**: 唯一のproduction canonical + PR Preview
- **Supabase**: Auth / DB / Cloud Save

production canonical:

`https://mana-evo.vercel.app/`

Vercel Previewは検証環境でありcanonical URLではない。

## 10. チャット分岐

Workerは次の場合、新しいチャットへ分岐する。

- 1 Work Itemが複数大領域へ広がる
- 仕様判断が3件以上
- 変更ファイルが概ね10ファイル超
- 同じ説明を繰り返し始める
- 正本順位に迷う
- PRレビューで根本方針の再確認が必要

Worker分岐には `design/rebuild/HANDOFF-TEMPLATE.md` を使う。
司令塔交代はWorker handoffだけで済ませず、本書の復元プロトコルを実行する。

## 11. 禁止事項

- 「今のコードがそうだから」で仕様を決める
- 最新チャットだけで承認済み計画を変更する
- 設計資料を実成果物の代わりにする
- CI PASSを仕様承認にする
- 必要能力のないWorkerに作業を抱えさせ続ける
- 古いreview/Phase planをCURRENTとして読む
- 変動進捗を複数の恒久handoffへコピーする
- product behaviorを変更したのにCURRENTを更新しない
- `Canonical-Impact: none` を理由なく使用する
- 未承認proposalをCURRENTより上位へ置く
- GitHub Pagesをproduction canonicalへ戻す

## 12. 変更時チェック

PRをmerge可能と判断する前に、必ず確認する。

- [ ] owning CURRENTを読んだ
- [ ] ユーザー発言を正しく分類した
- [ ] product behavior change有無を宣言した
- [ ] changeありならCURRENT更新済み
- [ ] changeありならDecision Log更新済み
- [ ] tests/runtimeだけを正本にしていない
- [ ] 実成果物 / Acceptanceを確認した
- [ ] production authorityを誤認していない
- [ ] 未承認proposalをCURRENT化していない
