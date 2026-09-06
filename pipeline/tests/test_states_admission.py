"""Parity: seo-pages/data/states.jsonl dates → pipeline.birthcard (D1)."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.birthcard import birth_card

ROOT = Path(__file__).resolve().parents[2]
STATES_JSONL = ROOT / "seo-pages" / "data" / "states.jsonl"

BANNED = {
    "district-of-columbia",
    "dc",
    "washington-dc",
    "puerto-rico",
    "guam",
    "american-samoa",
    "us-virgin-islands",
    "northern-mariana-islands",
}

CRS_DATES = {
    "delaware": "1787-12-07",
    "pennsylvania": "1787-12-12",
    "new-jersey": "1787-12-18",
    "georgia": "1788-01-02",
    "connecticut": "1788-01-09",
    "massachusetts": "1788-02-06",
    "maryland": "1788-04-28",
    "south-carolina": "1788-05-23",
    "new-hampshire": "1788-06-21",
    "virginia": "1788-06-25",
    "new-york": "1788-07-26",
    "north-carolina": "1789-11-21",
    "rhode-island": "1790-05-29",
    "vermont": "1791-03-04",
    "kentucky": "1792-06-01",
    "tennessee": "1796-06-01",
    "ohio": "1803-03-01",
    "louisiana": "1812-04-30",
    "indiana": "1816-12-11",
    "mississippi": "1817-12-10",
    "illinois": "1818-12-03",
    "alabama": "1819-12-14",
    "maine": "1820-03-15",
    "missouri": "1821-08-10",
    "arkansas": "1836-06-15",
    "michigan": "1837-01-26",
    "florida": "1845-03-03",
    "texas": "1845-12-29",
    "iowa": "1846-12-28",
    "wisconsin": "1848-05-29",
    "california": "1850-09-09",
    "minnesota": "1858-05-11",
    "oregon": "1859-02-14",
    "kansas": "1861-01-29",
    "west-virginia": "1863-06-20",
    "nevada": "1864-10-31",
    "nebraska": "1867-03-01",
    "colorado": "1876-08-01",
    "north-dakota": "1889-11-02",
    "south-dakota": "1889-11-02",
    "montana": "1889-11-08",
    "washington": "1889-11-11",
    "idaho": "1890-07-03",
    "wyoming": "1890-07-10",
    "utah": "1896-01-04",
    "oklahoma": "1907-11-16",
    "new-mexico": "1912-01-06",
    "arizona": "1912-02-14",
    "alaska": "1959-01-03",
    "hawaii": "1959-08-21",
}


def _rows() -> list[dict]:
    rows = []
    for line in STATES_JSONL.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def test_fifty_states_match_crs_table_and_birthcard() -> None:
    rows = _rows()
    assert len(rows) == 50
    slugs = {row["slug"] for row in rows}
    assert slugs == set(CRS_DATES)
    assert slugs.isdisjoint(BANNED)

    for row in rows:
        slug = row["slug"]
        iso = row["admission_date"]
        assert iso == CRS_DATES[slug]
        year, month, day = (int(part) for part in iso.split("-"))
        assert year >= 1787
        card = birth_card(month, day)
        assert card != "K♠" or (month, day) != (12, 31)
        if month == 12 and day == 31:
            assert card == "Joker"


def test_original_thirteen_and_ohio_flag() -> None:
    rows = {row["slug"]: row for row in _rows()}
    for slug in list(CRS_DATES)[:13]:
        assert rows[slug]["date_kind"] == "ratification"
        assert rows[slug]["original_thirteen"] is True
    assert rows["vermont"]["date_kind"] == "admission"
    assert rows["ohio"]["disputed_date"]
    assert "1953" in rows["ohio"]["disputed_date"]
