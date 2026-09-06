"""Winter Olympic harvest: 8+ list only, day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_infobox_wikitext
from pipeline.olympics.winter.harvest import (
    classify_row,
    unique_slug,
    validate_medalists,
    winter_slugify,
)
from pipeline.olympics.winter.wiki_list import parse_winter_medalist_wikitext
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "winter_medalists.wikitext"
FIXTURE_INFOBOX = ROOT / "data" / "fixtures" / "winter_infobox.wikitext"
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "winter_wikidata_Q0WIN1.json"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "winter_wikidata_conflict.json"
PEOPLE_JSONL = ROOT / "data" / "olympics" / "winter" / "people.jsonl"
PROVENANCE = ROOT / "data" / "olympics" / "winter" / "provenance.json"

TODAY = date(2026, 9, 6)


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _listed(**overrides: object) -> dict:
    row: dict = {
        "wikipedia_title": "Ada Fixture Bjorgen",
        "name": "Ada Fixture Bjorgen",
        "nation": "Norway",
        "sport": "Cross-country",
        "gold": 8,
        "silver": 4,
        "bronze": 3,
        "total": 15,
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_eight_plus_and_skips_second_table() -> None:
    rows = parse_winter_medalist_wikitext(FIXTURE_LIST.read_text(encoding="utf-8"))
    titles = [row["wikipedia_title"] for row in rows]
    assert titles == [
        "Ada Fixture Bjorgen",
        "Pat Yearonly Skater",
        "Conflict Fixture Luge",
    ]
    assert rows[0]["gold"] == 8
    assert rows[0]["total"] == 15
    assert rows[0]["nation"] == "Norway"
    assert rows[0]["sport"] == "Cross-country"
    assert "One Event Only" not in titles


def test_infobox_parser_reads_day_and_year_only() -> None:
    chunks = FIXTURE_INFOBOX.read_text(encoding="utf-8").split("{{Infobox sportsperson")
    first = parse_infobox_wikitext(chunks[1])
    assert first["kind"] == "day"
    assert first["birth_date"] == "1980-03-21"
    second = parse_infobox_wikitext(chunks[2])
    assert second["kind"] == "year_only"
    assert second["birth_date"] is None
    third = parse_infobox_wikitext(chunks[3])
    assert third["kind"] == "day"
    assert third["birth_date"] == "1988-04-02"


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        listed=_listed(),
        infobox={"kind": "day", "birth_date": "1980-03-21", "wikipedia_title": "Ada Fixture Bjorgen"},
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1980-03-21"
    assert draft["wikidata_birth_date"] == "1980-03-21"
    assert draft["dob_crosscheck"] == "match"
    assert birth_card_from_iso(draft["birth_date"]) == "2♦"


def test_classify_drops_year_only_conflict_precision_minor_and_d3() -> None:
    year_reason, year_draft = classify_row(
        listed=_listed(name="Pat Yearonly Skater", wikipedia_title="Pat Yearonly Skater"),
        infobox={"kind": "year_only", "birth_date": None},
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    conflict_reason, conflict_draft = classify_row(
        listed=_listed(name="Conflict Fixture Luge", wikipedia_title="Conflict Fixture Luge"),
        infobox={"kind": "day", "birth_date": "1988-04-02"},
        entity=_load(FIXTURE_CONFLICT),
        today=TODAY,
        blocklist=set(),
    )
    assert conflict_reason == "dob_conflict"
    assert conflict_draft is not None
    assert conflict_draft["wikipedia_infobox_date"] == "1988-04-02"
    assert conflict_draft["wikidata_birth_date"] == "1988-04-04"

    entity = _load(FIXTURE_ENTITY)
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(entity, "P569") is None
    precision_reason, precision_draft = classify_row(
        listed=_listed(),
        infobox={"kind": "day", "birth_date": "1980-03-21"},
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert precision_reason == "wikidata_precision"
    assert precision_draft is None

    minor_reason, minor_draft = classify_row(
        listed=_listed(),
        infobox={"kind": "day", "birth_date": "2012-03-21"},
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert minor_reason == "minor"
    assert minor_draft is None

    d3_entity = _load(FIXTURE_ENTITY)
    d3_entity["descriptions"] = {"en": {"value": "former dictator of a state"}}
    d3_reason, d3_draft = classify_row(
        listed=_listed(),
        infobox={"kind": "day", "birth_date": "1980-03-21"},
        entity=d3_entity,
        today=TODAY,
        blocklist=set(),
    )
    assert d3_reason == "description_keyword"
    assert d3_draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1955-12-31") == "Joker"
    assert birth_card_from_iso("1980-03-21") == "2♦"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Fixture", used, title="Ada Fixture")
    used.add(first)
    second = unique_slug("Ada Fixture", used, title="Ada Fixture (skier)")
    assert first == "ada-fixture"
    assert second != first


def test_winter_slugify_keeps_nordic_letters_readable() -> None:
    assert winter_slugify("Marit Bjørgen") == "marit-bjorgen"
    assert winter_slugify("Ole Einar Bjørndalen") == "ole-einar-bjorndalen"
    assert winter_slugify("Johannes Høsflot Klæbo") == "johannes-hosflot-klaebo"
    assert winter_slugify("Ricco Groß") == "ricco-gross"
    assert winter_slugify("Johannes Thingnes Bø") == "johannes-thingnes-bo"


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Bjorgen",
        "slug": "ada-fixture-bjorgen",
        "nation": "Norway",
        "sport": "Cross-country",
        "gold": 8,
        "silver": 4,
        "bronze": 3,
        "total": 15,
        "birth_date": "1980-03-21",
        "death_date": None,
        "card": "2♦",
        "source_text": "Synthetic fixture skier. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Bjorgen",
        "wikipedia_title": "Ada Fixture Bjorgen",
        "wikipedia_list_url": "https://en.wikipedia.org/wiki/List_of_multiple_Winter_Olympic_medalists",
        "wikipedia_infobox_date": "1980-03-21",
        "wikidata_birth_date": "1980-03-21",
        "dob_crosscheck": "mismatch",
    }
    try:
        validate_medalists([row])
    except ValueError as exc:
        assert "match" in str(exc)
    else:
        raise AssertionError("expected schema rejection for dob_crosscheck mismatch")


def test_committed_winter_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        return
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_medalists(rows)
    assert rows, "expected at least one kept Winter Olympic medalist"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["gold"] + row["silver"] + row["bronze"] == row["total"]
        assert row["total"] >= 8
        assert row["nation"]
        assert row["sport"]

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["marit-bjorgen"]["birth_date"] == "1980-03-21"
    assert by_slug["marit-bjorgen"]["card"] == "2♦"
    assert by_slug["ole-einar-bjorndalen"]["birth_date"] == "1974-01-27"
    assert by_slug["ole-einar-bjorndalen"]["card"] == "K♣"
    assert by_slug["alexander-bolshunov"]["birth_date"] == "1996-12-31"
    assert by_slug["alexander-bolshunov"]["card"] == "Joker"
    assert by_slug["apolo-anton-ohno"]["birth_date"] == "1982-05-22"
    assert by_slug["viktor-ahn"]["birth_date"] == "1985-11-23"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["catalog_list"] >= len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert "eight" in provenance["catalog_rule"].lower()
