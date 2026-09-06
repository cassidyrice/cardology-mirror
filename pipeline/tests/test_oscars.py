"""Oscar harvest: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_birth_template
from pipeline.oscars.harvest import classify_row, unique_slug, validate_oscars
from pipeline.oscars.wiki_list import group_people, parse_winners_wikitext
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_ACTOR = ROOT / "data" / "fixtures" / "oscar_list.wikitext"
FIXTURE_ACTRESS = ROOT / "data" / "fixtures" / "oscar_actress_list.wikitext"
PEOPLE_JSONL = ROOT / "data" / "oscars" / "people.jsonl"
PROVENANCE = ROOT / "data" / "oscars" / "provenance.json"

TODAY = date(2026, 9, 6)


def _entity(iso: str, *, precision: int = 11, description: str = "American actor") -> dict:
    return {
        "id": "Q0OSC1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Actor"}},
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


def _person(**overrides: object) -> dict:
    row: dict = {
        "name": "Ada Fixture Actor",
        "enwiki_title": "Ada Fixture Actor",
        "awards": [
            {
                "year": "1971",
                "film_year": "1970",
                "ceremony_number": 43,
                "category": "Best Actor",
                "category_id": "best-actor",
                "film": "Example Film",
                "oscars_url": "https://www.oscars.org/oscars/ceremonies/1971",
            }
        ],
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_winners_and_drops_nominees() -> None:
    actor = parse_winners_wikitext(
        FIXTURE_ACTOR.read_text(encoding="utf-8"),
        category="Best Actor",
        category_id="best-actor",
    )
    actress = parse_winners_wikitext(
        FIXTURE_ACTRESS.read_text(encoding="utf-8"),
        category="Best Actress",
        category_id="best-actress",
    )
    names = [row["name"] for row in actor]
    assert names == [
        "Emil Jannings",
        "Wallace Beery",
        "Fredric March",
        "George C. Scott",
        "Michael B. Jordan",
    ]
    assert "Charlie Chaplin" not in names
    assert "Jack Nicholson" not in names
    assert actor[0]["film"] == "The Last Command"
    assert actor[0]["oscars_url"] == "https://www.oscars.org/oscars/ceremonies/1929"
    assert actor[-1]["film"] == "Sinners"
    assert actor[-1]["ceremony_year"] == 2026
    assert actress[0]["film"] == "The Divorcee"
    assert actress[1]["name"] == "Cher"
    assert actress[1]["film"] == "Moonstruck"
    people = group_people(actor + actress)
    assert len(people) == 7


def test_year_only_infobox_is_not_invented() -> None:
    parsed = parse_birth_template("{{birth date and age|1960}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        person=_person(),
        listed={"kind": "day", "birth_date": "1944-10-15", "wikipedia_title": "Ada Fixture Actor"},
        entity=_entity("1944-10-15"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1944-10-15"
    assert draft["dob_crosscheck"] == "match"
    assert draft["awards"][0]["category_id"] == "best-actor"


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
        listed={"kind": "day", "birth_date": "1944-10-15", "wikipedia_title": "Ada Fixture Actor"},
        entity=_entity("1944-10-15", description="former dictator of a state"),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1955-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Example", used, title="Ada Example")
    used.add(first)
    second = unique_slug("Ada Example", used, title="Ada Example (actor)")
    assert first == "ada-example"
    assert second != first


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Actor",
        "slug": "ada-fixture-actor",
        "birth_date": "1944-10-15",
        "death_date": None,
        "card": "Q♣",
        "source_text": "Synthetic fixture actor. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Actor",
        "wikipedia_title": "Ada Fixture Actor",
        "oscars_url": "https://www.oscars.org/oscars/ceremonies/1971",
        "awards": [
            {
                "year": "1971",
                "film_year": "1970",
                "ceremony_number": 43,
                "category": "Best Actor",
                "category_id": "best-actor",
                "film": "Example Film",
                "oscars_url": "https://www.oscars.org/oscars/ceremonies/1971",
            }
        ],
        "wikipedia_infobox_date": "1944-10-15",
        "wikidata_birth_date": "1944-10-15",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_oscars([row])


def test_committed_oscars_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("oscars people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_oscars(rows)
    assert rows, "expected at least one kept Oscar winner"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    assert 150 <= len(rows) <= 180
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "oscars.org" in row["oscars_url"]
        assert row["awards"]
        assert all(award["category_id"] in {"best-actor", "best-actress"} for award in row["awards"])

    by_slug = {row["slug"]: row for row in rows}
    assert "meryl-streep" in by_slug
    assert by_slug["meryl-streep"]["birth_date"] == "1949-06-22"
    assert by_slug["meryl-streep"]["card"] == birth_card_from_iso("1949-06-22")
    assert {award["year"] for award in by_slug["meryl-streep"]["awards"]} == {"1983", "2012"}
    assert "tom-hanks" in by_slug
    assert by_slug["tom-hanks"]["birth_date"] == "1956-07-09"
    assert "michael-b-jordan" in by_slug
    assert by_slug["michael-b-jordan"]["awards"][0]["film"] == "Sinners"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["catalog_winners"] == 168
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["supporting_categories"] is False
