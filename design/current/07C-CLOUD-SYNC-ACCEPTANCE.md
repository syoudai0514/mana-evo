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
- If local progress changes while `fetchMainSave()` is pending, a cloud-only result must not destructively PULL over the newer local state. The stale decision is abandoned and reconciliation reruns.
- If local progress changes while a disjoint-profile MERGE write is pending, the newer local state must survive. The returned merged payload must not be applied locally and must not replace the old sync-base metadata; reconciliation reruns against the newly advanced cloud revision.
- Immediately before any destructive PULL/MERGE local apply, the runtime must prove that the current local semantic hash still equals the hash captured for that sync decision.
- Parent conflict choices are never blind/stale actions. Pressing either `クラウド側を使う` or `この端末側を使う` re-fetches current cloud and re-checks current local evidence. If cloud revision/payload or local content changed since the comparison was displayed, the action is cancelled and the comparison is refreshed.
- Cloud timestamps are evidence only and never automatic winner authority.
- A single transient startup/autosync failure remains child-silent. Child `保存確認` is shown only for same-profile conflict or after 3 consecutive sync failures without a successful reconciliation between them.
- A successful reconciliation resets the consecutive-failure attention counter.
- A cloud failure never deletes or rolls back a valid local save.
- TEST fixture state never writes to normal cloud persistence.
- Reload/crash before debounce completion does not lose already-local progress; next launch reconciles it.

Review must also verify that child gameplay remains non-blocking, normal/brief sync waiting stays invisible to the child, and Parent owns destructive conflict resolution.
