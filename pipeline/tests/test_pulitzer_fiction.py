"""Pulitzer Fiction harvest: day-precision only, person-scope, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.pulitzer_fiction.bios import parse_pulitzer_html, parse_wikipedia_birth_field
from pipeline.pulitzer_fiction.harvest import classify_row, unique_slug, validate_pulitzer_fiction
from pipeline.pulitzer_fiction.wiki_list import (
    flatten_winners,
    not_awarded_years,
    parse_winners_wikitext,
)

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "data" / "fixtures" / "pulitzer_fiction_list.wikitext"
BIO_DAY = ROOT / "data" / "fixtures" / "pulitzer_org_bio_day.html"
BIO_YEAR = ROOT / "data" / "fixtures" / "pulitzer_org_bio_year_only.html"
PEOPLE_JSONL = ROOT / "data" / "pulitzer_fiction" / "people.jsonl"
PROVENANCE = ROOT / "data" / "pulitzer_fiction" / "provenance.json"

TODAY = date(2026, 9, 6)


def _entity(iso: str, *, precision: int = 11, description: str = "American novelist") -> dict:
    return {
        "id": "Q0PUL1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Ada Fixture Novelist"}},
        "claims": {
            "P31": [
                {
                    "rank": "normal",
                    "mainsnak": {
                        "snaktype": "value",
                        "datavalue": {"value": {"id": "Q5"}},
                    },
                }
            ],
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
            ],
        },
    }


def _person(**overrides: object) -> dict:
    row: dict = {
        "name": "Ada Fixture Novelist",
        "enwiki_title": "Ada Fixture Novelist",
        "awards": [
            {
                "year": "2023",
                "work": "Example Novel",
                "category": "Pulitzer Prize for Fiction",
                "category_id": "fiction",
                "pulitzer_url": "https://www.pulitzer.org/prize-winners-by-year/2023",
                "shared": False,
            }
        ],
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_winners_drops_finalists_and_keeps_cowinners() -> None:
    wins = parse_winners_wikitext(FIXTURE.read_text(encoding="utf-8"))
    years = [row["year"] for row in wins]
    assert years == ["1918", "1919", "1921", "1984", "2023", "2023", "2025"]
    names = [row["name"] for row in wins]
    assert names == [
        "Ernest Poole",
        "Booth Tarkington",
        "Edith Wharton",
        "William Kennedy",
        "Barbara Kingsolver",
        "Hernan Diaz",
        "Percival Everett",
    ]
    assert {row["work"] for row in wins if row["year"] == "2023"} == {"Demon Copperhead", "Trust"}
    assert all(row["shared"] for row in wins if row["year"] == "2023")
    assert all(not row["shared"] for row in wins if row["year"] != "2023")
    assert "Raymond Carver" not in names
    assert "Karen Russell" not in names
    assert "Vauhini Vara" not in names
    assert wins[3]["work"] == "Ironweed"
    assert wins[4]["pulitzer_url"] == "https://www.pulitzer.org/prize-winners-by-year/2023"

    held = not_awarded_years(FIXTURE.read_text(encoding="utf-8"))
    assert {item["year"] for item in held} == {"1920", "2012"}

    people = flatten_winners(wins)
    assert {person["name"] for person in people} == {
        "Ernest Poole",
        "Booth Tarkington",
        "Edith Wharton",
        "William Kennedy",
        "Barbara Kingsolver",
        "Hernan Diaz",
        "Percival Everett",
    }


def test_year_only_infobox_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1932}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_wikipedia_birth_field_parses_text_template_and_plain_day() -> None:
    text_tmpl = parse_wikipedia_birth_field(
        "{{Infobox writer\n| birth_date = {{birth date text|August 15, 1885}}\n| occupation = Novelist\n}}"
    )
    assert text_tmpl["kind"] == "day"
    assert text_tmpl["birth_date"] == "1885-08-15"

    plain = parse_wikipedia_birth_field(
        "{{Infobox writer\n| birth_date = November 27, 1909\n| birth_place = Knoxville\n}}"
    )
    assert plain["kind"] == "day"
    assert plain["birth_date"] == "1909-11-27"

    year_only = parse_wikipedia_birth_field(
        "{{Infobox writer\n| birth_date = {{birth year and age|1973}}\n| occupation = Novelist\n}}"
    )
    assert year_only["kind"] == "year_only"
    assert year_only["birth_date"] is None


def test_pulitzer_org_bio_parses_day_and_year_only() -> None:
    kind, iso = parse_pulitzer_html(BIO_DAY.read_text(encoding="utf-8"))
    assert kind == "day"
    assert iso == "1955-04-08"
    kind, iso = parse_pulitzer_html(BIO_YEAR.read_text(encoding="utf-8"))
    assert kind == "year_only"
    assert iso is None


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1955-04-08", "wikipedia_title": "Ada Fixture Novelist"},
        entity=_entity("1955-04-08"),
        today=TODAY,
        blocklist=set(),
        pulitzer_org={"kind": "day", "birth_date": "1955-04-08"},
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1955-04-08"
    assert draft["dob_crosscheck"] == "match"
    assert draft["pulitzer_org_crosscheck"] == "match"
    assert draft["awards"][0]["category_id"] == "fiction"


def test_classify_drops_year_only_conflict_precision_minor_and_org_conflict() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "year_only", "birth_date": None},
        entity=_entity("1955-04-08"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1955-04-08"},
        entity=_entity("1955-04-10"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_infobox_date"] == "1955-04-08"
    assert draft["wikidata_birth_date"] == "1955-04-10"

    entity = _entity("1955-04-08")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1955-04-08"},
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
        listed={"kind": "day", "birth_date": "1955-04-08", "wikipedia_title": "Ada Fixture Novelist"},
        entity=_entity("1955-04-08"),
        today=TODAY,
        blocklist=set(),
        pulitzer_org={"kind": "day", "birth_date": "1955-04-10"},
    )
    assert reason == "pulitzer_org_conflict"
    assert draft is not None


def test_classify_d3_description_and_institution() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1944-10-15", "wikipedia_title": "Ada Fixture Novelist"},
        entity=_entity("1944-10-15", description="former dictator of a state"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    org = _entity("1955-04-08")
    org["claims"]["P31"][0]["mainsnak"]["datavalue"]["value"]["id"] = "Q43229"
    del org["claims"]["P31"][0]["mainsnak"]["datavalue"]["value"]["id"]
    org["claims"]["P31"][0]["mainsnak"]["datavalue"]["value"] = {"id": "Q43229"}
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1955-04-08"},
        entity=org,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "not_a_person"
    assert draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1931-12-31") == "Joker"
    assert birth_card_from_iso("1955-04-08") != "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Example", used, title="Ada Example")
    used.add(first)
    second = unique_slug("Ada Example", used, title="Ada Example (writer)")
    assert first == "ada-example"
    assert second != first


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Novelist",
        "slug": "ada-fixture-novelist",
        "birth_date": "1955-04-08",
        "death_date": None,
        "card": "8♥",
        "source_text": "Synthetic fixture novelist. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Novelist",
        "wikipedia_title": "Ada Fixture Novelist",
        "pulitzer_url": "https://www.pulitzer.org/prize-winners-by-year/2023",
        "awards": [
            {
                "year": "2023",
                "work": "Example Novel",
                "category": "Pulitzer Prize for Fiction",
                "category_id": "fiction",
                "pulitzer_url": "https://www.pulitzer.org/prize-winners-by-year/2023",
                "shared": False,
            }
        ],
        "wikipedia_infobox_date": "1955-04-08",
        "wikidata_birth_date": "1955-04-08",
        "dob_crosscheck": "mismatch",
        "pulitzer_org_birth_date": None,
        "pulitzer_org_crosscheck": "unavailable",
    }
    with pytest.raises(ValueError, match="match"):
        validate_pulitzer_fiction([row])


def test_committed_pulitzer_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("pulitzer fiction people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_pulitzer_fiction(rows)
    assert rows, "expected at least one kept Fiction winner"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    assert 40 <= len(rows) <= 120
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "pulitzer.org" in row["pulitzer_url"]
        assert row["awards"]
        assert all(award["category_id"] == "fiction" for award in row["awards"])
        assert row["pulitzer_org_crosscheck"] in {"match", "not_published", "unavailable"}

    by_slug = {row["slug"]: row for row in rows}
    assert "barbara-kingsolver" in by_slug
    assert "hernan-diaz" not in by_slug  # Wikipedia infobox is year-only 1973
    assert {award["year"] for award in by_slug["barbara-kingsolver"]["awards"]} >= {"2023"}
    assert {award["work"] for award in by_slug["barbara-kingsolver"]["awards"]} >= {"Demon Copperhead"}
    assert by_slug["barbara-kingsolver"]["awards"][0]["shared"] is True
    if "edith-wharton" in by_slug:
        assert by_slug["edith-wharton"]["birth_date"] == "1862-01-24"
    if "colson-whitehead" in by_slug:
        years = {award["year"] for award in by_slug["colson-whitehead"]["awards"]}
        assert years >= {"2017", "2020"}

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["person_scope_only"] is True
        held_years = {item["year"] for item in provenance["not_awarded"]}
        assert "2012" in held_years
        assert "1920" in held_years
        reasons = {item["name"]: item["reason"] for item in provenance["exclusions"]}
        assert reasons.get("Hernan Diaz") == "year_only"
        assert reasons.get("Andrew Sean Greer") == "dob_conflict"
