# ManaEvo Cloud Sync — Review Checklist

Target change: D-028 cloud sync timing and reconciliation safety
Review target head: freeze the current PR head supplied in the review request; do not review a moving branch.

Reviewer should validate design and implementation together.

## Design questions

1. Is local-first persistence preserved for all child progress?
2. Is 800ms debounce + 4000ms maximum dirty window reasonable and internally consistent?
3. Are start/reconnect/focus/background/pagehide/profile-switch boundaries covered?
4. Does the use-case matrix cover local-only change, cloud-only change, fresh device, cloud-empty initialization, disjoint-profile merge, same-profile conflict, offline recovery, in-flight race, reload/crash and TEST mode?
5. Is same-profile divergence always protected from silent last-write-wins?
6. Is profile-switch ordering explicitly current-profile sync attempt before active-profile mutation?
7. Are in-flight sync requests serialized so competing writes cannot race?
8. If local state changes while a remote fetch/write is in flight, can any stale PULL/MERGE response still overwrite that newer local state?
9. If a MERGE cloud write succeeds after local changed, is the returned merged row prevented from becoming local state or the new local sync base?
10. Are child flows kept non-blocking while Parent owns conflict decisions?
11. Are learning/game/reward-bridge slices kept together per stable profile?
12. Does healthy child gameplay stay cloud-silent while only a real attention state may show a small non-destructive `保存確認` warning?
13. Does one transient sync failure remain child-silent, with attention promoted only after 3 consecutive failures or a real same-profile conflict?
14. When Parent must choose cloud vs device, are enough judgment materials shown to avoid blind overwrite: local-save time estimate, cloud `updated_at`, cloud revision, affected profile and meaningful progress summaries?
15. Is timestamp explicitly treated as evidence rather than automatic authority?
16. When Parent presses either destructive choice, are both the live cloud revision/payload and current local payload revalidated against the evidence that was displayed?
17. If either side changed after the conflict screen was shown or while its pre-resolution backup is running, is the old choice cancelled and the comparison refreshed instead of acting on stale evidence?

## Implementation questions

- `CLOUD_SYNC_DEBOUNCE_MS = 800`
- `CLOUD_SYNC_MAX_DIRTY_MS = 4000`
- `CLOUD_SYNC_ATTENTION_FAILURES = 3`
- local game and learning stores emit `manaevo:local-save-changed`
- only one `syncInFlight` authoritative sequence per app instance
- overlapping flush requests set `syncRerunRequested`
- `fetchMainSave()` is guarded against local mutation before any destructive decision is applied
- destructive PULL re-checks the current local semantic hash immediately before `applyCloudPayload`
- MERGE re-checks local state before cloud write and again after remote write; a newer local save causes rerun without applying or adopting the stale merged row
- async interleaving regression tests actually mutate local state while remote fetch/write promises are pending
- profile switch awaits `flushSync()` before `switchDeviceProfile()`
- reconnect/focus/pagehide/visibility hidden call reconciliation
- TEST mode short-circuits cloud writes
- conflict semantics remain Parent-owned and no silent overwrite is introduced
- ordinary debounce/in-flight/brief-offline states do not expose cloud UI to the child
- only conflict or 3 consecutive sync failures expose `保存確認` to the child; successful reconciliation resets the failure count
- Parent conflict view displays both device and cloud evidence before overwrite buttons
- both `クラウド側を使う` and `この端末側を使う` re-fetch live cloud through a local-mutation guard before acting
- after backup, local evidence is checked again; cloud-choice also performs a final cloud re-fetch, while device-choice relies on optimistic revision update and refreshes on a lost race
- stale displayed evidence cancels the action and refreshes the comparison
- current live cloud is backed up before destructive choose-device / choose-cloud resolution where applicable
- cloud-vs-device decision is never chosen automatically from wall-clock time alone

## Required verdict

If any data-loss, stale-metadata, wrong-profile, race, blind-overwrite or silent-overwrite path remains:

`DESIGN / IMPLEMENTATION BLOCKED — DO NOT MERGE`

If design and implementation are consistent and no blocker remains:

`CLOUD SYNC REVIEW PASS — READY FOR FINAL CI / MERGE`
