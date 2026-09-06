"""Tony leading-acting harvest: list parse, day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.tonys.dates import classify_wikipedia_birth
from pipeline.tonys.harvest import classify_person, unique_slug, validate_tonys
from pipeline.tonys.wiki_list import parse_winners_wikitext

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_LIST = ROOT / "data" / "fixtures" / "tony_winners.wikitext"
FIXTURE_INFOBOX = ROOT / "data" / "fixtures" / "tony_person_infobox.wikitext"
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "tony_wikidata_Q0TON1.json"
PEOPLE_JSONL = ROOT / "data" / "tonys" / "people.jsonl"
PROVENANCE = ROOT / "data" / "tonys" / "provenance.json"

TODAY = date(2026, 9, 6)


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _win(**overrides: object) -> dict:
    row = {
        "year": "2026",
        "category": "actor_play",
        "name": "Ada Fixture Tony",
        "enwiki_title": "Ada Fixture Tony",
        "production": "Giant",
        "role": "Roald Dahl",
        "wikipedia_list_url": "https://en.wikipedia.org/wiki/Tony_Award_for_Best_Actor_in_a_Play",
    }
    row.update(overrides)
    return row


def test_list_parser_keeps_highlighted_winners_and_ties() -> None:
    rows = parse_winners_wikitext(FIXTURE_LIST.read_text(encoding="utf-8"), category_key="actor_play")
    names = [row["name"] for row in rows]
    assert names == [
        "José Ferrer",
        "Fredric March",
        "Henry Fonda",
        "Paul Kelly",
        "Ada Fixture Tony",
    ]
    by_name = {row["name"]: row for row in rows}
    assert by_name["José Ferrer"]["year"] == "1947"
    assert by_name["José Ferrer"]["production"] == "Cyrano de Bergerac"
    assert by_name["Fredric March"]["production"] == "Years Ago"
    assert by_name["Paul Kelly"]["enwiki_title"] == "Paul Kelly (actor)"
    assert by_name["Ada Fixture Tony"]["year"] == "2026"
    assert "Nominee Fixture" not in names
    assert all(row["year"] != "1985" for row in rows)


def test_wikipedia_birth_parser_keeps_day_and_drops_year_only() -> None:
    assert classify_wikipedia_birth(FIXTURE_INFOBOX.read_text(encoding="utf-8")) == (
        "day",
        "1965-10-19",
    )
    assert classify_wikipedia_birth("{{birth date and age|df=yes|1947|01|08}}") == (
        "day",
        "1947-01-08",
    )
    assert classify_wikipedia_birth("{{birth date and age|1960}}") == ("year_only", None)
    assert classify_wikipedia_birth("| birth_date = 1944") == ("year_only", None)
    assert classify_wikipedia_birth("| birth_date = April 2, 1968") == ("day", "1968-04-02")
    assert classify_wikipedia_birth("") == ("missing", None)
    assert classify_wikipedia_birth("{{Infobox person\n| name = X\n}}") == ("missing", None)


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_person(
        wins=[_win()],
        entity=_load(FIXTURE_ENTITY),
        wikipedia_kind="day",
        wikipedia_iso="1965-10-19",
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1965-10-19"
    assert draft["wikidata_birth_date"] == "1965-10-19"
    assert draft["dob_crosscheck"] == "match"
    assert birth_card_from_iso(draft["birth_date"]) == "3♣"


def test_classify_keeps_wikidata_only_when_wikipedia_has_no_day() -> None:
    reason, draft = classify_person(
        wins=[_win()],
        entity=_load(FIXTURE_ENTITY),
        wikipedia_kind="missing",
        wikipedia_iso=None,
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["dob_crosscheck"] == "wikidata_only"
    assert draft["wikipedia_birth_date"] is None
    assert draft["birth_date"] == "1965-10-19"


def test_classify_drops_year_only_conflict_precision_minor_and_d3() -> None:
    year_reason, year_draft = classify_person(
        wins=[_win()],
        entity=_load(FIXTURE_ENTITY),
        wikipedia_kind="year_only",
        wikipedia_iso=None,
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    reason, draft = classify_person(
        wins=[_win()],
        entity=_load(FIXTURE_ENTITY),
        wikipedia_kind="day",
        wikipedia_iso="1965-10-20",
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_birth_date"] == "1965-10-20"

    entity = _load(FIXTURE_ENTITY)
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(entity, "P569") is None
    prec_reason, prec_draft = classify_person(
        wins=[_win()],
        entity=entity,
        wikipedia_kind="day",
        wikipedia_iso="1965-10-19",
        today=TODAY,
        blocklist=set(),
    )
    assert prec_reason == "wikidata_precision"
    assert prec_draft is None

    d3_entity = _load(FIXTURE_ENTITY)
    d3_entity["descriptions"] = {"en": {"value": "former dictator of a state"}}
    d3_reason, d3_draft = classify_person(
        wins=[_win()],
        entity=d3_entity,
        wikipedia_kind="day",
        wikipedia_iso="1965-10-19",
        today=TODAY,
        blocklist=set(),
    )
    assert d3_reason == "description_keyword"
    assert d3_draft is None

    minor_entity = _load(FIXTURE_ENTITY)
    minor_entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["time"] = "+2012-10-19T00:00:00Z"
    minor_reason, minor_draft = classify_person(
        wins=[_win()],
        entity=minor_entity,
        wikipedia_kind="day",
        wikipedia_iso="2012-10-19",
        today=TODAY,
        blocklist=set(),
    )
    assert minor_reason == "minor"
    assert minor_draft is None


def test_december_31_is_joker() -> None:
    assert birth_card_from_iso("1960-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Ada Fixture Tony", used, qid="Q0TON1")
    used.add(first)
    second = unique_slug("Ada Fixture Tony", used, qid="Q0TON2")
    assert first == "ada-fixture-tony"
    assert second != first
    assert "q0ton2" in second


def test_schema_rejects_unknown_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Ada Fixture Tony",
        "slug": "ada-fixture-tony",
        "birth_date": "1965-10-19",
        "death_date": None,
        "card": "3♣",
        "source_text": "Synthetic fixture actor. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Tony",
        "wikipedia_title": "Ada Fixture Tony",
        "tony_url": "https://www.tonyawards.com/",
        "wins": [
            {
                "year": "2026",
                "category": "actor_play",
                "category_label": "Best Actor in a Play",
                "category_full": "Tony Award for Best Actor in a Play",
                "production": "Giant",
                "role": "Roald Dahl",
                "wikipedia_list_url": "https://en.wikipedia.org/wiki/Tony_Award_for_Best_Actor_in_a_Play",
            }
        ],
        "wikipedia_birth_date": "1965-10-19",
        "wikidata_birth_date": "1965-10-19",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="mismatch"):
        validate_tonys([row])


def test_committed_tony_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("tonys people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_tonys(rows)
    assert rows, "expected at least one kept leading Tony winner"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] in {"match", "wikidata_only"}
        if row["dob_crosscheck"] == "match":
            assert row["wikipedia_birth_date"] == row["birth_date"]
        else:
            assert row["wikipedia_birth_date"] is None
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert row["wins"]
        for win in row["wins"]:
            assert win["category"] in {
                "actor_play",
                "actress_play",
                "actor_musical",
                "actress_musical",
            }

    by_slug = {row["slug"]: row for row in rows}
    assert "jose-ferrer" in by_slug
    assert by_slug["jose-ferrer"]["birth_date"] == "1912-01-08"
    assert by_slug["jose-ferrer"]["card"] == "6♠"
    assert "angela-lansbury" in by_slug
    assert by_slug["angela-lansbury"]["birth_date"] == "1925-10-16"
    assert "john-lithgow" in by_slug
    assert "bebe-neuwirth" in by_slug
    assert by_slug["bebe-neuwirth"]["birth_date"] == "1958-12-31"
    assert by_slug["bebe-neuwirth"]["card"] == "Joker"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert "Leading Actor" in provenance["scope"]["note"]
