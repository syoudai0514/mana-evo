# ManaEvo Cloud Sync — Review Checklist

Target change: D-028 cloud sync timing and reconciliation safety

Reviewer should validate design and implementation together.

## Design questions

1. Is local-first persistence preserved for all child progress?
2. Is 800ms debounce + 4000ms maximum dirty window reasonable and internally consistent?
3. Are start/reconnect/focus/background/pagehide/profile-switch boundaries covered?
4. Does the use-case matrix cover local-only change, cloud-only change, fresh device, cloud-empty initialization, disjoint-profile merge, same-profile conflict, offline recovery, in-flight race, reload/crash and TEST mode?
5. Is same-profile divergence always protected from silent last-write-wins?
6. Is profile-switch ordering explicitly current-profile sync attempt before active-profile mutation?
7. Are in-flight sync requests serialized so competing writes cannot race?
8. Could a stale sync completion mark newer local changes as fully synced?
9. Are child flows kept non-blocking while Parent owns conflict decisions?
10. Are learning/game/reward-bridge slices kept together per stable profile?
11. Does healthy child gameplay stay cloud-silent while only a real attention state may show a small non-destructive `保存確認` warning?
12. When Parent must choose cloud vs device, are enough judgment materials shown to avoid blind overwrite: local-save time estimate, cloud `updated_at`, cloud revision, affected profile and meaningful progress summaries?
13. Is timestamp explicitly treated as evidence rather than automatic authority?

## Implementation questions

- `CLOUD_SYNC_DEBOUNCE_MS = 800`
- `CLOUD_SYNC_MAX_DIRTY_MS = 4000`
- local game and learning stores emit `manaevo:local-save-changed`
- only one `syncInFlight` authoritative sequence per app instance
- overlapping flush requests set `syncRerunRequested`
- profile switch awaits `flushSync()` before `switchDeviceProfile()`
- reconnect/focus/pagehide/visibility hidden call reconciliation
- TEST mode short-circuits cloud writes
- conflict semantics remain Parent-owned and no silent overwrite is introduced
- ordinary debounce/in-flight/brief-offline states do not expose cloud UI to the child
- conflict/persistent automatic sync error may expose only a `保存確認` warning to the child
- Parent conflict view displays both device and cloud evidence before overwrite buttons
- current cloud is backed up before destructive choose-device / choose-cloud resolution where applicable
- cloud-vs-device decision is never chosen automatically from wall-clock time alone

## Required verdict

If any data-loss, stale-metadata, wrong-profile, race, blind-overwrite or silent-overwrite path remains:

`DESIGN / IMPLEMENTATION BLOCKED — DO NOT MERGE`

If design and implementation are consistent and no blocker remains:

`CLOUD SYNC REVIEW PASS — READY FOR FINAL CI / MERGE`
