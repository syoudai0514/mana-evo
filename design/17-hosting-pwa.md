# ManaEvo 公開・PWA 正本設計

更新日: 2026-08-25

## 1. 正規公開先

ManaEvo の正規公開先は **GitHub Pages** とする。

- 正規URL: `https://syoudai0514.github.io/mana-evo/`
- 公開元: `main`
- デプロイ: `.github/workflows/pages.yml`
- Vite base: `/mana-evo/`
- Node.js: 24

Vercel は正規更新先として使用しない。既存のVercelプロジェクト/URLは過去版参照用として残り得るが、`vercel.json` の `git.deploymentEnabled: false` によりGit連携の自動Preview/Productionデプロイを停止する。以後、公開可否の判断はGitHub Pagesを基準にする。

## 2. GitHub Pages デプロイゲート

`main` push時に以下を順番に実行し、途中失敗時は公開しない。

1. `npm install`
2. `npm test`
3. `VITE_BASE_PATH=/mana-evo/ npm run build`
4. PWA成果物検証
5. Pages artifact upload
6. `actions/deploy-pages` で公開

PWA成果物検証では最低限以下を必須とする。

- `dist/index.html`
- `dist/manifest.webmanifest`
- `dist/sw.js`
- `dist/icons/icon-192.png`
- `dist/icons/icon-512.png`
- manifest の `id / start_url / scope` がすべて `/mana-evo/`
- 192px / 512pxアイコンのPNG実寸一致
- HTMLからmanifest / favicon / apple-touch-iconをPages配下で参照できること
- `apple-touch-icon` が実在する公開アセットを参照すること
- Service Workerのprecache対象がすべて実在すること

同じ検証のうち「参照先ファイルが実在すること」は通常の `npm test` にも含め、PRのCI段階で検出する。

## 3. PWA manifest

`public/manifest.webmanifest` を正本とする。

- `id`: `/mana-evo/`
- `start_url`: `/mana-evo/`
- `scope`: `/mana-evo/`
- `display`: `standalone`
- `orientation`: `portrait-primary`
- `short_name`: `マナエボ`

アイコン:

- 192x192 PNG
- 512x512 PNG
- 512x512 maskable

GitHub Pagesはサブパス配信のため、root `/` をPWA scopeにしてはならない。

## 4. iPhone / iPad

iOSではmanifestのアイコンだけに依存せず、`index.html` で `apple-touch-icon` を明示する。

- `apple-mobile-web-app-capable=yes`
- `apple-mobile-web-app-title=マナエボ`
- `apple-touch-icon`: `public/icons/icon-192.png`

専用180pxファイルを参照だけして実体を置かない構成は禁止する。2026-08-25にこの不整合でiOSの「ホーム画面に追加」が白アイコンになり、Service Workerのprecacheも失敗し得る状態になったため、実在する192px PNGへ統一した。

既にホーム画面へ追加済みの端末ではiOS側に旧アイコンがキャッシュされることがある。その場合はホーム画面の旧ショートカットを削除してPages版を再追加する。

## 5. Service Worker

`public/sw.js` を正本とする。

- キャッシュprefix: `manaevo-pwa-`
- 現行cache: `v5`
- install時にapp shell / manifest / 実在する主要アイコンだけをprecache
- activate時に旧ManaEvo cacheを削除
- navigation: network-first + offline fallback
- 同一originかつ `/mana-evo/` 配下のみ処理
- 静的アセット: network-first、失敗時cache fallback

登録側 `src/main.jsx` は `import.meta.env.BASE_URL` をscopeとして使用し、`updateViaCache: 'none'` と `registration.update()` を維持する。

## 6. 画面ナビゲーション

「ぼうけん」を押した場合は、学習の完了状態にかかわらず **必ず冒険マップを開く**。

- 学習未完了: マップ閲覧可、バトル開始不可
- 学習完了かつチケットあり: バトル開始可
- チケットなし: マップ閲覧可、追加チャレンジへの案内

「ぼうけん」入口から直接 `study` へ戻す実装は禁止する。学習ゲートはマップ内のバトル開始可否で一元管理する。

学習ハブでも下部ナビゲーションを表示し、ホーム・ぼうけん・モンスター・まなぶを相互移動できるようにする。

## 7. キャラ画像との分離

PWA/公開基盤と正式キャラ画像工程を分離する。

- 正式画像が存在するキャラ: `officialImageUrl` を優先表示
- 正式画像未配置: placeholderへフォールバック
- 存在しない正式画像URLを先に登録して404を量産しない
- 正式画像の追加・差し替えのためにPWA/Pages基盤を変更しない

No.001〜238の正式画像作業は別工程とし、本書の公開/PWA完了判定には含めない。

## 8. Supabase

現行ManaEvoは静的PWAとしてGitHub Pagesから配信する。今回の公開/PWA対応にSupabase migrationやEdge Functionsは不要。

Supabaseを将来導入する場合は、ゲームセーブ同期・認証等の要件を別設計として追加し、静的公開基盤の変更と混在させない。

## 9. 完了条件

画像工程を除く公開/PWA対応は、以下を満たした時点で完了とする。

- GitHub Pagesが有効
- mainからPages workflowで公開する構成
- `/mana-evo/` baseでbuild
- manifest / iOSアイコン / Service WorkerがPages subpath対応
- 通常CIでPWA参照先実在チェック成功
- CI test/build成功
- Pages成果物検証成功
- 「ぼうけん」で必ず冒険マップ表示
- Vercel Git自動デプロイ停止
- 正式画像の有無が公開/PWAを阻害しない
