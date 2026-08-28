# ManaEvo CURRENT — Evolution Pacing V5

Status: **CURRENT approved gameplay-balance change**  
Owner: Game Function / progression pacing  
Approval evidence: **2026-08-28 explicit user playtest decision**  

## 1. User-visible goal

Routine first-day play must not consume several evolution milestones at once. Evolution remains a meaningful multi-session growth reward rather than a same-day batch event.

This change does **not** roll back monsters, levels, catches, items, or evolutions already earned by existing players.

## 2. Battle XP settlement

The existing stage XP value remains the encounter reward pool for compatibility and reporting.

Actual monster XP settlement is paced as follows:

- active battler: **40%** of the encounter XP pool;
- other eligible battle-start teammates: **40% of the active battler's XP**;
- minimum positive settlement remains 1 XP when an eligible recipient receives XP;
- learning-earned tickets and their seven-day lifecycle are unchanged.

For the ordinary 110 XP encounter pool this means:

- active battler: 44 XP;
- eligible teammate: 18 XP.

The intent is to preserve the value of studying more (more play opportunities) without converting a long first-day session into simultaneous party evolution.

## 3. Capture growth runway

When a captured species has a level-based next evolution, its captured level must be at least **5 levels below** that evolution threshold.

Examples:

- Lv17 evolution threshold → captured at no higher than Lv12;
- Lv19 threshold → captured at no higher than Lv14;
- Lv21 threshold → captured at no higher than Lv16.

Stone and held-item evolution methods are not changed by this capture-level buffer.

## 4. Non-goals

This change does not:

- raise all canonical evolution levels;
- remove or reduce learning-earned tickets;
- change stone evolution rules;
- change held-item level-up evolution rules;
- rewrite historical player progress;
- alter Monster Art or species identity.

## 5. Acceptance criteria

The implementation is acceptable when all of the following hold:

1. A fresh Lv5 starter receiving 21 ordinary active-battler win equivalents remains below its Lv17 first evolution threshold.
2. A teammate receives reduced support XP rather than the same full XP as the active battler.
3. A captured level-evolution species retains a five-level growth runway before its next level evolution.
4. Already-earned player state is untouched.
5. Existing battle/capture/evolution contracts still pass automated tests.
6. Build and release-readiness checks pass before main merge.
7. Production deployment is verified after merge.
