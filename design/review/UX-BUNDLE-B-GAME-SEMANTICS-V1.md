# ManaEvo Bundle B — Game Semantics / Battle Experience V1.1

Status: **DESIGN REVIEW ONLY — REVISED, NO IMPLEMENTATION YET**  
Date: 2026-09-02  
Scope: Issue #146 semantic portion + #147  
Canonical branch at design start and V1.1 review base: `main`

This document is the grouped design-review packet for:

1. Capture probability / ball balance
2. Battle presentation / SFX / FX
3. Player-confirmed normal evolution
4. BOX family-oriented organization

V1.1 incorporates all seven required changes from the independent review of V1 (`DESIGN PASS WITH CHANGES — REVISE BEFORE IMPLEMENTATION`). Bundle B runtime implementation remains blocked until this revision receives a new independent design verdict.

---

## 0. Authority and non-negotiable compatibility

Authority precedence:

1. explicit user decisions
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/*`
4. exact FINAL-CORRECTED baseline where not superseded
5. approved later design
6. runtime only as drift evidence

### Confirmed rules that this design MUST preserve

Capture / D-017:

- stable item keys: `star / silver / gold / rainbow`
- child names: ほしボール / ぎんボール / きんボール / にじボール
- multipliers: `1.00 / 1.20 / 1.50 / rainbow guaranteed`
- non-rainbow final one-throw cap: `0.92`
- normal in-battle capture eligibility at enemy HP `<= 50%`
- maximum 3 throws per battle
- capture result is decided by domain exactly once; four-star sequence is presentation only
- post-win capture may use remaining throws
- post-win capture failure cannot trigger enemy retaliation
- victory rewards already settled before post-win capture must never be granted twice

Evolution:

- active 238 species / 155 normal transitions
- stable species and instance identity
- methods remain `level / stone / held_item_levelup`
- stone consumes exactly one stone on successful evolution
- successful self-evolution writes `evolutionDiscoveries`
- no Star Awakening
- special forms remain separate from normal evolution

Runtime continuity / D-021:

- resize/rotation is presentation only
- no duplicate battle action, capture attempt, evolution commit, reward, ticket settlement

Cloud/profile identity / D-018 + D-023:

- stable profile ID remains save identity
- cloud snapshot must round-trip complete game state
- profile switching may not cross an active Battle/Capture/Evolution transactional boundary
- presentation-only UI fallbacks must not rewrite cloud semantic state

Startup / D-020:

- Bundle B must not alter startup SW/Dex maintenance behavior

### Canonical-promotion gate

This review document is **not** authority to silently override CURRENT.

After V1.1 receives `DESIGN PASS — READY FOR BUNDLE B IMPLEMENTATION`, and **before runtime implementation begins**, canonical promotion must:

1. fresh-read CURRENT `main` again;
2. fresh-search Decision Log / issues / PRs for Decision-ID collision;
3. allocate the next free Decision IDs rather than assuming D-024 is still free;
4. keep capture tuning and manual-evolution semantics as separate Decisions where practical, so future capture retuning cannot implicitly rewrite evolution semantics;
5. update at minimum:
   - W-103 / CURRENT Capture authority,
   - W-104 / CURRENT Evolution authority,
   - relevant W-106 / W-108 Battle presentation and acceptance clauses,
   - Decision Log;
6. only then start Bundle B runtime implementation.

Candidate numbering is D-024 for capture and D-025 for manual evolution **only if both remain free at promotion time**.

---

# PART A — Capture balance

## 1. Problem with CURRENT compatibility tuning

`src/game/captureDomain.js` currently carries a compatibility-only formula:

```text
base = clamp(0.12,
  0.34 + missingHpRatio * 0.62 - catchRank * 0.07,
  0.90)
```

The CURRENT capture design explicitly says these coefficients are not a product invariant.

A defeated low-rank enemy can currently reach roughly 89% with a ほしボール on one throw. Real-device playtest therefore feels as if the lowest ball almost always succeeds, weakening the value of ぎん/きん.

This is a design/runtime drift to resolve, not a reason to canonize the runtime coefficients.

---

## 2. Historical intent to preserve

The FINAL-CORRECTED capture design used four rarity rates and intentionally produced:

- common: ordinary ball is forgiving; several throws are almost certain but not literally guaranteed
- rare / epic: stronger capture item has clear value
- legendary/top rarity: ordinary items remain genuinely difficult
- only the guaranteed item may say 100%

Historical defeated-enemy examples included approximately:

| old rarity | basic 1 throw | basic 3 throws | strongest non-guaranteed 1 throw | strongest non-guaranteed 3 throws |
|---|---:|---:|---:|---:|
| common | 83% | 99.5% | 100% under old multiplier | 100% |
| rare | 46% | 84% | 77% | 98.8% |
| epic | 27% | 61% | 46% | 84% |
| legend | 10% | 27% | 17% | 42.8% |

Later D-017 changed ball multipliers to 1.0 / 1.2 / 1.5 and added in-battle HP<=50% capture. Therefore these historical numbers are **intent evidence**, not values to copy verbatim.

---

## 3. Commercial Pokémon sanity check — structure only

Mainline Pokémon capture generally has the same broad structure:

- species-specific catchability
- lower remaining HP helps
- stronger / situational balls modify catchability
- a Master Ball-class item bypasses normal probability and guarantees capture

The numerical balance should NOT be copied.

Important product difference:

- Pokémon generally allows many ordinary ball attempts during a battle and has status-condition capture bonuses.
- ManaEvo has a hard **3-throw maximum** and currently has no sleep/paralysis-style capture modifier.

Therefore using mainline legendary single-digit probabilities directly would make ManaEvo materially harsher. ManaEvo needs higher per-throw chances while preserving the same hierarchy.

External sanity reference used for review only: Bulbapedia `Catch rate` (current Gen III–IX summaries and Master Ball guarantee). No formula or proprietary constant is adopted into ManaEvo.

---

## 4. V1 TUNING-DEFAULT capture chance

The five rank values and HP bonuses below are **V1 TUNING-DEFAULT** values:

- canonical for Bundle B implementation and exact tests once promoted;
- intentionally visible/reviewable rather than hidden compatibility coefficients;
- not claimed to be immutable structural laws;
- may be retuned later only by explicit playtest-backed product decision.

D-017's stable keys, ball multipliers, 92% non-rainbow cap, rainbow guarantee, HP<=50% eligibility and 3-attempt maximum remain structural unless separately changed.

### 4.1 Use existing `catchRank` 1–5

Existing master already defines:

```text
rarityRank(common)=1
rarityRank(rare)=2
rarityRank(epic)=3
rarityRank(legend)=4
catchRank = min(5, rarityRank + stage - 1)
```

Do not introduce a second rarity field for capture runtime.

Area1 already includes rare/catchRank2 stage1 species, so early-play acceptance must cover rank1 **and rank2**.

### 4.2 HP depth inside the already-confirmed 50% gate

Once HP is <=50%, lower HP improves capture **modestly**, without overriding species/rank identity.

```text
hpRatio = clamp(enemyHp / enemyMaxHp, 0, 0.50)
eligibleDepth = clamp((0.50 - hpRatio) / 0.50, 0, 1)
```

`eligibleDepth=0` at exactly 50% HP.  
`eligibleDepth=1` at defeated/post-win HP0.

### 4.3 Rank table

```text
baseAt50 = {
  1: 0.55,
  2: 0.42,
  3: 0.28,
  4: 0.16,
  5: 0.10
}

lowHpBonus = {
  1: 0.15,
  2: 0.13,
  3: 0.10,
  4: 0.08,
  5: 0.05
}

baseChance = baseAt50[catchRank] + lowHpBonus[catchRank] * eligibleDepth
```

Then preserve D-017:

```text
if rainbow:
  finalChance = 1.00
else:
  finalChance = min(baseChance * ballMultiplier, 0.92)
```

### Why a table instead of another linear coefficient formula

- rank identity is visible and reviewable
- balance intent is easy to compare against master data
- changing one rank does not accidentally distort every rank
- tests can lock the five product values directly
- no meaningless compatibility coefficients remain hidden in runtime

---

## 5. Expected probabilities

Each `3投` figure below means three independent throws of the **same** ball from that HP point. Actual play may mix balls, and previous attempts carry into post-win capture.

| catchRank | HP | ほし 1投 / 3投 | ぎん 1投 / 3投 | きん 1投 / 3投 | にじ |
|---:|---|---:|---:|---:|---:|
| 1 | 50% | 55.0% / 90.9% | 66.0% / 96.1% | 82.5% / 99.5% | 100% |
| 1 | 0%/撃破 | 70.0% / 97.3% | 84.0% / 99.6% | 92.0% / 99.9% | 100% |
| 2 | 50% | 42.0% / 80.5% | 50.4% / 87.8% | 63.0% / 94.9% | 100% |
| 2 | 0%/撃破 | 55.0% / 90.9% | 66.0% / 96.1% | 82.5% / 99.5% | 100% |
| 3 | 50% | 28.0% / 62.7% | 33.6% / 70.7% | 42.0% / 80.5% | 100% |
| 3 | 0%/撃破 | 38.0% / 76.2% | 45.6% / 83.9% | 57.0% / 92.0% | 100% |
| 4 | 50% | 16.0% / 40.7% | 19.2% / 47.2% | 24.0% / 56.1% | 100% |
| 4 | 0%/撃破 | 24.0% / 56.1% | 28.8% / 63.9% | 36.0% / 73.8% | 100% |
| 5 | 50% | 10.0% / 27.1% | 12.0% / 31.9% | 15.0% / 38.6% | 100% |
| 5 | 0%/撃破 | 15.0% / 38.6% | 18.0% / 44.9% | 22.5% / 53.5% | 100% |

### Product reading

- early/common rank1 is not frustrating: even throwing at 50% gives >90% cumulative with three star balls
- defeating rank1 raises the star-ball cumulative chance to ~97%, but one throw is only 70%, so `ほし` is not literally guaranteed
- rank2 is still practical with ordinary balls and strongly improved by silver/gold
- rank3 is a meaningful choice point
- rank4/5 remain exciting and preserve guaranteed-ball value
- rainbow remains the only literal 100%

This is deliberately more forgiving per throw than the hardest mainline Pokémon encounters because ManaEvo allows only three attempts.

---

## 6. Capture UI contract — deterministic

Child primary UI remains qualitative, not giant exact percentages. Exact % remains under `くわしい かくりつ`.

### 6.1 Five-step cue

The cue represents the **current selected ball's final one-throw chance** after HP/rank/multiplier/cap.

Use exactly these deterministic bands:

| one-throw chance | child-facing cue |
|---:|---|
| `< 20%` | `かなりつかまえにくい` |
| `20% – <40%` | `つかまえにくい` |
| `40% – <60%` | `ふつう` |
| `60% – <80%` | `つかまえやすい` |
| `>=80%` | `ほとんどつかまる` |

Rainbow additionally displays `かならず GET` because it is the only guaranteed item. A non-rainbow ball capped at 92% never receives a guaranteed label.

The band function must be shared/exported so runtime and tests cannot drift.

### 6.2 Recommendation policy

Recommendation is inventory-aware and deterministic.

Ball strength/cost order for this policy:

```text
star < silver < gold
```

Algorithm:

1. Consider only **owned** non-rainbow balls.
2. Among those with current one-throw chance `>= 70%`, recommend the weakest/cheapest one.
3. If none reaches 70%, recommend the owned non-rainbow ball with the highest one-throw chance.
4. If equal, prefer the weaker/cheaper ball.
5. Rainbow is never an automatic recommendation from probability alone.
6. Rainbow may receive `おすすめ！` only when the encounter contract explicitly opts in **and** rainbow is owned.
7. If the player owns no non-rainbow ball and there is no explicit rainbow recommendation override, show no automatic recommendation.

There is no `materially improves` branch and no implementation discretion around these thresholds.

---

## 7. Capture economy sanity contract

Bundle B may rebalance success probability, but it must **not invent acquisition sources**.

CURRENT canonical learning-side sources remain:

- `ほしボール`: daily reward `+3`, plus `+1` per 3 additional-learning correct answers
- `ぎんボール`: normal MASTER reward `+1`
- `きんボール`: hard MASTER reward `+1`
- `にじボール`: learning-side allocation/source remains unresolved in CURRENT

Therefore:

- rainbow scarcity/value is **not** considered fully economy-validated by this Bundle B probability review;
- Bundle B must not add a new rainbow source, cadence, shop, exchange or reward path;
- any future rainbow acquisition design requires its own explicit design/Decision review.

Expected ほしボール consumption per encounter under the 3-attempt cap (`1 + q + q²`, stopping after success or the third failure) is approximately:

| catchRank | HP50% expected star balls | defeated/HP0 expected star balls |
|---:|---:|---:|
| 1 | 1.65 | 1.39 |
| 2 | 1.92 | 1.65 |
| 3 | 2.24 | 2.00 |
| 4 | 2.55 | 2.34 |
| 5 | 2.71 | 2.57 |

Interpretation:

- rank1/rank2 early encounters remain compatible with repeatable star supply;
- rank3 begins to make silver/gold meaningfully attractive;
- rank4/rank5 can consume most/all of the 3-attempt budget with ordinary balls, preserving premium-ball value;
- this table supports the V1 tuning defaults but does not claim that future real-device playtest can never retune them.

---

# PART B — Battle presentation / SFX / FX

## 8. Problem

The battle domain is functional, but real-device playtest feels quiet:

- no strong `enemy appeared` beat
- attack selection has little launch feedback
- impact is visually weak
- effectiveness is mostly text
- victory has insufficient payoff

CURRENT already has WebAudio effects:

- `cry`
- `swoosh`
- `hit`
- `hitBig`
- `fanfare`
- `star`
- `reward`

Use these before adding large audio assets.

---

## 9. Presentation sequence

### Battle entry

```text
stage opens
→ enemy art enters
→ `○○が あらわれた！`
→ species-seeded `cry()`
→ normal command state
```

### Player command transaction

One player tap may resolve **both player and enemy actions** in speed order inside one committed domain transaction.

Therefore the UI must not reconstruct the sequence from only a before/after snapshot.

```text
user taps move exactly once
→ domain `useMove` resolves exactly once
→ domain returns committed next game state + ordered `presentationEvents[]`
→ game state is committed immediately
→ UI replays event 0, 1, 2... only as presentation
→ command input unlocks after the trace finishes or safely skips
```

If the enemy is faster, the ordered trace can legitimately be:

```text
enemy attack → player HP change → player attack → enemy HP change
```

If the player's first action ends the battle, the trace contains only actions that actually occurred.

### Victory

```text
ordered combat trace reaches terminal result
→ defeat visual beat
→ `○○を たおした！`
→ fanfare
→ already-committed reward summary
→ post-win GET chance if eligible
```

### Capture

Existing D-017 sequence remains:

```text
throw → impact → four-star suspense → caught/escaped
```

Do not replace the capture flow with Pokémon-specific shake timing or design.

---

## 10. Ordered domain-produced presentation trace

Hard rule:

> Animation/SFX observes an immutable trace produced by the committed domain transaction. Animation callbacks never execute game semantics.

`useMove(...)` must return a semantic result shaped conceptually as:

```text
{
  game: committedNextGame,
  presentationEvents: [
    {
      eventId,
      battleId,
      turn,
      ordinal,
      actor,             // player | enemy | system
      kind,              // move | damage | heal | protect | effectiveness | defeat | reward-marker ...
      moveId?,
      target?,
      hpBefore?,
      hpAfter?,
      effectiveness?,
      critical?,
      status?,
      terminalStatus?
    }
  ]
}
```

Exact implementation shape may use narrower typed variants, but these invariants are mandatory:

1. `presentationEvents[]` is emitted by domain/result construction from the **actual resolved action order**.
2. `ordinal` is strictly increasing within the transaction.
3. `eventId` is deterministic from semantic identity, e.g. `battleId + turn + ordinal + actor + kind + moveId/result discriminator`; never random/time-based.
4. HP before/after is captured at the relevant intermediate action, not reconstructed from final state.
5. Human-readable battle-log strings are not parsed to recover actor/order/damage/effectiveness.
6. The returned game state is committed before/independently of animation completion.
7. UI owns only a presentation cursor / already-presented event IDs.
8. Timer, `animationend`, SFX completion, CSS callback, re-render and rotation may only advance/skip the cursor.
9. They may never call `useMove`, enemy AI, damage, XP, Mana, reward, ticket, capture settlement or evolution settlement.

D-021 requires resize/rotation to preserve the active interaction without semantic remount. If a full browser reload destroys an in-flight visual trace, the app resumes from committed state; it may skip or replay a harmless cue, but it must never rerun the semantic transaction.

Do NOT:

- infer action order only from one before/after snapshot
- call `useMove` from `animationend`
- call capture settlement from a timer
- grant XP when fanfare ends
- compute damage in CSS/presentation code
- delay domain commit until motion finishes

---

## 11. FX vocabulary

Keep effects stylized and ManaEvo-specific:

- normal attack: short forward pulse + mana trail
- strong hit: target shake + radial mana burst
- super effective: warm double-ring burst + `こうかばつぐん！`
- resisted: small shield ripple + `いまひとつ`
- immune: deflection/ripple + `きかない！`
- heal: upward mana particles
- protect: shield flash
- enemy appearance: scale/fade/ground pulse, not a copied franchise entrance

`prefers-reduced-motion: reduce`:

- remove travel/shake transforms
- keep short opacity/highlight state
- keep semantic text and SFX setting independent

---

# PART C — Player-confirmed evolution

## 12. New user-approved product direction

The child should feel **`じぶんで シンカさせた`**.

Therefore supersede only the auto-commit part of W-104 after canonical promotion:

OLD CURRENT:

- level / held-item qualifying LvUP immediately changes species and then shows evolution presentation

TARGET:

- qualifying event creates **persistent evolution readiness**
- the result flow immediately offers `✨ シンカする！`
- child presses the button to commit evolution
- child may choose `あとで`
- later, Monster/BOX clearly shows `✨ シンカできる！` and active button

Stone evolution is already manually committed and remains so.

---

## 13. Evolution readiness state

Do not overload a bare boolean as the authority. Persist a qualified token:

```text
pendingEvolution = {
  qualificationId,
  sourceOperationId,
  fromSpeciesId,
  toSpeciesId,
  method,                 // level | held_item_levelup
  qualifiedAtLevel,
  itemId?,                // held-item path: evidence at qualification time
  qualificationKind       // levelup | migration | post-confirm-threshold | max-level-held-item-recovery
}
```

Compatibility mirror `evolutionReady=true` may be read during migration if old saves need it, but the structured token becomes authoritative after normalization.

### 13.1 Deterministic qualification identity

`qualificationId` must never use `Date.now()`, random UUID or presentation time.

Conceptual deterministic key:

```text
qualificationId =
  `evo:${sourceOperationId}:${instanceId}:${fromSpeciesId}->${toSpeciesId}`
```

`sourceOperationId` is the stable semantic operation that caused qualification, such as the XP/reward settlement operation ID. Migration and recovery paths use deterministic synthetic operation IDs tied to schema version + instance + transition, for example:

```text
migration:vNEXT:${instanceId}:${fromSpeciesId}->${toSpeciesId}
post-confirm:${parentQualificationId}:${instanceId}:${fromSpeciesId}->${toSpeciesId}
max-level-held-item:${instanceId}:${fromSpeciesId}->${toSpeciesId}:${itemId}
```

The exact string format is implementation-owned; determinism and causal identity are the contract.

### 13.2 Qualification on normal play

On a real LvUP:

- `level`: if newLevel >= threshold, create pending token
- `held_item_levelup`: if the required item is equipped during that real LvUP, create pending token
- no species change yet
- XP/Lv is committed immediately
- repeated normalization/rendering cannot create a second different token for the same causal event

### 13.3 Manual commit

`confirmEvolution(game, instanceId, qualificationId)`:

- authority is CURRENT game state, not stale UI snapshot
- token must still belong to the same instance/from/to transition
- operation is idempotent
- species changes once
- instanceId/Lv/XP persist
- discovery writes once
- token clears once
- celebration is presentation after the commit
- after commit, the newly reached species is re-evaluated under section 13.7; this may create a **new token**, never a second automatic species mutation

### 13.4 `あとで`

- dismisses only presentation
- readiness stays in local save/cloud
- no resource is lost
- badge remains in Team/BOX/detail
- reload/profile switch/other device round-trip must preserve the token

### 13.5 Held-item qualification is earned and persistent

A valid `held_item_levelup` qualification is a historical earned event.

Once the token exists:

- changing/removing the held item **does not invalidate** the pending evolution;
- `itemId` in the token is evidence of the item present at qualification time;
- confirmation does not require that item to still be currently equipped;
- later re-render/load cannot revoke the token because inventory changed.

### 13.6 W104-BD01 resolved: held item is retained / not consumed

Bundle B resolves the prior held-item evolution ambiguity:

> **Held items are not consumed by held-item evolution.**

Reason:

- matches CURRENT runtime behavior;
- cleanly distinguishes held-item evolution from stone evolution, where the stone is intentionally consumed;
- avoids deferred-confirmation escrow/reservation complexity;
- preserves whatever item is currently equipped at confirmation time, even if it differs from the historical qualifying `itemId`.

Stone evolution remains unchanged: exactly one required stone is consumed on successful stone evolution.

### 13.7 Delayed evolution, multi-stage families and no-brick recovery

Core rule remains:

> One confirmation performs at most one species mutation. No silent auto-chain.

After confirming stage1 → stage2, immediately re-evaluate stage2's next transition:

#### Next transition is `level`

If the monster's **existing current level already meets the next threshold**, create a **new separate pending token** with `qualificationKind=post-confirm-threshold`.

The child must press `シンカする！` again for stage2 → stage3.

No extra LvUP is required merely to re-prove a numeric level condition already satisfied.

#### Next transition is `held_item_levelup` and current level < 100

Normal rule remains: another real LvUP while the required item is equipped creates the next token.

#### Max-level held-item recovery

At Lv100 another LvUP is impossible, so a recovery path prevents permanent evolution lock:

- if the newly reached species at Lv100 already has its required held item equipped, create a new pending token through `max-level-held-item-recovery`;
- otherwise, equipping the required held item at Lv100 creates that pending token;
- this is the only exception where equipping alone substitutes for the otherwise required held-item LvUP event;
- it creates readiness only; the child must still explicitly press `シンカする！`;
- it never performs an automatic second species mutation.

This recovery is deterministic/idempotent for the same instance + transition + required item.

#### Stone next transition

Stone remains its existing explicit/manual path and is not converted into `pendingEvolution` merely because level is high.

---

## 14. Save schema and migration contract

Bundle B must not add `pendingEvolution` only in UI/runtime memory. It is part of the authoritative game save.

### 14.1 Schema/version

At implementation:

- bump the game save schema/version;
- update `normalizeBox()` / equivalent whitelist so `pendingEvolution` is validated and round-tripped;
- reject malformed/stale transition tokens safely rather than executing them;
- include the field in local persistence, cloud snapshot, backup/restore and profile switching.

### 14.2 Migration of legacy saves

Migration is deterministic and idempotent.

For each legacy monster instance:

1. **Already evolved species**: preserve current species; never regress to a prior form and never synthesize a prior-form token.
2. **Legacy `evolutionReady=true` on a held-item source form with the matching required item evidence available**: convert to one deterministic `held_item_levelup` pending token with `qualificationKind=migration`.
3. **Legacy level-method source form already at/above its level threshold**: grandfather one deterministic level pending token with `qualificationKind=migration`, even though old CURRENT would normally have evolved immediately. This prevents old/edge saves from being stranded by the new manual-confirmation model.
4. **Held-item source form with no trustworthy legacy evidence of a qualifying event**: do not invent a historical held-item LvUP qualification merely from current level. Normal future qualification applies, except the explicit Lv100 recovery rule.
5. **Stone transition**: no token is synthesized; existing manual stone flow remains authoritative.
6. Clear/deprecate bare legacy readiness mirrors after normalized state has the structured authoritative token, while keeping read compatibility only as long as migration requires.

Migration token IDs use stable synthetic operation IDs, never wall-clock time/randomness.

### 14.3 Round-trip acceptance

The same token identity/content must survive:

```text
local save → reload
local → cloud payload → second device
profile A → profile B → profile A
backup → restore
schema normalization repeated twice
```

A round-trip must not:

- clear readiness;
- generate a different qualificationId;
- duplicate the token;
- mutate species;
- write a discovery;
- trigger a false cloud semantic change after the first completed migration save.

---

## 15. Immediate flow after battle/XP

When XP causes one or more teammates to qualify:

```text
reward/level-up summary
→ `○○は シンカできる！`
→ [✨ シンカする！] dominant
→ [あとで] secondary
```

If multiple team members qualify in one settlement:

- queue stable `instanceId` order from the reward result
- each confirmation is independent/idempotent
- `あとで` skips that presentation only, not readiness

Capture, duplicate-choice, forced-switch, and post-win capture modal have priority over an evolution prompt when overlapping. The persistent token guarantees it is not lost.

If one confirmation creates a second-stage token under section 13.7, the second readiness may be presented immediately after the first acknowledgement, but it remains a **separate explicit confirmation**.

---

# PART D — BOX organization

## 16. Problem

CURRENT BOX is simply:

```text
Object.values(game.box).sort((a,b) => b.level - a.level)
```

So it is level order, not acquisition order, and family/evolution relationships are scattered. Same species can appear separated by other monsters.

---

## 17. Target BOX information architecture

Default sort: **`シンカ順`**.

Group by evolution family.

Within a family:

1. stage1 species
2. stage2 species
3. stage3/final species
4. duplicate instances of the same species stay adjacent
5. same-species duplicates order by level descending, then stable instanceId

Family groups order by the lowest species No. in the family.

Example:

```text
FAMILY モコハ
  モコハ       Lv.12
  モコハ       Lv.7
  ワカバネ     Lv.24  ✨シンカできる
  ジュランガ   Lv.35

FAMILY ヒノポ
  ヒノポ ...
```

Do not auto-merge duplicates and do not change instance identity.

### 17.1 Sort controls

Exactly two sort choices in Bundle B:

- `シンカ順` — default
- `レベル順` — secondary

Do not add `GET順` until the save model has an authoritative acquisition timestamp for every legacy and new instance. Existing/legacy `caughtAt` or object insertion order must not be promoted into a false acquisition-order contract.

### 17.2 `シンカできる` filter

Add one independent toggle:

- `✨ シンカできるだけ`

When ON:

- show only instances with a valid authoritative `pendingEvolution` token or an equivalent explicit stone/manual readiness already owned by CURRENT UI contract where applicable;
- preserve the selected sort (`シンカ順` or `レベル順`);
- do not mutate BOX contents, Team order or instance identity;
- an empty result shows a child-friendly empty state rather than falling back silently to all monsters.

The filter is a view projection only and is not persisted as game semantics. Device-local UI preference persistence is optional; default on first entry is OFF.

### 17.3 Team indication

BOX rows show a compact `チーム` badge, but Team composition continues to be managed through existing explicit controls. Do not reorder Team based on BOX sort/filter.

### 17.4 Evolution affordance

A pending evolution should be visually obvious at family/group and row level:

- `✨ シンカできる！`
- selecting the monster opens detail
- `✨ シンカする！` is active there

---

# PART E — Acceptance / independent review gate

## 18. Required unit/domain tests

### Capture

- exact five V1 TUNING-DEFAULT rank values at HP50
- exact five rank values at HP0/post-win
- interpolation monotonic as HP decreases
- ball multipliers 1 / 1.2 / 1.5
- non-rainbow <=92%
- rainbow exactly 100%
- 3-attempt limit unchanged
- failed post-win attempt has no retaliation/reward replay
- probability table generated from the same exported constants used by runtime
- exact five cue boundaries `<20 / 20–<40 / 40–<60 / 60–<80 / >=80`
- recommendation considers owned inventory only
- cheapest owned non-rainbow >=70% wins recommendation
- if none >=70%, highest-probability owned non-rainbow is recommended
- rainbow never auto-recommended without explicit encounter override
- no Bundle B code adds a rainbow acquisition source

### Battle presentation trace

- `presentationEvents[]` preserves real domain speed/action order
- enemy-first transaction exposes enemy event before player event
- terminal first action omits an action that never occurred
- intermediate `hpBefore/hpAfter` values match actual semantic steps
- ordinals stable/increasing and event IDs deterministic
- UI replay does not call domain action functions
- timer/animation/re-render/rotation cannot duplicate move/damage/XP/Mana/ticket/reward/capture settlement
- human-readable log text is not parsed to recover semantic order

### Evolution

- qualifying LvUP creates token but does not change species
- qualificationId deterministic from causal semantic identity
- `あとで` persists across save/reload/cloud payload
- confirm changes species exactly once
- duplicate confirmation is idempotent
- level and held-item paths both covered
- changing/removing held item after qualification does **not** invalidate token
- held-item evolution does not consume held item
- stone path unchanged / one stone spent once
- delayed stage1 confirm never auto-mutates stage2
- delayed stage1 confirm at/above next level threshold creates a second distinct pending token
- Lv100 held-item recovery works when required item is already equipped and when equipped later
- Lv100 recovery still requires explicit confirmation
- discoveries written only after confirmed evolution

### Save/migration/cloud

- schema/version bump
- `normalizeBox()` round-trips pending token
- repeated normalization is idempotent
- legacy held-item readiness with matching evidence migrates deterministically
- legacy level source form at/above threshold receives migration pending token
- already-evolved species never regress
- malformed/stale token cannot mutate species
- local reload preserves token/qualificationId
- cloud round-trip preserves token/qualificationId
- profile A→B→A preserves token
- backup/restore preserves token
- first migration may update schema; subsequent no-op load must not create repeated semantic hash drift

### BOX

- family grouping / species adjacency
- duplicate instances preserved
- `シンカ順` default and `レベル順` secondary deterministic
- `シンカできるだけ` filter returns only eligible instances
- filter does not mutate underlying BOX
- Team order unchanged by sort/filter
- GET順 absent

---

## 19. Required WebKit/E2E

Representative iPhone 375 / 390 / 430 and tablet responsive smoke:

1. battle starts with appearance copy
2. enemy-first and player-first traces animate in actual semantic order
3. appearance/attack/hit/victory presentation does not block primary action indefinitely
4. one tap produces exactly one domain transaction/turn
5. rotation during FX does not duplicate move/reward
6. reduced-motion remains usable
7. capture chance detail matches domain values
8. capture qualitative cue matches deterministic threshold boundaries
9. recommendation follows owned-inventory algorithm
10. common rank1 is not visually described as guaranteed with star
11. rainbow is the only guaranteed label and is not normally auto-recommended
12. level-up can show `シンカする！` / `あとで`
13. choose `あとで`, reload, readiness remains
14. swap a held item after held-item qualification; readiness remains and confirm succeeds without consuming item
15. confirm later from BOX, species changes once
16. delayed high-level stage1 confirm creates separate next-stage readiness without auto-chain
17. Lv100 held-item recovery reaches readiness and still requires a second explicit press
18. BOX family view keeps same family and duplicates adjacent
19. `シンカできるだけ` finds pending instances and preserves Team order
20. profile switch is blocked while Evolution acknowledgement is active and token survives after acknowledgement/switch round-trip

---

## 20. Independent review questions — V1.1

Reviewer must answer all of these before implementation:

1. Are the accepted V1 TUNING-DEFAULT capture values still sufficiently forgiving for early rank1/rank2 under the documented economy sources?
2. Does the Pokémon sanity comparison remain limited to generic interaction/balance structure, without importing formula/constants/UI/audio identity?
3. Are the five qualitative probability bands and inventory-aware recommendation algorithm fully deterministic and testable?
4. Does the economy section correctly avoid inventing rainbow supply and correctly distinguish tuning defaults from structural rules?
5. Does the domain-produced ordered `presentationEvents[]` trace remove the before/after ambiguity for speed-ordered two-actor turns?
6. Can any timer/animation/re-render/rotation path still duplicate or initiate game semantics?
7. Is the pendingEvolution save schema/migration contract sufficient for local/cloud/profile/backup round-trip without false hash churn?
8. Is it correct that held-item qualification remains earned after item swap, and that held items are retained/not consumed on evolution?
9. Does the delayed-stage re-evaluation preserve explicit child confirmation while preventing Lv100/threshold evolution bricks?
10. Is the Lv100 held-item recovery narrow enough to be a recovery rather than silently changing normal held-item progression?
11. Do family-first sorting plus `シンカできるだけ` solve the BOX discoverability problem without mutating Team/instance semantics or inventing GET order?
12. Does the canonical-promotion gate correctly require fresh Decision-ID collision checking and CURRENT W-103/W-104/W-106/W-108 updates before runtime implementation?

### Review verdict format

Use exactly one:

- `DESIGN PASS — READY FOR BUNDLE B IMPLEMENTATION`
- `DESIGN PASS WITH CHANGES — REVISE BEFORE IMPLEMENTATION`
- `DESIGN BLOCKED`

For every requested change include file/section, severity, reason, and exact recommended correction.

Until the first verdict above is returned for this exact revised head, PR #151 remains Draft and Bundle B runtime implementation remains prohibited.
