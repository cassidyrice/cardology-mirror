"""Optional Wikidata SPARQL lookup for multiple Summer Olympic gold medalists.

Celebrity pipeline stays REST-only. This olympics harvest may try SPARQL
and must fall back to the Wikipedia multiple-gold list + wbgetentities.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from pipeline.http import fetch_json
from pipeline.olympics.games import OLYMPIC_GOLD, SUMMER_GAME_QIDS

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"


def _query() -> str:
    values = " ".join(f"wd:{qid}" for qid in sorted(SUMMER_GAME_QIDS, key=lambda item: int(item[1:])))
    return f"""
SELECT ?person (COUNT(DISTINCT ?stmt) AS ?golds) WHERE {{
  VALUES ?games {{ {values} }}
  ?person wdt:P31 wd:Q5 .
  ?person p:P1344 ?stmt .
  ?stmt pq:P166 wd:{OLYMPIC_GOLD} .
  ?stmt ps:P1344 ?event .
  ?event wdt:P361+ ?games .
}}
GROUP BY ?person
HAVING (COUNT(DISTINCT ?stmt) >= 2)
""".strip()


def try_sparql_multi_gold_qids(*, timeout: float = 60.0) -> tuple[list[str], dict[str, Any]]:
    """Return unique Q-ids (2+ Summer golds) and a provenance record.

    Empty list on failure so harvest can fall back to Wikipedia lists.
    """
    url = f"{SPARQL_ENDPOINT}?{urlencode({'query': _query()})}"
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
    counts: dict[str, int] = {}
    seen: set[str] = set()
    for row in bindings:
        uri = ((row.get("person") or {}).get("value")) or ""
        qid = uri.rsplit("/", 1)[-1]
        if not qid.startswith("Q") or qid in seen:
            continue
        seen.add(qid)
        qids.append(qid)
        raw = ((row.get("golds") or {}).get("value")) or "0"
        try:
            counts[qid] = int(float(raw))
        except ValueError:
            counts[qid] = 0

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
        "gold_counts": counts,
        "rule": "P1344 event + P166 Olympic gold + event P361+ Summer Games; >= 2 golds",
    }
