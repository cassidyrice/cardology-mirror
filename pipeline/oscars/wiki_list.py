"""Parse Best Actor / Best Actress winners from Wikipedia award lists.

Winner identity comes from the official AMPAS ceremony pages cited on
Wikipedia (oscars.org/oscars/ceremonies/{year}) plus the Wikipedia
winner tables. Birth dates are not on these lists.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

BEST_ACTOR_TITLE = "Academy_Award_for_Best_Actor"
BEST_ACTRESS_TITLE = "Academy_Award_for_Best_Actress"
BEST_ACTOR_URL = "https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actor"
BEST_ACTRESS_URL = "https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actress"
OSCARS_HOME = "https://www.oscars.org/"
OSCARS_DATABASE = "https://awardsdatabase.oscars.org/"

CATEGORIES = (
    {
        "id": "best-actor",
        "label": "Best Actor",
        "title": BEST_ACTOR_TITLE,
        "url": BEST_ACTOR_URL,
    },
    {
        "id": "best-actress",
        "label": "Best Actress",
        "title": BEST_ACTRESS_TITLE,
        "url": BEST_ACTRESS_URL,
    },
)

_WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_YEAR_HEADER_RE = re.compile(
    r"^!\s*(?:scope=\"row\"\s*)?(?:rowspan(?:=\"?\d+\"?)?\s*)?(?:scope=\"row\"\s*)?"
    r"[^|]*\|\s*(.+)$",
    re.IGNORECASE | re.MULTILINE,
)
_CEREMONY_RE = re.compile(
    r"\[\[(\d+)(?:st|nd|rd|th) Academy Awards\|",
    re.IGNORECASE,
)
_FILM_YEAR_RE = re.compile(r"\[\[(\d{4}) in film\|", re.IGNORECASE)
_OSCARS_URL_RE = re.compile(
    r"https?://(?:www\.)?oscars\.org/oscars/ceremonies/(\d{4})",
    re.IGNORECASE,
)
_WINNER_MARK_RE = re.compile(
    r"(?:\{\{double dagger\|alt=Award winner\}\}|§|(?<!\[)†(?!\]))",
    re.IGNORECASE,
)
_SORT_NAME_RE = re.compile(
    r"\{\{sort\|[^}|]+\|\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]",
    re.IGNORECASE,
)
_WIKILINK_NAME_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_FILM_RE = re.compile(
    r"''\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]''",
)
_SORT_FILM_RE = re.compile(
    r"\{\{sort\|[^}|]+\|''\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]''\}\}",
    re.IGNORECASE,
)
_SORT_BARE_FILM_RE = re.compile(
    r"\{\{sort\|[^}|]+\|\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]\}\}",
    re.IGNORECASE,
)
_BARE_ITALIC_FILM_RE = re.compile(r"'{5}\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]'{5}")

# Tables after the legend; the first sortable table is the 1920s winners.
_TABLE_SPLIT_RE = re.compile(r"\{\| class=\"wikitable sortable\"")


def _wikilink_parts(title: str, display: str | None) -> tuple[str, str]:
    page = title.replace("_", " ").strip()
    label = (display or page).strip()
    label = re.sub(r"'{2,}", "", label)
    label = re.sub(r"<[^>]+>", "", label)
    label = re.sub(r"\s+", " ", label).strip()
    return page, label


def parse_year_header(chunk: str) -> dict[str, Any] | None:
    if "Academy Awards" not in chunk:
        return None
    match = _YEAR_HEADER_RE.search(chunk)
    if not match:
        return None
    header = match.group(1)
    ceremony = _CEREMONY_RE.search(header) or _CEREMONY_RE.search(chunk)
    if not ceremony:
        return None
    film_years = _FILM_YEAR_RE.findall(header) or _FILM_YEAR_RE.findall(chunk)
    oscars = _OSCARS_URL_RE.search(chunk)
    ceremony_number = int(ceremony.group(1))
    ceremony_year = int(oscars.group(1)) if oscars else 1928 + ceremony_number
    film_year = film_years[-1] if film_years else None
    oscars_url = f"https://www.oscars.org/oscars/ceremonies/{ceremony_year}"
    return {
        "ceremony_number": ceremony_number,
        "ceremony_year": ceremony_year,
        "film_year": film_year,
        "film_years": film_years,
        "oscars_url": oscars_url,
    }


def _is_winner_row(chunk: str) -> bool:
    if "#FAEB86" not in chunk.upper() and "background:#FAEB86" not in chunk:
        return False
    return _WINNER_MARK_RE.search(chunk) is not None


def _winner_name_cell(chunk: str) -> str:
    for line in chunk.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("|") and _WINNER_MARK_RE.search(stripped):
            return stripped
    return chunk


def parse_winner_name(cell: str) -> tuple[str, str] | None:
    if not _is_winner_row(cell):
        return None
    focus = _winner_name_cell(cell)
    match = _SORT_NAME_RE.search(focus)
    if match:
        return _wikilink_parts(match.group(1), match.group(2))
    for match in _WIKILINK_NAME_RE.finditer(focus):
        title, name = _wikilink_parts(match.group(1), match.group(2))
        lowered = title.lower()
        if "academy awards" in lowered or lowered.endswith(" in film"):
            continue
        return title, name
    return None


def parse_film_title(chunk: str, *, skip_titles: set[str] | None = None) -> str | None:
    skip = {item.lower() for item in (skip_titles or set())}
    for pattern in (_SORT_FILM_RE, _BARE_ITALIC_FILM_RE, _FILM_RE, _SORT_BARE_FILM_RE):
        for match in pattern.finditer(chunk):
            page, label = _wikilink_parts(match.group(1), match.group(2))
            if not label:
                continue
            if page.lower() in skip or label.lower() in skip:
                continue
            return label
    return None


def _winner_tables(wikitext: str) -> str:
    """Keep only the decade winner tables, not later recap tables."""
    start = wikitext.find('{| class="wikitable sortable"')
    if start < 0:
        return wikitext
    # Multiple-nomination recap tables start after the last decade section.
    end_markers = (
        "\n==Multiple awards and nominations==",
        "\n==Multiple nominations and awards==",
        "\n==Multiple nominations==",
        "\n==Films with multiple",
        "\n==Age superlatives==",
        "\n==See also==",
    )
    end = len(wikitext)
    for marker in end_markers:
        idx = wikitext.find(marker, start)
        if 0 <= idx < end:
            end = idx
    return wikitext[start:end]


def parse_winners_wikitext(wikitext: str, *, category: str, category_id: str) -> list[dict[str, Any]]:
    body = _winner_tables(wikitext)
    rows: list[dict[str, Any]] = []
    current_year: dict[str, Any] | None = None

    chunks = re.split(r"\n\|-\s*\n", body)
    for chunk in chunks:
        year = parse_year_header(chunk)
        if year:
            current_year = year
        if current_year is None:
            continue
        if not _is_winner_row(chunk):
            continue
        parsed_name = parse_winner_name(chunk)
        if parsed_name is None:
            continue
        title, name = parsed_name
        film = parse_film_title(chunk, skip_titles={title, name})
        rows.append(
            {
                "name": name,
                "enwiki_title": title,
                "category": category,
                "category_id": category_id,
                "ceremony_number": current_year["ceremony_number"],
                "ceremony_year": current_year["ceremony_year"],
                "film_year": current_year["film_year"],
                "film": film,
                "oscars_url": current_year["oscars_url"],
            }
        )
    return rows


def group_people(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One person per Wikipedia title, with every Best Actor/Actress win."""
    people: dict[str, dict[str, Any]] = {}
    for win in wins:
        key = win["enwiki_title"]
        award = {
            "year": str(win["ceremony_year"] or win["film_year"] or ""),
            "film_year": win["film_year"],
            "ceremony_number": win["ceremony_number"],
            "category": win["category"],
            "category_id": win["category_id"],
            "film": win["film"],
            "oscars_url": win["oscars_url"],
        }
        if key not in people:
            people[key] = {
                "name": win["name"],
                "enwiki_title": win["enwiki_title"],
                "awards": [award],
            }
        else:
            people[key]["awards"].append(award)
            if not people[key]["name"] and win["name"]:
                people[key]["name"] = win["name"]
    out = list(people.values())
    for person in out:
        person["awards"].sort(
            key=lambda item: (
                int(item["ceremony_number"] or 0),
                item["category_id"],
            )
        )
    out.sort(key=lambda item: (item["name"].lower(), item["enwiki_title"]))
    return out


def fetch_category_wikitext(title: str, *, cache_path=None) -> str:
    url = _WIKITEXT_URL.format(title=quote(title, safe="_"))
    payload = fetch_json(url, cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_winner_rows(*, cache_dir=None) -> tuple[list[dict[str, Any]], dict[str, str]]:
    wikitexts: dict[str, str] = {}
    wins: list[dict[str, Any]] = []
    for category in CATEGORIES:
        cache_path = None
        if cache_dir is not None:
            cache_path = cache_dir / f"{category['title']}.json"
        wikitext = fetch_category_wikitext(category["title"], cache_path=cache_path)
        wikitexts[category["id"]] = wikitext
        wins.extend(
            parse_winners_wikitext(
                wikitext,
                category=category["label"],
                category_id=category["id"],
            )
        )
    return group_people(wins), wikitexts
