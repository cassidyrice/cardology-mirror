"""Summer Olympic multi-gold harvest: day-precision only, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import parse_infobox_wikitext
from pipeline.olympics.games import SUMMER_GAMES
from pipeline.olympics.harvest import classify_row, unique_slug, validate_olympians
from pipeline.olympics.medals import build_medal_records, extract_gold_event_qids
from pipeline.olympics.wiki_list import extract_person_titles
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "olympics_entity_keep.json"
FIXTURE_EVENTS = ROOT / "data" / "fixtures" / "olympics_event_summer.json"
FIXTURE_INFOBOX = ROOT / "data" / "fixtures" / "olympics_infobox_keep.wikitext"
FIXTURE_YEAR_ONLY = ROOT / "data" / "fixtures" / "olympics_infobox_year_only.wikitext"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "olympics_infobox_conflict.wikitext"
PEOPLE_JSONL = ROOT / "data" / "olympics" / "people.jsonl"
PROVENANCE = ROOT / "data" / "olympics" / "provenance.json"

TODAY = date(2026, 9, 6)


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _listed(path: Path) -> dict:
    parsed = parse_infobox_wikitext(path.read_text(encoding="utf-8"))
    parsed["wikipedia_title"] = "Ada Fixture Phelps"
    return parsed


def test_summer_games_catalog_is_modern_olympiad_only() -> None:
    years = [int(row["year"]) for row in SUMMER_GAMES.values()]
    assert 1896 in years
    assert 1920 in years
    assert 2024 in years
    assert 1906 not in years
    assert 1916 not in years
    assert len(SUMMER_GAMES) == 30


def test_extracts_two_summer_golds() -> None:
    entity = _load(FIXTURE_ENTITY)
    events = _load(FIXTURE_EVENTS)
    assert extract_gold_event_qids(entity) == ["Q0OLYEVT1", "Q0OLYEVT2"]
    medals = build_medal_records(entity, events)
    assert len(medals) == 2
    assert medals[0]["year"] == "2008"
    assert medals[1]["year"] == "2012"
    assert medals[0]["games"] == "2008 Summer Olympics"


def test_infobox_parser_keeps_day_and_drops_year_only() -> None:
    keep = parse_infobox_wikitext(FIXTURE_INFOBOX.read_text(encoding="utf-8"))
    assert keep["kind"] == "day"
    assert keep["birth_date"] == "1985-06-30"
    year_only = parse_infobox_wikitext(FIXTURE_YEAR_ONLY.read_text(encoding="utf-8"))
    assert year_only["kind"] == "year_only"
    assert year_only["birth_date"] is None


def test_classify_keeps_matching_day_precision() -> None:
    events = _load(FIXTURE_EVENTS)
    reason, draft = classify_row(
        entity=_load(FIXTURE_ENTITY),
        listed=_listed(FIXTURE_INFOBOX),
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1985-06-30"
    assert draft["wikidata_birth_date"] == "1985-06-30"
    assert draft["dob_crosscheck"] == "match"
    assert draft["gold_count"] == 2
    assert "swimming" in draft["sports"]
    assert birth_card_from_iso(draft["birth_date"]) == "K♥"


def test_classify_drops_year_only_conflict_and_precision() -> None:
    events = _load(FIXTURE_EVENTS)
    entity = _load(FIXTURE_ENTITY)
    year_reason, year_draft = classify_row(
        entity=entity,
        listed=_listed(FIXTURE_YEAR_ONLY),
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    conflict_reason, conflict_draft = classify_row(
        entity=entity,
        listed=_listed(FIXTURE_CONFLICT),
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert conflict_reason == "dob_conflict"
    assert conflict_draft is not None
    assert conflict_draft["wikipedia_infobox_date"] == "1985-07-01"
    assert conflict_draft["wikidata_birth_date"] == "1985-06-30"

    coarse = json.loads(json.dumps(entity))
    coarse["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(coarse, "P569") is None
    prec_reason, prec_draft = classify_row(
        entity=coarse,
        listed=_listed(FIXTURE_INFOBOX),
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert prec_reason == "wikidata_precision"
    assert prec_draft is None


def test_classify_d3_minor_and_one_gold() -> None:
    events = _load(FIXTURE_EVENTS)
    entity = _load(FIXTURE_ENTITY)
    blocked = json.loads(json.dumps(entity))
    blocked["descriptions"] = {"en": {"value": "former dictator of a state"}}
    reason, draft = classify_row(
        entity=blocked,
        listed=_listed(FIXTURE_INFOBOX),
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    minor = json.loads(json.dumps(entity))
    minor["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["time"] = "+2010-06-30T00:00:00Z"
    listed = _listed(FIXTURE_INFOBOX)
    listed["birth_date"] = "2010-06-30"
    reason, draft = classify_row(
        entity=minor,
        listed=listed,
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None

    one = json.loads(json.dumps(entity))
    one["claims"]["P1344"] = one["claims"]["P1344"][:1]
    reason, draft = classify_row(
        entity=one,
        listed=_listed(FIXTURE_INFOBOX),
        events=events,
        extras=events,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "insufficient_summer_golds"
    assert draft is None


def test_phelps_and_bolt_birth_cards() -> None:
    assert birth_card_from_iso("1985-06-30") == "K♥"
    assert birth_card_from_iso("1986-08-21") == "5♣"
    assert birth_card_from_iso("1997-03-14") == "9♦"
    assert birth_card_from_iso("1984-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Fixture Phelps", used, qid="Q0OLY1")
    used.add(first)
    second = unique_slug("Ada Fixture Phelps", used, qid="Q0OLY2")
    assert first == "ada-fixture-phelps"
    assert second != first
    assert "q0oly2" in second


def test_wiki_list_extracts_person_links_not_category_noise() -> None:
    wikitext = """
{| class="wikitable sortable"
|-
| 1 || [[Michael Phelps]] || 23
|-
| 2 || [[Larisa Latynina]] || 9
|-
| 3 || [[Category:Olympic gold medalists]] || 0
|}
"""
    titles = extract_person_titles(wikitext)
    assert titles == ["Michael Phelps", "Larisa Latynina"]


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Phelps",
        "slug": "ada-fixture-phelps",
        "birth_date": "1985-06-30",
        "death_date": None,
        "card": "K♥",
        "source_text": "Synthetic fixture swimmer. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Phelps",
        "wikipedia_title": "Ada Fixture Phelps",
        "wikipedia_infobox_date": "1985-06-30",
        "wikidata_birth_date": "1985-06-30",
        "dob_crosscheck": "mismatch",
        "gold_count": 2,
        "sports": ["swimming"],
        "country": "United States",
        "medals": [
            {
                "year": "2008",
                "games": "2008 Summer Olympics",
                "event": "fixture",
                "sport": "swimming",
                "event_qid": "Q0OLYEVT1",
            }
        ],
    }
    with pytest.raises(ValueError, match="match"):
        validate_olympians([row])


def test_committed_olympics_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("olympics people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_olympians(rows)
    assert rows, "expected at least one kept Summer Olympian"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_infobox_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["gold_count"] >= 2
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]

    by_slug = {row["slug"]: row for row in rows}
    if "michael-phelps" in by_slug:
        assert by_slug["michael-phelps"]["birth_date"] == "1985-06-30"
        assert by_slug["michael-phelps"]["card"] == "K♥"
        assert by_slug["michael-phelps"]["gold_count"] >= 2
    if "usain-bolt" in by_slug:
        assert by_slug["usain-bolt"]["birth_date"] == "1986-08-21"
        assert by_slug["usain-bolt"]["card"] == "5♣"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert provenance["rules"]["min_summer_golds"] == 2
