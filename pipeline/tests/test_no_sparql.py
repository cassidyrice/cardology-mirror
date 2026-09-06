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
        # Presidents, olympics, and NFL HOF harvests may try SPARQL, then
        # fall back to known lists / CirrusSearch / wbgetentities.
        if "presidents" in path.parts or "olympics" in path.parts or "nfl_hof" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        if FORBIDDEN in text:
            offenders.append(str(path.relative_to(ROOT)))
    assert offenders == []


def test_presidents_module_documents_sparql_fallback() -> None:
    sparql = (ROOT / "presidents" / "sparql.py").read_text(encoding="utf-8")
    assert FORBIDDEN in sparql
    assert "fall back" in sparql.lower() or "fallback" in sparql.lower()


def test_olympics_module_documents_sparql_fallback() -> None:
    sparql = (ROOT / "olympics" / "sparql.py").read_text(encoding="utf-8")
    assert FORBIDDEN in sparql
    assert "fall back" in sparql.lower() or "fallback" in sparql.lower()


def test_nfl_hof_module_documents_sparql_fallback() -> None:
    catalog = (ROOT / "nfl_hof" / "catalog.py").read_text(encoding="utf-8")
    assert FORBIDDEN in catalog
    assert "fall back" in catalog.lower() or "fallback" in catalog.lower()
