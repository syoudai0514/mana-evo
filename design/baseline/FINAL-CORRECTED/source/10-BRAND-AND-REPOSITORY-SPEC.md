# マナエボ ブランド・repository分離仕様

## 1. ブランド正本

| 用途 | 固定値 |
|---|---|
| 正式名称 | **マナエボ** |
| 英字表記 | **ManaEvo** |
| GitHub repository | **`syoudai0514/mana-evo`** |
| キャッチコピー | **まなびが、進化になる。** |
| 世界観の核 | **まなぶと「マナ」が生まれる。マナの力で冒険し、仲間を育て、進化させよう。** |
| 新規camelCase | `manaEvo` |
| 新規定数prefix | `MANA_EVO` |

`MANABI × EVOLUTION` をブランドの意味の核とする。モンスターだけではなく、学習・冒険・育成・将来拡張を「学ぶことで自分も、仲間も、ゲーム世界も進化する」で包む。

## 2. repository正本

| 役割 | repository | 権限 |
|---|---|---|
| 既存Kids Quest | `syoudai0514/kids-quest` | **read-only参照** |
| ManaEvo実装先 | `syoudai0514/mana-evo` | **唯一のwrite/push先** |

- 2つは別repo・別アプリとして共存する。
- `kids-quest` のrename/archive/deleteは禁止。
- Kids QuestのPages `/kids-quest/` を変更しない。
- ManaEvoは `/mana-evo/` に独立公開する。
- Kids Questから必要なコード/data/assets/testsをManaEvoへ**コピー**する。source側を変更しない。

## 3. 表示ルール

- 日本語UIのプロダクト名は **マナエボ**。
- 英字ロゴ/metadataは **ManaEvo**。`Mana Evo` / `MANAEVO` / `Mana-Evo` を勝手に増やさない。
- キャッチコピーは **「まなびが、進化になる。」** を正本とする。
- ManaEvoのユーザー画面にはKids Questブランドを残さない。ただし技術的なsource attribution/import manifestでは記載可。
- 「マナ」は学習によって生まれる物語上の力。今回 `mana` 残高・新通貨を追加せず、既存XP/チケット/探索ptをrenameしない。

## 4. 世界観の導入文

ホーム/初回導入では次の2文を正本にする。

> まなぶと「マナ」が生まれる。  
> マナの力で冒険し、仲間を育て、進化させよう。

## 5. ManaEvo PWA / Web表示

Terraは `mana-evo` 内で実在する構成を調査し、必要なものを設定する。

- `<title>` / document title
- manifest `name`, `short_name`, `start_url`, `scope`, `id`
- Apple/PWA meta
- description / OG / Twitter metadata
- favicon / icon / splash
- PWA install UI
- onboarding / home / settings / about / error / offline page
- README
- export/import/backupの表示名・ファイル名
- package metadata

ManaEvoは新しい独立アプリなので、manifest `id` も**Kids Questと衝突しないManaEvo固有値**にする。

## 6. GitHub Pages / base path

ManaEvo正規URL: `https://syoudai0514.github.io/mana-evo/`

ManaEvo側だけで次を確認する。

- build base
- router basename
- asset URL
- manifest start_url/scope/id
- service worker registration URL/scope
- offline fallback
- dynamic import
- icon/font/audio/image path

**Kids Quest `/kids-quest/` は既存のまま。redirectしない・置き換えない・停止しない。**

## 7. 保存データ分離

最重要。別アプリなので、通常運用で保存状態を共有しない。

- ManaEvo write namespaceは `mana-evo:*` 等の固有prefix。
- Kids QuestのlocalStorage/IndexedDBはread-only。
- ManaEvo reset/deleteでKids Quest dataを消さない。
- ManaEvoのCache Storage名は固有prefixを使う。
- SW scopeは `/mana-evo/` に限定。
- origin全体のcache/localStorageを一括削除しない。

Kids Quest既存学習進捗の引き継ぎは `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` の一方向importに従う。

## 8. キャラ改名

今回の改名はManaEvo display nameの変更。

- `monsterId`, `dexId`, familyId等の安定IDは維持。
- 旧ManaEvo設計/saveで名前をkeyにしている場合は `scripts/monster-name-aliases.json` で移行。
- Kids Quest旧monster名とManaEvo新monster体系を機械的に同一視しない。

## 9. Service Worker / Cache共存

- Kids Quest `/kids-quest/` scopeとManaEvo `/mana-evo/` scopeを分離。
- ManaEvo cache cleanupはManaEvo所有cacheだけ。
- Kids Quest cacheを削除しない。
- オフライン起動、更新直後、両アプリを別タブで開くケースを確認。

## 10. 受入条件

- [ ] UI正式名称がマナエボ
- [ ] 英字表記がManaEvo
- [ ] キャッチコピーが完全一致
- [ ] 世界観導入2文が反映
- [ ] 実装先が `syoudai0514/mana-evo`
- [ ] `syoudai0514/kids-quest` に変更がない
- [ ] Pages `/mana-evo/` が正常
- [ ] Kids Quest `/kids-quest/` も従来どおり維持
- [ ] PWA install/offline/update正常
- [ ] storage/cache/SWがKids Questと分離
- [ ] 必要なKids Quest進捗importがread-only one-wayで安全
- [ ] 改名キャラもManaEvo内で同一個体として保持
- [ ] ManaEvoユーザー画面に旧ブランド残存なし
