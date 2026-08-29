# Manual Visual Review Findings

Scope: 238 / 238 overview review plus targeted family sheets.

Confirmed family concerns: F004, F078.

Manual classification overrides:

- m012: MANUAL_REVIEW — Manual visual QA: F004 stage2 m011 and stage3 m012 are effectively the same creature/pose; final-stage differentiation is unresolved.
- m057: KEEP — Manual visual QA: horizontal final-stage silhouette fills the card width and has strong apparent presence; low bbox height is shape-driven, not underscaling.
- m058: KEEP — Manual visual QA: bbox is centered; alpha centroid is bottom-heavy because the flame/body mass is intentionally lower in the silhouette, not because canvas placement is wrong.
- m060: KEEP — Manual visual QA: wide final-stage silhouette has sufficient apparent presence; low bbox height is shape-driven.
- m109: KEEP — Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m110: KEEP — Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m111: KEEP — Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m113: KEEP — Manual visual QA: tall/narrow lantern silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m114: KEEP — Manual visual QA: tall/narrow lantern silhouette has sufficient card presence; lateral transparent margin is intentional shape space.
- m146: KEEP — Manual visual QA: tall/narrow book-spirit silhouette is well centered and sufficiently large; width alone does not justify normalization.
- m147: KEEP — Manual visual QA: tall/narrow book-spirit silhouette is well centered and sufficiently large; width alone does not justify normalization.
- m154: KEEP — Manual visual QA: wide armored body fills the production card strongly; reduced height is body-plan driven.
- m196: KEEP — Manual visual QA: tall stage1 bird silhouette has strong presence and is appropriately smaller in width than evolved winged stages.
- m204: KEEP — Manual visual QA: tall final-stage ghost silhouette has strong presence; narrow width is body-plan driven.
- m212: KEEP — Manual visual QA: wide-wing stage2 bird has strong apparent size; low bbox height is wing/body-plan driven.
- m213: KEEP — Manual visual QA: wide-wing final-stage bird fills the card width and is bbox-centered; alpha-centroid offset is caused by asymmetric wing/tail mass.
- m229: MANUAL_REVIEW — Manual visual QA: F078 stage1 is scene-backed and reads as a small dark cat-like creature while stages2/3 read as large winged poison creatures; family/body-plan continuity is unresolved and background repair alone may be insufficient.
- m233: REPAIR — Manual visual QA: tiny character also contains a detached stray fragment at left; normalization alone cannot remove the pixel artifact.
- m234: REPAIR — Manual visual QA: visible text/label-like marks appear above the creature; normalization alone cannot remove this production-unsafe pixel artifact.
- m235: MANUAL_REVIEW — Manual visual QA: image is dominated by a horizontal forest/tree scene rather than an unambiguous isolated monster; safe separation of creature from scenery is uncertain.

No candidate binary was changed by this review.
