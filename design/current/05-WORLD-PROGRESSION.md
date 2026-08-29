# ManaEvo CURRENT — World / Progression

Status: **CURRENT CANONICAL (W-105 + D-022 tuning override)**  
Date: 2026-08-29  
Work item: `W-105`

This document is the CURRENT canonical contract for ManaEvo world structure, adventure progression, wild-form availability, evolution-discovery world unlocks, boss-area progression, and persisted adventure location.

It does **not** make runtime authoritative, does not rewrite the immutable FINAL-CORRECTED baseline, and does not define learning, evolution-method, battle-balance, UI, save-platform, or monster-master details owned by other work items.

> **重要:** 本文のworld topology / self-evolution discovery / boss learning gate / persisted location等は維持する。本文§6の2026-08-25 level bandsはBattle V6（D-022）で後続置換済み。現在のproduction bandsは末尾§17を正とする。

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
- `design/rebuild/DECISION-LOG.md`, especially D-003, D-009, D-011, D-012, D-022
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
  - `src/game/content.js`
  - `src/game/engine.js`
  - `src/game/progression.js`

When this file conflicts with runtime, apply higher-authority confirmed decisions; runtime alone is not a reason to change the product contract.

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
- exact production level band is a tuning value; current D-022 value is §17.

Not canonicalized yet:

- exact EX unlock condition;
- whether EX is internally a numeric fifth area or another postgame container;
- exact EX zone count/route structure.

Current runtime's `area=5`, one `ex` zone, and all-main-boss default are implementation continuity/defaults, **not recovered immutable product truth**. See `BLOCKED DECISION` below.

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

## 6. World level bands — historical 2026-08-25 tuning, superseded by §17

The canonical structural rule remains: enemies have area/zone bands and do **not** fully scale to the player's current team.

The previous playtest bands were:

| Area | Zone | Zone ID | Old Lv band |
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

These exact numbers are **SUPERSEDED tuning evidence**, not current production bands. See §17.

Battle/balance owns the soft-scaling calculation. W-105 requires the result to be bounded by the applicable current zone band, equivalent in shape to:

```text
enemyLevel = clamp(zone.minLevel, softScaledLevel, zone.maxLevel)
```

See `design/current/02-BATTLE-TICKETS-BALANCE.md`.

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

D-009 restores the baseline learning-progress boss gate. Runtime clear-count-only gates are **not canonical**.

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

- that day's core task first clear: `+1`
- mastery milestone increase: `+2`
- chapter test first pass: `+3`

Repeated exploitation does not count:

- repeating the same question: `+0`
- repeating already-mastered trivial content without a new qualifying milestone: `+0`

The learning/reward producer belongs to W-101. W-105 owns per-area accumulation and boss-gate consumption.

### 9.3 Area isolation

Boss progress is area-specific.

- Area1 starts with its own progress state.
- Newly unlocked Area2/3/4 starts at `0 points / empty unique-skill set`.
- Previous area progress is not carried forward.
- Returning to an older area and performing eligible learning updates that older area's progress, not the newest unlocked area's progress.

### 9.4 Boss route relationship

A boss must be in an unlocked/reachable area route **and** satisfy the 12-point + 2-skill learning gate.

Route depth is separate from learning gate.

Explicitly invalid substitutes:

- 5 exploration clears
- full dex
- all species caught
- all subjects cleared

### 9.5 Boss clear -> next area

On first clear of Area1–3 boss, unlock the immediately next main area.

Boss clear and next-area unlock persist. Re-clear does not duplicate unlock state.

Boss rematch scaling/snapshot belongs to W-102 / D-012.

## 10. Persisted current adventure location

The profile owns a persisted current adventure location equivalent to:

```text
adventureLocation = {
  area: adventureArea,
  zoneId: string
}
```

Canonical meaning:

- `area` is adventure area, not monster source `area`;
- `zoneId` identifies selected/reached zone;
- profile-specific and survives reload;
- Adventure re-entry uses actual persisted location, not automatically highest unlocked area;
- Home/current-location consumers reflect actual location;
- returning from battle does not reset area/zone;
- unlocking a new area does not itself rewrite saved location.

W-107 owns save normalization/migration. Invalid migrated location must normalize deterministically to a valid unlocked location; W-105 does not invent exact migration fallback.

## 11. Returning to old areas must show growth

Past areas remain selectable after later areas unlock.

To preserve “I got stronger”:

- normal enemy levels remain bounded by area/zone tuning band;
- growth is not canceled by full enemy mirroring;
- stronger team therefore sees easier old-area experience;
- boss normal rematch preserves raising advantage through W-102/D-012.

This is a product requirement, not merely a balance preference.

D-022 additionally applies level-gap Battle XP throttling so old-area easy fights do not become the fastest leveling farm.

## 12. Grade / ahead learning / world evidence recovery

Kids Quest grade and ahead-learning belongs to learning domain. Evidence does **not** establish an exact direct rule that school grade unlocks ManaEvo areas.

Therefore:

- do not invent direct `grade -> adventureArea` gate;
- do not claim grade can never affect world progression in future;
- confirmed Area1–4 chain remains boss-clear based;
- additional grade/world coupling requires evidence or later decision.

### 12.1 Grade reward species

Grade-reward characters remain a candidate concept but exact species assignment was not recovered. No worker may assign by taste/rarity/area/runtime availability.

This does not block Area1–4 progression.

## 13. Cross-work-item interfaces

- **W-101 / Learning-Rewards**: produces qualifying learning milestones; W-105 attributes/stores per-area boss progress.
- **W-102 / Battle-Tickets-Balance**: owns normal/boss battle level calculation, Battle XP and boss rematch; W-105 supplies current area/zone band and access constraints.
- **W-103 / Capture-Duplicates**: owns capture/result; W-105 determines world encounter availability.
- **W-104 / Evolution**: writes own-evolution outcomes / `evolutionDiscoveries`; W-105 reads discovery.
- **W-106 / UI**: renders route/current location without redefining rules.
- **W-107 / Save**: persists/migrates location/discoveries/unlocks/boss progress.
- **W-108 / Acceptance**: converts behavior to product-level tests.
- **W-109 / Monster**: owns source identity; W-105 never rewrites source identity to fit placement.

## 14. Current runtime delta ledger — historical baseline note

The original W-105 ledger was written before the Phase 3 implementation and Battle V6. Do not use old “current runtime” sentences as live truth.

Still-current governance points:

- separate `adventureArea` placement
- entrance/mid/deep structure
- `evolutionDiscoveries` separate from `dex.caught`
- non-final evolved wild discovery gate
- final wild prohibition
- persisted location
- boss learning gate 12 points + 2 skills

Current production level bands are §17.

## 15. `BLOCKED DECISION` — non-blocking

### BD-W105-01 — EX exact unlock / representation

Known: EX/postgame direction approved.

Unknown:

- exact unlock condition
- exact route/zone structure
- whether numeric Area5 is final internal model

Current all-four-boss unlock may be continuity default but is not immutable product truth.

### BD-W105-02 — grade directly unlocking world regions

Unknown. Do not add speculative grade gate.

### BD-W105-03 — grade reward species assignments

Unknown. Do not invent assignments.

### BD-W105-04 — exact evolved-form relocation map

Known: source area and adventure placement are separate; evolved forms after self-evolution belong in later/advanced/deep play.

Unknown: fully approved species-by-species placement map.

Do not mutate source area; preserve current placement only as continuity default until approved.

## 16. Implementation acceptance derived from W-105

A later implementation is aligned only if:

1. source `area` distinct from adventure placement;
2. Area1 initial; Area2–4 sequential by previous boss first clear;
3. earlier areas revisit-able;
4. entrance/mid/deep route;
5. route clear `2` treated as tuning;
6. **current D-022 bands in §17** and no full enemy mirroring;
7. first-form wild acquisition default subject to role exceptions;
8. non-final evolved form unavailable wild before own evolution;
9. `evolutionDiscoveries`, not `dex.caught`, gates that wild unlock;
10. final forms cannot be ordinary wild capture;
11. boss eligibility `>=12 points && >=2 unique skills`;
12. new main areas boss progress `0 / empty`;
13. clear-count-only boss gate invalid;
14. boss first clear persists next-area unlock;
15. `adventureLocation` persists actual profile area/zone;
16. old areas preserve growth feeling;
17. EX/grade/grade-reward/placement unresolved items remain unresolved.

## 17. 2026-08-29 Battle V6 production level-band override — D-022

Battle V6 slowed XP/evolution pacing and additional battle access. The prior bands assumed much faster leveling and made later areas trivial too quickly.

Current production bands:

| Area | Zone | ID | CURRENT Lv band |
|---|---|---|---:|
| 1 | entrance | `meadow` | **5–8** |
| 1 | mid | `forest` | **9–12** |
| 1 | deep | `deep` | **13–16** |
| 2 | entrance | `foothill` | **14–18** |
| 2 | mid | `magma` | **19–23** |
| 2 | deep | `deep` | **24–27** |
| 3 | entrance | `coast` | **24–29** |
| 3 | mid | `frost` | **30–35** |
| 3 | deep | `deep` | **36–40** |
| 4 | entrance | `city` | **37–44** |
| 4 | mid | `skyway` | **45–51** |
| 4 | deep | `deep` | **52–58** |
| EX | current single zone | `ex` | **55–100** |

Area envelopes:

- A1 `5–16`
- A2 `14–27`
- A3 `24–40`
- A4 `37–58`
- EX `55–100`

These remain **TUNING** rather than immutable lore. Future playtest change is allowed, but D-023 requires the same PR to update this contract and Decision Log.

Battle scaling must remain inside these bounds. W-102's fair-fight logic cannot escape the current world band merely to perfectly match player power.

D-022 level-gap Battle XP further discourages old-area farming while preserving old-area access and the feeling of becoming stronger.
