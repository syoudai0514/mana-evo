# ManaEvo CURRENT — Cloud Sync Owner Summary

This is a concise owner-readable companion to `07A-CLOUD-SYNC-USE-CASES.md` and `USER-GUIDE.md`.

## What changed

- Device save remains immediate.
- Cloud sync normally starts about 0.8s after the latest save.
- Continuous play cannot postpone cloud sync forever; a sync attempt occurs by about 4s from the first unsynced save in a burst.
- Reconnect, app resume/background boundaries and profile switching trigger an immediate reconciliation attempt.
- Profile switching flushes the current profile before changing active profile.
- Concurrent sync requests are serialized and rerun instead of racing.
- If the child makes new progress while a cloud request is still running, that newer device progress is never overwritten by the older cloud decision.
- Healthy cloud operation stays invisible in child gameplay. Only a real attention state may show a small `保存確認` warning.

## What happens when device and cloud differ

- Only device changed → upload device progress.
- Only cloud changed → download cloud progress, **but only if the device did not change while the cloud request was running**.
- Fresh device + existing cloud → restore cloud, never overwrite it with empty defaults.
- Different profiles changed on different devices → merge both safely. If this device changes again while the merge write is running, the returned older merge is not applied over that newer progress; ManaEvo reconciles again.
- Same profile changed differently on two devices → do not guess; keep local progress and ask Parent later.
- Offline → keep playing with local save; reconcile after reconnect.
- Sync fails → keep local save and retry later.
- TEST mode → never send fixture data to family cloud save.

## Example: child answers while syncing

Suppose cloud reconciliation starts when the device has 10 completed questions. While the network request is still pending, the child completes question 11.

ManaEvo treats question 11 as newer valid local progress. Even if the older sync result says "download cloud", it must not replace the device with the snapshot that only knew about the first 10 questions. The old decision is discarded and reconciliation is performed again from the current local state.

## When Parent must choose device or cloud

ManaEvo must not show only two blind buttons.

The Parent conflict screen shows both sides with judgment material:

- this device's last local-save time estimate;
- cloud `updated_at`;
- cloud revision;
- affected profile name(s);
- game progress comparison such as battles won, monsters caught, monsters owned, dex caught count and cleared stages;
- an explicit note that learning data also differs when applicable.

The timestamp is **evidence, not authority**. A later clock does not automatically win.

Even after Parent has read the screen, either side can change before or during button processing. Therefore both `クラウド側を使う` and `この端末側を使う` re-check live cloud and current device data. The device is guarded while the live cloud request is pending. After the pre-resolution backup, the device is checked again. For the cloud-choice path, cloud is fetched once more after backup. For the device-choice path, the cloud write uses an optimistic revision condition and refreshes the comparison if another device wins that race.

If any evidence became stale, ManaEvo **does not execute the old choice**. It refreshes the comparison and asks Parent to decide again.

## Child-facing behavior

Normal autosync waiting, successful syncing and brief offline periods do not show cloud UI to the child.

One temporary failure is also kept silent. ManaEvo promotes a child-visible `保存確認` only for a confirmed same-profile conflict or after **3 consecutive sync failures** without a successful reconciliation in between. A successful reconciliation resets this count.

The child warning never shows cloud-vs-device overwrite buttons. It only indicates that the current device data is still saved locally and a Parent should check it later.

## Safety principle

When in doubt, preserve valid progress and stop automatic destructive reconciliation rather than silently losing data.
