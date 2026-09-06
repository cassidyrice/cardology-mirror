"""Parse day-precision birth dates from NASA astronaut bios.

Never invent a day from a year-only phrase.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

NasaDateKind = Literal["day", "year_only", "missing", "invalid"]

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


def _month_number(raw: str) -> int | None:
    return _MONTHS.get(raw.strip(".").casefold())


def classify_nasa_date(raw: str | None) -> tuple[NasaDateKind, str | None]:
    """Return (kind, ISO date). Year-only phrases yield no invented day.

    Accepts ISO ``YYYY-MM-DD``, ``YYYY-00-00``, a bare year, or a
    Month-Day-Year phrase already isolated by the bio parser.
    """
    if raw is None:
        return "missing", None
    value = " ".join(str(raw).split())
    if not value:
        return "missing", None

    if len(value) == 4 and value.isdigit():
        return "year_only", None

    iso_parts = value.split("-")
    if len(iso_parts) == 3 and all(part.isdigit() for part in iso_parts):
        year_s, month_s, day_s = iso_parts
        if len(year_s) == 4 and len(month_s) == 2 and len(day_s) == 2:
            year, month, day = int(year_s), int(month_s), int(day_s)
            if month == 0 or day == 0:
                return "year_only", None
            try:
                return "day", date(year, month, day).isoformat()
            except ValueError:
                return "invalid", None

    return _classify_phrase(value)


def _classify_phrase(value: str) -> tuple[NasaDateKind, str | None]:
    tokens = value.replace(",", " ").replace(".", " ").split()
    if len(tokens) >= 3:
        month = _month_number(tokens[0])
        if month and tokens[1].isdigit() and tokens[2].isdigit() and len(tokens[2]) == 4:
            try:
                return "day", date(int(tokens[2]), month, int(tokens[1])).isoformat()
            except ValueError:
                return "invalid", None
        if (
            tokens[0].isdigit()
            and _month_number(tokens[1])
            and tokens[2].isdigit()
            and len(tokens[2]) == 4
        ):
            try:
                return "day", date(int(tokens[2]), _month_number(tokens[1]) or 0, int(tokens[0])).isoformat()
            except ValueError:
                return "invalid", None
    if len(tokens) == 2:
        month = _month_number(tokens[0])
        if month and tokens[1].isdigit() and len(tokens[1]) == 4:
            return "year_only", None
    if len(tokens) == 1 and tokens[0].isdigit() and len(tokens[0]) == 4:
        return "year_only", None
    return "missing", None
