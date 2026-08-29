# ManaEvo CURRENT — Learning / Rewards

Status: **CURRENT — W-101 + D-017/D-022/D-026 override**  
Updated: 2026-08-29  
Scope owner: learning rules and the learning → game reward bridge

This document is sufficient for a later implementation worker to align the learning/reward bridge without treating old design documents or the current runtime as product authority.

> **重要:** 本文のKids Quest/SRS/mastery/anti-spam/exploration契約は維持する。2026-08-29 Battle V6（D-022）が旧「extra 1問clearごとticket+1」を **extra正解5回ごとticket+1** に後続置換し、D-026がその「qualifying」をA+ semantic ruleとして確定する。child-facing `○○のわ` 名称はD-017により `○○ボール`へ変更済み。末尾overrideを必ず併読する。

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

The gate applies to **new battle entry**. It does not delete or shorten carried ticket lots, and it must not convert a technical reload/crash of an already-active battle into a new battle. Battle reservation/resume semantics are owned by W-102; current played-battle settlement is D-022.

### 2.3 Core completion reward

On the first transition to daily core complete for that day, grant exactly once:

- battle ticket `+3`
- stable capture item `star +3` — child-facing **ほしボール** under D-017
- exploration points `+2` — baseline grant retained

The old baseline `core task -> star +1` and `core all clear -> silver +1` capture-item grants are superseded by D-006 and must not be restored.

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

Keep the Kids Quest **3-question extra task shape**. ManaEvo reward accounting does not redefine the Kids Quest task generator.

Historical rules such as `2/3 -> one ticket` and the pre-V6 `each extra clear -> ticket +1` are no longer the production ticket rule.

Current production reward accounting is in §14 and the later A+ override in §15.

The following non-ticket rules remain:

- each legitimate cleared extra question grants `exploration point +1`
- every **3 correct answers in additional learning** grants stable capture item `star +1`（child-facing ほしボール）

The Kids Quest `OKAWARI_MAX = 6` limit belongs to `okawari`; it is **not** an extra-ticket daily cap and must not be reused as one.

## 6. CURRENT learning → game reward matrix

This base matrix is retained for non-superseded rewards; the ticket row for extra learning is replaced by §14/§15.

| Learning event | Ticket | Capture item | Exploration points | Canonical note |
|---|---:|---:|---:|---|
| First daily transition to all 5 core tasks complete | `+3` | `star +3` | `+2` | once per day |
| Each cleared extra question | **see §15** | — | `+1` | exploration per legitimate clear remains |
| Every 3 correct answers in additional learning | — | `star +1` | — | cumulative milestone |
| Normal unit becomes MASTER | — | `silver +1` | — | false -> true transition only |
| Hard unit becomes MASTER | — | `gold +1` | — | false -> true transition only |
| Learning skill/mastery level advances by a qualifying milestone | — | — | `+2` | baseline exploration grant retained |
| First qualifying chapter/star-trial pass corresponding to the learning chapter-test completion event | — | unresolved rainbow | `+5` | no reward for repeated replay |

Child-facing names under D-017:

- `star` -> ほしボール
- `silver` -> ぎんボール
- `gold` -> きんボール
- `rainbow` -> にじボール

Stable domain/save keys remain unchanged.

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

Battle-time reserve/commit/resume is intentionally not duplicated here; see W-102 / D-022.

## 8. Capture-item lifetime and learning allocation boundary

The approved learning capture-item economy is:

- daily core complete -> `star +3`
- additional learning each 3 correct -> `star +1`
- normal unit MASTER -> `silver +1`
- hard unit MASTER -> `gold +1`

These owned items do not expire unless a later explicit decision says otherwise. Capture multipliers/use are W-103.

### BLOCKED DECISION W-101-01 — learning-side `rainbow` allocation

PR #5 explicitly left the concrete chapter/grade reward allocation of rainbow unresolved. D-006 does not supply a later-approved rainbow-learning grant.

Therefore W-101 **does not mint `rainbow` from a learning event** until commander/user evidence resolves the exact trigger and quantity. Do not silently restore the baseline chapter-test rainbow grant, and do not invent a new grade reward.

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
- the held capture-item-side additional-learning bonus is `star +1 per 3 correct`, not hard-MASTER gold
- require the PR #5 verification answer behavior before protected completion/reward release
- after `3` normal answers, automatically release the held eligible bonus rewards
- child UI must explain that rewards are temporarily held and what clears the hold

The current runtime must not collapse this into a single “fast = cheating” rule that punishes genuine mastery.

## 10. Reward delivery safety

Reward delivery must be idempotent across rerender, reload and save boundaries. Re-delivery of the same semantic learning completion must not mint a second ticket/capture-item/exploration grant.

A stable reward/completion ID plus acknowledgement after the ManaEvo game save is one valid implementation. `pendingGameRewards` / `appliedLearningRewardIds` may be retained for this safety property, but payload amounts are governed by this contract.

For per-answer/milestone rewards, implementation must use stable semantic completion identity; do not derive uniqueness only from a transient UI index if that can replay after reload.

## 11. Runtime delta ledger — historical note

The original W-101 delta ledger described pre-Battle-V6 runtime. It is historical evidence, not a current-runtime snapshot.

Current production before D-026 implemented the D-022 `extra 5 correct -> ticket +1` rate. D-026 now defines which correct answers may count toward those five; the rejected weighted-Learning-Value and hard-time-gate proposals are not CURRENT.

Other canonical gaps (anti-spam fidelity, rainbow allocation, etc.) must still be judged against the relevant current code and this document, not this old ledger wording.

## 12. Implementation checklist

A conforming implementation keeps:

- active child learning through `src/kids-quest-study/**`
- `src/study/**` out of the active route
- five core tasks and Kids Quest question counts
- `わからない`, SRS, mastery, star trial and Parent-controlled ahead learning
- new battle entry locked until today's core complete
- daily first core completion `ticket+3`, `star+3`, exploration `+2` exactly once
- extra exploration `+1` per legitimate clear
- **ticket +1 per 5 A+ semantic qualifying extra correct answers**
- **within the 5 answers composing one ticket, at most 3 may share one `knowledgeId`**
- every 3 additional correct `star+1`
- unit MASTER `silver+1`; hard MASTER `gold+1`
- mastery milestone exploration `+2`; first chapter/star-trial pass exploration `+5`
- ticket expiration at start of `D+7`, FEFO
- anti-spam multi-signal hold without corrupting learning progress
- idempotency across reload/cloud boundaries
- no unapproved rainbow-learning reward

## 13. Evidence used

Highest-value evidence:

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md` — D-005 / D-006 / D-008 / D-009 / D-017 / D-022 / D-023 / D-026
- exact baseline `design/baseline/FINAL-CORRECTED/source/12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- exact baseline `design/baseline/FINAL-CORRECTED/source/08-gameplay-state-spec.md`
- exact baseline `design/baseline/FINAL-CORRECTED/source/scripts/rewards.mjs`
- PR #5 explicit learning/reward decisions
- PR #110 Battle V6 production decision
- PR #115 two-pass independent A+ design review artifact
- runtime inspected only as implementation evidence: `src/kids-quest-study/**`, `src/game/**`

## 14. 2026-08-29 Battle V6 additional-study ticket override — D-022

This section supersedes only the older **extra-learning battle-ticket rate**. It does not change Kids Quest task generation, SRS/mastery, exploration grants, capture-item milestones or daily core +3.

Baseline V6 shape:

```text
for each qualifying correct answer in `extra` mode after daily core is complete:
  extraCorrectCounter += 1

for each newly crossed multiple of 5:
  battle ticket +1
```

Canonical requirements retained by D-026:

- threshold: **5 qualifying correct extra answers -> 1 ticket**
- daily core ticket reward remains `+3`
- no direct ticket for `free`
- do not treat `OKAWARI_MAX` as a ticket cap
- extra correct still grants exploration `+1` per legitimate clear
- every 3 additional correct still grants `star +1`
- pending progress persists safely
- reload/replay/cloud conflict resolution must not duplicate a crossed milestone
- fast correct answers must not be rejected merely because they are fast

## 15. 2026-08-29 A+ semantic qualifying ticket rule — D-026

D-026 supersedes D-022 only in the definition of **qualifying extra correct** and in anti-farming composition. The simple threshold `5 -> 1 ticket` remains.

### 15.1 Exact A+ rule

After daily core completion, only correct answers produced by `taskKind=extra` may advance battle-ticket progress.

A correct answer contributes exactly `1` when the question provenance was fixed **at presentation time** as one of:

- `adaptive` — legitimate current/unmastered practice selected by Kids Quest;
- `srs_due` — a due spaced-retrieval item;
- `reinforcement` — a genuine later retrieval after a prior miss/support step.

The following contribute `0` to battle-ticket progress while ordinary learning records continue normally:

- miss / `わからない`;
- `free`;
- `okawari`;
- mastered non-due repeat;
- revealed-answer acknowledgement / immediate revealed retry;
- duplicate semantic reward event.

No challenge, difficulty, speed, hint-use, recovery or time multiplier exists. **There is no minimum-time reward gate.** Learning time is telemetry only.

### 15.2 Per-ticket same-knowledge guard

The guard applies to the **specific partial set currently composing the next ticket**, not to a sliding “last five answers” window.

```text
one ticket bucket = 5 qualifying correct
same knowledgeId within that bucket <= 3
```

If a `knowledgeId` already occupies three places in the current partial ticket bucket, another correct answer from that same knowledge:

- updates Kids Quest learning state normally;
- may still count for other approved non-ticket rewards;
- does **not** enter the ticket bucket;
- waits for a qualifying answer from another `knowledgeId` to complete the ticket.

After a ticket is completed, the next ticket starts with a fresh composition bucket. A blocked semantic event itself is still considered already observed and cannot be replayed after the reset to count later.

### 15.3 Presentation-time provenance and stable identity

ManaEvo must not infer learning intent after the answer from mutated mastery/review state. At presentation, the learning question carries stable semantic metadata sufficient for reward settlement:

- `learningIntent = adaptive | srs_due | reinforcement | revealed_retry`;
- `knowledgeId`;
- `unitId` / `skillId` where applicable;
- `questionInstanceId`;
- `originQuestionInstanceId` for reinforcement lineage;
- stable `rewardEventId`;
- presentation-time ticket eligibility/mastery state needed to distinguish legitimate current practice from mastered non-due repetition.

Reward state is profile-owned and persists the current ticket-composition bucket plus already-observed semantic IDs. Reload, rerender, cloud roundtrip and profile switching must not duplicate or transfer progress between children.

### 15.4 High performer / struggling learner fairness

- A genuine 1–2 second correct answer is allowed to count if semantically qualifying; speed alone is not cheating.
- A miss grants no ticket progress.
- Support/explanation grants no ticket progress.
- A later genuine reinforcement retrieval can count exactly `1`, never more than ordinary current-fit learning.
- A revealed answer tapped immediately is not a reinforcement retrieval and counts `0`.

### 15.5 Study-first invariant

The product invariant is:

> **A child optimizing for more game access should be led toward useful learning, not toward mastered-easy repetition, intentional miss loops, waiting, free/okawari leakage or replay.**

Observed learning/battle time remains a release-health metric and should be reviewed as rolling telemetry. It is deliberately not converted into a hard per-ticket timer because waiting would become an optimization target and genuine high performers would be penalized.
