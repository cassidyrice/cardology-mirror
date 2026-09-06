"""The Wikidata path must stay on REST wbgetentities — no SPARQL endpoint."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = "query.wikidata.org"


def test_pipeline_modules_do_not_call_sparql() -> None:
    offenders: list[str] = []
    for path in ROOT.rglob("*.py"):
        if "tests" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        if FORBIDDEN in text:
            offenders.append(str(path.relative_to(ROOT)))
    assert offenders == []
