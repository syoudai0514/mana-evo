# ManaEvo CURRENT — Learning / Rewards

Status: **CURRENT canonical candidate — W-101**  
Phase: 2 / canonicalization  
Scope owner: learning rules and the learning → game reward bridge

This document is sufficient for a later implementation worker to align the learning/reward bridge without treating old design documents or the current runtime as product authority.

## 1. Authority and boundary

Evidence precedence follows `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md`.

For learning behavior, the authoritative boundary is Decision D-005 plus the exact baseline `design/baseline/FINAL-CORRECTED/source/12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`:

- Kids Quest is the source of truth for grade/domain/unit structure, question content/generation, stable learning IDs, mastery, SRS/review, mistakes, star trial/promotion, English/TTS, grade controls, learning save behavior, and learning regression tests.
- ManaEvo must not independently redesign those learning algorithms.
- ManaEvo owns the adapter from learning events into game rewards and ManaEvo-only routing/storage/UI integration.
- The migrated active snapshot is `src/kids-quest-study/**`, pinned by `src/kids-quest-study/SOURCE_COMMIT.txt` to Kids Quest commit `ddfe594789890aef6958bf169bf50dccb72f818e`.
- `src/study/**` is legacy/compatibility/regression evidence only. It must not become an active second learning authority or be routed back into the child learning flow.

A future Kids Quest refresh must be a deliberate migration with an explicit source SHA and learning regression comparison. “Latest runtime happens to differ” is not a specification change.

## 2. Daily core learning contract

### 2.1 Core mission shape

A normal day has **5 core tasks**. “Daily complete” in this document always means all five core tasks are complete; it does **not** mean five questions total.

Question counts come from the Kids Quest source:

| Core task domain | Questions |
|---|---:|
| `yomu` / 国語 | 5 |
| `suuji` / 算数 | 5 |
| ordinary scheduled domain | 4 |
| `doutoku` / 道徳, when scheduled | 2 |

The domain selection, unit selection, adaptive difficulty, lessons, question generation and review mixing remain Kids Quest responsibilities.

### 2.2 Daily core gate

A **new battle may not start until today's five core tasks are complete**, even when the child still owns a valid ticket earned on an earlier day. This is the later explicit user-approved gate recorded by PR #5.

The gate applies to **new battle entry**. It does not delete or shorten carried ticket lots, and it must not convert a technical reload/crash of an already-active battle into a new battle. Battle reservation/resume semantics are owned by W-102 / D-007.

### 2.3 Core completion reward

On the first transition to daily core complete for that day, grant exactly once:

- battle ticket `+3`
- `ほしのわ +3` — D-006 later-approved ring economy
- exploration points `+2` — baseline grant retained

The old baseline `core task -> ほしのわ +1` and `core all clear -> ぎんのわ +1` ring grants are **superseded** by D-006 and must not be restored.

## 3. `わからない`, mistakes and completion integrity

`わからない` is a required Kids Quest learning action and must remain available.

Canonical behavior:

1. Treat `わからない` as a first-attempt miss for learning records.
2. Show the correct answer and explanation/support.
3. Send the missed item into reinforcement/review/SRS according to Kids Quest rules.
4. Do not convert acknowledgement of an explanation into a correct first attempt.

The later PR #5 decision also requires that a wrong answer followed only by explanation acknowledgement is not enough to claim a required daily item as solved; the child must make the required correct re-answer. When anti-spam suspicion is active, the required verification question must also be answered correctly before the protected completion/reward can be released.

Do not remove `わからない` to make reward accounting simpler.

## 4. SRS, mastery, star trial and ahead learning

### 4.1 SRS / review

Keep the Kids Quest SRS and review engine intact. Stable `knowledgeId` / `unitId` / `skillId` / question identity semantics must not be replaced by ManaEvo-specific IDs merely to support rewards.

Wrong items, including qualifying star-trial mistakes, return to review/SRS according to Kids Quest. ManaEvo reward code may observe learning events but must not reschedule learning itself.

### 4.2 Unit MASTER

The current imported Kids Quest snapshot defines a unit as ready/MASTER when its source rule succeeds. In the pinned source, `unitReady` requires:

- attempts `>= 4`
- first-attempt correct `>= 3`
- success on at least `2` distinct days
- where the unit requires multiple items, exposure to at least `2` distinct item keys

Reward only the **false -> true MASTER transition**, not every later correct answer in an already-mastered unit.

Hard-mode learning uses its separate hard namespace and must not be inserted into the required normal promotion-unit ledger.

### 4.3 Star trial / grade promotion

The pinned Kids Quest star trial contract is:

- `6` questions per round
- `2` rounds on different days; a second scored round is not run again on the same day
- combined score at least `9 / 12`
- every required promotion unit already satisfies the Kids Quest mastery gate
- required learning domains are represented by correct answers across the two-round result, as enforced by the pinned Kids Quest promotion function

Only when all Kids Quest promotion conditions pass is the next grade unlocked by the learning engine. ManaEvo must not implement a second promotion formula.

### 4.4 Ahead learning / grade control

`grade`, `gradeMax` and the parent-controlled allowed grade range remain Kids Quest learning state. The child learning screen does not independently unlock arbitrary future grades. Ahead-learning access is changed through the parent-side Kids Quest control, while ordinary promotion is earned through the Kids Quest mastery + star-trial path.

## 5. Free study, extra challenge and okawari

### 5.1 Free study

Free study is a Kids Quest learning mode and has **no direct battle-ticket grant**.

It may still update legitimate Kids Quest learning state. If that learning causes a canonical mastery transition, the mastery reward rules below still apply; “free study has no ticket” must not be implemented by disabling learning progress.

### 5.2 Extra challenge task shape

Keep the Kids Quest **3-question extra task shape**. D-006 changes the ManaEvo reward accounting, not the Kids Quest task generator.

The current runtime's rule “3 questions, at least 2 correct -> one ticket for the whole task” is **not CURRENT**.

For CURRENT rewards:

- each extra question that is actually cleared grants `ticket +1`
- there is **no daily cap** on these extra-question tickets
- each cleared extra question grants `exploration point +1`
- separately, every **3 correct answers in additional learning** grants `ほしのわ +1`

“Every 3 correct” is a cumulative additional-learning reward rule; it must not be rewritten as “one star only when a particular 3-question task scores 3/3”, and the ticket rule must not be rewritten as a `2/3` threshold.

The Kids Quest `OKAWARI_MAX = 6` limit belongs to `okawari`; it is **not** an extra-ticket daily cap and must not be reused as one.

## 6. CURRENT learning → game reward matrix

| Learning event | Ticket | `わ` | Exploration points | Canonical note |
|---|---:|---:|---:|---|
| First daily transition to all 5 core tasks complete | `+3` | `ほし +3` | `+2` | once per day |
| Each cleared extra question | `+1` | — | `+1` | no daily cap; anti-spam hold may delay bonus delivery |
| Every 3 correct answers in additional learning | — | `ほし +1` | — | later-approved D-006 economy |
| Normal unit becomes MASTER | — | `ぎん +1` | — | false -> true transition only |
| Hard unit becomes MASTER | — | `きん +1` | — | false -> true transition only |
| Learning skill/mastery level advances by a qualifying milestone | — | — | `+2` | baseline exploration grant retained; do not conflate with unit MASTER unless the Kids Quest event is the same transition |
| First qualifying chapter/star-trial pass corresponding to the learning chapter-test completion event | — | see blocked decision below | `+5` | baseline exploration grant retained; no reward for repeated pass replay |

The old baseline ring matrix (`coreTask star`, `all-clear silver`, `extra 4/3 gold`) is superseded. The exploration-point grants in the table are not superseded by D-006.

### 6.1 Exploration interface boundary

W-101 owns the **learning-side grants** above. Spending exploration points, 5-point exploration runs, evolution-item drop/pity rules and inventory are owned by W-104 / D-008.

W-105 consumes separate learning-progression signals for the regional boss gate. W-101 must expose/retain the source learning events without redefining world progression:

- core task first clear for that day: learning-progress signal `+1`
- qualifying mastery milestone: `+2`
- first chapter-test pass: `+3`
- repeated same question and already-mastered easy-repeat farming: `+0`

The regional storage/reset/unlock behavior is W-105 / D-009, not this file.

## 7. Ticket lifetime and FEFO

Every ticket grant is a dated lot.

- A ticket is valid for the acquisition day plus the following six days.
- A lot earned on day `D` is valid through `D+6` and is expired when day `D+7` begins.
- Consume the lot with the nearest expiry first (**FEFO**).
- The daily core gate never erases a carried lot; it only prevents a new battle from starting until today's core is complete.

Battle-time reserve/refund/commit is intentionally not duplicated here; see W-102 / D-007.

## 8. Ring lifetime and learning allocation boundary

The later approved learning ring economy is:

- daily core complete -> `ほし +3`
- additional learning each 3 correct -> `ほし +1`
- normal unit MASTER -> `ぎん +1`
- hard unit MASTER -> `きん +1`

These owned `わ` do not expire. Capture multipliers/use are W-103, not W-101.

### BLOCKED DECISION W-101-01 — learning-side `にじのわ` allocation

PR #5 explicitly left the concrete chapter/grade reward allocation of `にじのわ` unresolved. D-006 does not supply a later-approved rainbow-learning grant.

Therefore W-101 **does not mint `にじのわ` from a learning event** until commander/user evidence resolves the exact trigger and quantity. Do not silently restore the baseline chapter-test rainbow grant, and do not invent a new grade reward.

This block does not prevent implementation of every non-rainbow rule in this document.

## 9. Anti-spam / reward-hold contract

The baseline anti-spam design is retained. It separates learning progress from bonus-game-reward protection.

### 9.1 Detection

Use the recent `8`-answer signal window. Suspicion requires at least **2 independent signals**; neither one fast answer nor one repeated choice is enough by itself.

The exact baseline signal defaults from `scripts/rewards.mjs` are:

- very-fast answer threshold: `< 650 ms`
- very-fast ratio: `>= 0.75`
- error ratio: `>= 0.55`
- repeated-question ratio: `>= 0.50`
- same-choice ratio: `>= 0.80`
- hard-question-fast ratio: `>= 0.65`

These are signals into the multi-signal decision, not standalone “reward zero” rules.

### 9.2 Suspicious state

When the additional-answer stream is suspicious:

- learning XP/progress remains `100%`; do not punish the learning record by zeroing it
- hold the affected **additional-learning game bonuses** rather than deleting them
- because D-006 replaced the old extra-answer gold reward, the held ring-side additional-learning bonus is the D-006 `ほし +1 per 3 correct`, not hard-MASTER `きん`
- require the PR #5 verification answer behavior before protected completion/reward release
- after `3` normal answers, automatically release the held eligible bonus rewards
- child UI must explain that rewards are temporarily held and what clears the hold

The current runtime's single rule based on “wrong within 1500 ms for at least half the task” is not the canonical detector.

## 10. Reward delivery safety

Reward delivery must be idempotent across rerender, reload and save boundaries. Re-delivery of the same semantic learning completion must not mint a second ticket/ring/exploration grant.

A stable reward/completion ID plus acknowledgement after the ManaEvo game save is one valid implementation. The current `pendingGameRewards` / `appliedLearningRewardIds` approach may be retained for this safety property, but its present payload and reward amounts are not authority.

For per-question extra rewards, the implementation must have a stable per-question completion identity from the Kids Quest learning event; do not derive uniqueness only from a transient UI index if that can replay after reload.

## 11. Current runtime deltas — identify, do not implement in W-101

The following are implementation/documentation deltas against this CURRENT contract:

| Current runtime/document behavior | Required alignment |
|---|---|
| `src/kids-quest-study/state/GameContext.jsx` grants only `ticket +1` when a whole 3-question extra task has `accuracy >= 2/3` | grant `ticket +1` per cleared extra question, unlimited |
| extra reward queue has no additional-learning star grant | add cumulative `3 correct -> ほし +1` |
| current learning reward payload/game state has no exploration-point bridge for core/extra/mastery/chapter events | add the canonical learning-side exploration grants |
| `ActivityPlayer.jsx` suspicious rule is effectively a single fast-wrong heuristic using `<1500 ms` and half-task threshold | use the canonical multi-signal 8-answer hold/release contract |
| Study UI says `3もん中2もん -> ticket+1` | change copy after implementation to describe per-question ticket earning without implying a 2/3 gate |
| current reward queue exposes unit MASTER but does not expose the Kids Quest difficulty/mastery `leveledUp` event used by the baseline exploration milestone | add a semantic bridge event without changing Kids Quest difficulty rules |
| star-trial completion does not currently emit the retained exploration grant | emit the first-pass exploration event idempotently |
| `docs/KIDS_QUEST_STUDY_MIGRATION.md` still contains stale legacy-active / simplified-learning statements | documentation drift; outside W-101 output, do not use it as authority |

Additional current `grantLearningReward()` Mana side effects are **not promoted or removed by W-101** merely because runtime contains them. They require authority from the appropriate canonical game/progression decision; a W-101 implementation must not use runtime-only Mana arithmetic to reinterpret the ticket/ring/exploration rules above.

## 12. Implementation checklist for the later worker

The later implementation is conformant only if all of the following are true:

- active child learning still routes through `src/kids-quest-study/**`
- `src/study/**` is not reintroduced into the active learning route
- five core tasks and Kids Quest question counts are unchanged
- `わからない`, SRS, mastery, star trial and parent-controlled ahead-learning behavior remain Kids Quest behavior
- new battle entry remains locked until today's core is complete
- daily first core completion grants `ticket+3`, `ほし+3`, exploration `+2` exactly once
- each extra question clear can grant `ticket+1` and exploration `+1`; no daily extra-ticket cap exists
- every 3 additional-learning correct grants `ほし+1`
- unit MASTER grants `ぎん+1`; hard MASTER grants `きん+1`
- qualifying mastery milestone grants exploration `+2`; first qualifying chapter/star-trial pass grants exploration `+5`
- ticket lots expire at the start of day `D+7` and are selected FEFO
- anti-spam requires the multi-signal rule, preserves learning progress, holds eligible bonuses, and releases after 3 normal answers
- repeated/reloaded learning events cannot double-grant rewards
- no unapproved learning-side `にじのわ` reward is invented

## 13. Evidence used

Highest-value evidence for this CURRENT document:

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md` — especially D-005, D-006, D-008, D-009
- `design/rebuild/PHASE-2-COMMANDER-REVIEW.md`
- `design/rebuild/PHASE-2-WORK-ITEMS.md` — W-101
- exact baseline `design/baseline/FINAL-CORRECTED/source/12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- exact baseline `design/baseline/FINAL-CORRECTED/source/08-gameplay-state-spec.md`
- exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/rewards.mjs`
- Phase 1.5 `design/rebuild/audit/learning-ticket-audit.md`
- PR #5 explicit user-approved learning/ticket/ring decisions
- runtime inspected only as delta evidence: `src/kids-quest-study/**`, `src/App.jsx`, `src/game/progression.js`
