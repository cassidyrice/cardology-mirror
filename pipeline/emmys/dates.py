"""Parse day-precision birth dates from a Wikipedia person-article lead/infobox.

Never invent a day from a year-only value. Templates without month+day, or
bare years, are ``year_only``.
"""

from __future__ import annotations

import re
from datetime import date
from typing import Literal
from urllib.parse import quote

from pipeline.http import fetch_json

WikiDateKind = Literal["day", "year_only", "missing", "invalid"]

WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}"
    "&prop=wikitext&redirects=1&format=json"
)
_REDIRECT_RE = re.compile(r"^#REDIRECT\s*\[\[([^\]|#]+)", re.IGNORECASE | re.MULTILINE)

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
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "sept": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}

_FLAG_TOKENS = {
    "mf",
    "df",
    "yes",
    "no",
    "y",
    "n",
    "true",
    "false",
}


def _iso(year: int, month: int, day: int) -> tuple[WikiDateKind, str | None]:
    try:
        return "day", date(year, month, day).isoformat()
    except ValueError:
        return "invalid", None


def _int_token(raw: str) -> int | None:
    token = raw.strip()
    if token.isdigit():
        return int(token)
    return None


def parse_birth_template(chunk: str) -> tuple[WikiDateKind, str | None]:
    """Parse the first birth-date template in ``chunk``.

    Accepts ``Birth date``, ``Birth date and age``, ``Bda``, and the
    hyphenated ``Birth-date`` / ``Birth-date and age`` forms. Named
    ``year=`` / ``month=`` / ``day=`` parameters and positional
    ``YYYY|MM|DD`` are accepted. Flags (``mf=yes``) are ignored.
    """
    lowered = chunk
    year_only = re.search(
        r"\{\{\s*birth[\s-]?year(?:\s+and\s+age)?\s*\|",
        lowered,
        re.IGNORECASE,
    )
    match = re.search(
        r"\{\{\s*(?:birth[\s-]?date(?:\s+and\s+age)?|bda)\s*\|([^}]+)\}\}",
        lowered,
        re.IGNORECASE,
    )
    if match is None:
        if year_only:
            return "year_only", None
        return "missing", None

    raw_params = match.group(1)
    named: dict[str, str] = {}
    positional: list[str] = []
    for part in raw_params.split("|"):
        piece = part.strip()
        if not piece:
            continue
        if "=" in piece:
            key, value = piece.split("=", 1)
            key = key.strip().lower()
            if key in _FLAG_TOKENS:
                continue
            named[key] = value.strip()
        else:
            if piece.lower() in _FLAG_TOKENS:
                continue
            positional.append(piece)

    if "year" in named and "month" in named and "day" in named:
        year, month, day = (_int_token(named["year"]), _int_token(named["month"]), _int_token(named["day"]))
        if year is None or month is None or day is None:
            return "invalid", None
        return _iso(year, month, day)

    # Hyphenated {{Birth-date|March 7, 1956}}
    if len(positional) == 1 and not named:
        parsed = parse_free_date(positional[0])
        if parsed[0] != "missing":
            return parsed

    numbers = [_int_token(item) for item in positional]
    numbers = [item for item in numbers if item is not None]
    if len(numbers) >= 3:
        year, month, day = numbers[0], numbers[1], numbers[2]
        if month == 0 or day == 0:
            return "year_only", None
        return _iso(year, month, day)
    if len(numbers) == 1:
        return "year_only", None
    if year_only:
        return "year_only", None
    return "year_only", None


def parse_free_date(raw: str) -> tuple[WikiDateKind, str | None]:
    """Parse an unambiguous full date. Year-only / month-year → year_only."""
    text = re.sub(r"\{\{[^}]*\}\}", "", raw)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace(",", " ").strip()
    if not text:
        return "missing", None

    iso = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", text)
    if iso:
        return _iso(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))

    if re.fullmatch(r"\d{4}", text):
        return "year_only", None

    mdy = re.fullmatch(
        r"([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})",
        text,
    )
    if mdy:
        month = _MONTHS.get(mdy.group(1).lower())
        if month is None:
            return "invalid", None
        return _iso(int(mdy.group(3)), month, int(mdy.group(2)))

    dmy = re.fullmatch(
        r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})",
        text,
    )
    if dmy:
        month = _MONTHS.get(dmy.group(2).lower())
        if month is None:
            return "invalid", None
        return _iso(int(dmy.group(3)), month, int(dmy.group(1)))

    month_year = re.fullmatch(r"([A-Za-z]+)\s+(\d{4})", text)
    if month_year and month_year.group(1).lower() in _MONTHS:
        return "year_only", None
    return "missing", None


def lead_region(wikitext: str) -> str:
    parts = wikitext.split("\n==", 1)
    return parts[0]


def parse_wikipedia_birth(wikitext: str) -> tuple[WikiDateKind, str | None]:
    """Day-precision DOB from the article lead/infobox only. Never invent."""
    lead = lead_region(wikitext)
    templated = parse_birth_template(lead)
    if templated[0] != "missing":
        return templated

    field = re.search(
        r"\|\s*birth_date\s*=\s*(.+?)(?:\n\s*\||\n\}\})",
        lead,
        re.IGNORECASE | re.DOTALL,
    )
    if field:
        value = field.group(1).strip()
        templated = parse_birth_template(value)
        if templated[0] != "missing":
            return templated
        free = parse_free_date(value)
        if free[0] != "missing":
            return free
        if re.search(r"\d{4}", value):
            return "year_only", None
    return "missing", None


def fetch_article_wikitext(title: str, *, cache_path=None, hops: int = 0) -> str:
    encoded = quote(title.replace(" ", "_"), safe="_()%,")
    payload = fetch_json(WIKITEXT_URL.format(title=encoded), cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    redirect = _REDIRECT_RE.search(wikitext)
    if redirect and hops < 2:
        target = redirect.group(1).strip()
        next_cache = None
        if cache_path is not None:
            safe = target.replace("/", "_").replace(" ", "_")
            next_cache = cache_path.parent / f"{safe}.json"
        return fetch_article_wikitext(target, cache_path=next_cache, hops=hops + 1)
    return wikitext
