"""Rock Hall harvest: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template
from pipeline.rock_hall.harvest import classify_row, unique_slug, validate_rock_hall
from pipeline.rock_hall.wiki_list import expand_people, parse_performer_acts
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "rock_hall_performers.wikitext"
PEOPLE_JSONL = ROOT / "data" / "rock_hall" / "people.jsonl"
PROVENANCE = ROOT / "data" / "rock_hall" / "provenance.json"

TODAY = date(2026, 9, 6)


def _entity(iso: str, *, precision: int = 11, description: str = "American singer", human: bool = True) -> dict:
    claims: dict = {
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
    }
    if human:
        claims["P31"] = [
            {
                "mainsnak": {
                    "snaktype": "value",
                    "datavalue": {"value": {"id": "Q5"}},
                }
            }
        ]
    else:
        claims["P31"] = [
            {
                "mainsnak": {
                    "snaktype": "value",
                    "datavalue": {"value": {"id": "Q215380"}},
                }
            }
        ]
    return {
        "id": "Q0RH1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Singer"}},
        "claims": claims,
    }


def _person(**overrides: object) -> dict:
    row: dict = {
        "name": "Ada Fixture Singer",
        "enwiki_title": "Ada Fixture Singer",
        "primary_role": "solo",
        "act_kinds": ["solo"],
        "inductions": [
            {
                "year": "1986",
                "act": "Ada Fixture Singer",
                "act_wikipedia_title": "Ada Fixture Singer",
                "category": "Performers",
                "category_id": "performers",
                "role": "solo",
                "rockhall_url": "https://www.rockhall.com/inductees/ada-fixture-singer",
            }
        ],
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_1986_solos_and_expands_everly_brothers() -> None:
    wikitext = FIXTURE_LIST.read_text(encoding="utf-8")
    acts = parse_performer_acts(wikitext)
    names = [row["name"] for row in acts]
    assert "Chuck Berry" in names
    assert "Elvis Presley" in names
    assert "The Everly Brothers" in names
    assert "The Coasters" in names
    everly = next(row for row in acts if row["name"] == "The Everly Brothers")
    assert everly["kind"] == "group"
    assert {member["name"] for member in everly["members"]} == {"Don Everly", "Phil Everly"}
    assert "everly-brothers" in everly["rockhall_url"]
    berry = next(row for row in acts if row["name"] == "Chuck Berry")
    assert berry["kind"] == "solo"
    assert berry["members"] == []
    people = expand_people(acts)
    people_names = {row["name"] for row in people}
    assert "Chuck Berry" in people_names
    assert "Don Everly" in people_names
    assert "Phil Everly" in people_names
    assert "The Everly Brothers" not in people_names
    assert len(acts) == 25


def test_year_only_infobox_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1960}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1944-10-15", "wikipedia_title": "Ada Fixture Singer"},
        entity=_entity("1944-10-15"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1944-10-15"
    assert draft["dob_crosscheck"] == "match"
    assert draft["primary_role"] == "solo"
    assert draft["inductions"][0]["category_id"] == "performers"


def test_classify_drops_year_only_conflict_precision_and_minor() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "year_only", "birth_date": None},
        entity=_entity("1960-01-01"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1976-10-06"},
        entity=_entity("1976-10-08"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_infobox_date"] == "1976-10-06"
    assert draft["wikidata_birth_date"] == "1976-10-08"

    entity = _entity("1976-10-06")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1976-10-06"},
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert parse_day_precision_time(entity, "P569") is None
    assert reason == "wikidata_precision"
    assert draft is None

    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "2015-01-01"},
        entity=_entity("2015-01-01"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_classify_d3_description() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1944-10-15", "wikipedia_title": "Ada Fixture Singer"},
        entity=_entity("1944-10-15", description="former dictator of a state"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None


def test_classify_drops_band_without_listed_members() -> None:
    reason, draft = classify_row(
        person=_person(primary_role="solo", act_kinds=["group"]),
        listed={"kind": "day", "birth_date": "1960-01-01"},
        entity=_entity("1960-01-01", human=False),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "band_no_listed_members"
    assert draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1943-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Example", used, title="Ada Example")
    used.add(first)
    second = unique_slug("Ada Example", used, title="Ada Example (musician)")
    assert first == "ada-example"
    assert second != first


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Singer",
        "slug": "ada-fixture-singer",
        "birth_date": "1944-10-15",
        "death_date": None,
        "card": "Q♣",
        "source_text": "Synthetic fixture singer. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Singer",
        "wikipedia_title": "Ada Fixture Singer",
        "rockhall_url": "https://www.rockhall.com/inductees/ada-fixture-singer",
        "wikipedia_list_url": "https://en.wikipedia.org/wiki/List_of_Rock_and_Roll_Hall_of_Fame_inductees",
        "primary_role": "solo",
        "inductions": [
            {
                "year": "1986",
                "act": "Ada Fixture Singer",
                "act_wikipedia_title": "Ada Fixture Singer",
                "category": "Performers",
                "category_id": "performers",
                "role": "solo",
                "rockhall_url": "https://www.rockhall.com/inductees/ada-fixture-singer",
            }
        ],
        "wikipedia_infobox_date": "1944-10-15",
        "wikidata_birth_date": "1944-10-15",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_rock_hall([row])


def test_committed_rock_hall_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("rock_hall people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_rock_hall(rows)
    assert rows, "expected at least one kept Rock Hall inductee"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "rockhall.com" in row["rockhall_url"]
        assert row["inductions"]
        assert all(item["category_id"] == "performers" for item in row["inductions"])
        assert row["primary_role"] in {"solo", "member"}

    by_slug = {row["slug"]: row for row in rows}
    assert "chuck-berry" in by_slug
    assert by_slug["chuck-berry"]["birth_date"] == "1926-10-18"
    assert by_slug["chuck-berry"]["card"] == birth_card_from_iso("1926-10-18")
    assert "elvis-presley" in by_slug
    assert by_slug["elvis-presley"]["birth_date"] == "1935-01-08"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["expand_only_listed_inducted_members"] is True
