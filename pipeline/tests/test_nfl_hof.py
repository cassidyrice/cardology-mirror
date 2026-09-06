"""NFL Hall of Fame harvest: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.nfl_hof.catalog import extract_hof_id, hof_url
from pipeline.nfl_hof.dates import parse_free_date, parse_hof_html
from pipeline.nfl_hof.harvest import (
    classify_row,
    induction_year,
    unique_slug,
    validate_nfl_hof,
)
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "nfl_hof_wikidata_Q0HOF1.json"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "nfl_hof_wikidata_conflict.json"
FIXTURE_BIO = ROOT / "data" / "fixtures" / "nfl_hof_bio_day.html"
FIXTURE_YEAR_ONLY = ROOT / "data" / "fixtures" / "nfl_hof_bio_year_only.html"
PEOPLE_JSONL = ROOT / "data" / "nfl_hof" / "people.jsonl"
PROVENANCE = ROOT / "data" / "nfl_hof" / "provenance.json"

TODAY = date(2026, 9, 6)
SAMPLES = {
    "terry-bradshaw": ("1948-09-02", "9♦"),
    "franco-harris": ("1950-03-07", "3♠"),
    "pete-rozelle": ("1926-03-01", "9♠"),
    "morten-andersen": ("1960-08-19", "7♣"),
    "george-blanda": ("1927-09-17", "7♣"),
}


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _catalog(**overrides: object) -> dict:
    row = {
        "qid": "Q0HOF1",
        "name": "Terry Fixture Bradshaw",
        "hof_id": "terry-fixture-bradshaw",
        "wikipedia_title": "Terry Fixture Bradshaw",
        "source": "sparql",
    }
    row.update(overrides)
    return row


def _hof(**overrides: object) -> dict:
    row = {
        "name": "Terry Fixture Bradshaw",
        "hof_id": "terry-fixture-bradshaw",
        "hof_url": "https://www.profootballhof.com/players/terry-fixture-bradshaw/",
        "hof_birth_kind": "day",
        "hof_birth_date": "1948-09-02",
        "html": FIXTURE_BIO.read_text(encoding="utf-8"),
        "error": None,
    }
    row.update(overrides)
    return row


def test_hof_date_parser_keeps_day_and_drops_year_only() -> None:
    assert parse_free_date("September 2, 1948") == ("day", "1948-09-02")
    assert parse_free_date("2 September 1948") == ("day", "1948-09-02")
    assert parse_free_date("1948") == ("year_only", None)
    assert parse_free_date("September 1948") == ("year_only", None)
    assert parse_hof_html(FIXTURE_BIO.read_text(encoding="utf-8")) == ("day", "1948-09-02")
    assert parse_hof_html(FIXTURE_YEAR_ONLY.read_text(encoding="utf-8")) == ("year_only", None)
    assert parse_hof_html("") == ("missing", None)
    assert parse_hof_html("Born Born August 19, 1960 in Struer, Denmark.") == ("day", "1960-08-19")


def test_hof_url_and_p6930() -> None:
    assert hof_url("terry-bradshaw") == "https://www.profootballhof.com/players/terry-bradshaw/"
    entity = _load(FIXTURE_ENTITY)
    assert extract_hof_id(entity) == "terry-fixture-bradshaw"
    assert induction_year(entity) == "1989"


def test_sample_birth_cards() -> None:
    assert birth_card_from_iso("1948-09-02") == "9♦"
    assert birth_card_from_iso("1950-03-07") == "3♠"
    assert birth_card_from_iso("1926-03-01") == "9♠"
    assert birth_card_from_iso("1960-08-19") == "7♣"
    assert birth_card_from_iso("1927-09-17") == "7♣"
    assert birth_card_from_iso("1953-12-31") == "Joker"


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        catalog=_catalog(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind="day",
        wiki_iso="1948-09-02",
        hof=_hof(),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1948-09-02"
    assert draft["wikidata_birth_date"] == "1948-09-02"
    assert draft["hof_birth_date"] == "1948-09-02"
    assert draft["dob_crosscheck"] == "match"
    assert draft["induction_year"] == "1989"
    assert birth_card_from_iso(draft["birth_date"]) == "9♦"


def test_classify_keeps_wikidata_day_when_hof_year_only() -> None:
    reason, draft = classify_row(
        catalog=_catalog(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind=None,
        wiki_iso=None,
        hof=_hof(hof_birth_kind="year_only", hof_birth_date=None),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["hof_birth_date"] is None
    assert draft["birth_date"] == "1948-09-02"


def test_classify_drops_year_only_conflict_and_missing() -> None:
    entity = _load(FIXTURE_ENTITY)
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(entity, "P569") is None
    reason, draft = classify_row(
        catalog=_catalog(),
        entity=entity,
        wiki_kind=None,
        wiki_iso=None,
        hof=_hof(),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    missing_reason, missing_draft = classify_row(
        catalog=_catalog(),
        entity=None,
        wiki_kind="day",
        wiki_iso="1948-09-02",
        hof=_hof(),
        today=TODAY,
        blocklist=set(),
    )
    assert missing_reason == "missing_wikidata"
    assert missing_draft is None

    reason, draft = classify_row(
        catalog=_catalog(name="Conflict Fixture", qid="Q0HOF2"),
        entity=_load(FIXTURE_CONFLICT),
        wiki_kind="day",
        wiki_iso="1948-09-02",
        hof=_hof(),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikidata_birth_date"] == "1948-09-03"


def test_classify_drops_hof_conflict() -> None:
    reason, draft = classify_row(
        catalog=_catalog(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind=None,
        wiki_iso=None,
        hof=_hof(hof_birth_date="1948-09-03"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None


def test_classify_d3_and_minor() -> None:
    entity = _load(FIXTURE_ENTITY)
    entity["descriptions"] = {"en": {"value": "American football murderer and former player"}}
    reason, draft = classify_row(
        catalog=_catalog(),
        entity=entity,
        wiki_kind="day",
        wiki_iso="1948-09-02",
        hof=_hof(),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    reason, draft = classify_row(
        catalog=_catalog(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind="day",
        wiki_iso="2010-09-02",
        hof=_hof(hof_birth_date="2010-09-02"),
        today=TODAY,
        blocklist=set(),
    )
    # Wikidata date is still 1948; wiki/hof 2010 is a conflict, not a minor.
    assert reason == "dob_conflict"

    young = _load(FIXTURE_ENTITY)
    young["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["time"] = "+2010-09-02T00:00:00Z"
    reason, draft = classify_row(
        catalog=_catalog(),
        entity=young,
        wiki_kind="day",
        wiki_iso="2010-09-02",
        hof=_hof(hof_birth_date="2010-09-02"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("James Williams", used, qid="Q1", hof_id="james-williams")
    used.add(first)
    second = unique_slug("James Williams", used, qid="Q2", hof_id="james-williams-2")
    assert first == "james-williams"
    assert second != first


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Terry Fixture Bradshaw",
        "slug": "terry-fixture-bradshaw",
        "hof_id": "terry-fixture-bradshaw",
        "hof_url": "https://www.profootballhof.com/players/terry-fixture-bradshaw/",
        "induction_year": "1989",
        "birth_date": "1948-09-02",
        "death_date": None,
        "card": "9♦",
        "source_text": "Synthetic fixture Hall of Fame quarterback. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Terry_Fixture_Bradshaw",
        "wikipedia_title": "Terry Fixture Bradshaw",
        "wikipedia_birth_date": "1948-09-02",
        "hof_birth_date": "1948-09-02",
        "wikidata_birth_date": "1948-09-02",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_nfl_hof([row])


def test_committed_nfl_hof_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("nfl_hof people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_nfl_hof(rows)
    assert rows, "expected at least one kept Hall of Fame inductee"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    sources = [row["source_text"].strip() for row in rows]
    assert len(set(sources)) == len(sources)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["hof_id"]
        assert "profootballhof.com" in row["hof_url"]
        if row["wikipedia_birth_date"]:
            assert row["wikipedia_birth_date"] == row["birth_date"]
        if row["hof_birth_date"]:
            assert row["hof_birth_date"] == row["birth_date"]

    by_slug = {row["slug"]: row for row in rows}
    for slug, (iso, card) in SAMPLES.items():
        if slug not in by_slug:
            continue
        assert by_slug[slug]["birth_date"] == iso
        assert by_slug[slug]["card"] == card

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
