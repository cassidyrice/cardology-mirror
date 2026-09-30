"""Package verified local writing outputs. No network, credentials or DOCX runtime."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

base = Path("content/period-library")
report = json.loads((base / "qa/automated-report.json").read_text())
if not report["passed"]:
    raise SystemExit("Run the content validator successfully before packaging")
if not (base / "qa/editorial-review.md").exists():
    raise SystemExit("Independent editorial review is required before packaging")
output = base / "deliverables"
output.mkdir(exist_ok=True)
shutil.copy2(base / "MANUSCRIPT.html", output / "index.html")
archive = output / "card-blueprints-writing.zip"
files = sorted(path for path in base.rglob("*") if path.is_file() and output not in path.parents)
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as handle:
    for path in files:
        handle.write(path, Path("CardBlueprintsWriting") / path.relative_to(base))
with zipfile.ZipFile(archive) as handle:
    assert handle.testzip() is None
    for path in files:
        name = str(Path("CardBlueprintsWriting") / path.relative_to(base))
        assert handle.read(name) == path.read_bytes(), name
    pairs = json.loads(handle.read("CardBlueprintsWriting/period-artifacts.json"))
    yearly = json.loads(handle.read("CardBlueprintsWriting/yearly-artifacts.json"))
    assert len(pairs) == len({entry["id"] for entry in pairs}) == 364
    assert len(yearly) == len({entry["id"] for entry in yearly}) == 260
result = {"path": str(archive.resolve()), "files": len(files), "bytes": archive.stat().st_size, "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "periodPairs": 364, "yearlyPairs": 260, "zipIntegrity": "passed", "byteComparison": "every member matches its verified local source"}
(output / "bundle-verification.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))
