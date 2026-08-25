# ManaEvo Rebuild — Phase 3 Wave B Work Items

Status: ACTIVE
Base branch for all workers: `rebuild/canonical-governance`
PR base for all workers: `rebuild/canonical-governance`

## Why this wave exists

Wave A W-114 / W-201..W-209 is now integrated on the commander branch. The first integrated CI exposed a real shared-runtime seam: isolated canonical domain modules are correct, but several old shared runtime paths still bypass them. Do not hide this by weakening canonical tests or restoring superseded behavior.

Before work, read in order:
1. `REBUILD-START-HERE.md`
2. `design/current/00-START-HERE.md`
3. `design/rebuild/DECISION-LOG.md`
4. `design/rebuild/PHASE-2-FINAL-REVIEW.md`
5. `design/rebuild/PHASE-3-WORK-ITEMS.md`
6. this file / assigned Work Item

Common rules:
- CURRENT canonical outranks existing runtime/tests.
- Preserve immutable baseline.
- Do not invent blocked product decisions.
- Do not merge to `main`.
- Do not edit another Work Item's owned files.
- Replace superseded tests with behavioral canonical tests; never change correct runtime to satisfy stale tests.
- Finish branch -> implementation -> tests -> commit -> push -> PR to `rebuild/canonical-governance` -> completion report.

---

## W-210 — Shared Wave-A runtime integration

Branch: `rebuild/w-210-shared-runtime-integration`
Type: blocking integration owner

Primary ownership:
- `src/game/engine.js`
- `src/game/progression.js`
- `src/game/content.js` when needed for canonical stage exposure
- shared game-state integration/adapters under `src/game/**`
- `src/App.jsx` only for the minimal learning->game event plumbing needed to make Wave-A domain events actually reach persisted game state
- integration/regression tests that cover these shared seams
- generated-runtime scripts only when required to stop superseded runtime metadata from reappearing

Must integrate, not duplicate:
1. W-201 learning reward/progression outputs
   - apply game reward queue exactly once
   - consume/ACK `pendingProgressionSignals` exactly once
   - exploration-point grants reach persisted game state
   - per-area boss learning progress reaches W-205 APIs
   - profile/reload idempotency preserved
2. W-205 world/boss gate
   - story boss eligibility is `>=12 progress points && >=2 unique skills` per area
   - old `minAreaClears` must not gate story boss access anywhere in shared engine/runtime
   - raw/generated legacy `minAreaClears` metadata must be removed or made structurally non-authoritative, not merely ignored by one code path
3. W-203 capture domain
   - shared battle flow delegates canonical eligibility/probability/attempt settlement/duplicate unresolved choice/growth-shard behavior to `captureDomain.js` or a thin adapter
   - no second competing capture formula/state machine
   - battle-start-team XP recipient contract preserved
4. W-204 evolution/exploration/special forms
   - shared runtime uses canonical evolution/exploration/special-form domain APIs instead of parallel legacy logic where behavior overlaps
   - exploration is the canonical normal source of evolution items: 5 points/run, 80/20, per-area pity, sixth-run choice after five misses
   - dedicated 32 evolution-transition trials must not remain the normal item-acquisition authority; remove/retire the runtime path and superseded tests that assert it
   - own evolution writes `evolutionDiscoveries`
   - Giga12/Burst8 effects and one-special-per-battle remain canonical; no Star Awakening
5. Save/migration
   - any new state fields have safe defaults/migration behavior through existing save model
   - no duplicate grants after reload/profile switch

Known integrated-CI evidence at wave start:
- old `engine.isStageUnlocked` still reads `stage.minAreaClears`
- generated boss stage still carries old `minAreaClears`
- W-205 module already has correct learning-gate APIs
- W-201 exposes `pendingProgressionSignals` but current App only consumes game rewards
- W-203/W-204 domain modules exist but shared engine still contains overlapping legacy behavior

Acceptance:
- full `npm test` PASS without stale-test exceptions
- production build PASS
- iPhone WebKit E2E PASS
- boss cannot be unlocked by route clears alone; can unlock with 12pt+2skill
- exploration points from learning can actually be spent in canonical exploration path
- duplicate capture keep/support path survives reload
- obsolete transition-trial item acquisition is not active product behavior
- no source of Star Awakening reintroduced
- no unrelated screen redesign

---

## W-211 — Monster / Dex / Evolution child-flow rebuild

Branch: `rebuild/w-211-monster-dex-evolution-ui`
Canonical: `design/current/06-UI-SCREEN-CONTRACT.md`, `design/current/09-MONSTER-MASTER-ART-SPEC.md`

Primary ownership:
- `src/game/screens/MonsterScreen.jsx`
- `src/game/screens/DexScreen.jsx`
- `src/game/screens/EvolutionOverlay.jsx`
- directly related component/UI tests only

Do not edit:
- `src/App.jsx`
- `src/game/engine.js`
- `src/game/progression.js`
- Battle/Capture/Adventure screens
- shared global CSS authority files

Implement the screen contract:
- Monster is about current team/selected owned monster, not Team+Box+Dex+tutorial all at once
- Team max 3 is obvious and ordering/selection is understandable to a child
- Dex is species catalog, Box/owned instances are distinct concepts
- show canonical monster name/type/level/evolution relation and rescued child-readable description
- use manifest-driven MonsterArt only; CANDIDATE/PLACEHOLDER must not be presented as FORMAL
- evolution CTA appears only when canonical condition is ready
- self-evolution result clearly records growth/evolution and links to later-world discovery behavior
- Giga/Burst status may be shown only for canonical eligible species; no Star Awakening
- 390px iPhone first viewport: one primary decision, no information wall

Acceptance:
- focused behavior tests for Monster/Dex/Evolution PASS
- no copied monster lore in JSX
- no guessed image path/ID-range logic
- no domain-rule reimplementation

---

## W-212 — HowTo / Parent canonical UX cleanup

Branch: `rebuild/w-212-howto-parent-ui`
Canonical: `design/current/06-UI-SCREEN-CONTRACT.md`, `design/current/07-SAVE-PROFILES-PARENT-PWA.md`

Primary ownership:
- `src/HowToPlay.jsx`
- `src/kids-quest-study/screens/ParentScreen.jsx`
- `src/parent/**` only when needed for Parent gate UX
- directly related tests

Do not edit:
- `src/App.jsx`
- game engine/domain modules
- Monster/Adventure/Battle/Capture screens
- shared global CSS authority files

Implement/fix:
- HowTo explains the current real loop, not obsolete stage/trial/runtime history
- learning -> ticket -> adventure -> battle -> capture -> raise -> own evolution is understandable to a young child
- explain evolution-item exploration acquisition and pity in child-readable language; do not resurrect dedicated transition trials as the normal source
- explain HP<=50 capture, ring strength, maximum 3 attempts, and four-star capture presentation at an appropriate level
- Parent remains protected/adult-only for grade/ahead/difficulty/audio/profile/backup/import controls
- keep optional read-only Kids Quest import added by W-206
- no child-side grade/ahead controls
- no Star Awakening

Acceptance:
- content is CURRENT-only
- Parent import/profile/PIN behavior remains functional
- focused screen behavior tests PASS

---

## W-213 — Monster asset repository audit

Branch: `rebuild/w-213-monster-asset-audit`
Type: asset audit / no runtime logic
Canonical: `design/current/09-MONSTER-MASTER-ART-SPEC.md`, `design/current/monster-asset-manifest.json`, description shards

Primary ownership:
- asset-audit report(s) under `design/rebuild/asset-audit/`
- `design/current/monster-asset-manifest.json` only when a state/evidence change is fully supported by repository evidence
- no image regeneration in this Work Item

Audit all active m001-m238 against repository assets:
- actual file existence/path
- candidate/formal/placeholder state
- approval evidence
- dimensions/format where inspectable
- family continuity reviewability
- missing/broken/duplicate/path-drift inventory
- m239 excluded from active scope

Rules:
- file existence is not FORMAL approval
- do not promote CANDIDATE to FORMAL without explicit approval evidence
- do not invent or regenerate art
- preserve 238 descriptions/motif/personality arc as art-review context

Acceptance:
- exact m001-m238 inventory, no gaps/duplicates
- actionable list of which assets can be reviewed now vs genuinely missing
- no runtime/source/test changes

---

## Next launch gate

Commander reviews W-210..W-213 together.

If W-210 integration CI is green, launch the remaining UI polish in parallel from the new integrated base:
- Home / Study / Adventure
- Battle / Capture
- visual/CSS authority consolidation + 390px polish
- behavioral E2E/regression
- final PWA/release audit

Only after those pass is `rebuild/canonical-governance` eligible to move toward `main` / production.
