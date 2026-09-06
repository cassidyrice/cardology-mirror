"""Parse Nobel API birth/death strings. Never invent a day from a year-only value."""

from __future__ import annotations

from datetime import date
from typing import Literal

NobelDateKind = Literal["day", "year_only", "missing", "invalid"]

_DAY_RE_GROUPS = 3


def classify_nobel_date(raw: str | None) -> tuple[NobelDateKind, str | None]:
    """Return (kind, ISO date or None).

    Nobel API uses ``YYYY-MM-DD`` for day precision and ``YYYY-00-00`` (or a
    bare year) when only the year is known. Zero month/day is year-only.
    """
    if raw is None:
        return "missing", None
    value = str(raw).strip()
    if not value:
        return "missing", None

    if len(value) == 4 and value.isdigit():
        return "year_only", None

    parts = value.split("-")
    if len(parts) != _DAY_RE_GROUPS:
        return "invalid", None
    year_s, month_s, day_s = parts
    if not (year_s.isdigit() and month_s.isdigit() and day_s.isdigit()):
        return "invalid", None
    if len(year_s) != 4 or len(month_s) != 2 or len(day_s) != 2:
        return "invalid", None

    year, month, day = int(year_s), int(month_s), int(day_s)
    if month == 0 or day == 0:
        return "year_only", None
    try:
        parsed = date(year, month, day)
    except ValueError:
        return "invalid", None
    return "day", parsed.isoformat()
