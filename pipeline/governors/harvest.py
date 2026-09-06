"""Assemble governors/people.jsonl: Wikipedia list DOB + Wikidata P569 verify."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.governors.catalog import (
    BALLOTPEDIA_ROSTER_URL,
    NGA_ROSTER_URL,
    SITTING_GOVERNORS,
    SITTING_QIDS,
    WIKIPEDIA_LIST_URL,
)
from pipeline.governors.wiki_list import fetch_governor_list_rows, match_list_row
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "governor.schema.json"
DEFAULT_OUT = ROOT / "data" / "governors" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "governors" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_governors(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("governors people.jsonl failed schema validation:\n" + "\n".join(errors))


def _minus_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def _wikidata_description(entity: dict) -> str:
    descriptions = entity.get("descriptions") or {}
    return str((descriptions.get("en") or {}).get("value") or "").strip()


def _enwiki_title(entity: dict, fallback: str) -> str:
    sitelinks = entity.get("sitelinks") or {}
    enwiki = sitelinks.get("enwiki") or {}
    title = str(enwiki.get("title") or "").strip()
    return title or fallback


def classify_row(
    *,
    catalog: dict[str, str],
    listed: dict[str, Any] | None,
    entity: dict | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = catalog["name"]
    qid = catalog["qid"]
    if name.lower() in blocklist or qid.lower() in blocklist or catalog["slug"].lower() in blocklist:
        return "blocklist", None
    if listed is None:
        return "missing_from_wikipedia_list", None

    kind = listed.get("birth_kind")
    list_iso = listed.get("birth_date")
    if kind == "year_only" or (kind != "day" and not list_iso):
        if kind == "year_only":
            return "year_only", None
        return "missing_birth", None
    if kind == "invalid":
        return "invalid_wikipedia_date", None
    if kind != "day" or not list_iso:
        return "missing_birth", None

    birth = date.fromisoformat(str(list_iso))
    if birth > _minus_years(today, 18):
        return "minor", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    if wikidata_iso != list_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "slug": catalog["slug"],
            "state": catalog["state"],
            "wikipedia_list_date": list_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    title = _enwiki_title(entity, catalog["enwiki_title"])
    if not title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    draft = {
        "qid": qid,
        "name": name,
        "slug": catalog["slug"],
        "state": catalog["state"],
        "state_slug": catalog["state_slug"],
        "postal": catalog["postal"],
        "birth_date": list_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": title,
        "wikipedia_list_date": list_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "nga_url": listed.get("nga_url"),
        "wikidata_description": wiki_desc,
    }
    return None, draft


def assemble_rows(
    list_rows: list[dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    catalog: tuple[dict[str, str], ...] = SITTING_GOVERNORS,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []
    used_states: set[str] = set()

    for catalog_row in catalog:
        listed = match_list_row(catalog_row, list_rows)
        reason, draft = classify_row(
            catalog=catalog_row,
            listed=listed,
            entity=entities.get(catalog_row["qid"]),
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": catalog_row["qid"],
                    "name": catalog_row["name"],
                    "state": catalog_row["state"],
                    "slug": catalog_row["slug"],
                    "wikipedia_list_date": extra.get("wikipedia_list_date")
                    if extra
                    else (None if listed is None else listed.get("birth_date")),
                    "wikidata_birth_date": extra.get("wikidata_birth_date"),
                    "reason": reason or "unclassified",
                }
            )
            continue
        used_states.add(catalog_row["state"])

        summary = fetch_summary(draft["wikipedia_title"], cache_dir=cache_dir / "summaries")
        source_text = (summary.get("source_text") or "").strip()
        source_url = summary.get("source_url") or ""
        wiki_short = (summary.get("description") or "").strip()
        if description_blocked(wiki_short) or description_blocked(
            " ".join(part for part in (draft.get("wikidata_description"), wiki_short) if part)
        ):
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "state": draft["state"],
                    "slug": draft["slug"],
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "state": draft["state"],
                    "slug": draft["slug"],
                    "reason": "missing_wikipedia_summary",
                }
            )
            continue

        drafted.append(
            {
                "qid": draft["qid"],
                "name": draft["name"],
                "slug": draft["slug"],
                "state": draft["state"],
                "state_slug": draft["state_slug"],
                "postal": draft["postal"],
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "wikipedia_list_date": draft["wikipedia_list_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
                "nga_url": draft["nga_url"],
                "ballotpedia_url": BALLOTPEDIA_ROSTER_URL,
            }
        )

    extra_states = [row["state"] for row in list_rows if row["state"] not in {item["state"] for item in catalog}]
    for state in extra_states:
        exclusions.append({"qid": None, "name": None, "state": state, "reason": "not_in_catalog"})

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        if row["slug"] in used_slugs:
            exclusions.append(
                {
                    "qid": row["qid"],
                    "name": row["name"],
                    "state": row["state"],
                    "slug": row["slug"],
                    "reason": "duplicate_slug",
                }
            )
            continue
        used_slugs.add(row["slug"])
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, str]:
    return (row.get("state") or "", row.get("name") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    list_rows, _wikitext = fetch_governor_list_rows(
        cache_path=cache_dir / "wikipedia" / "current_governors.json"
    )
    entities = fetch_entities(SITTING_QIDS, cache_dir / "wikidata")
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        list_rows,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_governors(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_sitting": len(SITTING_GOVERNORS),
        "wikipedia_list_parsed": len(list_rows),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            f"Wikipedia list of current United States governors ({WIKIPEDIA_LIST_URL})",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
            f"National Governors Association roster ({NGA_ROSTER_URL})",
            f"Ballotpedia governor office index ({BALLOTPEDIA_ROSTER_URL})",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": "Wikipedia current-governors list YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match",
            "drop": [
                "year_only (Wikipedia list year without month/day)",
                "dob_conflict (Wikipedia list day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
                "not in sitting catalog / missing from Wikipedia list",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "dc_territories": False,
        },
        "wikipedia_list_url": WIKIPEDIA_LIST_URL,
        "ballotpedia_url": BALLOTPEDIA_ROSTER_URL,
        "nga_url": NGA_ROSTER_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest current US governors birth-card JSONL (day-precision only)."
    )
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--provenance", type=Path, default=DEFAULT_PROVENANCE)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--blocklist", type=Path, default=DEFAULT_BLOCKLIST)
    args = parser.parse_args(argv)
    result = harvest(
        out_path=args.out,
        provenance_path=args.provenance,
        cache_dir=args.cache_dir,
        blocklist_path=args.blocklist,
    )
    prov = result["provenance"]
    print(
        f"wrote {prov['kept']} sitting governors to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
