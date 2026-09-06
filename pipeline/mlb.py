"""MLB franchise first-game dates for isolated SEO pages.

Primary dates are Baseball-Reference franchise first MLB games — the first
regular-season box of the season BBRef lists as the club's "From" year.
That date travels with the franchise through later city moves and renames.
It is not a player date of birth, not a current-city first pitch, and not
National Association / local founding lore.

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
from pipeline.franchises import load_card_meanings, parse_card_symbol

ROOT = Path(__file__).resolve().parents[1]
MLB_JSONL = Path(__file__).resolve().parent / "data" / "mlb.jsonl"
MLB_SNAPSHOT = Path(__file__).resolve().parent / "data" / "mlb_first_games.json"

BBREF_TEAMS_URL = "https://www.baseball-reference.com/teams/"
BBREF_SOURCE_NAME = "Baseball-Reference — franchise first MLB game"
RETROSHEET_SOURCE_NAME = "Retrosheet — first-season game log"
WIKIPEDIA_MLB_URL = "https://en.wikipedia.org/wiki/Major_League_Baseball"
WIKIPEDIA_SOURCE_NAME = "Wikipedia — Major League Baseball teams table"
RETRIEVED_ON = "2026-09-06"

ISO_DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
YEAR_RE = re.compile(r"\b(18|19|20)\d{2}\b")

YearCrosscheck = Literal[
    "year_mentioned",
    "first_game_precedes_wikipedia_join",
    "wikipedia_lists_older_year",
]

EXPANSION_1969_04_08_SLUGS = (
    "kansas-city-royals",
    "milwaukee-brewers",
    "san-diego-padres",
    "washington-nationals",
)

AA_1882_05_02_SLUGS = (
    "cincinnati-reds",
    "pittsburgh-pirates",
    "st-louis-cardinals",
)

VERIFIED_SAMPLES = {
    "atlanta-braves": "1876-04-22",
    "chicago-cubs": "1876-04-25",
    "new-york-yankees": "1903-04-22",
    "washington-nationals": "1969-04-08",
    "arizona-diamondbacks": "1998-03-31",
}


class MlbSeed(TypedDict):
    slug: str
    name: str
    league: str
    division: str
    bbref_code: str
    bbref_first_season_code: str
    first_game: str
    first_season_name: str
    first_game_line: str
    retrosheet_url: str
    wikipedia_first_season_label: str
    notes: list[str]


# Current 30 clubs. Date is BBRef/Retrosheet first regular-season MLB game
# of the franchise's BBRef "From" year — not player DOB, not current-city debut.
CURRENT_30: tuple[MlbSeed, ...] = (
    {
        "slug": "arizona-diamondbacks",
        "name": "Arizona Diamondbacks",
        "league": "NL",
        "division": "West",
        "bbref_code": "ARI",
        "bbref_first_season_code": "ARI",
        "first_game": "1998-03-31",
        "first_season_name": "Arizona Diamondbacks",
        "first_game_line": "1998-03-31 vs Colorado Rockies (Chase Field / Bank One Ballpark)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1998/VARI01998.htm",
        "wikipedia_first_season_label": "1998",
        "notes": [],
    },
    {
        "slug": "athletics",
        "name": "Athletics",
        "league": "AL",
        "division": "West",
        "bbref_code": "OAK",
        "bbref_first_season_code": "PHA",
        "first_game": "1901-04-26",
        "first_season_name": "Philadelphia Athletics",
        "first_game_line": "1901-04-26 vs Washington Senators (Columbia Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VPHA01901.htm",
        "wikipedia_first_season_label": "1901*",
        "notes": [
            "BBRef first game is the 1901 Philadelphia Athletics opener. The coordinate stays through Kansas City, Oakland, and the current Athletics marketing name.",
        ],
    },
    {
        "slug": "atlanta-braves",
        "name": "Atlanta Braves",
        "league": "NL",
        "division": "East",
        "bbref_code": "ATL",
        "bbref_first_season_code": "BSN",
        "first_game": "1876-04-22",
        "first_season_name": "Boston Red Caps",
        "first_game_line": "1876-04-22 at Philadelphia Athletics (Jefferson Street Grounds) — first National League game",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1876/VBSN01876.htm",
        "wikipedia_first_season_label": "1871* (NA) 1876 (NL)",
        "notes": [
            "BBRef franchise start is the 1876 National League. Wikipedia also lists 1871 National Association; that older year is not mapped.",
        ],
    },
    {
        "slug": "baltimore-orioles",
        "name": "Baltimore Orioles",
        "league": "AL",
        "division": "East",
        "bbref_code": "BAL",
        "bbref_first_season_code": "MLA",
        "first_game": "1901-04-25",
        "first_season_name": "Milwaukee Brewers",
        "first_game_line": "1901-04-25 at Detroit Tigers (Bennett Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VMLA01901.htm",
        "wikipedia_first_season_label": "1901*",
        "notes": [
            "First MLB game is the 1901 Milwaukee Brewers (AL) opener. The franchise later played as the St. Louis Browns and the Baltimore Orioles.",
        ],
    },
    {
        "slug": "boston-red-sox",
        "name": "Boston Red Sox",
        "league": "AL",
        "division": "East",
        "bbref_code": "BOS",
        "bbref_first_season_code": "BOS",
        "first_game": "1901-04-26",
        "first_season_name": "Boston Americans",
        "first_game_line": "1901-04-26 at Baltimore Orioles (American League Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VBOS01901.htm",
        "wikipedia_first_season_label": "1901",
        "notes": [],
    },
    {
        "slug": "chicago-cubs",
        "name": "Chicago Cubs",
        "league": "NL",
        "division": "Central",
        "bbref_code": "CHC",
        "bbref_first_season_code": "CHC",
        "first_game": "1876-04-25",
        "first_season_name": "Chicago White Stockings",
        "first_game_line": "1876-04-25 at Louisville Grays (Louisville Baseball Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1876/VCHN01876.htm",
        "wikipedia_first_season_label": "1870 (NABBP) 1876 (NL)",
        "notes": [
            "BBRef franchise start is the 1876 National League. Wikipedia also lists 1870 NABBP; that older year is not mapped.",
        ],
    },
    {
        "slug": "chicago-white-sox",
        "name": "Chicago White Sox",
        "league": "AL",
        "division": "Central",
        "bbref_code": "CHW",
        "bbref_first_season_code": "CHW",
        "first_game": "1901-04-24",
        "first_season_name": "Chicago White Stockings",
        "first_game_line": "1901-04-24 vs Cleveland Blues (South Side Park) — first American League game",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VCHA01901.htm",
        "wikipedia_first_season_label": "1901",
        "notes": [],
    },
    {
        "slug": "cincinnati-reds",
        "name": "Cincinnati Reds",
        "league": "NL",
        "division": "Central",
        "bbref_code": "CIN",
        "bbref_first_season_code": "CIN",
        "first_game": "1882-05-02",
        "first_season_name": "Cincinnati Red Stockings",
        "first_game_line": "1882-05-02 vs Pittsburgh Alleghenys (Bank Street Grounds)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1882/VCN201882.htm",
        "wikipedia_first_season_label": "1882 (AA) 1890 (NL)",
        "notes": [
            "This is the 1882 American Association club. It is not the 1876–1879 National League Cincinnati Reds.",
        ],
    },
    {
        "slug": "cleveland-guardians",
        "name": "Cleveland Guardians",
        "league": "AL",
        "division": "Central",
        "bbref_code": "CLE",
        "bbref_first_season_code": "CLE",
        "first_game": "1901-04-24",
        "first_season_name": "Cleveland Blues",
        "first_game_line": "1901-04-24 at Chicago White Stockings (South Side Park) — first American League game",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VCLE01901.htm",
        "wikipedia_first_season_label": "1901",
        "notes": [],
    },
    {
        "slug": "colorado-rockies",
        "name": "Colorado Rockies",
        "league": "NL",
        "division": "West",
        "bbref_code": "COL",
        "bbref_first_season_code": "COL",
        "first_game": "1993-04-05",
        "first_season_name": "Colorado Rockies",
        "first_game_line": "1993-04-05 at New York Mets (Shea Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1993/VCOL01993.htm",
        "wikipedia_first_season_label": "1993",
        "notes": [],
    },
    {
        "slug": "detroit-tigers",
        "name": "Detroit Tigers",
        "league": "AL",
        "division": "Central",
        "bbref_code": "DET",
        "bbref_first_season_code": "DET",
        "first_game": "1901-04-25",
        "first_season_name": "Detroit Tigers",
        "first_game_line": "1901-04-25 vs Milwaukee Brewers (Bennett Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VDET01901.htm",
        "wikipedia_first_season_label": "1901",
        "notes": [],
    },
    {
        "slug": "houston-astros",
        "name": "Houston Astros",
        "league": "AL",
        "division": "West",
        "bbref_code": "HOU",
        "bbref_first_season_code": "HOU",
        "first_game": "1962-04-10",
        "first_season_name": "Houston Colt .45s",
        "first_game_line": "1962-04-10 vs Chicago Cubs (Colt Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1962/VHOU01962.htm",
        "wikipedia_first_season_label": "1962 (NL) 2013 (AL)",
        "notes": [
            "First MLB game is the 1962 Colt .45s National League opener. The later American League move does not reset the coordinate.",
        ],
    },
    {
        "slug": "kansas-city-royals",
        "name": "Kansas City Royals",
        "league": "AL",
        "division": "Central",
        "bbref_code": "KCR",
        "bbref_first_season_code": "KCR",
        "first_game": "1969-04-08",
        "first_season_name": "Kansas City Royals",
        "first_game_line": "1969-04-08 vs Minnesota Twins (Municipal Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1969/VKCA01969.htm",
        "wikipedia_first_season_label": "1969",
        "notes": [],
    },
    {
        "slug": "los-angeles-angels",
        "name": "Los Angeles Angels",
        "league": "AL",
        "division": "West",
        "bbref_code": "LAA",
        "bbref_first_season_code": "LAA",
        "first_game": "1961-04-11",
        "first_season_name": "Los Angeles Angels",
        "first_game_line": "1961-04-11 at Baltimore Orioles (Memorial Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1961/VLAA01961.htm",
        "wikipedia_first_season_label": "1961",
        "notes": [],
    },
    {
        "slug": "los-angeles-dodgers",
        "name": "Los Angeles Dodgers",
        "league": "NL",
        "division": "West",
        "bbref_code": "LAD",
        "bbref_first_season_code": "BRO",
        "first_game": "1884-05-01",
        "first_season_name": "Brooklyn Atlantics",
        "first_game_line": "1884-05-01 at Washington Nationals (AA) (Athletic Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1884/VBR301884.htm",
        "wikipedia_first_season_label": "1884* (AA) 1890 (NL)",
        "notes": [
            "BBRef first game is the 1884 Brooklyn American Association opener, kept through the move to Los Angeles.",
        ],
    },
    {
        "slug": "miami-marlins",
        "name": "Miami Marlins",
        "league": "NL",
        "division": "East",
        "bbref_code": "MIA",
        "bbref_first_season_code": "FLA",
        "first_game": "1993-04-05",
        "first_season_name": "Florida Marlins",
        "first_game_line": "1993-04-05 vs Los Angeles Dodgers (Joe Robbie Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1993/VFLO01993.htm",
        "wikipedia_first_season_label": "1993",
        "notes": [],
    },
    {
        "slug": "milwaukee-brewers",
        "name": "Milwaukee Brewers",
        "league": "NL",
        "division": "Central",
        "bbref_code": "MIL",
        "bbref_first_season_code": "SEP",
        "first_game": "1969-04-08",
        "first_season_name": "Seattle Pilots",
        "first_game_line": "1969-04-08 at California Angels (Angel Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1969/VSE101969.htm",
        "wikipedia_first_season_label": "1969* (AL) 1998 (NL)",
        "notes": [
            "First MLB game is the 1969 Seattle Pilots opener. The later Milwaukee and National League chapters do not reset the coordinate.",
        ],
    },
    {
        "slug": "minnesota-twins",
        "name": "Minnesota Twins",
        "league": "AL",
        "division": "Central",
        "bbref_code": "MIN",
        "bbref_first_season_code": "WSH",
        "first_game": "1901-04-26",
        "first_season_name": "Washington Senators",
        "first_game_line": "1901-04-26 at Philadelphia Athletics (Columbia Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1901/VWS101901.htm",
        "wikipedia_first_season_label": "1901*",
        "notes": [
            "First MLB game is the original 1901 Washington Senators opener, not the 1961 expansion Senators (Texas Rangers).",
        ],
    },
    {
        "slug": "new-york-mets",
        "name": "New York Mets",
        "league": "NL",
        "division": "East",
        "bbref_code": "NYM",
        "bbref_first_season_code": "NYM",
        "first_game": "1962-04-11",
        "first_season_name": "New York Mets",
        "first_game_line": "1962-04-11 at St. Louis Cardinals (Sportsman's Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1962/VNYN01962.htm",
        "wikipedia_first_season_label": "1962",
        "notes": [],
    },
    {
        "slug": "new-york-yankees",
        "name": "New York Yankees",
        "league": "AL",
        "division": "East",
        "bbref_code": "NYY",
        "bbref_first_season_code": "NYY",
        "first_game": "1903-04-22",
        "first_season_name": "New York Highlanders",
        "first_game_line": "1903-04-22 at Washington Senators (American League Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1903/VNYA01903.htm",
        "wikipedia_first_season_label": "1903",
        "notes": [
            "BBRef franchise start is 1903 (Highlanders). The 1901 Baltimore Orioles club is not this first-game date.",
        ],
    },
    {
        "slug": "philadelphia-phillies",
        "name": "Philadelphia Phillies",
        "league": "NL",
        "division": "East",
        "bbref_code": "PHI",
        "bbref_first_season_code": "PHI",
        "first_game": "1883-05-01",
        "first_season_name": "Philadelphia Quakers",
        "first_game_line": "1883-05-01 vs Providence Grays (Recreation Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1883/VPHI01883.htm",
        "wikipedia_first_season_label": "1883",
        "notes": [],
    },
    {
        "slug": "pittsburgh-pirates",
        "name": "Pittsburgh Pirates",
        "league": "NL",
        "division": "Central",
        "bbref_code": "PIT",
        "bbref_first_season_code": "PIT",
        "first_game": "1882-05-02",
        "first_season_name": "Pittsburgh Alleghenys",
        "first_game_line": "1882-05-02 at Cincinnati Red Stockings (Bank Street Grounds)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1882/VPT101882.htm",
        "wikipedia_first_season_label": "1882 (AA) 1887 (NL)",
        "notes": [],
    },
    {
        "slug": "san-diego-padres",
        "name": "San Diego Padres",
        "league": "NL",
        "division": "West",
        "bbref_code": "SDP",
        "bbref_first_season_code": "SDP",
        "first_game": "1969-04-08",
        "first_season_name": "San Diego Padres",
        "first_game_line": "1969-04-08 vs Houston Astros (San Diego Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1969/VSDN01969.htm",
        "wikipedia_first_season_label": "1969",
        "notes": [],
    },
    {
        "slug": "san-francisco-giants",
        "name": "San Francisco Giants",
        "league": "NL",
        "division": "West",
        "bbref_code": "SFG",
        "bbref_first_season_code": "NYG",
        "first_game": "1883-05-01",
        "first_season_name": "New York Gothams",
        "first_game_line": "1883-05-01 vs Boston Beaneaters (Polo Grounds)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1883/VNY101883.htm",
        "wikipedia_first_season_label": "1883*",
        "notes": [
            "BBRef first game is the 1883 New York Gothams National League opener, kept through the move to San Francisco.",
        ],
    },
    {
        "slug": "seattle-mariners",
        "name": "Seattle Mariners",
        "league": "AL",
        "division": "West",
        "bbref_code": "SEA",
        "bbref_first_season_code": "SEA",
        "first_game": "1977-04-06",
        "first_season_name": "Seattle Mariners",
        "first_game_line": "1977-04-06 vs California Angels (Kingdome)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1977/VSEA01977.htm",
        "wikipedia_first_season_label": "1977",
        "notes": [
            "This is the 1977 Mariners debut, not the 1969 Seattle Pilots game used for the Milwaukee Brewers.",
        ],
    },
    {
        "slug": "st-louis-cardinals",
        "name": "St. Louis Cardinals",
        "league": "NL",
        "division": "Central",
        "bbref_code": "STL",
        "bbref_first_season_code": "STL",
        "first_game": "1882-05-02",
        "first_season_name": "St. Louis Brown Stockings",
        "first_game_line": "1882-05-02 vs Louisville Eclipse (Sportsman's Park)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1882/VSL401882.htm",
        "wikipedia_first_season_label": "1882 (AA) 1892 (NL)",
        "notes": [
            "BBRef first game is the 1882 American Association Browns opener. Earlier Brown Stockings chapters are not mapped.",
        ],
    },
    {
        "slug": "tampa-bay-rays",
        "name": "Tampa Bay Rays",
        "league": "AL",
        "division": "East",
        "bbref_code": "TBR",
        "bbref_first_season_code": "TBD",
        "first_game": "1998-03-31",
        "first_season_name": "Tampa Bay Devil Rays",
        "first_game_line": "1998-03-31 vs Detroit Tigers (Tropicana Field)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1998/VTBA01998.htm",
        "wikipedia_first_season_label": "1998",
        "notes": [],
    },
    {
        "slug": "texas-rangers",
        "name": "Texas Rangers",
        "league": "AL",
        "division": "West",
        "bbref_code": "TEX",
        "bbref_first_season_code": "WSA",
        "first_game": "1961-04-10",
        "first_season_name": "Washington Senators",
        "first_game_line": "1961-04-10 vs Chicago White Sox (Griffith Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1961/VWS201961.htm",
        "wikipedia_first_season_label": "1961*",
        "notes": [
            "First MLB game is the 1961 expansion Washington Senators opener, not the original 1901 Senators (Minnesota Twins).",
        ],
    },
    {
        "slug": "toronto-blue-jays",
        "name": "Toronto Blue Jays",
        "league": "AL",
        "division": "East",
        "bbref_code": "TOR",
        "bbref_first_season_code": "TOR",
        "first_game": "1977-04-07",
        "first_season_name": "Toronto Blue Jays",
        "first_game_line": "1977-04-07 vs Chicago White Sox (Exhibition Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1977/VTOR01977.htm",
        "wikipedia_first_season_label": "1977",
        "notes": [],
    },
    {
        "slug": "washington-nationals",
        "name": "Washington Nationals",
        "league": "NL",
        "division": "East",
        "bbref_code": "WSN",
        "bbref_first_season_code": "MON",
        "first_game": "1969-04-08",
        "first_season_name": "Montreal Expos",
        "first_game_line": "1969-04-08 at New York Mets (Shea Stadium)",
        "retrosheet_url": "https://www.retrosheet.org/boxesetc/1969/VMON01969.htm",
        "wikipedia_first_season_label": "1969*",
        "notes": [
            "First MLB game is the 1969 Montreal Expos opener. The later Washington chapter does not reset the coordinate.",
        ],
    },
)


def bbref_first_season_url(code: str, year: int) -> str:
    return f"https://www.baseball-reference.com/teams/{code}/{year}-schedule-scores.shtml"


def bbref_franchise_url(code: str) -> str:
    return f"https://www.baseball-reference.com/teams/{code}/"


def wikipedia_years(label: str) -> list[int]:
    return [int(match.group(0)) for match in YEAR_RE.finditer(label)]


def year_crosscheck(first_iso: str, wikipedia_label: str) -> YearCrosscheck:
    first_year = date.fromisoformat(first_iso).year
    years = wikipedia_years(wikipedia_label)
    if not years:
        raise ValueError(f"Wikipedia season label has no year: {wikipedia_label!r}")
    oldest = min(years)
    newest = max(years)
    if oldest < first_year:
        return "wikipedia_lists_older_year"
    if newest > first_year and first_year not in years:
        return "first_game_precedes_wikipedia_join"
    if first_year in years:
        return "year_mentioned"
    if newest > first_year:
        return "first_game_precedes_wikipedia_join"
    return "year_mentioned"


def build_mlb_rows() -> list[dict[str, Any]]:
    meanings = load_card_meanings()
    drafts: list[dict[str, Any]] = []

    for seed in CURRENT_30:
        first_iso = seed["first_game"]
        if not ISO_DATE_RE.fullmatch(first_iso):
            raise ValueError(f"{seed['slug']}: first_game is not day-precise ISO: {first_iso!r}")
        parsed = date.fromisoformat(first_iso)
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
                "league": seed["league"],
                "division": seed["division"],
                "first_game": first_iso,
                "first_game_precision": "day",
                "first_game_status": "verified",
                "first_season_name": seed["first_season_name"],
                "first_game_line": seed["first_game_line"],
                "bbref_code": seed["bbref_code"],
                "bbref_first_season_code": seed["bbref_first_season_code"],
                "bbref_first_season_url": bbref_first_season_url(
                    seed["bbref_first_season_code"], parsed.year
                ),
                "bbref_franchise_url": bbref_franchise_url(seed["bbref_code"]),
                "retrosheet_url": seed["retrosheet_url"],
                "notes": list(seed["notes"]),
                "wikipedia_first_season_label": seed["wikipedia_first_season_label"],
                "wikipedia_years": wikipedia_years(seed["wikipedia_first_season_label"]),
                "year_crosscheck": year_crosscheck(
                    first_iso, seed["wikipedia_first_season_label"]
                ),
                "solar_value": value,
                "card": card,
                "expansion_1969_04_08_quartet": seed["slug"] in EXPANSION_1969_04_08_SLUGS,
                "aa_1882_05_02_trio": seed["slug"] in AA_1882_05_02_SLUGS,
                "sources": [
                    {
                        "name": BBREF_SOURCE_NAME,
                        "url": bbref_first_season_url(
                            seed["bbref_first_season_code"], parsed.year
                        ),
                        "role": "primary_first_game",
                        "retrieved": RETRIEVED_ON,
                    },
                    {
                        "name": RETROSHEET_SOURCE_NAME,
                        "url": seed["retrosheet_url"],
                        "role": "game_log_corroboration",
                        "license": "public domain",
                        "retrieved": RETRIEVED_ON,
                    },
                    {
                        "name": WIKIPEDIA_SOURCE_NAME,
                        "url": WIKIPEDIA_MLB_URL,
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
        month_day = row["first_game"][5:]
        by_card.setdefault(symbol, []).append(row["slug"])
        by_month_day.setdefault(month_day, []).append(row["slug"])

    for row in drafts:
        symbol = row["card"]["symbol"]
        month_day = row["first_game"][5:]
        row["same_card_slugs"] = [slug for slug in by_card[symbol] if slug != row["slug"]]
        row["same_first_game_day_slugs"] = [
            slug for slug in by_month_day[month_day] if slug != row["slug"]
        ]

    drafts.sort(key=lambda row: (row["first_game"], row["name"]))
    return drafts


def snapshot_document(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "source": {
            "name": BBREF_SOURCE_NAME,
            "url": BBREF_TEAMS_URL,
            "retrieved": RETRIEVED_ON,
            "rule": (
                "First regular-season MLB game of the franchise's Baseball-Reference "
                "'From' year. Travels through relocations and renames. Not player DOB. "
                "Not current-city first pitch. Not National Association lore."
            ),
        },
        "retrosheet_corroboration": {
            "name": RETROSHEET_SOURCE_NAME,
            "license": "public domain",
            "retrieved": RETRIEVED_ON,
            "note": "First-season game logs confirm the BBRef first-game calendar day.",
        },
        "wikipedia_crosscheck": {
            "name": WIKIPEDIA_SOURCE_NAME,
            "url": WIKIPEDIA_MLB_URL,
            "license": "CC BY-SA 4.0",
            "retrieved": RETRIEVED_ON,
            "note": "Founded / Joined year columns only. Never used as the first-game date.",
        },
        "verified_samples": VERIFIED_SAMPLES,
        "expansion_1969_04_08_quartet": list(EXPANSION_1969_04_08_SLUGS),
        "aa_1882_05_02_trio": list(AA_1882_05_02_SLUGS),
        "kept": 30,
        "excluded": [],
        "current_30": [
            {
                "slug": row["slug"],
                "name": row["name"],
                "first_season_name": row["first_season_name"],
                "first_game": row["first_game"],
                "bbref_first_season_code": row["bbref_first_season_code"],
                "wikipedia_first_season_label": row["wikipedia_first_season_label"],
                "year_crosscheck": row["year_crosscheck"],
                "card": row["card"]["symbol"],
            }
            for row in rows
        ],
    }


def write_mlb_dataset(
    jsonl_path: Path = MLB_JSONL,
    snapshot_path: Path = MLB_SNAPSHOT,
) -> list[dict[str, Any]]:
    rows = build_mlb_rows()
    if len(rows) != 30:
        raise RuntimeError(f"expected 30 current MLB clubs, got {len(rows)}")
    for slug, expected in VERIFIED_SAMPLES.items():
        match = next(row for row in rows if row["slug"] == slug)
        if match["first_game"] != expected:
            raise RuntimeError(f"{slug}: expected {expected}, got {match['first_game']}")

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


def load_mlb_jsonl(path: Path = MLB_JSONL) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        trimmed = line.strip()
        if not trimmed:
            continue
        rows.append(json.loads(trimmed))
        if not ISO_DATE_RE.fullmatch(rows[-1]["first_game"]):
            raise ValueError(f"{path}:{line_no} first_game is not ISO")
    return rows
