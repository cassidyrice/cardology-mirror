"""Parse sitting governors + birth-date templates from the Wikipedia list."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json
from pipeline.governors.catalog import WIKIPEDIA_LIST_TITLE

WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    f"&page={quote(WIKIPEDIA_LIST_TITLE)}&prop=wikitext&format=json"
)

_STATE_RE = re.compile(r"\[\[Governor of ([^\]]+)\|([^\]]+)\]\]")
_SORTNAME_RE = re.compile(r"\{\{sortname\|([^}]+)\}\}", re.IGNORECASE)
_WIKILINK_NAME_RE = re.compile(
    r"! scope=\"row\"\s*\|\s*\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]",
    re.IGNORECASE,
)
_BDA_RE = re.compile(
    r"\{\{\s*birth date and age\|(\d{4})\|(\d{1,2})\|(\d{1,2})",
    re.IGNORECASE,
)
_BDA_YEAR_RE = re.compile(
    r"\{\{\s*birth date and age\|(\d{4})(?:\||\})",
    re.IGNORECASE,
)
_NGA_RE = re.compile(r"https://www\.nga\.org/governors/[a-z-]+/", re.IGNORECASE)

TERRITORY_STATES = {
    "American Samoa",
    "Guam",
    "Northern Mariana Islands",
    "Puerto Rico",
    "U.S. Virgin Islands",
    "District of Columbia",
    "Washington, D.C.",
}


def sortname_display(raw: str) -> str:
    parts = [part.strip() for part in raw.split("|") if part.strip() and not part.startswith("dab=")]
    if not parts:
        return ""
    if len(parts) >= 3:
        return parts[2]
    if len(parts) == 2:
        return f"{parts[0]} {parts[1]}"
    return parts[0]


def parse_birth_template(chunk: str) -> dict[str, Any]:
    match = _BDA_RE.search(chunk)
    if match:
        year, month, day = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
        if 1 <= month <= 12 and 1 <= day <= 31:
            return {
                "kind": "day",
                "birth_date": f"{year:04d}-{month:02d}-{day:02d}",
                "month_day": f"{month:02d}-{day:02d}",
            }
        return {"kind": "invalid", "birth_date": None, "month_day": None}
    if _BDA_YEAR_RE.search(chunk):
        return {"kind": "year_only", "birth_date": None, "month_day": None}
    return {"kind": "missing", "birth_date": None, "month_day": None}


def parse_name(chunk: str) -> str:
    sortname = _SORTNAME_RE.search(chunk)
    if sortname:
        return sortname_display(sortname.group(1))
    wikilink = _WIKILINK_NAME_RE.search(chunk)
    if wikilink:
        title = wikilink.group(1).strip()
        return re.sub(r"\s+\([^)]+\)$", "", title)
    return ""


def parse_governors_wikitext(wikitext: str) -> list[dict[str, Any]]:
    start = wikitext.find('{| class="wikitable')
    table = wikitext[start:] if start >= 0 else wikitext
    end = table.find("\n|}")
    if end >= 0:
        table = table[:end]

    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    chunks = re.split(r"\n\|-\s*(?:id=\"[^\"]*\")?\n", table)
    for chunk in chunks[1:]:
        state_match = _STATE_RE.search(chunk)
        if not state_match:
            continue
        state = state_match.group(2).strip()
        if state in TERRITORY_STATES or state in seen:
            continue
        name = parse_name(chunk)
        birth = parse_birth_template(chunk)
        nga = _NGA_RE.search(chunk)
        seen.add(state)
        rows.append(
            {
                "state": state,
                "name": name,
                "birth_kind": birth["kind"],
                "birth_date": birth["birth_date"],
                "month_day": birth["month_day"],
                "nga_url": nga.group(0) if nga else None,
            }
        )
    return rows


def fetch_governor_list_rows(*, cache_path=None) -> tuple[list[dict[str, Any]], str]:
    payload = fetch_json(WIKITEXT_URL, cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    return parse_governors_wikitext(wikitext), wikitext


def match_list_row(
    catalog_row: dict[str, str],
    list_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    for row in list_rows:
        if row["state"] == catalog_row["state"]:
            return row
    return None
