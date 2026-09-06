"""Resolve NASA catalog names to Wikidata QIDs via Wikipedia REST (no SPARQL)."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

from pipeline.astronauts.catalog import last_name, name_tokens, normalize_name
from pipeline.http import fetch_json

WIKI_API = "https://en.wikipedia.org/w/api.php"
CATEGORY_TITLE = "Category:NASA_astronauts"
GROUP_CATEGORIES = tuple(f"Category:NASA_Astronaut_Group_{n}" for n in range(1, 25))


def _category_query(title: str, *, continue_token: str | None = None, cmtype: str = "page") -> str:
    query = (
        f"{WIKI_API}?action=query&format=json"
        f"&generator=categorymembers&gcmtitle={quote(title)}"
        f"&gcmtype={cmtype}&gcmlimit=500&prop=pageprops&ppprop=wikibase_item"
    )
    if continue_token:
        query += f"&gcmcontinue={quote(continue_token)}"
    return query


def fetch_category_pages(title: str, *, cache_dir=None) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    continue_token: str | None = None
    page = 0
    safe = title.replace(":", "-").replace(" ", "_")
    while True:
        page += 1
        path = None
        if cache_dir is not None:
            path = cache_dir / f"{safe}-{page}.json"
        payload = fetch_json(_category_query(title, continue_token=continue_token), cache_path=path)
        pages = (payload.get("query") or {}).get("pages") or {}
        for page_row in pages.values():
            page_title = str(page_row.get("title") or "").strip()
            qid = str(((page_row.get("pageprops") or {}).get("wikibase_item") or "")).strip()
            if page_title:
                rows.append({"title": page_title, "qid": qid})
        cont = (payload.get("continue") or {}).get("gcmcontinue")
        if not cont:
            break
        continue_token = str(cont)
    return rows


def fetch_category_members(*, cache_path=None) -> list[dict[str, str]]:
    """NASA astronauts live mainly in Group 1–24 subcategories, not the parent."""
    cache_dir = cache_path.parent if cache_path is not None else None
    seen: set[str] = set()
    rows: list[dict[str, str]] = []
    for title in (CATEGORY_TITLE, *GROUP_CATEGORIES):
        for row in fetch_category_pages(title, cache_dir=cache_dir):
            key = row.get("qid") or row.get("title") or ""
            if not key or key in seen:
                continue
            # Skip category/list pages that are not people.
            page_title = row["title"]
            if page_title.startswith("Category:") or page_title.startswith("List of"):
                continue
            if page_title in {"Mercury Seven", "NASA Astronaut Corps", "Ohioans in Space"}:
                continue
            seen.add(key)
            rows.append(row)
    return rows


def search_queries(name: str) -> list[str]:
    queries = [name]
    trimmed = name.replace(" Jr.", "").replace(" Jr", "").replace(" Sr.", "").replace(" II", "").replace(" III", "")
    if trimmed != name:
        queries.append(trimmed)
    parts = [part for part in trimmed.replace(",", " ").split() if part]
    words = [part for part in parts if len(part.rstrip(".")) > 1]
    if len(parts) >= 2 and len(parts[0].rstrip(".")) > 1:
        queries.append(f"{parts[0]} {parts[-1]}")
    if len(words) >= 2:
        queries.append(" ".join(words[:2]))
        queries.append(f"{words[0]} {words[-1]}")
    seen: set[str] = set()
    out: list[str] = []
    for query in queries:
        key = query.casefold()
        if key not in seen:
            seen.add(key)
            out.append(query)
    return out


def search_wikipedia(name: str, *, cache_dir=None) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for query in search_queries(name):
        for row in _search_wikipedia_once(query, cache_dir=cache_dir):
            key = row.get("qid") or row.get("title") or ""
            if not key or key in seen:
                continue
            seen.add(key)
            rows.append(row)
    return rows


def _search_wikipedia_once(name: str, *, cache_dir=None) -> list[dict[str, str]]:
    safe = "".join(ch if ch.isalnum() else "-" for ch in name.casefold()).strip("-") or "q"
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"search-{safe}.json"
    url = (
        f"{WIKI_API}?action=query&format=json&list=search"
        f"&srsearch={quote(name + ' NASA astronaut')}&srlimit=5"
    )
    payload = fetch_json(url, cache_path=cache_path)
    hits = (payload.get("query") or {}).get("search") or []
    titles = [str(hit.get("title") or "").strip() for hit in hits if hit.get("title")]
    if not titles:
        return []
    joined = "|".join(title.replace(" ", "_") for title in titles)
    props_url = (
        f"{WIKI_API}?action=query&format=json&prop=pageprops"
        f"&ppprop=wikibase_item&titles={quote(joined, safe='_|')}"
    )
    props_cache = None
    if cache_dir is not None:
        props_cache = cache_dir / f"props-{safe}.json"
    props = fetch_json(props_url, cache_path=props_cache)
    pages = (props.get("query") or {}).get("pages") or {}
    out: list[dict[str, str]] = []
    for page_row in pages.values():
        title = str(page_row.get("title") or "").strip()
        qid = str(((page_row.get("pageprops") or {}).get("wikibase_item") or "")).strip()
        if title:
            out.append({"title": title, "qid": qid})
    return out


def match_wiki_row(catalog_row: dict[str, Any], candidates: list[dict[str, str]]) -> dict[str, str] | None:
    last = last_name(str(catalog_row.get("name") or ""))
    tokens = name_tokens(str(catalog_row.get("name") or ""))
    scored: list[tuple[int, dict[str, str]]] = []
    for row in candidates:
        title = row.get("title") or ""
        if last and last_name(title) != last:
            continue
        overlap = len(tokens & name_tokens(title))
        if overlap < 2:
            continue
        scored.append((overlap, row))
    if not scored:
        last_hits = [
            row
            for row in candidates
            if last
            and _person_title(row.get("title") or "")
            and last_name(row.get("title") or "") == last
            and row.get("qid")
        ]
        if len(last_hits) == 1:
            return last_hits[0]
        initial = _first_initial(str(catalog_row.get("name") or ""))
        if initial:
            narrowed = [
                row for row in last_hits if _first_initial(row.get("title") or "") == initial
            ]
            if len(narrowed) == 1:
                return narrowed[0]
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    best_len = scored[0][0]
    best = [row for length, row in scored if length == best_len]
    if len(best) != 1:
        return None
    return best[0]


def _person_title(title: str) -> bool:
    lowered = title.casefold()
    if lowered.startswith("list of") or lowered.startswith("category:"):
        return False
    return not any(
        token in lowered
        for token in ("high school", "medal", "corps", "group ", "mission", "film")
    )


def _first_initial(value: str) -> str:
    tokens = [token for token in normalize_name(value).split() if token]
    return tokens[0][:1] if tokens else ""
