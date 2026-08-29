# D-028 — Cloud sync timing and reconciliation safety

Status: **CONFIRMED_CHANGE / USER-DECISION / REVIEW-REQUIRED**

## Evidence of approval

2026-08-29 user explicitly prioritized cloud persistence reliability over the optional Google-auth UX work and requested immediate implementation/release, with design documents updated first and explicit review before release. User additionally required a use-case-by-use-case explanation of what happens when local and cloud copies differ, including an owner-readable document.

## Decision

ManaEvo remains local-first for child safety and uses cloud as the durable cross-device layer.

- Local learning/game mutations persist immediately.
- Normal cloud autosync debounce: 800ms after latest local save.
- Continuous activity must not defer sync forever: first unsynced save in a burst establishes a maximum 4000ms window before a sync attempt.
- App/session start, `online`, focus/foreground return, background/page-exit boundaries trigger immediate best-effort reconciliation.
- Profile switch is a stronger boundary: reconcile the current profile/household snapshot before changing the device-local active profile and reloading.
- Cloud requests must be serialized per app instance. A sync request that arrives while another is in flight requests a rerun rather than starting a competing authoritative write sequence.
- A local mutation that occurs while a remote fetch/write is in flight remains authoritative local dirty state. Any destructive PULL/MERGE apply must re-check the current local semantic hash against the hash captured at sync start immediately before applying remote payload.
- If local state changed while a MERGE cloud write was in flight, the newly advanced cloud row must not be applied locally and must not replace the previous sync base metadata. The next reconciliation compares the newer local state against the newly advanced cloud and stops at conflict if compatibility cannot be proven.
- Parent conflict choices are evidence-bound. When Parent presses either `cloud` or `device`, runtime re-fetches current cloud and re-checks the local snapshot. If either side changed since the comparison screen was shown, the choice is cancelled and refreshed evidence is shown before another destructive action is allowed.
- Network/server failure never invalidates already-valid local progress; later reconnect/resume retries.
- A single transient startup/autosync failure is not a child-visible cloud emergency. Child `保存確認` attention is promoted only for same-profile conflict or after 3 consecutive sync failures without a successful reconciliation in between.
- TEST fixture state never reaches the normal cloud save.

## Reconciliation outcomes

Authority is determined from local payload/hash, last-known sync revision/hash and current cloud revision/payload, not timestamps alone.

- NOOP: same meaningful state.
- PUSH: only local has unsynced meaningful change and cloud has not advanced incompatibly.
- PULL: only cloud advanced, or a genuinely fresh device adopts existing cloud. PULL is cancelled and rerun if local changed after the sync snapshot was captured.
- MERGE: disjoint stable profiles changed; merge each profile's learning + game + reward bridge slice together. A MERGE result is never applied over a newer local mutation that occurred during its remote write.
- CONFLICT: same stable profile diverged or compatibility cannot be proven; keep local child progress and move resolution to Parent-owned UI. No silent last-write-wins.

The normative scenario matrix is `design/current/07A-CLOUD-SYNC-USE-CASES.md`.

## Reason

A child can close Safari, lose connectivity, switch profiles, answer the next question while a sync request is still pending, or use multiple family devices at arbitrary times. The product must optimize for preserving valid progress rather than for minimizing network calls or blindly preferring the most recent timestamp. The 800ms/4000ms two-window policy limits cloud lag without blocking play, while serialized reconciliation, in-flight local mutation guards, evidence-bound Parent conflict choices and explicit same-profile conflict handling prevent race-driven or cross-device data loss.

## Affected areas

Save / cloud autosync / profile switching / Parent conflict UX / child abnormal-save attention / offline recovery / CURRENT W-107 companion / owner guide / acceptance tests.

Authentication method, learning rules, battle rules, monster art status and game economy are unchanged.

## Tests required

- local save dirty event from both learning and game stores;
- 800ms debounce + 4000ms maximum dirty window;
- start/reconnect/focus/background/pagehide reconciliation;
- current-profile flush before profile identity changes;
- serialized in-flight sync + rerun behavior;
- async interleaving: local save while `fetchMainSave()` is pending must prevent destructive PULL;
- async interleaving: local save while MERGE `updateMainSave()` is pending must survive and prevent stale merged apply;
- Parent conflict action re-fetches cloud and cancels if displayed revision/payload or local evidence became stale;
- transient failure remains child-silent until 3 consecutive failures; success resets the failure counter;
- local-only offline continuity then reconnect reconciliation;
- fresh-device cloud adoption;
- disjoint-profile merge;
- same-profile conflict with no silent overwrite;
- TEST no-cloud-write;
- reload/crash recovery from local save;
- canonical sync, unit/integration, build, release readiness and iPhone WebKit regression.
