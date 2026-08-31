# ManaEvo Design Review Proposal — Dex Offline Art Pack + Detail Browsing UX V1

- Status: **DESIGN REVIEW ONLY — NOT CURRENT / NOT IMPLEMENTATION AUTHORITY**
- Revision: **V1 review revision 2 — addresses first independent review blockers**
- Date: 2026-08-31
- Repository: `syoudai0514/mana-evo`
- Base at proposal start: `main@bc78609097fc1f486d26d6703f127fdaf235188d`
- Proposed canonical domains after approval: UI / PWA / Acceptance / Monster Art presentation
- Runtime changes in this PR: **none**

## 0. Why this proposal exists

All active monster art is FORMAL for No.001–238, but the current Dex experience still has four user-visible problems:

1. grid/detail images can feel slow or blank while fetch/decode is happening;
2. detail has no continuous previous/next browsing;
3. returning from detail can lose the original grid position;
4. there is no explicit user action to keep the complete current FORMAL set locally for fast/offline browsing.

The first independent review accepted the product direction but blocked implementation until four technical contracts were fixed:

- one cache owner / Service Worker hot path;
- authoritative SHA-verified 238/238 completion;
- concrete History API / browser-back behavior;
- exhaustive acceptance proving offline, resume, delta, eviction and bounded-memory behavior.

This revision fixes those four points in the design. It still does not authorize implementation.

---

# 1. Product goals and non-goals

## Goals

### G1 — Warm browsing should feel instant

If the current FORMAL bytes are already stored locally, reopening a tile/detail or moving to nearby species must not require another network round-trip before those bytes can be shown.

### G2 — Explicit full download

A user can explicitly download exactly the current active FORMAL No.001–238 art set for offline use.

### G3 — Continuous detail browsing

Detail exposes visible `← まえ | ずかんへ | つぎ →` controls. Previous/next follows the current browse result order.

### G4 — Exact browse-context restoration

Returning to Dex restores filters/search and the original visual position using an anchor species + viewport offset, not just raw `scrollY`.

### G5 — Delta-safe art updates

One changed FORMAL image normally causes one image fetch; seven changes cause seven. Unchanged current assets are not fetched again.

### G6 — Bounded decoded memory

The complete byte pack may exist in CacheStorage, but decoded image lifetime is limited to the visible/near-visible/detail neighborhood. Visiting more species must not cause decoded-memory retention proportional to lifetime visit count.

## Non-goals

V1 does not:

- change monster identity/data/FORMAL approval;
- include No.239;
- guarantee iOS/Safari retains CacheStorage forever;
- auto-download the large pack without explicit user action;
- decode all 238 images at once;
- introduce React Router only for Dex;
- make gameplay depend on the pack being installed.

---

# 2. Canonical asset manifest contract

The target set is exactly No.001–238, FORMAL only, No.239 excluded.

The build-generated authoritative art manifest must expose, per active asset:

- `speciesId`
- active No.
- canonical source URL
- SHA-256 revision/digest
- `byteLength`

It must also expose a manifest revision/digest and `totalBytes` for the 238 active assets.

The existing SHA-based monster revision data should be reused rather than inventing a second unrelated version system.

`byteLength` and `totalBytes` are generated at build/asset-registration time. The runtime must not perform 238 HEAD requests merely to estimate pack size.

---

# 3. Single cache owner and Service Worker architecture — REQUIRED

## 3.1 Separate shell and durable Dex-art ownership

The implementation must separate app-shell caching from the durable user-requested art pack.

Required cache ownership model:

- app shell: `manaevo-shell-vN` (or equivalent shell-owned versioned namespace)
- FORMAL Dex bytes: **`manaevo-dex-art-v1`**

`v1` on `manaevo-dex-art-v1` is the **cache schema version**, not the image-content version.

FORMAL art content revisions do not rotate the cache namespace. They are represented by deterministic revisioned request keys.

A Service Worker activation that cleans obsolete shell caches must **not delete `manaevo-dex-art-v1` merely because the shell version changes**.

No second screen-owned CacheStorage is allowed. The Service Worker/download manager and `MonsterArt` must converge on this one FORMAL byte cache.

## 3.2 Revisioned cache key

A current FORMAL asset is stored/read under a deterministic key equivalent to:

`/monsters/m123.webp?__manaevo_rev=<sha256>`

The exact parameter name may differ, but all of these invariants are required:

- species URL alone is not the currentness authority;
- SHA/revision is part of effective Cache API identity;
- old and new revisions cannot collide;
- offline fallback for an old revision can never be mistaken for the current revision key.

## 3.3 FORMAL image hot path

For a normal current-revision FORMAL image request, the warm-cache path must be approximately:

1. resolve current revision from an **in-worker memoized manifest/revision map**;
2. construct revisioned cache key;
3. `manaevo-dex-art-v1.match(revisionKey)`;
4. if hit, return immediately;
5. if miss, obtain current bytes through the controlled current-revision fetch path.

The following are **forbidden on every image cache hit**:

- network-fetching the revision manifest per image;
- calling `cache.keys()`/full cache enumeration per image;
- pruning the entire art cache per image.

Manifest network refresh happens at explicit lifecycle/update/audit boundaries, not once per rendered image. Obsolete-art prune happens at manifest-change/update/repair boundaries, not in the display hot path.

## 3.4 Manifest memoization/invalidation

The worker/app may memoize the parsed revision map for the active app session/worker lifetime.

It must refresh/invalidate that memoized map when one of these happens:

- new app/worker version activates;
- explicit pack audit/update begins;
- lifecycle update check says the manifest revision changed;
- developer/test fixture explicitly replaces manifest.

A single manifest refresh can serve many image resolutions.

---

# 4. Authoritative 238/238 semantics — REQUIRED

## 4.1 Truth source

`238/238 保存済み` is not a UI counter, localStorage integer, or IndexedDB progress row.

For V1, authoritative completion is derived from:

1. one fixed target manifest snapshot for the current operation;
2. the 238 expected SHA revision keys;
3. entries written into `manaevo-dex-art-v1` through the **verified-write path only**.

The dedicated `manaevo-dex-art-v1` namespace begins as a new schema-owned cache. Only the pack manager/current-FORMAL miss path may write current revision keys, and both must use the same SHA verification routine before `cache.put`. No legacy cache entry is imported into this namespace merely because its URL/species matches.

Therefore, after this schema starts, **presence of an expected revision key is a proof that its bytes passed the expected SHA at commit time**. Explicit pack audits may use expected-key presence as the cheap authoritative completeness check; they do not need to re-hash all 238 bytes on every status display.

V1 must not introduce an independent downloaded-count database as completion authority.

## 4.2 Verified commit boundary

An asset becomes complete only in this order:

1. fetch bytes for the target canonical asset using a path that cannot be satisfied by an unverified old-revision fallback for a current-pack write;
2. require a successful usable response;
3. read/clone bytes;
4. compute SHA-256 over actual response bytes;
5. compare to manifest SHA;
6. only on exact match, `cache.put(revisionKey, verifiedResponse)`;
7. only after successful `cache.put`, that target may count complete.

Therefore:

- HTTP 200 alone is insufficient;
- an offline/stale Service Worker fallback with old bytes cannot count for a new SHA;
- a failed/mismatched hash is never written under the current revision key;
- a UI progress increment before `cache.put` success is forbidden;
- a normal runtime cache miss that opportunistically fills `manaevo-dex-art-v1` must obey the same verified-write boundary as explicit download-all.

## 4.3 Crash-safe resume

Because the verified revision key in CacheStorage is the durable truth, this sequence is safe:

`verified cache.put succeeds → process/app is killed before UI/meta update`

After reload, audit finds the expected revision key already present and does not re-fetch it merely because a transient progress counter was lost.

Conversely, if metadata says 238 but one expected revision key is absent, status must downgrade to 237/238 (or `不足あり`).

## 4.4 Fixed-manifest operation + latest-manifest final verification

At download/update start, freeze **manifest snapshot N** as the operation target. Do not chase a moving target during each individual asset request.

At the end:

1. verify all N target revision keys are present;
2. refresh latest manifest once;
3. if latest is still N, completion may become 238/238;
4. if latest is N+1, do not falsely declare fully current; calculate delta N→N+1 and show `更新あり` / continue update according to the chosen UI flow.

Thus a manifest deployment occurring mid-download cannot create a false current 238/238 state.

## 4.5 Audit cost

A complete audit may iterate the expected 238 revision keys at an explicit audit boundary. It must not perform that full audit for each visible tile render.

---

# 5. Download-all UX and storage behavior

## 5.1 Ownership

Large storage management belongs to Parent/device management, not a primary child gameplay CTA.

Controls:

- `モンスター画像を全部保存`
- verified progress `x/238`
- expected total size from manifest
- `更新する`
- `不足分を修復`
- `保存画像を削除` with confirmation

Dex may show a compact status/shortcut, but child browsing must work without installing the pack.

## 5.2 Download scheduler

Required:

- bounded concurrency, initial default **4**;
- cancellation;
- verified completed entries survive cancellation/reload;
- resume schedules only missing/outdated target revision keys;
- no 238 simultaneous requests;
- progress derived from verified completion, not requests started.

Concurrency is tuning, not product authority; device measurement may reduce it. Increasing it must not bypass request-budget tests.

## 5.3 Storage quota / iPhone behavior

Before download, if available:

- read `navigator.storage.estimate()` for an approximate capacity warning;
- display manifest `totalBytes` as the expected art payload;
- optionally call `navigator.storage.persist()` as best effort.

Rules:

- `estimate()` is advisory, not proof that the write will succeed;
- actual Cache API write failure / `QuotaExceededError` is authoritative;
- never promise permanent retention on iPhone/Safari/PWA;
- eviction is a supported recovery case, not an impossible state;
- unsupported/denied persistent-storage request does not break browsing.

---

# 6. Delta update and prune

Given manifest N cached and N+1 available:

- same SHA → keep current revision entry, no image fetch;
- changed SHA → fetch + hash-verify + cache.put new revision key;
- new active asset → same verified path;
- removed/non-active old revision → clean during explicit prune/update boundary;
- No.239 remains outside the active target.

Obsolete key cleanup must happen once at a controlled maintenance boundary, not through `cache.keys()` on every art request.

A one-image revision must be demonstrably capable of `exactly 1` image network fetch when all other current keys are valid.

---

# 7. Normal Dex request/decode budget

## 7.1 Do not render 238 live image requests

Current `loading="lazy"` is not sufficient acceptance evidence because browsers may choose different lazy thresholds.

V1 requires an explicit viewport-aware eligibility layer, e.g. IntersectionObserver or an equivalent virtualized/windowed strategy.

Only these items should receive an active image `src`/decode request:

- visible tiles;
- roughly 2–3 viewport heights of overscan/near-visible tiles;
- explicit detail/prefetch neighborhood.

The remaining tiles keep fixed-size art placeholders without starting image resolution.

Native `loading="lazy"` may remain as a secondary browser hint but cannot be the sole request-budget mechanism.

## 7.2 Fixed geometry

Grid art boxes have stable dimensions before decode. Image load must not alter tile height enough to destroy scroll-anchor restoration.

## 7.3 Detail prefetch/decode

On detail open or previous/next transition, recommended initial neighborhood:

- current species: high priority;
- previous 2 browsable species;
- next 2 browsable species.

Bytes may already exist in CacheStorage. Decode/prefetch lifetime stays bounded to this neighborhood plus current grid viewport.

The implementation must not hold decoded bitmaps/object URLs for every species visited during a long session.

## 7.4 Loading/error presentation

Before an image is ready, show an intentional loading skeleton/state inside the fixed art box. A retryable load/decode error has an explicit fallback/retry state rather than an unexplained gray rectangle.

---

# 8. Detail navigation contract

## 8.1 Visible controls

Detail always provides:

`← まえ`   `ずかんへ`   `つぎ →`

Buttons remain the primary accessible navigation. Swipe may be supplementary later.

## 8.2 Browse context

A browse context contains at least:

- `contextId`
- `area`
- `type`
- `search`
- `showTools`
- ordered currently browsable species IDs
- selected species ID/index
- grid anchor species ID
- anchor viewport offset

If opened from filtered/search results, previous/next stays within that ordered result set. Unknown/unopenable species are excluded/skipped.

If detail is opened externally (capture/evolution registration shortcut), construct a default ordered context of currently browsable/seen species by No.

At the ends, previous/next is disabled; V1 does not wrap.

## 8.3 Previous/next state transition

Previous/next updates detail in place and **must not add one browser-history entry per species**.

History behavior:

- Grid → first detail: `history.pushState(detailState, ...)`
- Detail species A → B via previous/next: `history.replaceState(updatedDetailState, ...)`

Thus pressing browser Back from any species detail returns directly to the original Dex grid context instead of stepping backward through every species visited.

---

# 9. Browser/PWA Back + scroll restoration contract — REQUIRED

V1 does not require React Router. It uses the platform History API explicitly.

## 9.1 History state

On Grid → Detail, push a Dex detail history state containing enough identity to recover the browse context, including at minimum:

- Dex detail marker/version;
- `contextId`;
- current selected species ID;
- filters/search/showTools;
- ordered IDs or a deterministic context representation sufficient to reconstruct them;
- anchor species ID;
- anchor viewport offset.

The same browse context is mirrored to `sessionStorage` under a versioned ManaEvo Dex key so an iOS/WebKit React-tree remount in the same tab/session does not automatically erase return context.

Do not store this as permanent cloud/profile gameplay state.

## 9.2 One restore function

Visible `ずかんへ` and browser/PWA `popstate` must call the **same Dex restore routine**.

Required restore sequence:

1. restore area/type/search/showTools;
2. recompute/confirm the result list;
3. render fixed-geometry grid;
4. locate anchor species;
5. scroll anchor into the intended viewport position;
6. apply saved pixel-offset correction;
7. restore meaningful focus without causing another disruptive scroll.

There must not be separate visible-back and browser-back implementations with different scroll behavior.

## 9.3 Browser automatic scroll restoration

During the Dex grid/detail history interval, the app owns restoration using `history.scrollRestoration = 'manual'` where supported.

The previous value is preserved and restored when leaving that ownership interval.

This avoids browser automatic restoration racing with anchor+offset restoration and causing a visible top-jump-then-jump-back effect.

## 9.4 Invalid/stale context fallback

If session state is missing, schema-incompatible, or filters no longer reproduce the saved anchor, return to a valid Dex grid deterministically rather than trapping the user in detail. Best available fallback is selected species if present, otherwise nearest result/top.

---

# 10. Failure/recovery cases

## Network loss during pack download

Keep verified cache entries; mark incomplete/paused; resume only missing current keys.

## Cache eviction

- one missing key → not 238/238;
- full art-cache eviction → 0/238 until repaired;
- unrelated stale metadata cannot override cache truth;
- normal online browsing may fetch missing current asset on demand through the verified-write path.

## Stale SW fallback

A response containing an old FORMAL revision is valid only for displaying that old offline revision when explicitly requested by its own old key/fallback policy. It may never satisfy a **current pack completion write** unless bytes hash to the current manifest SHA.

## Corrupt/unloadable bytes

Hash mismatch never commits as current. Decode failure does not infinite-loop; it exposes retry/repair diagnostics.

## Manifest changes mid-operation

Finish/fail against frozen target N, then compare latest once. Never silently relabel N as N+1-complete.

---

# 11. Performance invariants

Implementation is not considered conformant merely because functional tests pass.

Required invariants:

1. warm current-revision cache hits do not require network;
2. revision manifest network fetch count does not scale with number of images rendered;
3. art-cache `cache.keys()` full enumeration count does not scale with image renders;
4. normal first Dex entry never starts 238 image requests;
5. decoded/mounted image resources stay bounded by viewport + configured prefetch neighborhood;
6. repeated next/previous does not re-download unchanged current bytes;
7. a completed pack allows all 238 current assets to load with network disabled.

Measure/review on iPhone WebKit:

- cold detail ready time;
- warm cached detail ready time;
- previous/next ready time;
- image-network-request counts;
- manifest-network-request counts;
- full-cache-enumeration counts;
- long-browse memory trend/responsiveness.

No fixed millisecond SLA is declared until target-device measurement exists, but monotonic pathological work proportional to 238 renders is a blocker.

---

# 12. Acceptance required before release

These tests become mandatory CURRENT acceptance if this design is promoted.

## AC-DEX-PERF-001 — Verified full pack

Empty `manaevo-dex-art-v1` → download all → exactly active No.001–238 current FORMAL target keys verified. No.239 excluded. Completion cannot be obtained from a counter alone.

## AC-DEX-PERF-002 — OFFLINE-238 exhaustive

After completion, set network completely offline and sequentially render/open **all No.001 through No.238**. Expected:

- load/decode errors: 0 for the approved fixtures/assets;
- network image dependency: 0;
- previous/next can traverse the active sequence offline.

This is required release acceptance, not only a slow optional sample test.

## AC-DEX-PERF-003 — Crash-boundary resume

For one deterministic target:

1. fetch and SHA-verify;
2. `cache.put` succeeds;
3. kill/remount before progress/meta/UI update;
4. resume.

Expected: that revision is discovered as complete and network image fetch for it is 0 on resume.

## AC-DEX-PERF-004 — Stale-SW fallback cannot fake completion

Current target SHA=B. Simulate network failure where fetch path yields old revision bytes A with HTTP-success semantics. Expected:

- SHA mismatch;
- B key is not committed;
- completed count does not increment;
- 238/238 is impossible until B bytes arrive.

## AC-DEX-PERF-005 — Delta exactness

With manifest N fully current:

- N+1 changes exactly 1 asset → image network fetches exactly 1;
- another fixture changes exactly 7 assets → image network fetches exactly 7;
- unchanged target image fetches = 0.

Manifest/control requests are measured separately from image fetches.

## AC-DEX-PERF-006 — Eviction/inconsistency matrix

After a complete pack, test separately:

1. remove one art entry;
2. remove whole `manaevo-dex-art-v1`;
3. leave stale UI/meta saying complete while cache entry is missing;
4. remove optional UI/meta while cache remains complete.

Expected status derives from authoritative expected revision keys; repair fetches only missing/outdated assets.

## AC-DEX-PERF-007 — Request budget on normal Dex entry

Without pack installed, instrument image source/resolution requests. On initial Dex entry and ordinary scrolling:

- eligible image work stays within visible + configured 2–3 viewport overscan + explicit detail neighborhood;
- 238 image request burst is a failure;
- `loading="lazy"` by itself is not acceptance evidence.

## AC-DEX-PERF-008 — 238 long browse / bounded memory

On iPhone WebKit-equivalent target, traverse **No.001 → No.238 → No.001** using detail navigation.

Assert/measure:

- app remains responsive;
- mounted/retained image/object-URL resources remain bounded to viewport/prefetch policy;
- memory/resource retention does not grow monotonically with every visited species;
- unchanged cached image bytes are not repeatedly downloaded.

A 50-species sample is insufficient for release acceptance.

## AC-DEX-PERF-009 — SW hot-path budget

With warm current cache, browse/render all 238 under instrumentation. Expected:

- revision manifest network fetch does **not** occur once per image;
- art-cache full `cache.keys()` enumeration per cache hit = 0;
- local revisioned cache hits can return without network.

## AC-DEX-UX-001 — Filtered previous/next

Filter/search to a deterministic subset, open a middle item, navigate previous/next. Remain within displayed browsable order; ends disabled.

## AC-DEX-UX-002 — Visible `ずかんへ` restores exact context

Scroll far down, open detail, navigate several species, press `ずかんへ`.

Verify search/filter/showTools/result context and anchor+offset restoration. No forced top reset.

## AC-DEX-UX-003 — Browser Back uses same restore path

Repeat UX-002 but return with browser/PWA Back. It must call the same restoration semantics and not create a second/top-jump behavior.

## AC-DEX-UX-004 — History does not accumulate species steps

Grid → A detail → next B → next C → browser Back returns to the original grid context in one Back action. It must not step C→B→A first.

## AC-DEX-UX-005 — Remount/session recovery

While detail is open, simulate React-tree remount within the same browser session. Session-mirrored Dex context allows visible/back restoration to remain correct or degrade deterministically to the documented fallback.

---

# 13. Canonical promotion procedure after DESIGN PASS

This PR remains review-only. A design PASS does **not** make this branch runtime authority by itself.

After independent verdict:

`DESIGN PASS — PROMOTE DEX OFFLINE ART PACK + DETAIL UX V1`

then, before implementation is mergeable, synchronize in one product-change set:

1. `design/current/06-UI-SCREEN-CONTRACT.md`
   - detail previous/grid/next semantics
   - History API and anchor+offset restoration
   - explicit viewport-aware request budget/loading UI
2. `design/current/07-SAVE-PROFILES-PARENT-PWA.md`
   - shell vs `manaevo-dex-art-v1` cache ownership
   - memoized manifest/hot-path constraints
   - SHA-verified full pack, resume, quota, eviction, delta update
3. `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
   - AC-DEX-PERF-001..009 and AC-DEX-UX-001..005
4. `design/rebuild/DECISION-LOG.md`
   - new approved decision and explicit supersession/authority note
5. `design/current/USER-GUIDE.md`
   - owner-facing explanation synchronized before main merge.

Implementation must then change the existing Service Worker rather than layering a second competing cache owner onto it.

---

# 14. Independent re-review questions

The next reviewer should explicitly answer:

1. Does `manaevo-shell-vN` vs `manaevo-dex-art-v1` eliminate double ownership and prevent shell activation from deleting the user-requested pack?
2. Is the warm FORMAL image hot path bounded — memoized revision map + revisioned cache match, with no per-image manifest network fetch or full `cache.keys()` prune?
3. Can any stale/old HTTP-success response become current-complete without passing the current SHA? It must be impossible.
4. Does frozen manifest N + final latest-manifest check prevent moving-target false 238/238?
5. Are crash-after-cache-put and eviction states derived safely from cache truth rather than progress metadata?
6. Does History `push` on first detail + `replace` on previous/next + shared restore routine give intuitive browser Back with current architecture?
7. Does `scrollRestoration='manual'` ownership avoid browser/app double restoration?
8. Are OFFLINE-238, stale-SW, exact delta, eviction matrix, request budget, 238 round-trip long browse and SW hot-path tests strong enough for the stated “ヌルヌル/offline 238” promise?
9. Does the design keep persistent bytes separate from bounded decoded memory?
10. Is any implementation decision still dangerously deferred that could change safety/performance semantics?

If any blocker remains, verdict:

`DESIGN BLOCKED — DO NOT PROMOTE / DO NOT IMPLEMENT`

If no blocker remains:

`DESIGN PASS — PROMOTE DEX OFFLINE ART PACK + DETAIL UX V1`
