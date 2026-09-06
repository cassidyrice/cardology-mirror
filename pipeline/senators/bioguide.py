"""Congress-legislators current-Senate rows (Bioguide / congress.gov compiled)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from pipeline.http import fetch_json

LEGISLATORS_URL = (
    "https://raw.githubusercontent.com/unitedstates/congress-legislators/"
    "gh-pages/legislators-current.json"
)
BIOGUIDE_BIO_URL = "https://bioguide.congress.gov/search/bio/{bioguide}"
CONGRESS_MEMBER_URL = "https://www.congress.gov/member/{slug}/{bioguide}"
CONGRESS_SENATE_ROSTER_URL = (
    "https://www.congress.gov/members"
    "?q=%7B%22congress%22%3A119%2C%22chamber%22%3A%22Senate%22%7D"
)
SENATE_GOV_ROSTER_URL = "https://www.senate.gov/senators/index.htm"

_ISO_DAY = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_ISO_YEAR = re.compile(r"^\d{4}$")


def classify_birthday(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {"kind": "missing", "birth_date": None, "month_day": None}
    value = raw.strip()
    day = _ISO_DAY.fullmatch(value)
    if day:
        year, month, day_n = day.group(1), day.group(2), day.group(3)
        if month == "00" or day_n == "00":
            return {"kind": "year_only", "birth_date": None, "month_day": None}
        return {
            "kind": "day",
            "birth_date": f"{year}-{month}-{day_n}",
            "month_day": f"{month}-{day_n}",
        }
    if _ISO_YEAR.fullmatch(value):
        return {"kind": "year_only", "birth_date": None, "month_day": None}
    return {"kind": "invalid", "birth_date": None, "month_day": None}


def bioguide_url(bioguide: str) -> str:
    return BIOGUIDE_BIO_URL.format(bioguide=bioguide)


def congress_member_url(name: str, bioguide: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-")
    return CONGRESS_MEMBER_URL.format(slug=slug, bioguide=bioguide)


def current_senate_term(person: dict[str, Any], *, as_of: str) -> dict[str, Any] | None:
    terms = [term for term in (person.get("terms") or []) if term.get("type") == "sen"]
    if not terms:
        return None
    latest = terms[-1]
    end = str(latest.get("end") or "")
    if end and end < as_of:
        return None
    return latest


def parse_legislators(
    payload: list[dict[str, Any]],
    *,
    as_of: str,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for person in payload:
        term = current_senate_term(person, as_of=as_of)
        if term is None:
            continue
        ids = person.get("id") or {}
        name = person.get("name") or {}
        official = str(name.get("official_full") or "").strip()
        first = str(name.get("first") or "").strip()
        last = str(name.get("last") or "").strip()
        display = official or f"{first} {last}".strip()
        birthday = classify_birthday((person.get("bio") or {}).get("birthday"))
        bioguide = str(ids.get("bioguide") or "").strip()
        rows.append(
            {
                "name": display,
                "first": first,
                "last": last,
                "postal": str(term.get("state") or ""),
                "senate_class": str(term.get("class") or ""),
                "party": str(term.get("party") or ""),
                "qid": str(ids.get("wikidata") or "").strip(),
                "bioguide": bioguide,
                "enwiki_title": str(ids.get("wikipedia") or "").strip(),
                "birth_kind": birthday["kind"],
                "birth_date": birthday["birth_date"],
                "month_day": birthday["month_day"],
                "bioguide_url": bioguide_url(bioguide) if bioguide else None,
                "congress_url": congress_member_url(display, bioguide) if bioguide else None,
            }
        )
    return rows


def fetch_bioguide_senators(
    *,
    cache_path: Path | None = None,
    as_of: str,
) -> list[dict[str, Any]]:
    payload = fetch_json(LEGISLATORS_URL, cache_path=cache_path, timeout=40)
    if not isinstance(payload, list):
        raise ValueError("congress-legislators payload must be a list")
    return parse_legislators(payload, as_of=as_of)


def match_bioguide_row(
    catalog_row: dict[str, str],
    bio_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    for row in bio_rows:
        if row.get("bioguide") and row["bioguide"] == catalog_row.get("bioguide"):
            return row
        if row.get("qid") and row["qid"] == catalog_row.get("qid"):
            return row
    return None
