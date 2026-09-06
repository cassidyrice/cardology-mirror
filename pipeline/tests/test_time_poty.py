"""TIME Person of the Year harvest: people only, day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.pulitzer_fiction.bios import parse_wikipedia_birth_field
from pipeline.time_poty.harvest import classify_row, unique_slug, validate_time_poty
from pipeline.time_poty.wiki_list import flatten_people, parse_choice_rows

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "data" / "fixtures" / "time_poty_list.wikitext"
PEOPLE_JSONL = ROOT / "data" / "time_poty" / "people.jsonl"
PROVENANCE = ROOT / "data" / "time_poty" / "provenance.json"

TODAY = date(2026, 9, 6)


def _entity(iso: str, *, precision: int = 11, description: str = "American aviator", human: bool = True) -> dict:
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
                    "datavalue": {"value": {"id": "Q35120"}},
                }
            }
        ]
    return {
        "id": "Q0POTY1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Ada Fixture Honoree"}},
        "claims": claims,
    }


def _person(**overrides: object) -> dict:
    row: dict = {
        "name": "Ada Fixture Honoree",
        "enwiki_title": "Ada Fixture Honoree",
        "honors": [
            {
                "year": "1999",
                "choice_label": "Ada Fixture Honoree",
                "shared": False,
                "wikipedia_list_url": "https://en.wikipedia.org/wiki/Time_Person_of_the_Year",
                "time_context_url": "https://time.com/vault/",
            }
        ],
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_named_humans_splits_duals_and_drops_concepts() -> None:
    rows = parse_choice_rows(FIXTURE.read_text(encoding="utf-8"))
    people, concepts = flatten_people(rows)
    names = {person["name"] for person in people}
    assert "Charles Lindbergh" in names
    assert "Jeff Bezos" in names
    assert "Barack Obama" in names
    assert "Angela Merkel" in names
    assert "Taylor Swift" in names
    assert "Elizabeth II" in names
    assert "Chiang Kai-shek" in names
    assert "Soong Mei-ling" in names
    assert "Joe Biden" in names
    assert "Kamala Harris" in names
    assert "Frank Borman" in names
    assert "Jim Lovell" in names
    assert "William Anders" in names
    assert "Nelson Mandela" in names
    assert "Yasser Arafat" in names
    assert "Bono" in names
    assert "Bill Gates" in names
    assert "Melinda Gates" in names
    assert "Steve Jobs" not in names
    assert "Ashley Judd" not in names
    assert "You" not in names
    concept_years = {item["year"] for item in concepts}
    assert concept_years == {"1950", "1956", "1982", "2006", "2017"}

    soong = next(person for person in people if person["name"] == "Soong Mei-ling")
    assert soong["honors"][0]["year"] == "1937"
    assert soong["honors"][0]["shared"] is True
    harris = next(person for person in people if person["name"] == "Kamala Harris")
    assert harris["honors"][0]["shared"] is True
    swift = next(person for person in people if person["name"] == "Taylor Swift")
    assert [honor["year"] for honor in swift["honors"]] == ["2023"]


def test_year_only_infobox_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1964}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_wikipedia_birth_field_parses_plain_day() -> None:
    plain = parse_wikipedia_birth_field(
        "{{Infobox person\n| birth_date = February 4, 1902\n| birth_place = Detroit\n}}"
    )
    assert plain["kind"] == "day"
    assert plain["birth_date"] == "1902-02-04"


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1964-01-12", "wikipedia_title": "Ada Fixture Honoree"},
        entity=_entity("1964-01-12"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1964-01-12"
    assert draft["dob_crosscheck"] == "match"
    assert draft["time_context_url"] == "https://time.com/vault/"
    assert draft["honors"][0]["year"] == "1999"


def test_classify_drops_year_only_conflict_precision_and_minor() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "year_only", "birth_date": None},
        entity=_entity("1964-01-12"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1964-01-12"},
        entity=_entity("1964-01-13"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_infobox_date"] == "1964-01-12"
    assert draft["wikidata_birth_date"] == "1964-01-13"

    entity = _entity("1964-01-12")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1964-01-12"},
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
        listed={"kind": "day", "birth_date": "1889-04-20", "wikipedia_title": "Ada Fixture Honoree"},
        entity=_entity("1889-04-20", description="Austrian-born German dictator"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None


def test_classify_drops_non_human() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1964-01-12"},
        entity=_entity("1964-01-12", human=False),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "not_a_person"
    assert draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1968-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Example", used, title="Ada Example")
    used.add(first)
    second = unique_slug("Ada Example", used, title="Ada Example (honoree)")
    assert first == "ada-example"
    assert second != first


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Honoree",
        "slug": "ada-fixture-honoree",
        "birth_date": "1964-01-12",
        "death_date": None,
        "card": "K♠",
        "source_text": "Synthetic fixture honoree. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Honoree",
        "wikipedia_title": "Ada Fixture Honoree",
        "wikipedia_list_url": "https://en.wikipedia.org/wiki/Time_Person_of_the_Year",
        "time_context_url": "https://time.com/vault/",
        "honors": [
            {
                "year": "1999",
                "choice_label": "Ada Fixture Honoree",
                "shared": False,
                "wikipedia_list_url": "https://en.wikipedia.org/wiki/Time_Person_of_the_Year",
                "time_context_url": "https://time.com/vault/",
            }
        ],
        "wikipedia_infobox_date": "1964-01-12",
        "wikidata_birth_date": "1964-01-12",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_time_poty([row])


def test_committed_time_poty_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("time_poty people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_time_poty(rows)
    assert rows, "expected at least one kept TIME Person of the Year"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["time_context_url"] == "https://time.com/vault/"
        assert row["honors"]

    by_slug = {row["slug"]: row for row in rows}
    samples = {
        "charles-lindbergh": "1902-02-04",
        "jeff-bezos": "1964-01-12",
        "barack-obama": "1961-08-04",
        "angela-merkel": "1954-07-17",
        "taylor-swift": "1989-12-13",
    }
    for slug, iso in samples.items():
        assert slug in by_slug, f"missing sample {slug}"
        assert by_slug[slug]["birth_date"] == iso
        assert by_slug[slug]["card"] == birth_card_from_iso(iso)

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["person_scope_only"] is True
        assert "not a date source" in provenance["rules"]["time_vault"].lower()
