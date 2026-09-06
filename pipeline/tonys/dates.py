"""Parse Wikipedia person-page birth dates. Never invent a day from a year."""

from __future__ import annotations

import re
from datetime import date
from typing import Literal
from urllib.parse import quote

from pipeline.http import fetch_json
from pipeline.tonys.catalog import WIKIPEDIA_API

WikipediaDateKind = Literal["day", "year_only", "missing", "invalid"]

# {{birth date and age|YYYY|M|D}} and df=/mf= flag variants.
_TEMPLATE_DAY_RE = re.compile(
    r"\{\{\s*(?:birth[-_ ]?date(?:\s+and\s+age)?|bda|dob)\s*"
    r"(?:\|(?:df|mf|abbr|plain)\s*=\s*[^|}]+)*"
    r"\|(\d{4})\|(\d{1,2})\|(\d{1,2})",
    re.IGNORECASE,
)
_TEMPLATE_YEAR_RE = re.compile(
    r"\{\{\s*(?:birth[-_ ]?date(?:\s+and\s+age)?|bda|dob)\s*"
    r"(?:\|(?:df|mf|abbr|plain)\s*=\s*[^|}]+)*"
    r"\|(\d{4})(?:\s*[|}])",
    re.IGNORECASE,
)
_BIRTH_DATE_FIELD_RE = re.compile(
    r"\|\s*birth[_ ]date\s*=\s*([^\n|{]+)",
    re.IGNORECASE,
)
_MONTH_NAME = {
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
_NAMED_DAY_RE = re.compile(
    r"\b(" + "|".join(_MONTH_NAME) + r")\s+(\d{1,2}),?\s+(\d{4})\b",
    re.IGNORECASE,
)
_ISO_DAY_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_YEAR_ONLY_FIELD_RE = re.compile(r"^\s*(\d{4})\s*$")


def _as_iso(year: int, month: int, day: int) -> str | None:
    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return None


def classify_wikipedia_birth(wikitext: str | None) -> tuple[WikipediaDateKind, str | None]:
    """Return (kind, ISO date or None) from person-page wikitext / infobox."""
    if wikitext is None:
        return "missing", None
    text = str(wikitext).strip()
    if not text:
        return "missing", None

    day_match = _TEMPLATE_DAY_RE.search(text)
    if day_match:
        iso = _as_iso(int(day_match.group(1)), int(day_match.group(2)), int(day_match.group(3)))
        return ("day", iso) if iso else ("invalid", None)

    if _TEMPLATE_YEAR_RE.search(text):
        return "year_only", None

    field = _BIRTH_DATE_FIELD_RE.search(text)
    if field:
        raw = field.group(1).strip()
        if raw.startswith("<!--") or raw in {"", "?"}:
            return "missing", None
        iso_match = _ISO_DAY_RE.search(raw)
        if iso_match:
            iso = _as_iso(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))
            return ("day", iso) if iso else ("invalid", None)
        named = _NAMED_DAY_RE.search(raw)
        if named:
            iso = _as_iso(
                int(named.group(3)),
                _MONTH_NAME[named.group(1).lower()],
                int(named.group(2)),
            )
            return ("day", iso) if iso else ("invalid", None)
        if _YEAR_ONLY_FIELD_RE.match(raw):
            return "year_only", None

    return "missing", None


def lead_wikitext_url(title: str) -> str:
    return (
        f"{WIKIPEDIA_API}?action=query&prop=revisions&rvprop=content"
        f"&rvslots=main&rvsection=0&format=json&titles={quote(title)}"
    )


def extract_lead_wikitext(payload: dict) -> str:
    pages = (payload.get("query") or {}).get("pages") or {}
    for page in pages.values():
        revisions = page.get("revisions") or []
        if not revisions:
            continue
        slots = revisions[0].get("slots") or {}
        main = slots.get("main") or {}
        if main.get("*"):
            return str(main["*"])
        if revisions[0].get("*"):
            return str(revisions[0]["*"])
    return ""


def fetch_person_lead(title: str, *, cache_dir=None) -> str:
    cache_path = None
    if cache_dir is not None:
        safe = title.replace("/", "_").replace(" ", "_")
        cache_path = cache_dir / f"{safe}.json"
    payload = fetch_json(lead_wikitext_url(title), cache_path=cache_path)
    return extract_lead_wikitext(payload)
