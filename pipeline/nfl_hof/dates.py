"""Parse day-precision birth dates from ProFootballHOF.com bios.

Never invent a day from a year-only value. Labeled Birthdate fields are
preferred over later narrative dates (induction, death, games).
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


def _from_mdy(match: re.Match[str]) -> tuple[DateKind, str | None]:
    month = _MONTHS.get(match.group(1).lower())
    if month is None:
        return "invalid", None
    return _iso(int(match.group(3)), month, int(match.group(2)))


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
        return _from_mdy(mdy)

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


def parse_hof_html(html_text: str) -> tuple[DateKind, str | None]:
    """Day-precision DOB from a ProFootballHOF.com bio page. Never invent."""
    if not html_text or not html_text.strip():
        return "missing", None
    raw = _visible_text(html_text)

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

    meta = re.search(
        r'<meta[^>]+(?:name|property)="(?:description|og:description)"[^>]+content="([^"]+)"',
        raw,
        re.IGNORECASE,
    )
    if meta:
        parsed = parse_free_date(meta.group(1))
        if parsed[0] != "missing":
            return parsed

    if _YEAR_ONLY.search(raw) and not _MDY.search(raw):
        return "year_only", None
    return "missing", None
