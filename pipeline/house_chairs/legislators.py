"""congress-legislators House rows, house.gov/leadership, standing-chair roster."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from pipeline.http import fetch_json, fetch_text
from pipeline.house_chairs.catalog import (
    COMMITTEE_MEMBERSHIP_URL,
    HOUSE_LEADERSHIP_URL,
    LEGISLATORS_URL,
    STANDING_COMMITTEES,
)
from pipeline.senators.bioguide import (
    bioguide_url,
    classify_birthday,
    congress_member_url,
)

_NAME_STRIP_RE = re.compile(r"[^a-z0-9\s]+")
_WHITESPACE_RE = re.compile(r"\s+")
_TAG_RE = re.compile(r"<[^>]+>")
_REP_NAME_RE = re.compile(
    r"^Rep\.\s+([A-Z][A-Za-z.'’\-]+(?:\s+[A-Z][A-Za-z.'’\-]+){1,3})\s*$"
)
_TITLE_STOP = {
    "republican",
    "democratic",
    "majority",
    "minority",
    "conference",
    "caucus",
    "policy",
    "committee",
    "chairman",
    "chair",
    "leader",
    "whip",
    "speaker",
    "assistant",
    "vice",
}


def normalize_person_name(value: str) -> str:
    text = value.lower().replace(".", " ")
    text = text.replace("junior", "jr")
    text = _NAME_STRIP_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    tokens = [
        part
        for part in text.split()
        if part not in {"jr", "sr", "ii", "iii", "iv", "the", "honorable", "rep"}
    ]
    return " ".join(tokens)


def extract_house_gov_names(html: str) -> list[str]:
    text = _TAG_RE.sub("\n", html)
    text = text.replace("&nbsp;", " ").replace("&#39;", "'")
    found: list[str] = []
    seen: set[str] = set()
    for raw in text.splitlines():
        line = _WHITESPACE_RE.sub(" ", raw).strip()
        match = _REP_NAME_RE.match(line)
        if not match:
            continue
        tokens = [part for part in match.group(1).split() if part.casefold() not in _TITLE_STOP]
        if len(tokens) < 2:
            continue
        name = " ".join(tokens)
        key = normalize_person_name(name)
        if not key or key in seen:
            continue
        seen.add(key)
        found.append(name)
    return found


def house_gov_has_name(html: str, *candidates: str) -> bool:
    names = {normalize_person_name(name) for name in extract_house_gov_names(html)}
    blob = normalize_person_name(_TAG_RE.sub(" ", html))
    for candidate in candidates:
        key = normalize_person_name(candidate)
        if not key:
            continue
        if key in names:
            return True
        if key and key in blob:
            return True
    return False


def current_house_term(person: dict[str, Any], *, as_of: str) -> dict[str, Any] | None:
    terms = [term for term in (person.get("terms") or []) if term.get("type") == "rep"]
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
        term = current_house_term(person, as_of=as_of)
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
                "district": term.get("district"),
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


def fetch_house_legislators(
    *,
    cache_path: Path | None = None,
    as_of: str,
) -> list[dict[str, Any]]:
    payload = fetch_json(LEGISLATORS_URL, cache_path=cache_path, timeout=40)
    if not isinstance(payload, list):
        raise ValueError("congress-legislators payload must be a list")
    return parse_legislators(payload, as_of=as_of)


def match_legislator_row(
    catalog_row: dict[str, object],
    bio_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    bioguide = str(catalog_row.get("bioguide") or "")
    qid = str(catalog_row.get("qid") or "")
    for row in bio_rows:
        if bioguide and row.get("bioguide") == bioguide:
            return row
        if qid and row.get("qid") == qid:
            return row
    return None


def standing_chairs(membership: dict[str, list[dict[str, Any]]]) -> dict[str, dict[str, Any]]:
    chairs: dict[str, dict[str, Any]] = {}
    for thomas_id, committee in STANDING_COMMITTEES.items():
        rows = membership.get(thomas_id) or []
        chair = next(
            (
                row
                for row in rows
                if "chair" in str(row.get("title") or "").casefold()
            ),
            None,
        )
        if chair is None:
            continue
        chairs[thomas_id] = {
            **chair,
            "committee": committee,
            "thomas_id": thomas_id,
        }
    return chairs


def fetch_committee_membership(*, cache_path: Path | None = None) -> dict[str, list[dict[str, Any]]]:
    payload = fetch_json(COMMITTEE_MEMBERSHIP_URL, cache_path=cache_path, timeout=40)
    if not isinstance(payload, dict):
        raise ValueError("committee-membership-current.json must be an object")
    return payload


def fetch_house_gov_html(*, cache_path: Path | None = None) -> str:
    return fetch_text(HOUSE_LEADERSHIP_URL, cache_path=cache_path, timeout=40)


def history_house_url(bioguide: str) -> str:
    return f"https://history.house.gov/People/Detail/?id={bioguide}"


def load_json_list(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"{path} must contain a JSON list")
    return payload
