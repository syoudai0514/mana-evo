# ManaEvo CURRENT — Battle / Tickets / Boss Balance

Status: **CURRENT**  
Updated: 2026-08-29  
Owner: battle start / ticket settlement / turn rules / damage / enemy scaling / Battle XP / boss rematch

## 1. Authority / boundary

Apply `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md` first.

Dependencies:

- learning / ticket earning: `01-LEARNING-REWARDS.md`
- capture probability / duplicate settlement / capture presentation: `03-CAPTURE-DUPLICATES.md`
- evolution / special forms: `04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`
- world unlock / encounter bands: `05-WORLD-PROGRESSION.md`

Battle runtime is evidence, not authority by itself.

## 2. New battle gate

A new battle can start only when all are true:

1. today's daily core is complete;
2. target stage/encounter is unlocked;
3. at least one valid battle ticket exists;
4. team has 1〜3 valid monsters;
5. an active monster can enter;
6. no other `activeBattle` is already in progress.

An existing `activeBattle` resumed after reload / Safari termination / crash is **not** a new battle.

## 3. Ticket lifecycle — Battle V6

Ticket lots retain their acquisition/expiry metadata and FEFO selection.

### Start

At new battle start, reserve exactly one valid ticket from the FEFO lot and persist the exact source lot in `activeBattle`.

### Played battle settlement

Battle V6 supersedes the older refund-on-loss/abandon rule.

Once a battle has actually been played to a terminal player outcome:

| Outcome | Reserved ticket |
|---|---|
| win | consume / commit |
| capture success | consume / commit |
| defeat | **consume / commit** |
| explicit voluntary abandon / leave | **consume / commit** |
| reload / browser close / crash | do not consume again; resume same battle |

Important:

- defeat is not a free retry loop;
- explicit abandon is not a free reroll;
- technical interruption must not be misclassified as abandon;
- the exact reserved source lot is settled, not an arbitrary newer ticket;
- reserve / commit / reward resolution are exactly-once by battle identity.

## 4. Team / active / switch

- team max: 3
- fielded monster: 1
- battle-start team membership is snapshotted for reward eligibility
- HP is tracked per individual monster
- switching does not heal

Voluntary switch:

- consumes the player's action;
- the switch itself completes before the enemy's ordinary action;
- enemy then acts against the newly active monster unless battle state prevents it.

Forced switch after active KO:

- if another teammate is alive, battle does not end;
- player chooses/receives the next active monster without an extra enemy turn solely for the forced switch.

Defeat occurs only when no eligible team member remains alive.

## 5. Battle stats

Battle-facing stats remain:

- HP
- ATK
- DEF
- SPD

No separate special attack/defense, IV or EV system is introduced.

For species base stat `base` and level `Lv`:

```text
HP  = floor(2 * baseHP  * Lv / 100) + Lv + 10
ATK = floor(2 * baseATK * Lv / 100) + 5
DEF = floor(2 * baseDEF * Lv / 100) + 5
SPD = floor(2 * baseSPD * Lv / 100) + 5
```

Special-form multipliers are owned by W-104.

Runtime compatibility currently clamps levels to 100. Do not treat that as a newly re-approved product cap unless explicitly decided later.

## 6. Damage — Battle V6

Current Battle V6 damage constants:

- STAB: `1.25`
- critical chance: `1/16`
- critical multiplier: `1.35`
- damage random: `0.92〜1.00`
- type effectiveness: `2 / 1 / 0.5 / 0`
- immunity returns 0 damage

Canonical formula:

```text
base = floor(
  floor((2 * Lv / 5 + 2) * power * ATK / DEF) / 50
) + 2

damage = floor(base * STAB * type * critical * random)
```

If `type == 0`, damage is 0. Otherwise minimum damage is 1.

Battle V6 deliberately reduced multiplicative burst compared with the older STAB 1.5 / crit 1.5 tuning because production playtest had too many one-hit wins/losses.

## 7. Turn order / status / protect

### Turn order

- higher SPD acts first;
- exact SPD tie is randomized;
- voluntary switch resolves before ordinary attacks;
- turn presentation must show action order clearly enough that the child understands who moved first.

### Protect

`まもる` remains a real battle action, not an always-available fifth move slot that bypasses move ownership.

Current contract:

- 100% success for the protected turn;
- prevents damage and applicable status effects that turn;
- cannot be used on consecutive turns;
- no PP/gauge system is required solely for Protect.

### Current status tuning

Runtime currently supports burn / paralysis / poison / sleep with the established immunity and end-turn rules. These are battle mechanics, but changing their constants is a canonical battle change and must pass the sync gate.

## 8. Enemy scaling — study-first fair-fight intent

### 8.1 Product intent

A team containing one high-level carry plus very weak reserves must **not** exploit team averaging to make ordinary enemies weaker than the monster actually entering battle.

The normal reference must therefore be anchored to the active battler and may use strongest-support context only to increase or stabilize challenge, never to undercut the active-only reference.

Canonical invariant:

```text
normalReferencePower >= activeMonsterPower
```

A softened support component may be used, but weak bench members must not reduce the result below active power.

### 8.2 Current V6 runtime implementation / known drift

Current main computes approximately:

```text
0.70 * activePower + 0.30 * strongestSupportPower
```

This was introduced to stop whole-team averaging, but if support is much weaker it can still fall below active-only power. That is a **runtime drift against the intended invariant**, not a new canonical permission to weaken the enemy. The open independent-review hotfix addresses this gap; until merged, reviewers must not rewrite the product intent to match the bug.

### 8.3 Normal difficulty target multipliers

Current Battle V6 tuning:

| difficulty | target multiplier | encounter XP pool |
|---|---:|---:|
| weak | `0.86` | 90 |
| normal | `0.96` | 110 |
| strong | `1.03` | 125 |
| rare | `1.08` | 145 |
| elite | `1.13` | 165 |

These are tuning constants and may change through playtest, but a change must update this contract in the same PR.

### 8.4 Normal repeat mastery

For already-cleared normal stages, growth should eventually make the old area feel easier rather than perfectly rescaling forever.

Current V6 mechanics preserve:

- first-clear reference snapshot;
- repeat reference cap around `1.10 × firstClearReferencePower`;
- defensive ease scaling with a floor around `0.70` for repeat mastery behavior.

This supports the product rule that returning to older areas after training should feel stronger.

## 9. Boss scaling / rematch

Bosses use stronger anti-carry-downscale protection than ordinary encounters.

Reference considers:

- weighted current team power;
- softened roster power;
- strongest-carry floor.

Current carry floor is approximately `0.80 × strongest roster power`; softened roster reference is approximately `0.85 × weighted roster power`.

Current boss ranks:

| Rank | target | HP | ATK | DEF | XP pool |
|---|---:|---:|---:|---:|---:|
| C | 1.04 | 1.30 | 1.00 | 1.02 | 180 |
| B | 1.10 | 1.45 | 1.03 | 1.05 | 200 |
| A | 1.16 | 1.60 | 1.05 | 1.07 | 220 |
| S | 1.22 | 1.75 | 1.08 | 1.10 | 250 |
| EX | 1.30 | 1.90 | 1.10 | 1.12 | 300 |

Normal story rematch behavior follows D-012:

- first valid boss snapshot is locked for ordinary rematch;
- training can make a later ordinary rematch easier;
- challenge rematch may rescale;
- when balance version invalidates an old snapshot, compute and persist one replacement snapshot, then lock again.

Current balance version: `6`.

## 10. Battle XP settlement

### 10.1 Encounter pool / V5 distribution

The stage defines an encounter XP pool.

Evolution pacing V5 changed settlement so the pool is not copied in full to every teammate.

Current base distribution:

- active battler: `40%` of encounter pool;
- other eligible teammate: `40%` of the active amount (`16%` of pool before later modifiers).

### 10.2 Battle V6 level-gap multiplier

For each pre-battle monster level versus enemy level:

| Player minus enemy level | multiplier |
|---|---:|
| `>= +15` | `0.15` |
| `>= +10` | `0.25` |
| `>= +6` | `0.50` |
| `-2 ... +5` | `1.00` |
| `<= -3` | `1.15` |
| `<= -5` | `1.25` |

This prevents old-area farming from remaining the fastest leveling path while still rewarding useful challenge.

The implementation must apply XP throttling before final level/evolution settlement semantics are considered complete. A later hotfix may correct ordering bugs; the product intent is that the level-gap rule is part of the canonical XP settlement, not merely display math.

## 11. Capture bridge / post-KO opportunity

Capture probability itself belongs to W-103.

Battle V6 adds a battle-state bridge for ordinary capturable wild encounters:

- in-battle capture remains available under W-103's HP gate;
- if the wild enemy is KO'd, the battle can retain a **post-KO capture opportunity**;
- post-KO capture is not available for capture-disabled/boss/special encounters;
- the battle's Battle XP is settled once;
- a successful post-KO capture does **not** grant that Battle XP again;
- the newly captured monster does not retroactively receive the already-settled battle XP.

The post-KO capture UI must not race ahead of the KO/turn presentation; the child should see the battle action resolve before the capture CTA becomes actionable.

## 12. Played-battle terminal settlement

Every player action path that can end the battle must converge on one authoritative terminal settlement path, including:

- ordinary move KO;
- Protect turn / end-turn status KO;
- voluntary switch followed by enemy/status KO;
- failed capture followed by enemy/status KO;
- forced-switch/defeat transitions.

A terminal result must not depend on which UI button happened to trigger the turn.

## 13. Study-first invariant

Battle tuning must support the learning-first product goal:

- game access is earned by meaningful study;
- routine battle duration and reward rate must not make battle farming dominate study time;
- enemy scaling must not reward intentionally adding weak bench monsters;
- old-area XP farming must diminish with level gap;
- losing cannot become a free no-cost reroll loop.

## 14. Acceptance

A conforming implementation must verify:

- daily core gate before new battle;
- exact ticket reserve/commit identity;
- loss and explicit abandon consume the played battle ticket;
- reload/crash resumes without a second reservation;
- team/active/switch/forced-switch semantics;
- Battle V6 STAB/crit/random constants;
- immunity = zero damage;
- normal reference never falls below active-only power;
- weak bench cannot lower enemy target;
- boss snapshot/rematch behavior;
- V5 XP distribution + V6 level-gap multiplier;
- old-area farming throttles correctly;
- post-KO wild capture has no double XP;
- all terminal turn paths settle consistently;
- turn/KO presentation gates the post-KO CTA;
- iPhone/WebKit child-flow tests remain green.
