# ManaEvo CURRENT — World / Progression

Status: **CURRENT**  
Updated: 2026-08-29  
Owner: adventure world / area+zone progression / boss gate / encounter level bands / evolution-discovery wild unlocks

## 1. Authority / boundary

Apply `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md` first.

World owns:

- Area / zone structure
- stage placement layer
- area/zone unlocks
- boss challenge learning gate
- recommendation level bands
- persisted adventure location
- evolution-discovery wild availability

It does not own:

- Kids Quest learning algorithms — W-101
- ticket settlement / damage / Battle XP — W-102
- capture probability — W-103
- evolution methods/items/special forms — W-104
- UI composition — W-106
- monster identity/type/family — W-109

## 2. Area structure

Main adventure areas remain 1〜4 plus EX.

- Area 1: ひかりの のはら
- Area 2: ほのおの かざん・すなの たに
- Area 3: こおりの うみ・ふかい もり
- Area 4: ぎんがの みやこ・そらの はて
- Area 5: EX いせかい

The original monster `sourceArea` is identity/master provenance. Adventure placement is a separate layer and may move evolved forms later without rewriting source identity.

## 3. Zone structure

Main areas use a three-step child-readable route:

1. entrance / early zone
2. middle zone
3. deep zone

The exact zone labels/icons are runtime presentation data; the progression principle is sequential discovery rather than showing the full world as one flat stage list.

Current route-clear count is a **tuning default**, not a permanent product law. Runtime currently uses `ROUTE_CLEAR_TUNING_DEFAULT = 2` for the next-zone gate where applicable.

## 4. Battle V6 recommendation bands

Battle V6 supersedes the older production bands `5〜22 / 18〜38 / 32〜58 / 50〜80`.

Current production recommendation bands are:

### Area 1 — Lv.5〜16

- はじまりの そうげん: `5〜8`
- こもれびの もり: `9〜12`
- ひかりの おくち: `13〜16`

### Area 2 — Lv.14〜27

- かざんの ふもと: `14〜18`
- マグマどうくつ: `19〜23`
- すなあらしの おくち: `24〜27`

### Area 3 — Lv.24〜40

- こおりの かいがん: `24〜29`
- じゅひょうの もり: `30〜35`
- ふかい もりの おく: `36〜40`

### Area 4 — Lv.37〜58

- ほしの みやこ: `37〜44`
- てんくう かいろう: `45〜51`
- ぎんがの はて: `52〜58`

### EX — Lv.55〜100

- EX いせかい: `55〜100`

Reason:

- Battle XP/evolution pacing was slowed;
- additional learning now earns battle access more slowly;
- the old bands assumed a much faster first-day XP economy and caused later areas to become trivial too quickly.

These numbers are production tuning. A later playtest may change them, but the same PR must update this contract under the canonical-sync gate.

## 5. Encounter enemy level

A stage receives the min/max level bounds of its current Adventure zone.

Enemy scaling then operates **inside those bounds** under `02-BATTLE-TICKETS-BALANCE.md`.

World bands therefore define valid placement/range; battle scaling chooses the encounter's actual fair-fight level/stat plan within those limits.

Do not let battle scaling escape the stage's world bounds merely to perfectly match the player's team.

## 6. Area unlock

- Area 1 is initially available.
- Area 2 unlocks after Area 1 boss first clear.
- Area 3 unlocks after Area 2 boss first clear.
- Area 4 unlocks after Area 3 boss first clear.
- EX currently uses all-main-bosses-cleared as a continuity default unless a later explicit EX decision replaces it.

A newly unlocked main area starts its own boss-learning progress from zero/empty state.

## 7. Boss challenge gate — learning progression

D-009 remains CURRENT.

A main-area boss becomes eligible when that area's learning progress satisfies both:

```text
progressPoints >= 12
uniqueSkillCount >= 2
```

Learning-side progression signals come from W-101, including:

- first clear of a core task: `+1` world-progress point
- qualifying mastery milestone: `+2`
- first chapter/star-trial pass: `+3`

Repeated easy farming / repeated same already-accounted event does not mint duplicate progress.

The boss gate is **not** replaced by "clear 5 adventure stages" or another exploration-only counter.

## 8. Boss first clear / rematch

Boss first clear:

- requires the learning gate;
- records the boss stage clear idempotently;
- unlocks the next main area where applicable;
- may grant the owning non-world rewards through their own domains.

Boss rematch balance is W-102 / D-012:

- ordinary rematch uses the locked first valid snapshot;
- later training can make the same story boss easier;
- challenge rematch may rescale.

## 9. Evolution-discovery wild rules

The product goal is to preserve the experience of **raising and evolving your own monster**, not obtaining every evolved form directly from the wild.

### First evolved form

Where a family has a later wild placement for its second form:

- the player's **first acquisition of that second form must be by their own evolution**;
- record the evolution discovery separately, e.g. `evolutionDiscoveries`;
- only after that discovery may the corresponding later wild encounter become available.

### Final form

Final evolution forms remain unavailable as ordinary wild captures unless an explicit special/event rule says otherwise.

This prevents wild capture from replacing the main raising/evolution loop.

## 10. Adventure placement layer

Adventure placement may differ from baseline `sourceArea`.

Current continuity direction:

- stage-1 forms appear in early/mid zones of their adventure area;
- eligible second forms can move to a deeper/later area and are discovery-gated;
- boss/evolution/special trials are placed at deep progression points;
- final forms are not ordinary wild targets.

Do not alter family identity or sourceArea in order to achieve world placement.

## 11. Persisted location

Player/profile adventure location is persisted independently per profile.

It must survive:

- normal reload;
- cloud round-trip;
- profile switching;
- app/PWA restart.

A location that becomes invalid after a migration must be normalized safely to an unlocked valid destination without corrupting progression.

## 12. Return-to-old-area mastery feeling

World + battle systems must allow training to matter.

The game must not fully rescale every old encounter forever. Returning to Area 1 after raising a stronger team should usually feel easier.

This is supported by:

- fixed world level bands;
- normal-stage first-clear/repeat caps in W-102;
- level-gap Battle XP throttling that discourages exploiting easy areas for fastest leveling.

The intended result is:

- old area = easier / confidence-building / collection use;
- appropriate area = best routine challenge/reward;
- much stronger area = harder but can reward more XP.

## 13. Study-first invariant

World progression cannot become a way to bypass learning.

- boss eligibility is learning-progress based;
- daily core gate still controls new battle entry;
- zone/stage clear alone does not replace mastery learning signals;
- lower old areas should not become optimal infinite XP farms;
- world recommendation bands should remain consistent with the actual study/battle/XP economy.

## 14. Acceptance

A conforming implementation verifies:

- Area 1〜4 sequential unlock by prior boss clear;
- boss gate `12 points + 2 unique skills`;
- new area boss progress starts clean;
- Battle V6 area/zone bands exactly match this document;
- stage enemy level stays inside its zone band;
- battle scaling cannot escape world bounds;
- second-form first acquisition is self-evolution where discovery-gated;
- self-evolution unlocks the permitted later wild encounter;
- final forms are not ordinary wild captures;
- `sourceArea` is not mutated to implement adventure placement;
- profile location persists safely;
- old areas become relatively easier after training;
- level-gap XP discourages old-area farming without deleting old-area play.
