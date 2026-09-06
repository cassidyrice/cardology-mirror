"""Nobel Prize API v2.1 laureate catalog. REST only — no SPARQL."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

from pipeline.http import fetch_json

NOBEL_LAUREATES_URL = "https://api.nobelprize.org/2.1/laureates"
DEFAULT_LIMIT = 100


def _page_url(offset: int, limit: int) -> str:
    query = urlencode({"offset": offset, "limit": limit})
    return f"{NOBEL_LAUREATES_URL}?{query}"


def fetch_laureates(
    *,
    cache_dir: Path,
    limit: int = DEFAULT_LIMIT,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Page the Nobel laureate list. Combined payload is cached after the first run."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    combined_path = cache_dir / "laureates.json"
    if combined_path.is_file():
        payload = json.loads(combined_path.read_text(encoding="utf-8"))
        return list(payload.get("laureates") or []), payload.get("meta") or {}

    laureates: list[dict[str, Any]] = []
    meta: dict[str, Any] = {}
    offset = 0
    while True:
        page_path = cache_dir / f"laureates-offset-{offset}.json"
        page = fetch_json(_page_url(offset, limit), cache_path=page_path)
        batch = list(page.get("laureates") or [])
        meta = page.get("meta") or meta
        laureates.extend(batch)
        total = int((page.get("meta") or {}).get("count") or 0)
        offset += len(batch)
        if not batch or (total and offset >= total):
            break

    combined = {"laureates": laureates, "meta": meta}
    combined_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return laureates, meta


def localized(value: Any, lang: str = "en") -> str:
    if isinstance(value, dict):
        text = value.get(lang) or value.get("en") or ""
        return str(text).strip()
    if value is None:
        return ""
    return str(value).strip()


def is_organization(laureate: dict[str, Any]) -> bool:
    return bool(laureate.get("orgName")) and not laureate.get("knownName")


def laureate_name(laureate: dict[str, Any]) -> str:
    for key in ("knownName", "fullName", "orgName"):
        name = localized(laureate.get(key))
        if name:
            return name
    return ""


def laureate_qid(laureate: dict[str, Any]) -> str:
    wikidata = laureate.get("wikidata") or {}
    qid = str(wikidata.get("id") or "").strip()
    return qid if qid.startswith("Q") else ""


def wikipedia_title(laureate: dict[str, Any]) -> str:
    wiki = laureate.get("wikipedia") or {}
    slug = str(wiki.get("slug") or "").strip()
    if slug:
        return slug.replace("_", " ")
    english = str(wiki.get("english") or "").strip()
    if "/wiki/" in english:
        return english.rsplit("/wiki/", 1)[-1].replace("_", " ")
    return ""


def nobel_page_url(laureate: dict[str, Any]) -> str:
    for link in laureate.get("links") or []:
        if not isinstance(link, dict):
            continue
        href = str(link.get("href") or "").strip()
        classes = link.get("class") or []
        if link.get("rel") == "external" and href.startswith("https://www.nobelprize.org/"):
            if "laureate facts" in classes or "/laureate/" in href:
                return href
    nobel_id = str(laureate.get("id") or "").strip()
    if nobel_id:
        return f"https://www.nobelprize.org/laureate/{nobel_id}"
    return ""


def extract_prizes(laureate: dict[str, Any]) -> list[dict[str, str | None]]:
    prizes: list[dict[str, str | None]] = []
    seen: set[tuple[str, str]] = set()
    for raw in laureate.get("nobelPrizes") or []:
        if not isinstance(raw, dict):
            continue
        year = str(raw.get("awardYear") or "").strip()
        category = localized(raw.get("category"))
        if not year or not category:
            continue
        key = (year, category)
        if key in seen:
            continue
        seen.add(key)
        prizes.append(
            {
                "year": year,
                "category": category,
                "category_full": localized(raw.get("categoryFullName")) or f"The Nobel Prize in {category}",
                "motivation": localized(raw.get("motivation")) or None,
                "portion": str(raw.get("portion") or "").strip() or None,
            }
        )
    prizes.sort(key=lambda item: (item["year"] or "", item["category"] or ""))
    return prizes
