"""Parse day-precision birth dates from SCOTUS.gov Current Members HTML.

Never invent a day from a year-only phrase. Retired bios are flagged, not kept.
"""

from __future__ import annotations

import html
import re
from datetime import date
from typing import Any, Literal

from pipeline.build_dataset import slugify
from pipeline.http import fetch_text
from pipeline.scotus.catalog import SCOTUS_BIOS_URL, SITTING_JUSTICES

ScotusDateKind = Literal["day", "year_only", "missing", "invalid"]

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

_MEDIA_BODY = re.compile(r'<div class="media-body">(.*?)</div>', re.IGNORECASE | re.DOTALL)
_HEADING = re.compile(
    r"<strong>\s*(?P<heading>.+?)\s*</strong>",
    re.IGNORECASE | re.DOTALL,
)
_ROLE = re.compile(
    r"(?P<name>.+?),\s*(?P<role>Chief Justice of the United States|Associate Justice)\s*,?\s*$",
    re.IGNORECASE | re.DOTALL,
)
_RETIRED = re.compile(r"\(\s*Retired\s*\)", re.IGNORECASE)
_TAGS = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_BORN_DAY = re.compile(
    r"was born\b.{0,240}?\b"
    r"(?P<month>January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+(?P<day>\d{1,2}),\s+(?P<year>\d{4})",
    re.IGNORECASE | re.DOTALL,
)
_BORN_YEAR_ONLY = re.compile(
    r"was born\b.{0,160}?\b(?:in\s+)?(?P<year>\d{4})\b",
    re.IGNORECASE | re.DOTALL,
)
_SUFFIXES = re.compile(r"\b(jr|sr|ii|iii|iv)\b", re.IGNORECASE)


def strip_tags(value: str) -> str:
    unescaped = html.unescape(value)
    return _WS.sub(" ", _TAGS.sub(" ", unescaped)).strip()


def normalize_name(value: str) -> str:
    cleaned = html.unescape(value)
    cleaned = _RETIRED.sub(" ", cleaned)
    cleaned = cleaned.replace(",", " ")
    cleaned = cleaned.replace(".", " ")
    cleaned = cleaned.replace("'", "")
    cleaned = _SUFFIXES.sub(" ", cleaned)
    return _WS.sub(" ", cleaned.casefold()).strip()


def classify_scotus_date(raw: str | None) -> tuple[ScotusDateKind, str | None]:
    """Return (kind, ISO date). Year-only phrases yield no invented day."""
    if raw is None:
        return "missing", None
    text = strip_tags(raw)
    if not text:
        return "missing", None

    day_match = _BORN_DAY.search(text)
    if day_match:
        month = _MONTHS[day_match.group("month").casefold()]
        day = int(day_match.group("day"))
        year = int(day_match.group("year"))
        try:
            return "day", date(year, month, day).isoformat()
        except ValueError:
            return "invalid", None

    year_match = _BORN_YEAR_ONLY.search(text)
    if year_match:
        return "year_only", None
    return "missing", None


def parse_heading(heading: str) -> tuple[str, str, bool] | None:
    cleaned = strip_tags(heading)
    retired = bool(_RETIRED.search(cleaned))
    cleaned = _RETIRED.sub(" ", cleaned)
    cleaned = _WS.sub(" ", cleaned).strip().rstrip(",")
    match = _ROLE.search(cleaned)
    if not match:
        return None
    name = _WS.sub(" ", match.group("name")).strip(" ,")
    role = _WS.sub(" ", match.group("role")).strip()
    if role.casefold() == "chief justice of the united states":
        role = "Chief Justice of the United States"
    else:
        role = "Associate Justice"
    if not name:
        return None
    return name, role, retired


def parse_bios_html(html_text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for body in _MEDIA_BODY.findall(html_text):
        heading_match = _HEADING.search(body)
        if not heading_match:
            continue
        parsed = parse_heading(heading_match.group("heading"))
        if parsed is None:
            continue
        name, role, retired = parsed
        kind, iso = classify_scotus_date(body)
        rows.append(
            {
                "name": name,
                "role": role,
                "retired": retired,
                "scotus_birth_kind": kind,
                "scotus_birth_date": iso,
                "scotus_url": SCOTUS_BIOS_URL,
            }
        )
    return rows


def fetch_bios(*, cache_path=None) -> tuple[list[dict[str, Any]], str]:
    html_text = fetch_text(SCOTUS_BIOS_URL, cache_path=cache_path)
    return parse_bios_html(html_text), html_text


def _token_set(value: str) -> set[str]:
    return {token for token in normalize_name(value).split() if token}


def match_catalog_row(
    parsed: dict[str, Any],
    catalog: tuple[dict[str, object], ...] = SITTING_JUSTICES,
    used: set[str] | None = None,
) -> dict[str, Any] | None:
    taken = used or set()
    candidates = [row for row in catalog if str(row["slug"]) not in taken]
    parsed_norm = normalize_name(str(parsed.get("name") or ""))
    parsed_tokens = _token_set(str(parsed.get("name") or ""))

    for row in candidates:
        names = [str(row["name"]), str(row.get("enwiki_title") or "")]
        if parsed_norm and parsed_norm in {normalize_name(name) for name in names if name}:
            return dict(row)
        if parsed_tokens and parsed_tokens == _token_set(str(row["name"])):
            return dict(row)

    scored: list[tuple[int, dict[str, Any]]] = []
    for row in candidates:
        tokens = _token_set(str(row["name"])) | _token_set(str(row.get("enwiki_title") or ""))
        if not tokens or not parsed_tokens:
            continue
        if not (tokens <= parsed_tokens or parsed_tokens <= tokens):
            continue
        overlap = len(tokens & parsed_tokens)
        if overlap < 2:
            continue
        scored.append((overlap, dict(row)))
    if not scored:
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    best_len = scored[0][0]
    best = [row for length, row in scored if length == best_len]
    if len(best) != 1:
        return None
    return best[0]


def catalog_by_slug() -> dict[str, dict[str, Any]]:
    return {str(row["slug"]): dict(row) for row in SITTING_JUSTICES}


def slug_for(name: str) -> str:
    return slugify(name)
