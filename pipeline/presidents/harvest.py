"""Assemble presidents/people.jsonl from Wikidata + Wikipedia REST summaries."""

from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.presidents.extract import extract_president
from pipeline.presidents.home_state import (
    HOME_STATE_PAGE_URL,
    fetch_home_state_rows,
    match_home_state_row,
)
from pipeline.presidents.qids import FALLBACK_ENWIKI_TITLES, FALLBACK_QIDS
from pipeline.presidents.sparql import try_sparql_president_qids
from pipeline.wikidata import fetch_entities, fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "president.schema.json"
DEFAULT_OUT = ROOT / "data" / "presidents" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "presidents" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_presidents(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("presidents people.jsonl failed schema validation:\n" + "\n".join(errors))


def collect_qids(*, timeout: float = 15.0) -> tuple[list[str], dict[str, Any]]:
    qids, sparql = try_sparql_president_qids(timeout=timeout)
    if qids:
        return qids, {
            "qid_source": "sparql",
            "sparql": sparql,
            "fallback_used": False,
        }
    return list(FALLBACK_QIDS), {
        "qid_source": "fallback_qids",
        "sparql": sparql,
        "fallback_used": True,
        "fallback_qid_count": len(FALLBACK_QIDS),
    }


def _month_day(iso: str) -> str:
    parsed = date.fromisoformat(iso)
    return f"{parsed.month:02d}-{parsed.day:02d}"


def assemble_rows(
    entities: dict[str, dict],
    home_rows: list[dict[str, Any]],
    *,
    cache_dir: Path,
) -> tuple[list[dict], list[dict]]:
    exclusions: list[dict] = []
    drafted: list[dict] = []
    used_home: set[str] = set()

    for qid, entity in entities.items():
        extracted = extract_president(entity)
        if extracted is None:
            exclusions.append({"qid": qid, "reason": "missing_day_precision_dob"})
            continue
        if not extracted.get("enwiki_title"):
            exclusions.append({"qid": qid, "reason": "missing_enwiki_title"})
            continue

        home = match_home_state_row(extracted, home_rows, used_home)
        if home:
            used_home.add(home["name"])
            wiki_md = home["month_day"]
            crosscheck = "match" if wiki_md == _month_day(extracted["birth_date"]) else "mismatch"
        else:
            wiki_md = None
            crosscheck = "missing"

        summary = fetch_summary(extracted["enwiki_title"], cache_dir=cache_dir / "summaries")
        source_text = (summary.get("source_text") or "").strip()
        source_url = summary.get("source_url") or ""
        if not source_text or not source_url:
            exclusions.append({"qid": qid, "reason": "missing_wikipedia_summary"})
            continue

        drafted.append(
            {
                "qid": extracted["qid"],
                "name": extracted["name"],
                "slug": slugify(extracted["name"]),
                "birth_date": extracted["birth_date"],
                "death_date": extracted["death_date"],
                "card": birth_card_from_iso(extracted["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": extracted["enwiki_title"],
                "terms": extracted["terms"],
                "wikipedia_month_day": wiki_md,
                "dob_crosscheck": crosscheck,
            }
        )

    slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        if row["slug"] in slugs:
            exclusions.append({"qid": row["qid"], "reason": "duplicate_slug"})
            continue
        slugs.add(row["slug"])
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[int, str]:
    ordinals = []
    for term in row.get("terms") or []:
        value = term.get("ordinal")
        if value and str(value).isdigit():
            ordinals.append(int(value))
    return (min(ordinals) if ordinals else 10_000, row["name"])


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    sparql_timeout: float = 15.0,
) -> dict[str, Any]:
    qids, qid_meta = collect_qids(timeout=sparql_timeout)
    entities = fetch_entities(qids, cache_dir / "wikidata")

    # If SPARQL missed someone in the known set, fill from titles (still no invented DOBs).
    found = {qid for qid, entity in entities.items() if entity and entity.get("missing") is None}
    if qid_meta.get("fallback_used") or len(found) < len(FALLBACK_QIDS):
        extra = fetch_titles(FALLBACK_ENWIKI_TITLES, cache_dir / "wikidata")
        entities.update(extra)

    home_cache = cache_dir / "wikipedia" / "home_state.json"
    home_rows, _wikitext = fetch_home_state_rows(cache_path=home_cache)
    rows, exclusions = assemble_rows(entities, home_rows, cache_dir=cache_dir)
    validate_presidents(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    first_terms = sum(1 for row in rows if row.get("terms"))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "qid_source": qid_meta.get("qid_source"),
        "sparql_fallback_used": bool(qid_meta.get("fallback_used")),
        "sparql": qid_meta.get("sparql"),
        "home_state_url": HOME_STATE_PAGE_URL,
        "home_state_rows": len(home_rows),
        "people_with_terms": first_terms,
        "dob_crosscheck": {
            "match": sum(1 for row in rows if row["dob_crosscheck"] == "match"),
            "mismatch": sum(1 for row in rows if row["dob_crosscheck"] == "mismatch"),
            "missing": sum(1 for row in rows if row["dob_crosscheck"] == "missing"),
        },
        "exclusions": exclusions,
        "sources": [
            "Wikidata P569 / P570 / P39 (CC0)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
            "Wikipedia list of presidents by home state (month/day cross-check, CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Harvest US presidents birth-card JSONL.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--provenance", type=Path, default=DEFAULT_PROVENANCE)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--sparql-timeout", type=float, default=15.0)
    args = parser.parse_args(argv)
    result = harvest(
        out_path=args.out,
        provenance_path=args.provenance,
        cache_dir=args.cache_dir,
        sparql_timeout=args.sparql_timeout,
    )
    prov = result["provenance"]
    print(
        f"wrote {prov['people_count']} presidents to {args.out} "
        f"(sparql_fallback_used={prov['sparql_fallback_used']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
