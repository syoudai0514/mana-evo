# ManaEvo Design Review Proposal — Dex Offline Art Pack + Detail Browsing UX V1

- Status: **DESIGN REVIEW ONLY — NOT CURRENT / NOT IMPLEMENTATION AUTHORITY**
- Date: 2026-08-31
- Repository: `syoudai0514/mana-evo`
- Base: `main@bc78609097fc1f486d26d6703f127fdaf235188d`
- Proposed canonical domains after approval: UI / PWA / Acceptance / Monster Art presentation
- Runtime changes in this PR: **none**

## 0. Why this proposal exists

All active monster art is now FORMAL for No.001–238, but the current Dex browsing experience still makes the art feel unavailable or slow:

1. the grid can show many image placeholders while images are being fetched/decoded;
2. entering species detail replaces the grid, and returning does not guarantee restoration to the exact browse position;
3. detail has no previous/next species navigation, so checking many monsters requires repeated back → scroll → open interactions;
4. even after a user intentionally wants the full art collection on the device, there is no explicit “download all monster images” flow;
5. a PWA cache can be evicted or become stale, so “downloaded once” cannot be treated as permanently valid without verification/versioning.

This proposal turns the Dex into a fast browse surface and adds an explicit, version-aware offline monster-art pack.

---

# 1. Product goals

## G1 — Warm browsing should feel instant

After a monster image has been cached, reopening it or moving to nearby species should not visibly return to a blank gray tile while the same bytes are fetched again.

## G2 — A user can intentionally download all 238 FORMAL monster images

A device-level action downloads the complete current FORMAL art set for No.001–238 and makes it available offline, subject to browser/PWA storage guarantees.

## G3 — Detailed browsing is continuous

From a species detail view, a user can move directly to the previous/next browsable species without returning to the grid.

## G4 — Returning to the grid preserves context

Back to Dex returns to the same filter/search state and the same visible species position, rather than the top of the list.

## G5 — New FORMAL revisions do not stay hidden behind stale cached bytes

All downloaded art is tied to explicit asset revision identity. Changed assets can be refreshed deterministically and unchanged assets are not needlessly downloaded again.

---

# 2. Non-goals

This proposal does **not**:

- change monster identity, numbering, family, types, stats, capture/evolution rules, or FORMAL approval state;
- include No.239 in active Dex or download pack;
- promise that iOS/Safari will keep web storage forever under device-storage pressure;
- preload/decode all 238 images into RAM at once;
- auto-download a large pack without a user action;
- make child-facing gameplay depend on the pack being installed.

---

# 3. Canonical asset scope

The offline art pack contains exactly the active current FORMAL monster assets:

- No.001–238
- FORMAL only
- No.239 excluded

The source list must come from the canonical monster asset manifest / runtime formal resolver. UI code must not maintain a second hand-written list of 238 asset URLs.

Each asset must expose or derive stable revision identity such as SHA-256 / manifest digest / versioned URL. Cache validity is based on that identity, not merely on species ID.

---

# 4. “Download all monster images” UX

## 4.1 Ownership

The storage-management action is **Parent / device settings owned**, not a prominent child gameplay CTA.

Dex may show compact status such as:

- `画像: オンライン`
- `画像: 238/238 保存済み`
- `画像: 更新あり`

and may provide a secondary shortcut to the storage-management surface, but the actual large download action belongs to Parent/device management to reduce accidental data/storage use.

## 4.2 Primary controls

Parent/device storage section exposes:

- `モンスター画像を全部保存`
- current status: `0/238`, `123/238`, `238/238`
- estimated/downloaded byte size where measurable
- `更新する` when manifest revision differs
- `不足分を修復` when cache audit finds missing/corrupt entries
- `保存画像を削除` as a destructive secondary action with confirmation

## 4.3 Before download

Before beginning:

1. calculate the canonical 238-asset target set;
2. query storage usage/quota where `navigator.storage.estimate()` is available;
3. show the expected download size if known or measurable;
4. warn that browser/device storage pressure may later remove cached data;
5. require explicit confirmation.

Do not claim a reliable “Wi-Fi only” guarantee because Network Information API support is not dependable on iOS. The UI may recommend downloading on Wi-Fi but must not pretend it can enforce it where the platform cannot.

## 4.4 Download behavior

The download manager must:

- use bounded concurrency rather than 238 simultaneous requests;
- report progress by verified completed asset count and bytes where known;
- support cancellation;
- keep successfully completed entries after cancellation/failure so retry resumes missing items;
- verify response success and expected revision identity where technically available;
- never mark the pack complete until all 238 current target revisions are present;
- tolerate app backgrounding/reload by deriving truth from cache contents + manifest rather than volatile UI state.

Recommended implementation default for review: **4 concurrent asset downloads**, tunable after device measurement.

## 4.5 Completion semantics

`238/238 保存済み` means all current canonical FORMAL revisions are locally available through the art cache.

It does not mean the browser guarantees permanent retention. On later app launch/resume, the app may audit a cheap manifest/index and downgrade status to `不足あり` if entries were evicted.

If `navigator.storage.persist()` is supported, the app may request persistent storage as a best-effort optimization. Failure or unsupported status must not break the feature.

---

# 5. Cache and update architecture

## 5.1 Byte cache vs decoded-image memory

These are separate concerns:

- **persistent byte cache**: can hold all 238 current images for offline use;
- **decoded image memory**: must stay bounded to nearby/visible images.

Do **not** decode all 238 at once. That can make an iPhone less smooth by increasing memory pressure even when all bytes are locally cached.

## 5.2 Cache identity

Cache key/effective URL must include current asset revision, or the Service Worker must have an equivalent deterministic revision map.

Species ID alone is insufficient if `m123.webp` bytes can change while URL stays identical.

## 5.3 Delta update

When the formal manifest changes:

- unchanged digest → keep cached asset;
- changed/new digest → download replacement;
- removed/non-active asset → remove from active pack index and optionally clean obsolete bytes;
- No.239 remains excluded from active pack.

A future one-asset art correction should normally fetch one changed asset, not all 238 again.

## 5.4 Runtime resolution

`MonsterArt` remains the single art-resolution contract.

Desired runtime resolution order for FORMAL art:

1. current-revision local cache, if present;
2. network current-revision asset;
3. canonical loading/error fallback state.

Screens must not implement their own competing cache rules.

---

# 6. Normal Dex grid loading strategy

The app must remain usable even when the full pack has not been installed.

## 6.1 Visible/near-visible priority

Use viewport-aware loading, e.g. IntersectionObserver/root margin, so the app prioritizes:

1. currently visible rows;
2. approximately the next 2–3 screens of rows;
3. only then later content as the user approaches it.

Do not start 238 high-priority image fetches on Dex entry.

## 6.2 Nearby prefetch

When a detail view is opened, prefetch the previous/next nearby species bytes, recommended default:

- previous 2 browsable species
- next 2 browsable species

If already cached, the fetch layer should no-op/resolve locally.

## 6.3 Decode policy

Where supported, decode the current detail image and nearest neighbors ahead of display (`img.decode()` or equivalent) without retaining the entire 238-image set as decoded bitmaps.

## 6.4 Loading presentation

A tile/detail must never look permanently broken while work is in progress.

Use an explicit loading skeleton/state inside the fixed art box. Do not collapse layout while the image loads. On retryable failure, show a clear retry/fallback state rather than an unexplained gray rectangle.

---

# 7. Dex detail navigation

## 7.1 Persistent detail controls

Species detail must expose a stable navigation bar:

`← まえ`   `ずかんへ`   `つぎ →`

The controls should remain reachable without requiring a long vertical scroll back to the top.

A horizontal swipe gesture may be added as a secondary convenience, but visible buttons remain the accessible/learnable primary controls.

## 7.2 What “previous/next” means

Navigation follows the **current browse context**.

If the user entered detail from a filtered/search result list, previous/next traverses that filtered list in displayed order.

If detail was opened without an existing grid context (for example a Capture/Evolution registration shortcut), create a default browse context of all currently browsable `seen` species ordered by No.

Unknown/unseen species that cannot be opened are skipped.

At the first/last item, the corresponding button is disabled. V1 does not wrap from last → first or first → last.

## 7.3 Detail transition

On previous/next:

- keep the detail shell stable;
- update species metadata and art in place;
- start from the detail’s canonical top content position unless a later UX review explicitly chooses per-species detail scroll memory;
- prefetch the next neighborhood after each transition.

This avoids the current back/grid/reopen cycle.

---

# 8. Returning to the grid

## 8.1 Browse context snapshot

Before entering detail from Dex, preserve:

- area filter
- type filter
- search text
- filter panel expanded/collapsed state where meaningful
- ordered species result IDs
- selected species ID/index
- scroll anchor species ID
- pixel offset of that anchor within the viewport

## 8.2 Restoration

`ずかんへ` returns to the exact same browse context and restores the selected/anchor card to approximately the same viewport position.

Prefer **anchor species + offset** over raw `scrollY` alone because image decoding/layout/filter state can change document height.

No forced scroll-to-top is allowed for this local Dex detail return.

## 8.3 Browser/back behavior

Browser/PWA back and the visible `ずかんへ` action should converge on the same restoration semantics when technically feasible. There must not be two different Dex return behaviors depending on which back mechanism was used.

---

# 9. Failure and recovery states

## 9.1 Network loss during pack download

- completed items remain valid;
- status becomes paused/incomplete;
- retry resumes missing current revisions;
- pack is not falsely labeled complete.

## 9.2 Cache eviction

If some images are later missing:

- normal online runtime can refetch on demand;
- pack status becomes `不足あり` after audit;
- `不足分を修復` downloads only missing/outdated revisions.

## 9.3 Formal art revision during/after download

The target set is revisioned. Completion is evaluated against the **current manifest revision**. A stale old revision does not count as current merely because a file exists for that species ID.

## 9.4 Corrupt/unloadable image

A failed decode/load must:

- not loop infinitely;
- mark that entry unavailable for current render;
- permit retry/repair;
- retain enough diagnostics to distinguish missing, HTTP failure, and decode failure in developer logs.

---

# 10. Accessibility and child usability

- previous/next buttons have explicit text/aria labels including target species where practical;
- touch targets remain at least the project mobile target size;
- loading state is not conveyed by color alone;
- focus returns to a meaningful element when closing detail;
- grid restoration should focus or visually preserve the species just inspected without creating disruptive automatic screen-reader jumps;
- download controls use plain Japanese and belong to adult/device management.

---

# 11. Performance requirements

The design goal is “no unnecessary re-download and no blank-feeling navigation,” not an unsafe promise that every device paints in a fixed number of milliseconds.

Required behavior:

1. after pack completion, all 238 FORMAL images are available with network disabled;
2. previous/next detail navigation works offline for the full active set;
3. already-cached art is served without a network dependency;
4. opening detail prefetches the near neighbors rather than all 238 into decoded memory;
5. returning to grid does not reset to the top;
6. Dex entry without pack does not create 238 simultaneous image requests;
7. repeated detail next/previous does not cause the same unchanged asset bytes to be re-downloaded.

Performance telemetry/review should record at least:

- cold online detail image ready time;
- warm cached detail image ready time;
- next/previous transition image-ready time;
- number of network image requests during a 20-species sequential browse;
- memory behavior on target iPhone WebKit during extended browsing.

---

# 12. Proposed acceptance tests after design approval

## AC-DEX-PERF-001 — Full art pack downloads current active set

Starting with an empty ManaEvo art cache, trigger `モンスター画像を全部保存`. Completion requires exactly the active No.001–238 current FORMAL revisions. No.239 is not fetched as part of the pack.

## AC-DEX-PERF-002 — Full pack works offline

After pack completion, place the browser context offline and verify sampled beginning/middle/end species plus sequential detail navigation can render current FORMAL art without network.

A slower exhaustive non-PR test may validate all 238 cached entries by manifest identity.

## AC-DEX-PERF-003 — Interrupted download resumes

Interrupt after a deterministic subset, reload, then resume. Previously verified current entries are not fetched again unnecessarily and final state reaches 238/238.

## AC-DEX-PERF-004 — Delta update downloads changed assets only

Given manifest N cached, move to manifest N+1 with one changed asset. Update fetches the changed current revision and preserves unchanged valid entries.

## AC-DEX-PERF-005 — Cache eviction is recoverable

Delete one cached art entry after completion. Audit must not still report 238/238. Repair downloads/restores only missing/outdated current entries.

## AC-DEX-UX-001 — Detail previous/next respects browse context

Apply a filter yielding a deterministic subset, open the middle result, then use previous/next. Navigation remains within the filtered result order and skips non-browsable unknown species.

## AC-DEX-UX-002 — Grid restoration preserves context and position

Scroll to a deterministic species far below the first viewport, open detail, navigate to a nearby detail, choose `ずかんへ`, and verify:

- same filter/search state;
- same result set/order;
- return near the previously anchored species rather than top of grid.

## AC-DEX-UX-003 — Browser back converges with visible back

Opening a detail and returning through browser/PWA back preserves the same Dex browse context as the visible `ずかんへ` action.

## AC-DEX-PERF-006 — No 238-request burst on normal Dex entry

With pack absent, first Dex entry loads only visible/near-visible art within the configured prefetch window; it must not launch all 238 image requests at once.

## AC-DEX-PERF-007 — Long browse remains bounded

On target iPhone WebKit, sequentially inspect at least 50 species using next/previous. The app remains responsive, does not retain decoded images for all visited species, and does not repeatedly download unchanged cached bytes.

---

# 13. Required canonical promotion if review passes

This review proposal is intentionally not authoritative yet.

After an independent design reviewer returns `DESIGN PASS — PROMOTE`, the implementation PR must first synchronize these CURRENT documents in the same change set before runtime work is considered mergeable:

1. `design/current/06-UI-SCREEN-CONTRACT.md`
   - Dex detail previous/next semantics
   - exact grid-context/scroll restoration
   - loading-state expectations
2. `design/current/07-SAVE-PROFILES-PARENT-PWA.md`
   - explicit full FORMAL art-pack management
   - storage/quota/persistence caveats
   - resumable download + manifest-revision/delta-update contract
3. `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
   - AC-DEX-PERF / AC-DEX-UX cases above
   - also keep production-host authority synchronized with current Vercel canonical state
4. `design/rebuild/DECISION-LOG.md`
   - approved decision entry and supersession/authority note
5. owner-facing guide/change explanation required by project governance.

Implementation must not silently weaken this proposal by using raw scroll-to-top behavior, all-at-once decode, non-versioned cache, or a false permanence promise for iOS web storage.

---

# 14. Independent reviewer questions

The reviewer should specifically challenge:

1. Is CacheStorage + manifest revisioning sufficient and safe for the current Vite/PWA architecture, or should IndexedDB own any part of the art-pack index?
2. Does the design avoid iPhone memory pressure by separating persistent bytes from decoded-image memory?
3. Is a bounded default concurrency of 4 reasonable, and should it be adaptive?
4. Is anchor-species + offset restoration robust with lazy image layout and filters?
5. Should previous/next use filtered browse context as specified, or global No order?
6. Are background/reload/cancellation semantics implementable without falsely reporting completion?
7. Are iOS storage eviction and `navigator.storage.persist()` limitations represented accurately?
8. Do the proposed acceptance tests catch repeat downloads, stale assets, scroll reset, and navigation traps?
9. Is Parent/device ownership for the bulk-download action the right balance between convenience and accidental data use?
10. Are there any blockers that must be fixed in design before implementation begins?

Expected reviewer verdict when no blocker remains:

`DESIGN PASS — PROMOTE DEX OFFLINE ART PACK + DETAIL UX V1`
