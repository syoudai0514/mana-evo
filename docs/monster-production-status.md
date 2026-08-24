# ManaEvo 238体 正式化進捗

最終更新: 2026-08-24 11:05 JST
作業ブランチ: `chatgpt/monster-master-238`

## 今回のゴール

- No.001〜No.238 を正式モンスターIDとして一元管理する。
- 名前・属性・進化系列・HP・こうげき・ぼうぎょ・すばやさ・レベル成長・進化条件・出現・捕獲をゲームロジックへ接続する。
- 正式画像が完成済みのキャラは正式画像、未完成のキャラは仮画像を使う。画像待ちで育成・進化を止めない。
- 既存セーブの旧speciesIdを正式IDへmigrationする。
- Kids Quest由来の学習部分は変更しない。
- PR Previewには `?qa=monster-master` の専用QA状態を用意し、全基礎キャラ取得・全進化遷移の条件達成・必要進化アイテム所持済みで確認できるようにする。

## 正本

- キャラ台帳: ManaEvo asset workbook `monster_master.json/csv`
- バトル/育成: `06-battle-and-progression-design.md`
- 設計レビュー基準: `MANA-EVO-CANONICAL-REVIEW-BASELINE-20260823.md` / PR #5設計書基準レビュー
- 有効範囲: No.001〜238。No.239は元資料に保全するが現行ゲームでは有効化しない。

## 進捗

| 工程 | 状態 | 進捗 |
|---|---|---:|
| 0. 作業ブランチ・進捗台帳 | ✅ 完了 | 100% |
| 1. 正本資料回収・差分整理 | ✅ 完了 | 100% |
| 2. No.001〜238 正式マスター生成 | ✅ 生成・検証済み | 238 / 238 |
| 3. 正式画像/仮画像アセット登録 | 🟡 投入中 | 正式 30 / 238、残りはplaceholder |
| 4. 画面・バトル・図鑑のマスター接続 | 🟡 投入中 | 正式master接続へ置換中 |
| 5. レベル成長・進化ロジック接続 | ✅ 実装準備済み | 155進化遷移 / 3方式 |
| 6. 既存セーブ migration | ✅ 実装準備済み | legacy 19 species → canonical ID |
| 7. 238体 validator / 回帰テスト | 🟡 追加中 | 238連番・進化・能力非減少・画像registry |
| 8. PR QA Preview | 🟡 追加中 | `?qa=monster-master` |
| 9. main merge / Production公開 | ⬜ Preview/CI後 | 0% |

## 238体マスターの実装ルール

- 正式ID: `m001`〜`m238`
- 18タイプ対応。v1キャラは単タイプ。
- 種族値は `stage × rarity × role` の正本ルールから算出し、進化で各能力が下がらないことをvalidatorで保証する。
- Lv能力値: HP=`floor(base*Lv/50)+Lv+10`、その他=`floor(base*Lv/50)+5`。
- XP累計: `round(6*(Lv-1)^1.9)`。
- 通常進化: `level / stone / held_item_level` の3方式。
- ギガシンカ12体・キョダイバースト8体は正本割当をmasterへ保持。所有権は永久・種族別。
- 正式画像は `public/monsters/formal/mNNN.webp`。No.001〜030を今回接続し、No.031〜238は画像完成までplaceholder。

## QA Preview

`?qa=monster-master` で通常セーブとは別のQAセーブを使用する。

- 全83基礎種(stage 1)を取得済みにする。
- さらに各進化遷移を単独確認できるよう、全「進化前」種をBOXへ用意する。
- レベル進化は必要Lv到達済み。
- いし進化は全進化石を99個所持。
- もちもの+Lvアップ進化は必要品を装備し、Lvアップ条件成立済み。
- 全ステージ開放、捕獲用「わ」各99、チケット99。
- 正式画像30体とplaceholder残208体を同じmasterで確認できる。

## 次のゲート

1. 238体master・進化engine・migration・No.001〜030正式WebP・QA Previewを同じPRへ投入。
2. GitHub CI（test / audit / build）成功。
3. Vercel Preview READYを確認し、QA URLで画像アセットHTTP 200と画面起動を確認。
4. 問題なければPRをmainへmerge。
5. Vercel Production READY / `mana-evo.vercel.app` を確認して完了。
