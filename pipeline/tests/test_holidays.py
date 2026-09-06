"""Parity: 5 U.S.C. § 6103(a) fixed dates → pipeline.birthcard (D1)."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.birthcard import birth_card
from pipeline.holidays import (
    EXCLUDED_OTHER,
    FIXED_HOLIDAYS,
    FLOATING_HOLIDAYS,
    OPM_CALENDARS_URL,
    USC_CITATION,
    USC_URL,
    holiday_rows,
)

ROOT = Path(__file__).resolve().parents[2]
HOLIDAYS_JSONL = ROOT / "seo-pages" / "data" / "holidays.jsonl"
SCHEMA = ROOT / "pipeline" / "schema" / "holiday.schema.json"

# Cornell LII 5 U.S.C. § 6103(a) — fixed month-and-day holidays only.
STATUTE_DATES = {
    "new-years-day": (1, 1, "New Year's Day"),
    "juneteenth": (6, 19, "Juneteenth National Independence Day"),
    "independence-day": (7, 4, "Independence Day"),
    "veterans-day": (11, 11, "Veterans Day"),
    "christmas-day": (12, 25, "Christmas Day"),
}

# Cards from pipeline.birthcard (year unused). None is Dec 31 / Joker.
STATUTE_CARDS = {
    "new-years-day": "K♠",
    "juneteenth": "J♣",
    "independence-day": "J♦",
    "veterans-day": "9♣",
    "christmas-day": "6♥",
}

FLOATING_SLUGS = {
    "martin-luther-king-jr-day",
    "washingtons-birthday",
    "presidents-day",
    "memorial-day",
    "labor-day",
    "columbus-day",
    "thanksgiving-day",
    "inauguration-day",
}


def _rows() -> list[dict]:
    rows = []
    for line in HOLIDAYS_JSONL.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def test_five_of_five_fixed_holidays_match_statute_and_birthcard() -> None:
    rows = _rows()
    assert len(rows) == 5
    slugs = [row["slug"] for row in rows]
    assert slugs == list(STATUTE_DATES)
    assert set(slugs).isdisjoint(FLOATING_SLUGS)

    for row in rows:
        slug = row["slug"]
        month, day, name = STATUTE_DATES[slug]
        assert row["name"] == name
        assert row["month"] == month
        assert row["day"] == day
        assert row["usc_citation"] == USC_CITATION
        assert row["usc_url"] == USC_URL
        assert row["opm_calendars_url"] == OPM_CALENDARS_URL
        assert row["date_kind"] == "fixed"
        assert row["observed_shift"] == "ignored"
        assert birth_card(month, day) == STATUTE_CARDS[slug]
        assert row["card"] == STATUTE_CARDS[slug]
        assert (month, day) != (12, 31)
        assert row["card"] != "Joker"


def test_module_lock_matches_jsonl_and_excludes_floating() -> None:
    assert len(FIXED_HOLIDAYS) == 5
    assert len(FLOATING_HOLIDAYS) == 6
    assert len(EXCLUDED_OTHER) == 1
    assert EXCLUDED_OTHER[0][0] == "inauguration-day"

    generated = holiday_rows()
    committed = _rows()
    assert generated == committed

    locked_slugs = {slug for slug, _name, _month, _day in FIXED_HOLIDAYS}
    assert locked_slugs == set(STATUTE_DATES)
    for slug, _name in FLOATING_HOLIDAYS + EXCLUDED_OTHER:
        assert slug in FLOATING_SLUGS


def test_holiday_jsonl_validates_against_schema() -> None:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    required = set(schema["required"])
    for row in _rows():
        assert required <= set(row)
        assert row["usc_citation"] == schema["properties"]["usc_citation"]["const"]
        assert row["date_kind"] == "fixed"
