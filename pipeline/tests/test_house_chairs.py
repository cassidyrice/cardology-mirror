"""US House leadership + standing chairs: day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template, parse_infobox_wikitext
from pipeline.house_chairs.catalog import (
    CHAIR_ROWS,
    HOUSE_CHAIRS,
    LEADERSHIP_ROWS,
    OUT_OF_SCOPE_COMMITTEES,
    SITTING_BIOGUIDES,
    SITTING_OFFICE_IDS,
    SITTING_QIDS,
    SITTING_SLUGS,
    STANDING_COMMITTEES,
)
from pipeline.house_chairs.harvest import classify_row, validate_house_chairs
from pipeline.house_chairs.legislators import (
    extract_house_gov_names,
    house_gov_has_name,
    parse_legislators,
    standing_chairs,
)
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.senators.bioguide import classify_birthday

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_INFOBOX = ROOT / "data" / "fixtures" / "house_chairs_infobox.wikitext"
FIXTURE_LEADERSHIP = ROOT / "data" / "fixtures" / "house_chairs_leadership.html"
FIXTURE_COMMITTEES = ROOT / "data" / "fixtures" / "house_chairs_committees.json"
PEOPLE_JSONL = ROOT / "data" / "house_chairs" / "people.jsonl"
PROVENANCE = ROOT / "data" / "house_chairs" / "provenance.json"

SAMPLES = {
    "mike-johnson": "1972-01-30",
    "steve-scalise": "1965-10-06",
    "hakeem-jeffries": "1970-08-04",
    "tom-emmer": "1961-03-03",
    "jim-jordan": "1964-02-17",
}


def _entity(iso: str, *, precision: int = 11, description: str = "American politician") -> dict:
    return {
        "id": "Q0HOU1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Chair"}},
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


def _catalog(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "office_id": "example",
        "office": "Speaker of the House",
        "role_kind": "leadership",
        "sort_order": 1,
        "name": "Ada Fixture Chair",
        "slug": "ada-fixture-chair",
        "qid": "Q0HOU1",
        "bioguide": "A000000",
        "enwiki_title": "Ada Fixture Chair",
        "house_gov_name": "Ada Fixture Chair",
        "party": "Republican",
        "postal": "LA",
        "district": 4,
        "committee_thomas_id": None,
    }
    row.update(overrides)
    return row


def test_catalog_is_thirty_unique_leadership_plus_standing_chairs() -> None:
    assert len(HOUSE_CHAIRS) == 30
    assert len(LEADERSHIP_ROWS) == 10
    assert len(CHAIR_ROWS) == 20
    assert len(set(SITTING_QIDS)) == 30
    assert len(set(SITTING_SLUGS)) == 30
    assert len(set(SITTING_BIOGUIDES)) == 30
    assert len(set(SITTING_OFFICE_IDS)) == 30
    assert len(STANDING_COMMITTEES) == 20
    assert [int(row["sort_order"]) for row in HOUSE_CHAIRS] == list(range(1, 31))
    assert HOUSE_CHAIRS[0]["office_id"] == "speaker"
    assert HOUSE_CHAIRS[0]["name"] == "Mike Johnson"
    assert HOUSE_CHAIRS[1]["name"] == "Steve Scalise"
    assert HOUSE_CHAIRS[2]["name"] == "Tom Emmer"
    assert HOUSE_CHAIRS[5]["name"] == "Hakeem Jeffries"
    judiciary = next(row for row in HOUSE_CHAIRS if row["office_id"] == "judiciary")
    assert judiciary["name"] == "Jim Jordan"
    assert judiciary["role_kind"] == "chair"
    assert "HLIG" not in STANDING_COMMITTEES
    assert "HSZS" not in STANDING_COMMITTEES
    assert "HSQJ" not in STANDING_COMMITTEES
    for thomas_id in ("HLIG", "HSZS", "HSQJ"):
        assert thomas_id in OUT_OF_SCOPE_COMMITTEES
    slugs = {str(row["slug"]) for row in HOUSE_CHAIRS}
    assert "richard-hudson" not in slugs
    assert "suzan-delbene" not in slugs
    assert "blake-moore" not in slugs
    assert "rick-crawford" not in slugs


def test_infobox_parser_reads_day_and_year_only() -> None:
    wikitext = FIXTURE_INFOBOX.read_text(encoding="utf-8")
    chunks = wikitext.split("{{Infobox officeholder")
    first = parse_infobox_wikitext(chunks[1])
    assert first["kind"] == "day"
    assert first["birth_date"] == "1972-01-30"
    second = parse_infobox_wikitext(chunks[2])
    assert second["kind"] == "year_only"
    assert second["birth_date"] is None
    third = parse_infobox_wikitext(chunks[3])
    assert third["kind"] == "day"
    assert third["birth_date"] == "1965-10-06"


def test_year_only_template_is_not_invented() -> None:
    parsed = parse_birth_template("| birth_date = {{birth date and age|1960}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_house_gov_leadership_names() -> None:
    html = FIXTURE_LEADERSHIP.read_text(encoding="utf-8")
    names = extract_house_gov_names(html)
    assert "Mike Johnson" in names
    assert "Steve Scalise" in names
    assert "Hakeem Jeffries" in names
    assert "Joe Neguse" in names
    assert house_gov_has_name(html, "Mike Johnson")
    assert house_gov_has_name(html, "Lisa McClain")
    assert not house_gov_has_name(html, "Richard Hudson")
    assert not house_gov_has_name(html, "Blake Moore")


def test_standing_chairs_skip_select() -> None:
    membership = json.loads(FIXTURE_COMMITTEES.read_text(encoding="utf-8"))
    chairs = standing_chairs(membership)
    assert set(chairs) == {"HSJU", "HSAG"}
    assert chairs["HSJU"]["bioguide"] == "J000289"
    assert "HLIG" not in chairs


def test_bioguide_birthday_classifier() -> None:
    assert classify_birthday("1972-01-30")["kind"] == "day"
    assert classify_birthday("1960-00-00")["kind"] == "year_only"
    assert classify_birthday("1960")["kind"] == "year_only"
    assert classify_birthday(None)["kind"] == "missing"


def test_legislators_parser_keeps_current_house_only() -> None:
    payload = [
        {
            "id": {"bioguide": "J000299", "wikidata": "Q19880665", "wikipedia": "Mike Johnson"},
            "name": {"first": "Mike", "last": "Johnson", "official_full": "Mike Johnson"},
            "bio": {"birthday": "1972-01-30"},
            "terms": [
                {"type": "rep", "state": "LA", "district": 4, "party": "Republican", "end": "2027-01-03"}
            ],
        },
        {
            "id": {"bioguide": "S000148", "wikidata": "Q380900"},
            "name": {"official_full": "Charles E. Schumer"},
            "bio": {"birthday": "1950-11-23"},
            "terms": [{"type": "sen", "state": "NY", "class": 3, "end": "2029-01-03"}],
        },
        {
            "id": {"bioguide": "X000001", "wikidata": "Q0FORMER"},
            "name": {"official_full": "Former Member"},
            "bio": {"birthday": "1950-01-01"},
            "terms": [{"type": "rep", "state": "LA", "district": 4, "end": "2025-01-03"}],
        },
    ]
    rows = parse_legislators(payload, as_of="2026-09-06")
    assert [row["name"] for row in rows] == ["Mike Johnson"]
    assert rows[0]["birth_date"] == "1972-01-30"


def test_classify_keeps_matching_day_precision() -> None:
    listed = {"kind": "day", "birth_date": "1972-01-30", "wikipedia_title": "Mike Johnson"}
    bioguide = {
        "birth_kind": "day",
        "birth_date": "1972-01-30",
        "bioguide_url": "https://bioguide.congress.gov/search/bio/J000299",
        "congress_url": "https://www.congress.gov/member/mike-johnson/J000299",
    }
    reason, draft = classify_row(
        catalog=_catalog(name="Mike Johnson", slug="mike-johnson", qid="Q19880665", bioguide="J000299"),
        listed=listed,
        bioguide=bioguide,
        entity=_entity("1972-01-30"),
        on_house_gov=True,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1972-01-30"
    assert draft["dob_crosscheck"] == "match"
    assert "history.house.gov" in draft["history_house_url"]


def test_classify_drops_year_only_conflict_precision_minor_and_scope() -> None:
    catalog = _catalog()
    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "year_only", "birth_date": None},
        bioguide={"birth_kind": "day", "birth_date": "1960-01-01"},
        entity=_entity("1960-01-01"),
        on_house_gov=True,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1972-01-30"},
        bioguide={"birth_kind": "day", "birth_date": "1972-01-30"},
        entity=_entity("1972-01-31"),
        on_house_gov=True,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_infobox_date"] == "1972-01-30"
    assert draft["wikidata_birth_date"] == "1972-01-31"

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1972-01-30"},
        bioguide={"birth_kind": "day", "birth_date": "1972-01-31"},
        entity=_entity("1972-01-30"),
        on_house_gov=True,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "dob_conflict"

    entity = _entity("1972-01-30")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1972-01-30"},
        bioguide={"birth_kind": "day", "birth_date": "1972-01-30"},
        entity=entity,
        on_house_gov=True,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert parse_day_precision_time(entity, "P569") is None
    assert reason == "wikidata_precision"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "2015-01-01"},
        bioguide={"birth_kind": "day", "birth_date": "2015-01-01"},
        entity=_entity("2015-01-01"),
        on_house_gov=True,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1972-01-30"},
        bioguide={"birth_kind": "day", "birth_date": "1972-01-30"},
        entity=_entity("1972-01-30"),
        on_house_gov=False,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "missing_from_house_gov"

    chair = _catalog(role_kind="chair", office_id="judiciary", office="Chair of Judiciary")
    reason, draft = classify_row(
        catalog=chair,
        listed={"kind": "day", "birth_date": "1964-02-17"},
        bioguide={"birth_kind": "day", "birth_date": "1964-02-17"},
        entity=_entity("1964-02-17"),
        on_house_gov=False,
        is_standing_chair=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "missing_standing_chair"


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1979-12-31") == "Joker"
    assert birth_card_from_iso("1972-01-30") == birth_card_from_iso("1972-01-30")


def test_committed_house_chairs_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("house_chairs people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_house_chairs(rows)
    assert 20 <= len(rows) <= 30
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    assert rows == sorted(rows, key=lambda row: (row["sort_order"], row["name"]))
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["dob_crosscheck"] == "match"
        assert (
            row["wikipedia_infobox_date"]
            == row["wikidata_birth_date"]
            == row["bioguide_birth_date"]
            == row["birth_date"]
        )
        assert "bioguide.congress.gov" in row["bioguide_url"]
        assert "congress.gov/member" in row["congress_url"]
        assert "history.house.gov" in row["history_house_url"]
        assert row["role_kind"] in {"leadership", "chair"}
        if row["role_kind"] == "chair":
            assert row["committee_thomas_id"] in STANDING_COMMITTEES
            assert row["committee_thomas_id"] not in OUT_OF_SCOPE_COMMITTEES

    by_slug = {row["slug"]: row for row in rows}
    for slug, iso in SAMPLES.items():
        assert slug in by_slug, f"sample {slug} dropped — report it, do not invent"
        assert by_slug[slug]["birth_date"] == iso

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["catalog_sitting"] == 30
        assert provenance["catalog_leadership"] == 10
        assert provenance["catalog_standing_chairs"] == 20
        assert provenance["people_count"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["select_committees"] is False
        assert provenance["rules"]["campaign_committees"] is False
