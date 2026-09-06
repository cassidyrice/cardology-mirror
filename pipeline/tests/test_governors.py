"""Current US governors harvest: list parse, day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.governors.catalog import SITTING_GOVERNORS, SITTING_QIDS, SITTING_SLUGS, SITTING_STATES
from pipeline.governors.harvest import classify_row, validate_governors
from pipeline.governors.wiki_list import parse_birth_template, parse_governors_wikitext
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "governor_list.wikitext"
PEOPLE_JSONL = ROOT / "data" / "governors" / "people.jsonl"
PROVENANCE = ROOT / "data" / "governors" / "provenance.json"

ARMSTRONG_SLUG = "kelly-armstrong"


def _entity(iso: str, *, precision: int = 11, description: str = "American politician") -> dict:
    return {
        "id": "Q0GOV1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Governor"}},
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


def test_catalog_is_fifty_states_no_dc() -> None:
    assert len(SITTING_GOVERNORS) == 50
    assert len(set(SITTING_QIDS)) == 50
    assert len(set(SITTING_SLUGS)) == 50
    assert len(set(SITTING_STATES)) == 50
    assert "District of Columbia" not in SITTING_STATES
    assert "Puerto Rico" not in SITTING_STATES
    assert [row["state"] for row in SITTING_GOVERNORS] == sorted(SITTING_STATES)


def test_list_parser_reads_sortname_wikilink_and_birth_templates() -> None:
    rows = parse_governors_wikitext(FIXTURE_LIST.read_text(encoding="utf-8"))
    by_state = {row["state"]: row for row in rows}
    assert by_state["Alabama"]["name"] == "Kay Ivey"
    assert by_state["Alabama"]["birth_date"] == "1944-10-15"
    assert by_state["Alabama"]["birth_kind"] == "day"
    assert by_state["Alabama"]["nga_url"] == "https://www.nga.org/governors/alabama/"
    assert by_state["Louisiana"]["name"] == "Jeff Landry"
    assert by_state["Louisiana"]["birth_date"] == "1970-12-23"
    assert by_state["Nebraska"]["birth_date"] == "1955-12-31"
    assert by_state["North Dakota"]["birth_date"] == "1976-10-06"
    assert by_state["Example"]["birth_kind"] == "year_only"
    assert by_state["Example"]["birth_date"] is None
    assert len(rows) == 5


def test_year_only_template_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1960}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_classify_keeps_matching_day_precision() -> None:
    catalog = {
        "state": "Alabama",
        "state_slug": "alabama",
        "postal": "AL",
        "name": "Kay Ivey",
        "slug": "kay-ivey",
        "qid": "Q6380211",
        "enwiki_title": "Kay Ivey",
    }
    listed = {
        "state": "Alabama",
        "name": "Kay Ivey",
        "birth_kind": "day",
        "birth_date": "1944-10-15",
        "nga_url": "https://www.nga.org/governors/alabama/",
    }
    reason, draft = classify_row(
        catalog=catalog,
        listed=listed,
        entity=_entity("1944-10-15"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1944-10-15"
    assert draft["dob_crosscheck"] == "match"


def test_classify_drops_year_only_conflict_precision_and_minor() -> None:
    catalog = {
        "state": "Example",
        "state_slug": "example",
        "postal": "EX",
        "name": "Pat Example",
        "slug": "pat-example",
        "qid": "Q0GOV1",
        "enwiki_title": "Pat Example",
    }
    year_only = {"state": "Example", "birth_kind": "year_only", "birth_date": None}
    reason, draft = classify_row(
        catalog=catalog,
        listed=year_only,
        entity=_entity("1960-01-01"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    conflict = {"state": "Example", "birth_kind": "day", "birth_date": "1976-10-06"}
    reason, draft = classify_row(
        catalog=catalog,
        listed=conflict,
        entity=_entity("1976-10-08"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_list_date"] == "1976-10-06"
    assert draft["wikidata_birth_date"] == "1976-10-08"

    entity = _entity("1976-10-06")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        catalog=catalog,
        listed={"state": "Example", "birth_kind": "day", "birth_date": "1976-10-06"},
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
        entity=_entity("2015-01-01"),
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1955-12-31") == "Joker"


def test_committed_governors_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("governors people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_governors(rows)
    assert len(rows) == 49
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == 49
    assert ARMSTRONG_SLUG not in slugs
    assert rows == sorted(rows, key=lambda row: (row["state"], row["name"]))
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["dob_crosscheck"] == "match"
        assert row["wikipedia_list_date"] == row["wikidata_birth_date"] == row["birth_date"]

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["gavin-newsom"]["birth_date"] == "1967-10-10"
    assert by_slug["gavin-newsom"]["card"] == birth_card_from_iso("1967-10-10")
    assert by_slug["jim-pillen"]["birth_date"] == "1955-12-31"
    assert by_slug["jim-pillen"]["card"] == "Joker"
    assert by_slug["katie-hobbs"]["state"] == "Arizona"
    assert "District of Columbia" not in {row["state"] for row in rows}

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == 49
        assert provenance["catalog_sitting"] == 50
        assert provenance["excluded"] >= 1
        reasons = {item["reason"] for item in provenance["exclusions"]}
        assert "dob_conflict" in reasons
        armstrong = next(item for item in provenance["exclusions"] if item.get("slug") == ARMSTRONG_SLUG)
        assert armstrong["reason"] == "dob_conflict"
        assert armstrong["wikipedia_list_date"] == "1976-10-06"
        assert armstrong.get("wikidata_birth_date") == "1976-10-08"
