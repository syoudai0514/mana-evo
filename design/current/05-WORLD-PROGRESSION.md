# ManaEvo CURRENT — World / Progression

Status: **CURRENT CANONICAL (W-105, D-031 aligned)**
Date: 2026-09-05
Work item: `W-105`

This document is the CURRENT canonical contract for ManaEvo world structure, adventure progression, route access, boss-area progression, persisted adventure location, and the world-facing side of evolution discovery.

**D-031 is later authority for route/acquisition/training behavior.** Read this file together with `design/current/10-EVOLUTION-TRAINING-PROGRESSION.md`. Where older W-105 wording described two-stage route clears or post-evolution evolved-wild unlocks, D-031 supersedes that wording and this file is aligned accordingly.

It does **not** make runtime authoritative, does not rewrite the immutable FINAL-CORRECTED baseline, and does not define learning, evolution-method, battle-balance, UI, save-platform, or monster-master details owned by other work items.

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
- `design/rebuild/DECISION-LOG.md`, especially D-003, D-009, D-011, D-012, D-030, D-031
- `design/current/10-EVOLUTION-TRAINING-PROGRESSION.md`
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

When this file conflicts with runtime, implementation must be changed to match CURRENT authority after review; runtime is not a reason to change this file.

## 2. Product invariant

ManaEvo is not a game where stronger evolved forms are simply collected from later maps. The intended progression is:

`まなぶ → チケット → ぼうけん → 第1形態をGET → そだてる → 自分でシンカ → シンカしゅぎょうでさらに育てる`

The world must make growth visible:

- earlier areas stay revisit-able;
- enemy strength is bounded by area/zone bands rather than fully following the player's team;
- after raising a team, returning to an old area is measurably easier;
- first-form acquisition belongs to ordinary ①/② encounters when the encounter role permits capture;
- every evolved form's new acquisition comes from confirmed self-evolution, not wild capture;
- ③ exists as higher-level training with first-form rematches, not as a high-level capture shortcut.

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

### 3.3 Evolved-form placement after D-031

The separation of source `area` and adventure placement remains canonical, but D-031 removes the prior need for a later-area evolved-wild relocation map.

Canonical now:

- evolved-form wild stages are retired/hidden from the normal acquisition route;
- self-evolution does **not** re-enable an evolved form as a normal wild target;
- confirmed self-evolution unlocks that exact species' separate `kind=training` シンカしゅぎょう in its source/adventure area when that area is open;
- source `area` remains unchanged.

The earlier continuity heuristic that moved non-final evolved wild forms from Area1→Area3 or Area2→Area4 is superseded by D-031 and must not be restored as product truth.

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
① entrance -> ② mid -> ③ deep
```

The structural direction is canonical: a child advances deeper through an area rather than receiving a flat giant stage list.

### 5.1 Zone access vs boss challenge

Two different gates must not be conflated:

1. **Route access** — whether ①/②/③ is reachable.
2. **Boss challenge gate** — whether the player has sufficient per-area learning progress.

Route progress controls movement to the next zone. It never replaces the canonical boss learning gate from D-009.

### 5.2 D-031 route clear contract

The current canonical route rule is:

- ①: available when the area is unlocked;
- ②: unlock after first-clearing **3 distinct eligible enemy species** in ①;
- ③: unlock after first-clearing **3 distinct eligible enemy species** in ②.

Identity is `enemySpeciesId`, not internal stage ID. If two stage IDs represent the same enemy species, they still count as one species toward the three-species requirement.

The following do not count toward route progress:

- duplicate clears of the same enemy species;
- ③ deep/rematch training encounters;
- シンカしゅぎょう;
- retired/hidden evolved-form wild stages;
- bosses;
- giga/burst/special challenges;
- event/EX stages.

The numeric value `3` is the current D-031 tuning default, but the identity rule—**different visible enemy species rather than different stage IDs**—is part of the approved product behavior.

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

D-031 additionally defines non-stacking XP multipliers by route/training source. See `design/current/10-EVOLUTION-TRAINING-PROGRESSION.md` and `design/current/02-BATTLE-TICKETS-BALANCE.md` for XP/battle ownership.

## 7. Acquisition and training rules

### 7.1 First forms: ①/② acquisition, ③ training

The normal acquisition loop is centered on first forms.

Canonical behavior:

- an evolving family's first form is a normal acquisition target in its ordinary ①/② encounter when the encounter role permits capture;
- event/boss/special-only species remain exceptions and are not converted into normal wild merely because `stage=1`;
- ③ reuses first-form species as stronger deep/rematch opponents, but **every ③ deep/rematch is GETなし**;
- ③ deep/rematches must expose stage-level `captureDisabled=true` and are unavailable to both in-battle and post-win capture;
- blocking a ③ capture consumes zero balls, creates zero BOX instances, and does not add Dex caught state;
- the same species remains normally capturable from its eligible ①/② acquisition encounter.

This separation prevents a high-level first-form capture in ③ from bypassing the intended raising runway.

### 7.2 Evolved forms: new acquisition only by confirmed self-evolution

For every evolved species, whether non-final or final:

1. it is not a normal wild acquisition target;
2. meeting an evolution threshold or holding a pending qualification is not sufficient;
3. the child must confirm the evolution action;
4. confirmed self-evolution records the target species in `evolutionDiscoveries`;
5. that exact discovery may unlock the species' separate シンカしゅぎょう when its area is open;
6. self-evolution does **not** re-enable the evolved species as a normal wild catch.

The discovery condition is about **how the form was reached**, not merely ownership.

Therefore:

```text
requires discovery != dex.caught
requires discovery != owns species by any path
```

`dex.caught` must not be used as a substitute for `evolutionDiscoveries` for new/current saves.

The evolution write side belongs to `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md` and D-030. W-105 owns the world read/gate side, refined by D-031.

Legacy-save grandfathering belongs to `design/current/07-SAVE-PROFILES-PARENT-PWA.md`. Existing old saves may preserve evolved ownership/discovery compatibility, but that compatibility path must not create a new capture route or regress an owned evolved monster.

### 7.3 シンカしゅぎょう

Confirmed self-evolution unlocks a separate training encounter for the exact evolved species.

Canonical behavior:

- `kind=training`;
- unlock authority is `evolutionDiscoveries[speciesId]`;
- available independently of normal ③ route depth once its area is open;
- capture disabled;
- route-progress ineligible;
- consumes normal battle ticket and requires that day's learning completion;
- replayable for growth;
- presented as `育成向け / GETなし`, never as a new acquisition opportunity.

XP tuning is owned by D-031: non-final training ×1.35, final-form training ×1.45, non-stacking with zone multipliers.

## 8. `evolutionDiscoveries` state contract

Canonical state meaning:

```text
evolutionDiscoveries[speciesId] = true
```

means that the profile has reached that species by the qualifying confirmed own-evolution path, or by an explicitly documented legacy migration compatibility rule.

Rules:

- profile-specific;
- persisted across reloads/cloud round-trip;
- written on successful confirmed evolution;
- read by world logic to unlock the exact evolved species' シンカしゅぎょう;
- independent from `dex.seen` and `dex.caught`;
- must not be cleared by moving areas or changing team/BOX composition;
- must not be interpreted as permission to re-enable evolved wild capture.

## 9. Area boss challenge and progression

D-009 restores the baseline learning-progress boss gate. Route clears are **not** the boss-learning authority.

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

Current route depth rules may determine whether the boss node can be reached visually/structurally. That route condition is separate from the learning gate.

The following are explicitly **not** valid substitutes for the boss learning gate:

- route clears alone;
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
- **W-102 / Battle-Tickets-Balance**: owns normal/boss battle level calculation, XP calculation, and boss rematch snapshots; W-105 supplies area/zone band and world access constraints.
- **W-103 / Capture-Duplicates**: owns capture and duplicate settlement; D-031/W-105 supplies encounter-level `captureDisabled` authority for ③/training and evolved-form acquisition restrictions.
- **W-104 / Evolution-Items-Special-Forms**: D-030 writes confirmed own-evolution outcomes and `evolutionDiscoveries`; D-031/W-105 reads discovery for training unlock.
- **W-106 / UI-Screen-Contract**: renders world route/current location, `GETなし`, and training affordances without redefining world rules.
- **W-107 / Save-Profiles-Parent-PWA**: persists/migrates `adventureLocation`, `evolutionDiscoveries`, area unlocks, and boss-progress state.
- **W-108 / Acceptance-Test-Contract**: converts this behavior into product-level tests.
- **W-109 / Monster Master-Art**: owns active species/source-master identity; W-105 never rewrites source monster identity to fit placement.

## 14. Current runtime delta ledger

Runtime is evidence of present behavior only. After D-031 implementation, the target alignment is:

### Aligns with CURRENT direction

- separate `adventureArea` placement exists;
- Area1–4 have ①/②/③-style zones;
- current level bands exist and can remain as tuning defaults;
- `evolutionDiscoveries` is separate from `dex.caught`;
- evolved wild stages are retired/hidden;
- exact-species シンカしゅぎょう is discovery-gated;
- ③ deep/rematches are first-form, high-level, capture-disabled training encounters;
- route progress counts distinct enemy species, not stage IDs;
- `adventureLocation` is present in profile game state and normalized;
- earlier areas remain addressable.

### Canonical safeguards

- route clears must not replace the per-area `12 points + 2 unique skills` boss-progress contract;
- self-evolution discovery must not become permission for evolved wild capture;
- stage-level `captureDisabled` must be respected by both in-battle and post-win public capture APIs;
- old D-011 evolved-wild relocation behavior must not be reintroduced.

### Must not be promoted without a decision

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

The former evolved-form relocation-map uncertainty is no longer blocked: D-031 retires evolved wild placement and replaces it with exact-species training unlocks.

## 16. Implementation acceptance derived from W-105 + D-031

An implementation is aligned with the CURRENT world canonical only if all of the following are true:

1. Source `area` remains distinct from adventure placement.
2. Area1 is initial; Area2–4 unlock in sequence by previous-area boss first clear.
3. Earlier areas remain revisit-able.
4. Areas1–4 expose the ①/②/③ route structure.
5. ② and ③ unlock after three distinct eligible `enemySpeciesId` clears in the previous zone; duplicate stage IDs for one species count once.
6. Current level bands are treated as tuning and enemies are not fully mirrored to player level.
7. First-form normal acquisition belongs to eligible ①/② encounters.
8. Every ③ deep/rematch is first-form training-only and `GETなし` for both in-battle and post-win capture, with no ball/BOX/Dex acquisition mutation.
9. The same first-form species remains capturable from its eligible ①/② acquisition encounter.
10. Stage2/final forms cannot be newly acquired by capture; confirmed self-evolution is the new-acquisition authority.
11. `evolutionDiscoveries`, not `dex.caught`, controls exact-species シンカしゅぎょう unlock.
12. Self-evolution discovery never re-enables evolved wild capture.
13. ③ deep/rematch and シンカしゅぎょう clears do not advance route progress.
14. Boss eligibility uses per-area `>=12 points && >=2 unique skills` in addition to route reachability.
15. New main areas start boss progress at `0 / empty`; previous-area progress is not carried forward.
16. Boss first clear persists next-area unlock.
17. `adventureLocation` persists the actual profile area/zone and does not auto-jump to highest unlocked area.
18. Returning to old areas leaves enough enemy-band stability for player growth to feel real.
19. EX exact unlock, grade/world direct coupling, and grade-reward species remain unresolved rather than invented.

This acceptance is behavioral. CSS classes, current function names, and current runtime file structure are not proof of compliance.
