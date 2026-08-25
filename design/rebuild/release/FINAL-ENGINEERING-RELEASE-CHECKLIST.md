# ManaEvo Phase 3 Final Engineering — Release Checklist

Work Item: **W-220**  
Branch: `rebuild/w-220-release-pwa-dead-path-cleanup`  
PR base: `rebuild/canonical-governance`  
Canonical: `design/current/07-SAVE-PROFILES-PARENT-PWA.md`, `design/current/06-UI-SCREEN-CONTRACT.md`

## Engineering release gate

| Gate | Status | Evidence |
|---|---|---|
| Full `npm test` | PENDING | GitHub Actions CI on the W-220 PR will run the complete Node test suite. |
| Production build with `VITE_BASE_PATH=/mana-evo/` | PENDING | GitHub Actions CI builds with the canonical Pages base path. |
| Release artifact verification | PENDING | `npm run verify:release` validates built base-path references, install assets, PWA scope/cache isolation, deep-entry fallback, art revision inventory, and production import reachability. |
| iPhone WebKit E2E | PENDING | CI runs all WebKit tests, including W-220 PWA install/offline persistence smoke. |
| Save migration / backup safety | PENDING | Existing `tests/platform-persistence.test.js` remains in the full suite: profile isolation, deterministic legacy migration, invalid-import non-destructive behavior, and read-only/idempotent Kids Quest import. |
| GitHub Pages deep-entry recovery | PASS | `public/404.html` redirects only paths already inside `/mana-evo/` to the canonical app root while preserving query/hash; it contains no Kids Quest route. |
| Service-worker isolation | PASS | `public/sw.js` only handles `BASE_PATH`, only deletes `manaevo-pwa-*` caches, and contains no `/kids-quest/` handling. |
| Heavy voice/model install precache | PASS | SW `APP_SHELL` contains only root/manifest/revision metadata/icons; release verifier rejects Piper/ONNX/WASM/model entries in the install shell. |
| Monster-art update identity | PASS | `monster-asset-revisions.json` is generated from CURRENT art state; only `FORMAL` entries receive content-hash revisions. Old candidate/revision bytes are pruned only after current FORMAL bytes are successfully cached. |
| Dead production path cleanup | PASS | Production import graph starts at `src/main.jsx`; `src/game/manaevo-monsters-v1.webp` is unreachable and removed. `monsterSprite.js` + `manaevo-monsters-v3.webp` remain reachable for legacy saved-ID compatibility. |
| Kids Quest non-interference | PASS | `src/kids-quest-study/**` is retained; W-220 makes no Kids Quest storage/cache deletion or product-behavior change. |

## PWA / Pages contract

- Canonical production URL: `https://syoudai0514.github.io/mana-evo/`
- Canonical Pages base: `/mana-evo/`
- Manifest `id`, `start_url`, `scope`: canonical URL above
- Service worker registration: `${BASE_URL}sw.js` with scope `${BASE_URL}` and `updateViaCache: 'none'`
- SW cache prefix: `manaevo-pwa-`
- First-install shell: app entry, manifest, revision metadata, 192/512/touch icons, and entry JS/CSS discovered from built HTML
- Navigation strategy: network-first with cached app-root fallback for offline continuity
- Monster assets: FORMAL content-revision cache; non-FORMAL network-first; previous valid revision retained for offline fallback until a new revision is successfully cached
- Initial unknown/deep Pages path: shipped `404.html` returns the user to `/mana-evo/`; it does not redirect unrelated paths

## Save / migration contract retained

W-220 does not change save schemas, storage keys, profile ownership, backup/import implementation, or Kids Quest learning migration code. The release gate keeps the existing persistence tests mandatory rather than replacing them with source-string assertions.

## Monster asset status — CURRENT, not inferred from files

`design/current/monster-asset-manifest.json` is authoritative for approval state.

| State | Count | Release interpretation |
|---|---:|---|
| FORMAL | **0** | No active monster art is approved FORMAL yet. Do not represent candidates as released formal art. |
| CANDIDATE | **20** | m001–m020 remain review candidates only. |
| PLACEHOLDER | **218** | m021–m238 remain placeholder/production-needed. |

**Asset stream status: BLOCKED outside W-220 engineering scope.** Formal monster-art production/review remains a parallel release stream. Engineering PWA behavior is revision-ready, but this checklist does not convert any candidate or placeholder to FORMAL.

## Dead-path inventory decision

Removed only:

- `src/game/manaevo-monsters-v1.webp` — superseded source sprite, not reachable from the production entrypoint. No static import points to it.

Retained intentionally:

- `src/game/monsterSprite.js`
- `src/game/manaevo-monsters-v3.webp`

These remain part of the production graph because `MonsterArt` retains legacy saved-ID compatibility. Removing them would violate save compatibility even though active m001–m238 monsters do not use the legacy sprite as their art source.

## Final CI evidence

This section will be updated after the W-220 PR CI completes. No PASS will be claimed for test/build/WebKit gates until the branch result exists.
