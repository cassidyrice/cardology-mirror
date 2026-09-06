"""Catalog NFL Hall of Fame inductees that carry Wikidata P6930.

SPARQL is tried first (P6930 + instance of human). On failure, fall back to
Wikidata CirrusSearch ``haswbstatement:P6930``, then the Wikipedia category
of inductees + ``wbgetentities`` keeping only entities that still have P6930.
Dates are never invented here.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from pipeline.http import fetch_json
from pipeline.wikidata import fetch_entities

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
WD_API = "https://www.wikidata.org/w/api.php"
WIKI_API = "https://en.wikipedia.org/w/api.php"
HOF_HOME = "https://www.profootballhof.com/"
HOF_PLAYER_URL = "https://www.profootballhof.com/players/{hof_id}/"
WIKIPEDIA_LIST_URL = (
    "https://en.wikipedia.org/wiki/List_of_Pro_Football_Hall_of_Fame_inductees"
)
WIKIPEDIA_CATEGORY = "Category:Pro_Football_Hall_of_Fame_inductees"
P6930 = "P6930"


def hof_url(hof_id: str) -> str:
    slug = hof_id.strip().strip("/")
    return HOF_PLAYER_URL.format(hof_id=slug)


def _sparql_query() -> str:
    return """
SELECT ?person ?hofid ?personLabel WHERE {
  ?person wdt:P6930 ?hofid .
  ?person wdt:P31 wd:Q5 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
""".strip()


def try_sparql_hof_ids(*, timeout: float = 60.0) -> tuple[list[dict[str, str]], dict[str, Any]]:
    """Return P6930 catalog rows and a provenance record.

    Empty list on failure so harvest can fall back to REST search / Wikipedia.
    """
    url = f"{SPARQL_ENDPOINT}?{urlencode({'query': _sparql_query()})}"
    try:
        payload = fetch_json(
            url,
            timeout=timeout,
            retries=2,
            extra_headers={"Accept": "application/sparql-results+json"},
        )
    except Exception as exc:  # noqa: BLE001 — fail open to REST fallback
        return [], {
            "used": False,
            "endpoint": SPARQL_ENDPOINT,
            "error": f"{type(exc).__name__}: {exc}",
        }

    bindings = ((payload.get("results") or {}).get("bindings")) or []
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in bindings:
        uri = ((row.get("person") or {}).get("value")) or ""
        qid = uri.rsplit("/", 1)[-1]
        hof_id = str(((row.get("hofid") or {}).get("value")) or "").strip()
        label = str(((row.get("personLabel") or {}).get("value")) or "").strip()
        if not qid.startswith("Q") or not hof_id or qid in seen:
            continue
        seen.add(qid)
        rows.append(
            {
                "qid": qid,
                "hof_id": hof_id,
                "name": label or qid,
                "source": "sparql",
            }
        )

    if not rows:
        return [], {
            "used": False,
            "endpoint": SPARQL_ENDPOINT,
            "error": "SPARQL returned zero P6930 person Q-ids",
        }

    return rows, {
        "used": True,
        "endpoint": SPARQL_ENDPOINT,
        "qid_count": len(rows),
        "rule": "wdt:P6930 + wdt:P31 wd:Q5",
    }


def _cirrus_search_page(*, offset: int, cache_path=None) -> dict[str, Any]:
    query = {
        "action": "query",
        "list": "search",
        "srsearch": "haswbstatement:P6930",
        "srnamespace": "0",
        "srlimit": "50",
        "sroffset": str(offset),
        "format": "json",
    }
    return fetch_json(f"{WD_API}?{urlencode(query)}", cache_path=cache_path)


def try_cirrus_hof_ids(*, cache_dir=None) -> tuple[list[dict[str, str]], dict[str, Any]]:
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    offset = 0
    page = 0
    totalhits = 0
    while True:
        page += 1
        path = None
        if cache_dir is not None:
            path = cache_dir / f"cirrus-{page}.json"
        payload = _cirrus_search_page(offset=offset, cache_path=path)
        info = (payload.get("query") or {}).get("searchinfo") or {}
        totalhits = int(info.get("totalhits") or totalhits or 0)
        hits = (payload.get("query") or {}).get("search") or []
        for hit in hits:
            qid = str(hit.get("title") or "").strip()
            if not qid.startswith("Q") or qid in seen:
                continue
            seen.add(qid)
            rows.append({"qid": qid, "hof_id": "", "name": qid, "source": "cirrus"})
        if len(hits) < 50:
            break
        offset += 50
        if offset > 5000:
            break

    if not rows:
        return [], {
            "used": False,
            "endpoint": WD_API,
            "error": "CirrusSearch haswbstatement:P6930 returned zero Q-ids",
        }
    return rows, {
        "used": True,
        "endpoint": WD_API,
        "qid_count": len(rows),
        "totalhits": totalhits,
        "rule": "haswbstatement:P6930",
    }


def _category_query(*, continue_token: str | None = None) -> str:
    query = (
        f"{WIKI_API}?action=query&format=json"
        f"&generator=categorymembers&gcmtitle={WIKIPEDIA_CATEGORY}"
        "&gcmtype=page&gcmlimit=500&prop=pageprops&ppprop=wikibase_item"
    )
    if continue_token:
        query += f"&gcmcontinue={continue_token}"
    return query


def try_wikipedia_category_qids(*, cache_dir=None) -> tuple[list[dict[str, str]], dict[str, Any]]:
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    continue_token: str | None = None
    page = 0
    while True:
        page += 1
        path = None
        if cache_dir is not None:
            path = cache_dir / f"wiki-category-{page}.json"
        payload = fetch_json(_category_query(continue_token=continue_token), cache_path=path)
        pages = (payload.get("query") or {}).get("pages") or {}
        for page_row in pages.values():
            title = str(page_row.get("title") or "").strip()
            qid = str(((page_row.get("pageprops") or {}).get("wikibase_item") or "")).strip()
            if not title or title.startswith("List of") or title.startswith("Category:"):
                continue
            if not qid.startswith("Q") or qid in seen:
                continue
            seen.add(qid)
            rows.append(
                {
                    "qid": qid,
                    "hof_id": "",
                    "name": title,
                    "wikipedia_title": title,
                    "source": "wikipedia_category",
                }
            )
        cont = (payload.get("continue") or {}).get("gcmcontinue")
        if not cont:
            break
        continue_token = str(cont)

    if not rows:
        return [], {
            "used": False,
            "endpoint": WIKI_API,
            "error": "Wikipedia HOF category returned zero person Q-ids",
        }
    return rows, {
        "used": True,
        "endpoint": WIKI_API,
        "qid_count": len(rows),
        "category": WIKIPEDIA_CATEGORY,
        "rule": "enwiki category members with wikibase_item; P6930 required after wbgetentities",
    }


def extract_hof_id(entity: dict) -> str | None:
    for claim in (entity.get("claims") or {}).get(P6930, []) or []:
        if claim.get("rank") == "deprecated":
            continue
        snak = claim.get("mainsnak") or {}
        if snak.get("snaktype") != "value":
            continue
        value = (snak.get("datavalue") or {}).get("value")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def attach_hof_ids(
    catalog: list[dict[str, str]],
    entities: dict[str, dict],
) -> list[dict[str, str]]:
    attached: list[dict[str, str]] = []
    for row in catalog:
        entity = entities.get(row["qid"])
        hof_id = row.get("hof_id") or (extract_hof_id(entity) if entity else None)
        if not hof_id:
            continue
        updated = dict(row)
        updated["hof_id"] = hof_id
        attached.append(updated)
    return attached


def fetch_catalog(
    *,
    cache_dir,
    wikidata_cache,
) -> tuple[list[dict[str, str]], dict[str, Any], dict[str, dict]]:
    """Return unique P6930 people, catalog provenance, and loaded entities."""
    sparql_rows, sparql_meta = try_sparql_hof_ids()
    cirrus_rows: list[dict[str, str]] = []
    cirrus_meta: dict[str, Any] = {"used": False}
    wiki_rows: list[dict[str, str]] = []
    wiki_meta: dict[str, Any] = {"used": False}

    catalog = list(sparql_rows)
    if not catalog:
        cirrus_rows, cirrus_meta = try_cirrus_hof_ids(cache_dir=cache_dir)
        catalog = list(cirrus_rows)
    if not catalog:
        wiki_rows, wiki_meta = try_wikipedia_category_qids(cache_dir=cache_dir)
        catalog = list(wiki_rows)

    seen: dict[str, dict[str, str]] = {}
    for row in catalog:
        qid = row["qid"]
        if qid not in seen:
            seen[qid] = dict(row)
            continue
        if not seen[qid].get("hof_id") and row.get("hof_id"):
            seen[qid]["hof_id"] = row["hof_id"]
        if not seen[qid].get("wikipedia_title") and row.get("wikipedia_title"):
            seen[qid]["wikipedia_title"] = row["wikipedia_title"]
    merged = list(seen.values())
    qids = [row["qid"] for row in merged]
    entities = fetch_entities(qids, wikidata_cache) if qids else {}
    with_hof = attach_hof_ids(merged, entities)
    provenance = {
        "sparql": sparql_meta,
        "cirrus": cirrus_meta,
        "wikipedia_category": wiki_meta,
        "catalog_qids": len(merged),
        "catalog_with_p6930": len(with_hof),
    }
    return with_hof, provenance, entities
