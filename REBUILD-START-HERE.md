# ManaEvo 再建 — START HERE

更新日: 2026-08-29  
状態: **REBUILD / CANONICAL GOVERNANCE ENTRY**

この文書は、ManaEvo の再建・司令塔交代・正本同期を行うときの最上位入口です。
日々の製品仕様は `design/current/00-START-HERE.md` から読みますが、権威順位・復元手順・同期ルールは本書を先に適用します。

## 1. 目的

ManaEvo を、原本 `mana-evo-terra-FINAL-CORRECTED` から現在までの試行錯誤を整理し、承認された変更だけを残した一貫した学習RPGとして維持する。

完成後も「実装だけ進み、設計書が古くなる」状態へ戻さないことを、この再建の恒久的な成果に含める。

さらに、専門家向け正本だけでなく、IT初心者のオーナーが現在のゲーム仕様と変更理由を判断できる `design/current/USER-GUIDE.md` を恒久的に同期する。

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
- `design/current/USER-GUIDE.md` はオーナー向け翻訳companionであり、domain contractと衝突した場合はdomain contractを正として同じchange setでUSER-GUIDEを修正する。

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
11. product designを変更したら、専門設計だけでなくオーナー向け `design/current/USER-GUIDE.md` と変更説明も同期する。

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

現在Work Itemが不明なら最新会話から推測しない。GitHub実状態を照合し、Acceptanceを満たした最後のgateと、まだ満たしていない最初のgateを特定する。

## 5. ユーザー発言の分類

仕様・scope・計画に関係する発言はまず、質問 / 確認、懸念 / リスク指摘、提案 / 候補案、明示的な変更決定に分類する。質問・懸念・提案だけでは新しい正本決定にしない。

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
3. `design/current/USER-GUIDE.md` の該当するオーナー向け説明
4. runtime / tests / derived data（必要な場合）
5. ユーザーへの変更説明（これまで / 変更後 / 理由 / 子どもへの影響 / 守ること）

「コードを先にmergeして設計は後日」「専門設計だけ更新してオーナー説明は後日」は禁止する。

### 6.3 `Canonical-Impact: none`

refactor、既存契約への単純適合、テスト強化等で製品契約が変わらない場合のみ使用できる。`none` を設計更新回避の抜け道に使わない。

### 6.4 CI drift guard

`.github/workflows/ci.yml` はPRで `scripts/verify-canonical-sync.mjs` を実行する。CIは設計同期の判断自体を忘れられなくするためのguardであり、人間の意味判断を完全自動化するものではない。

### 6.5 オーナー向け設計同期 Gate

`design/current/USER-GUIDE.md` は恒久的なuser-facing CURRENT companionとする。

- 再建の最終releaseまでにゲーム全体を網羅する初回完全版を完成させる。
- それ以前でも、新たに変更した領域はそのproduct-change PRで更新する。
- release後も全product design changeで更新する。
- オーナーが内部ID、DB、関数名を理解しなくても判断できる文章にする。
- 技術的正確性を失わない範囲で、具体例・実際の子どもの体験を優先する。
- product design changeの完了報告では、USER-GUIDEの変更箇所をチャット上でも要約表示する。
- USER-GUIDE未同期のproduct design changeはmerge-readyにしない。

## 7. 役割

### 司令塔 / Reviewer

- 正本とGitHub実状態を横断して現在地を復元する。
- behavior change PRではCURRENT + Decision Log + USER-GUIDEの同時更新を確認する。
- 設計変更時、オーナーへ初心者向け変更説明を表示する。

### Worker / SOL

- 指定Work Itemのみ実施する。
- product contractを変えたら、同じPRでCURRENT + Decision Log + USER-GUIDEを更新する。
- scope外の再設計をしない。

## 8. CURRENT / historical / progress の分離

日常実装の入口は `design/current/00-START-HERE.md`。`design/current/USER-GUIDE.md` はオーナー向けCURRENT companion。`design/rebuild/DECISION-LOG.md` は「なぜCURRENTが変わったか」を残す。現在地はGitHub実状態から毎回復元する。

## 9. Release / production authority

GitHubはsource / PR / CI、Vercelは唯一のproduction canonical + PR Preview、SupabaseはAuth / DB / Cloud Saveを担当する。production canonicalは `https://mana-evo.vercel.app/`。

## 10. チャット分岐

Workerは大領域化、仕様判断増加、変更ファイル増加、正本順位への迷い等があれば新しいチャットへ分岐し、司令塔は本書の復元プロトコルを実行する。

## 11. 禁止事項

- 「今のコードがそうだから」で仕様を決める
- 最新チャットだけで承認済み計画を変更する
- 設計資料を実成果物の代わりにする
- product behaviorを変更したのにCURRENTを更新しない
- product designを変更したのにUSER-GUIDEとユーザー向け変更説明を更新しない
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
- [ ] changeありならUSER-GUIDE更新済み
- [ ] changeありならオーナーへ初心者向け変更内容を表示した
- [ ] tests/runtimeだけを正本にしていない
- [ ] 実成果物 / Acceptanceを確認した
- [ ] production authorityを誤認していない
- [ ] 未承認proposalをCURRENT化していない
