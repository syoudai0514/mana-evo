#!/usr/bin/env python3
import hashlib, json, os, shutil, sys
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
MONSTER_DIR = ROOT / "public" / "monsters"
PROV_DIR = ROOT / "design" / "rebuild" / "asset-production" / "candidate-provenance"
HISTORY_DIR = ROOT / "design" / "rebuild" / "asset-production" / "candidate-history"
TMP_REPORT = Path("/tmp/n1a-report.json")
ALPHA_VISIBLE = 8
TARGETS = {
    "m160": {"target": 0.72, "expected": "5d374f7a64fc07c2a2f829ff50c2862d6f5532b85c2c94ce5e2fda5114aa608e", "cp": "CP1"},
    "m161": {"target": 0.76, "expected": "e267acd7071d63de92f906bb9b9dae3b486d54f0e3b202ee3b41336756abf510", "cp": "CP1"},
    "m162": {"target": 0.80, "expected": "0938c90351e39c82a612760a606bef12e1e52e593eea10c25766f4ee77a958d4", "cp": "CP2"},
}
ALLOWED = set(TARGETS)
M235_EXPECTED = "a5c1defafa948bba4e46bfa1548a1ec72dfb09a165279c9c3225827fb8afb95d"

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def visible_bbox(img, threshold=ALPHA_VISIBLE):
    a = img.getchannel("A")
    return a.point(lambda v: 255 if v >= threshold else 0).getbbox()

def nonzero_bbox(img):
    return img.getchannel("A").getbbox()

def bbox_dict(b):
    if not b:
        return None
    x0,y0,x1,y1 = b
    return {"x": x0, "y": y0, "w": x1-x0, "h": y1-y0, "right": x1, "bottom": y1}

def metrics(img):
    w,h = img.size
    vb = visible_bbox(img)
    nb = nonzero_bbox(img)
    if not vb or not nb:
        raise RuntimeError("empty alpha content")
    vx0,vy0,vx1,vy1 = vb
    nx0,ny0,nx1,ny1 = nb
    vw,vh = vx1-vx0, vy1-vy0
    nw,nh = nx1-nx0, ny1-ny0
    return {
        "canvas": [w,h],
        "visibleBBox": bbox_dict(vb),
        "nonzeroBBox": bbox_dict(nb),
        "visiblePresence": {"w": vw/w, "h": vh/h, "max": max(vw/w, vh/h)},
        "nonzeroPresence": {"w": nw/w, "h": nh/h, "max": max(nw/w, nh/h)},
        "visibleCenter": [(vx0+vx1)/(2*w), (vy0+vy1)/(2*h)],
        "nonzeroClearance": {"left": nx0, "top": ny0, "right": w-nx1, "bottom": h-ny1},
        "edgeContact": nx0 <= 0 or ny0 <= 0 or nx1 >= w or ny1 >= h,
    }

def premul_resize(img, size):
    return img.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")

def recover_mae(before_crop, after_crop):
    recovered = premul_resize(after_crop, before_crop.size)
    a = before_crop.convert("RGBa")
    b = recovered.convert("RGBa")
    diff = ImageChops.difference(a, b)
    stat = ImageStat.Stat(diff)
    return {"rgbaMeanAbs": sum(stat.mean) / 4.0, "perChannel": stat.mean}

def load_report():
    if TMP_REPORT.exists():
        return json.loads(TMP_REPORT.read_text())
    return {"schemaVersion": 1, "title": "FINAL CLOSEOUT-N1A CURRENT SCALE NORMALIZE", "species": {}, "checkpoints": {}}

def save_report(report):
    TMP_REPORT.write_text(json.dumps(report, indent=2) + "\n")

def append_provenance(species, before_sha, after_sha, after_bytes, details):
    path = PROV_DIR / f"{species}.json"
    data = json.loads(path.read_text())
    archive_rel = f"design/rebuild/asset-production/candidate-history/{species}/{before_sha}.webp"
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "sourceLabel": f"ManaEvo FINAL CLOSEOUT-N1A {details['checkpoint']} current scale normalization",
        "previous": {"repositoryPath": f"public/monsters/{species}.webp", "sha256": before_sha, "archivePath": archive_rel},
        "candidate": {"repositoryPath": f"public/monsters/{species}.webp", "sha256": after_sha, "bytes": after_bytes},
        "manifestStateBefore": "CANDIDATE",
        "operation": "normalize",
        "reason": "Normalize only apparent scale and placement inside the existing transparent canvas; preserve the complete CURRENT repaired subject including thin alpha/VFX.",
        "normalization": {
            "method": "uniform-transparent-canvas-scale-and-reposition",
            "resampling": "Pillow premultiplied-alpha LANCZOS; lossless WebP",
            "targetVisibleMaxPresence": details["target"],
            "scaleFactor": details["scaleFactor"],
            "before": details["before"],
            "after": details["after"],
            "reverseScalePremultipliedMae": details["reverseScalePremultipliedMae"],
        },
        "noSemanticArtChange": True,
        "backgroundMutation": False,
        "crop": False,
        "edgeContact": False,
        "formalPromotion": False,
    }
    data["events"].append(event)
    path.write_text(json.dumps(data, indent=2) + "\n")

def normalize(species):
    cfg = TARGETS[species]
    path = MONSTER_DIR / f"{species}.webp"
    before_sha = sha256(path)
    if before_sha != cfg["expected"]:
        raise RuntimeError(f"{species}: CURRENT SHA mismatch: {before_sha} != {cfg['expected']}")
    img = Image.open(path).convert("RGBA")
    before = metrics(img)
    w,h = img.size
    nb = nonzero_bbox(img)
    vb = visible_bbox(img)
    nx0,ny0,nx1,ny1 = nb
    vx0,vy0,vx1,vy1 = vb
    crop = img.crop(nb)
    visible_max_px = max(vx1-vx0, vy1-vy0)
    target_px = cfg["target"] * min(w,h)
    desired_factor = target_px / visible_max_px
    margin = max(12, round(min(w,h) * 0.07))
    fit_factor = min((w - 2*margin) / crop.width, (h - 2*margin) / crop.height)
    factor = min(desired_factor, fit_factor)
    if factor <= 1.05:
        raise RuntimeError(f"{species}: normalization factor too small ({factor:.4f})")
    out_size = (max(1, round(crop.width * factor)), max(1, round(crop.height * factor)))
    resized = premul_resize(crop, out_size)
    canvas = Image.new("RGBA", (w,h), (0,0,0,0))
    px = (w - out_size[0]) // 2
    py = (h - out_size[1]) // 2
    canvas.alpha_composite(resized, (px,py))
    after = metrics(canvas)
    clearance = after["nonzeroClearance"]
    if after["edgeContact"] or min(clearance.values()) < margin - 2:
        raise RuntimeError(f"{species}: edge/crop gate failed: {clearance}")
    target_delta = abs(after["visiblePresence"]["max"] - cfg["target"])
    if target_delta > 0.02:
        raise RuntimeError(f"{species}: target presence miss {after['visiblePresence']['max']:.4f} vs {cfg['target']:.4f}")
    before_ar = before["visibleBBox"]["w"] / before["visibleBBox"]["h"]
    after_ar = after["visibleBBox"]["w"] / after["visibleBBox"]["h"]
    if abs(after_ar / before_ar - 1.0) > 0.015:
        raise RuntimeError(f"{species}: silhouette aspect drift {before_ar:.4f}->{after_ar:.4f}")
    after_nb = nonzero_bbox(canvas)
    after_crop = canvas.crop(after_nb)
    mae = recover_mae(crop, after_crop)
    if mae["rgbaMeanAbs"] > 8.0:
        raise RuntimeError(f"{species}: reverse-scale semantic QA MAE too high {mae['rgbaMeanAbs']:.3f}")
    archive = HISTORY_DIR / species / f"{before_sha}.webp"
    archive.parent.mkdir(parents=True, exist_ok=True)
    if archive.exists():
        if sha256(archive) != before_sha:
            raise RuntimeError(f"{species}: archive collision")
    else:
        shutil.copy2(path, archive)
    canvas.save(path, "WEBP", lossless=True, quality=100, method=6, exact=True)
    after_sha = sha256(path)
    after_bytes = path.stat().st_size
    if after_sha == before_sha:
        raise RuntimeError(f"{species}: output SHA unchanged unexpectedly")
    encoded = Image.open(path).convert("RGBA")
    encoded_after = metrics(encoded)
    if encoded_after["edgeContact"] or min(encoded_after["nonzeroClearance"].values()) < margin - 2:
        raise RuntimeError(f"{species}: encoded edge/crop gate failed")
    details = {
        "checkpoint": cfg["cp"], "target": cfg["target"], "scaleFactor": factor,
        "before": before, "after": encoded_after, "reverseScalePremultipliedMae": mae,
        "beforeSha256": before_sha, "afterSha256": after_sha, "afterBytes": after_bytes,
    }
    append_provenance(species, before_sha, after_sha, after_bytes, details)
    report = load_report()
    report["species"][species] = details
    save_report(report)
    print(json.dumps({"NORMALIZED": species, **details}, indent=2))

def snapshot_candidates():
    return {p.stem: sha256(p) for p in sorted(MONSTER_DIR.glob("m*.webp")) if p.stem.startswith("m")}

def validate():
    report = load_report()
    current = snapshot_candidates()
    before_path = Path("/tmp/n1a-candidates-before.json")
    if not before_path.exists():
        raise RuntimeError("missing initial candidate snapshot")
    before = json.loads(before_path.read_text())
    changed = sorted(k for k in before if before[k] != current.get(k))
    if changed != sorted(ALLOWED):
        raise RuntimeError(f"unexpected candidate changes: {changed}")
    if current.get("m235") != before.get("m235") or current.get("m235") != M235_EXPECTED:
        raise RuntimeError(f"m235 changed or unexpected: {current.get('m235')}")
    for s in sorted(ALLOWED):
        prov = json.loads((PROV_DIR / f"{s}.json").read_text())
        if prov["events"][-1]["candidate"]["sha256"] != current[s]:
            raise RuntimeError(f"{s}: provenance/current mismatch")
        img = Image.open(MONSTER_DIR / f"{s}.webp").convert("RGBA")
        m = metrics(img)
        if m["edgeContact"]:
            raise RuntimeError(f"{s}: edge contact after final")
    report["candidateChanges"] = changed
    report["unexpectedCandidateChanges"] = []
    report["m235"] = {"status": "UNTOUCHED", "sha256": current.get("m235")}
    save_report(report)
    print(json.dumps({"FINAL_PIXEL_GATE": "PASS", "changed": changed, "m235": current.get("m235")}, indent=2))

def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: final-closeout-n1a.py cp1|cp2|validate")
    mode = sys.argv[1]
    if mode == "cp1":
        for s in ("m160","m161"):
            normalize(s)
    elif mode == "cp2":
        normalize("m162")
    elif mode == "validate":
        validate()
    else:
        raise SystemExit(f"unknown mode {mode}")

if __name__ == "__main__":
    main()
