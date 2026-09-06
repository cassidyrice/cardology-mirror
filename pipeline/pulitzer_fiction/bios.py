"""Parse day-precision birth dates from Pulitzer.org winner HTML.

Pulitzer.org pages are citation/identity pages. They rarely publish a
day-precision DOB. When they do, a conflict with Wikipedia/Wikidata drops
the person. Year-only values are never expanded into a day.
"""

from __future__ import annotations

import html
import re
from datetime import date
from typing import Literal

DateKind = Literal["day", "year_only", "missing", "invalid"]

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

_MDY = re.compile(
    r"\b(" + "|".join(sorted(_MONTHS, key=len, reverse=True)) + r")\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b",
    re.IGNORECASE,
)
_DMY = re.compile(
    r"\b(\d{1,2})(?:st|nd|rd|th)?\s+("
    + "|".join(sorted(_MONTHS, key=len, reverse=True))
    + r"),?\s+(\d{4})\b",
    re.IGNORECASE,
)
_ISO = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_YEAR_ONLY = re.compile(r"\b(?:born|birth(?:date|day)?)\b[^.]{0,40}\b(\d{4})\b", re.IGNORECASE)
_BIRTHDATE_LABEL = re.compile(
    r"birth\s*date\s*:?\s*(?:</strong>)?\s*([^<\n\r]{4,40})",
    re.IGNORECASE,
)
_BORN_LABEL = re.compile(
    r"\bborn(?:\s+born)?\s+("
    + "|".join(sorted(_MONTHS, key=len, reverse=True))
    + r"\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})",
    re.IGNORECASE,
)


def _iso(year: int, month: int, day: int) -> tuple[DateKind, str | None]:
    try:
        return "day", date(year, month, day).isoformat()
    except ValueError:
        return "invalid", None


def parse_free_date(raw: str) -> tuple[DateKind, str | None]:
    text = html.unescape(raw)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return "missing", None

    iso = _ISO.search(text)
    if iso:
        return _iso(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))

    mdy = _MDY.search(text)
    if mdy:
        month = _MONTHS.get(mdy.group(1).lower())
        if month is None:
            return "invalid", None
        return _iso(int(mdy.group(3)), month, int(mdy.group(2)))

    dmy = _DMY.search(text)
    if dmy:
        month = _MONTHS.get(dmy.group(2).lower())
        if month is None:
            return "invalid", None
        return _iso(int(dmy.group(3)), month, int(dmy.group(1)))

    if re.fullmatch(r"\d{4}", text):
        return "year_only", None
    month_year = re.fullmatch(r"([A-Za-z]+)\s+(\d{4})", text)
    if month_year and month_year.group(1).lower() in _MONTHS:
        return "year_only", None
    return "missing", None


def _visible_text(html_text: str) -> str:
    text = html.unescape(html_text)
    text = text.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\/", "/")
    text = text.replace("\\r", " ").replace("\\n", " ")
    return text


_BIRTH_FIELD_RE = re.compile(
    r"\|\s*birth_date\s*=\s*(.*?)(?=\n\s*\|\s*[a-zA-Z_]+\s*=|\n\}\})",
    re.IGNORECASE | re.DOTALL,
)
_BIRTH_DATE_TEXT_RE = re.compile(
    r"\{\{\s*birth[ -]?date[ -]?text\s*\|\s*([^}|]+)",
    re.IGNORECASE,
)


def parse_wikipedia_birth_field(wikitext: str) -> dict[str, str | None]:
    """Day-precision birth_date field when the shared template parser misses.

    Handles `{{birth date text|Month Day, Year}}` and a bare Month Day, Year
    in the infobox. Year-only templates stay year_only. Never invents a day.
    """
    field = _BIRTH_FIELD_RE.search(wikitext or "")
    if not field:
        return {"kind": "missing", "birth_date": None}
    raw = field.group(1).strip()
    if not raw:
        return {"kind": "missing", "birth_date": None}

    text_tmpl = _BIRTH_DATE_TEXT_RE.search(raw)
    if text_tmpl:
        kind, iso = parse_free_date(text_tmpl.group(1))
        return {"kind": kind, "birth_date": iso}

    if re.search(r"\{\{\s*birth[ -]?year", raw, re.IGNORECASE):
        return {"kind": "year_only", "birth_date": None}

    kind, iso = parse_free_date(re.sub(r"<[^>]+>", " ", raw))
    if kind == "day":
        return {"kind": "day", "birth_date": iso}
    if kind == "year_only":
        return {"kind": "year_only", "birth_date": None}
    return {"kind": "missing", "birth_date": None}


def parse_pulitzer_html(html_text: str) -> tuple[DateKind, str | None]:
    """Day-precision DOB from a Pulitzer.org page. Never invent a day."""
    if not html_text or not html_text.strip():
        return "missing", None
    raw = _visible_text(html_text)
    if "Just a moment..." in raw and "challenges.cloudflare.com" in raw:
        return "missing", None

    labeled = _BIRTHDATE_LABEL.search(raw)
    if labeled:
        parsed = parse_free_date(labeled.group(1))
        if parsed[0] != "missing":
            return parsed

    born = _BORN_LABEL.search(raw)
    if born:
        parsed = parse_free_date(born.group(1))
        if parsed[0] != "missing":
            return parsed

    born_plain = re.search(r"\bborn\b(.{0,40})", raw, re.IGNORECASE)
    if born_plain:
        parsed = parse_free_date(born_plain.group(0))
        if parsed[0] != "missing":
            return parsed

    if _YEAR_ONLY.search(raw) and not _MDY.search(raw):
        return "year_only", None
    return "missing", None
