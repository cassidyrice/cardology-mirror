"""Born-on grounding: 366 days, day-precision only, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from pipeline.birthcard import birth_card, birth_card_from_iso
from pipeline.born_on.calendar import calendar_days, day_label, day_slug
from pipeline.born_on.harvest import (
    assemble_person,
    classify_source_row,
    harvest,
    validate_days,
    validate_people,
    wikipedia_title_from_url,
)
from pipeline.exclusions import ExclusionReason, classify_person

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_JSONL = ROOT / "data" / "born-on" / "people.jsonl"
DAYS_JSONL = ROOT / "data" / "born-on" / "days.jsonl"
PROVENANCE = ROOT / "data" / "born-on" / "provenance.json"
SOURCE_JSONL = ROOT / "data" / "people.jsonl"

TODAY = date(2026, 9, 6)


def _load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def test_calendar_is_366_including_leap_day_and_joker() -> None:
    days = calendar_days()
    assert len(days) == 366
    assert (2, 29) in days
    assert (12, 31) in days
    assert day_slug(1, 15) == "january-15"
    assert day_slug(2, 29) == "february-29"
    assert day_slug(12, 31) == "december-31"
    assert day_label(1, 15) == "January 15"
    assert birth_card(12, 31) == "Joker"
    assert birth_card(2, 29) == "9♣"


def test_wikipedia_title_from_enwiki_url() -> None:
    assert wikipedia_title_from_url("https://en.wikipedia.org/wiki/Martin_Luther_King_Jr.") == (
        "Martin Luther King Jr."
    )
    assert wikipedia_title_from_url("https://example.com/wiki/Nope") is None


def test_classify_drops_year_only_minors_and_d3() -> None:
    year_only = {
        "qid": "Q0BORN1",
        "name": "Year Only",
        "slug": "year-only",
        "birth_date": "1990-00-00",
        "card": "A♥",
        "source_text": "synthetic",
        "source_url": "https://en.wikipedia.org/wiki/Year_Only",
        "precision": 9,
    }
    assert classify_source_row(year_only, today=TODAY) in {
        ExclusionReason.PRECISION.value,
        "missing_birth",
        "year_only",
    }

    minor = {
        "qid": "Q0BORN2",
        "name": "Minor Fixture",
        "slug": "minor-fixture",
        "birth_date": "2015-01-15",
        "card": birth_card(1, 15),
        "source_text": "synthetic minor",
        "source_url": "https://en.wikipedia.org/wiki/Minor_Fixture",
        "wikipedia_description": "American student",
    }
    assert classify_person(minor, today=TODAY) == ExclusionReason.MINOR
    assert classify_source_row(minor, today=TODAY) == "minor"

    d3 = {
        "qid": "Q0BORN3",
        "name": "Blocked Fixture",
        "slug": "blocked-fixture",
        "birth_date": "1970-01-15",
        "card": birth_card(1, 15),
        "source_text": "synthetic",
        "source_url": "https://en.wikipedia.org/wiki/Blocked_Fixture",
        "wikipedia_description": "American murderer",
    }
    assert classify_source_row(d3, today=TODAY) == "description_keyword"


def test_assemble_person_recomputes_card_and_does_not_invent_day() -> None:
    raw = {
        "qid": "Q186185",
        "name": "Martin Luther King Jr.",
        "slug": "martin-luther-king-jr-birth-card",
        "birth_date": "1929-01-15",
        "card": "Q♦",
        "views": 1,
        "source_text": "Martin Luther King Jr. was an American Baptist minister.",
        "source_url": "https://en.wikipedia.org/wiki/Martin_Luther_King_Jr.",
    }
    person = assemble_person(raw)
    assert person["card"] == birth_card_from_iso("1929-01-15")
    assert person["wikidata_birth_date"] == "1929-01-15"
    assert person["month"] == 1
    assert person["day"] == 15
    assert person["wikipedia_title"] == "Martin Luther King Jr."


def test_committed_harvest_covers_366_days_without_invented_people() -> None:
    people = _load_jsonl(PEOPLE_JSONL)
    days = _load_jsonl(DAYS_JSONL)
    provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    validate_people(people)
    validate_days(days)

    assert len(days) == 366
    assert provenance["days"] == 366
    assert provenance["kept"] == len(people)
    assert provenance["path"] == "/born-on/{month}-{day}"
    assert provenance["niche"] == "existing-born-on-grounding"
    assert provenance["days_with_people"] + provenance["days_empty"] == 366
    assert provenance["days_empty"] == len(provenance["empty_slugs"])

    qids = [person["qid"] for person in people]
    assert len(qids) == len(set(qids))
    by_qid = {person["qid"]: person for person in people}

    for row in days:
        assert row["card"] == birth_card(row["month"], row["day"])
        assert row["slug"] == day_slug(row["month"], row["day"])
        assert row["people_count"] == len(row["qids"])
        for qid in row["qids"]:
            person = by_qid[qid]
            assert person["month"] == row["month"]
            assert person["day"] == row["day"]
            assert person["birth_date"] == person["wikidata_birth_date"]
            assert person["card"] == row["card"]
            assert classify_person(person, today=TODAY) is None

    empty = {row["slug"] for row in days if row["people_count"] == 0}
    assert empty == set(provenance["empty_slugs"])
    assert "january-2" in empty
    # Empty days stay in the calendar. No invented notables.
    assert all(row["qids"] == [] for row in days if row["slug"] in empty)


def test_december_31_is_joker_and_january_15_keeps_public_notables() -> None:
    people = _load_jsonl(PEOPLE_JSONL)
    days = {row["slug"]: row for row in _load_jsonl(DAYS_JSONL)}
    by_qid = {person["qid"]: person for person in people}

    joker = days["december-31"]
    assert joker["card"] == "Joker"
    assert joker["people_count"] >= 1
    joker_names = {by_qid[qid]["name"] for qid in joker["qids"]}
    assert "Anthony Hopkins" in joker_names

    leap = days["february-29"]
    assert leap["card"] == "9♣"

    jan15 = days["january-15"]
    assert jan15["card"] == "Q♦"
    names = {by_qid[qid]["name"] for qid in jan15["qids"]}
    assert "Martin Luther King Jr." in names
    mlk = next(person for person in people if person["name"] == "Martin Luther King Jr.")
    assert mlk["qid"] == "Q8027"
    assert mlk["wikidata_birth_date"] == "1929-01-15"
    assert "wikipedia.org/wiki/Martin_Luther_King" in mlk["source_url"]


def test_harvest_is_deterministic_from_committed_catalog() -> None:
    people, days, provenance = harvest(source_path=SOURCE_JSONL, today=TODAY)
    committed_people = _load_jsonl(PEOPLE_JSONL)
    committed_days = _load_jsonl(DAYS_JSONL)
    assert [row["qid"] for row in people] == [row["qid"] for row in committed_people]
    assert [row["slug"] for row in days] == [row["slug"] for row in committed_days]
    assert provenance["kept"] == len(committed_people)
    assert provenance["harvest_dropped"] == 0
