# W-209 バリデーション報告 — 238体 / identity / 進化 / 特殊形態

更新日: 2026-08-25  
Work Item: **W-209**  
状態: **RECONCILED / runtime未実装**

## 1. 目的

Phase 3 `W-209 — Active monster data-master reconciliation` として、No.001〜238の派生monster masterをCURRENT canonicalとexact FINAL-CORRECTEDへ再照合した結果を記録します。

この報告はruntime実装を意味しません。W-209はdata master reconciliationのみで、immutable baseline・`src/**`・runtime・他Work Item所有ファイルを変更しません。

## 2. 権威順序

判断は `REBUILD-START-HERE.md` / `design/rebuild/DECISION-LOG.md` に従い、概ね次の順序を使いました。

1. ユーザー明示決定
2. exact FINAL-CORRECTED baseline
3. 承認済み後続変更
4. CURRENT canonical
5. derived data master
6. runtime / review history

主な照合根拠:

- `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
- `design/current/09-MONSTER-MASTER-ART-SPEC.md`
- `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`
- `design/09-special-forms-master.md`
- `design/rebuild/PHASE-2-FINAL-REVIEW.md`
- `design/rebuild/PHASE-3-WORK-ITEMS.md`

## 3. 既知driftの再判定

旧検証には「No.001〜238について元 `families.mjs` との名前等の照合不一致0件」という記述がありましたが、表示名についてはそのままでは正確ではありませんでした。

W-209で確認したdisplay-name例外は次の2件です。

| speciesId | exact baseline | W-209前 derived master | 判定 | W-209後 |
|---|---|---|---|---|
| `m142` | カブトレクス | ヘラクレオン | **承認済み後続変更**。CURRENTを維持 | ヘラクレオン |
| `m236` | ホシラディア | ソラリオン | **未承認drift**。baselineへ戻す | ホシラディア |

結果:

- raw baselineとのdisplay-name直比較差: **1件**（m142、意図的・承認済み）
- authority precedence適用後の未承認display-name mismatch: **0件**
- m236のstable ID / F081 / Area4 / psychic / legend / single-stage / stats / descriptionは変更なし

つまり、m142をbaseline旧名へ戻すことも、m236のlater-data driftを残すことも、どちらも誤りです。

## 4. active master構造

7個の `13*monster-growth*.csv` をactive対象として確認しました。

| 項目 | 結果 |
|---|---:|
| active monster | 238 |
| stable ID範囲 | m001〜m238 |
| 欠番 | 0 |
| ID重複 | 0 |
| active系列 | 83 |
| Area1 | 54 |
| Area2 | 64 |
| Area3 | 65 |
| Area4 | 55 |
| No.239 active混入 | 0 |

No.239 `シラユキヒメ` はbaseline/referenceのみで、active data masterへ入れません。

## 5. m142 CURRENT決定の保持

`design/13c-monster-growth-area3-part1.csv` と `design/14c-evolution-balance-area3.csv` を確認しました。

- `m141 / カブトガル -> m142 / ヘラクレオン`
- method: `held_item_levelup`
- param: `barkarmor`
- `m142` stage 3 / final
- `burstEligible=true`

stable IDは `m142` のままで、CURRENT正式名 `ヘラクレオン` を維持しています。

## 6. 155進化リンク

`design/14a`〜`14d` と CURRENT canonical のactive transition contractを再照合しました。

| method | 件数 |
|---|---:|
| level | 123 |
| stone | 21 |
| held_item_levelup | 11 |
| **合計** | **155** |

Area別:

| area | links |
|---|---:|
| Area1 | 36 |
| Area2 | 42 |
| Area3 | 43 |
| Area4 | 34 |
| **合計** | **155** |

m236は `maxStage=1` の完成個体で進化リンクを持たないため、今回の名前補正によるリンク増減はありません。m142への進化リンクもCURRENT名のまま保持されています。

## 7. Giga / Burst stable-ID検証

正本 `design/09-special-forms-master.md` と派生monster masterのeligibilityを照合しました。

### Giga 12

`m003, m006, m009, m051, m054, m072, m090, m121, m153, m156, m159, m186`

### Burst 8

`m060, m066, m133, m136, m142, m165, m171, m174`

結果:

- Giga: **12**
- Burst: **8**
- overlap: **0**
- 全対象がm001〜m238内
- No.142は `m142 / ヘラクレオン / burstEligible=true`

対象判定は表示名ではなくstable species IDで維持します。

## 8. obsolete 14e の扱い

`design/14e-evolution-item-acquisition-master.csv` は32件の専用evolution trial初回クリアを進化アイテム取得源として記録した旧派生資料です。

しかしD-008および `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md` により、CURRENTの進化アイテム取得はbaseline探索ポイント方式へ戻されています。

したがってW-209では:

- 14eをCURRENT acquisition authorityへ昇格しない
- 14eを根拠に専用evolution trialをactive仕様へ戻さない
- monster identity / evolution transitionの照合と、item acquisition仕様を混同しない

と判定しました。

## 9. 変更内容

W-209で変更するdataは最小限です。

1. `design/13d-monster-growth-area4-part2.csv`
   - m236 family: `ソラリオン` -> `ホシラディア`
   - m236 name: `ソラリオン` -> `ホシラディア`
   - その他fieldは不変
2. `design/13-monster-growth-master-238.md`
   - W-209 authority-precedence reconciliationを反映
   - 旧「raw baseline name mismatch 0」の誤解を訂正
   - obsolete 14eをCURRENTへ再昇格しないことを明記
3. 本報告
   - W-209再検証結果へ更新

## 10. Acceptance結果

| Acceptance | 結果 |
|---|---|
| active IDs exactly m001〜m238 / 83 families | PASS |
| No.239 excluded active/reference only | PASS |
| identity follows authority precedence | PASS |
| m142 official `ヘラクレオン` preserved | PASS |
| m236 `ソラリオン` drift corrected to `ホシラディア` | PASS |
| all 155 evolution links remain valid | PASS |
| Giga12 / Burst8 stable IDs verified | PASS |
| obsolete 14e not re-promoted | PASS |
| demonstrably false zero-mismatch wording corrected | PASS |
| immutable baseline unchanged | PASS |
| runtime source unchanged | PASS |

## 11. 結論

W-209のactive monster data-master reconciliationは **PASS** です。

m236の未承認later-data driftだけをcanonical名へ戻し、m142の承認済みCURRENT名は保持しました。active 238 / 83系列、155進化リンク、Giga12 / Burst8のstable-ID契約に変更はありません。
