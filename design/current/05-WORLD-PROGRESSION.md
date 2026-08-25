# ManaEvo CURRENT — World / Progression

Status: **CURRENT CANONICAL (W-105)**
Date: 2026-08-25
Work item: `W-105`

This document is the CURRENT canonical contract for ManaEvo world structure, adventure progression, wild-form availability, evolution-discovery world unlocks, boss-area progression, and persisted adventure location.

It does **not** make runtime authoritative, does not rewrite the immutable FINAL-CORRECTED baseline, and does not define learning, evolution-method, battle-balance, UI, save-platform, or monster-master details owned by other Phase 2 work items.

## 1. Authority and evidence

Apply repository governance in this order:

1. explicit user decisions
2. exact FINAL-CORRECTED baseline
3. later changes with confirmed approval evidence
4. this CURRENT canonical document
5. data master
6. runtime
7. historical reviews / completion reports

Primary evidence used for this canonicalization:

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md`, especially D-003, D-009, D-011, D-012
- `design/rebuild/PHASE-2-COMMANDER-REVIEW.md`
- `design/rebuild/USER-DECISION-EVIDENCE.md`, especially UDE-003 and UDE-005
- exact baseline:
  - `design/baseline/FINAL-CORRECTED/source/00-START-HERE.md`
  - `design/baseline/FINAL-CORRECTED/source/07-wild-encounter-and-capture-design.md`
  - `design/baseline/FINAL-CORRECTED/source/08-gameplay-state-spec.md`
- Phase 1.5 audit:
  - `design/rebuild/audit/monster-world-progression-audit.md`
- later design/runtime used only to recover approved direction or current tuning/default state:
  - `design/20-world-map-evolution-progression.md`
  - `src/game/worldProgression.js`
  - `src/game/engine.js`
  - `src/game/progression.js`

When this file conflicts with runtime, implementation must be changed later to match this file after review; runtime is not a reason to change this file.

## 2. Product invariant

ManaEvo is not a game where stronger evolved forms are simply collected from later maps. The intended progression is:

`まなぶ → チケット → ぼうけん → バトル → GET → そだてる → 自分でシンカ → より深い場所へ`

The world must make growth visible:

- earlier areas stay revisit-able;
- enemy strength is bounded by area/zone bands rather than fully following the player's team;
- after raising a team, returning to an old area is measurably easier;
- the first acquisition of a non-final evolved form comes from the player's own evolution action;
- normal wild encounters never replace the reward of reaching a final evolution by raising.

## 3. Canonical terminology and data ownership

### 3.1 `area` — source / production classification

`area` is the original production/master classification preserved from the baseline monster data.

Rules:

- Do not rewrite a species' source `area` because adventure placement changes.
- No.001–238 source data remains under the active monster scope from D-003.
- No.239 remains baseline/reference only and must not enter active world placement.

### 3.2 `adventureArea` — game-world placement

Adventure placement is a separate layer from source `area`.

The current implementation field name is `adventureArea`. The baseline used the conceptual name `adventureRegion`; W-105 does **not** introduce a second competing field named `adventureRegion`.

A stage may therefore have, conceptually:

```text
source area        = original species/stage classification
adventureArea      = where the player encounters that stage in the world
zoneId             = entrance / mid / deep placement within that adventure area
```

A derived `sourceArea` trace field may be used for diagnostics, but it does not replace the source master `area`.

### 3.3 Placement-map status

The separation of source `area` and adventure placement is canonical. The exact per-species relocation map is **not fully product-locked** by recovered evidence.

Current runtime uses this continuity heuristic for non-final evolved wild forms:

- source Area1 -> Adventure Area3 deep
- source Area2 -> Adventure Area4 deep
- source Area3 -> Area3 deep
- source Area4 -> Area4 deep

This heuristic may be preserved to avoid gratuitous churn, but it is **not promoted as an immutable per-species canonical map**. Do not encode it by mutating source `area`.

## 4. World topology

### 4.1 Main world

Areas 1–4 are the canonical main-world sequence.

| Adventure area | Current label | Canonical role |
|---|---|---|
| Area1 | ひかりの のはら | starting area; first catches and first raising/evolution loop |
| Area2 | ほのおの かざん・すなの たに | second main area; growth and type-awareness increase |
| Area3 | こおりの うみ・ふかい もり | later raising and advanced encounters |
| Area4 | ぎんがの みやこ・そらの はて | late main-world area; strong encounters and endgame preparation |

Area1 is available from the start.

Area2–4 are unlocked sequentially by the **first clear of the immediately previous area's boss**:

```text
Area1 boss first clear -> unlock Area2
Area2 boss first clear -> unlock Area3
Area3 boss first clear -> unlock Area4
```

Unlocked earlier areas remain available. Unlocking a later area never removes access to an earlier one.

### 4.2 EX / postgame

An EX/postgame/yari-komi world direction is approved by D-011/UDE-005.

Canonical now:

- EX exists as a postgame direction separate from the Area1–4 main sequence.
- EX is not required to reinterpret Area1–4 source `area` data.
- Current playtest level band `70–100` may remain as a tuning default.

Not canonicalized yet:

- exact EX unlock condition;
- whether EX is internally a numeric fifth area or another postgame container;
- exact EX zone count/route structure.

Current runtime's `area=5`, one `ex` zone, and `requiresAllAreasCleared` behavior are implementation history/defaults, **not recovered product truth**. See `BLOCKED DECISION` below.

## 5. Entrance / mid / deep route

Areas 1–4 use a three-part adventure route:

```text
入口 -> 中盤 -> 奥地
```

The structural direction is canonical: a child advances deeper through an area rather than receiving a flat giant stage list.

### 5.1 Zone access vs boss challenge

Two different gates must not be conflated:

1. **Route access** — whether entrance/mid/deep is reachable.
2. **Boss challenge gate** — whether the player has sufficient per-area learning progress.

A route-access clear count may control movement to the next zone. It must never replace the canonical boss learning gate from D-009.

### 5.2 Current route clear counts — `TUNING-DEFAULT`

The current playtest default is:

- entrance: available when the area is unlocked;
- mid: unlock after first-clearing **2 distinct wild stages** in entrance;
- deep: unlock after first-clearing **2 distinct wild stages** in mid.

The value `2` is a balance/route tuning value, not an immutable user decision. Repeated clears of the same already-cleared stage do not increase this first-clear count.

## 6. World level bands — `TUNING-DEFAULT`

The canonical rule is structural: enemies must have area/zone level bands and must **not fully scale to the player's current team**.

Current playtest bands may remain until balance tuning changes them:

| Area | Zone | Current zone ID | Current Lv band |
|---|---|---|---:|
| 1 | entrance | `meadow` | 5–10 |
| 1 | mid | `forest` | 11–16 |
| 1 | deep | `deep` | 17–22 |
| 2 | entrance | `foothill` | 18–24 |
| 2 | mid | `magma` | 25–31 |
| 2 | deep | `deep` | 32–38 |
| 3 | entrance | `coast` | 32–40 |
| 3 | mid | `frost` | 41–49 |
| 3 | deep | `deep` | 50–58 |
| 4 | entrance | `city` | 50–60 |
| 4 | mid | `skyway` | 61–70 |
| 4 | deep | `deep` | 71–80 |
| EX | current single zone | `ex` | 70–100 |

Area envelopes are therefore currently A1 `5–22`, A2 `18–38`, A3 `32–58`, A4 `50–80`, EX `70–100`.

These values are `TUNING-DEFAULT`, not product invariants.

Battle/balance owns the soft-scaling calculation. W-105 only requires the result to be bounded by the applicable zone band, equivalent in shape to:

```text
enemyLevel = clamp(zone.minLevel, softScaledLevel, zone.maxLevel)
```

See `design/current/02-BATTLE-TICKETS-BALANCE.md` for battle/boss balance ownership after W-102 is integrated.

## 7. Wild-form acquisition rules

### 7.1 First forms

The normal wild loop is centered on first forms.

Canonical behavior:

- an evolving family's first form is the normal wild acquisition point when its encounter role permits normal wild encounters;
- event/boss/special-only species remain exceptions and are not converted into normal wild merely because `stage=1`;
- W-105 does not change monster rank/type/source-area data to create encounter availability.

### 7.2 Non-final evolved forms — first acquisition must be self-evolution

For an evolved form that is **not the family's final form** (normally the middle form of a 3-stage family):

1. it is not available as a normal wild catch before the child has created that form by evolution;
2. a successful own evolution records the target species in `evolutionDiscoveries`;
3. only after that discovery may the same evolved species become eligible for later advanced/deep wild encounters.

The discovery condition is about **how the form was first reached**, not merely ownership.

Therefore:

```text
requires discovery != dex.caught
requires discovery != owns species by any path
```

`dex.caught` must not be used as a substitute for `evolutionDiscoveries` for new/current saves.

The evolution write side belongs to `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md` (W-104). W-105 owns the world read/gate side.

Legacy-save grandfathering belongs to `design/current/07-SAVE-PROFILES-PARENT-PWA.md` (W-107). Existing old saves may be migrated so previously reachable evolved content is not silently lost, but that compatibility path must not redefine the new-game product rule.

### 7.3 Final forms

Final evolution forms are **not normal wild catches**.

They may appear visually in bosses, strong encounters, trials, or other special content when separately specified, but a normal wild stage must not let the child bypass raising and directly catch the final form.

Implementation flags such as `hidden` / `captureDisabled` are mechanisms, not the product definition. The product definition is: **normal-wild acquisition of final evolution forms is prohibited**.

## 8. `evolutionDiscoveries` state contract

Canonical state meaning:

```text
evolutionDiscoveries[speciesId] = true
```

means that the profile has reached that species by the qualifying own-evolution path (or by an explicitly documented legacy migration compatibility rule).

Rules:

- profile-specific;
- persisted across reloads;
- written on successful qualifying evolution;
- read by world unlock logic for advanced/deep wild availability;
- independent from `dex.seen` and `dex.caught`;
- must not be cleared by moving areas or changing team/BOX composition.

## 9. Area boss challenge and progression

D-009 restores the baseline learning-progress boss gate. The current runtime's `minAreaClears=5` is **not canonical**.

### 9.1 Per-area boss progress state

Use an equivalent state model to:

```text
areaBossProgress[areaId] = {
  points: number,
  uniqueSkillIds: string[]
}
```

Eligibility:

```text
points >= 12 && uniqueSkillIds.length >= 2
```

The two skills may belong to the same subject. They must be distinct skills.

### 9.2 Canonical progress events

Baseline evidence fixes these grants:

- that day's core task first clear: `+1`
- mastery milestone increase: `+2`
- chapter test first pass: `+3`

Repeated exploitation does not count:

- repeating the same question: `+0`
- repeating already-mastered trivial content without a new qualifying milestone: `+0`

The learning/reward producer belongs to W-101 (`design/current/01-LEARNING-REWARDS.md`). W-105 owns the per-area accumulation and boss-gate consumption contract.

### 9.3 Area isolation

Boss progress is area-specific.

- Area1 starts with its own progress state.
- When Area2, Area3, or Area4 is newly unlocked, its boss progress starts at `0 points / empty unique-skill set`.
- Progress from a previous area is not carried forward.
- Returning to an older area and performing eligible learning updates that older area's progress, not the newest unlocked area's progress.

### 9.4 Boss route relationship

A boss must be in an unlocked/reachable area route **and** satisfy the 12-point + 2-skill learning gate.

Current route depth rules may also determine whether the boss node can be reached visually/structurally. That route condition is separate from the learning gate.

The following are explicitly **not** valid substitutes for the boss learning gate:

- 5 exploration clears;
- full dex completion;
- all species caught;
- all subjects cleared.

### 9.5 Boss clear -> next area

On first clear of an Area1–3 boss, unlock the immediately next main area.

The boss clear and next-area unlock must persist. Re-clearing the boss does not create duplicate area unlock state.

Boss rematch scaling/snapshot behavior belongs to W-102 and D-012.

## 10. Persisted current adventure location

The profile owns a persisted current adventure location equivalent to:

```text
adventureLocation = {
  area: adventureArea,
  zoneId: string
}
```

Canonical meaning:

- `area` is the **adventure** area, not monster source `area`;
- `zoneId` identifies the selected/reached zone inside that adventure area;
- the value is profile-specific and survives reload;
- Adventure re-entry uses the actual persisted location rather than automatically jumping to the highest unlocked area;
- Home/other consumers that show “current adventure” must reflect this actual location;
- returning from a battle must not silently reset the player to a different area/zone;
- unlocking a new area does not itself rewrite the saved location to the new highest area.

W-107 owns save normalization/migration. If a saved location becomes invalid after migration or content-version changes, it must be normalized deterministically to a valid unlocked location; W-105 does not invent the exact migration fallback policy.

## 11. Returning to old areas must show growth

Past areas remain selectable after later areas unlock.

To preserve the intended “I got stronger” feeling:

- normal enemy levels remain bounded by the area's/zone's tuning band;
- player growth is not canceled by full enemy level mirroring;
- returning with a stronger team therefore produces an easier experience in a previously difficult zone;
- boss normal-rematch behavior must likewise preserve the approved raising advantage through W-102 / D-012 rather than rescaling every rematch to erase growth.

This is a product requirement, not merely a balance preference.

## 12. Grade / ahead learning / world evidence recovery

Kids Quest grade and ahead-learning behavior belongs to the learning domain. Evidence reviewed for W-105 does **not** establish an exact direct rule that school grade unlocks ManaEvo world areas.

Therefore:

- do not invent a direct `grade -> adventureArea` gate;
- do not claim that grade can never affect world progression in the future;
- the confirmed Area1–4 chain remains boss-clear based;
- any additional grade/world coupling requires recovered evidence or a later user decision.

### 12.1 Grade reward species

Past discussion establishes grade-reward characters as an important candidate concept, but no exact species assignment was recovered in:

- exact W-105 baseline evidence;
- `USER-DECISION-EVIDENCE.md`;
- Phase 1.5 monster/world audit;
- Phase 2 commander decisions.

No worker may assign species by taste, rarity, area, or current runtime availability.

This does not block canonical Area1–4 progression.

## 13. Cross-work-item interfaces

W-105 must coordinate by reference only.

- **W-101 / Learning-Rewards**: produces qualifying learning milestones; W-105 attributes/stores per-area boss progress.
- **W-102 / Battle-Tickets-Balance**: owns normal/boss battle level calculation and boss rematch snapshots; W-105 supplies area/zone band and world access constraints.
- **W-103 / Capture-Duplicates**: owns capture and duplicate result behavior; W-105 only determines whether a species/stage is available as a world encounter.
- **W-104 / Evolution-Items-Special-Forms**: writes own-evolution outcomes and `evolutionDiscoveries`; W-105 reads discovery for advanced wild unlocks.
- **W-106 / UI-Screen-Contract**: renders world route/current location without redefining world rules.
- **W-107 / Save-Profiles-Parent-PWA**: persists/migrates `adventureLocation`, `evolutionDiscoveries`, area unlocks, and boss-progress state.
- **W-108 / Acceptance-Test-Contract**: converts this behavior into product-level tests.
- **W-109 / Monster Master-Art**: owns active species/source-master identity; W-105 never rewrites source monster identity to fit placement.

## 14. Current runtime delta ledger

Runtime is evidence of present behavior only. The following deltas matter to later implementation:

### Aligns with CURRENT direction

- separate `adventureArea` placement exists;
- Area1–4 have entrance/mid/deep-style zones;
- current level bands exist and can remain as tuning defaults;
- `evolutionDiscoveries` is separate from `dex.caught`;
- non-final evolved wild stages can require evolution discovery;
- final evolved normal-wild stages are suppressed from normal capture;
- `adventureLocation` is present in profile game state and normalized;
- earlier areas remain addressable.

### Must change in implementation

- current boss gate uses `minAreaClears=5` / wild-clear counting;
- current game state does not implement the canonical per-area `12 points + 2 unique skills` boss-progress contract;
- `5 clears` must not remain the boss challenge truth after W-105 implementation.

### Must not be promoted without a decision

- exact per-species evolved-form relocation map;
- exact EX unlock (`all four bosses` in current runtime);
- EX internal `area=5` representation;
- grade -> world direct gate;
- grade reward species assignments.

## 15. `BLOCKED DECISION` — non-blocking

These are intentionally unresolved and must not be filled by worker preference:

### BD-W105-01 — EX exact unlock / representation

Known: EX/postgame direction is approved.

Unknown:

- exact unlock condition;
- exact route/zone structure;
- whether numeric Area5 is the final internal model.

Current runtime's all-four-boss unlock may be preserved temporarily for continuity, but it is not product canonical until evidence/decision resolves it.

### BD-W105-02 — grade directly unlocking world regions

Known: grade/ahead-learning exists on the learning side.

Unknown: whether grade adds a direct ManaEvo world unlock/gate beyond the confirmed boss-clear chain.

Do not add a speculative grade gate.

### BD-W105-03 — grade reward species assignments

Known: grade reward characters were discussed as a desired concept.

Unknown: the exact species/grade assignment table.

Do not invent assignments.

### BD-W105-04 — exact evolved-form relocation map

Known: source `area` and adventure placement are separate; evolved forms after self-evolution belong in later/advanced/deep play.

Unknown: a fully approved species-by-species placement map.

Do not mutate source `area`; preserve current placement only as a noncanonical continuity default until a placement map is approved.

## 16. Implementation acceptance derived from W-105

A later implementation can be considered aligned with this world canonical only if all of the following are true:

1. Source `area` remains distinct from adventure placement.
2. Area1 is initial; Area2–4 unlock in sequence by previous-area boss first clear.
3. Earlier areas remain revisit-able.
4. Areas1–4 expose the entrance/mid/deep route structure.
5. Current zone clear count `2` is treated as tuning, not product truth.
6. Current level bands are treated as tuning and enemies are not fully mirrored to player level.
7. First-form normal-wild acquisition remains the default subject to encounter-role exceptions.
8. A non-final evolved form cannot be normal-wild caught before qualifying own evolution.
9. `evolutionDiscoveries`, not `dex.caught`, controls that post-evolution wild unlock.
10. Final evolution forms cannot be acquired through normal wild capture.
11. Boss eligibility uses per-area `>=12 points && >=2 unique skills`.
12. New main areas start boss progress at `0 / empty`; previous-area progress is not carried forward.
13. `5 exploration clears` is not the boss challenge gate.
14. Boss first clear persists next-area unlock.
15. `adventureLocation` persists the actual profile area/zone and does not auto-jump to highest unlocked area.
16. Returning to old areas leaves enough enemy-band stability for player growth to feel real.
17. EX exact unlock, grade/world direct coupling, and grade-reward species remain unresolved rather than invented.

This acceptance is behavioral. CSS classes, current function names, and current runtime file structure are not proof of compliance.
