# ManaEvo Rebuild — Phase 2 Commander Review

Date: 2026-08-25
Status: **PHASE 1.5 COMPLETE / CANONICALIZATION UNLOCKED**

## 1. Reviewed and integrated

The following PRs were reviewed and merged into `rebuild/canonical-governance`:

- #35 — exact FINAL-CORRECTED baseline rescue
- #36 — learning / ticket / Kids Quest audit
- #37 — battle / capture / evolution audit
- #38 — monster / world / progression audit
- #39 — UI architecture audit + screen contract draft

No Phase 1.5 worker changed `src/**` or production behavior.

## 2. Baseline integrity

`design/baseline/FINAL-CORRECTED/source/` now preserves the exact 32-file original baseline.

- source files: 32/32
- manifest: 32/32
- Git Blob SHA mismatches: 0
- SHA-256 mismatches: 0
- transfer staging remains: 0

The baseline is immutable historical source, not automatically current behavior.

## 3. Commander canonical decisions

See `design/rebuild/DECISION-LOG.md` D-003 through D-014.

### Keep later approved changes

- active monsters No.001–238 / 83 families; No.239 reference only
- in-battle capture at enemy HP <= 50%
- ring multipliers: star1.0 / silver1.2 / gold1.5 / rainbow100%, non-rainbow cap92%, max3 throws
- ticket reserve/refund lifecycle from later explicit decision
- self-evolution-first world direction, `evolutionDiscoveries`, stage2 wild only after self-evolution, final forms not normal wild
- bosses become relatively easier after raising; snapshot replacement bug must be fixed

### Restore baseline where later approval is absent

- extra learning ticket: +1 per completed extra question, unlimited
- evolution items: exploration points, 5pt/run, 20% evolution item, per-area 6th-run choice guarantee after five misses
- boss challenge gate: per-area learning progress 12 points + 2 unique skills
- duplicate capture: first automatic; later duplicates choose `なかまにする` or `おうえんにかえる`; growth shard 3 -> selected team monster XP+30

### Preserve later approved ring reward change

Do not restore the old baseline ring economy. Use later explicit decision:

- daily complete -> star +3
- additional learning 3 correct -> star +1
- unit MASTER -> silver +1
- hard MASTER -> gold +1

Current runtime is missing the additional-learning star reward.

## 4. UI correction before promotion

PR #39 is a useful draft, not the final canonical unchanged.

Promote these principles:

- one dominant child decision in a normal state
- no old+new UI stacking
- Adventure does not show world route + duplicate Area tabs + permanent filters/search + huge stage list together
- Battle/Capture/Monster progressively disclose secondary controls
- CSS ownership by screen/system, not load order / `!important`
- Evolution is a focused reward flow

Corrections:

- child capture screen: 5-step/recommendation readability is primary; exact percentage is secondary/detail, consistent with baseline `08-gameplay-state-spec.md`
- Home default primary: learning incomplete -> Study; learning complete -> Adventure. Evolution is primarily handled in the earned flow rather than silently overriding Home priority.

## 5. Monster descriptions / art

Original character explanation data already exists in `scripts/monster-visual-briefs.json`:

- family motif
- concept
- personality arc
- palette
- graphic core
- per-stage description
- expression/pose
- silhouette

Do not invent 238 descriptions from scratch. Extract and formalize the active No.001–238 data, then audit the already-generated image candidates against it. Regenerate only failed assets.

## 6. Numeric tuning

World structure is canonical; exact balance numbers are not all product decisions.

Current area level bands and zone-clear counts may be retained as `TUNING-DEFAULT` values for playtest and adjusted under balance policy without treating them as immutable user decisions.

## 7. Remaining non-blocking recovery

The following do not block core canonicalization, but must not be invented silently:

- exact grade-reward species assignments
- whether grade directly unlocks world regions (currently no confirmed rule)
- EX exact unlock details beyond approved postgame direction

Recover evidence first; if none exists, escalate as a bundled user decision later.

## 8. Phase 2 strategy

Phase 2 uses parallel **canonical work items** with non-overlapping output files. When each domain canonical is reviewed, its implementation work may start without waiting for unrelated art/document work.

Worker prompts should be short. Every worker reads:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. this file
4. its assigned work-item file

Workers do not make new product decisions. Missing evidence becomes `BLOCKED DECISION`, not invented behavior.
