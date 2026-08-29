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
- Network/server failure never invalidates already-valid local progress; later reconnect/resume retries.
- TEST fixture state never reaches the normal cloud save.

## Reconciliation outcomes

Authority is determined from local payload/hash, last-known sync revision/hash and current cloud revision/payload, not timestamps alone.

- NOOP: same meaningful state.
- PUSH: only local has unsynced meaningful change and cloud has not advanced incompatibly.
- PULL: only cloud advanced, or a genuinely fresh device adopts existing cloud.
- MERGE: disjoint stable profiles changed; merge each profile's learning + game + reward bridge slice together.
- CONFLICT: same stable profile diverged or compatibility cannot be proven; keep local child progress and move resolution to Parent-owned UI. No silent last-write-wins.

The normative scenario matrix is `design/current/07A-CLOUD-SYNC-USE-CASES.md`.

## Reason

A child can close Safari, lose connectivity, switch profiles or use multiple family devices at arbitrary times. The product must optimize for preserving valid progress rather than for minimizing network calls or blindly preferring the most recent timestamp. The 800ms/4000ms two-window policy limits cloud lag without blocking play, while serialized reconciliation and explicit same-profile conflict handling prevent race-driven or cross-device data loss.

## Affected areas

Save / cloud autosync / profile switching / Parent conflict UX / offline recovery / CURRENT W-107 companion / owner guide / acceptance tests.

Authentication method, learning rules, battle rules, monster art status and game economy are unchanged.

## Tests required

- local save dirty event from both learning and game stores;
- 800ms debounce + 4000ms maximum dirty window;
- start/reconnect/focus/background/pagehide reconciliation;
- current-profile flush before profile identity changes;
- serialized in-flight sync + rerun behavior;
- local-only offline continuity then reconnect reconciliation;
- fresh-device cloud adoption;
- disjoint-profile merge;
- same-profile conflict with no silent overwrite;
- TEST no-cloud-write;
- reload/crash recovery from local save;
- canonical sync, unit/integration, build, release readiness and iPhone WebKit regression.
