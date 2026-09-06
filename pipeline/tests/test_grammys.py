"""Grammy AOTY harvest: day-precision only, primary billed, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template
from pipeline.grammys.harvest import classify_row, entity_kind, unique_slug, validate_grammys
from pipeline.grammys.wiki_list import (
    flatten_billed,
    parse_infobox_member_titles,
    parse_winners_wikitext,
    various_artist_years,
)
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "data" / "fixtures" / "grammy_aoty_list.wikitext"
PEOPLE_JSONL = ROOT / "data" / "grammys" / "people.jsonl"
PROVENANCE = ROOT / "data" / "grammys" / "provenance.json"

TODAY = date(2026, 9, 6)


def _entity(iso: str, *, precision: int = 11, description: str = "American singer") -> dict:
    return {
        "id": "Q0AOTY1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Singer"}},
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
        "name": "Ada Fixture Singer",
        "enwiki_title": "Ada Fixture Singer",
        "billing": "primary",
        "billed_act": "Ada Fixture Singer",
        "awards": [
            {
                "year": "2012",
                "ceremony_number": 54,
                "album": "Example Album",
                "grammy_url": "https://www.grammy.com/awards/categories/album-of-the-year/2012/",
                "billed_act": "Ada Fixture Singer",
            }
        ],
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_winners_and_drops_nominees() -> None:
    wins = parse_winners_wikitext(FIXTURE.read_text(encoding="utf-8"))
    years = [row["year"] for row in wins]
    assert years == ["1959", "1965", "1968", "1973", "1979", "2010", "2012", "2026"]
    names = [[artist["name"] for artist in row["artists"]] for row in wins]
    assert names[0] == ["Henry Mancini"]
    assert names[1] == ["Stan Getz", "João Gilberto"]
    assert names[2] == ["The Beatles"]
    assert names[3] == ["George Harrison"]
    assert names[4] == []
    assert names[5] == ["Taylor Swift"]
    assert names[6] == ["Adele"]
    assert names[7] == ["Bad Bunny"]
    assert wins[0]["album"] == "The Music from Peter Gunn"
    assert wins[0]["grammy_url"] == "https://www.grammy.com/awards/categories/album-of-the-year/1959/"
    assert "Frank Sinatra" not in {artist["name"] for row in wins for artist in row["artists"]}
    assert "Ringo Starr" not in {artist["name"] for row in wins for artist in row["artists"]}
    various = various_artist_years(wins)
    assert {item["year"] for item in various} == {"1979"}
    people = flatten_billed(wins)
    assert {person["name"] for person in people} == {
        "Henry Mancini",
        "Stan Getz",
        "João Gilberto",
        "The Beatles",
        "George Harrison",
        "Taylor Swift",
        "Adele",
        "Bad Bunny",
    }


def test_infobox_members_prefer_caption_over_past_history() -> None:
    wikitext = """
{{Infobox musical artist
| name = Example Band
| caption = Example Band in 1977: [[Mick Fleetwood]], [[Christine McVie]], [[John McVie]], [[Stevie Nicks]] and [[Lindsey Buckingham]].
| past_members = * [[Peter Green (musician)|Peter Green]]
* [[Neil Finn]]
| spinoffs = [[Buckingham Nicks]]
}}
"""
    members = parse_infobox_member_titles(wikitext)
    assert [row["name"] for row in members] == [
        "Mick Fleetwood",
        "Christine McVie",
        "John McVie",
        "Stevie Nicks",
        "Lindsey Buckingham",
    ]
    assert "Peter Green" not in [row["name"] for row in members]


def test_year_only_infobox_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1960}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1988-05-05", "wikipedia_title": "Ada Fixture Singer"},
        entity=_entity("1988-05-05"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1988-05-05"
    assert draft["dob_crosscheck"] == "match"
    assert draft["awards"][0]["category_id"] == "album-of-the-year"


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


def test_entity_kind_human_vs_group() -> None:
    human = _entity("1988-05-05")
    assert entity_kind(human) == "human"
    group = {
        "id": "Q1299",
        "claims": {
            "P31": [
                {
                    "rank": "normal",
                    "mainsnak": {
                        "snaktype": "value",
                        "datavalue": {"value": {"id": "Q215380"}},
                    },
                }
            ]
        },
    }
    assert entity_kind(group) == "group"


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1955-12-31") == "Joker"
    assert birth_card_from_iso("1989-12-13") != "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Example", used, title="Ada Example")
    used.add(first)
    second = unique_slug("Ada Example", used, title="Ada Example (singer)")
    assert first == "ada-example"
    assert second != first


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Singer",
        "slug": "ada-fixture-singer",
        "birth_date": "1988-05-05",
        "death_date": None,
        "card": "8♥",
        "source_text": "Synthetic fixture singer. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Singer",
        "wikipedia_title": "Ada Fixture Singer",
        "grammy_url": "https://www.grammy.com/awards/categories/album-of-the-year/2012/",
        "billing": "primary",
        "billed_act": "Ada Fixture Singer",
        "awards": [
            {
                "year": "2012",
                "ceremony_number": 54,
                "album": "Example Album",
                "grammy_url": "https://www.grammy.com/awards/categories/album-of-the-year/2012/",
                "billed_act": "Ada Fixture Singer",
                "category": "Album of the Year",
                "category_id": "album-of-the-year",
            }
        ],
        "wikipedia_infobox_date": "1988-05-05",
        "wikidata_birth_date": "1988-05-05",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_grammys([row])


def test_committed_grammys_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("grammys people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_grammys(rows)
    assert rows, "expected at least one kept AOTY person"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    assert 70 <= len(rows) <= 110
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "grammy.com" in row["grammy_url"]
        assert row["awards"]
        assert all(award["category_id"] == "album-of-the-year" for award in row["awards"])

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["taylor-swift"]["birth_date"] == "1989-12-13"
    assert by_slug["taylor-swift"]["card"] == birth_card_from_iso("1989-12-13")
    assert {award["year"] for award in by_slug["taylor-swift"]["awards"]} >= {"2010", "2016", "2021", "2024"}
    assert by_slug["henry-mancini"]["birth_date"] == "1924-04-16"
    assert by_slug["stevie-wonder"]["birth_date"] == "1950-05-13"
    assert by_slug["adele"]["birth_date"] == "1988-05-05"
    assert by_slug["bad-bunny"]["birth_date"] == "1994-03-10"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["catalog_ceremonies"] == 68
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["primary_billed_only"] is True
        assert {item["year"] for item in provenance["various_artists"]} == {"1979", "2002"}
