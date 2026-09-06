"""Kennedy Center Honors harvest: day-precision only, person-scope, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template
from pipeline.kennedy_center_honors.bios import parse_kc_html, parse_wikipedia_birth_field
from pipeline.kennedy_center_honors.harvest import classify_row, unique_slug, validate_kennedy_center_honors
from pipeline.kennedy_center_honors.wiki_list import expand_people, parse_recipient_acts
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "kennedy_center_honors_list.wikitext"
BIO_DAY = ROOT / "data" / "fixtures" / "kennedy_center_bio_day.html"
BIO_YEAR = ROOT / "data" / "fixtures" / "kennedy_center_bio_year_only.html"
PEOPLE_JSONL = ROOT / "data" / "kennedy_center_honors" / "people.jsonl"
PROVENANCE = ROOT / "data" / "kennedy_center_honors" / "provenance.json"

TODAY = date(2026, 9, 6)


def _entity(
    iso: str,
    *,
    precision: int = 11,
    description: str = "American singer",
    human: bool = True,
    qid: str = "Q0KCH1",
) -> dict:
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
                    "datavalue": {"value": {"id": "Q24354"}},
                }
            }
        ]
    return {
        "id": qid,
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Honoree"}},
        "claims": claims,
    }


def _person(**overrides: object) -> dict:
    row: dict = {
        "name": "Ada Fixture Honoree",
        "enwiki_title": "Ada Fixture Honoree",
        "primary_role": "solo",
        "act_kinds": ["solo"],
        "honors": [
            {
                "year": "2011",
                "act": "Ada Fixture Honoree",
                "act_wikipedia_title": "Ada Fixture Honoree",
                "role": "solo",
                "kennedy_center_url": "https://www.kennedy-center.org/whats-on/honors/",
            }
        ],
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_solos_expands_groups_and_drops_institution_and_rescinded() -> None:
    wikitext = FIXTURE_LIST.read_text(encoding="utf-8")
    acts = parse_recipient_acts(wikitext)
    names = [row["name"] for row in acts]
    assert "Neil Diamond" in names
    assert "Tony Bennett" in names
    assert "Paul McCartney" in names
    assert "Stevie Wonder" in names
    assert "Sting" in names
    assert "The Who" in names
    assert "Earth, Wind & Fire" in names
    assert "Sesame Street" in names
    assert "Grateful Dead" in names
    assert "Apollo Theater" in names
    assert "Bill Cosby" in names
    assert "Alan Jay Lerner" in names
    assert "Frederick Loewe" in names

    who = next(row for row in acts if row["name"] == "The Who")
    assert who["kind"] == "group"
    assert {member["name"] for member in who["members"]} == {"Pete Townshend", "Roger Daltrey"}

    apollo = next(row for row in acts if row["name"] == "Apollo Theater")
    assert apollo["kind"] == "institution"
    assert apollo["members"] == []

    cosby = next(row for row in acts if row["name"] == "Bill Cosby")
    assert cosby["kind"] == "rescinded"
    assert cosby["members"] == []

    sting = next(row for row in acts if row["name"] == "Sting")
    assert sting["kind"] == "solo"
    assert sting["enwiki_title"] == "Sting (musician)"

    people, dropped = expand_people(acts)
    people_names = {row["name"] for row in people}
    assert "Neil Diamond" in people_names
    assert "Pete Townshend" in people_names
    assert "Roger Daltrey" in people_names
    assert "Philip Bailey" in people_names
    assert "Joan Ganz Cooney" in people_names
    assert "Mickey Hart" in people_names
    assert "The Who" not in people_names
    assert "Earth, Wind & Fire" not in people_names
    assert "Sesame Street" not in people_names
    assert "Grateful Dead" not in people_names
    assert "Apollo Theater" not in people_names
    assert "Bill Cosby" not in people_names
    assert {item["reason"] for item in dropped} >= {"institution", "rescinded"}


def test_year_only_infobox_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1941}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_wikipedia_birth_field_parses_text_template() -> None:
    text_tmpl = parse_wikipedia_birth_field(
        "{{Infobox person\n| birth_date = {{birth date text|January 24, 1941}}\n| occupation = Singer\n}}"
    )
    assert text_tmpl["kind"] == "day"
    assert text_tmpl["birth_date"] == "1941-01-24"


def test_kennedy_center_bio_parses_day_and_year_only() -> None:
    kind, iso = parse_kc_html(BIO_DAY.read_text(encoding="utf-8"))
    assert kind == "day"
    assert iso == "1941-01-24"
    year_kind, year_iso = parse_kc_html(BIO_YEAR.read_text(encoding="utf-8"))
    assert year_kind == "year_only"
    assert year_iso is None


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1941-01-24", "wikipedia_title": "Ada Fixture Honoree"},
        entity=_entity("1941-01-24"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1941-01-24"
    assert draft["dob_crosscheck"] == "match"
    assert draft["primary_role"] == "solo"
    assert draft["kennedy_center_crosscheck"] == "not_published"


def test_classify_drops_year_only_conflict_precision_minor_and_institution() -> None:
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

    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1941-01-24"},
        entity=_entity("1941-01-24", human=False),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "institution"
    assert draft is None


def test_classify_d3_description() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1941-01-24", "wikipedia_title": "Ada Fixture Honoree"},
        entity=_entity("1941-01-24", description="former dictator of a state"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None


def test_classify_kennedy_center_bio_conflict() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1941-01-24", "wikipedia_title": "Ada Fixture Honoree"},
        entity=_entity("1941-01-24"),
        today=TODAY,
        blocklist=set(),
        kennedy_center={"kind": "day", "birth_date": "1941-01-25"},
    )
    assert reason == "kennedy_center_conflict"
    assert draft is not None
    assert draft["kennedy_center_birth_date"] == "1941-01-25"


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
        "name": "Ada Fixture Honoree",
        "slug": "ada-fixture-honoree",
        "birth_date": "1941-01-24",
        "death_date": None,
        "card": "8♠",
        "source_text": "Synthetic fixture honoree. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Honoree",
        "wikipedia_title": "Ada Fixture Honoree",
        "kennedy_center_url": "https://www.kennedy-center.org/whats-on/honors/",
        "wikipedia_list_url": "https://en.wikipedia.org/wiki/Kennedy_Center_Honors",
        "primary_role": "solo",
        "honors": [
            {
                "year": "2011",
                "act": "Ada Fixture Honoree",
                "act_wikipedia_title": "Ada Fixture Honoree",
                "role": "solo",
                "kennedy_center_url": "https://www.kennedy-center.org/whats-on/honors/",
            }
        ],
        "wikipedia_infobox_date": "1941-01-24",
        "wikidata_birth_date": "1941-01-24",
        "dob_crosscheck": "mismatch",
        "kennedy_center_birth_date": None,
        "kennedy_center_crosscheck": "not_published",
    }
    with pytest.raises(ValueError, match="match"):
        validate_kennedy_center_honors([row])


def test_committed_kennedy_center_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("kennedy_center_honors people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_kennedy_center_honors(rows)
    assert rows, "expected at least one kept Kennedy Center honoree"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "kennedy-center.org" in row["kennedy_center_url"]
        assert row["honors"]
        assert row["primary_role"] in {"solo", "member"}

    by_slug = {row["slug"]: row for row in rows}
    samples = {
        "neil-diamond": "1941-01-24",
        "tony-bennett": "1926-08-03",
        "paul-mccartney": "1942-06-18",
        "stevie-wonder": "1950-05-13",
        "sting": "1951-10-02",
    }
    for slug, expected in samples.items():
        assert slug in by_slug, f"missing sample {slug}"
        assert by_slug[slug]["birth_date"] == expected
        assert by_slug[slug]["card"] == birth_card_from_iso(expected)

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["expand_only_listed_honored_members"] is True
        assert provenance["rules"]["person_scope_only"] is True
