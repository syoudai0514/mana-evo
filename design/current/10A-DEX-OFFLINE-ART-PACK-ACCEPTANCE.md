# ManaEvo CURRENT — Dex Offline Art Pack + Detail UX Acceptance

Status: **CURRENT CANONICAL — D-020 release gate**  
Date: 2026-08-31  
Scope: release acceptance for `design/current/10-DEX-OFFLINE-ART-PACK-UX.md`

These scenarios are CANONICAL GATE behavior. Passing ordinary CI without these behaviors does not prove this feature release-ready.

---

## AC-DEX-PERF-001 — Verified full pack

Starting with empty `manaevo-dex-art-v1`, explicit download-all must finish only when exactly the active No.001–238 current FORMAL revision keys have been written through the shared SHA-verified commit path.

- No.239 excluded.
- HTTP success/counter/meta alone cannot produce 238/238.

## AC-DEX-PERF-002 — OFFLINE-238 exhaustive

After pack completion, turn network completely OFF and sequentially render/open every active No.001 through No.238.

Required:

- load/decode error 0 for approved production assets;
- image-network dependency 0;
- detail previous/next can traverse the active sequence offline.

A beginning/middle/end sample is insufficient.

## AC-DEX-PERF-003 — Crash-boundary resume

For a deterministic asset:

1. fetch bytes;
2. SHA verifies;
3. `cache.put(currentRevisionKey)` succeeds;
4. terminate/remount before UI/progress/meta update;
5. resume download/audit.

Expected: existing verified key counts complete and network image fetch for that asset on resume is 0.

## AC-DEX-PERF-004 — Stale-SW fallback cannot fake completion

Target expected SHA=B. Simulate an HTTP-success-like response containing old revision bytes A.

Required:

- actual hash mismatch is detected;
- B key is not committed;
- completion does not increment;
- 238/238 remains impossible until correct B bytes are available.

## AC-DEX-PERF-005 — Delta exactness

With manifest N complete:

- N+1 changes exactly 1 image → exactly 1 image network fetch;
- another fixture changes exactly 7 images → exactly 7 image network fetches;
- unchanged image network fetches = 0.

Control/manifest requests are counted separately.

## AC-DEX-PERF-006 — Eviction/inconsistency matrix

Test separately after complete pack:

1. delete one art entry;
2. delete entire `manaevo-dex-art-v1`;
3. leave stale UI/meta claiming complete while one cache key is missing;
4. remove optional UI/meta while all current keys remain.

Expected status derives from expected current revision keys. Repair fetches only missing/outdated assets.

## AC-DEX-PERF-007 — Normal Dex request budget

Without full pack installed, instrument image-resolution/network work.

Initial Dex entry and ordinary scrolling may activate only visible + configured 2–3 viewport overscan + explicit detail neighborhood.

Starting 238 image requests is failure. Native `loading="lazy"` alone is not acceptance evidence.

## AC-DEX-PERF-008 — Full 238 round-trip / bounded resources

On iPhone WebKit-equivalent target, traverse detail:

`No.001 → No.238 → No.001`

Required:

- interaction remains responsive;
- mounted/retained image/object-URL/decode resources remain bounded by viewport/prefetch policy;
- resource retention does not grow monotonically with every species visited;
- unchanged cached bytes are not repeatedly downloaded.

A 50-species sample is insufficient.

## AC-DEX-PERF-009 — Service Worker hot-path budget

With a warm current cache, browse/render all 238 under instrumentation.

Required:

- revision manifest network fetch does not occur once per image;
- full art `cache.keys()` enumeration per cache hit = 0;
- current revision cache hit can return without network.

---

## AC-DEX-UX-001 — Filtered previous/next

Create a deterministic filtered/search subset, open a middle species, then previous/next.

Required:

- traversal stays inside displayed browsable result order;
- unknown/unopenable entries are not navigated into;
- first/last corresponding button disabled;
- no V1 wraparound.

## AC-DEX-UX-002 — Visible `ずかんへ` restores exact context

Scroll far below the top, apply filter/search, open detail, navigate several species, press `ずかんへ`.

Required:

- normal Grid-origin path consumes the current detail history entry through `history.back()`;
- `popstate` reaches shared restore semantics;
- area/type/search/filter-panel/result order are restored;
- anchor species + saved viewport offset restore the visual position;
- no forced scroll-to-top.

## AC-DEX-UX-003 — Safari/PWA Back uses same restore semantics

Repeat the same Grid-origin scenario but return with browser/PWA Back.

Expected result and position are equivalent to visible `ずかんへ`; no browser-auto-scroll then app-scroll double jump.

## AC-DEX-UX-004 — Species browsing does not accumulate history steps

`Grid → A → Next B → Next C → Safari Back once`

Expected: original Grid context.

Fail if Back steps through C→B→A.

## AC-DEX-UX-005 — Same-session remount recovery

While detail is open, simulate React tree remount in the same tab/session.

Versioned session-mirrored browse context must permit correct restoration or the documented deterministic fallback; it must not silently lose navigation provenance and trap the user.

## AC-DEX-UX-006 — No orphan detail after visible return

Mandatory regression sequence:

`Grid G → A → Next B → ずかんへ → Grid G → C → Safari Back once`

Expected: **Grid G**.

Fail if Safari Back returns to B or another previously closed detail.

## AC-DEX-UX-007 — External-detail fallback does not consume unrelated history

Open a detail through Capture/Evolution/other path with no valid preceding Dex Grid history entry, then press `ずかんへ`.

Required:

- current detail entry is replaced with deterministic Dex Grid state;
- shared `restoreDexContext()` semantics run;
- unrelated previous browser history is not consumed;
- user lands on valid Dex Grid.

---

## AC-DEX-STORAGE-001 — Quota/persist are best effort

`navigator.storage.estimate()` may be shown as approximate guidance only. Unsupported/denied `persist()` does not break the feature. Actual CacheStorage write/QuotaExceeded failure must produce an incomplete/recoverable state rather than false completion.

## AC-DEX-STORAGE-002 — Shell update preserves art cache ownership

Upgrade app shell cache version. Expected:

- obsolete shell cache can be replaced;
- `manaevo-dex-art-v1` is not deleted solely because shell version changed;
- changed FORMAL revisions update through delta rules rather than full cache reset.

---

## Release evidence requirement

An implementation PR may be called ready only when the same head provides:

- unit/integration tests for manifest/SHA/cache completion and delta/eviction rules;
- browser/WebKit tests for detail History/scroll and request-budget behavior;
- exhaustive OFFLINE-238 evidence;
- 238→001 long-browse evidence or equivalent WebKit instrumentation proving bounded resource lifetime;
- SW hot-path instrumentation proving no per-image manifest request or per-hit full cache enumeration;
- build/release readiness and ordinary regression suite green.

Final review must cite the exact implementation head SHA and map evidence to these AC IDs.