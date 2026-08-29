# ManaEvo CURRENT — Cloud Sync Acceptance Scenarios

Status: CURRENT acceptance companion for D-028.

Release is blocked unless the following behaviors are demonstrated by automated tests and/or deterministic review evidence.

- A local-only change uploads when cloud revision is unchanged.
- A cloud-only change downloads when local has no unsynced change.
- A fresh device adopts existing cloud rather than overwriting it with defaults.
- Disjoint profile changes merge while preserving each profile's learning + game + reward bridge slice.
- Same-profile divergence produces conflict and no silent overwrite.
- Offline local progress survives and is reconciled after reconnect.
- Autosync uses 800ms debounce and a 4000ms maximum dirty window.
- App start, focus/resume, online, pagehide/background boundaries trigger reconciliation attempts.
- Profile switching invokes current-profile reconciliation before device active-profile mutation.
- Multiple overlapping sync requests are serialized; a later request causes rerun rather than racing writes.
- A cloud failure never deletes or rolls back a valid local save.
- TEST fixture state never writes to normal cloud persistence.
- Reload/crash before debounce completion does not lose already-local progress; next launch reconciles it.

Review must also verify that child gameplay remains non-blocking and Parent owns destructive conflict resolution.
