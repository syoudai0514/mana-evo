# ManaEvo CURRENT — Learning / Rewards

Status: **CURRENT**  
Updated: 2026-08-29  
Owner: learning rules and the learning → game reward bridge

## 1. Authority / boundary

Apply `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md` first.

Learning-content authority remains Kids Quest under D-005 and the exact baseline import contract.

Kids Quest owns:

- grade / domain / unit structure
- question content / generation
- stable learning IDs
- mastery / SRS / review / mistakes
- `わからない`
- star trial / promotion
- English / TTS
- grade controls / ahead learning
- learning save behavior

ManaEvo does **not** redesign those algorithms. ManaEvo owns the adapter from semantic learning events into game rewards, world-progress signals and ManaEvo-only UI/storage integration.

Active learning source is `src/kids-quest-study/**`. `src/study/**` is legacy/regression evidence only.

## 2. Daily core

A normal day has **5 core tasks**. This means five tasks, not five questions.

Question counts remain Kids Quest-owned. Current imported defaults include:

- 国語 / `yomu`: 5
- 算数 / `suuji`: 5
- ordinary scheduled domain: 4
- 道徳 when scheduled: 2

A **new battle may not start until today's core is complete**, even when the child owns a still-valid ticket from an earlier day.

An already-active battle resumed after reload/crash is not a new battle and is not blocked by the new-day core gate.

### Daily first-completion reward

On the first transition to daily core complete for that day, exactly once:

- battle ticket `+3`
- stable capture item `star +3`（child-facing: ほしボール）
- exploration point `+2`

Each first-cleared core task also emits the existing world-progress signal `+1` for the owning area progression bridge.

## 3. Additional learning / free / extra / okawari

### Free study

Free study has **no direct battle-ticket reward**.

It may still produce legitimate Kids Quest learning progress. A real mastery transition caused by free study still receives the mastery reward below.

### Extra learning — Battle V6

Battle V6 supersedes the older rule "each cleared extra question -> ticket +1".

Current production rule:

> **every 5 correct `extra` answers after daily core completion -> battle ticket +1**

Implementation constant: `EXTRA_CORRECT_PER_BATTLE_TICKET = 5`.

Rules:

- count correct `extra` answers, not task completion UI events;
- reward each 5-correct milestone exactly once;
- no separate daily cap is added by ManaEvo;
- `free` and unrelated `okawari` boundaries must not mint this ticket;
- reload/replay must not duplicate the milestone reward;
- the child must have completed daily core before an `extra` correct contributes the production ticket grant.

Each legitimate cleared extra question still grants:

- exploration point `+1`

Separately, every **3 correct answers in additional learning** grants:

- stable capture item `star +1`（child-facing: ほしボール）

The 3-correct capture-item milestone and the 5-correct ticket milestone are independent cumulative counters.

## 4. `わからない`, mistakes and completion integrity

`わからない` remains available.

Canonical behavior:

1. record it as a first-attempt miss;
2. show support/explanation;
3. return the item to reinforcement/review/SRS according to Kids Quest;
4. do not turn explanation acknowledgement into a correct first attempt;
5. where the Kids Quest task requires a correct re-answer, require it before protected completion/reward is released.

ManaEvo must not remove `わからない` to simplify reward accounting.

## 5. SRS / mastery / star trial / ahead learning

These remain Kids Quest-owned.

### Unit MASTER

Use the imported Kids Quest `unitReady` rule. The pinned source currently requires the established combination of attempts, first-attempt correct count, distinct-day evidence and multi-item exposure where applicable.

Reward only the **false -> true** transition:

- normal unit MASTER -> stable capture item `silver +1`（ぎんボール）
- hard unit MASTER -> stable capture item `gold +1`（きんボール）

Do not grant again for later correct answers in an already-mastered unit.

### Mastery/world progression signal

When the canonical skill/mastery level advances by a qualifying milestone:

- exploration point `+2`
- world-progress signal `+2`

### Star/chapter trial first pass

On the first qualifying pass for that grade/chapter:

- exploration point `+5`
- world-progress signal `+3`

Repeated replay does not re-grant.

No learning-side `rainbow` grant is invented unless an explicit later decision defines it.

## 6. Current reward matrix

| Learning event | Battle ticket | Capture item | Exploration | World progress |
|---|---:|---:|---:|---:|
| First daily transition to all core tasks complete | `+3` | `star +3` | `+2` | — |
| First clear of one core task | — | — | — | `+1` |
| Each legitimate cleared extra question | — | — | `+1` | — |
| Every 5 correct `extra` answers after core done | `+1` | — | — | — |
| Every 3 correct additional-learning answers | — | `star +1` | — | — |
| Normal unit becomes MASTER | — | `silver +1` | — | — |
| Hard unit becomes MASTER | — | `gold +1` | — | — |
| Qualifying mastery level advances | — | — | `+2` | `+2` |
| First qualifying chapter/star-trial pass | — | unresolved rainbow | `+5` | `+3` |

Child-facing capture-item names are governed by D-017:

- star -> ほしボール
- silver -> ぎんボール
- gold -> きんボール
- rainbow -> にじボール

Stable save/domain keys remain unchanged.

## 7. Ticket lifetime

Every ticket grant is a dated lot.

- valid for acquisition day plus the following six days;
- expired when day `D+7` begins;
- consumption selection is FEFO;
- daily core gate never deletes a carried lot.

Battle-time reservation and played-battle settlement are owned by `02-BATTLE-TICKETS-BALANCE.md`.

Important Battle V6 dependency: once a battle has actually been played to win/capture/loss/explicit abandon, the reserved ticket is consumed. Reload/crash remains resume, not another reservation.

## 8. Anti-spam / reward hold

Keep the imported multi-signal anti-spam design: suspicious behavior protects the **game bonus** without corrupting legitimate learning state.

Principles:

- one fast answer alone is not enough;
- learning progress is not zeroed merely because reward protection is active;
- protected additional-learning game bonuses may be held rather than deleted;
- normal answers can release held rewards under the existing policy;
- reward delivery remains idempotent.

The canonical policy uses recent-answer signals such as very-fast ratio, error ratio, repeated-question ratio, same-choice ratio and hard-question-fast ratio. Runtime implementation details must not be simplified into a single "fast = cheating" rule that punishes genuine mastery.

## 9. Reward-delivery safety

All reward events need stable semantic identities.

Reload, rerender, cloud sync, conflict resolution and replay boundaries must not double-mint:

- daily rewards;
- 5-correct ticket milestones;
- 3-correct star milestones;
- mastery rewards;
- exploration/world signals;
- trial first-pass rewards.

`pendingGameRewards`, progression signals and applied reward IDs may be used as implementation mechanisms; their existence does not redefine reward amounts.

## 10. Study-first invariant

ManaEvo is a **learning-first** game.

The production Battle V6 change from one-ticket-per-extra-correct to one-ticket-per-five-correct was introduced because observed playtime showed the previous game-access rate could make game time dominate additional study time.

Current invariant:

- daily study should provide more engaged learning time than the battles it unlocks;
- additional study must not become a trivial ticket farm;
- game reward optimization should not encourage abandoning Kids Quest mastery/SRS behavior.

Future Learning Value / active-time / anti-farming models are proposals until explicitly approved and promoted through Decision Log + this CURRENT contract.

## 11. Known future-review boundary

An open design proposal may suggest replacing `5 correct -> 1 ticket` with a richer Learning Value model. Until explicit approval:

- production remains 5 correct -> 1 ticket;
- do not implement the proposal merely because its document is newer;
- if approved, update Decision Log + this file + runtime/tests in the same PR under the canonical-sync gate.

## 12. Acceptance

A conforming implementation must preserve all of the following:

- active child learning routes through `src/kids-quest-study/**`;
- Kids Quest SRS/mastery/trial behavior remains intact;
- daily core completion grants ticket +3 and star +3 exactly once;
- new battle remains blocked until today's core is complete;
- every 5 qualifying correct extra answers grants exactly one battle ticket;
- every 3 additional correct answers grants star +1;
- extra question clear grants exploration +1;
- normal/hard mastery grants silver/gold once per transition;
- mastery/chapter progression signals remain idempotent;
- no unapproved rainbow-learning reward is invented;
- no reload/replay/cloud boundary duplicates game rewards.
