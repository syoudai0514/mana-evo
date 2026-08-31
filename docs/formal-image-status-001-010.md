# No.001〜010 仮正式画像 v1 — HISTORICAL NOTE

Status: **HISTORICAL / DO NOT USE AS CURRENT STATE**

この文書は2026-08-25の初期実機確認フェーズの記録です。当時は `0822まとめ(2).zip` 内のエリア1正本 `E06AD93B-33A6-4C31-AFB8-F6775B91DE5F.PNG` からNo.001〜010を切り出し、仮正式v1として投入していました。

2026-08-31のMonster Art final closeout後、この「仮正式v1 / 128×128 runtime QA版を先行投入」という状態は**現在状態ではありません**。

現在の正本:

- active species: `m001-m238`
- excluded: `m239`
- FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0
- per-ID runtime art: `public/monsters/mNNN.webp`
- authoritative state: `design/current/monster-asset-manifest.json`
- runtime revision: `public/monster-asset-revisions.json`
- current status: `docs/monster-production-status.md`
- final handoff: `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`

以下は**当時の履歴**としてのみ残します。

## 2026-08-25対象

- No.001 m001 モコハ
- No.002 m002 ワカバネ
- No.003 m003 ジュランガ
- No.004 m004 ヒノポ
- No.005 m005 メラガミ
- No.006 m006 グレンドウ
- No.007 m007 シズク
- No.008 m008 ミナモリ
- No.009 m009 ワダツラ
- No.010 m010 ポフィ

## 当時のアセット方針

当時は:

- 原画のキャラクターデザインを変更せず切り出す;
- 512×512・透過WebPマスターを保持する;
- GitHub Pages実機確認を急ぐため `public/monsters/m001.webp`〜`m010.webp` に128×128 runtime QA版を先行投入する;
- 実機確認後に同じパスへ512×512 masterまたは再生成v2を差し替える;
- m239は対象外;

という暫定運用でした。

現在のfinal per-ID contractは `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md` と `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md` を参照してください。現在のFORMAL画像をこの旧128×128/仮正式運用へ戻してはいけません。
