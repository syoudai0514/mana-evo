# ManaEvo Rebuild — Phase 3 Work Items

Phase: implementation Wave A
Base branch for all workers: `rebuild/canonical-governance`
PR base for all workers: `rebuild/canonical-governance`

## Common worker rules

Before work, read in order:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/rebuild/PHASE-2-FINAL-REVIEW.md`
4. `design/current/` relevant canonical documents
5. this file / assigned Work Item
6. exact baseline only when a canonical document points back to unresolved evidence

For Phase 3:

- CURRENT canonical documents outrank existing runtime behavior.
- Do not re-open accepted product decisions because current tests/source disagree.
- Do not modify immutable baseline files.
- Do not merge to `main`.
- Do not edit another Work Item's owned files unless this Work Item explicitly allows it.
- Prefer extracting domain logic into owned modules over creating merge conflicts in large shared files.
- Add/update tests for the behavior implemented by the assigned Work Item.
- Old tests that encode superseded behavior may be updated/removed only within the assigned domain.
- Preserve save compatibility and idempotency.
- No Star Awakening.
- No runtime-as-spec reasoning.

All workers must finish: branch -> implementation/correction -> tests/validation -> commit -> push -> PR to `rebuild/canonical-governance` -> completion report.

---

## W-114 — Cross-canonical normalization

Branch: `rebuild/w-114-canonical-normalization`
Type: documentation/data-normalization; no runtime source

Required changes:

1. Normalize the level-cap wording between W-102 and W-108. `Lv100` may remain a current compatibility default but must not be a frozen product acceptance decision while W-102 records the product cap as unresolved.
2. Normalize all three monster-description shards to the same lossless schema:
   - `no`
   - `speciesId`
   - `name`
   - `familyNo`
   - `stage`
   - `type`
   - `motif`
   - `familyConcept`
   - `personalityArc` (full baseline family arc object)
   - `personalityArcContext` (stage-relevant string)
   - `description`
   - `graphicCore`
   - `expressionAndPose`
   - `silhouette`
3. Preserve exact baseline content; do not invent lore.
4. Update W-109 wording so it explicitly acknowledges the known later-data drift for `m236`: exact baseline/current canonical name = `ホシラディア`; later review CSV `ソラリオン` is not approved and is drift.
5. Backfill `USER-DECISION-EVIDENCE.md` for the recovered user decision that capture success grants the same Battle XP as defeat/victory. Do not invent additional XP recipients beyond W-103 evidence.
6. Create `design/current/00-START-HERE.md` as the sole normative current-design entry point. Link W-101 through W-109, manifest, and description shards; clearly label data masters/evidence/history/baseline as subordinate/non-normative.
7. Update `design/rebuild/PHASE-2-FINAL-REVIEW.md` status to `COMPLETE` when all above validate.

Validation:
- three description shards cover exactly m001-m238 once each, no gap/duplicate, m239 absent
- schema keys identical across all 238 records
- m236 canonical = ホシラディア
- no source/test/runtime changes

---

## W-201 — Learning / reward bridge implementation

Branch: `rebuild/w-201-learning-rewards-runtime`
Canonical: `design/current/01-LEARNING-REWARDS.md`

Primary ownership:
- `src/kids-quest-study/state/**` where reward events are emitted
- new/owned learning-to-game reward bridge module(s), preferably under `src/game/`
- learning/reward domain tests

Implement/fix:
- Kids Quest learning remains active authority; do not reimplement questions/SRS
- daily core exactly-once reward: ticket +3, later-approved star +3, exploration points +2
- extra reward unit = each cleared extra question: ticket +1 + exploration point +1, unlimited
- every 3 correct additional-learning answers -> star +1 with persisted counter semantics
- unit MASTER -> silver +1; hard MASTER -> gold +1
- mastery/chapter exploration grants per canonical
- free study does not mint battle tickets
- anti-spam hold/release behavior without deleting learning XP
- exactly-once/reload behavior

Do not edit:
- `src/game/engine.js`
- `src/game/worldProgression.js`
- UI screen architecture files owned by W-208

If an integration point currently lives in a shared game file, expose an adapter/event and leave the smallest explicit integration note for commander Wave B rather than taking another Work Item's file.

---

## W-202 — Battle / ticket / boss snapshot implementation

Branch: `rebuild/w-202-battle-ticket-runtime`
Canonical: `design/current/02-BATTLE-TICKETS-BALANCE.md`

Primary ownership:
- battle engine/core (`src/game/engine.js` and battle-specific modules)
- ticket reservation lifecycle module; extract ticket logic to an owned module if necessary
- battle-domain tests

Implement/fix:
- daily/stage/team/ticket new-battle gate
- reserve one FEFO ticket at battle start; commit on victory/capture success; refund original lot on defeat/explicit abandon; reload/crash resumes without second reserve
- exactly-once settlement
- team max3 / active1 / voluntary and forced switch semantics
- canonical damage/STAB/type immunity/critical/random/speed-tie behavior
- Protect and canonical status boundary where currently missing
- enemy AI must not read post-input switched-in choice unfairly
- boss first snapshot, normal-rematch lock, challenge rescale
- balanceVersion replacement snapshot must be persisted, then re-lock

Do not redesign capture probability/duplicate settlement. Preserve a stable interface for W-203/Wave B.
Do not edit W-201 learning state or W-205 world progression.

---

## W-203 — Capture / duplicate domain implementation

Branch: `rebuild/w-203-capture-domain-runtime`
Canonical: `design/current/03-CAPTURE-DUPLICATES.md`

Primary ownership:
- new/extracted capture-domain module(s)
- duplicate settlement / growth-shard domain state functions
- capture-domain tests

Implement as isolated reusable domain behavior:
- eligibility HP <= 50%, max 3 attempts
- ring multipliers 1.00 / 1.20 / 1.50 / rainbow 100%, non-rainbow cap 92%
- deterministic probability API with tuning constants separable from canonical boundaries
- capture-result state that supports the temporal 4-star presentation without changing final success probability
- first catch -> one distinct BOX instance
- duplicate -> unresolved choice until `なかまにする` or `おうえんにかえる`
- `おうえんにかえる` -> shard +1; 3 shards -> selected current-team monster XP +30
- catch Battle XP recipient contract from W-103
- idempotent settlement/reload

Parallel-conflict rule: do **not** edit `src/game/engine.js` or `src/game/GameScreens.jsx` in Wave A. Extract/provide functions and tests; Wave B integrates the module into the shared battle/UI flow.

---

## W-204 — Evolution / exploration / special-form domain implementation

Branch: `rebuild/w-204-evolution-exploration-runtime`
Canonical: `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`

Primary ownership:
- new/extracted evolution/exploration/special-form domain modules
- related domain tests

Implement:
- active 155 evolution transitions and stable-ID semantics
- level / stone / held-item-level-up trigger semantics
- successful own evolution writes `evolutionDiscoveries`
- exploration cost 5 points; unlocked area only; 80/20 result; per-area persistent pity; sixth-run choice after five misses; reset semantics
- boss regional-item bonus hook without inventing unresolved presentation detail
- Giga 12 / Burst 8 target IDs and canonical effects
- one special form per party per battle
- No.142 `m142 / ヘラクレオン`
- no Star Awakening

Parallel-conflict rule: do not edit `src/game/engine.js`, `src/game/worldProgression.js`, or shared UI screens in Wave A. Provide domain APIs and tests for later integration.

---

## W-205 — World / boss-progression implementation

Branch: `rebuild/w-205-world-progression-runtime`
Canonical: `design/current/05-WORLD-PROGRESSION.md`

Primary ownership:
- `src/game/worldProgression.js`
- new boss-progress/world-state helpers
- world/progression tests

Implement/fix:
- source area remains separate from adventure placement
- Area1-4 route and existing EX only as tuning/default where canonical says so
- entrance/mid/deep structural progression
- first-form wild principle
- second-form first acquisition by own evolution; `evolutionDiscoveries` unlock later evolved wild availability
- final forms not normal-wild catches
- boss eligibility = per-area >=12 learning progress + >=2 unique skills; remove current `minAreaClears=5` as boss-learning substitute
- first boss clear unlocks next area exactly once
- persisted current adventure location
- returning to old areas keeps visible growth advantage

Do not edit W-201 learning emitter, W-202 battle engine, or W-204 evolution module. Consume their future state through clear interfaces.

---

## W-206 — Save / profiles / Parent / PWA implementation

Branch: `rebuild/w-206-platform-pwa-runtime`
Canonical: `design/current/07-SAVE-PROFILES-PARENT-PWA.md`

Primary ownership:
- save/profile persistence and migrations
- Parent/profile platform wiring that does not overlap screen redesign
- Vite/GitHub Pages/PWA/manifest/SW/cache configuration
- platform tests

Implement/fix:
- stable per-profile learning+game ownership and safe switching
- idempotent migrations/imports
- ManaEvo storage/cache/SW isolation from Kids Quest
- optional one-way read-only compatible Kids Quest learning import
- GitHub Pages `/mana-evo/` production base as authority
- installable PWA manifest/icons references/SW scope/offline/update behavior
- monster asset cache revision mechanism compatible with manifest-driven art updates
- Vercel remains non-authoritative/history

Do not change game-domain rules or redesign child screens.

---

## W-207 — Monster data / MonsterArt runtime foundation

Branch: `rebuild/w-207-monster-data-art-runtime`
Canonical:
- `design/current/09-MONSTER-MASTER-ART-SPEC.md`
- `design/current/monster-asset-manifest.json`
- normalized description shards once W-114 is merged; until then tolerate both Phase-2 shard shapes in tooling but do not invent data

Primary ownership:
- monster runtime data resolver/generator
- `PlaceholderMonster.jsx` / replacement `MonsterArt` resolver and dedicated art-resolution tests
- no broad screen layout edits

Implement/fix:
- active m001-m238 only; m239 excluded from active game
- stable-ID-based identity
- known drift `m236` must resolve to canonical `ホシラディア`, not unapproved `ソラリオン`
- one manifest-driven MonsterArt path
- only FORMAL assets render as formal in normal gameplay; CANDIDATE/MISSING -> canonical placeholder
- remove number-range/path guessing such as special `<=20` SVG behavior
- safe missing/broken formal fallback
- expose description data for Dex/Monster UI without copying lore into components

Do not approve/regenerate art in this Work Item.

---

## W-208 — UI structural refactor / navigation ownership

Branch: `rebuild/w-208-ui-structure-runtime`
Canonical: `design/current/06-UI-SCREEN-CONTRACT.md`

Purpose: prepare the current monolithic UI for parallel Wave B screen rebuild **without changing game rules**.

Primary ownership:
- `src/App.jsx`
- `src/game/GameScreens.jsx`
- new per-screen/component modules created by splitting these files
- navigation/focused-state ownership tests

Implement:
- split monolithic `GameScreens.jsx` into clear screen owners for Adventure/Battle/Capture/Monster/Dex/Evolution as practical
- establish top-level Home/Study/Adventure/Monster/HowTo navigation ownership
- Battle/Capture/Evolution remain focused/contextual, not competing top tabs
- preserve current working behavior while removing duplicated navigation ownership
- create stable component boundaries so later UI workers can edit separate files

Do not perform full visual redesign in Wave A.
Do not add a new global override CSS layer.
Do not alter battle/capture/evolution/world rules to make the refactor easier.

Acceptance: Wave B can assign Home/Adventure, Battle/Capture, Monster/Dex/Evolution to separate workers without all editing one giant file.

---

## W-209 — Active monster data-master reconciliation

Branch: `rebuild/w-209-monster-master-reconcile`
Type: data master reconciliation; no runtime source

Review the current derived 238 data masters against exact baseline plus confirmed later decisions.

At minimum:
- active IDs exactly m001-m238 / 83 families
- No.239 excluded active/reference only
- name/type/source area/family/stage/evolution identity match authority precedence
- preserve confirmed No.142 current official `ヘラクレオン`
- correct known unapproved m236 later-data drift from `ソラリオン` to canonical `ホシラディア`
- verify all 155 evolution links after corrections
- verify Giga12/Burst8 stable IDs
- do not re-promote dedicated evolution-trial acquisition from obsolete `14e`
- update validation/index claims if a previous `mismatch 0` statement was demonstrably false before correction

Outputs may update derived data-master files and validation documentation, but must not edit immutable baseline or runtime source.

---

## Wave A integration gate

Commander reviews W-114 and W-201 through W-209 together.

Then:

1. W-114 finalizes normalized CURRENT entry point.
2. Merge conflict-free domain foundations into governance.
3. Run one integration work item for shared engine/state adapters if needed.
4. Launch UI Wave B in parallel using W-208 screen boundaries:
   - Home/Study/Adventure
   - Battle/Capture
   - Monster/Dex/Evolution
   - HowTo/Parent
   - visual/CSS ownership and 390px polish
   - behavioral E2E/regression
5. Final PWA/build/release audit.
6. Only after full acceptance, promote governance/rebuild result toward `main` and production.
