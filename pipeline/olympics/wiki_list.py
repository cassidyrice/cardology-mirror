"""REST fallback catalog: Wikipedia multiple-Olympic-gold-medalist lists."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

LIST_TITLES = (
    "List of multiple Olympic gold medalists",
    "List of multiple Olympic gold medalists at the Summer Olympics",
)

WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    "&page={title}&prop=wikitext&format=json"
)

_LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]")
_SKIP_PREFIXES = (
    "list of ",
    "olympic",
    "summer olympic",
    "winter olympic",
    "category:",
    "file:",
    "image:",
    "template:",
    "wikipedia:",
    "help:",
    "portal:",
)


def extract_person_titles(wikitext: str) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    start = wikitext.find('{| class="wikitable')
    table_blob = wikitext[start:] if start >= 0 else wikitext
    for match in _LINK_RE.finditer(table_blob):
        title = match.group(1).strip()
        if not title:
            continue
        lowered = title.lower()
        if any(lowered.startswith(prefix) for prefix in _SKIP_PREFIXES):
            continue
        if lowered in {
            "gold medal",
            "silver medal",
            "bronze medal",
            "olympic games",
            "international olympic committee",
        }:
            continue
        if title in seen:
            continue
        seen.add(title)
        titles.append(title)
    return titles


def fetch_list_titles(*, cache_dir=None) -> tuple[list[str], list[str]]:
    """Return (enwiki titles, source URLs) from the public multiple-gold lists."""
    titles: list[str] = []
    seen: set[str] = set()
    sources: list[str] = []
    for page in LIST_TITLES:
        cache_path = None
        if cache_dir is not None:
            safe = page.replace(" ", "_")
            cache_path = cache_dir / f"{safe}.json"
        url = WIKITEXT_URL.format(title=quote(page.replace(" ", "_"), safe="_()%,:'"))
        try:
            payload = fetch_json(url, cache_path=cache_path)
        except Exception:  # noqa: BLE001 — one list failing must not abort fallback
            continue
        wikitext = ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""
        if not wikitext:
            continue
        sources.append(f"https://en.wikipedia.org/wiki/{page.replace(' ', '_')}")
        for title in extract_person_titles(wikitext):
            if title in seen:
                continue
            seen.add(title)
            titles.append(title)
    return titles, sources
