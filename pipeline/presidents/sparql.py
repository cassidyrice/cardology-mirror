"""Optional Wikidata SPARQL lookup for holders of P39=Q11696.

Celebrity pipeline stays REST-only. This presidents harvest may try SPARQL
and must fall back to known Q-ids / enwiki titles + wbgetentities.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from pipeline.http import fetch_json

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

# P39 = position held, Q11696 = President of the United States, P31 = instance of, Q5 = human, P569 = date of birth.
SPARQL_QUERY = """
SELECT DISTINCT ?person WHERE {
  ?person wdt:P39 wd:Q11696 ;
          wdt:P31 wd:Q5 ;
          wdt:P569 ?birth .
}
""".strip()


def try_sparql_president_qids(*, timeout: float = 15.0) -> tuple[list[str], dict[str, Any]]:
    """Return unique Q-ids and a provenance record. Empty list on failure."""
    url = f"{SPARQL_ENDPOINT}?{urlencode({'query': SPARQL_QUERY})}"
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
    qids: list[str] = []
    seen: set[str] = set()
    for row in bindings:
        uri = ((row.get("person") or {}).get("value")) or ""
        qid = uri.rsplit("/", 1)[-1]
        if not qid.startswith("Q") or qid in seen:
            continue
        seen.add(qid)
        qids.append(qid)

    if not qids:
        return [], {
            "used": False,
            "endpoint": SPARQL_ENDPOINT,
            "error": "SPARQL returned zero person Q-ids",
        }

    return qids, {
        "used": True,
        "endpoint": SPARQL_ENDPOINT,
        "qid_count": len(qids),
    }
