# ManaEvo Rebuild — Phase 3 Wave C Work Items

Status: ACTIVE
Base branch for all workers: `rebuild/canonical-governance`
PR base for all workers: `rebuild/canonical-governance`

## Why this wave exists

Wave B W-210..W-213 is integrated on the commander branch and the integrated CI is green: unit/integration tests, production build, and iPhone WebKit E2E all pass.

The remaining gaps are now child-flow gaps, not canonical recovery gaps. Do not reopen settled product rules. The goal of Wave C is to make the already-integrated CURRENT runtime reachable and understandable from the actual child UI while keeping file ownership non-overlapping.

Before work, read in order:
1. `REBUILD-START-HERE.md`
2. `design/current/00-START-HERE.md`
3. `design/current/06-UI-SCREEN-CONTRACT.md`
4. `design/rebuild/DECISION-LOG.md`
5. `design/rebuild/PHASE-2-FINAL-REVIEW.md`
6. `design/rebuild/PHASE-3-WORK-ITEMS.md`
7. `design/rebuild/PHASE-3-WAVE-B-WORK-ITEMS.md`
8. this file / assigned Work Item

Common rules:
- CURRENT canonical outranks existing runtime/tests/copy.
- Preserve immutable baseline.
- Do not invent blocked product decisions.
- Do not merge to `main`.
- Do not edit another Work Item's owned files.
- Do not add a new global CSS override layer.
- Prefer behavioral tests over source-string/load-order assertions.
- If an old test encodes superseded behavior, replace the test; never revert correct CURRENT runtime to satisfy it.
- Finish branch -> implementation -> tests -> production build -> iPhone WebKit E2E when applicable -> commit -> push -> PR to `rebuild/canonical-governance` -> completion report.

---

## W-214 — Home / Study canonical UX completion

Branch: `rebuild/w-214-home-study-ui`
Canonical: `design/current/06-UI-SCREEN-CONTRACT.md`, `design/current/01-LEARNING-REWARDS.md`

Primary ownership:
- `src/App.jsx`
- directly related Home/Study UI tests only

Do not edit:
- `src/kids-quest-study/**` learning engine/domain behavior
- `src/game/screens/**`
- game engine/progression/domain modules
- shared/global CSS authority files
- immutable baseline/current canonical docs

Required changes:
1. Home becomes "today's next action + partner motivation", not an everything-dashboard.
   - daily learning incomplete -> one dominant primary CTA: `まなぶ！`
   - daily learning complete -> one dominant primary CTA: `ぼうけんへ！`
   - keep partner art/name/Lv, compact learning progress, usable ticket count, actual current area/zone, and compact next-evolution motivation when relevant
   - remove the permanent six-step game-loop strip
   - remove the permanent game-manual/explanation panel
   - remove duplicate/verbose status dashboard content that does not change the next action
   - do not make Evolution override the contextual Home primary CTA
2. Study keeps authentic Kids Quest learning behavior but fixes presentation.
   - remove child-facing implementation wording such as `Kids Quest 学習エンジン`
   - required learning is visually first
   - free study/review/trial/dictionary are secondary/progressive, not equal-weight before required work
   - Parent-only grade/ahead/difficulty controls remain outside child Study
3. Remove stale additional-learning copy.
   - never say `3もん中2もん -> ticket +1`
   - child copy must agree with CURRENT: each actually cleared extra question gives ticket +1 and exploration +1; every cumulative 3 correct additional-learning answers gives star ring +1
   - do not change learning engine reward logic while fixing copy
4. Preserve focused ownership/navigation behavior introduced by W-208/W-210.

Acceptance:
- Home has exactly one dominant contextual CTA in each daily state
- no permanent six-step strip or permanent game manual on Home
- child Study contains no implementation/migration terminology
- required learning is visually prior to optional modes
- no stale 2-of-3 extra reward wording remains in active child UI
- full `npm test` PASS
- production build PASS
- iPhone WebKit E2E PASS

---

## W-215 — Adventure / Exploration child-flow completion

Branch: `rebuild/w-215-adventure-exploration-ui`
Canonical: `design/current/04-EVOLUTION-SPECIAL-FORMS.md`, `design/current/05-WORLD-PROGRESSION.md`, `design/current/06-UI-SCREEN-CONTRACT.md`

Primary ownership:
- `src/game/screens/AdventureScreen.jsx`
- directly related Adventure/Exploration UI tests only

Use existing domain/runtime APIs; do not reimplement:
- `explorationStatusForGame`
- `performGameExploration`
- canonical stage/world APIs exposed by W-210

Do not edit:
- `src/App.jsx`
- Battle/Capture/Monster/Dex/Evolution screens
- engine/progression/domain implementations
- shared/global CSS authority files

Required changes:
1. Make canonical exploration actually reachable from Adventure.
   - show current exploration-point count
   - show cost `5` per exploration
   - perform exploration through `performGameExploration`, never a local probability formula
   - show child-readable result for normal material vs evolution-item result
   - show per-area pity progress
   - after five misses, the sixth run requires child selection from only the eligible regional item choices returned by the domain; pass that choice as `choiceItemId`
   - do not invent boss bonus item-selection policy
2. Remove superseded transition-trial UI.
   - no `evo` / `シンカ` stage filter for obsolete `evolution-trial` stages
   - no `evolutionReward` stage-card reward copy
   - no recommendation priority for obsolete transition trials
3. Remove stale boss gate copy based on `minAreaClears`.
   - short lock reason must reflect canonical world/boss progression
4. Reduce duplicated navigation.
   - one clear area/world navigation representation; do not keep both a world route and a second equal-weight area-tab system
   - keep zone choice and short danger/level cues
5. Keep normal encounter list focused.
   - default daily candidates remain maximum five meaningful encounters
   - filters/search are progressive disclosure rather than permanent primary controls

Acceptance:
- a child can earn exploration points from learning and spend them from Adventure without hidden/dev-only calls
- 5pt cost / 20% item outcome / per-area pity behavior is delegated to domain and behaviorally covered
- sixth-run choice is restricted to domain-returned eligible regional items
- no active UI mentions dedicated evolution-transition trials or `minAreaClears`
- one area/world navigation representation
- default encounter candidates <= 5
- full `npm test` PASS
- production build PASS
- iPhone WebKit E2E PASS

---

## W-216 — Battle / Capture / duplicate-settlement completion

Branch: `rebuild/w-216-battle-capture-ui`
Canonical: `design/current/02-BATTLE-TICKETS-BALANCE.md`, `design/current/03-CAPTURE-DUPLICATES.md`, `design/current/06-UI-SCREEN-CONTRACT.md`

Primary ownership:
- `src/game/screens/BattleScreen.jsx`
- `src/game/screens/CapturePanel.jsx`
- directly related Battle/Capture UI tests only

Use W-210/W-203/W-204 public APIs. Do not recreate probability, settlement, evolution, or shard rules in JSX.

Do not edit:
- `src/App.jsx`
- Adventure/Monster/Dex screens
- engine/progression/domain implementations unless a blocking API defect is proven; if found, stop and report rather than silently taking W-210 ownership
- shared/global CSS authority files

Required changes:
1. Capture presentation.
   - consume canonical `capturePresentation.frames`
   - show the four stars lighting sequentially over time; do not roll probability in the UI
   - success must visually complete all four stars
   - failure must never fake four completed stars
   - star/Japanese ring label/recommendation is primary representation
   - exact percentage, if retained, is secondary/detail rather than the main button message
2. Correct first-capture messaging.
   - a newly caught monster is kept as a distinct BOX instance
   - do NOT claim it is automatically inserted into the current team
3. Complete duplicate flow.
   - when canonical settlement is `pending_duplicate_choice`, present one focused choice: `なかまにする` / `おうえんにかえる`
   - resolve through existing domain/shared-runtime API
   - pending choice must remain recoverable after save/reload; UI must render it from persisted state, not only transient component state
4. Complete growth-shard flow.
   - surface current shard count when support conversion occurs
   - when enough shards exist, allow redemption only to a current-team monster using existing `redeemGrowthShardXp` API
   - show resulting XP/level/evolution outcome without duplicating domain calculations
5. Evolution result handoff.
   - automatic level/held-item evolution returned by shared runtime (`evolutionsByInstance` or equivalent) must reach `EvolutionCelebration`
   - do not ask the child to manually re-trigger a level/held-item evolution after the runtime already performed it
   - manual stone evolution remains Monster-owned
6. Remove stale transition-trial reward copy (`stage.evolutionReward`).
7. Do not invent failed-capture action economy. W-210 intentionally preserves the existing compatibility behavior because this product decision remains blocked.
8. Audit date/day helper import; use the canonical active learning/runtime day representation rather than resurrecting legacy duplicate state.

Acceptance:
- temporal 4-star capture presentation is behaviorally tested
- no UI-side reroll/probability state machine
- first capture does not mutate team or claim auto-team insertion
- duplicate keep/support choice is reachable and reload-safe
- 3 growth shards can be redeemed to exactly one current-team monster through canonical API
- automatic battle-earned evolution is celebrated once
- no stale evolution-trial reward message
- full `npm test` PASS
- production build PASS
- iPhone WebKit E2E PASS

---

## W-217 — Monster art production queue / family review preparation

Branch: `rebuild/w-217-monster-art-production-plan`
Type: asset-production preparation / no runtime logic / no image generation
Canonical: `design/current/09-MONSTER-MASTER-ART-SPEC.md`, normalized description shards, W-213 asset audit

Primary ownership:
- new files only under `design/rebuild/asset-production/`
- no runtime/source/test files
- no edits to canonical asset manifest in this Work Item

Required work:
1. Consume W-213 exact repository audit.
   - m001-m020 are reviewable CANDIDATE assets, not FORMAL
   - m021-m238 are genuinely missing per-ID visual assets
   - m239 remains excluded
2. Build an actionable family-based production/review queue for all active m001-m238.
   - group by evolution family, never isolated species when family continuity matters
   - preserve canonical name, type, motif, familyConcept, personalityArc, description, graphicCore, expressionAndPose, silhouette
   - no new lore when baseline/current already provides it
3. Define batches suitable for later parallel image production/review.
   - target roughly 10-15 independent family batches at a time where practical
   - stage-1 friendly/simple -> middle visibly grown -> final imposing/clear silhouette
   - include explicit file target convention `public/monsters/mNNN.webp`
   - each batch must include acceptance checks: ID/name match, no text baked into art, transparent/clean background, game-safe crop, family continuity, no duplicate silhouette, <1MB target when formalized
4. Separate review paths.
   - candidate-review queue for m001-m020
   - missing-art generation queue for m021-m238
   - do not promote anything to FORMAL
5. Produce a machine-readable queue/inventory plus a concise operator guide so a future art worker can take one batch number without re-reading project history.

Acceptance:
- exact active scope m001-m238, no gaps/duplicates, m239 absent
- every active species belongs to exactly one review/production batch
- family members are not accidentally split across conflicting visual directions
- m001-m020 remain CANDIDATE pending explicit approval
- m021-m238 remain missing/production-needed until actual reviewed files exist
- no images generated
- no manifest/runtime/source/test modifications

---

## Wave C commander gate

Commander reviews W-214..W-217 together after all PRs return.

Before the next wave:
- integrated unit/integration tests must pass
- production build must pass
- iPhone WebKit E2E must pass
- Home/Study/Adventure/Battle/Capture must have no known CURRENT-vs-UI drift in their primary child path
- canonical exploration, duplicate settlement, growth-shard redemption, and automatic evolution celebration must be reachable through product UI

If green, launch the final engineering wave from the integrated base:
- visual/CSS authority consolidation + 390px/375px iPhone polish
- full child vertical-slice behavioral E2E/regression
- PWA/offline/release readiness and dead legacy-path cleanup

Full formal monster-art production/review is a parallel asset stream and must not be faked by promoting placeholders/candidates.