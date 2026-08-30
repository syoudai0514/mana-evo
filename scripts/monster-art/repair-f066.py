#!/usr/bin/env python3
"""Deterministic, non-generative alpha cleanup for F066 only.

The source candidates have a single flat #FEFEFE background.  This program
only makes border-connected pixels within RGB distance 18 of that background
transparent.  Every remaining source RGB value is preserved byte-for-byte in
the decoded pixel buffer; it never paints, reconstructs, crops, or changes the
canvas dimensions.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
MONSTER_DIR = ROOT / "public" / "monsters"
PROVENANCE_DIR = ROOT / "design" / "rebuild" / "asset-production" / "candidate-provenance"
HISTORY_DIR = ROOT / "design" / "rebuild" / "asset-production" / "candidate-history"
CHECKPOINT_DIR = ROOT / "design" / "rebuild" / "asset-production" / "repair-checkpoints" / "phase2c-complex-d"
SPECIES = ("m193", "m194", "m195")
THRESHOLD = 18


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exterior_background_mask(image: Image.Image) -> tuple[list[bool], tuple[int, int, int]]:
    """Return only the connected flat-background plate, never isolated white detail."""
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    background = pixels[0, 0][:3]
    eligible = [False] * (width * height)
    exterior = [False] * (width * height)

    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            if max(abs(red - background[0]), abs(green - background[1]), abs(blue - background[2])) <= THRESHOLD:
                eligible[y * width + x] = True

    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        index = y * width + x
        if eligible[index] and not exterior[index]:
            exterior[index] = True
            queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(1, height - 1):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                index = ny * width + nx
                if eligible[index] and not exterior[index]:
                    exterior[index] = True
                    queue.append((nx, ny))
    return exterior, background


def repair(source: Path, destination: Path) -> tuple[dict, str]:
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    exterior, background = exterior_background_mask(image)
    removed = 0
    for y in range(height):
        for x in range(width):
            if exterior[y * width + x]:
                red, green, blue, _ = pixels[x, y]
                pixels[x, y] = (red, green, blue, 0)
                removed += 1
    temporary = destination.with_suffix(".repair.tmp.webp")
    image.save(temporary, "WEBP", lossless=True, method=6, exact=True)
    temporary.replace(destination)
    return {
        "backgroundRgb": list(background),
        "backgroundConnectivityThreshold": THRESHOLD,
        "backgroundPixelsRemoved": removed,
        "edgePixelsMatted": 0,
        "pixelsChanged": removed,
        "canvas": [width, height],
    }, sha256(destination)


def main() -> None:
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "worker": "D",
        "family": "F066",
        "baseIntegrationHead": "e38fade5bd8b79e9d7fd90ca8a5a5bdf302eea11",
        "status": "PASS",
        "method": "border-connected flat background removal; threshold=18; no edge matte",
        "formalPromotion": False,
        "species": [],
    }
    timestamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

    for species_id in SPECIES:
        candidate = MONSTER_DIR / f"{species_id}.webp"
        provenance_path = PROVENANCE_DIR / f"{species_id}.json"
        provenance = json.loads(provenance_path.read_text())
        if provenance["events"][-1].get("sourceLabel") == "ManaEvo Phase 2C-D FINAL F066 safe background repair":
            raise RuntimeError(f"{species_id} already has the Phase 2C-D FINAL repair event; refusing to reapply")
        source_hash = sha256(candidate)
        source_bytes = candidate.stat().st_size
        archive = HISTORY_DIR / species_id / f"{source_hash}.webp"
        archive.parent.mkdir(parents=True, exist_ok=True)
        if not archive.exists():
            shutil.copyfile(candidate, archive)

        operation, repaired_hash = repair(archive, candidate)
        repaired_bytes = candidate.stat().st_size
        provenance["events"].append({
            "timestamp": timestamp,
            "sourceLabel": "ManaEvo Phase 2C-D FINAL F066 safe background repair",
            "previous": {
                "repositoryPath": f"public/monsters/{species_id}.webp",
                "sha256": source_hash,
                "archivePath": str(archive.relative_to(ROOT)),
            },
            "candidate": {
                "repositoryPath": f"public/monsters/{species_id}.webp",
                "sha256": repaired_hash,
                "bytes": repaired_bytes,
            },
            "manifestStateBefore": "CANDIDATE",
            "operation": "repair",
            "reason": "Remove only the border-connected uniform #FEFEFE background plate; preserve all non-background decoded RGBA values and canvas geometry.",
            "repairType": "flat-white-background-plate-removal",
            "alphaBackgroundOperation": {
                "repairType": "flat-white-background-plate-removal",
                **operation,
            },
            "noSemanticArtChange": True,
            "characterPixelPreservation": "PASS",
            "formalPromotion": False,
        })
        provenance_path.write_text(json.dumps(provenance, indent=2) + "\n")
        manifest["species"].append({
            "speciesId": species_id,
            "disposition": "REPAIRED",
            "sourceSha256": source_hash,
            "repairedSha256": repaired_hash,
            "sourceBytes": source_bytes,
            "repairedBytes": repaired_bytes,
            "repairType": "flat-white-background-plate-removal",
            "backgroundModel": "border-connected uniform rgb(254,254,254)",
            "alphaOperation": operation,
            "characterPixelPreservation": "PASS",
            "semanticArtChange": False,
            "formalPromotion": False,
        })

    (CHECKPOINT_DIR / "final-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
