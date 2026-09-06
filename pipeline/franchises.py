"""NFL franchise grant-date mapping for isolated SEO pages.

Primary dates come from the Pro Football Hall of Fame Franchise Histories
table (Franchise Date column). That date is the league grant, kept through
relocations and renames. It is not first kickoff and not 1919 Packers lore.

Birth cards are computed only by ``pipeline.birthcard`` (Cass D1: Dec 31 =
Joker). This module does not implement a third formula.
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any, Literal, TypedDict

from pipeline.birthcard import birth_card, solar_value

ROOT = Path(__file__).resolve().parents[1]
HOF_SNAPSHOT = Path(__file__).resolve().parent / "data" / "hof_franchise_histories.json"
FRANCHISES_JSONL = Path(__file__).resolve().parent / "data" / "franchises.jsonl"
CARD_MEANINGS_PATH = Path(__file__).resolve().parent / "data" / "card_meanings.json"

HOF_SOURCE_URL = (
    "https://www.profootballhof.com/football-history/national-football-league-franchise-histories"
)
HOF_SOURCE_NAME = "Pro Football Hall of Fame — National Football League Franchise Histories"
WIKIPEDIA_NFL_URL = "https://en.wikipedia.org/wiki/National_Football_League"
WIKIPEDIA_SOURCE_NAME = "Wikipedia — National Football League teams table"
RETRIEVED_ON = "2026-09-06"

SUIT_FROM_SYMBOL = {"♥": "hearts", "♣": "clubs", "♦": "diamonds", "♠": "spades"}
RANK_SLUG = {
    "A": "ace",
    "J": "jack",
    "Q": "queen",
    "K": "king",
}

AFL_1959_08_14_SLUGS = (
    "denver-broncos",
    "kansas-city-chiefs",
    "los-angeles-chargers",
    "new-york-jets",
    "tennessee-titans",
)

VERIFIED_SAMPLES = {
    "dallas-cowboys": "1960-01-28",
    "houston-texans": "1999-10-06",
    "carolina-panthers": "1993-10-26",
    "baltimore-ravens": "1996-02-09",
    "green-bay-packers": "1921-08-27",
}

HOF_DATE_RE = re.compile(
    r"^(?P<month>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{2})(?:\s+\((?P<league>[A-Z]+)\))?$"
)
ISO_DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
YEAR_RE = re.compile(r"\b(18|19|20)\d{2}\b")

YearCrosscheck = Literal[
    "year_mentioned",
    "grant_precedes_first_season",
    "wikipedia_lists_older_year",
]


class FranchiseSeed(TypedDict):
    slug: str
    name: str
    conference: str
    division: str
    hof_row_name: str
    hof_franchise_date_raw: str
    hof_years_of_operation: str
    hof_notes: list[str]
    wikipedia_first_season_label: str


# Alias map: current 32 names → HOF Franchise Date row (not first kickoff).
# Indianapolis uses the 1/23/53 Baltimore/Indianapolis Colts grant, not the
# defunct 12/28/46 AAFC Baltimore Colts. New York Giants uses 8/1/25, not the
# one-year 1921 NY Giants club.
CURRENT_32: tuple[FranchiseSeed, ...] = (
    {
        "slug": "arizona-cardinals",
        "name": "Arizona Cardinals",
        "conference": "NFC",
        "division": "West",
        "hof_row_name": "Chicago Cardinals/St. Louis/Phoenix/Arizona",
        "hof_franchise_date_raw": "9/17/20",
        "hof_years_of_operation": "1920-1959/1960-1987/1988-1993/1994-present",
        "hof_notes": ["HOF alias row: Arizona Cardinals (see Chicago Cardinals)."],
        "wikipedia_first_season_label": "1898 1920 (NFL)",
    },
    {
        "slug": "atlanta-falcons",
        "name": "Atlanta Falcons",
        "conference": "NFC",
        "division": "South",
        "hof_row_name": "Atlanta Falcons",
        "hof_franchise_date_raw": "6/30/65",
        "hof_years_of_operation": "1966-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1966",
    },
    {
        "slug": "baltimore-ravens",
        "name": "Baltimore Ravens",
        "conference": "AFC",
        "division": "North",
        "hof_row_name": "Baltimore Ravens",
        "hof_franchise_date_raw": "2/9/96",
        "hof_years_of_operation": "1996-present",
        "hof_notes": [
            "HOF lists the Cleveland Browns as inactive 1996-1998; the Ravens are a separate 1996 grant.",
        ],
        "wikipedia_first_season_label": "1996",
    },
    {
        "slug": "buffalo-bills",
        "name": "Buffalo Bills",
        "conference": "AFC",
        "division": "East",
        "hof_row_name": "Buffalo Bills",
        "hof_franchise_date_raw": "10/28/59 (AFL)",
        "hof_years_of_operation": "1960-69 (AFL), 1970-present (NFL)",
        "hof_notes": [],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "carolina-panthers",
        "name": "Carolina Panthers",
        "conference": "NFC",
        "division": "South",
        "hof_row_name": "Carolina Panthers",
        "hof_franchise_date_raw": "10/26/93",
        "hof_years_of_operation": "1995-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1995",
    },
    {
        "slug": "chicago-bears",
        "name": "Chicago Bears",
        "conference": "NFC",
        "division": "North",
        "hof_row_name": "Decatur Staleys/Chicago Staleys/Chicago Bears",
        "hof_franchise_date_raw": "9/17/20",
        "hof_years_of_operation": "1920/1921/1922-present",
        "hof_notes": ["HOF alias row: Chicago Bears (see Decatur Staleys)."],
        "wikipedia_first_season_label": "1920",
    },
    {
        "slug": "cincinnati-bengals",
        "name": "Cincinnati Bengals",
        "conference": "AFC",
        "division": "North",
        "hof_row_name": "Cincinnati Bengals",
        "hof_franchise_date_raw": "5/23/67 (AFL)",
        "hof_years_of_operation": "1968-69 (AFL), 1970-present (NFL)",
        "hof_notes": [],
        "wikipedia_first_season_label": "1968 (AFL)1970 (NFL)",
    },
    {
        "slug": "cleveland-browns",
        "name": "Cleveland Browns",
        "conference": "AFC",
        "division": "North",
        "hof_row_name": "Cleveland Browns",
        "hof_franchise_date_raw": "6/4/44 (AAFC)",
        "hof_years_of_operation": "1946-49 (AAFC), 1950-present (NFL)",
        "hof_notes": ["Inactive, 1996-1998 (HOF)."],
        "wikipedia_first_season_label": "1946 (AAFC)1950 (NFL)",
    },
    {
        "slug": "dallas-cowboys",
        "name": "Dallas Cowboys",
        "conference": "NFC",
        "division": "East",
        "hof_row_name": "Dallas Cowboys",
        "hof_franchise_date_raw": "1/28/60",
        "hof_years_of_operation": "1960-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1960",
    },
    {
        "slug": "denver-broncos",
        "name": "Denver Broncos",
        "conference": "AFC",
        "division": "West",
        "hof_row_name": "Denver Broncos",
        "hof_franchise_date_raw": "8/14/59 (AFL)",
        "hof_years_of_operation": "1960-69 (AFL), 1970-present (NFL)",
        "hof_notes": [],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "detroit-lions",
        "name": "Detroit Lions",
        "conference": "NFC",
        "division": "North",
        "hof_row_name": "Portsmouth Spartans/Detroit Lions",
        "hof_franchise_date_raw": "7/12/30",
        "hof_years_of_operation": "1930-33/1934-present",
        "hof_notes": [
            "HOF alias row: Detroit Lions (see Portsmouth Spartans).",
            "HOF note: 6/30/34 — the Portsmouth franchise was sold and moved to Detroit.",
        ],
        "wikipedia_first_season_label": "1930",
    },
    {
        "slug": "green-bay-packers",
        "name": "Green Bay Packers",
        "conference": "NFC",
        "division": "North",
        "hof_row_name": "Green Bay Packers",
        "hof_franchise_date_raw": "8/27/21",
        "hof_years_of_operation": "1921-present",
        "hof_notes": [
            "NFL grant date. Wikipedia's teams table also lists 1919 (pre-NFL lore); that year is not used here.",
        ],
        "wikipedia_first_season_label": "1919 1921 (NFL)",
    },
    {
        "slug": "houston-texans",
        "name": "Houston Texans",
        "conference": "AFC",
        "division": "South",
        "hof_row_name": "Houston Texans",
        "hof_franchise_date_raw": "10/6/99",
        "hof_years_of_operation": "2002-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "2002",
    },
    {
        "slug": "indianapolis-colts",
        "name": "Indianapolis Colts",
        "conference": "AFC",
        "division": "South",
        "hof_row_name": "Baltimore/Indianapolis Colts",
        "hof_franchise_date_raw": "1/23/53",
        "hof_years_of_operation": "1953-1983/1984-present",
        "hof_notes": [
            "HOF alias row: Indianapolis Colts (see Baltimore Colts) resolves to this 1/23/53 grant, not the defunct 12/28/46 AAFC Baltimore Colts.",
            "HOF note: moved to Indianapolis, 3/28/84.",
        ],
        "wikipedia_first_season_label": "1953",
    },
    {
        "slug": "jacksonville-jaguars",
        "name": "Jacksonville Jaguars",
        "conference": "AFC",
        "division": "South",
        "hof_row_name": "Jacksonville Jaguars",
        "hof_franchise_date_raw": "11/30/93",
        "hof_years_of_operation": "1995-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1995",
    },
    {
        "slug": "kansas-city-chiefs",
        "name": "Kansas City Chiefs",
        "conference": "AFC",
        "division": "West",
        "hof_row_name": "Dallas Texans/Kansas City Chiefs",
        "hof_franchise_date_raw": "8/14/59 (AFL)",
        "hof_years_of_operation": "1960-62/1963-69 (AFL), 1970-present (NFL)",
        "hof_notes": ["HOF alias row: Kansas City Chiefs (see Dallas Texans)."],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "las-vegas-raiders",
        "name": "Las Vegas Raiders",
        "conference": "AFC",
        "division": "West",
        "hof_row_name": "Oakland/Los Angeles/Oakland Raiders",
        "hof_franchise_date_raw": "1/30/60 (AFL)",
        "hof_years_of_operation": "1960-69 (AFL), 1970-1981/1982-1994/1995- Present (NFL)",
        "hof_notes": [
            "HOF table title has not been updated for the Las Vegas relocation; the 1/30/60 AFL grant is kept through city moves.",
        ],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "los-angeles-chargers",
        "name": "Los Angeles Chargers",
        "conference": "AFC",
        "division": "West",
        "hof_row_name": "Los Angeles/San Diego Chargers",
        "hof_franchise_date_raw": "8/14/59 (AFL)",
        "hof_years_of_operation": "1960/1961-69 (AFL), 1970-present (NFL)",
        "hof_notes": ["HOF alias row: San Diego Chargers (see Los Angeles Chargers)."],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "los-angeles-rams",
        "name": "Los Angeles Rams",
        "conference": "NFC",
        "division": "West",
        "hof_row_name": "Cleveland/Los Angeles/St. Louis Rams",
        "hof_franchise_date_raw": "2/12/37",
        "hof_years_of_operation": "1937-42, 1944-45/1946-1994/1995-present",
        "hof_notes": [
            "HOF alias rows: Los Angeles Rams (see Cleveland Rams); St. Louis Rams (see Cleveland Rams).",
            "HOF years-of-operation string is published as of scrape and still names the St. Louis era as present.",
        ],
        "wikipedia_first_season_label": "1936 (AFL)1937 (NFL)",
    },
    {
        "slug": "miami-dolphins",
        "name": "Miami Dolphins",
        "conference": "AFC",
        "division": "East",
        "hof_row_name": "Miami Dolphins",
        "hof_franchise_date_raw": "8/16/65 (AFL)",
        "hof_years_of_operation": "1966-69 (AFL), 1970-present (NFL)",
        "hof_notes": [],
        "wikipedia_first_season_label": "1966 (AFL)1970 (NFL)",
    },
    {
        "slug": "minnesota-vikings",
        "name": "Minnesota Vikings",
        "conference": "NFC",
        "division": "North",
        "hof_row_name": "Minnesota Vikings",
        "hof_franchise_date_raw": "1/28/60",
        "hof_years_of_operation": "1961-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1961",
    },
    {
        "slug": "new-england-patriots",
        "name": "New England Patriots",
        "conference": "AFC",
        "division": "East",
        "hof_row_name": "Boston/New England Patriots",
        "hof_franchise_date_raw": "11/22/59 (AFL)",
        "hof_years_of_operation": "1960-69 (AFL), 1970 (NFL)/1971-present (NFL)",
        "hof_notes": ["HOF alias row: New England Patriots (see Boston Patriots)."],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "new-orleans-saints",
        "name": "New Orleans Saints",
        "conference": "NFC",
        "division": "South",
        "hof_row_name": "New Orleans Saints",
        "hof_franchise_date_raw": "11/1/66",
        "hof_years_of_operation": "1967-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1967",
    },
    {
        "slug": "new-york-giants",
        "name": "New York Giants",
        "conference": "NFC",
        "division": "East",
        "hof_row_name": "New York Giants",
        "hof_franchise_date_raw": "8/1/25",
        "hof_years_of_operation": "1925-present",
        "hof_notes": [
            "HOF also lists a separate one-year 1921 New York Giants club; that is not this franchise.",
        ],
        "wikipedia_first_season_label": "1925",
    },
    {
        "slug": "new-york-jets",
        "name": "New York Jets",
        "conference": "AFC",
        "division": "East",
        "hof_row_name": "New York Titans/Jets",
        "hof_franchise_date_raw": "8/14/59 (AFL)",
        "hof_years_of_operation": "1960-62/1963-69 (AFL), 1970-present",
        "hof_notes": ["HOF alias row: New York Jets (see New York Titans)."],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "philadelphia-eagles",
        "name": "Philadelphia Eagles",
        "conference": "NFC",
        "division": "East",
        "hof_row_name": "Philadelphia Eagles",
        "hof_franchise_date_raw": "7/8/33",
        "hof_years_of_operation": "1933-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1933",
    },
    {
        "slug": "pittsburgh-steelers",
        "name": "Pittsburgh Steelers",
        "conference": "AFC",
        "division": "North",
        "hof_row_name": "Pittsburgh Pirates/Steelers",
        "hof_franchise_date_raw": "7/8/33",
        "hof_years_of_operation": "1933-39/1940-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1933",
    },
    {
        "slug": "san-francisco-49ers",
        "name": "San Francisco 49ers",
        "conference": "NFC",
        "division": "West",
        "hof_row_name": "San Francisco 49ers",
        "hof_franchise_date_raw": "6/4/44 (AAFC)",
        "hof_years_of_operation": "1946-49 (AAFC), 1950-present (NFL)",
        "hof_notes": [],
        "wikipedia_first_season_label": "1946 (AAFC)1950 (NFL)",
    },
    {
        "slug": "seattle-seahawks",
        "name": "Seattle Seahawks",
        "conference": "NFC",
        "division": "West",
        "hof_row_name": "Seattle Seahawks",
        "hof_franchise_date_raw": "6/4/74",
        "hof_years_of_operation": "1976-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1976",
    },
    {
        "slug": "tampa-bay-buccaneers",
        "name": "Tampa Bay Buccaneers",
        "conference": "NFC",
        "division": "South",
        "hof_row_name": "Tampa Bay Buccaneers",
        "hof_franchise_date_raw": "4/24/74",
        "hof_years_of_operation": "1976-present",
        "hof_notes": [],
        "wikipedia_first_season_label": "1976",
    },
    {
        "slug": "tennessee-titans",
        "name": "Tennessee Titans",
        "conference": "AFC",
        "division": "South",
        "hof_row_name": "Houston/Tennessee Oilers/Tennessee Titans",
        "hof_franchise_date_raw": "8/14/59 (AFL)",
        "hof_years_of_operation": "1960-69 (AFL), 1970-1996 (NFL)/1997-1998/1999-present",
        "hof_notes": [
            "HOF alias rows: Tennessee Oilers (see Houston Oilers); Tennessee Titans (see Houston Oilers).",
        ],
        "wikipedia_first_season_label": "1960 (AFL)1970 (NFL)",
    },
    {
        "slug": "washington-commanders",
        "name": "Washington Commanders",
        "conference": "NFC",
        "division": "East",
        "hof_row_name": "Boston Braves/Redskins/ Washington Redskins",
        "hof_franchise_date_raw": "7/9/32",
        "hof_years_of_operation": "1932/1933-36/1937-present",
        "hof_notes": [
            "HOF alias row: Washington Redskins (see Boston Braves). Current name is Washington Commanders; HOF table title still uses historical names.",
        ],
        "wikipedia_first_season_label": "1932",
    },
)


def parse_hof_franchise_date(raw: str) -> tuple[str, str | None]:
    """Normalize an HOF Franchise Date cell to ISO date + optional league mark."""
    trimmed = " ".join(raw.split())
    match = HOF_DATE_RE.fullmatch(trimmed)
    if not match:
        raise ValueError(f"HOF franchise date is not day-precise: {raw!r}")
    month = int(match.group("month"))
    day = int(match.group("day"))
    two_digit_year = int(match.group("year"))
    year = 1900 + two_digit_year if two_digit_year >= 20 else 2000 + two_digit_year
    parsed = date(year, month, day)
    return parsed.isoformat(), match.group("league")


def wikipedia_years(label: str) -> list[int]:
    return [int(match.group(0)) for match in YEAR_RE.finditer(label)]


def year_crosscheck(grant_iso: str, wikipedia_label: str) -> YearCrosscheck:
    grant_year = date.fromisoformat(grant_iso).year
    years = wikipedia_years(wikipedia_label)
    if not years:
        raise ValueError(f"Wikipedia season label has no year: {wikipedia_label!r}")
    oldest = min(years)
    newest = max(years)
    if oldest < grant_year:
        return "wikipedia_lists_older_year"
    if newest > grant_year and grant_year not in years:
        return "grant_precedes_first_season"
    if grant_year in years:
        return "year_mentioned"
    if newest > grant_year:
        return "grant_precedes_first_season"
    return "year_mentioned"


def parse_card_symbol(symbol: str) -> dict[str, Any]:
    if symbol == "Joker":
        return {
            "kind": "joker",
            "rank": "joker",
            "suit": None,
            "label": "Joker",
            "slug": "joker",
        }
    if len(symbol) < 2:
        raise ValueError(f"invalid card symbol: {symbol!r}")
    suit_mark = symbol[-1]
    rank = symbol[:-1]
    suit = SUIT_FROM_SYMBOL.get(suit_mark)
    if suit is None:
        raise ValueError(f"invalid suit in {symbol!r}")
    rank_slug = RANK_SLUG.get(rank, rank.lower())
    rank_label = {
        "A": "Ace",
        "J": "Jack",
        "Q": "Queen",
        "K": "King",
    }.get(rank, rank)
    suit_label = {
        "hearts": "Hearts",
        "clubs": "Clubs",
        "diamonds": "Diamonds",
        "spades": "Spades",
    }[suit]
    return {
        "kind": "card",
        "rank": rank,
        "suit": suit,
        "label": f"{rank_label} of {suit_label}",
        "slug": f"{rank_slug}-of-{suit}",
    }


def load_card_meanings() -> dict[str, dict[str, Any]]:
    return json.loads(CARD_MEANINGS_PATH.read_text(encoding="utf-8"))


def build_franchise_rows() -> list[dict[str, Any]]:
    meanings = load_card_meanings()
    drafts: list[dict[str, Any]] = []

    for seed in CURRENT_32:
        grant_iso, league = parse_hof_franchise_date(seed["hof_franchise_date_raw"])
        parsed = date.fromisoformat(grant_iso)
        symbol = birth_card(parsed.month, parsed.day)
        value = solar_value(parsed.month, parsed.day)
        parsed_card = parse_card_symbol(symbol)
        meaning = meanings.get(symbol)
        if meaning is None:
            raise KeyError(f"No harvested meaning for {symbol}")

        card = {
            **parsed_card,
            "symbol": symbol,
            "label": meaning["label"],
            "slug": meaning["slug"],
            "archetype": meaning["title"],
            "meaning_page": meaning["page"],
            "core_identity": meaning["core_identity"],
            "sweet_spot": meaning["sweet_spot"],
            "life_direction": meaning["life_direction"],
        }

        drafts.append(
            {
                "slug": seed["slug"],
                "name": seed["name"],
                "conference": seed["conference"],
                "division": seed["division"],
                "grant_date": grant_iso,
                "grant_date_precision": "day",
                "grant_date_status": "verified",
                "hof_row_name": seed["hof_row_name"],
                "hof_franchise_date_raw": seed["hof_franchise_date_raw"],
                "hof_years_of_operation": seed["hof_years_of_operation"],
                "hof_league_mark": league,
                "hof_notes": list(seed["hof_notes"]),
                "wikipedia_first_season_label": seed["wikipedia_first_season_label"],
                "wikipedia_years": wikipedia_years(seed["wikipedia_first_season_label"]),
                "year_crosscheck": year_crosscheck(
                    grant_iso, seed["wikipedia_first_season_label"]
                ),
                "solar_value": value,
                "card": card,
                "afl_1959_08_14_quintet": seed["slug"] in AFL_1959_08_14_SLUGS,
                "sources": [
                    {
                        "name": HOF_SOURCE_NAME,
                        "url": HOF_SOURCE_URL,
                        "role": "primary_grant_date",
                        "retrieved": RETRIEVED_ON,
                    },
                    {
                        "name": WIKIPEDIA_SOURCE_NAME,
                        "url": WIKIPEDIA_NFL_URL,
                        "role": "year_crosscheck_only",
                        "license": "CC BY-SA 4.0",
                        "retrieved": RETRIEVED_ON,
                    },
                ],
            }
        )

    by_card: dict[str, list[str]] = {}
    by_month_day: dict[str, list[str]] = {}
    for row in drafts:
        symbol = row["card"]["symbol"]
        month_day = row["grant_date"][5:]
        by_card.setdefault(symbol, []).append(row["slug"])
        by_month_day.setdefault(month_day, []).append(row["slug"])

    for row in drafts:
        symbol = row["card"]["symbol"]
        month_day = row["grant_date"][5:]
        row["same_card_slugs"] = [slug for slug in by_card[symbol] if slug != row["slug"]]
        row["same_grant_day_slugs"] = [
            slug for slug in by_month_day[month_day] if slug != row["slug"]
        ]

    drafts.sort(key=lambda row: (row["grant_date"], row["name"]))
    return drafts


def snapshot_document(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "source": {
            "name": HOF_SOURCE_NAME,
            "url": HOF_SOURCE_URL,
            "retrieved": RETRIEVED_ON,
            "rule": (
                "Franchise Date column is the grant date through relocations and renames. "
                "Not first kickoff. Not 1919 Packers lore."
            ),
        },
        "wikipedia_crosscheck": {
            "name": WIKIPEDIA_SOURCE_NAME,
            "url": WIKIPEDIA_NFL_URL,
            "license": "CC BY-SA 4.0",
            "retrieved": RETRIEVED_ON,
            "note": "Year column from the NFL teams table only. Never used as the grant date.",
        },
        "verified_samples": VERIFIED_SAMPLES,
        "afl_1959_08_14_quintet": list(AFL_1959_08_14_SLUGS),
        "current_32": [
            {
                "slug": row["slug"],
                "name": row["name"],
                "hof_row_name": row["hof_row_name"],
                "hof_franchise_date_raw": row["hof_franchise_date_raw"],
                "grant_date": row["grant_date"],
                "hof_years_of_operation": row["hof_years_of_operation"],
                "hof_notes": row["hof_notes"],
                "wikipedia_first_season_label": row["wikipedia_first_season_label"],
                "year_crosscheck": row["year_crosscheck"],
            }
            for row in rows
        ],
    }


def write_franchise_dataset(
    jsonl_path: Path = FRANCHISES_JSONL,
    snapshot_path: Path = HOF_SNAPSHOT,
) -> list[dict[str, Any]]:
    rows = build_franchise_rows()
    if len(rows) != 32:
        raise RuntimeError(f"expected 32 current franchises, got {len(rows)}")
    for slug, expected in VERIFIED_SAMPLES.items():
        match = next(row for row in rows if row["slug"] == slug)
        if match["grant_date"] != expected:
            raise RuntimeError(f"{slug}: expected {expected}, got {match['grant_date']}")

    jsonl_path.parent.mkdir(parents=True, exist_ok=True)
    jsonl_path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )
    snapshot_path.write_text(
        json.dumps(snapshot_document(rows), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return rows


def load_franchises_jsonl(path: Path = FRANCHISES_JSONL) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        trimmed = line.strip()
        if not trimmed:
            continue
        rows.append(json.loads(trimmed))
        if not ISO_DATE_RE.fullmatch(rows[-1]["grant_date"]):
            raise ValueError(f"{path}:{line_no} grant_date is not ISO")
    return rows
