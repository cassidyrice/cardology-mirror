"""Parse Wikipedia's 8+ Winter Olympic medalists table. Never invent a day."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.cabinet.wiki_infobox import parse_infobox_wikitext
from pipeline.http import fetch_json

WIKIPEDIA_LIST_TITLE = "List of multiple Winter Olympic medalists"
WIKIPEDIA_LIST_URL = f"https://en.wikipedia.org/wiki/{WIKIPEDIA_LIST_TITLE.replace(' ', '_')}"
WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    f"&page={quote(WIKIPEDIA_LIST_TITLE)}&prop=wikitext&format=json"
)

PRIMARY_SECTION = "==List of multiple Winter Olympic medalists=="
NEXT_SECTION = "==Most medals in one individual event=="

_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_FLAG_RE = re.compile(r"\{\{\s*([A-Z]{3})(?:\|nome)?\s*\}\}")
_INT_RE = re.compile(r"'''(\d+)'''|(?<![\w/])(\d+)(?![\w.])")

IOC_NAMES = {
    "NOR": "Norway",
    "ITA": "Italy",
    "NED": "Netherlands",
    "URS": "Soviet Union",
    "EUN": "Unified Team",
    "JPN": "Japan",
    "RUS": "Russia",
    "FRA": "France",
    "GER": "Germany",
    "SWE": "Sweden",
    "KOR": "South Korea",
    "GDR": "East Germany",
    "USA": "United States",
    "ROC": "ROC",
    "FRG": "West Germany",
    "CZE": "Czech Republic",
    "FIN": "Finland",
    "AUT": "Austria",
    "CAN": "Canada",
    "SUI": "Switzerland",
    "CHN": "China",
}

SPORT_TITLES = {
    "alpine skiing",
    "biathlon",
    "bobsleigh",
    "cross-country",
    "cross-country skiing",
    "cross-country skiing (sport)",
    "curling",
    "figure skating",
    "freestyle skiing",
    "ice hockey",
    "luge",
    "nordic combined",
    "short track",
    "short track speed skating",
    "skeleton",
    "ski jumping",
    "snowboard",
    "snowboarding",
    "speed skating",
}


def display_from_wikilink(title: str, label: str | None) -> str:
    if label and label.strip():
        return label.strip()
    return re.sub(r"\s+\([^)]+\)$", "", title.strip())


def _is_sport_link(title: str, label: str | None) -> bool:
    candidates = {title.strip().lower(), (label or "").strip().lower()}
    return bool(candidates & SPORT_TITLES)


def nation_phrase(chunk: str) -> str:
    codes = [match.group(1) for match in _FLAG_RE.finditer(chunk)]
    names = [IOC_NAMES.get(code, code) for code in codes]
    if "Olympic Athletes from Russia" in chunk and "Olympic Athletes from Russia" not in names:
        names.insert(0, "Olympic Athletes from Russia")
    if "Russian Olympic Committee" in chunk and "ROC" not in names:
        names.append("ROC")
    # Preserve order, drop empties / dupes.
    seen: set[str] = set()
    ordered: list[str] = []
    for name in names:
        if name and name not in seen:
            seen.add(name)
            ordered.append(name)
    return " / ".join(ordered)


def parse_medal_counts(chunk: str) -> dict[str, int] | None:
    """Last four integers in a primary-table row are gold, silver, bronze, total."""
    values: list[int] = []
    for match in _INT_RE.finditer(chunk):
        raw = match.group(1) or match.group(2)
        values.append(int(raw))
    if len(values) < 4:
        return None
    gold, silver, bronze, total = values[-4:]
    if gold + silver + bronze != total:
        return None
    if total < 8:
        return None
    return {"gold": gold, "silver": silver, "bronze": bronze, "total": total}


def parse_sport(chunk: str) -> str:
    for title, label in _WIKILINK_RE.findall(chunk):
        if _is_sport_link(title, label):
            return (label or title).strip()
    return ""


def parse_athlete_link(chunk: str) -> tuple[str, str] | None:
    for title, label in _WIKILINK_RE.findall(chunk):
        if _is_sport_link(title, label):
            continue
        if title.startswith("File:") or title.startswith("Image:"):
            continue
        if "Olympic" in title and "Winter" in title:
            continue
        if title.startswith("Olympic Athletes from") or title.startswith("Russian Olympic"):
            continue
        return title.strip(), display_from_wikilink(title, label)
    return None


def primary_table_wikitext(wikitext: str) -> str:
    start = wikitext.find(PRIMARY_SECTION)
    body = wikitext[start:] if start >= 0 else wikitext
    end = body.find(NEXT_SECTION)
    if end >= 0:
        body = body[:end]
    table_start = body.find('{| class="wikitable')
    if table_start < 0:
        table_start = body.find("{|")
    table = body[table_start:] if table_start >= 0 else body
    close = table.find("\n|}")
    if close >= 0:
        table = table[: close + 3]
    return table


def parse_winter_medalist_wikitext(wikitext: str) -> list[dict[str, Any]]:
    table = primary_table_wikitext(wikitext)
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    chunks = re.split(r"\n\|-\s*", table)
    for chunk in chunks[1:]:
        athlete = parse_athlete_link(chunk)
        medals = parse_medal_counts(chunk)
        if athlete is None or medals is None:
            continue
        title, name = athlete
        if title in seen:
            continue
        seen.add(title)
        rows.append(
            {
                "wikipedia_title": title,
                "name": name,
                "nation": nation_phrase(chunk),
                "sport": parse_sport(chunk),
                "gold": medals["gold"],
                "silver": medals["silver"],
                "bronze": medals["bronze"],
                "total": medals["total"],
            }
        )
    return rows


def fetch_winter_medalist_list(*, cache_path=None) -> tuple[list[dict[str, Any]], str]:
    payload = fetch_json(WIKITEXT_URL, cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    return parse_winter_medalist_wikitext(wikitext), wikitext


def fetch_infobox_birth(
    title: str,
    *,
    cache_path=None,
) -> tuple[dict[str, Any], str]:
    """Follow Wikipedia redirects so moved athlete pages still yield an infobox."""
    url = (
        "https://en.wikipedia.org/w/api.php?action=parse"
        f"&page={quote(title.replace(' ', '_'), safe="_()%,:'")}"
        "&prop=wikitext&redirects=1&format=json"
    )
    payload = fetch_json(url, cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    parsed_title = ((payload.get("parse") or {}).get("title") or title).strip()
    birth = parse_infobox_wikitext(wikitext)
    birth["wikipedia_title"] = parsed_title
    return birth, wikitext
