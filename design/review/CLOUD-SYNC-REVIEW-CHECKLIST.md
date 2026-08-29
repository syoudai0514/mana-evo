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

## Required verdict

If any data-loss, stale-metadata, wrong-profile, race or silent-overwrite path remains:

`DESIGN / IMPLEMENTATION BLOCKED — DO NOT MERGE`

If design and implementation are consistent and no blocker remains:

`CLOUD SYNC REVIEW PASS — READY FOR FINAL CI / MERGE`
