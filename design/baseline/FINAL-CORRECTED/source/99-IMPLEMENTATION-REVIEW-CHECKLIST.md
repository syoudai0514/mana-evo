# Terra実装後 — 実装再レビュー用チェックリスト

## P0 repository / 学習基盤

- [ ] 実装・commit・push先が `syoudai0514/mana-evo` のみ
- [ ] `syoudai0514/kids-quest` にcommit/push/PR/rename/settings変更がない
- [ ] Kids Quest source SHAとManaEvo destination SHAを記録
- [ ] 学習基盤のimport manifest（source path → ManaEvo path → 変更理由）がある
- [ ] 学習部分をゼロから独自再実装していない
- [ ] Kids Quest主要学習テスト相当がManaEvoでPASS
- [ ] knowledgeId/unitId/skillId/questionInstanceId等の安定IDを意図せず変更していない
- [ ] SRS/習熟/進級/学年戻し/英語/TTS等に意図しない差分がない

## 保存 / PWA分離

- [ ] ManaEvoが独立storage namespaceを使用
- [ ] ManaEvo操作後もKids Quest localStorage/IndexedDBが不変
- [ ] ManaEvo reset/deleteでKids Quest dataを消さない
- [ ] Kids Questから進捗を引き継ぐ場合はread-only one-way import
- [ ] importを複数回行っても重複しない
- [ ] Kids Quest `/kids-quest/` が従来どおり動く
- [ ] ManaEvo `/mana-evo/` が正常公開
- [ ] Service Worker scope/cache prefixが2アプリで衝突しない

## ゲーム状態

- [ ] 勝利確定時だけチケットが1枚減る
- [ ] 敗北・逃走・画面離脱で同じencounterIdが残る
- [ ] 捕獲成功/3投失敗後だけRESOLVEDになる
- [ ] 再読み込みでチケット二重消費が起きない
- [ ] 地域2〜4が直前地域ボス撃破でのみ順次解放される
- [ ] 地域ボス進行値が地域別に保存される
- [ ] 新地域は0pt/skill空集合
- [ ] 未解放地域の探索/野生/アイテムへアクセス不能
- [ ] 追加問題のチケット報酬に日次上限がない
- [ ] チケットは獲得日ごとに7日保持され、期限の近いロットから消費される
- [ ] 日付変更で全チケットが0にならない
- [ ] 簡単問題周回ではKids Quest由来の習熟ロジックにより難易度が適切に上がる
- [ ] 探索ポイント・天井が地域別に永続化される
- [ ] 6回目保証で地域の進化アイテムを選べる
- [ ] 捕獲演出が4星→輪完成
- [ ] 4回の物理的な揺れを必須にしていない
- [ ] 子ども向け主UIで%を主役にしていない
- [ ] まもる連打ができない
- [ ] ギガ/バーストでHP割合が正しく維持される
- [ ] 0HPが変身解除で1HPへ復活しない
- [ ] 同種2匹目以降で「なかま/おうえん」の選択が出る
- [ ] そだちのかけら3個=XP30
- [ ] 学習直後のレベルアップ/進化が即反映される
- [ ] 通常/レアの進化可能表示がUIに出る

## ブランド / キャラ

- [ ] 正式名称「マナエボ」/ 英字「ManaEvo」
- [ ] キャッチコピー「まなびが、進化になる。」
- [ ] 世界観導入「まなぶとマナが生まれる→冒険・育成・進化」が反映
- [ ] manifest/title/meta/README/base path/SW/cacheがManaEvo用
- [ ] monsterId/dexId等の安定IDを表示名都合で不要renameしていない
- [ ] 19系列23表示名の改名が正本・UI・図鑑に一致
- [ ] `monster-name-aliases.json` はManaEvo内の表示名互換にのみ使用
- [ ] ユーザー画面・新規コード・画像指示に外部作品固有名を残していない
- [ ] 今回の実装でマナ残高/新通貨を追加していない

## 最終公開

- [ ] mana-evo/mainへpush済み
- [ ] GitHub Pages `/mana-evo/` 公開成功
- [ ] Kids Quest repo/PWAに変更がないことを再確認
- [ ] 最終commit SHA / Kids Quest source SHA / 公開URL / test結果が報告されている
- [ ] 実装再レビュー用ZIPが作成されている
