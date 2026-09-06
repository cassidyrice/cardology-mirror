"""Assemble signers/people.jsonl from the curated catalog + Wikipedia summaries.

Dates come from the catalog (NARA + Wikipedia + Bioguide, New Style preferred).
Wikidata P569 is fetched only as a precision=11 QA check. It is never the
public birth date.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.signers.catalog import (
    NARA_FACTSHEET_PDF,
    NARA_FACTSHEET_URL,
    SIGNERS,
    bioguide_url,
    contested_signers,
    verified_signers,
    year_only_signers,
)
from pipeline.wikidata import fetch_entities
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "signer.schema.json"
DEFAULT_OUT = ROOT / "data" / "signers" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "signers" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_signers(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("signers people.jsonl failed schema validation:\n" + "\n".join(errors))


def _month_day(iso: str) -> str:
    return iso[5:]


def wikipedia_crosscheck(signer: dict) -> str:
    public = signer["public_birth_date"]
    wiki = signer.get("wikipedia_birth")
    if not public:
        return "missing"
    if not wiki:
        return "missing"
    if wiki == public:
        return "match"
    if signer.get("calendar_note") == "new_style" and _month_day(wiki) != _month_day(public):
        return "new_style"
    if wiki != public:
        return "mismatch"
    return "match"


def wikidata_qa(entity: dict | None, public_date: str) -> dict[str, Any]:
    if not entity or entity.get("missing") is not None:
        return {"wikidata_date": None, "wikidata_precision": None, "wikidata_qa": "missing"}
    parsed = parse_day_precision_time(entity, "P569")
    if parsed is None:
        claims = (entity.get("claims") or {}).get("P569") or []
        return {
            "wikidata_date": None,
            "wikidata_precision": None,
            "wikidata_qa": "year_only" if claims else "missing",
        }
    iso, precision = parsed
    qa = "match" if iso == public_date else "mismatch"
    return {"wikidata_date": iso, "wikidata_precision": precision, "wikidata_qa": qa}


def assemble_rows(
    entities: dict[str, dict],
    *,
    cache_dir: Path,
) -> tuple[list[dict], list[dict]]:
    exclusions: list[dict] = []
    rows: list[dict] = []
    slugs: set[str] = set()

    for signer in verified_signers():
        public_date = signer["public_birth_date"]
        if not public_date:
            exclusions.append({"slug": signer["slug"], "reason": "verified_missing_public_date"})
            continue
        if signer["slug"] in slugs:
            exclusions.append({"slug": signer["slug"], "reason": "duplicate_slug"})
            continue

        summary = fetch_summary(signer["wikipedia_title"], cache_dir=cache_dir / "summaries")
        source_text = (summary.get("source_text") or "").strip()
        source_url = summary.get("source_url") or ""
        if not source_text or not source_url:
            exclusions.append({"slug": signer["slug"], "reason": "missing_wikipedia_summary"})
            continue

        qa = wikidata_qa(entities.get(signer["qid"]), public_date)
        slugs.add(signer["slug"])
        rows.append(
            {
                "qid": signer["qid"],
                "name": signer["name"],
                "slug": signer["slug"],
                "colony": signer["colony"],
                "colony_code": signer["colony_code"],
                "birth_date": public_date,
                "death_date": signer["nara_death"],
                "card": birth_card_from_iso(public_date),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": signer["wikipedia_title"],
                "bioguide_id": signer["bioguide_id"],
                "nara_birth_raw": signer["nara_birth_raw"],
                "wikipedia_birth": signer["wikipedia_birth"],
                "dob_crosscheck": wikipedia_crosscheck(signer),
                "calendar_note": signer["calendar_note"],
                "footnote": signer["footnote"],
                "wikidata_date": qa["wikidata_date"],
                "wikidata_precision": qa["wikidata_precision"],
                "wikidata_qa": qa["wikidata_qa"],
            }
        )

    rows.sort(key=lambda row: (row["name"], row["slug"]))
    return rows, exclusions


def _held_record(signer: dict) -> dict:
    return {
        "name": signer["name"],
        "slug": signer["slug"],
        "qid": signer["qid"],
        "reason": signer["hold_reason"],
        "nara_birth_raw": signer["nara_birth_raw"],
        "wikipedia_birth": signer["wikipedia_birth"],
        "footnote": signer["footnote"],
    }


def _year_only_record(signer: dict) -> dict:
    return {
        "name": signer["name"],
        "slug": signer["slug"],
        "qid": signer["qid"],
        "nara_birth_raw": signer["nara_birth_raw"],
        "footnote": signer["footnote"],
    }


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
) -> dict[str, Any]:
    qids = [row["qid"] for row in SIGNERS]
    entities = fetch_entities(qids, cache_dir / "wikidata")
    rows, exclusions = assemble_rows(entities, cache_dir=cache_dir)
    if exclusions:
        raise ValueError(
            "verified signer harvest dropped rows:\n"
            + "\n".join(f"{item['slug']}: {item['reason']}" for item in exclusions)
        )
    validate_signers(rows)
    expected = {row["slug"] for row in verified_signers()}
    got = {row["slug"] for row in rows}
    if got != expected:
        raise ValueError(f"verified slug set mismatch: extra={got - expected} missing={expected - got}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_count": len(SIGNERS),
        "verified_count": len(verified_signers()),
        "year_only_count": len(year_only_signers()),
        "contested_count": len(contested_signers()),
        "held": [_held_record(row) for row in contested_signers()],
        "year_only": [_year_only_record(row) for row in year_only_signers()],
        "dob_crosscheck": {
            "match": sum(1 for row in rows if row["dob_crosscheck"] == "match"),
            "new_style": sum(1 for row in rows if row["dob_crosscheck"] == "new_style"),
            "mismatch": sum(1 for row in rows if row["dob_crosscheck"] == "mismatch"),
            "missing": sum(1 for row in rows if row["dob_crosscheck"] == "missing"),
        },
        "wikidata_qa": {
            "match": sum(1 for row in rows if row["wikidata_qa"] == "match"),
            "mismatch": sum(1 for row in rows if row["wikidata_qa"] == "mismatch"),
            "missing": sum(1 for row in rows if row["wikidata_qa"] == "missing"),
            "year_only": sum(1 for row in rows if row["wikidata_qa"] == "year_only"),
        },
        "exclusions": exclusions,
        "sources": [
            f"NARA Signers Factsheet (HTML {NARA_FACTSHEET_URL}; PDF {NARA_FACTSHEET_PDF})",
            "Wikipedia infobox + REST page summary (CC BY-SA 4.0)",
            "Biographical Directory of the United States Congress (Bioguide)",
            "Wikidata P569 precision=11 (CC0) — QA only, not a date source",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
        "bioguide_index": {row["slug"]: bioguide_url(row["bioguide_id"]) for row in rows},
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Harvest Declaration signers birth-card JSONL.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--provenance", type=Path, default=DEFAULT_PROVENANCE)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    args = parser.parse_args(argv)
    result = harvest(out_path=args.out, provenance_path=args.provenance, cache_dir=args.cache_dir)
    prov = result["provenance"]
    print(
        f"wrote {prov['people_count']} verified signers to {args.out} "
        f"(held={prov['contested_count']}, year_only={prov['year_only_count']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
