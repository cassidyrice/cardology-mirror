"""SCOTUS harvest: day-precision only, no invented DOBs, D3 + retired dropped."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.scotus.bios import classify_scotus_date, match_catalog_row, parse_bios_html
from pipeline.scotus.catalog import SITTING_ENWIKI_TITLES, SITTING_JUSTICES, SITTING_QIDS, SITTING_SLUGS
from pipeline.scotus.harvest import classify_row, unique_slug, validate_justices

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_HTML = ROOT / "data" / "fixtures" / "scotus_bios.html"
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "scotus_wikidata_Q0SCO1.json"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "scotus_wikidata_conflict.json"
FIXTURE_YEAR_WD = ROOT / "data" / "fixtures" / "scotus_wikidata_year_only.json"
FIXTURE_MIXED = ROOT / "data" / "fixtures" / "scotus_wikidata_alito_mixed.json"
PEOPLE_JSONL = ROOT / "data" / "scotus" / "people.jsonl"
PROVENANCE = ROOT / "data" / "scotus" / "provenance.json"

TODAY = date(2026, 9, 6)

SCOTUS_DATES = {
    "john-g-roberts-jr": ("1955-01-27", "K♣"),
    "clarence-thomas": ("1948-06-23", "7♣"),
    "samuel-a-alito-jr": ("1950-04-01", "7♠"),
    "sonia-sotomayor": ("1954-06-25", "5♣"),
    "elena-kagan": ("1960-04-28", "6♣"),
    "neil-m-gorsuch": ("1967-08-29", "10♥"),
    "brett-m-kavanaugh": ("1965-02-12", "K♦"),
    "amy-coney-barrett": ("1972-01-28", "Q♣"),
    "ketanji-brown-jackson": ("1970-09-14", "10♣"),
}

CATALOG_FIXTURE = {
    "slug": "ada-fixture-roberts-jr",
    "name": "Ada Fixture Roberts, Jr.",
    "qid": "Q0SCO1",
    "enwiki_title": "Ada Fixture Roberts",
    "role": "Chief Justice of the United States",
    "seniority": 1,
}


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _sitting_parsed(**overrides: object) -> dict:
    row = {
        "name": "Ada Fixture Roberts, Jr.",
        "role": "Chief Justice of the United States",
        "retired": False,
        "scotus_birth_kind": "day",
        "scotus_birth_date": "1955-01-27",
        "scotus_url": "https://www.supremecourt.gov/about/biographies.aspx",
    }
    row.update(overrides)
    return row


def test_catalog_has_nine_distinct_sitting_identifiers() -> None:
    assert len(SITTING_JUSTICES) == 9
    assert len(set(SITTING_QIDS)) == 9
    assert len(set(SITTING_SLUGS)) == 9
    assert len(set(SITTING_ENWIKI_TITLES)) == 9
    assert SITTING_SLUGS[0] == "john-g-roberts-jr"
    assert SITTING_SLUGS[-1] == "ketanji-brown-jackson"


def test_scotus_date_parser_keeps_day_and_drops_year_only() -> None:
    assert classify_scotus_date("was born in Buffalo, New York, January 27, 1955.") == (
        "day",
        "1955-01-27",
    )
    assert classify_scotus_date("was born in the Pinpoint community near Savannah, Georgia on June 23, 1948.") == (
        "day",
        "1948-06-23",
    )
    assert classify_scotus_date("was born in 1948.") == ("year_only", None)
    assert classify_scotus_date(None) == ("missing", None)
    assert classify_scotus_date("was born in Buffalo, New York, February 31, 1955.") == (
        "invalid",
        None,
    )


def test_parse_bios_html_keeps_current_and_flags_retired() -> None:
    rows = parse_bios_html(FIXTURE_HTML.read_text(encoding="utf-8"))
    assert len(rows) == 3
    by_name = {row["name"]: row for row in rows}
    sitting = by_name["Ada Fixture Roberts, Jr."]
    assert sitting["retired"] is False
    assert sitting["role"] == "Chief Justice of the United States"
    assert sitting["scotus_birth_kind"] == "day"
    assert sitting["scotus_birth_date"] == "1955-01-27"

    year_only = by_name["Year Only Fixture"]
    assert year_only["retired"] is False
    assert year_only["scotus_birth_kind"] == "year_only"
    assert year_only["scotus_birth_date"] is None

    retired = by_name["Retired Fixture"]
    assert retired["retired"] is True
    assert retired["scotus_birth_date"] == "1936-07-23"


def test_match_catalog_ignores_jr_and_punctuation() -> None:
    parsed = {"name": "John G. Roberts, Jr."}
    match = match_catalog_row(parsed, SITTING_JUSTICES, set())
    assert match is not None
    assert match["slug"] == "john-g-roberts-jr"
    assert match_catalog_row({"name": "John Roberts"}, SITTING_JUSTICES, set())["slug"] == "john-g-roberts-jr"


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        parsed=_sitting_parsed(),
        catalog=CATALOG_FIXTURE,
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1955-01-27"
    assert draft["wikidata_birth_date"] == "1955-01-27"
    assert draft["dob_crosscheck"] == "match"
    assert birth_card_from_iso(draft["birth_date"]) == "K♣"


def test_classify_drops_retired_year_only_and_conflict() -> None:
    retired_reason, retired_draft = classify_row(
        parsed=_sitting_parsed(retired=True, name="Retired Fixture"),
        catalog=CATALOG_FIXTURE,
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert retired_reason == "retired"
    assert retired_draft is None

    year_reason, year_draft = classify_row(
        parsed=_sitting_parsed(scotus_birth_kind="year_only", scotus_birth_date=None),
        catalog=CATALOG_FIXTURE,
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    conflict_reason, conflict_draft = classify_row(
        parsed=_sitting_parsed(),
        catalog={**CATALOG_FIXTURE, "qid": "Q0SCO2"},
        entity=_load(FIXTURE_CONFLICT),
        today=TODAY,
        blocklist=set(),
    )
    assert conflict_reason == "dob_conflict"
    assert conflict_draft is None


def test_classify_drops_wikidata_year_precision() -> None:
    entity = _load(FIXTURE_YEAR_WD)
    assert parse_day_precision_time(entity, "P569") is None
    reason, draft = classify_row(
        parsed=_sitting_parsed(),
        catalog={**CATALOG_FIXTURE, "qid": "Q0SCO3"},
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "wikidata_precision"
    assert draft is None


def test_mixed_precision_prefers_day_claim() -> None:
    entity = _load(FIXTURE_MIXED)
    assert parse_day_precision_time(entity, "P569") == ("1950-04-01", 11)
    reason, draft = classify_row(
        parsed=_sitting_parsed(scotus_birth_date="1950-04-01"),
        catalog={**CATALOG_FIXTURE, "qid": "Q0SCO4"},
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1950-04-01"


def test_classify_d3_and_minor() -> None:
    entity = _load(FIXTURE_ENTITY)
    entity["descriptions"] = {"en": {"value": "former dictator of a state"}}
    reason, draft = classify_row(
        parsed=_sitting_parsed(),
        catalog=CATALOG_FIXTURE,
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    reason, draft = classify_row(
        parsed=_sitting_parsed(scotus_birth_date="2010-01-27"),
        catalog=CATALOG_FIXTURE,
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_public_formula_cards_for_sitting_dates() -> None:
    for slug, (iso, card) in SCOTUS_DATES.items():
        assert birth_card_from_iso(iso) == card, slug
    assert birth_card_from_iso("1955-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Fixture Roberts", used, qid="Q0SCO1")
    used.add(first)
    second = unique_slug("Ada Fixture Roberts", used, qid="Q0SCO9")
    assert first == "ada-fixture-roberts"
    assert second != first
    assert "q0sco9" in second or "Q0SCO9".lower() in second


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Roberts, Jr.",
        "slug": "ada-fixture-roberts-jr",
        "role": "Chief Justice of the United States",
        "seniority": 1,
        "birth_date": "1955-01-27",
        "death_date": None,
        "card": "K♣",
        "source_text": "Synthetic fixture justice. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Roberts",
        "wikipedia_title": "Ada Fixture Roberts",
        "scotus_url": "https://www.supremecourt.gov/about/biographies.aspx",
        "scotus_birth_date": "1955-01-27",
        "wikidata_birth_date": "1955-01-27",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_justices([row])


def test_committed_scotus_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("scotus people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_justices(rows)
    assert len(rows) == 9
    slugs = [row["slug"] for row in rows]
    assert slugs == list(SITTING_SLUGS)
    assert len(set(slugs)) == 9
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["scotus_birth_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "supremecourt.gov" in row["scotus_url"]
        expected_iso, expected_card = SCOTUS_DATES[row["slug"]]
        assert row["birth_date"] == expected_iso
        assert row["card"] == expected_card
        assert row["death_date"] is None

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["john-g-roberts-jr"]["role"] == "Chief Justice of the United States"
    assert by_slug["ketanji-brown-jackson"]["role"] == "Associate Justice"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == 9
        assert provenance["kept"] == 9
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert "retired" in provenance["by_reason"]
