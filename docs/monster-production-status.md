# ManaEvo 238体 Monster Art / Master 現在状況

最終更新: **2026-08-31 JST**

この文書は、旧PR #15時点の進捗メモを置き換えた**現在状況の入口**です。詳細な恒久ルールは各設計書・runbookを参照してください。ライブ状態の正本は `design/current/monster-asset-manifest.json` と現在のGitHub/Productionです。

## 現在の結論

Monster Artの全体制作・最終closeoutは完了しています。

| 項目 | 現在状態 |
|---|---|
| Active species | `m001`〜`m238` = 238 |
| Excluded | `m239` |
| FORMAL | **238** |
| CANDIDATE | **0** |
| PLACEHOLDER | **0** |
| Final closeout PR | **#128** |
| main merge commit | `bc78609097fc1f486d26d6703f127fdaf235188d` |
| closeout tests | **290/290 PASS** |
| Vite production build | **PASS** |
| Production | `https://mana-evo.vercel.app/` |
| Production revision endpoint | `https://mana-evo.vercel.app/monster-asset-revisions.json` |

2026-08-31のcloseoutではProductionのトップとrevision endpointがHTTP 200で応答し、`m001`〜`m238`がFORMALとして配信されていることまで確認済みです。

> テスト件数290は2026-08-31時点の証跡です。今後テストが増えた場合に「290固定」をAcceptanceにしないでください。将来はCURRENT test suiteの0 failureを基準にします。

## 正本

Monster Art / releaseについては次を使います。

- 現在のasset state: `design/current/monster-asset-manifest.json`
- Production revision出力: `public/monster-asset-revisions.json`
- 最終引き継ぎ: `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- 今後の差し替え手順: `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- 実務Tips/事故パターン: `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`
- Global style: `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
- GitHub binary handoff: `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`
- Candidate/Formal tooling reference: `design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md`
- Provenance/history: `design/rebuild/asset-production/candidate-provenance/`, `candidate-history/`

Monsterの名前・属性・進化・ゲームルール等はMonster Artの進捗文書ではなく、`design/current/` および各CURRENT masterを正として復元してください。

## Final closeout 7体

最後にcloseoutした対象:

- `m160`
- `m161`
- `m162`
- `m220`
- `m221`
- `m229`
- `m235`

現在FORMAL SHA-256:

| Species | SHA-256 |
|---|---|
| m160 | `8e209040b40af68324d54e8511d43efb0f996af0f553989153c17160b88819c9` |
| m161 | `7fc318aa263c7ccb07fc4262d0d961abc66f6b5f70f4030dddb4fc33e814da4b` |
| m162 | `8349198cdec027846821fc70695b1a46cab28edf68c69c9801c80cc0a04c94e0` |
| m220 | `6eb0e4992962f9621ff693beebfc73ed6493b075cd5c1b6f1600a5809fd1e8ee` |
| m221 | `dd4fe5c364b5688e84ad5329c514c0c339003fe48a186085d834d576d9398610` |
| m229 | `5af990a01171f779018d46c17739b607109e08cd8bef12b35248134d7d94fafa` |
| m235 | `df07f6d99ab1ed33c4f7cb0fcc668b0254443c10405fb769f03682b87e728991` |

Final registration bundle:

- `ManaEvo-FINAL-CLOSEOUT-last7-registration-ready(1).zip`
- bytes: `1,342,297`
- SHA-256: `0911fb5320d175e9c35e40468c9262d54b715f4cf4fe2ef246f8f79ce5686904`
- actual binary validation: 7/7 PASS (`512×512`, RIFF/WEBP, actual alpha, bytes/SHA manifest一致)

## 重要な経緯

### 1. FORMAL漏れ40体

途中で画像制作がほぼ完了していても、registryは一時:

- FORMAL 198
- CANDIDATE 4
- PLACEHOLDER 36

でした。

画像が存在することとFORMAL承認は別です。最終closeoutで残り40体を含めて正式化し、現在は **238 / 0 / 0** です。

以後、全体releaseの完了条件には必ず以下を含めます。

1. 238 active species確認 / m239除外
2. 画像QA
3. FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0
4. 238 FORMAL revision確認
5. tests/build
6. main merge
7. Production deploy
8. live revision endpoint確認

### 2. m235

`m235`のauthoritative identityは:

- F080
- `ユグドラシア`
- type `くさ`
- concept `世界樹`
- stage 1 of 1

です。**世界樹そのものがm235**です。

旧画像の小さな前景characterをm235と誤認すると、鹿/狐/狼/四足獣などの「木属性の動物」に再解釈される事故が起きます。m235はanimal化しません。最終採用品は「一体の生命体として成立するmonsterized world-tree」です。

### 3. m160

N1A handoffの一版ではactual `m160.webp`が1024×1024で、512×512契約を満たしていませんでした。登録を停止し、最終版でexact 512×512へnormalizationしました。

今後はproducer/consumer両方で**final WebP actual decode後の寸法**を検証します。

## 現在の運用モード

238体一括生成・全体再監査フェーズは終了です。

今後は原則として:

**ゲーム中・実画像レビューで具体的な不具合が見つかったspeciesだけをtargeted maintenanceする**

運用へ移行します。

一括regenや「heuristicで少し気になる」だけの全体修正は行いません。過去のglobal auditで `m042`, `m057`, `m136`, `m202`, `m213` はapproved exceptionとして受理されています。新しいactual defectまたは明示的なdesign変更がない限り、自動修正対象に戻しません。

## 将来の画像差し替えゲート

状態を混同しないでください。

`GENERATED/REPAIRED`
→ `VISUAL QA`
→ `ART READY`
→ `REGISTERED`
→ `FORMAL`
→ `MAIN`
→ `DEPLOYED`
→ `LIVE VERIFIED`

「画像ができた」「PRがmergeされた」「Vercelがdeployされた」は、それぞれ別の完了点です。

詳細は `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md` を参照してください。

## 旧文書について

2026-08-24時点の旧版には、PR #15、Monster master未投入、画像registry未投入、旧CI failure等が記載されていました。それらは**当時の履歴**であり、現在状態ではありません。

過去のPR/commitから経緯を調べる場合のみ旧履歴を参照し、現在進捗の判断にはこの文書・CURRENT manifest・GitHub main・Production実状態を使ってください。
