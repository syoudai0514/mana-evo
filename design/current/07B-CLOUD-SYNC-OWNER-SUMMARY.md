# ManaEvo CURRENT — Cloud Sync Owner Summary

This is a concise owner-readable companion to `07A-CLOUD-SYNC-USE-CASES.md` and `USER-GUIDE.md`.

## What changed

- Device save remains immediate.
- Cloud sync normally starts about 0.8s after the latest save.
- Continuous play cannot postpone cloud sync forever; a sync attempt occurs by about 4s from the first unsynced save in a burst.
- Reconnect, app resume/background boundaries and profile switching trigger an immediate reconciliation attempt.
- Profile switching flushes the current profile before changing active profile.
- Concurrent sync requests are serialized and rerun instead of racing.
- Healthy cloud operation stays invisible in child gameplay. Only a real attention state may show a small `保存確認` warning.

## What happens when device and cloud differ

- Only device changed → upload device progress.
- Only cloud changed → download cloud progress.
- Fresh device + existing cloud → restore cloud, never overwrite it with empty defaults.
- Different profiles changed on different devices → merge both safely.
- Same profile changed differently on two devices → do not guess; keep local progress and ask Parent later.
- Offline → keep playing with local save; reconcile after reconnect.
- Sync fails → keep local save and retry later.
- TEST mode → never send fixture data to family cloud save.

## When Parent must choose device or cloud

ManaEvo must not show only two blind buttons.

The Parent conflict screen shows both sides with judgment material:

- this device's last local-save time estimate;
- cloud `updated_at`;
- cloud revision;
- affected profile name(s);
- game progress comparison such as battles won, monsters caught, monsters owned, dex caught count and cleared stages;
- an explicit note that learning data also differs when applicable.

The timestamp is **evidence, not authority**. A later clock does not automatically win. For example, one device may have newer battle/capture progress while another has important learning progress. Parent should compare both the time and the progress summary before choosing.

Choosing either side remains Parent-only. The current cloud copy is backed up before a destructive conflict resolution where practical.

## Child-facing behavior

Normal autosync waiting, successful syncing and brief offline periods do not show cloud UI to the child.

If a confirmed same-profile conflict or explicit persistent automatic sync error occurs, the child may see only a small `保存確認` warning. It does not show cloud-vs-device overwrite buttons. The message should make clear that the current device progress is still saved locally and a Parent should check it later.

## Safety principle

When in doubt, preserve valid progress and stop automatic destructive reconciliation rather than silently losing data.
