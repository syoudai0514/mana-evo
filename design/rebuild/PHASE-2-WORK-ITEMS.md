# ManaEvo Rebuild — Phase 2 Parallel Work Items

Phase: CURRENT canonicalization
Base branch for all workers: `rebuild/canonical-governance`
PR base for all workers: `rebuild/canonical-governance`

## Common worker rules

Before work, read in order:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/rebuild/PHASE-2-COMMANDER-REVIEW.md`
4. this file / assigned W section
5. relevant exact baseline under `design/baseline/FINAL-CORRECTED/source/`
6. relevant Phase 1.5 audit under `design/rebuild/audit/`

For this phase:

- do not treat runtime as authority
- do not modify baseline source
- do not modify `src/**` or `tests/**`
- do not silently make new product decisions
- use D-003〜D-014 as commander decisions
- if evidence truly remains missing, record `BLOCKED DECISION`
- create one branch for the assigned W, commit/push, and create one PR
- do not merge to main
- do not edit another W's output file

---

## W-101 — Learning / rewards CURRENT canonical

Branch: `rebuild/w-101-learning-canonical`
Output: `design/current/01-LEARNING-REWARDS.md`

Canonicalize:
- Kids Quest source-of-truth boundary
- 5 tasks and question counts
- `わからない`
- SRS/mastery/star trial/ahead learning/free study
- daily core gate
- ticket+3
- extra question ticket+1 each, unlimited (D-006)
- ticket 7-day FEFO
- later-approved ring economy from D-006
- exploration-point grants that remain from baseline
- anti-spam behavior
- `src/kids-quest-study` active / `src/study` legacy contract

Also identify current runtime deltas, but do not implement them.

Acceptance: another worker can implement learning/reward bridge without reading old design docs.

---

## W-102 — Battle / ticket / boss-balance CURRENT canonical

Branch: `rebuild/w-102-battle-canonical`
Output: `design/current/02-BATTLE-TICKETS-BALANCE.md`

Canonicalize:
- battle entry gate
- team max3 / active1 / switch
- enemy battle model
- stats/Lv/XP/moves/type/STAB/protect
- ticket reserve/refund/commit lifecycle (D-007)
- battle XP/Mana where evidenced
- boss initial snapshot / normal rematch / challenge rematch
- D-012 balanceVersion replacement then re-lock
- defeat/abandon/crash behavior

Do not define capture detail beyond linking W-103.

---

## W-103 — Capture / duplicate CURRENT canonical

Branch: `rebuild/w-103-capture-canonical`
Output: `design/current/03-CAPTURE-DUPLICATES.md`

Canonicalize:
- D-004 in-battle HP<=50% capture
- four rings / current multipliers / 92% cap / rainbow100
- max3 throws
- failed-capture turn behavior where later evidence exists
- four-star sequential ring-completion presentation
- child-facing ease/recommendation primary; exact percentage secondary/detail per baseline
- success result and capture XP/Mana where evidenced
- D-010 first catch vs duplicate choice
- `なかまにする`
- `おうえんにかえる`
- `そだちのかけら` 3 -> chosen team monster XP+30
- BOX/team behavior

Do not implement UI or engine.

---

## W-104 — Evolution / items / special forms CURRENT canonical

Branch: `rebuild/w-104-evolution-canonical`
Output: `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`

Canonicalize:
- normal evolution methods and 155 transitions from active master
- level / item / held-item-level-up semantics using evidence precedence
- self-evolution discovery interface with W-105
- D-008 exploration-based evolution-item acquisition
- exploration points, 5pt/run, 80/20, per-area pity, 6th-run selection, boss item bonus
- current dedicated evolution trials: explicitly classify as non-canonical replacement unless separately approved
- Giga 12 target IDs and baseline/current effects
- Burst 8 target IDs and baseline/current effects
- No.142 current official name handling
- one special form per battle / dex recording where evidenced
- Star Awakening remains excluded

---

## W-105 — World / progression CURRENT canonical

Branch: `rebuild/w-105-world-canonical`
Output: `design/current/05-WORLD-PROGRESSION.md`

Canonicalize:
- source `area` vs adventure placement layer
- Area1-4 + approved EX/postgame direction
- entrance/mid/deep structure
- first-form wild principle
- second-form first acquisition by self-evolution
- `evolutionDiscoveries` then later second-form wild
- final-form normal wild prohibition
- D-009 boss gate: per-area 12 learning progress points + 2 unique skills
- boss clear -> next area
- current zone level bands and zone clear counts only as `TUNING-DEFAULT`, not immutable user decisions
- current location persistence
- return to old area and feel growth
- grade/world and grade reward species evidence recovery; if no exact decision, list as non-blocking `BLOCKED DECISION` without inventing species

Coordinate by references only; do not edit W-101/W-104 outputs.

---

## W-106 — UI / navigation CURRENT canonical

Branch: `rebuild/w-106-ui-canonical`
Output: `design/current/06-UI-SCREEN-CONTRACT.md`

Start from PR #39 draft, then apply D-013 corrections.

For Home, Study, Adventure, Battle, Capture, Monster, Dex, Evolution, HowTo, Parent define:
- PURPOSE
- PRIMARY CTA
- MUST SHOW
- MUST NOT SHOW
- CHILD DECISION
- ENTRY / EXIT
- focused state / overlay ownership
- KEEP / REMOVE / REBUILD

Mandatory corrections:
- child capture primary representation is ease/recommendation; exact % secondary/detail
- Home primary: learning incomplete -> Study; learning complete -> Adventure; evolution reward stays focused in earned flow
- no world route + duplicate Area tabs
- no permanent search/filter/huge list in normal Adventure
- no permanent capture/team/tips pile in normal Battle
- no Team+Box+Dex+tutorial pile in normal Monster
- no new CSS override layer as design solution
- target iPhone portrait / 390px first viewport

Do not modify source/CSS/tests.

---

## W-107 — Save / profiles / Parent / PWA CURRENT canonical

Branch: `rebuild/w-107-platform-canonical`
Output: `design/current/07-SAVE-PROFILES-PARENT-PWA.md`

Canonicalize:
- per-profile learning/game state ownership
- profile switching
- Parent gate/PIN and adult-only settings
- grade/ahead/difficulty/audio/profile/backup ownership
- ManaEvo namespace isolation from Kids Quest
- optional one-way read-only Kids Quest learning progress import per baseline
- save migrations/idempotency
- GitHub Pages as official hosting
- Vite base / PWA / manifest / SW/offline expectations
- formal monster asset cache/versioning requirement
- Vercel references as history, not current hosting authority

Do not change deployment/runtime.

---

## W-108 — Acceptance / test contract CURRENT canonical

Branch: `rebuild/w-108-acceptance-canonical`
Output: `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`

Define behavioral acceptance for:
- learning -> rewards
- ticket lifecycle
- Adventure -> Battle
- capture including duplicate choice
- XP/raising
- normal evolution
- evolution item exploration and pity
- self-evolution world unlock
- boss learning gate/rematch
- Giga/Burst
- save/profile migration
- 238 active dex
- PWA/offline/update
- 390px child-flow UI

Explicitly identify old tests that assert CSS class/load-order rather than product behavior as refactor candidates.
Do not edit tests yet.

---

## W-109 — Monster master / art contract

Branch: `rebuild/w-109-monster-art-canonical`
Outputs:
- `design/current/09-MONSTER-MASTER-ART-SPEC.md`
- `design/current/monster-asset-manifest.json`

Use exact baseline `scripts/families.mjs`, `scripts/monster-visual-briefs.json`, graphics bible and D-003/D-014.

Canonicalize:
- active No.001-238 / 83 families
- stable IDs
- family/stage/type/source area/evolution links
- description data provenance
- art rules (5-8 audience, 2-4 heads, full body, transparent/white, small-view readability, family continuity, originality)
- one MonsterArt resolution contract
- formal / candidate / placeholder state model
- asset manifest with one row/object for all 238 IDs and current repository asset status if detectable
- do not mark an image APPROVED merely because a file exists

Do not regenerate images.

---

## W-110 — Monster descriptions No.001-080

Branch: `rebuild/w-110-monster-desc-001-080`
Output: `design/current/monsters/descriptions-001-080.json`

Extract exact active species data from baseline visual briefs/families for No.001-080.
Per species include at minimum:
- no / speciesId / name / familyNo / stage / type
- motif
- family concept
- personality arc context
- stage description (child-readable dex text)
- graphicCore
- expressionAndPose
- silhouette

Do not invent text when baseline has it. Preserve Japanese descriptions faithfully. No.239 irrelevant.

---

## W-111 — Monster descriptions No.081-160

Branch: `rebuild/w-111-monster-desc-081-160`
Output: `design/current/monsters/descriptions-081-160.json`

Same extraction rules as W-110 for No.081-160. Do not alter other shards.

---

## W-112 — Monster descriptions No.161-238

Branch: `rebuild/w-112-monster-desc-161-238`
Output: `design/current/monsters/descriptions-161-238.json`

Same extraction rules as W-110 for No.161-238. Explicitly exclude No.239 from active output while leaving it preserved in baseline.

---

## W-113 — Design-folder cleanup map

Branch: `rebuild/w-113-design-cleanup-map`
Output: `design/rebuild/DESIGN-CLEANUP-PLAN.md`

Inventory the whole current `design/` plus new rebuild docs and classify every document:
- CURRENT_CANONICAL
- DATA_MASTER
- SUPPORTING_EVIDENCE
- HISTORY
- OBSOLETE_OR_SUPERSEDED

Propose the final folder/index structure and link migration plan.
Do not physically move/delete files in this work item.
Explicitly prevent runtime-completion/review history from outranking product/game/UI canonical docs.

---

## Phase 2 completion gate

Commander reviews W-101〜W-113 together.
After review:

1. create/promote `design/current/00-START-HERE.md`
2. resolve cross-document contradictions
3. mark implementation work items unblocked by domain
4. launch targeted implementation in parallel

Implementation does not need to wait for unrelated monster-image approval if its required canonical domain is already accepted.
