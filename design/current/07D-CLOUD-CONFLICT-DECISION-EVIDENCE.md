# ManaEvo CURRENT — Cloud Conflict Decision Evidence

Status: **CURRENT normative companion to D-018 / D-021 / D-028**

## Purpose

When the same stable profile has diverged on device and cloud, Parent must never be asked to make a blind `cloud or device` choice.

## Evidence shown before destructive choice

The Parent-only conflict surface must show, for both sides where available:

- affected profile name / stable profile identity;
- this device's last local-save event time estimate;
- cloud `updated_at`;
- cloud revision;
- meaningful game progress summary for the affected profile, including at least battles won, monsters caught, owned monster count, caught-dex count and cleared-stage count;
- an explicit indication when learning data also differs.

Future revisions may add richer learning summaries, XP/level deltas, recent activity samples or per-domain diffs, but they must not remove the minimum evidence above without an explicit canonical change.

## Timestamp rule

Timestamps are **evidence, not authority**.

A later timestamp must not automatically win because:

- device clocks can differ;
- one device may contain newer battle/capture progress while the other contains important learning progress;
- an import/reconciliation operation can update a timestamp without making every semantic part superior.

The automatic reconciliation authority remains revision/hash/per-profile divergence semantics. Once the system reaches same-profile CONFLICT, destructive selection belongs to Parent.

## Evidence freshness at action time

The comparison screen is a snapshot, not permanent authority. When Parent presses either destructive choice, runtime must revalidate both sides before changing data:

- re-fetch the current cloud row;
- compare current cloud revision **and semantic payload hash** with what Parent was shown;
- re-capture the current local payload and compare its semantic hash with what Parent was shown.

If either side changed after the comparison was displayed, the choice is cancelled. No destructive apply/write occurs. The UI refreshes the evidence and asks Parent to review again.

This rule applies to both `クラウド側を使う` and `この端末側を使う`. A revision guard only on the device-overwrite path is insufficient because the cloud-choice path could otherwise apply a stale cloud snapshot that Parent never intended to choose.

## Child boundary

The child-facing surface must not expose this comparison or the destructive choices. The child may only receive the D-028 minimal `保存確認` warning for a real attention state, while the Parent surface presents evidence and resolution controls.

## Backup boundary

After action-time evidence is confirmed fresh, and before Parent performs a destructive cloud-vs-device resolution, preserve the current cloud snapshot as a backup where the existing backup model supports it.

Do not create the destructive-resolution backup from a stale previously displayed cloud row if the live cloud revision has advanced.

## Acceptance

Release is blocked if:

- Parent sees overwrite buttons without comparison evidence;
- the UI labels a side as authoritative/newest based only on timestamp;
- child UI exposes destructive resolution;
- affected profile identity is ambiguous;
- either destructive button acts on a cloud/local snapshot that changed after the displayed comparison;
- choosing a side bypasses backup/revision/hash freshness guards.
