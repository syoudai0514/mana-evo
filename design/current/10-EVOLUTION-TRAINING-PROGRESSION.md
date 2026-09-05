# ManaEvo — Evolution Training & Route Progression

Status: **CURRENT / CANONICAL**  
Decision: **D-031**  
Effective: 2026-09-05

This document defines the canonical relationship between normal encounters, acquisition by capture, confirmed self-evolution, the ①→②→③ route, and post-evolution training. Where older documents describe evolved-form wild acquisition or a different zone-clear count, this D-031 contract takes precedence.

---

## 1. Product goal

ManaEvo must reward the child for **raising a monster and choosing to evolve it**, rather than letting later forms be bypassed by direct capture.

The intended loop is:

`GET first form → raise it → confirm evolution → unlock training against that evolved form → gain XP more efficiently → continue raising/evolving`

Evolution is therefore both:

- an acquisition milestone; and
- a content-unlock milestone.

---

## 2. Acquisition authority

### 2.1 First form

- Stage 1 / first-form species may be obtained by capture when their encounter otherwise permits capture.
- Existing capture rules (HP gate, ring economics, attempt limit, etc.) remain authoritative.

### 2.2 Evolved forms

- Stage 2 and final forms **cannot be newly acquired by capture**.
- This applies to both capture during battle and post-win capture.
- The first canonical acquisition of an evolved form is a **confirmed self-evolution** of an owned monster.
- A blocked evolved-form capture must not consume a capture ring/item.
- Existing owned evolved monsters are never deleted or downgraded.

### 2.3 Legacy migration

Historical saves that predate reliable evolution provenance may retain grandfathered `evolutionDiscoveries` when the migration layer cannot distinguish old capture from old evolution. This is compatibility only; no new runtime path may create evolved-form ownership through capture.

---

## 3. Evolution discovery

`evolutionDiscoveries[speciesId]` is the canonical runtime signal that the child has reached an evolved form through the evolution flow, subject to legacy migration compatibility above.

A level threshold alone is not enough. A pending evolution alone is not enough. The player must confirm the evolution.

On first confirmed evolution into a form:

- Dex GET state is updated by the evolution flow;
- `evolutionDiscoveries[toSpeciesId] = true`;
- the corresponding **シンカしゅぎょう** becomes available when its source area is available;
- the evolution celebration tells the child that training has opened.

---

## 4. Normal route: ① → ② → ③

Each main area has three normal route zones.

- ① is available when the area opens.
- ② opens after **3 distinct eligible normal encounter first-clears** in ①.
- ③ opens after **3 distinct eligible normal encounter first-clears** in ②.

The counter is based on distinct stage IDs; replaying the same stage does not increment it.

The following do **not** count toward route progress:

- シンカしゅぎょう;
- retired/hidden evolved-form wild stages;
- bosses;
- giga/burst/special challenges;
- event/EX stages.

This prevents an evolution lock from making normal route progression impossible.

---

## 5. What appears in each zone

### ① / ②

Normal discover-and-capture play using first-form species appropriate to the area.

### ③

③ is the deeper, higher-level training part of the normal route. It uses strong/rematch encounters of **first-form species already belonging to that area**.

Purpose:

- keep ③ populated after evolved wild acquisition is removed;
- preserve capture legality;
- provide a clear place for higher-level normal training;
- avoid using locked evolved forms as route blockers.

An evolved form is never required to unlock ② or ③.

---

## 6. シンカしゅぎょう

Every evolved species (stage 2 or final) has a separate training encounter.

Properties:

- `kind = training`;
- hidden from the normal encounter/daily-route pool until unlocked;
- unlocked by the exact species' `evolutionDiscoveries` entry;
- does not count toward ①→②→③ route progress;
- capture is disabled;
- consumes the normal battle ticket and requires the day's learning completion, like ordinary battle access;
- may be replayed for growth;
- should be presented as **育成向け**, not as a new GET opportunity.

Training is separate from normal route depth. If the child self-evolves before ③ is unlocked, that training may still open; this is intentional because the evolution itself is the gate.

---

## 7. XP tuning

The existing battle-XP pacing remains:

- active battler receives 40% of the encounter XP pool;
- teammates receive 40% of the active amount;
- the purpose is to avoid one-session mass evolution while still rewarding a three-monster team.

D-031 adds one **non-stacking** location/training multiplier to the encounter XP pool:

| Battle source | XP multiplier |
|---|---:|
| normal zone ① | ×1.00 |
| normal zone ② | ×1.15 |
| normal zone ③ | ×1.30 |
| evolved-form training (non-final) | ×1.35 |
| final-form training | ×1.45 |

Rules:

- Training replaces the normal zone multiplier; it never multiplies on top of ×1.30.
- Boss XP is unchanged by these zone multipliers.
- Existing enemy difficulty XP still supplies the base pool.
- Existing repeat-stage mastery/easing behavior remains; reward and enemy-scaling concerns stay separate.
- A two-stage family whose stage 2 is final must receive the **final-form** training tier, not the non-final stage-2 tier.

These numbers are D-031 initial tuning values and may be playtest-tuned later without changing the acquisition/route structure.

---

## 8. Boss progression remains separate

D-031 does not replace the canonical area-boss learning gate.

Area boss eligibility remains:

- `progressPoints >= 12`; and
- at least `2` distinct skill IDs.

The route and learning gate serve different purposes:

- route clears show adventure progression;
- learning points/skills prove learning progression.

A boss located in ③ therefore requires the route to have reached ③ plus the existing learning eligibility.

---

## 9. Multiple-monster value

D-031 preserves and strengthens the reason to own multiple monsters:

- up to three monsters form the battle team;
- switching and type matchups create tactical value;
- all team members receive battle XP, with the active monster receiving more;
- evolving different families unlocks additional training encounters;
- therefore collecting and raising different species expands available growth content rather than only filling the Dex.

---

## 10. Save / migration requirements

The following must round-trip through local/cloud save:

- `evolutionDiscoveries`;
- normal stage clears used for route progress;
- training stage clears if recorded;
- monster species after confirmed evolution;
- XP/level earned from training.

No migration may:

- delete an already owned evolved monster;
- convert an evolved monster back to an earlier form;
- infer a new evolved-form capture permission from ownership alone.

---

## 11. UX requirements

- Locked normal zones show the remaining number of **different** normal encounter clears.
- Zone cards communicate that deeper zones award more XP.
- Training is presented in a separate `🥋 シンカしゅぎょう` section.
- Un-discovered evolved forms must not be exposed as normal daily encounter choices.
- On first self-evolution, the celebration states that training against the new form has opened.
- Training explicitly communicates `GETなし` / capture disabled and increased growth value.

---

## 12. Acceptance contract

D-031 is complete only when all of the following are covered by tests:

1. first forms remain capturable under normal capture rules;
2. stage 2/final forms are blocked in both normal and post-win capture with no ring spend;
3. a pending/qualified evolution does not unlock training before confirmation;
4. confirmed self-evolution records discovery and unlocks the exact training encounter;
5. retired evolved wild stages remain unavailable even after self-evolution;
6. ①→② and ②→③ require three distinct eligible normal clears;
7. duplicate clears and training clears do not advance route progress;
8. every ①/② zone has enough eligible normal encounters to avoid a deadlock;
9. every ③ zone has visible first-form deep/rematch battles and no visible evolved-form wild capture target;
10. XP increases ① < ② < ③;
11. training XP uses one training multiplier only, never zone×training stacking;
12. a two-stage family's final stage receives the final-form training tier;
13. area boss learning gate remains 12 points + 2 distinct skills;
14. existing owned evolved monsters remain intact through normalization/migration/cloud round-trip;
15. iPhone/iPad adventure, evolution, battle and save regressions remain green.
