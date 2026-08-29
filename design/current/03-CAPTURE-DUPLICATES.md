# ManaEvo CURRENT — Capture / Duplicates

Status: **CURRENT**  
Updated: 2026-08-29  
Owner: capture eligibility / capture result / duplicate settlement / capture presentation contract

## 1. Authority / boundary

Apply `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md` first.

Key decisions:

- D-004 — in-battle capture, HP gate, multipliers, 92% cap, max 3 attempts
- D-010 — first catch / duplicate choice / growth shard
- D-013 — child-facing 5-step ease + recommendation; exact % secondary
- D-017 — child-facing capture device becomes ManaEvo-original **ball** presentation
- Battle V6 decision — capturable wild monster may still be captured immediately after KO, without double Battle XP

Battle ticket settlement belongs to `02-BATTLE-TICKETS-BALANCE.md`.

## 2. Stable capture items and child-facing names

Stable domain/save keys do not change:

| stable key | child-facing name | multiplier / guarantee |
|---|---|---:|
| `star` | ほしボール | `1.00` |
| `silver` | ぎんボール | `1.20` |
| `gold` | きんボール | `1.50` |
| `rainbow` | にじボール | `100% guaranteed` |

Rules:

- non-rainbow final chance cap: `0.92`
- rainbow is guaranteed and is not capped at 92%
- one attempt consumes one selected capture item
- zero inventory means that item cannot be selected
- only rainbow may be described as guaranteed / 100%

Internal legacy variable names such as `ring`, `wa`, or older child-facing "○○のわ" text do not change stable save identity and must not be restored to child UI.

## 3. Capture opportunities

ManaEvo now has **two valid capture windows** for ordinary capturable wild encounters.

### 3.1 In-battle capture

Capture may be attempted while battle is still active when all are true:

- target encounter is capturable;
- target is not a boss/special `captureDisabled` encounter;
- enemy is alive;
- enemy HP ratio is `<= 50%`;
- fewer than 3 capture attempts have been used;
- chosen item inventory is available.

### 3.2 Post-KO wild capture — Battle V6

If the player KOs an ordinary capturable wild monster before capturing it:

- the battle win/KO resolves first;
- the wild encounter may expose one immediate post-KO capture opportunity state;
- the same max-3-attempt counter and item inventory still apply;
- capture-disabled / boss / special encounters do not gain this opportunity;
- Battle XP already settled for the KO is **not awarded again** on post-KO capture success;
- the newly captured monster does not retroactively receive that already-settled Battle XP;
- UI must wait until turn/KO presentation is complete before enabling the post-KO capture CTA.

This is not a return to the original old "capture only after battle" system. In-battle capture at HP<=50% remains valid; post-KO capture is an additional forgiving opportunity for wild encounters.

## 4. Capture chance

For non-rainbow items:

```text
finalChance = min(baseChance * itemMultiplier, 0.92)
```

For rainbow:

```text
finalChance = 1.00
```

The following are canonical:

- eligibility HP gate `<= 50%` for the in-battle window;
- item multipliers `1.00 / 1.20 / 1.50`;
- rainbow guarantee;
- non-rainbow cap 92%;
- max attempts 3.

The exact `baseChance` tuning formula is **not** promoted to immutable product law merely because current runtime has constants for missing HP / catch rank. Those values remain balance-tuning unless explicitly approved.

Post-KO capture reuses the same capture-domain chance contract; KO itself must not silently add a second success bonus unless explicitly approved later.

## 5. Capture result and battle settlement

### In-battle capture success

Capture success is a terminal successful battle outcome.

- battle result becomes caught/success;
- reserved ticket is consumed under W-102;
- Battle XP for a successful pre-KO capture follows the current canonical capture-XP rule;
- the newly captured monster does not receive the battle XP from the battle in which it was caught;
- no second KO is required.

### Post-KO capture success

- win/KO Battle XP has already been settled exactly once;
- capture settlement runs without another Battle XP grant;
- battle state transitions from won/post-KO-opportunity to caught/final capture result;
- duplicate settlement still follows §8.

### Capture failure

In an ordinary in-battle capture attempt:

- one attempt/item is consumed;
- failure keeps battle active unless the subsequent enemy/end-turn settlement ends it;
- the enemy may act according to battle rules;
- any defeat/KO caused by that continuation must use the common battle terminal settlement path.

In a post-KO failure, the already-defeated enemy does not receive an extra attack merely because the ball failed; the battle remains a won encounter with the remaining post-KO attempt state until attempts/items are exhausted or player finishes.

## 6. One throw + four-star presentation

The capture UI expresses a result already decided by the capture domain. UI must never reroll.

### Success flow

```text
choose one ball
→ throw exactly one ball
→ hit / ManaEvo-original containment effect
→ ★ ☆ ☆ ☆
→ ★ ★ ☆ ☆
→ ★ ★ ★ ☆
→ ★ ★ ★ ★
→ ball closes / success motion
→ GET
```

### Failure flow

- exactly one physical throw per attempt;
- stars illuminate over time;
- stop before 4 completed stars when the attempt fails;
- target escapes/releases from the containment effect;
- never display 4 fully completed stars for a failed attempt.

The four stars are presentation of one capture attempt, not four separate throws.

Do not copy an existing franchise's distinctive ball split, logo, color blocking, shake timing, sound, or capture animation. ManaEvo uses its own Mana/diamond visual language.

## 7. Child-facing probability display

Primary child-facing information:

- ball identity / color / Mana motif
- Japanese label
- inventory count
- remaining attempts
- recommendation
- 5-step ease cue

Baseline five-step wording may be used:

1. かなり つかまえにくい
2. つかまえにくい
3. ふつう
4. つかまえやすい
5. ほとんど つかまる

`おすすめ！` may highlight the best practical option.

Exact probability is secondary/detail information, not the dominant child CTA.

## 8. First catch / duplicate catch

### First owned instance of a species

When the species is not already owned:

- mark dex caught;
- add a new independent monster instance to BOX;
- do not show duplicate choice;
- do not overwrite another instance;
- automatic "なかま" means BOX ownership, not automatic replacement of the 3-member team.

### Duplicate catch

When the species is already owned, show exactly two choices:

#### `なかまにする`

- add a new independent instance to BOX;
- keep existing instances unchanged.

#### `おうえんにかえる`

- do not add the captured duplicate as a new BOX instance;
- grant `そだちのかけら +1`.

Growth shard rule:

- 3 shards may be consumed for `育成XP +30` to one selected owned monster;
- settlement must be idempotent;
- reload must not both add the duplicate and grant the shard.

## 9. Captured monster level pacing

Evolution pacing V5 applies to captured level-evolution monsters.

When a captured species evolves by level and the encountered enemy level is too close to or above its next evolution threshold, capture level is capped to at least **5 levels below the next level-evolution threshold**.

Purpose:

- prevent capture → immediate evolution from skipping the intended raising experience;
- preserve high-level encounter challenge without granting a nearly-ready evolution for free.

This applies to the captured monster instance level, not to the defeated enemy's battle presentation.

## 10. Exactly-once boundaries

A capture attempt/result needs stable identity across rerender, reload and cloud sync.

The implementation must prevent:

- consuming one ball twice;
- granting the captured instance twice;
- granting both duplicate outcomes;
- double Battle XP on post-KO capture;
- replaying 4-star success settlement after refresh;
- duplicating dex/caught changes.

## 11. Acceptance

A conforming implementation verifies:

- stable keys `star/silver/gold/rainbow` remain unchanged;
- child UI uses ほし/ぎん/きん/にじボール;
- in-battle capture unlocks at enemy HP<=50%;
- max 3 attempts;
- multipliers and 92% cap remain exact;
- rainbow remains guaranteed;
- wild post-KO capture exists without turning bosses/special battles capturable;
- KO Battle XP is not granted twice after post-KO capture;
- captured monster does not receive the battle's already-settled XP;
- one throw maps to one capture attempt;
- failed visual sequence never shows four completed stars;
- exact % stays secondary to child-readable ease/recommendation;
- first catch auto-adds an independent BOX instance;
- duplicate catch offers `なかまにする` / `おうえんにかえる`;
- 3 growth shards -> selected monster XP +30;
- level-evolution captures respect the 5-level evolution buffer;
- capture settlement is idempotent across reload/cloud boundaries.
