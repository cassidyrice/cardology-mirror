"""US presidents harvest: extractors, Wikipedia month/day parse, no invented DOBs."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.presidents.extract import extract_president, parse_day_precision_time
from pipeline.presidents.harvest import validate_presidents
from pipeline.presidents.home_state import match_home_state_row, parse_home_state_wikitext
from pipeline.presidents.qids import FALLBACK_ENWIKI_TITLES, FALLBACK_QIDS

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "president_entity.json"
FIXTURE_WIKITEXT = ROOT / "data" / "fixtures" / "president_home_state.wikitext"
PEOPLE_JSONL = ROOT / "data" / "presidents" / "people.jsonl"
PROVENANCE = ROOT / "data" / "presidents" / "provenance.json"


def test_fallback_identifier_counts_match_45_people() -> None:
    assert len(FALLBACK_QIDS) == 45
    assert len(set(FALLBACK_QIDS)) == 45
    assert len(FALLBACK_ENWIKI_TITLES) == 45
    assert len(set(FALLBACK_ENWIKI_TITLES)) == 45


def test_extract_president_requires_day_precision() -> None:
    entity = json.loads(FIXTURE_ENTITY.read_text(encoding="utf-8"))
    row = extract_president(entity)
    assert row is not None
    assert row["birth_date"] == "1732-02-22"
    assert row["death_date"] == "1799-12-14"
    assert row["terms"] == [
        {"ordinal": "1", "start": "1789-04-30", "end": "1797-03-04"}
    ]

    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(entity, "P569") is None
    assert extract_president(entity) is None


def test_extract_prefers_gregorian_day_precision_over_preferred_julian() -> None:
    entity = json.loads(FIXTURE_ENTITY.read_text(encoding="utf-8"))
    entity["claims"]["P569"] = [
        {
            "rank": "preferred",
            "mainsnak": {
                "snaktype": "value",
                "datavalue": {
                    "value": {
                        "time": "+1735-10-19T00:00:00Z",
                        "precision": 11,
                        "calendarmodel": "http://www.wikidata.org/entity/Q1985786",
                    }
                },
            },
        },
        {
            "rank": "normal",
            "mainsnak": {
                "snaktype": "value",
                "datavalue": {
                    "value": {
                        "time": "+1735-10-30T00:00:00Z",
                        "precision": 11,
                        "calendarmodel": "http://www.wikidata.org/entity/Q1985727",
                    }
                },
            },
        },
    ]
    assert parse_day_precision_time(entity, "P569") == ("1735-10-30", 11)


def test_extract_keeps_every_non_deprecated_presidency_term() -> None:
    entity = json.loads(FIXTURE_ENTITY.read_text(encoding="utf-8"))
    first = entity["claims"]["P39"][0]
    second = json.loads(json.dumps(first))
    second["rank"] = "preferred"
    second["qualifiers"]["P1545"][0]["datavalue"]["value"] = "47"
    second["qualifiers"]["P580"][0]["datavalue"]["value"]["time"] = "+2025-01-20T00:00:00Z"
    second["qualifiers"]["P582"] = []
    entity["claims"]["P39"] = [first, second]
    row = extract_president(entity)
    assert row is not None
    assert [term["ordinal"] for term in row["terms"]] == ["1", "47"]


def test_home_state_parser_reads_dts_and_sortname() -> None:
    rows = parse_home_state_wikitext(FIXTURE_WIKITEXT.read_text(encoding="utf-8"))
    by_name = {row["name"]: row for row in rows}
    assert by_name["George Washington"]["month_day"] == "02-22"
    assert by_name["Thomas Jefferson"]["month_day"] == "04-13"
    assert by_name["John Quincy Adams"]["month_day"] == "07-11"
    assert by_name["John Adams"]["month_day"] == "10-30"
    assert len(rows) == 5

    used: set[str] = set()
    jq = match_home_state_row(
        {"name": "John Quincy Adams", "enwiki_title": "John Quincy Adams", "wikidata_label": "John Quincy Adams"},
        rows,
        used,
    )
    assert jq is not None and jq["name"] == "John Quincy Adams"
    used.add(jq["name"])
    ja = match_home_state_row(
        {"name": "John Adams", "enwiki_title": "John Adams", "wikidata_label": "John Adams"},
        rows,
        used,
    )
    assert ja is not None and ja["name"] == "John Adams"


def test_committed_presidents_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("presidents people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_presidents(rows)
    assert len(rows) == 45
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == 45
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        if row["dob_crosscheck"] == "match":
            assert row["wikipedia_month_day"] == row["birth_date"][5:]

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["john-adams"]["birth_date"] == "1735-10-30"
    assert by_slug["thomas-jefferson"]["birth_date"] == "1743-04-13"
    assert [term["ordinal"] for term in by_slug["donald-trump"]["terms"]] == ["45", "47"]
    assert [term["ordinal"] for term in by_slug["grover-cleveland"]["terms"]] == ["22", "24"]

    from pipeline.presidents.harvest import _sort_key  # noqa: PLC0415

    assert rows == sorted(rows, key=_sort_key)

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == 45
        assert "sparql_fallback_used" in provenance
