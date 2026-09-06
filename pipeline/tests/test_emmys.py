"""Emmy Lead Actor/Actress harvest: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.emmys.catalog import CATEGORIES
from pipeline.emmys.dates import parse_birth_template, parse_free_date, parse_wikipedia_birth
from pipeline.emmys.harvest import (
    classify_person,
    resolve_entity,
    unique_slug,
    validate_emmys,
)
from pipeline.emmys.wiki_lists import dedupe_wins, parse_category_wikitext
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "emmy_winner_list.wikitext"
FIXTURE_INFOBOX_DAY = ROOT / "data" / "fixtures" / "emmy_infobox_day.wikitext"
FIXTURE_INFOBOX_YEAR = ROOT / "data" / "fixtures" / "emmy_infobox_year_only.wikitext"
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "emmy_wikidata_Q0EMY1.json"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "emmy_wikidata_conflict.json"
PEOPLE_JSONL = ROOT / "data" / "emmys" / "people.jsonl"
PROVENANCE = ROOT / "data" / "emmys" / "provenance.json"

TODAY = date(2026, 9, 6)
DRAMA_ACTOR = next(row for row in CATEGORIES if row["id"] == "drama_actor")
DRAMA_ACTRESS = next(row for row in CATEGORIES if row["id"] == "drama_actress")


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _person(**overrides: object) -> dict:
    row = {
        "name": "Ada Fixture Cranston",
        "wikipedia_title": "Ada Fixture Cranston",
        "wins": [
            {
                "year": "2008",
                "category_id": "drama_actor",
                "label": "Lead Actor in a Drama Series",
                "category_full": DRAMA_ACTOR["category_full"],
                "program": "Breaking Bad",
                "role": "Walter White",
                "list_url": DRAMA_ACTOR["wikipedia_url"],
                "performance_note": None,
            }
        ],
    }
    row.update(overrides)
    return row


def test_catalog_is_four_primetime_lead_lists() -> None:
    assert [row["id"] for row in CATEGORIES] == [
        "drama_actor",
        "drama_actress",
        "comedy_actor",
        "comedy_actress",
    ]
    titles = " ".join(row["wikipedia_title"] for row in CATEGORIES)
    assert "Supporting" not in titles
    assert "Limited" not in titles
    assert "Daytime" not in titles


def test_list_parser_keeps_gold_winners_and_skips_nominees() -> None:
    wikitext = FIXTURE_LIST.read_text(encoding="utf-8")
    actor_wins = parse_category_wikitext(wikitext, DRAMA_ACTOR)
    names = [row["name"] for row in actor_wins]
    assert names == [
        "Donald O'Connor",
        "Zendaya",
        "Bryan Cranston",
        "Michael J. Fox",
        "Sterling K. Brown",
        "Leonard Bernstein",
    ]
    assert [row["year"] for row in actor_wins] == ["1954", "2020", "2008", "1986", "2017", "1965"]
    assert actor_wins[0]["program"] == "The Colgate Comedy Hour"
    assert actor_wins[1]["program"] == "Euphoria"
    assert actor_wins[2]["program"] == "Breaking Bad"
    assert actor_wins[4]["role"] == "Randall Pearson"
    assert actor_wins[4]["program"] == "This Is Us"
    assert actor_wins[5]["program"] == (
        "New York Philharmonic Young People's Concerts with Leonard Bernstein"
    )
    assert "[[" not in actor_wins[4]["role"]
    assert "[[" not in actor_wins[5]["program"]
    assert "Sid Caesar" not in names
    assert "Should Not Parse" not in names
    assert actor_wins[0]["category_id"] == "lead_actor_pre_split"
    assert actor_wins[1]["category_id"] == "drama_actor"


def test_pre_split_wins_dedupe_across_lineage_pages() -> None:
    wikitext = FIXTURE_LIST.read_text(encoding="utf-8")
    combined = parse_category_wikitext(wikitext, DRAMA_ACTOR) + parse_category_wikitext(
        wikitext, DRAMA_ACTRESS
    )
    deduped = dedupe_wins(combined)
    pre = [row for row in deduped if row["year"] == "1954"]
    assert len(pre) == 1
    assert pre[0]["name"] == "Donald O'Connor"
    assert pre[0]["label"] == "Lead performer (pre-genre split)"


def test_infobox_keeps_day_and_drops_year_only() -> None:
    assert parse_birth_template("{{Birth date and age|mf=yes|1956|3|7}}") == ("day", "1956-03-07")
    assert parse_birth_template("{{birth date|1956|03|07}}") == ("day", "1956-03-07")
    assert parse_birth_template("{{Birth year and age|1956}}") == ("year_only", None)
    assert parse_birth_template("{{birth date and age|1956}}") == ("year_only", None)
    assert parse_free_date("March 7, 1956") == ("day", "1956-03-07")
    assert parse_free_date("7 March 1956") == ("day", "1956-03-07")
    assert parse_free_date("1956") == ("year_only", None)
    assert parse_free_date("March 1956") == ("year_only", None)
    assert parse_wikipedia_birth(FIXTURE_INFOBOX_DAY.read_text(encoding="utf-8")) == (
        "day",
        "1956-03-07",
    )
    assert parse_wikipedia_birth(FIXTURE_INFOBOX_YEAR.read_text(encoding="utf-8")) == (
        "year_only",
        None,
    )


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_person(
        person=_person(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind="day",
        wiki_iso="1956-03-07",
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1956-03-07"
    assert draft["wikidata_birth_date"] == "1956-03-07"
    assert draft["dob_crosscheck"] == "match"
    assert birth_card_from_iso(draft["birth_date"]) == "3♠"


def test_classify_drops_year_only_conflict_precision_minor_d3() -> None:
    year_reason, year_draft = classify_person(
        person=_person(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind="year_only",
        wiki_iso=None,
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    missing_reason, missing_draft = classify_person(
        person=_person(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind="missing",
        wiki_iso=None,
        today=TODAY,
        blocklist=set(),
    )
    assert missing_reason == "missing_wikipedia_date"
    assert missing_draft is None

    conflict_reason, conflict_draft = classify_person(
        person=_person(name="Conflict Fixture"),
        entity=_load(FIXTURE_CONFLICT),
        wiki_kind="day",
        wiki_iso="1956-03-07",
        today=TODAY,
        blocklist=set(),
    )
    assert conflict_reason == "dob_conflict"
    assert conflict_draft is not None
    assert conflict_draft["wikidata_birth_date"] == "1956-03-08"

    entity = _load(FIXTURE_ENTITY)
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(entity, "P569") is None
    precision_reason, precision_draft = classify_person(
        person=_person(),
        entity=entity,
        wiki_kind="day",
        wiki_iso="1956-03-07",
        today=TODAY,
        blocklist=set(),
    )
    assert precision_reason == "wikidata_precision"
    assert precision_draft is None

    d3_entity = _load(FIXTURE_ENTITY)
    d3_entity["descriptions"] = {"en": {"value": "convicted murderer and actor"}}
    d3_reason, d3_draft = classify_person(
        person=_person(),
        entity=d3_entity,
        wiki_kind="day",
        wiki_iso="1956-03-07",
        today=TODAY,
        blocklist=set(),
    )
    assert d3_reason == "description_keyword"
    assert d3_draft is None

    minor_reason, minor_draft = classify_person(
        person=_person(),
        entity=_load(FIXTURE_ENTITY),
        wiki_kind="day",
        wiki_iso="2010-03-07",
        today=TODAY,
        blocklist=set(),
    )
    assert minor_reason == "minor"
    assert minor_draft is None


def test_known_winner_birth_cards() -> None:
    assert birth_card_from_iso("1956-03-07") == "3♠"  # Bryan Cranston
    assert birth_card_from_iso("1996-09-01") == "10♦"  # Zendaya
    assert birth_card_from_iso("1954-12-31") == "Joker"


def test_resolve_entity_uses_canonical_sitelink() -> None:
    entity = _load(FIXTURE_ENTITY)
    by_title = {"ada fixture cranston": entity}
    found = resolve_entity(
        {"name": "Ada Fixture Cranston", "wikipedia_title": "Ada Fixture Cranston (actor)"},
        by_title,
    )
    assert found is entity


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Bryan Cranston", used, qid="Q219561")
    used.add(first)
    second = unique_slug("Bryan Cranston", used, qid="Q9")
    assert first == "bryan-cranston"
    assert second != first
    assert "q9" in second


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q0EMY1",
        "name": "Ada Fixture Cranston",
        "slug": "ada-fixture-cranston",
        "birth_date": "1956-03-07",
        "death_date": None,
        "card": "3♠",
        "source_text": "Synthetic fixture actor. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Cranston",
        "wikipedia_title": "Ada Fixture Cranston",
        "emmys_url": "https://www.emmys.com/",
        "wins": [
            {
                "year": "2008",
                "category_id": "drama_actor",
                "label": "Lead Actor in a Drama Series",
                "category_full": DRAMA_ACTOR["category_full"],
                "genre": "drama",
                "acting": "actor",
                "program": "Breaking Bad",
                "role": "Walter White",
                "list_url": DRAMA_ACTOR["wikipedia_url"],
                "performance_note": None,
            }
        ],
        "wikipedia_birth_date": "1956-03-07",
        "wikidata_birth_date": "1956-03-07",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_emmys([row])


def test_committed_emmy_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("emmys people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_emmys(rows)
    assert rows, "expected at least one kept Emmy winner"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikipedia_birth_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "emmys.com" in row["emmys_url"]
        assert row["wins"]
        for win in row["wins"]:
            assert "[[" not in (win.get("program") or "")
            assert "[[" not in (win.get("role") or "")

    by_slug = {row["slug"]: row for row in rows}
    assert "bryan-cranston" in by_slug
    assert by_slug["bryan-cranston"]["birth_date"] == "1956-03-07"
    assert by_slug["bryan-cranston"]["card"] == "3♠"
    assert {win["year"] for win in by_slug["bryan-cranston"]["wins"]} >= {"2008", "2009", "2010", "2014"}
    assert "zendaya" in by_slug
    assert by_slug["zendaya"]["birth_date"] == "1996-09-01"
    assert {win["year"] for win in by_slug["zendaya"]["wins"]} >= {"2020", "2022"}

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert "Daytime Emmys" in provenance["scope"]["exclude"]
