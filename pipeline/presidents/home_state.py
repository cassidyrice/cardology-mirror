"""Parse month/day from the Wikipedia home-state presidents list (secondary check)."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

HOME_STATE_TITLE = "List_of_presidents_of_the_United_States_by_home_state"
HOME_STATE_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    f"&page={quote(HOME_STATE_TITLE)}&prop=wikitext&format=json"
)
HOME_STATE_PAGE_URL = (
    "https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States_by_home_state"
)

_DTS_ROW = re.compile(
    r"\{\{dts\|([^}]+)\}\}[^\n]*?\|\|\s*\{\{sortname\|([^}]+)\}\}",
    re.IGNORECASE,
)
_MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


def sortname_display(raw: str) -> str:
    parts = [part.strip() for part in raw.split("|") if part.strip()]
    if not parts:
        return ""
    if len(parts) >= 3:
        return parts[-1]
    if len(parts) == 2:
        return f"{parts[0]} {parts[1]}"
    return parts[0]


def parse_dts(raw: str) -> tuple[int, int] | None:
    cleaned = raw.strip().rstrip("*").strip()
    numeric = re.fullmatch(r"(\d{4})\|(\d{1,2})\|(\d{1,2})", cleaned)
    if numeric:
        month = int(numeric.group(2))
        day = int(numeric.group(3))
        if 1 <= month <= 12 and 1 <= day <= 31:
            return month, day
        return None
    try:
        parsed = datetime.strptime(cleaned, "%B %d, %Y")
    except ValueError:
        return None
    return parsed.month, parsed.day


def parse_home_state_wikitext(wikitext: str) -> list[dict[str, Any]]:
    start = wikitext.find('{| class="wikitable sortable"')
    table = wikitext[start:] if start >= 0 else wikitext
    if "|}" in table:
        table = table[: table.index("|}")]

    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for match in _DTS_ROW.finditer(table):
        dts = parse_dts(match.group(1))
        name = sortname_display(match.group(2))
        if dts is None or not name:
            continue
        month, day = dts
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "name": name,
                "month": month,
                "day": day,
                "month_day": f"{month:02d}-{day:02d}",
            }
        )
    return rows


def fetch_home_state_rows(*, cache_path=None) -> tuple[list[dict[str, Any]], str]:
    payload = fetch_json(HOME_STATE_URL, cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    return parse_home_state_wikitext(wikitext), wikitext


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def match_home_state_row(
    person: dict[str, Any],
    home_rows: list[dict[str, Any]],
    used: set[str],
) -> dict[str, Any] | None:
    candidates = [row for row in home_rows if row["name"] not in used]
    sitelink = normalize_name(person.get("enwiki_title") or "")
    label = normalize_name(person.get("name") or "")
    wikidata_label = normalize_name(person.get("wikidata_label") or "")

    for row in candidates:
        row_name = normalize_name(row["name"])
        if row_name and row_name in {sitelink, label, wikidata_label}:
            return row

    # Longest remaining token-set match (John Quincy Adams before John Adams).
    scored: list[tuple[int, dict[str, Any]]] = []
    target_tokens = set(sitelink.split()) | set(label.split()) | set(wikidata_label.split())
    for row in candidates:
        tokens = set(normalize_name(row["name"]).split())
        if not tokens or not tokens <= target_tokens:
            continue
        scored.append((len(tokens), row))
    if not scored:
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    best_len = scored[0][0]
    best = [row for length, row in scored if length == best_len]
    if len(best) != 1:
        return None
    return best[0]
