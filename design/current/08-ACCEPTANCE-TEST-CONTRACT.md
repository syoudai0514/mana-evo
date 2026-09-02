# ManaEvo CURRENT — Acceptance / Test Contract

- Date: 2026-08-25
- Work item: W-108
- Status: **CURRENT CANONICAL — BEHAVIORAL ACCEPTANCE CONTRACT**
- Scope: acceptance/test contract only. This document does **not** change `src/**` or `tests/**`.

## 0. Authority and conflict rule

This contract follows the rebuild authority order and commander decisions in `design/rebuild/DECISION-LOG.md` D-003 through D-014.

Primary evidence used here:

- exact FINAL-CORRECTED baseline under `design/baseline/FINAL-CORRECTED/source/`
- `06-battle-and-progression-design.md`
- `08-gameplay-state-spec.md`
- `09-implementation-traceability.md`
- `10-BRAND-AND-REPOSITORY-SPEC.md`
- `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- `99-IMPLEMENTATION-REVIEW-CHECKLIST.md`
- Phase 1.5 audits under `design/rebuild/audit/`
- commander decisions D-003〜D-014

Runtime and existing tests are evidence of current behavior only. They are **not** specification authority. If an existing test conflicts with this contract or a commander decision, the test is a refactor/replacement candidate; the product is not changed merely to make the old test pass.

## 1. Test policy

### 1.1 Product behavior is the acceptance boundary

A canonical acceptance test should observe one or more of:

- user-visible state or navigation
- persisted game/learning state
- reward/accounting result
- allowed/blocked action
- stable master/data invariant
- offline/update behavior
- viewport behavior at the supported child device size

CSS selector names, source-string existence, stylesheet import order, cache version literals, component class names, and DOM implementation shape are **not** product acceptance by themselves.

### 1.2 Test layers

Use three explicit layers so tuning and implementation details do not silently become product rules.

1. **CANONICAL GATE** — must pass before release; assertions in this document.
2. **TUNING GATE** — balance defaults such as exact zone level bands/clear counts. These may be adjusted under the tuning policy without reopening product decisions.
3. **IMPLEMENTATION GUARD** — low-level regression checks that are useful locally but do not outrank canonical behavior.

### 1.3 Determinism and idempotency

- Random systems must be tested with deterministic RNG/seeds or boundary injection; do not use flaky probability tests.
- Rewards, migrations, battle settlement, imports, and one-time unlocks must be tested for **exactly-once** behavior.
- Reload/crash simulations must verify persisted state, not only in-memory state.

---

# 2. Learning → rewards

## AC-LRN-001 — Kids Quest learning remains the learning authority

**Given** ManaEvo is running its active learning flow  
**When** a child studies, changes grade within allowed settings, uses `わからない`, enters review/SRS, free study, or a star trial  
**Then** the learning behavior comes from the migrated Kids Quest learning source, not an independently reimplemented ManaEvo learning engine.

Acceptance evidence:

- active learning routes use the authoritative migrated Kids Quest modules
- stable learning IDs such as `knowledgeId`, `unitId`, `skillId`, and `questionInstanceId` are not changed incidentally
- Kids Quest learning regression behavior remains intact after the ManaEvo reward bridge runs
- `src/study` must not silently become a second active learning authority

## AC-LRN-002 — Daily core completion rewards are exactly-once

**Given** today’s five core learning tasks are not all complete  
**When** the final required core task becomes complete for the first time that day  
**Then** ManaEvo grants exactly:

- battle ticket `+3`
- exploration points `+2`
- `ほしのわ +3` under the later-approved ring economy

Reopening, reloading, revisiting the completed task, or replaying a completion event must not grant the daily completion package again.

## AC-LRN-003 — Extra question rewards are per completed question and unlimited

**Given** the daily core is complete and the child answers extra learning questions  
**When** each extra question is completed  
**Then** each completed extra question grants:

- battle ticket `+1`
- exploration point `+1`

There is no daily cap on extra-question tickets.

The three-question shape of a Kids Quest extra task does **not** change the reward unit: the ticket is per completed extra question, not one ticket for the whole task.

## AC-LRN-004 — Later-approved ring rewards are preserved

The canonical ring reward bridge is:

- daily completion → `ほしのわ +3`
- every three correct additional-learning answers → `ほしのわ +1`
- unit MASTER → `ぎんのわ +1`
- hard MASTER → `きんのわ +1`

Milestone rewards are exactly-once per qualifying milestone event. The additional-learning star counter must cross the three-correct boundary correctly across task/reload boundaries.

## AC-LRN-005 — Other exploration-point learning grants remain baseline behavior

- mastery step-up → exploration points `+2`
- chapter test first pass → exploration points `+5`

Repeated already-earned milestones do not duplicate the grant.

## AC-LRN-006 — Free study does not mint battle tickets

Free study remains available through the Kids Quest learning system, but completing free-study questions does not mint the daily core or extra-question battle-ticket rewards.

---

# 3. Ticket lifecycle

## AC-TKT-001 — Seven-day lots and FEFO

Each ticket grant retains its own earning/expiry lot. Tickets are valid for seven days according to the canonical date representation and are selected nearest-expiry first (FEFO).

Day rollover must not zero all tickets.

## AC-TKT-002 — Battle start reserves one ticket

**Given**:

- today’s required learning is complete for the current day
- the selected stage is unlocked
- at least one unexpired ticket is available
- there is no conflicting active battle

**When** battle starts  
**Then** exactly one nearest-expiry ticket is reserved and its original lot/expiry is attached to the persisted active battle.

No second ticket is reserved by rendering, navigation, reload, or restoring that same active battle.

## AC-TKT-003 — Win/capture commits; defeat/explicit abandon refunds

- victory settlement commits the reserved ticket
- successful in-battle capture commits the reserved ticket
- defeat refunds the reservation exactly once
- explicit battle abandon refunds the reservation exactly once
- refund restores the original expiry, not a fresh seven-day life
- if that original expiry has already passed, preservation of the expiry must not create a newly usable ticket

## AC-TKT-004 — Crash/reload is idempotent

Reloading with an `activeBattle` resumes the same battle/reservation. Reloading around settlement must never create both a committed and refunded copy, nor consume two tickets for one battle.

---

# 4. Adventure → Battle

## AC-ADV-001 — Adventure may be browsed without bypassing the study gate

The child may navigate to Adventure according to the UI contract, but a battle cannot start unless the current-day learning gate, stage-unlock gate, and ticket gate all pass.

If battle start is blocked, no ticket is reserved and no battle state is created.

## AC-ADV-002 — Encounter selection starts exactly one persisted battle

Selecting an eligible encounter and confirming battle creates one `activeBattle` bound to that stage/encounter and the reserved ticket. Repeated taps or reload must not create duplicate battles or duplicate reservation.

## AC-ADV-003 — World tuning is not a hidden product decision

Entrance/mid/deep progression and bounded enemy level bands are canonical direction, but exact zone level ranges and exact zone-clear counts are `TUNING-DEFAULT` values. Tests may cover them in a tuning suite, but they must not be treated as immutable product acceptance unless promoted by a later canonical decision.

---

# 5. Capture and duplicate choice

## AC-CAP-001 — In-battle eligibility

Capture becomes available only while the enemy is still in battle and its HP is `<= 50%` of max HP. Above 50%, capture is blocked and no ring/attempt is consumed.

## AC-CAP-002 — Ring performance and three-attempt limit

Canonical ring behavior:

- `ほし` ×1.00
- `ぎん` ×1.20
- `きん` ×1.50
- `にじ` = 100%
- non-rainbow final success probability cap = 92%
- maximum three capture attempts per battle

Probability tests must inject deterministic RNG/boundaries. They must not rely on statistical luck.

## AC-CAP-003 — Child-facing capture presentation

The child-facing primary representation is ease/recommendation, such as a five-step ease indication and recommendation wording. Exact percentage is secondary/detail information.

A capture attempt uses the ManaEvo four-star temporal presentation: four stars progress in sequence toward a completed ring; success closes the ring, while failure breaks the sequence. A test that only finds four star elements in the DOM is insufficient — the temporal progression must be observable.

## AC-CAP-004 — Attempt accounting

Each actual throw consumes exactly one selected ring item and one of the maximum three attempts. A blocked attempt consumes neither.

**Canonical-detail dependency:** the exact enemy-turn continuation after a failed throw must follow the W-103 capture canonical. Existing runtime currently gives the enemy a turn, but W-108 does not elevate that implementation detail beyond the capture-domain canonical.

## AC-CAP-005 — First catch is automatic

On the first successful catch of a species:

- the species is marked caught in the active dex
- one monster instance is added to the player’s collection
- no duplicate-choice prompt is required

## AC-CAP-006 — Second and later catches require duplicate choice

On a later successful catch of the same species, settlement pauses for exactly one child choice:

1. `なかまにする`
2. `おうえんにかえる`

The game must not silently auto-add a second instance before that choice is resolved.

## AC-CAP-007 — `なかまにする`

Choosing `なかまにする` creates a distinct monster instance while preserving species identity and per-instance history fields such as nickname/catch date/used ring/learned moves/level where supported by the save model.

## AC-CAP-008 — `おうえんにかえる` and growth shards

Choosing `おうえんにかえる`:

- does not add the duplicate monster instance
- grants `そだちのかけら +1`

Exactly three growth shards can be consumed to grant `育成XP +30` to one selected current-team monster. The operation consumes exactly three shards and grants the XP exactly once.

---

# 6. XP / raising

## AC-XP-001 — Canonical XP curve and compatibility cap handling

Level progression uses the baseline canonical cumulative curve:

`totalXp(L) = round(6 × (L - 1)^1.9)`

The product's final level cap is **not an approved canonical decision**. W-102 records the existing Lv100 clamp as a compatibility value that may be preserved until a separate product decision is made. Therefore the CANONICAL GATE must not assert “Lv100 is the product's final cap” as an immutable rule; a Lv100 clamp may only be covered as an implementation/save-compatibility guard while that decision remains unresolved.

Level/XP normalization must be deterministic for the same saved value.

## AC-XP-002 — Reward application is exactly-once

Learning XP, battle XP, and growth-shard XP must be applied exactly once to their canonical recipients. Reloading a reward/result screen must not replay XP.

## AC-XP-003 — Level-up is reflected immediately

When XP crosses one or more level thresholds:

- new level/stats are reflected immediately
- evolution readiness is recomputed immediately
- the same monster `instanceId` remains the player’s instance

## AC-XP-004 — Evolution never makes a monster numerically weaker at base-stat transition

Across the active canonical evolution transition set, evolution must not reduce any of the four canonical base stats relative to the prior form. This is a machine-checkable data invariant, not a visual-only test.

---

# 7. Normal evolution

## AC-EVO-001 — Active transition integrity

The active No.001〜238 master exposes exactly the canonical 155 normal evolution transitions. Every transition has a valid active source/target and a recognized method.

## AC-EVO-002 — Level evolution

When a monster reaches the canonical required level, it becomes eligible. Evolving:

- changes the species to the canonical target
- preserves the same monster instance identity and applicable instance history
- marks the target form in the dex
- applies updated stats immediately

## AC-EVO-003 — Consumable-item evolution

When the required evolution item is present, evolution may consume exactly one required item and transition exactly once. Re-render/reload cannot consume a second copy for the same completed evolution.

## AC-EVO-004 — Held-item level-up evolution

Held-item evolution is triggered by the next actual level-up while the required item is held. It is not converted into an invented fixed-level threshold.

## AC-EVO-005 — Self-evolution discovery is recorded

When a form that participates in the self-evolution world gate is obtained by the player’s own evolution, `evolutionDiscoveries` records that discovery and preserves it across save/load.

---

# 8. Evolution-item exploration and pity

## AC-EXP-001 — Five points buys one exploration

Exploration costs exactly five exploration points. A successful start deducts five points once. There is no daily exploration-count cap.

Only unlocked regions can be selected for exploration.

## AC-EXP-002 — Exploration always returns a result

Each exploration returns either:

- normal material, baseline weight 80%
- a regional evolution item, baseline weight 20%

The test must verify configured branches deterministically rather than run a flaky random-rate sample.

## AC-EXP-003 — Pity is regional and persistent

For each area independently:

- a normal-material result increments that area’s miss count
- an evolution-item result resets that area’s miss count to zero
- save/load preserves the miss count
- exploring another area does not alter this area’s count

## AC-EXP-004 — Sixth-run choice guarantee

After five consecutive evolution-item misses in one area, the **start of the sixth exploration** offers a choice of one evolution item from that region.

Choosing the guaranteed item resets that area’s miss count to zero.

There is no separate pre-registered “target item” state required by the canonical design.

## AC-EXP-005 — Boss first-clear bonus

The first clear of a regional boss grants one regional evolution item once. Re-clearing the same first-clear reward must not duplicate it.

## AC-EXP-006 — Dedicated evolution trial is not the sole canonical acquisition source

A test must not require “all 32 item evolutions receive their item only from deterministic dedicated transition trials.” D-008 restores exploration/pity as the canonical acquisition system. A dedicated trial may remain only if separately approved for another purpose; it cannot replace exploration/pity by test fiat.

---

# 9. Self-evolution world unlock

## AC-WLD-001 — Second form first acquisition is self-evolution

For forms governed by the self-evolution-first world rule, normal wild access remains locked until that species has been obtained through the player’s own evolution.

Having the species in `dex.caught` alone is not sufficient if `evolutionDiscoveries` is absent.

## AC-WLD-002 — Discovery unlock persists

After the self-evolution occurs:

- `evolutionDiscoveries[targetSpeciesId] = true` or equivalent canonical record persists
- eligible later-world wild access can unlock according to the current adventure placement/tuning gates
- save/load does not lose the discovery

## AC-WLD-003 — Final forms are not ordinary wild catches

Final evolved forms covered by the progression rule must not appear as normal wild-capture targets. Boss/event/specially approved appearances are separate from ordinary wild capture.

## AC-WLD-004 — Source `area` and adventure placement are not conflated

Tests must not rewrite baseline/source `area` merely because a form is placed in a different adventure area/zone. Source classification and adventure placement are separate layers.

---

# 10. Boss learning gate and rematch

## AC-BOSS-001 — Per-area learning gate

A regional boss becomes challenge-eligible only when that area has both:

- `progressPoints >= 12`
- at least `2` unique skill IDs

Canonical point grants for this gate:

- core task first completion → `+1`
- mastery milestone → `+2`
- chapter test first pass → `+3`

Already-earned repetitive/easy-loop events do not mint duplicate boss progress.

## AC-BOSS-002 — Progress is area-local

Boss progress is stored per area. When a new area unlocks, that new area starts at `0` points and an empty unique-skill set. Progress from an earlier area is not carried forward.

## AC-BOSS-003 — Boss clear unlocks the next area

The first clear of Area 1/2/3 boss unlocks the next normal area in sequence. A test must not substitute “five wild clears” for the boss challenge learning gate.

## AC-BOSS-004 — Normal rematch preserves growth advantage

On the first normal boss encounter, the canonical boss balance snapshot is saved. A later **normal** rematch uses the locked snapshot so raising the player team can make the rematch relatively easier.

## AC-BOSS-005 — Challenge rematch may rescale

A separately selected challenge rematch may build a newly scaled challenge plan. Challenge scaling must not silently replace the locked normal-rematch experience.

## AC-BOSS-006 — `balanceVersion` replacement is saved once, then re-locked

If an old snapshot is invalid because the balance version changed:

1. compute the replacement normal snapshot
2. persist that replacement snapshot
3. subsequent normal rematches reuse the replacement snapshot

Computing a replacement without saving it is an implementation drift and must fail the canonical test.

---

# 11. Giga / Burst

## AC-FORM-001 — Canonical eligible sets remain disjoint

The active master has:

- 12 Giga species
- 8 Burst species
- zero overlap between the two sets

The exact species set must match the canonical active master/forms data. Baseline names include the 12 Giga targets and 8 Burst targets from `scripts/forms.mjs`; tests should resolve stable active IDs from the canonical master rather than infer eligibility from UI text.

## AC-FORM-002 — One battle cannot stack Giga and Burst

A battle may use at most one of the special-form systems for the player side according to the canonical unlock/ownership gates. Activating one blocks activation of the other in that same battle.

## AC-FORM-003 — Giga effect

Giga applies `×1.35` to all four battle stats, including max HP. Current HP converts by preserving HP ratio on activation and again when reverting.

## AC-FORM-004 — Burst effect and duration

Burst applies:

- max HP `×2.0`
- attack `×1.2`
- duration `3` turns
- Burst move power `110`
- Burst move accuracy `95%`

On ending Burst, current HP converts back by preserving HP ratio. A monster at `0 HP` remains `0 HP`; form expiration must not become a revive mechanic.

## AC-FORM-005 — Special-form result is persistent where canonical data requires it

Dex/form-discovery records and one-time unlock ownership must persist exactly once across save/load. Reopening a result screen must not mint another unlock item/mark/core.

---

# 12. Save / profile / migration

## AC-SAVE-001 — Profile isolation

Create at least two profiles A and B. Mutating A’s learning progress, team/box, tickets, dex, world progress, exploration pity, evolution discoveries, or active battle must not mutate B’s corresponding per-profile state.

Switching A → B → A restores each profile’s own state without cross-profile leakage.

## AC-SAVE-002 — ManaEvo storage is isolated from Kids Quest

ManaEvo writes only to its own storage/cache namespace. Normal ManaEvo operations, reset/delete, migration, and cache cleanup must not mutate Kids Quest localStorage/IndexedDB/cache data.

## AC-SAVE-003 — Optional Kids Quest progress import is read-only and one-way

If compatible Kids Quest learning progress is imported:

- Kids Quest source is read-only
- data is copied into ManaEvo
- an import marker/version is stored on the ManaEvo side
- a second import attempt is idempotent and creates no duplicates
- there is no live two-way sync after import
- Kids Quest game-specific monster/battle state is not auto-mapped without an explicit safe mapping

## AC-SAVE-004 — Legacy ticket migration preserves quantity without duplication

A legacy save that contains only a simple ticket count migrates once into compatible ticket lots without losing count. Re-running normalization/migration does not grant the same legacy tickets again.

## AC-SAVE-005 — Active battle survives reload without double reservation

A persisted active battle after migration/reload keeps one reservation and one battle identity. Migration cannot create an additional reservation or silently discard the battle in a way that duplicates/refunds tickets incorrectly.

## AC-SAVE-006 — Stable IDs survive migration

Monster instance IDs, species IDs, dex IDs, and stable learning IDs are not renamed merely for display-name/UI changes. Migration preserves referential integrity.

---

# 13. Active dex — 238

## AC-DEX-001 — Active species scope is exactly No.001〜238

The active game/dex/master scope contains exactly 238 species with stable No.001 through No.238 coverage and no duplicate IDs.

## AC-DEX-002 — No.239 is excluded from active gameplay but retained in baseline reference

No.239 `シラユキヒメ`:

- is absent from active species registry/dex denominator/ordinary encounters/active asset-required scope
- remains preserved in immutable baseline/reference data

A test must not delete No.239 from the baseline archive in order to make the active count 238.

## AC-DEX-003 — Dex progress uses the active denominator

Child-visible active dex progress and completion logic use 238 as the active species denominator unless a later canonical mode explicitly defines a filtered subset.

---

# 14. PWA / offline / update

## AC-PWA-001 — GitHub Pages is the official production target

The canonical production application loads from:

`https://syoudai0514.github.io/mana-evo/`

Build base, manifest navigation, asset paths, and service-worker scope must work under `/mana-evo/`.

## AC-PWA-002 — Install metadata is valid and ManaEvo-specific

Manifest `name`/`short_name`/`id`/`start_url`/`scope`, icons, Apple metadata, and launch metadata resolve to ManaEvo and do not collide with Kids Quest.

Tests may verify required icon files/dimensions, but exact source-code spelling is not the behavioral contract.

## AC-PWA-003 — Offline relaunch works after a successful online load

After the app has loaded successfully online and required app-shell assets have been cached, switching the browser context offline and relaunching `/mana-evo/` reaches the ManaEvo shell/offline-capable experience rather than a browser network error.

## AC-PWA-004 — Update does not strand stale shell or formal monster assets

Test an upgrade from build/cache version N to N+1:

- new app shell becomes active after the intended update flow
- a formally versioned monster asset resolves to the new version rather than being permanently shadowed by an old cache entry
- no mixed old/new shell that breaks navigation

The literal cache version string (for example `v8`) is not canonical; successful update behavior is.

## AC-PWA-005 — Cache cleanup is ownership-safe

ManaEvo service-worker update/cleanup removes only ManaEvo-owned caches and stays within `/mana-evo/` scope. Opening Kids Quest and ManaEvo in separate tabs and updating ManaEvo must not break `/kids-quest/` or remove its caches.

---

# 15. 390px child-flow UI

Target viewport for the canonical child acceptance flow: **390px portrait first viewport**.

## AC-UI-001 — One dominant child decision in normal states

At 390px width, each normal child screen presents one dominant primary action for the current state. Secondary information may exist through progressive disclosure, but competing permanent primary actions must not turn the first viewport into a dashboard.

## AC-UI-002 — Home primary action follows learning state

- learning incomplete → primary action is Study
- learning complete → primary action is Adventure
- an earned evolution is handled as a focused reward flow and does not silently replace the Home rule with a permanent third priority

## AC-UI-003 — Adventure does not duplicate navigation/browse controls

Normal Adventure must not simultaneously expose:

- world route **and** duplicate Area tabs for the same choice
- permanent search/filter controls
- a huge encounter list

Browse-all/search/filter may be progressively disclosed after the normal child choice.

## AC-UI-004 — Battle uses a state-driven command surface

Normal battle turn shows the battle state and currently actionable commands. Capture controls, team-switch flow, result flow, special-form explanations, and battle tips are not all permanently piled beneath the normal turn.

## AC-UI-005 — Capture is a focused state

After the child chooses capture, the capture decision becomes the focused state. Ease/recommendation is primary; exact percentage is secondary/detail. Normal battle clutter does not compete with the ring choice.

## AC-UI-006 — Monster screen is not Team + Box + Dex + tutorial at once

Normal Monster state makes the team/selected monster the primary context. Box, Dex, special-form details, move detail, and general evolution tutorials are secondary routes/states rather than simultaneous permanent panels.

## AC-UI-007 — First viewport is actually usable

Browser/screenshot/E2E verification at 390px must show:

- primary CTA visible without horizontal clipping
- no content hidden beneath unsafe top/bottom areas
- no horizontal page overflow in the canonical child screens
- focused Battle/Capture/Evolution states are visually owned by the active flow

Passing by finding a CSS class name is insufficient.

## AC-UI-008 — Canonical child-flow E2E

With deterministic fixture data, the suite must exercise a representative child journey:

Home → Study → daily completion/reward → Adventure → eligible Battle → Capture → caught Monster → raising/evolution-ready state → focused Evolution result.

The E2E asserts actions, state changes, and visible decisions; it does not assert stylesheet import order.

---

# 16. Existing test disposition

No tests are edited in W-108. The following are explicit candidates for later replacement/refactor when implementation work starts.

| Existing test | Current issue | Canonical disposition |
|---|---|---|
| `tests/premium-ui-v4.test.js` | Explicitly requires `premium-ui-v4.css` to load after `runtime.css` and asserts classes such as `premium-world-map`, `encounter-art`, showcase classes | **REFACTOR.** Replace import-order/class assertions with AC-UI-001〜008 viewport/flow behavior. CSS load order must not be visual authority. |
| `tests/mockup-ui-v3.test.js` | Reads source/CSS text and freezes `game-bottom-nav`, mockup class names, `Mockup UI v3`, `--me-gold` token presence | **REFACTOR.** Keep desired navigation/CTA behavior, drop implementation-name/token authority. |
| `tests/trace-layout.test.js` | Asserts exact CSS selectors/properties and that trace CSS loads after shared styles | **REFACTOR.** Preserve the actual behavior — trace canvas visible, controls below/not overlapped, header not covering instructions at mobile width — using browser layout/viewport assertions rather than selector/import order. |
| `tests/navigation.test.js` | Uses regex against `App.jsx` source to prove navigation wiring | **REFACTOR.** Replace with click/navigation tests that verify the user reaches the correct screen and battle gate cannot be bypassed. |
| `tests/pwa-assets.test.js` | Useful manifest/icon checks are mixed with exact `CACHE_NAME ... v8`, source-regex, and specific cache-strategy implementation assertions | **SPLIT.** Keep stable public contract checks; replace literal cache version/implementation strategy checks with AC-PWA-003〜005 offline/update behavior. |
| `tests/world-progression.test.js` | Requires story bosses to use `minAreaClears === 5`; exact area bands are hard-coded as product assertions | **REPLACE/RECLASSIFY.** Five-clear boss gate conflicts with D-009/AC-BOSS-001. Exact level bands belong TUNING GATE. Keep self-evolution/final-wild behavior where consistent. |
| `tests/progression-review-fixes.test.js` | Hard-codes exactly two wild first-clears for zone unlock | **RECLASSIFY.** Zone structure remains; exact clear count is a tuning default unless separately promoted. Keep `evolutionDiscoveries` behavior as CANONICAL GATE. |
| `tests/pr15-master.test.js` | Requires all 32 item evolutions to have deterministic transition-trial acquisition rows | **REPLACE acquisition assertion.** D-008/AC-EXP restores exploration/pity. Preserve valid master/evolution integrity assertions that do not make trial the sole acquisition source. |
| `tests/runtime-completion.test.js` | Requires 32 evolution trials and first-clear item grant; boss helpers depend on old clear-count gate | **REWRITE conflicting cases.** Replace with AC-EXP and AC-BOSS. Giga/Burst behavior can be retained/reworked where it matches AC-FORM. |

### 16.1 Explicit CSS/load-order refactor list

The minimum mandatory refactor set for the W-108 requirement is:

- `tests/premium-ui-v4.test.js`
- `tests/mockup-ui-v3.test.js`
- `tests/trace-layout.test.js`

These tests currently make stylesheet/class implementation details part of the pass condition. They must not block a canonical UI rebuild whose child behavior is correct.

---

# 17. Known current implementation/test deltas against this contract

These are implementation work for later phases, not changes to be made in W-108:

1. extra-question ticket reward currently drifts from per-question `+1` behavior
2. later-approved `ほしのわ +1` per three correct additional-learning answers is missing in current runtime
3. dedicated evolution-trial first-clear acquisition currently replaces the canonical exploration/pity source
4. current boss gate/test path uses wild-clear count instead of per-area `12 points + 2 unique skills`
5. duplicate capture currently lacks the canonical `なかまにする / おうえんにかえる` settlement and growth-shard loop
6. invalid old-version boss snapshots can be recalculated without persisting the replacement snapshot
7. capture star presentation must be verified as temporal four-stage progression, not only final star state
8. current UI architecture/tests rely on CSS load order/class preservation rather than the D-013 screen/child-flow contract

A release is not canonical merely because the old suite is green while one of these deltas remains.

---

# 18. Release acceptance gate

For an implementation PR claiming canonical completion of these domains, the minimum release evidence is:

1. `npm test` — after conflicting legacy tests have been migrated to the canonical/tuning/implementation categories
2. `npm run build`
3. `npm run test:e2e` with the canonical child flow and 390px viewport coverage
4. save/reload/idempotency cases for rewards, ticket reservation, boss snapshot, exploration pity, duplicate settlement, and migration
5. active dex master check: 238 active, No.239 absent from active runtime but retained in baseline
6. PWA browser test: install metadata, offline relaunch, update, and Kids Quest isolation
7. no acceptance test whose only justification is CSS import order/class/token existence

The final review must report the commit SHA and which AC IDs are covered by which test file/scenario. CI PASS alone is not proof of specification correctness; coverage must trace back to this behavioral contract.

---

# 19. D-021 iPad / Tablet responsive acceptance

This section is later cross-cutting authority under **D-021**. It adds tablet/rotation acceptance without replacing the existing 375〜430px mobile gate. CURRENT D-020 and `design/current/10A-DEX-OFFLINE-ART-PACK-ACCEPTANCE.md` remain the detailed Dex authority; AC-RSP is an additional responsive gate and must not relax or duplicate-away those semantics.

## AC-RSP-001 — Supported responsive range

Representative canonical fixtures cover:

- mobile baseline: existing `375 / 390 / 430` portrait coverage;
- Compact-boundary smoke: approximately `540–560px` width;
- tablet portrait: approximately `820x1180`;
- tablet landscape: approximately `1180x820`;
- reduced tablet/multi-window: approximately `600px` width;
- low-height interactive smoke: approximately `820x600` or an equivalent deterministic short-height fixture.

Exact device-model matching is not canonical. Current available layout viewport is the authority.

## AC-RSP-002 — Mobile baseline does not regress

Tablet support must preserve the existing 375〜430px iPhone portrait child contract, safe-area behavior, first decision, touch targets and screen ownership.

## AC-RSP-003 — Critical geometry is checked against the relevant bounded/clipping ancestor

Document/body `scrollWidth` alone is insufficient.

For required interactive surfaces, automated geometry must verify that required visible descendants remain inside the intended visible bounds of their relevant bounded/clipping ancestor unless overflow is an explicitly approved interaction.

Minimum surfaces:

- question/passage;
- choice grid;
- interaction wrap/keypad;
- fixed/centered learning feedback where it can cover decisions;
- Battle commands;
- Capture decision/result;
- Evolution continue CTA;
- Dex grid/detail/search controls;
- Adventure search when active;
- Parent PIN/forms.

`overflow-x:hidden/clip` does not convert required clipped content into PASS.

## AC-RSP-004 — Layout Surface mapping is behaviorally observable

Tests must cover representative Compact, Workspace and Contextual-interactive states without treating CSS class names as product authority.

- Compact remains centered/readable instead of expanding without limit.
- A Workspace state on representative tablet width must **not remain globally constrained by the Compact ~520px ceiling merely because it shares the application shell**. Its owning outer surface must be capable of exceeding the Compact ceiling while inner content may intentionally remain narrower.
- A Contextual-interactive state likewise must not inherit the Compact ceiling merely because it renders inside a top-level owner.
- Contextual primary decisions remain reachable/coherent in landscape and low-height.

The gate does not require an exact measured width of `760px`; it requires that the Compact ceiling does not leak into Workspace/Contextual surfaces.

## AC-RSP-005 — Learning rotation preserves transaction and active input

Start a deterministic learning question in tablet portrait, create meaningful in-progress state, resize/rotate to landscape and verify:

- same question identity/context;
- same unsubmitted selection/input where applicable;
- same attempt/progress semantics;
- active interaction owner/substate is not silently replaced/reset;
- no duplicate submit/reward;
- primary action remains reachable.

## AC-RSP-006 — Battle/Capture rotation preserves transaction and substate

Start a deterministic active Battle and resize/rotate while active. Verify:

- same Battle identity;
- no duplicate ticket reserve/turn/settlement;
- an already-open Capture/forced-switch or equivalent contextual subflow stays semantically active rather than silently closing/restarting;
- unsubmitted Capture selection remains semantically preserved where applicable;
- exact animation frame may differ, but no throw/result/settlement is replayed or duplicated and the flow does not return to a semantically different Battle state.

## AC-RSP-007 — Evolution acknowledgement survives rotation

While a deterministic Evolution reward/reveal acknowledgement is visible, resize/rotate and verify:

- same `from → to` evolution/reward context;
- acknowledgement/reveal is not silently dismissed;
- `つづける！` or equivalent completion action remains reachable;
- evolution/domain mutation and rewards are not executed/settled again;
- exact animation frame need not be identical if the same semantic acknowledgement remains continuous.

If Monster-origin and Battle-origin evolution use materially different responsive owner structures, implementation smoke should cover both entry paths.

## AC-RSP-008 — Dex rotation is cumulative with D-020

Resize/rotation continuity must preserve the CURRENT D-020 browse/history contract. D-021 does **not** replace or weaken:

- area;
- type;
- search;
- filter/tools state;
- ordered result;
- selected species;
- anchor species;
- viewport-offset semantics;
- explicit browser-history provenance;
- Grid→first detail `pushState`;
- detail previous/next `replaceState`;
- shared `restoreDexContext()` semantics;
- same-session remount recovery and orphan-detail prevention.

Existing D-020/10A acceptance may be reused as the base; AC-RSP adds the resize/rotation-specific delta rather than creating a weaker parallel Dex contract.

## AC-RSP-009 — Semantic position, not exact pre-rotation scroll pixels

Outside a stricter domain-specific contract such as D-020 Dex restoration, reflow may change physical coordinates. Assert the same semantic item/question/detail/anchor and usable route to the current primary action rather than the identical numeric pre-rotation `scrollY`.

## AC-RSP-010 — Low-height / keyboard / safe-area operability

In representative landscape/low-height conditions:

- the active primary CTA/command can be reached;
- fixed/sticky/feedback/overlay elements do not permanently cover it;
- required modal/sheet content remains operable;
- software-keyboard-sensitive Parent PIN/forms and Dex/Adventure search remain operable;
- supported iPhone/iPad safe-area regions do not hide required back/home/answer/command/continue controls.

## AC-RSP-011 — Actual Safari and standalone are separate manual release environments

Before production release of the orientation change, perform actual-device smoke on the declared supported generally available iPadOS release target(s) for both:

1. Safari browser presentation;
2. installed Home Screen Web App / standalone presentation.

Minimum smoke:

- portrait launch;
- landscape rotation;
- Learning rotation;
- Battle/Capture rotation;
- Evolution acknowledgement rotation;
- Parent + keyboard;
- Dex/Adventure search + keyboard where applicable;
- representative reduced/multi-window behavior where supported.

Playwright WebKit viewport resize is necessary automated evidence but does not replace actual iPadOS standalone-shell verification.

## AC-RSP-012 — Existing installed PWA upgrade is a release gate

Verify an already-installed ManaEvo Home Screen Web App upgrading from the prior portrait-preference version.

**PASS:** through the supported normal update lifecycle, the existing installed app reaches the target behavior where ManaEvo no longer imposes the prior portrait orientation preference and can use the supported portrait/landscape presentation contract.

Fresh install/reinstall may be diagnostic comparison evidence, but does **not** by itself make this gate pass.

If a demonstrated platform limitation prevents target behavior, production release remains **BLOCKED** until a separately reviewed compatibility/remediation policy defines affected clients, acceptable behavior/user action, remediation/communication and a release exit criterion. “Observed/diagnosed” alone is not PASS.

## AC-RSP-013 — Orientation unlock sequencing

The manifest portrait restriction must not be removed/released merely because D-021 is approved.

Before an orientation-unlocked implementation candidate proceeds to actual-device release verification, AC-RSP-001 through AC-RSP-010 must pass.

AC-RSP-011 and AC-RSP-012 are mandatory production-release gates after the orientation change can be exercised on actual device/installed client.

## AC-RSP-014 — Visual regression is supplemental

Representative screenshots may supplement the gate, but do not replace geometry/state assertions. Canonical success is un-clipped usable behavior and transaction/interaction continuity, not pixel-identical rendering across viewport classes.

---

# 20. D-029 / D-030 Bundle B later acceptance authority

This section is later authority for the Bundle B semantics approved in PR #151 V1.1. Where older AC-CAP / AC-EVO wording above leaves concrete capture tuning undefined or describes evolution eligibility without the new confirmation boundary, this §20 controls. Unrelated acceptance remains cumulative.

## AC-BB-CAP-001 — D-029 V1 TUNING-DEFAULT exact values

For `catchRank` 1..5, star-ball base chance at exactly HP50% is:

```text
0.55 / 0.42 / 0.28 / 0.16 / 0.10
```

At HP0 the added bonus is:

```text
+0.15 / +0.13 / +0.10 / +0.08 / +0.05
```

Between HP50% and HP0, the bonus interpolates linearly and monotonically. Tests assert these exact V1 values deterministically. They are **TUNING GATE** values: canonical for this implementation but explicitly retunable by a later approved playtest decision without redefining structural capture rules.

## AC-BB-CAP-002 — Multipliers / cap / guarantee / attempts remain structural

For the same base chance:

- star ×1.00;
- silver ×1.20;
- gold ×1.50;
- non-rainbow final chance <=92%;
- rainbow exactly 100%;
- maximum 3 attempts shared across pre-KO and post-win capture.

A failed post-win attempt consumes the selected ball/attempt but must not cause enemy retaliation, replay victory rewards, or create another ticket settlement.

## AC-BB-CAP-003 — Deterministic child bands

The current one-throw final probability maps exactly to:

- `<20%` → `かなり つかまえにくい`
- `20–<40%` → `つかまえにくい`
- `40–<60%` → `ふつう`
- `60–<80%` → `つかまえやすい`
- `>=80%` → `ほとんど つかまる`

Rainbow alone may carry guaranteed wording (`かならず GET` or equivalent). No non-rainbow path may claim guaranteed success.

## AC-BB-CAP-004 — Deterministic recommendation uses owned inventory

Given current owned counts and current one-throw chances:

1. recommend the weakest owned non-rainbow ball reaching `>=70%`;
2. otherwise recommend the owned non-rainbow ball with the highest chance;
3. do not automatically recommend rainbow for ordinary encounters;
4. an explicit encounter-level rainbow-recommendation override is effective only when rainbow is owned;
5. no usable owned ball → no recommendation.

Tests cover inventory permutations and ties without an implementation-defined “material improvement” threshold.

## AC-BB-CAP-005 — Capture economy boundary

Bundle B does not introduce a new acquisition source. Existing canonical star/silver/gold reward paths remain owned by learning/mastery contracts. Rainbow allocation remains unresolved/outside Bundle B. A runtime/test change that invents a rainbow source to make capture UX convenient fails this gate.

Representative deterministic resource-burn checks include early rank1/rank2 and rank3–5 cases; they validate that the reviewed tuning table is being used rather than running flaky statistical samples.

## AC-BB-BTL-001 — Domain returns actual ordered presentation trace

A semantic battle move transaction that may include both player and enemy actions returns an immutable ordered `presentationEvents[]` sidecar that follows the actual speed/action order.

For representative speed-order cases, assertions cover event identity/order and intermediate semantic facts including actor, move/action, hpBefore/hpAfter, effectiveness and terminal state as applicable. A before/after-only reconstruction or parsing display log text is insufficient.

## AC-BB-BTL-002 — Presentation never executes semantics

Once the semantic transaction has committed, UI timers/animation callbacks/SFX completion may only advance presentation state/cursor. They must not invoke:

- move/damage resolution;
- enemy AI;
- reward/XP/Mana settlement;
- ticket reserve/commit/refund;
- capture attempt/result settlement.

One child tap produces one semantic transaction. Re-render, timer completion, `animationend`, reduced-motion mode, or presentation replay cannot produce another turn/reward.

## AC-BB-BTL-003 — Battle experience sequence and accessibility

A deterministic child-flow browser test observes an enemy-appearance beat (`○○が あらわれた！`), then usable command state, ordered attack/impact/effectiveness feedback, and victory feedback where applicable. Existing ManaEvo WebAudio effects may be used; no external franchise identity is required/copied.

With `prefers-reduced-motion: reduce`, travel/shake motion is removed/reduced while semantic text, command reachability and independent sound setting remain usable.

## AC-BB-EVO-001 — Qualifying LvUP creates pending token without species mutation

For both `level` and `held_item_levelup`, a qualifying real LvUP:

- commits Lv/XP immediately;
- leaves the current species unchanged;
- creates one structured `pendingEvolution` token;
- exposes `シンカする！` / `あとで` in the appropriate result flow.

Stone evolution remains manually committed and does not create this token merely because a stone is owned.

## AC-BB-EVO-002 — Qualification ID is deterministic / confirmation exactly-once

`qualificationId` is derived deterministically from the causal semantic operation/reward identity + instanceId + from→to transition, not wall-clock/randomness.

Confirming the CURRENT matching token:

- changes species once;
- preserves instanceId/Lv/XP/history;
- writes the evolution discovery once;
- clears that token once.

Repeating the same confirm request or reopening result UI cannot perform another species mutation/reward.

## AC-BB-EVO-003 — Save/schema migration round-trips readiness

The implementation bumps/handles game schema explicitly. Normalization validates and preserves `pendingEvolution` rather than dropping it as an unknown box field.

Test matrix includes:

- local save → reload;
- cloud snapshot/hash round-trip;
- backup/export → restore/import where supported;
- profile A → B → A isolation;
- repeated migration idempotency.

Migration rules tested:

- matching legacy held-item `evolutionReady=true` source form → migration pending token;
- legacy level source form already at/above threshold → migration pending token;
- already-evolved species stays evolved;
- owned stone alone does not create pending token.

## AC-BB-EVO-004 — Held-item qualification persists and item is retained

A held-item pending token is earned by the historical qualifying LvUP. Swapping/removing the held item after qualification does not invalidate that token.

After confirmed held-item evolution, the held item is **not consumed**. Stone evolution remains the consumed-item class and spends exactly one stone once.

## AC-BB-EVO-005 — Delayed next-stage remains explicit and cannot brick

After confirming a delayed stage1 evolution:

- never automatically mutate again to stage2;
- if the newly reached species has a level transition already satisfied by the existing level, create a new separate pending token;
- require another explicit child confirmation for that next mutation.

If the compatibility max-level prevents any future LvUP and the newly reached species requires `held_item_levelup`, equipping the required held item may create a **max-level-recovery-only** pending token. The same equip-only behavior below max level must remain blocked.

## AC-BB-EVO-006 — `あとで` persists / active acknowledgement locks profile switch

Selecting `あとで` only dismisses the immediate prompt. Readiness persists and remains visible/actionable from Monster/BOX after reload.

An active evolution confirmation/reveal acknowledgement blocks child profile switching under D-023. A dormant pending token by itself does not block ordinary switching between already-registered profiles.

## AC-BB-BOX-001 — Family-first ordering preserves identity

Default `シンカ順` groups by evolution family, ordered by the family's lowest species No. Within a family, species order follows stage progression and same-species duplicates stay adjacent; same-species duplicates use level-desc then stable instanceId ordering.

Sorting does not merge duplicates, change instanceId, or change Team order.

## AC-BB-BOX-002 — Secondary level sort and evolvable-only filter

BOX provides:

- default `シンカ順`;
- one secondary `レベル順`;
- independent `✨ シンカできるだけ` filter/toggle.

The filter includes instances with valid pending evolution readiness. `GET順` is absent until authoritative acquisition timing is defined for legacy/new saves.

## AC-BB-RSP-001 — Bundle B mobile/tablet presentation gate

Automated WebKit covers representative 375 / 390 / 430 widths plus representative tablet responsive smoke for Battle/Capture/Evolution/BOX. It remains cumulative with AC-RSP and D-021.

At minimum verify:

- appearance/attack/hit/victory presentation does not permanently block the primary action;
- rotation/resize while FX is active preserves the same semantic Battle and does not duplicate move/reward/ticket/capture settlement;
- Capture exact detail/band/recommendation matches D-029;
- pending evolution prompt survives intended flow, `あとで` persists, and later BOX confirmation mutates once;
- family grouping/duplicate adjacency/evolvable filter remain usable;
- reduced motion remains usable;
- no new `!important`/clipping workaround is accepted as evidence of responsive correctness.

## AC-BB-REL-001 — Bundle B release evidence

An implementation PR claiming Bundle B completion must report the exact implementation head and map concrete tests to AC-BB-CAP / BTL / EVO / BOX / RSP IDs. Full unit/integration, production build, release-readiness and WebKit must pass on that exact head, followed by independent implementation review before merge/release.

Older AC-CAP/AC-EVO text remains provenance where non-conflicting; **D-029/D-030 and §20 are later authority** for the changed semantics.