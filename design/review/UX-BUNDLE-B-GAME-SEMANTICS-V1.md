# ManaEvo Bundle B — Game Semantics / Battle Experience V1

Status: **DESIGN REVIEW ONLY — NO IMPLEMENTATION YET**  
Date: 2026-09-02  
Scope: Issue #146 semantic portion + #147  
Canonical branch at design start: `main`

This document is the grouped design-review packet for:

1. Capture probability / ball balance
2. Battle presentation / SFX / FX
3. Player-confirmed normal evolution
4. BOX family-oriented organization

Do not implement this document until independent review passes or changes are incorporated.

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

Startup / D-020:

- Bundle B must not alter startup SW/Dex maintenance behavior

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

## 4. Proposed canonical base chance V1

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

### 4.2 HP depth inside the already-confirmed 50% gate

Once HP is <=50%, lower HP should improve capture **modestly**, not dominate the species/rank identity.

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
- defeating rank1 raises the star-ball cumulative chance to ~97%, but one throw is only 70%, so `ほし` no longer feels literally guaranteed
- rank2 is still practical with ordinary balls and strongly improved by silver/gold
- rank3 is a meaningful choice point
- rank4/5 remain exciting and preserve guaranteed-ball value
- rainbow remains the only literal 100%

This is deliberately more forgiving per throw than the hardest mainline Pokémon encounters because ManaEvo allows only three attempts.

---

## 6. Capture UI contract

- Child primary UI remains qualitative, not giant exact percentages.
- Five-step cue should represent **current one-throw chance**, because the child is choosing the next physical ball now.
- Exact % remains under `くわしい かくりつ`.
- `おすすめ！` should not blindly choose rainbow just because 100% is numerically highest.

### Recommendation policy

Protect scarce premium items:

1. If star gives >=70%, recommend star.
2. Else if silver gives >=70%, recommend silver.
3. Else if gold materially improves chance, recommend gold.
4. Rainbow is marked `かならず GET` but is not automatically `おすすめ！` for ordinary/common encounters.
5. For top-rank/story-critical one-off encounters, rainbow may be explicitly recommended by the encounter contract.

The exact recommendation thresholds are reviewable UI policy, not capture probability itself.

---

# PART B — Battle presentation / SFX / FX

## 7. Problem

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

## 8. Presentation sequence

### Battle entry

```text
stage opens
→ enemy art enters
→ `○○が あらわれた！`
→ species-seeded `cry()`
→ normal command state
```

### Player attack

```text
user taps move exactly once
→ domain `useMove` resolves exactly once
→ UI receives immutable before/after result
→ attack FX + swoosh
→ target flash/shake
→ hit / hitBig
→ effectiveness copy
→ rendered HP settles at already-resolved domain value
→ next command state
```

### Enemy attack

Same principle: presentation mirrors the already-resolved enemy action. It never calls enemy AI or damage logic.

### Victory

```text
enemy reaches defeat result
→ defeat visual beat
→ `○○を たおした！`
→ fanfare
→ reward summary
→ post-win GET chance if eligible
```

### Capture

Existing D-017 sequence remains:

```text
throw → impact → four-star suspense → caught/escaped
```

Do not replace the capture flow with Pokémon-specific shake timing or design.

---

## 9. Exactly-once presentation architecture

Hard rule:

> Animation/SFX observes a committed domain result. Animation callbacks never execute game semantics.

Implementation direction:

- `act(moveId)` calls `useMove(...)` once.
- result supplies/derives a presentation descriptor from immutable before/after battle snapshots.
- immediately commit the returned game state.
- local presentation state temporarily blocks another action while the short FX sequence plays.
- CSS/SFX may lag behind the committed result, but domain settlement must not wait for animation completion.

Recommended presentation event ID:

```text
battleId + turn + actor + action/move + resulting status
```

Keep a component-local set/ref of already-presented IDs.

D-021 guarantees rotation/resize does not semantic-remount the active battle; therefore presentation state can remain UI-local. A full browser reload may replay the most recent visual/audio cue, but must not replay damage/reward. That is acceptable.

Do NOT:

- call `useMove` from `animationend`
- call capture settlement from a timer
- grant XP when fanfare ends
- compute damage in CSS/presentation code
- delay domain commit until motion finishes

---

## 10. FX vocabulary

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

## 11. New user-approved product direction

The child should feel **`じぶんで シンカさせた`**.

Therefore supersede only the auto-commit part of W-104:

OLD CURRENT:

- level / held-item qualifying LvUP immediately changes species and then shows evolution presentation

TARGET:

- qualifying LvUP creates **persistent evolution readiness**
- the result flow immediately offers `✨ シンカする！`
- child presses the button to commit evolution
- child may choose `あとで`
- later, Monster/BOX clearly shows `✨ シンカできる！` and active button

Stone evolution is already manually committed and remains so.

---

## 12. Evolution readiness state

Do not overload a bare boolean as the authority. Persist a qualified token:

```text
pendingEvolution = {
  qualificationId,
  fromSpeciesId,
  toSpeciesId,
  method,                 // level | held_item_levelup
  qualifiedAtLevel,
  itemId?                 // held-item path only
}
```

Compatibility mirror `evolutionReady=true` may be retained if old save/tests need it, but the structured token is authoritative.

### Qualification

On a real LvUP:

- level method: if newLevel >= threshold, create pending token
- held_item_levelup: if required item is equipped during the real LvUP, create pending token
- no species change yet
- XP/Lv is committed immediately

### Manual commit

`confirmEvolution(game, instanceId, qualificationId)`:

- authority is CURRENT game state, not stale UI snapshot
- token must still belong to the same instance/from/to transition
- operation is idempotent
- species changes once
- instanceId/Lv/XP persist
- discovery writes once
- token clears once
- celebration is presentation after the commit

### `あとで`

- dismisses only presentation
- readiness stays in save/cloud
- no resource is lost
- badge remains in Team/BOX/detail

### Held-item safety

To preserve the prior held-item contract:

- if the required held item is changed/removed **before confirmation**, pending held-item evolution is invalidated
- a later re-equip alone is insufficient; another actual LvUP is required

This rule should be explained in UI before allowing item replacement while readiness is pending.

### Delayed level evolution and multiple stages

If a child delays stage1 evolution beyond the next stage's numeric threshold:

- confirming stage1 does NOT silently chain to stage2
- stage2 requires another explicit qualifying LvUP event under its own transition
- each evolution remains a separate child action

---

## 13. Immediate flow after battle/XP

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

Capture, duplicate-choice, forced-switch, and post-win capture modal have priority over an evolution prompt when overlapping. The pending token guarantees it is not lost.

---

# PART D — BOX organization

## 14. Problem

CURRENT BOX is simply:

```text
Object.values(game.box).sort((a,b) => b.level - a.level)
```

So it is level order, not acquisition order, and family/evolution relationships are scattered. Same species can appear separated by other monsters.

---

## 15. Target BOX information architecture

Default view: **`シンカ順`**.

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

### Optional sort

Keep one secondary sort option:

- `レベル順`

Do not add `GET順` until the save model has an authoritative capture/acquisition timestamp for every legacy and new instance. Inferring object insertion order would create another false contract.

### Team indication

BOX rows show a compact `チーム` badge, but Team composition continues to be managed through existing explicit controls. Do not reorder Team based on BOX sort.

### Evolution affordance

A pending evolution should be visually obvious at family/group and row level:

- `✨ シンカできる！`
- selecting the monster opens detail
- `✨ シンカする！` is active there

---

# PART E — Acceptance / independent review gate

## 16. Required unit/domain tests

Capture:

- exact five rank values at HP50
- exact five rank values at HP0/post-win
- interpolation monotonic as HP decreases
- ball multipliers 1 / 1.2 / 1.5
- non-rainbow <=92%
- rainbow exactly 100%
- 3-attempt limit unchanged
- failed post-win attempt has no retaliation/reward replay
- probability table generated from the same exported constants used by runtime

Evolution:

- qualifying LvUP creates token but does not change species
- `あとで` persists across save/reload/cloud payload
- confirm changes species exactly once
- duplicate confirmation is idempotent
- level and held-item paths both covered
- held-item replacement invalidates pending token as designed
- stone path unchanged / one stone spent once
- delayed stage1 confirm does not auto-chain stage2
- discoveries written only after confirmed evolution

BOX:

- family grouping / species adjacency
- duplicate instances preserved
- Team order unchanged

---

## 17. Required WebKit/E2E

Representative iPhone 375 / 390 / 430 and tablet responsive smoke:

1. battle starts with appearance copy
2. appearance/attack/hit/victory presentation does not block primary action indefinitely
3. one tap produces exactly one domain move/turn
4. rotation during FX does not duplicate move/reward
5. reduced-motion remains usable
6. capture chance detail matches domain values
7. common rank1 is not visually described as guaranteed with star
8. rainbow is the only guaranteed label
9. level-up can show `シンカする！` / `あとで`
10. choose `あとで`, reload, readiness remains
11. confirm later from BOX, species changes once
12. BOX family view keeps same family and duplicates adjacent

---

## 18. Independent review questions

Reviewer must answer all of these before implementation:

1. Is the proposed capture table sufficiently forgiving for the 3-throw ManaEvo constraint while preserving ball-tier value?
2. Does the Pokémon sanity comparison use only generic interaction/balance structure, without importing formulas or identity?
3. Is HP-within-50% a useful modest choice, or should rank alone determine chance once eligible?
4. Is rank1 star 55% at threshold / 70% defeated appropriately fun for early play?
5. Are rank4/5 probabilities low enough that rainbow remains meaningfully scarce but not so low that three attempts feel hopeless?
6. Is presentation fully separated from semantic battle transactions?
7. Can any timer/animation/re-render duplicate a move, turn, XP, ticket or capture settlement?
8. Is persistent manual evolution readiness safe across save/cloud/reload?
9. Should a held-item pending evolution be invalidated if the item is changed before confirmation?
10. Is the no-auto-chain rule correct after a delayed evolution?
11. Does family-first BOX grouping solve the real-device usability problem without mutating game identity/order semantics?
12. Does any proposal conflict with D-020/D-021 or CURRENT capture/evolution authority beyond the explicitly user-approved changes?

### Review verdict format

Use exactly one:

- `DESIGN PASS — READY FOR BUNDLE B IMPLEMENTATION`
- `DESIGN PASS WITH CHANGES — REVISE BEFORE IMPLEMENTATION`
- `DESIGN BLOCKED`

For every requested change include file/section, severity, reason, and exact recommended correction.
