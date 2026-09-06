"""Exclusion rules for the celebrity birth-card dataset."""

from __future__ import annotations

import re
from datetime import date
from enum import Enum
from pathlib import Path
from typing import Iterable

# D3 (locked): Wikipedia short-description phrases, case-insensitive.
DESCRIPTION_KEYWORDS = ("serial killer", "murderer", "terrorist", "dictator")


class ExclusionReason(str, Enum):
    DESCRIPTION_KEYWORD = "description_keyword"
    MINOR = "minor"
    PRECISION = "precision"
    YEAR_BEFORE_1900 = "year_before_1900"
    BLOCKLIST = "blocklist"
    MISSING_BIRTH = "missing_birth"
    MISSING_QID = "missing_qid"
    MISSING_SOURCE = "missing_source"


def load_blocklist(path: Path) -> set[str]:
    items: set[str] = set()
    if not path.is_file():
        return items
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        items.add(line)
    return items


def description_blocked(text: str | None) -> bool:
    if not text:
        return False
    normalized = re.sub(r"[-_]+", " ", text).lower()
    return any(keyword in normalized for keyword in DESCRIPTION_KEYWORDS)


def _minus_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def _parse_iso_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def classify_person(
    row: dict,
    *,
    today: date | None = None,
    blocklist: Iterable[str] | None = None,
) -> ExclusionReason | None:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    for key in (row.get("qid"), row.get("slug"), row.get("name")):
        if key and str(key).lower() in blocked:
            return ExclusionReason.BLOCKLIST

    precision = row.get("precision")
    if precision is not None and int(precision) < 11:
        return ExclusionReason.PRECISION

    birth = _parse_iso_date(str(row["birth_date"]) if row.get("birth_date") else None)
    birth_year = row.get("birth_year")
    if birth_year is None and birth is not None:
        birth_year = birth.year
    if birth is None and birth_year is None:
        return ExclusionReason.MISSING_BIRTH
    if birth_year is not None and int(birth_year) < 1900:
        return ExclusionReason.YEAR_BEFORE_1900
    if birth is not None:
        if birth.year < 1900:
            return ExclusionReason.YEAR_BEFORE_1900
        if birth > _minus_years(today, 18):
            return ExclusionReason.MINOR

    blob = " ".join(
        part
        for part in (row.get("wikipedia_description"), row.get("description"))
        if part
    )
    if description_blocked(blob):
        return ExclusionReason.DESCRIPTION_KEYWORD
    return None
