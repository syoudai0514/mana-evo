# ManaEvo CURRENT — Dex Offline Art Pack + Detail Browsing UX V1

Status: **CURRENT CANONICAL — D-020**  
Date: 2026-08-31  
Scope: Dex No.001–238 FORMAL art local pack / Service Worker cache ownership / image request+decode budget / Dex detail navigation / browser history / scroll restoration  
Authority: explicit user decision + independent DESIGN PASS on PR #130 head `1636b953257fd95fb6d0451f466ca4bdba931fae`

This document is the CURRENT implementation authority for the Dex art-pack and continuous-detail-browsing change. Where older UI/PWA text conflicts with this document, D-020 and this contract control for this scope.

---

## 1. Product outcome

ManaEvo must make the completed No.001–238 FORMAL art set practical to browse on iPhone:

- a parent/device action can keep the complete current FORMAL set locally;
- warm cached art must not need a network round trip before display;
- normal Dex entry must not start 238 image requests;
- storing 238 compressed image files must not imply decoding/retaining 238 images in RAM;
- detail must expose `← まえ | ずかんへ | つぎ →`;
- previous/next follows the current filtered/search browse context;
- returning to Dex restores the same filters/search and visual position;
- Safari/PWA Back must behave consistently and must not leave orphan detail history entries.

No.239 is excluded from the active pack and active Dex denominator.

---

## 2. Canonical manifest

The active FORMAL art manifest for this feature contains exactly No.001–238 and exposes per asset:

- `speciesId`;
- active No.;
- canonical source URL;
- SHA-256 digest/revision;
- `byteLength`.

The manifest also exposes a manifest revision/digest and `totalBytes`.

The existing SHA-based monster asset identity is reused. Runtime must not make 238 HEAD requests merely to estimate size.

---

## 3. Cache ownership

### 3.1 One FORMAL art byte cache

Required cache ownership:

- app shell: `manaevo-shell-vN` or equivalent shell-owned versioned cache;
- current FORMAL monster bytes: **`manaevo-dex-art-v1`**.

`v1` is the cache schema version, not art-content version. FORMAL image revisions are represented by revisioned request keys inside the same schema cache.

A shell/Service Worker upgrade must not delete `manaevo-dex-art-v1` merely because the shell version changed.

Screen components must not create a second competing FORMAL-art CacheStorage. Service Worker, pack manager, and `MonsterArt` converge on the same FORMAL byte cache.

### 3.2 Revisioned cache key

A current asset is stored/read under an effective key equivalent to:

`/monsters/m123.webp?__manaevo_rev=<sha256>`

Species URL without revision is not sufficient currentness authority. Old/new revisions must not collide.

### 3.3 Warm Service Worker hot path

For a warm current FORMAL hit:

1. resolve expected revision from an in-worker memoized manifest/revision map;
2. construct exact revision key;
3. `manaevo-dex-art-v1.match(revisionKey)`;
4. return immediately on hit.

Forbidden per image cache hit:

- network fetch of the revision manifest;
- full `cache.keys()` enumeration;
- full art-cache prune.

Manifest refresh and obsolete-key prune are control-plane operations performed on worker/app update, explicit audit/update/repair, or known manifest revision change—not display hot path work.

---

## 4. Authoritative `238/238 保存済み`

`238/238` is never authoritative because a counter or metadata says so.

V1 authoritative truth is:

- one frozen target manifest snapshot;
- its 238 expected SHA revision keys;
- expected entries present in `manaevo-dex-art-v1`, where every writer of a current key uses the same verified-write path.

No legacy cache entry may be promoted into the current schema merely because species ID or URL matches.

### 4.1 Verified-write boundary

A target becomes complete only after:

`fetch bytes → actual SHA-256 → exact manifest SHA match → cache.put(current revision key) success`

Only then may progress increment.

Therefore:

- HTTP 200 alone is not completion;
- stale Service Worker fallback bytes cannot satisfy a new revision unless the actual hash matches;
- hash mismatch is never written under the current revision key;
- normal runtime cache-miss fill and explicit download-all use the same verification rule.

### 4.2 Crash/resume

If verified `cache.put` succeeds and the PWA is killed before UI progress changes, restart discovers that exact key and does not needlessly fetch it again.

If metadata says 238 but one expected key is gone, authoritative status is 237/238 / `不足あり`.

### 4.3 Manifest changes during download

At operation start freeze manifest N. Complete/audit against N, then fetch latest manifest once.

- latest=N → may show current `238/238`;
- latest=N+1 → do not call the pack fully current; calculate delta and show/update `更新あり`.

Do not chase a moving manifest per individual image.

---

## 5. Parent/device download UX

Large download management is Parent/device owned, not a primary child gameplay action.

Required controls/status:

- `モンスター画像を全部保存`;
- verified `x/238` progress;
- manifest `totalBytes` estimate;
- `更新する`;
- `不足分を修復`;
- `保存画像を削除` with confirmation.

Download scheduler:

- bounded concurrency; initial tuning default 4;
- cancellation supported;
- verified entries survive cancel/reload;
- resume requests missing/outdated keys only;
- never start 238 simultaneous image downloads;
- progress counts committed verified entries, not requests started.

Storage behavior on iPhone/Safari/PWA:

- `navigator.storage.estimate()` is advisory only;
- `navigator.storage.persist()` may be requested best-effort;
- actual write/QuotaExceeded failure is authoritative;
- do not promise permanent retention;
- eviction is a normal recoverable state.

---

## 6. Delta update

Given current manifest N and new N+1:

- unchanged SHA → zero image fetch;
- changed SHA → verified fetch/write of that image only;
- new active asset → verified fetch/write;
- removed/obsolete revision → cleanup at explicit maintenance boundary;
- No.239 remains excluded.

A one-image change must be capable of exactly one image network fetch; seven image changes exactly seven, with unchanged image fetches zero.

---

## 7. Normal Dex request/decode budget

Native `loading="lazy"` alone is not sufficient.

Use explicit viewport-aware eligibility (IntersectionObserver or equivalent windowing/virtualization). Active image source/decode work is limited to:

- visible tiles;
- approximately 2–3 viewport heights of overscan;
- explicit detail/prefetch neighborhood.

Other tiles keep fixed-size placeholders without starting image resolution.

Grid art geometry remains stable before decode so late image readiness does not shift the list enough to break scroll restoration.

### Detail prefetch/decode

Default neighborhood:

- current species: high priority;
- previous 2 browsable species;
- next 2 browsable species.

Persistent bytes may cover all 238, but decoded/mounted image/object-URL lifetime must remain bounded to viewport + nearby detail neighborhood. Visiting more species must not retain one decoded resource per lifetime visit.

Loading state is explicit. A retryable load/decode error must not look like an unexplained permanent gray rectangle.

---

## 8. Detail navigation

Detail always exposes:

`← まえ   |   ずかんへ   |   つぎ →`

A browse context includes at least:

- `contextId`;
- area/type/search;
- filter panel state;
- ordered currently browsable species IDs;
- selected species/index;
- grid anchor species ID;
- anchor viewport offset.

Previous/next traverses this result order. Unknown/unopenable species are excluded. At the first/last entry, the corresponding control is disabled; no wrap in V1.

If detail was entered without an existing Dex grid context (for example a Capture/Evolution shortcut), construct the deterministic default context of currently browsable/seen species ordered by No.

---

## 9. Browser History contract

V1 uses the platform History API; React Router is not required.

### 9.1 Grid → Detail / Detail → Detail

- Grid → first detail: `history.pushState(detailState, ...)`;
- previous/next inside detail: `history.replaceState(updatedDetailState, ...)`.

Previous/next must not create a browser-history step for every species.

Detail state stores explicit provenance such as `hasGridHistoryEntry`; implementation must not infer origin from `history.length`.

The same browse context is mirrored into versioned `sessionStorage` for same-tab iOS/WebKit remount recovery. It is not cloud/profile gameplay state.

### 9.2 Normal visible `ずかんへ`

When detail was opened from a valid preceding Dex Grid entry:

`ずかんへ → history.back() → popstate → restoreDexContext()`

It is forbidden to switch React UI directly to Grid while leaving the current detail entry in history.

Mandatory sequence:

`Grid G → A → Next B → ずかんへ → Grid G → C → Safari Back once → Grid G`

Returning to B is a failure.

### 9.3 External/no-grid detail fallback

If detail has no valid preceding Dex Grid history entry:

1. build the deterministic default Dex context;
2. `history.replaceState(gridState, ...)` on the current entry;
3. invoke the same `restoreDexContext()`;
4. do not consume unrelated browser history.

### 9.4 One restore routine

Both visible-return and browser/PWA Back converge on one restore semantics:

1. restore area/type/search/filter UI state;
2. recompute/confirm ordered result list;
3. render fixed-geometry grid;
4. locate saved anchor species;
5. position anchor;
6. apply saved viewport-offset correction;
7. restore meaningful focus without causing another disruptive scroll.

During the Dex grid/detail interval, the app owns browser scroll restoration using `history.scrollRestoration = 'manual'` where supported and restores the previous value when leaving that interval.

If saved context is invalid/stale, fall back deterministically to selected species if available, nearest valid result, or top of Dex; do not trap the user in detail.

---

## 10. Performance invariants

Release-conformant implementation must demonstrate:

- warm current cache hit has no network dependency;
- manifest network fetch count does not scale with rendered image count;
- art-cache `cache.keys()` full enumeration does not scale with rendered image count;
- normal first Dex entry does not start 238 image requests;
- decoded/mounted resources stay bounded by viewport/prefetch policy;
- previous/next does not repeatedly download unchanged bytes;
- completed pack renders all 238 current FORMAL images with network disabled.

No fixed millisecond SLA is declared until target-device measurement exists, but pathological work proportional to all 238 renders is a release blocker.

---

## 11. Failure/recovery

- Network loss during download: keep verified entries; resume missing current keys only.
- One-entry eviction: downgrade from 238/238 and repair only missing/outdated entry.
- Full art-cache eviction: 0/238 until repaired; normal online browsing still works on demand.
- Stale metadata cannot override cache truth.
- Hash mismatch never commits as current.
- Decode/load errors are retryable and do not loop forever.
- Manifest change mid-operation is resolved by frozen target + final latest-manifest verification.

---

## 12. Cross-document authority

Detailed release acceptance is `design/current/10A-DEX-OFFLINE-ART-PACK-ACCEPTANCE.md`.

D-020 is recorded in `design/rebuild/DECISION-LOG.md`.

Owner-facing explanation is `design/current/USER-GUIDE.md`.

For this scope this document is a later approved CURRENT refinement of the generic Dex section in `06-UI-SCREEN-CONTRACT.md` and FORMAL-cache section in `07-SAVE-PROFILES-PARENT-PWA.md`; it does not alter unrelated game rules.