# ManaEvo CURRENT — Cloud Sync Owner Summary

This is a concise owner-readable companion to `07A-CLOUD-SYNC-USE-CASES.md` and `USER-GUIDE.md`.

## What changed

- Device save remains immediate.
- Cloud sync normally starts about 0.8s after the latest save.
- Continuous play cannot postpone cloud sync forever; a sync attempt occurs by about 4s from the first unsynced save in a burst.
- Reconnect, app resume/background boundaries and profile switching trigger an immediate reconciliation attempt.
- Profile switching flushes the current profile before changing active profile.
- Concurrent sync requests are serialized and rerun instead of racing.

## What happens when device and cloud differ

- Only device changed → upload device progress.
- Only cloud changed → download cloud progress.
- Fresh device + existing cloud → restore cloud, never overwrite it with empty defaults.
- Different profiles changed on different devices → merge both safely.
- Same profile changed differently on two devices → do not guess; keep local progress and ask Parent later.
- Offline → keep playing with local save; reconcile after reconnect.
- Sync fails → keep local save and retry later.
- TEST mode → never send fixture data to family cloud save.

## Safety principle

When in doubt, preserve valid progress and stop automatic destructive reconciliation rather than silently losing data.
