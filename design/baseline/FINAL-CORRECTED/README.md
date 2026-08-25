# FINAL-CORRECTED Baseline

## Purpose
This directory preserves the exact source payload of `mana-evo-terra-FINAL-CORRECTED` as a historical pre-change BASELINE.

**This baseline is NOT the CURRENT canonical specification.**

## Preservation rules
- Files under `source/` are preserved without editorial modification.
- Do not mechanically restore CURRENT behavior from this baseline.
- Do not resolve product decisions such as 238/239 inside this baseline.
- Integrity metadata is kept outside `source/`.

## Integrity records
- `source/`: exact archive source payload
- `MANIFEST.sha256`: SHA-256 for all 32 preserved source files
- `CURRENT-DESIGN-MISSING.md`: baseline paths absent from current `design/` path space

## Rescue status
**COMPLETED**
- Preserved original source files: **32 / 32**
- SHA-256 manifest entries: **32 / 32**
- Git blob SHA mismatches: **0**
- SHA-256 mismatches: **0**
- `.transfer` staging files remaining: **0**
- `src/**`, `tests/**`, `design/current/**`: **unchanged**
- CURRENT promotion: **none**
- 238/239 product decision: **not performed by W-001**
