"""Parse sitting senators + birth-date templates from the Wikipedia list."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json
from pipeline.senators.catalog import POSTAL_TO_STATE, WIKIPEDIA_LIST_TITLE

WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    f"&page={quote(WIKIPEDIA_LIST_TITLE)}&prop=wikitext&format=json"
)

_STATE_RE = re.compile(r"\[\[List of United States senators from ([^\]]+)\|([^\]]+)\]\]")
_SORTNAME_RE = re.compile(r"\{\{sortname\|([^}]+)\}\}", re.IGNORECASE)
_BDA_RE = re.compile(
    r"\{\{\s*birth date and age"
    r"(?:\|(?:mf|df)\s*=\s*yes)?"
    r"\|(\d{4})\|([^|}]+)\|(\d{1,2})",
    re.IGNORECASE,
)
_BDA_YEAR_RE = re.compile(
    r"\{\{\s*birth date and age(?:\|(?:mf|df)\s*=\s*yes)?\|(\d{4})(?:\||\})",
    re.IGNORECASE,
)
_CLASS_RE = re.compile(r"Class\s+([123])")
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


def sortname_parts(raw: str) -> tuple[str, str, str]:
    """Return (first, last, enwiki_title) from a sortname argument string."""
    parts = [
        part.strip()
        for part in raw.split("|")
        if part.strip() and not part.strip().lower().startswith(("dab=", "nolink="))
    ]
    if not parts:
        return "", "", ""
    if len(parts) == 1:
        return parts[0], "", parts[0]
    first, last = parts[0], parts[1]
    title = parts[2] if len(parts) >= 3 else f"{first} {last}".strip()
    return first, last, title


def display_name(title: str, first: str, last: str) -> str:
    cleaned = re.sub(r"\s+\([^)]+\)$", "", title).strip()
    if cleaned:
        return cleaned
    return f"{first} {last}".strip()


def parse_month_token(raw: str) -> int | None:
    token = raw.strip().rstrip(".").lower()
    if token.isdigit():
        month = int(token)
        return month if 1 <= month <= 12 else None
    return _MONTHS.get(token)


def parse_birth_template(chunk: str) -> dict[str, Any]:
    match = _BDA_RE.search(chunk)
    if match:
        year = int(match.group(1))
        month = parse_month_token(match.group(2))
        day = int(match.group(3))
        if month is not None and 1 <= day <= 31:
            return {
                "kind": "day",
                "birth_date": f"{year:04d}-{month:02d}-{day:02d}",
                "month_day": f"{month:02d}-{day:02d}",
            }
        return {"kind": "invalid", "birth_date": None, "month_day": None}
    if _BDA_YEAR_RE.search(chunk):
        return {"kind": "year_only", "birth_date": None, "month_day": None}
    return {"kind": "missing", "birth_date": None, "month_day": None}


def parse_senators_wikitext(wikitext: str) -> list[dict[str, Any]]:
    start = wikitext.find('id="senators"')
    if start < 0:
        start = wikitext.find('{|class="wikitable sortable sticky-header"')
    table = wikitext[start:] if start >= 0 else wikitext
    end = table.find("\n|}")
    if end >= 0:
        table = table[:end]

    rows: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    current_state = ""
    chunks = re.split(r"\n\|-\s*(?:id=\"[^\"]*\")?\n", table)
    for chunk in chunks[1:]:
        state_match = _STATE_RE.search(chunk)
        if state_match:
            current_state = state_match.group(2).strip()
        sortname = _SORTNAME_RE.search(chunk)
        if not sortname or not current_state:
            continue
        first, last, title = sortname_parts(sortname.group(1))
        name = display_name(title, first, last)
        if not name:
            continue
        birth = parse_birth_template(chunk)
        class_match = _CLASS_RE.search(chunk)
        key = (current_state, name.casefold())
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "state": current_state,
                "postal": next(
                    (postal for postal, state in POSTAL_TO_STATE.items() if state == current_state),
                    None,
                ),
                "name": name,
                "first": first,
                "last": last,
                "enwiki_title": title,
                "birth_kind": birth["kind"],
                "birth_date": birth["birth_date"],
                "month_day": birth["month_day"],
                "senate_class": class_match.group(1) if class_match else None,
            }
        )
    return rows


def fetch_senator_list_rows(*, cache_path=None) -> tuple[list[dict[str, Any]], str]:
    payload = fetch_json(WIKITEXT_URL, cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    return parse_senators_wikitext(wikitext), wikitext


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def match_list_row(
    catalog_row: dict[str, str],
    list_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    state_rows = [row for row in list_rows if row.get("state") == catalog_row["state"]]
    catalog_title = normalize_name(catalog_row.get("enwiki_title") or "")
    catalog_name = normalize_name(catalog_row.get("name") or "")
    catalog_last = normalize_name(catalog_row.get("last") or catalog_name.split()[-1] if catalog_name else "")

    for row in state_rows:
        titles = {normalize_name(row.get("enwiki_title") or ""), normalize_name(row.get("name") or "")}
        if catalog_title and catalog_title in titles:
            return row
        if catalog_name and catalog_name in titles:
            return row

    last_hits = [
        row
        for row in state_rows
        if catalog_last and normalize_name(row.get("last") or "") == catalog_last
    ]
    if len(last_hits) == 1:
        return last_hits[0]

    # Longest remaining token-set match (Darline Graham Nordone ↔ Darline Graham).
    scored: list[tuple[int, dict[str, Any]]] = []
    target = set(catalog_title.split()) | set(catalog_name.split())
    for row in state_rows:
        tokens = set(normalize_name(row.get("name") or "").split()) | set(
            normalize_name(row.get("enwiki_title") or "").split()
        )
        if not tokens or not tokens <= target:
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
