# ManaEvo Rebuild — Phase 3 Wave D Work Items

Status: ACTIVE — FINAL ENGINEERING WAVE
Base branch for all workers: `rebuild/canonical-governance`
PR base for all workers: `rebuild/canonical-governance`

## Why this wave exists

Wave C W-214..W-217 is integrated on the commander branch. Integrated CI at head `5caf126dfbafb28da16813e61e79aba33b0fd89a` is green: unit/integration tests PASS, production build PASS, iPhone WebKit E2E PASS.

The canonical product flow is now reachable from Home -> Study -> Adventure -> Battle/Capture -> Monster/Evolution. Remaining engineering work is release hardening, not product-rule redesign.

Before work, read in order:
1. `REBUILD-START-HERE.md`
2. `design/current/00-START-HERE.md`
3. `design/current/06-UI-SCREEN-CONTRACT.md`
4. `design/rebuild/DECISION-LOG.md`
5. `design/rebuild/PHASE-2-FINAL-REVIEW.md`
6. `design/rebuild/PHASE-3-WORK-ITEMS.md`
7. `design/rebuild/PHASE-3-WAVE-B-WORK-ITEMS.md`
8. `design/rebuild/PHASE-3-WAVE-C-WORK-ITEMS.md`
9. this file / assigned Work Item

Common rules:
- CURRENT canonical outranks existing runtime/tests/copy.
- Preserve immutable baseline.
- Do not invent new game/product rules.
- Do not merge to `main`.
- Do not edit another Work Item's owned files.
- Do not add a new global CSS override layer.
- Never restore stale behavior just to satisfy an old test.
- Finish branch -> implementation -> tests -> production build -> iPhone WebKit E2E -> commit -> push -> PR to `rebuild/canonical-governance` -> completion report.

---

## W-218 — Visual/CSS authority consolidation + iPhone 390/375 polish

Branch: `rebuild/w-218-visual-css-iphone-polish`
Type: final visual implementation owner
Canonical: `design/current/06-UI-SCREEN-CONTRACT.md`

Primary ownership:
- active shared/global style entrypoints and CSS files used by the ManaEvo shell/game UI
- minimal class-name-only edits in active screen components when strictly required to remove CSS ownership ambiguity
- visual/responsive tests directly related to this work

Do not edit:
- game engine/progression/domain rules
- Kids Quest learning behavior
- PWA/service-worker/release files owned by W-220
- broad E2E journey files owned by W-219
- baseline/current canonical docs

Required changes:
1. Collapse CSS authority ambiguity.
   - remove redundant/superseded override rules when safe
   - reduce `!important` and selector wars where they only exist to override older layers
   - do not introduce `premium-ui-v5.css` or another new catch-all layer
   - keep one understandable authority order for active ManaEvo UI
2. 390px and 375px portrait polish for all primary child screens:
   - Home
   - Study hub / required-learning entry
   - Adventure / exploration
   - Battle
   - Capture focused state
   - Monster
   - Dex
   - Evolution celebration
   - HowTo
   - Parent gate entry
3. First viewport contract:
   - screen purpose, current state, primary subject/monster/location, and primary action visible without an information wall
   - no horizontal overflow
   - no clipped primary CTA
   - tap targets usable on iPhone
   - bottom navigation does not cover actionable content
4. Preserve CURRENT information hierarchy. Do not re-add removed six-step/manual/dashboard blocks for visual balance.
5. Remove clearly dead visual rules only with evidence that no active component depends on them.

Acceptance:
- 390px and 375px focused visual/responsive tests PASS
- no new global override layer
- no horizontal overflow in primary child flows
- primary CTA remains reachable/visible in first decision surface
- full `npm test` PASS
- production build PASS
- iPhone WebKit E2E PASS

---

## W-219 — Full child vertical-slice behavioral E2E / regression

Branch: `rebuild/w-219-full-child-journey-e2e`
Type: behavioral release gate owner

Primary ownership:
- `e2e/**` journey/regression specs
- test fixtures/helpers used only by E2E
- directly related behavioral tests under `tests/**`

Do not edit:
- active runtime/UI implementation
- CSS
- game/learning domain rules
- PWA/service-worker implementation

If a real implementation defect is found, document exact reproduction and leave the Work Item blocked for commander follow-up rather than silently taking another owner's implementation files.

Required coverage:
1. New/clean child path:
   - Home learning-incomplete -> Study
   - finish required learning -> daily reward/tickets/progression exactly once
   - Home learning-complete -> Adventure
2. Adventure:
   - current area/zone and <=5 default encounters
   - exploration spends 5 points
   - pity/choice path remains domain-driven
   - boss gate cannot unlock by route clears alone and does unlock with canonical learning progress
3. Battle/Capture:
   - ticket reserve/settle/refund behavior
   - HP<=50 capture gating
   - temporal 4-star success
   - failed capture never shows completed 4-star success
   - duplicate keep/support reload-safe path
   - 3 shards -> XP+30 to one current-team monster
4. Growth/Evolution:
   - battle-earned automatic level/held-item evolution celebrates once
   - manual stone evolution remains Monster-owned
   - own evolution unlock/discovery reaches later-world behavior
5. Save/profile/reload:
   - no duplicate reward after reload
   - profile isolation remains intact
6. Primary navigation ownership:
   - top-level child destinations remain Home/Study/Adventure/Monster/HowTo
   - focused Battle/Capture/Evolution do not compete with top-level navigation

Acceptance:
- behavior-first assertions; avoid source-string/load-order tests unless no behavioral alternative exists
- deterministic E2E control without modifying production game probability/logic
- no stale legacy wording/assertions
- full `npm test` PASS
- production build PASS
- iPhone WebKit E2E PASS

---

## W-220 — PWA/offline/release readiness + proven dead-path cleanup

Branch: `rebuild/w-220-release-pwa-dead-path-cleanup`
Type: release hardening owner
Canonical: `design/current/07-SAVE-PROFILES-PARENT-PWA.md`, `design/current/06-UI-SCREEN-CONTRACT.md`

Primary ownership:
- PWA manifest/service-worker/install/update assets
- GitHub Pages/base-path/release configuration
- release/readiness scripts and tests
- clearly dead legacy files/imports proven unreachable from production entrypoints
- release checklist/report under `design/rebuild/release/`

Do not edit:
- visual CSS authority owned by W-218
- journey E2E owned by W-219 except release-specific smoke coverage
- active game/learning product behavior
- monster art approval state (CANDIDATE/PLACEHOLDER must not be promoted)

Required changes/audit:
1. GitHub Pages production path `/mana-evo/` works for first load, refresh/deep-entry fallback where applicable, and service-worker scope.
2. Offline/update safety:
   - app shell caching is ManaEvo-scoped
   - old caches clean safely
   - heavyweight voice/model assets are not accidentally forced into install precache
   - FORMAL monster art revision behavior remains correct; CANDIDATE/PLACEHOLDER are not treated as approved formal assets
3. Installability:
   - manifest/icons/touch icon/start_url/scope are valid for canonical deployment
4. Save safety:
   - production update must not wipe profile/game saves
   - backup/import path remains functional
5. Dead legacy cleanup:
   - build an import/reachability inventory first
   - remove only files/paths proven unreachable and superseded
   - do not delete `src/kids-quest-study/**` authentic learning source-of-truth behavior
   - legacy compatibility/migration code that is still needed for saves must remain
6. Produce `design/rebuild/release/FINAL-ENGINEERING-RELEASE-CHECKLIST.md` with PASS/BLOCKED evidence for build, tests, WebKit, PWA, save migration, deployment base path, and known non-engineering asset status.

Acceptance:
- full `npm test` PASS
- production build with `VITE_BASE_PATH=/mana-evo/` PASS
- iPhone WebKit E2E PASS
- PWA/service-worker tests PASS
- no production entrypoint imports a removed file
- no save migration regression
- FORMAL monster art count is not fabricated; release checklist explicitly reports actual asset status

---

## Final engineering commander gate

Commander reviews W-218..W-220 together.

Before `rebuild/canonical-governance` can be proposed for merge to `main`:
- integrated unit/integration tests PASS
- integrated production build PASS
- integrated iPhone WebKit E2E PASS
- 390px and 375px primary child flows have no blocker
- PWA/install/update/save checks PASS
- no known CURRENT-vs-runtime drift remains in the primary child vertical slice
- release checklist clearly separates engineering readiness from monster-art completion

Formal monster-art production/review remains a parallel asset stream from W-217. Engineering must not fake completion by promoting placeholders or unapproved candidates.
