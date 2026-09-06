"""Parse Wikipedia infobox birth-date templates. Never invent a day."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json, fetch_text
from pipeline.cabinet.catalog import WHITEHOUSE_CABINET_URL

WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    "&page={title}&prop=wikitext&format=json"
)

_BIRTH_FIELD_RE = re.compile(
    r"\|\s*birth_date\s*=\s*\{\{\s*(?:birth[ -]?date(?: and age)?)\s*\|([^}]+)\}\}",
    re.IGNORECASE,
)
_ANY_BDA_RE = re.compile(
    r"\{\{\s*(?:birth[ -]?date(?: and age)?)\s*\|([^}]+)\}\}",
    re.IGNORECASE,
)
_SKIP_ARGS = {"mf=yes", "mf=no", "df=yes", "df=no"}
_NAME_STRIP_RE = re.compile(r"[^a-z0-9\s]+")
_WHITESPACE_RE = re.compile(r"\s+")
_H2_RE = re.compile(r"<h2[^>]*>(.*?)</h2>", re.IGNORECASE | re.DOTALL)
_TAG_RE = re.compile(r"<[^>]+>")


def normalize_person_name(value: str) -> str:
    text = value.lower().replace(".", " ")
    text = text.replace("junior", "jr")
    text = _NAME_STRIP_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    tokens = [part for part in text.split() if part not in {"jr", "sr", "ii", "iii", "iv", "the", "honorable"}]
    return " ".join(tokens)


def parse_birth_args(raw: str) -> dict[str, Any]:
    parts = [part.strip() for part in raw.split("|")]
    nums: list[int] = []
    for part in parts:
        if not part or part.lower() in _SKIP_ARGS or "=" in part:
            continue
        if part.isdigit():
            nums.append(int(part))
    if len(nums) >= 3:
        year, month, day = nums[0], nums[1], nums[2]
        if 1 <= month <= 12 and 1 <= day <= 31:
            return {
                "kind": "day",
                "birth_date": f"{year:04d}-{month:02d}-{day:02d}",
                "month_day": f"{month:02d}-{day:02d}",
            }
        return {"kind": "invalid", "birth_date": None, "month_day": None}
    if len(nums) == 1:
        return {"kind": "year_only", "birth_date": None, "month_day": None}
    if len(nums) == 2:
        return {"kind": "year_only", "birth_date": None, "month_day": None}
    return {"kind": "missing", "birth_date": None, "month_day": None}


def parse_birth_template(chunk: str) -> dict[str, Any]:
    field = _BIRTH_FIELD_RE.search(chunk)
    if field:
        return parse_birth_args(field.group(1))
    any_match = _ANY_BDA_RE.search(chunk)
    if any_match:
        return parse_birth_args(any_match.group(1))
    return {"kind": "missing", "birth_date": None, "month_day": None}


def parse_infobox_wikitext(wikitext: str) -> dict[str, Any]:
    return parse_birth_template(wikitext)


def fetch_infobox_birth(
    title: str,
    *,
    cache_path=None,
) -> tuple[dict[str, Any], str]:
    url = WIKITEXT_URL.format(title=quote(title.replace(" ", "_"), safe="_()%,:'"))
    payload = fetch_json(url, cache_path=cache_path)
    wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    parsed_title = ((payload.get("parse") or {}).get("title") or title).strip()
    birth = parse_infobox_wikitext(wikitext)
    birth["wikipedia_title"] = parsed_title
    return birth, wikitext


def extract_whitehouse_headings(html: str) -> list[str]:
    names: list[str] = []
    for match in _H2_RE.finditer(html):
        label = _TAG_RE.sub(" ", match.group(1))
        label = _WHITESPACE_RE.sub(" ", label).strip()
        if not label or label.lower() in {"the cabinet", "cabinet"}:
            continue
        names.append(label)
    return names


def _tokens_in_order(needle: str, haystack: str) -> bool:
    want = [part for part in needle.split() if part]
    have = haystack.split()
    if not want:
        return False
    index = 0
    for token in have:
        if token == want[index]:
            index += 1
            if index == len(want):
                return True
    return False


def whitehouse_has_name(html: str, *candidates: str) -> bool:
    blob = normalize_person_name(_TAG_RE.sub(" ", html))
    for candidate in candidates:
        needle = normalize_person_name(candidate)
        if needle and _tokens_in_order(needle, blob):
            return True
    return False


def fetch_whitehouse_html(*, cache_path=None) -> str:
    return fetch_text(WHITEHOUSE_CABINET_URL, cache_path=cache_path)
