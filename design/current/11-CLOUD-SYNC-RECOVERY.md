# ManaEvo CURRENT — Cloud Sync V2 / Recovery Candidates

Status: **CURRENT / CANONICAL**  
Decision: **D-032**  
Scope: cross-device cloud authority, unsynced-local protection, recovery-candidate durability, sync UX, deferred merge policy

## 0. Product principle

The save system must not make a child lose completed learning, captures, XP, evolution, BOX progress, rewards, or other confirmed progress merely because the family changed devices or because synchronization became ambiguous.

At the same time, ManaEvo must not invent an impossible game/learning state by automatically combining snapshots whose domain semantics are not proven merge-safe.

Therefore D-032 adopts a deliberately simple rule:

> **CLOUD is the normal cross-device authority. If LOCAL may contain progress that CLOUD does not have, preserve the exact LOCAL snapshot durably as a recovery candidate before applying CLOUD. Do not automatically merge divergent snapshots in V2.**

Normal device switching must not require the child to decide which save to keep.

---

## 1. Authority and supersession

This contract owns Cloud Sync V2 behavior.

For cross-device sync/conflict/recovery behavior it supersedes conflicting text in:

- `07-SAVE-PROFILES-PARENT-PWA.md` section 4 where cloud conflict resolution is treated as a normal Parent action;
- W-107 section 5.5 where divergent data without a trusted common revision requires an adult LOCAL-vs-CLOUD choice;
- W-107 section 5.6 where disjoint profile changes may be automatically merged and same-profile divergence is surfaced as a save choice;
- any acceptance/runtime text that expects `保存データが2つあります`, `クラウド側を使う`, `この端末側を使う`, or automatic snapshot merge.

Unrelated W-107 rules remain in force, including stable profile identity, complete cloud snapshot content, device-local current-profile selection, local offline continuity, Parent-only backup/restore, RLS, and optimistic revision protection for safe writes.

Future automatic merge/recovery policy is intentionally unresolved and tracked in **GitHub Issue #159**. Runtime code must not infer or invent that future policy.

---

## 2. Terms

### CLOUD

The current `app_saves` row for the signed-in Auth user, `app_id=mana-evo`, `slot_id=main`.

### LOCAL

The current device's recoverable ManaEvo snapshot: learning profiles/state, game envelope, and learning-to-game reward bridge.

### trusted base

The last successfully synchronized cloud revision/hash recorded locally for this Auth user.

### recovery candidate

An append-only server-side record created only when LOCAL may contain progress that would otherwise be hidden by adopting CLOUD. It is diagnostic/recovery evidence, not a second active save slot.

### recover-pull

The operation:

1. durably persist a recovery candidate;
2. only after success, apply CLOUD to LOCAL;
3. only after successful apply, commit local sync metadata to the CLOUD revision/hash.

The ordering is part of the product contract.

---

## 3. Normal synchronization matrix

### 3.1 No cloud save exists

If CLOUD does not exist, initialize it from LOCAL using the existing main-save insert path.

### 3.2 Genuine fresh device + existing CLOUD

A genuinely fresh device with no meaningful pre-existing ManaEvo save adopts CLOUD automatically.

No recovery candidate is required because there is no child progress to preserve.

No LOCAL-vs-CLOUD chooser is shown.

### 3.3 LOCAL equals CLOUD

Adopt/no-op and record the current revision/hash as synchronized.

### 3.4 Only LOCAL changed from the trusted base

If CLOUD is still the exact trusted base and LOCAL changed through real application activity, push LOCAL with the existing optimistic revision/CAS guard.

A successful push makes the new cloud revision the synchronized base.

### 3.5 Only CLOUD changed from the trusted base

If LOCAL still equals the trusted base while CLOUD advanced, pull CLOUD automatically.

No recovery candidate is required because LOCAL contains no unsynced progress.

### 3.6 LOCAL and CLOUD both diverged

If LOCAL no longer equals the trusted base and CLOUD also differs/advanced, **do not merge**.

Create a recovery candidate first, then adopt CLOUD.

This rule applies even if the changed stable profile IDs appear disjoint. V2 deliberately does not use profile-part disjointness as automatic merge authority.

### 3.7 No trusted base + divergent non-fresh LOCAL

If CLOUD exists, LOCAL differs, and this device has no trustworthy synchronization metadata but is not genuinely fresh, treat LOCAL as potentially meaningful.

Create a recovery candidate first, then adopt CLOUD.

### 3.8 Revision/content anomaly or cloud revision regression

If revision/hash evidence is inconsistent, or CLOUD revision is lower than the trusted local revision while content differs, do not guess.

Create a recovery candidate first, then adopt the current CLOUD authority. The preserved LOCAL and contemporaneous CLOUD snapshots allow later diagnosis.

---

## 4. Recovery-candidate durability contract

Before any `recover-pull`, the backend record must preserve at least:

- stable row ID;
- `user_id`;
- `app_id` and `slot_id`;
- save schema version;
- `status` (`unresolved` initially);
- reason code;
- exact LOCAL payload;
- exact contemporaneous CLOUD payload;
- LOCAL semantic hash;
- CLOUD semantic hash;
- CLOUD revision;
- trusted/base revision and hash when available;
- device-local selected profile ID when available, as diagnostic context only;
- creation timestamp;
- later resolution metadata fields for maintainer/admin use.

The browser must not mutate or delete recovery candidates after insertion. Browser permissions are own-user `SELECT + INSERT` only. There is no normal in-app recovery-candidate restore/delete UI in V2.

The ordinary `app_save_backups` history remains a separate Parent backup/restore feature.

---

## 5. Fail-closed rule

**Recovery-candidate persistence is a hard precondition to overwriting divergent LOCAL with CLOUD.**

If insertion fails because of network, Auth, RLS, schema, quota, or any other error:

- do not apply CLOUD;
- do not update local sync metadata as if CLOUD had been adopted;
- keep the existing LOCAL data usable on the device;
- allow later synchronization retry;
- the child may continue locally; temporary sync failure must not erase progress.

A client release that can generate `recover-pull` must not be deployed before the additive recovery-candidate table migration is live.

---

## 6. Revision-race rule

The safe LOCAL-only push continues to use optimistic revision protection.

If another device advances CLOUD between read and write and the CAS update loses:

1. re-read CLOUD;
2. re-run D-032 sync classification using the same LOCAL snapshot;
3. if LOCAL now diverges from the newly advanced CLOUD, persist a recovery candidate;
4. only then adopt CLOUD.

The user must not be left in a repeating generic `別の端末で更新されました` error loop when the recovery-first path can safely preserve LOCAL.

---

## 7. Child and Parent UX

### Child-facing normal behavior

Ordinary expected flow:

`iPhoneで続ける → cloud save → iPadを開く → CLOUDを自動取得 → 続きから遊ぶ`

and the reverse likewise.

Device change alone is not an error and must not open a save-choice dialog.

The child must not be asked:

- which save is newer;
- whether to keep LOCAL or CLOUD;
- whether to merge snapshots;
- how to restore a recovery candidate.

### Parent-facing behavior

The Parent cloud surface may explain that:

- device switching normally follows the latest CLOUD;
- if a device has unreflected progress, ManaEvo preserves it for recovery before switching to CLOUD;
- ordinary manual backup/restore remains available under the existing recovery section.

Recovery-candidate inspection/restoration is not exposed as a casual button in V2. It is intended for later diagnosis with a maintainer/GPT-assisted workflow.

---

## 8. No automatic merge in V2

The following are explicitly prohibited as generic recovery strategies:

- JSON/deep merge;
- newest field wins;
- largest numeric value wins;
- blindly adding numeric differences;
- automatic union of every array/object;
- automatic profile-level merge merely because changed profile IDs appear disjoint.

These can corrupt semantics such as:

- XP and currency accounting;
- exactly-once learning rewards;
- BOX monster instance identity;
- team and held-item relationships;
- evolution readiness/discovery;
- world/boss progression;
- active battle/capture/evolution transactions;
- SRS/mastery/history state.

Issue #159 owns the future decision about domain-specific merge/recovery rules using real conflict examples. Any future merge activation requires an explicit approved decision, tests, and review.

---

## 9. Backend and security

The generic `app-save-hub` Supabase project remains the backend. Family Ops remains isolated.

`app_save_recovery_candidates` must:

- have RLS enabled;
- revoke `anon` privileges;
- allow authenticated users to select/insert only rows whose `user_id = auth.uid()`;
- not grant authenticated browser update/delete capability;
- store no secret/service-role credential in the browser;
- remain partitioned by app/user/slot.

Production rollout order is:

1. independently review exact implementation head;
2. apply additive recovery-candidate migration to `app-save-hub`;
3. verify schema/RLS/security advisors;
4. merge reviewed client head;
5. main CI full green;
6. Vercel production exact-main-SHA verification;
7. production smoke verification.

---

## 10. Acceptance contract

At minimum the same exact implementation head must prove:

1. cloud empty + LOCAL → `push-new`;
2. genuine fresh device + existing CLOUD → automatic `pull`, no recovery candidate;
3. equal LOCAL/CLOUD → adopt/no-op;
4. trusted base unchanged in CLOUD + LOCAL changed → optimistic `push`;
5. CLOUD advanced + LOCAL unchanged → automatic `pull`;
6. CLOUD advanced + LOCAL changed → `recover-pull`;
7. no trusted base + non-fresh divergent LOCAL → `recover-pull`;
8. revision regression/content anomaly + divergent LOCAL → `recover-pull`;
9. different-profile concurrent changes are **not** auto-merged in V2;
10. same-profile concurrent changes are **not** auto-merged in V2;
11. decision authority emits no legacy `merge` or `conflict` action;
12. recovery record contains exact LOCAL + contemporaneous CLOUD payloads and revision/hash metadata;
13. recovery persistence occurs before cloud apply;
14. cloud apply occurs before sync-meta commit;
15. failed recovery insert results in zero cloud apply and zero sync-meta commit;
16. CAS race re-read follows the same recovery-first authority;
17. cloud-originated apply emits no fake local-change event;
18. real local learning/game writes still request sync;
19. normal child UI contains no LOCAL-vs-CLOUD save chooser;
20. ordinary Parent backup/restore remains separate;
21. recovery table RLS / anon revocation / own-user insert+select / no browser update-delete are verified;
22. existing complete snapshot round-trip, profile isolation, test-mode isolation, build, release readiness, and iPhone/iPad WebKit regressions stay green.

---

## 11. Deferred work

GitHub Issue #159 — **Cloud Sync V3: recovery candidate merge policy and GPT-assisted recovery** — preserves the rationale and future work.

The intended future support workflow is to compare current CLOUD, one or more recovery candidates, revision/hash metadata, and available backup history, then propose a narrow recovery with the user rather than forcing a child to make an irreversible sync-time choice.

No automatic production recovery mutation is authorized by D-032.
