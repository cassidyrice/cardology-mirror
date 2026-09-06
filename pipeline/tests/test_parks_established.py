"""Parity: seo-pages/data/parks.jsonl dates → pipeline.birthcard (D1)."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.birthcard import birth_card

ROOT = Path(__file__).resolve().parents[2]
PARKS_JSONL = ROOT / "seo-pages" / "data" / "parks.jsonl"

WIKIPEDIA_NP_DATES = {
    "acadia": "1919-02-26",
    "american-samoa": "1988-10-31",
    "arches": "1971-11-12",
    "badlands": "1978-11-10",
    "big-bend": "1944-06-12",
    "biscayne": "1980-06-28",
    "black-canyon-of-the-gunnison": "1999-10-21",
    "bryce-canyon": "1928-02-25",
    "canyonlands": "1964-09-12",
    "capitol-reef": "1971-12-18",
    "carlsbad-caverns": "1930-05-14",
    "channel-islands": "1980-03-05",
    "congaree": "2003-11-10",
    "crater-lake": "1902-05-22",
    "cuyahoga-valley": "2000-10-11",
    "death-valley": "1994-10-31",
    "denali": "1917-02-26",
    "dry-tortugas": "1992-10-26",
    "everglades": "1934-05-30",
    "gates-of-the-arctic": "1980-12-02",
    "gateway-arch": "2018-02-22",
    "glacier": "1910-05-11",
    "glacier-bay": "1980-12-02",
    "grand-canyon": "1919-02-26",
    "grand-teton": "1929-02-26",
    "great-basin": "1986-10-27",
    "great-sand-dunes": "2004-09-24",
    "great-smoky-mountains": "1934-06-15",
    "guadalupe-mountains": "1972-09-30",
    "haleakala": "1961-07-01",
    "hawaii-volcanoes": "1916-08-01",
    "hot-springs": "1921-03-04",
    "indiana-dunes": "2019-02-15",
    "isle-royale": "1940-04-03",
    "joshua-tree": "1994-10-31",
    "katmai": "1980-12-02",
    "kenai-fjords": "1980-12-02",
    "kings-canyon": "1940-03-04",
    "kobuk-valley": "1980-12-02",
    "lake-clark": "1980-12-02",
    "lassen-volcanic": "1916-08-09",
    "mammoth-cave": "1941-07-01",
    "mesa-verde": "1906-06-29",
    "mount-rainier": "1899-03-02",
    "new-river-gorge": "2020-12-27",
    "north-cascades": "1968-10-02",
    "olympic": "1938-06-29",
    "petrified-forest": "1962-12-09",
    "pinnacles": "2013-01-10",
    "redwood": "1968-10-02",
    "rocky-mountain": "1915-01-26",
    "saguaro": "1994-10-14",
    "sequoia": "1890-09-25",
    "shenandoah": "1935-12-26",
    "theodore-roosevelt": "1978-11-10",
    "virgin-islands": "1956-08-02",
    "voyageurs": "1975-04-08",
    "white-sands": "2019-12-20",
    "wind-cave": "1903-01-09",
    "wrangell-st-elias": "1980-12-02",
    "yellowstone": "1872-03-01",
    "yosemite": "1890-10-01",
    "zion": "1919-11-19",
}

ALASKA_ANILCA = {
    "gates-of-the-arctic",
    "glacier-bay",
    "katmai",
    "kenai-fjords",
    "kobuk-valley",
    "lake-clark",
    "wrangell-st-elias",
}

FIRST_UNIT_NOT_MAPPED = {
    "death-valley": "1933-02-11",
    "joshua-tree": "1936-08-10",
    "pinnacles": "1908-01-16",
    "white-sands": "1933-01-18",
    "indiana-dunes": "1966-11-05",
    "gateway-arch": "1935-12-21",
    "haleakala": "1916-08-01",
    "kings-canyon": "1890-10-01",
    "hot-springs": "1832-04-20",
}


def _rows() -> list[dict]:
    rows = []
    for line in PARKS_JSONL.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def test_sixty_three_parks_match_wikipedia_and_birthcard() -> None:
    rows = _rows()
    assert len(rows) == 63
    slugs = {row["slug"] for row in rows}
    assert slugs == set(WIKIPEDIA_NP_DATES)

    for row in rows:
        slug = row["slug"]
        iso = row["established_date"]
        assert iso == WIKIPEDIA_NP_DATES[slug]
        assert row["date_kind"] == "national_park"
        assert row["wikipedia_list_column"] == "Date established as park"
        year, month, day = (int(part) for part in iso.split("-"))
        assert year >= 1872
        card = birth_card(month, day)
        assert card != "K♠" or (month, day) != (12, 31)
        if month == 12 and day == 31:
            assert card == "Joker"


def test_alaska_anilca_december_2_cluster() -> None:
    rows = {row["slug"]: row for row in _rows()}
    for slug in ALASKA_ANILCA:
        assert rows[slug]["established_date"] == "1980-12-02"
    assert rows["denali"]["established_date"] == "1917-02-26"
    assert birth_card(12, 2) != "Joker"
    assert {rows[slug]["established_date"] for slug in ALASKA_ANILCA} == {"1980-12-02"}


def test_first_unit_dates_are_footnotes_not_mapped() -> None:
    rows = {row["slug"]: row for row in _rows()}
    for slug, prior in FIRST_UNIT_NOT_MAPPED.items():
        assert rows[slug]["established_date"] != prior
        recorded = rows[slug]["prior_designation"]
        assert recorded is not None
        assert recorded["date"] == prior
        assert recorded["source"] == "nps_park_anniversaries"
