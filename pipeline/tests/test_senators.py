"""Current US senators harvest: list parse, day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.senators.bioguide import classify_birthday, parse_legislators
from pipeline.senators.catalog import (
    SITTING_BIOGUIDES,
    SITTING_QIDS,
    SITTING_SENATORS,
    SITTING_SLUGS,
    SITTING_STATES,
)
from pipeline.senators.harvest import classify_row, validate_senators
from pipeline.senators.wiki_list import match_list_row, parse_birth_template, parse_senators_wikitext
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "senator_list.wikitext"
PEOPLE_JSONL = ROOT / "data" / "senators" / "people.jsonl"
PROVENANCE = ROOT / "data" / "senators" / "provenance.json"

BRITT_SLUG = "katie-boyd-britt"


def _entity(iso: str, *, precision: int = 11, description: str = "American politician") -> dict:
    return {
        "id": "Q0SEN1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Senator"}},
        "claims": {
            "P569": [
                {
                    "rank": "normal",
                    "mainsnak": {
                        "snaktype": "value",
                        "datavalue": {
                            "value": {
                                "time": f"+{iso}T00:00:00Z",
                                "precision": precision,
                                "calendarmodel": "http://www.wikidata.org/entity/Q1985727",
                            }
                        },
                    },
                }
            ]
        },
    }


def _catalog(**overrides: str) -> dict[str, str]:
    row = {
        "state": "Alabama",
        "state_slug": "alabama",
        "postal": "AL",
        "name": "Tommy Tuberville",
        "last": "Tuberville",
        "slug": "tommy-tuberville",
        "qid": "Q7819948",
        "bioguide": "T000278",
        "enwiki_title": "Tommy Tuberville",
        "senate_class": "2",
        "party": "Republican",
    }
    row.update(overrides)
    return row


def test_catalog_is_one_hundred_seats_fifty_states() -> None:
    assert len(SITTING_SENATORS) == 100
    assert len(set(SITTING_QIDS)) == 100
    assert len(set(SITTING_SLUGS)) == 100
    assert len(set(SITTING_BIOGUIDES)) == 100
    assert len(SITTING_STATES) == 50
    assert "District of Columbia" not in SITTING_STATES
    assert "Puerto Rico" not in SITTING_STATES
    by_state = {state: 0 for state in SITTING_STATES}
    for row in SITTING_SENATORS:
        by_state[row["state"]] += 1
    assert set(by_state.values()) == {2}
    names = [(row["state"], row["name"]) for row in SITTING_SENATORS]
    assert names == sorted(names)


def test_list_parser_reads_sortname_named_months_and_year_only() -> None:
    rows = parse_senators_wikitext(FIXTURE_LIST.read_text(encoding="utf-8"))
    by_name = {row["name"]: row for row in rows}
    assert by_name["Tommy Tuberville"]["birth_date"] == "1954-09-18"
    assert by_name["Tommy Tuberville"]["birth_kind"] == "day"
    assert by_name["Katie Britt"]["birth_date"] == "1982-02-02"
    assert by_name["Dan Sullivan"]["enwiki_title"] == "Dan Sullivan (U.S. senator)"
    assert by_name["Jon Ossoff"]["birth_date"] == "1987-02-16"
    assert by_name["Raphael Warnock"]["birth_date"] == "1969-07-23"
    assert by_name["Year Only"]["birth_kind"] == "year_only"
    assert by_name["Year Only"]["birth_date"] is None
    assert by_name["Pat Example"]["birth_date"] == "1976-10-06"
    assert len(rows) == 8

    used = match_list_row(
        _catalog(state="Alaska", name="Dan Sullivan", last="Sullivan", enwiki_title="Dan Sullivan (U.S. senator)"),
        rows,
    )
    assert used is not None and used["name"] == "Dan Sullivan"


def test_year_only_and_named_month_templates() -> None:
    named = parse_birth_template("{{birth date and age|1987|February|16}}")
    assert named["kind"] == "day"
    assert named["birth_date"] == "1987-02-16"
    year_only = parse_birth_template("{{birth date and age|1960}}")
    assert year_only["kind"] == "year_only"
    assert year_only["birth_date"] is None


def test_bioguide_birthday_classifier() -> None:
    assert classify_birthday("1954-09-18")["kind"] == "day"
    assert classify_birthday("1960-00-00")["kind"] == "year_only"
    assert classify_birthday("1960")["kind"] == "year_only"
    assert classify_birthday(None)["kind"] == "missing"


def test_legislators_parser_keeps_current_senate_only() -> None:
    payload = [
        {
            "id": {"bioguide": "T000278", "wikidata": "Q7819948", "wikipedia": "Tommy Tuberville"},
            "name": {"first": "Tommy", "last": "Tuberville", "official_full": "Tommy Tuberville"},
            "bio": {"birthday": "1954-09-18"},
            "terms": [
                {"type": "sen", "state": "AL", "class": 2, "party": "Republican", "end": "2027-01-03"}
            ],
        },
        {
            "id": {"bioguide": "H000001", "wikidata": "Q0HOUSE"},
            "name": {"official_full": "House Member"},
            "bio": {"birthday": "1960-01-01"},
            "terms": [{"type": "rep", "state": "AL", "end": "2027-01-03"}],
        },
        {
            "id": {"bioguide": "X000001", "wikidata": "Q0FORMER"},
            "name": {"official_full": "Former Senator"},
            "bio": {"birthday": "1950-01-01"},
            "terms": [{"type": "sen", "state": "AL", "class": 2, "end": "2025-01-03"}],
        },
    ]
    rows = parse_legislators(payload, as_of="2026-09-06")
    assert [row["name"] for row in rows] == ["Tommy Tuberville"]
    assert rows[0]["birth_date"] == "1954-09-18"


def test_classify_keeps_matching_day_precision() -> None:
    listed = {
        "state": "Alabama",
        "name": "Tommy Tuberville",
        "birth_kind": "day",
        "birth_date": "1954-09-18",
    }
    bioguide = {
        "birth_kind": "day",
        "birth_date": "1954-09-18",
        "bioguide_url": "https://bioguide.congress.gov/search/bio/T000278",
        "congress_url": "https://www.congress.gov/member/tommy-tuberville/T000278",
    }
    reason, draft = classify_row(
        catalog=_catalog(),
        listed=listed,
        bioguide=bioguide,
        entity=_entity("1954-09-18"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1954-09-18"
    assert draft["dob_crosscheck"] == "match"


def test_classify_drops_year_only_conflict_precision_and_minor() -> None:
    catalog = _catalog(state="Example", state_slug="example", postal="EX", name="Pat Example", slug="pat-example")
    year_only = {"state": "Example", "birth_kind": "year_only", "birth_date": None}
    reason, draft = classify_row(
        catalog=catalog,
        listed=year_only,
        bioguide={"birth_kind": "day", "birth_date": "1960-01-01"},
        entity=_entity("1960-01-01"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"state": "Example", "birth_kind": "day", "birth_date": "1982-02-02"},
        bioguide={"birth_kind": "day", "birth_date": "1982-02-02"},
        entity=_entity("1982-02-03"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_list_date"] == "1982-02-02"
    assert draft["wikidata_birth_date"] == "1982-02-03"

    reason, draft = classify_row(
        catalog=catalog,
        listed={"state": "Example", "birth_kind": "day", "birth_date": "1982-02-02"},
        bioguide={"birth_kind": "day", "birth_date": "1982-02-03"},
        entity=_entity("1982-02-02"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "dob_conflict"

    entity = _entity("1976-10-06")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        catalog=catalog,
        listed={"state": "Example", "birth_kind": "day", "birth_date": "1976-10-06"},
        bioguide={"birth_kind": "day", "birth_date": "1976-10-06"},
        entity=entity,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert parse_day_precision_time(entity, "P569") is None
    assert reason == "wikidata_precision"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"state": "Example", "birth_kind": "day", "birth_date": "2015-01-01"},
        bioguide={"birth_kind": "day", "birth_date": "2015-01-01"},
        entity=_entity("2015-01-01"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1979-12-31") == "Joker"


def test_committed_senators_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("senators people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_senators(rows)
    assert len(rows) == 99
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == 99
    assert BRITT_SLUG not in slugs
    assert rows == sorted(rows, key=lambda row: (row["state"], row["name"]))
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["dob_crosscheck"] == "match"
        assert (
            row["wikipedia_list_date"]
            == row["wikidata_birth_date"]
            == row["bioguide_birth_date"]
            == row["birth_date"]
        )
        assert "bioguide.congress.gov" in row["bioguide_url"]
        assert "congress.gov/member" in row["congress_url"]

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["tommy-tuberville"]["birth_date"] == "1954-09-18"
    assert by_slug["lisa-murkowski"]["birth_date"] == "1957-05-22"
    assert by_slug["jon-ossoff"]["birth_date"] == "1987-02-16"
    assert by_slug["josh-hawley"]["birth_date"] == "1979-12-31"
    assert by_slug["josh-hawley"]["card"] == "Joker"
    assert "District of Columbia" not in {row["state"] for row in rows}

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == 99
        assert provenance["catalog_sitting"] == 100
        assert provenance["excluded"] >= 1
        reasons = {item["reason"] for item in provenance["exclusions"]}
        assert "dob_conflict" in reasons
        britt = next(item for item in provenance["exclusions"] if item.get("slug") == BRITT_SLUG)
        assert britt["reason"] == "dob_conflict"
        assert britt["wikipedia_list_date"] == "1982-02-02"
        assert britt.get("bioguide_birth_date") == "1982-02-02"
        assert britt.get("wikidata_birth_date") == "1982-02-03"
