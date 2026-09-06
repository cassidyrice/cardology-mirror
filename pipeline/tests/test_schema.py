"""JSON Schema validation for fixture people.jsonl (no invented celebrity bios)."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.build_dataset import load_jsonl, validate_people

FIXTURE_JSONL = Path(__file__).resolve().parents[1] / "data" / "fixtures" / "people.jsonl"


def test_fixture_jsonl_validates_against_person_schema() -> None:
    rows = load_jsonl(FIXTURE_JSONL)
    assert 1 <= len(rows) <= 5
    validate_people(rows)


def test_fixture_rows_are_synthetic_not_celebrity_bios() -> None:
    rows = load_jsonl(FIXTURE_JSONL)
    for row in rows:
        assert str(row["qid"]).startswith("Q0FIX")
        source = str(row["source_text"]).lower()
        assert "synthetic fixture" in source
        assert "example.test" in str(row["source_url"])


def test_invalid_row_is_rejected() -> None:
    rows = load_jsonl(FIXTURE_JSONL)
    bad = dict(rows[0])
    bad["card"] = "NotACard"
    try:
        validate_people([bad])
    except Exception as exc:
        assert "card" in str(exc).lower() or "NotACard" in str(exc)
    else:
        raise AssertionError("expected schema validation to reject a bogus card")
