"""Assemble Nobel laureate people.jsonl: Nobel day DOB + Wikidata P569 verify."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.nobel.api import (
    extract_prizes,
    fetch_laureates,
    is_organization,
    laureate_name,
    laureate_qid,
    nobel_page_url,
    wikipedia_title,
)
from pipeline.nobel.dates import classify_nobel_date
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "nobel.schema.json"
DEFAULT_OUT = ROOT / "data" / "nobel" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "nobel" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"
NOBEL_API_HOME = "https://api.nobelprize.org/2.1/"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_laureates(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("nobel people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def unique_slug(name: str, used: set[str], *, nobel_id: str) -> str:
    base = slugify(name) or f"laureate-{nobel_id}"
    if base not in used:
        return base
    candidate = slugify(f"{name}-{nobel_id}") or f"{base}-{nobel_id}"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def classify_row(
    *,
    laureate: dict[str, Any],
    entity: dict | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    nobel_id = str(laureate.get("id") or "").strip()
    name = laureate_name(laureate)
    qid = laureate_qid(laureate)

    if is_organization(laureate):
        return "organization", None
    if not name:
        return "missing_name", None
    if qid and qid.lower() in blocklist:
        return "blocklist", None
    if name.lower() in blocklist:
        return "blocklist", None

    birth_raw = ((laureate.get("birth") or {}).get("date"))
    kind, nobel_iso = classify_nobel_date(birth_raw if isinstance(birth_raw, str) else None)
    if kind == "missing":
        return "missing_birth", None
    if kind == "year_only":
        return "year_only", None
    if kind == "invalid" or not nobel_iso:
        return "invalid_nobel_date", None

    birth = date.fromisoformat(nobel_iso)
    if birth > _minus_years(today, 18):
        return "minor", None

    if not qid:
        return "missing_qid", None
    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    parsed = parse_day_precision_time(entity, "P569")
    if parsed is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed
    if wikidata_iso != nobel_iso:
        return "dob_conflict", None

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    title = _enwiki_title(entity, wikipedia_title(laureate))
    if not title:
        return "missing_enwiki_title", None

    death_raw = ((laureate.get("death") or {}).get("date"))
    death_kind, nobel_death = classify_nobel_date(death_raw if isinstance(death_raw, str) else None)
    wikidata_death = parse_day_precision_time(entity, "P570")
    death_date = None
    if death_kind == "day" and nobel_death:
        death_date = nobel_death
        if wikidata_death and wikidata_death[0] != nobel_death:
            # Keep the page; death is not the birth-card coordinate. Prefer Nobel.
            death_date = nobel_death
    elif wikidata_death:
        death_date = wikidata_death[0]

    prizes = extract_prizes(laureate)
    if not prizes:
        return "missing_prize", None

    draft = {
        "qid": qid,
        "nobel_id": nobel_id or qid,
        "name": name,
        "birth_date": nobel_iso,
        "death_date": death_date,
        "wikipedia_title": title,
        "nobel_url": nobel_page_url(laureate),
        "prizes": prizes,
        "nobel_birth_date": nobel_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
    }
    return None, draft


def assemble_rows(
    laureates: list[dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for laureate in laureates:
        qid = laureate_qid(laureate)
        reason, draft = classify_row(
            laureate=laureate,
            entity=entities.get(qid) if qid else None,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None:
            exclusions.append(
                {
                    "nobel_id": str(laureate.get("id") or ""),
                    "qid": qid or None,
                    "name": laureate_name(laureate) or None,
                    "nobel_birth": ((laureate.get("birth") or {}).get("date")),
                    "reason": reason or "unclassified",
                }
            )
            continue

        summary = fetch_summary(draft["wikipedia_title"], cache_dir=cache_dir / "summaries")
        source_text = (summary.get("source_text") or "").strip()
        source_url = summary.get("source_url") or ""
        wiki_short = (summary.get("description") or "").strip()
        if description_blocked(wiki_short) or description_blocked(
            " ".join(part for part in (draft.get("wikidata_description"), wiki_short) if part)
        ):
            exclusions.append(
                {
                    "nobel_id": draft["nobel_id"],
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "nobel_id": draft["nobel_id"],
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "reason": "missing_wikipedia_summary",
                }
            )
            continue
        if not draft.get("nobel_url"):
            exclusions.append(
                {
                    "nobel_id": draft["nobel_id"],
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "reason": "missing_nobel_url",
                }
            )
            continue

        drafted.append(
            {
                "qid": draft["qid"],
                "nobel_id": draft["nobel_id"],
                "name": draft["name"],
                "slug": "",
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "nobel_url": draft["nobel_url"],
                "prizes": draft["prizes"],
                "nobel_birth_date": draft["nobel_birth_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = unique_slug(row["name"], used_slugs, nobel_id=row["nobel_id"])
        if slug in used_slugs:
            exclusions.append({"qid": row["qid"], "name": row["name"], "reason": "duplicate_slug"})
            continue
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, str, str]:
    years = [prize.get("year") or "9999" for prize in row.get("prizes") or []]
    first_year = min(years) if years else "9999"
    return (row.get("name") or "", first_year, row.get("qid") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    laureates, meta = fetch_laureates(cache_dir=cache_dir / "nobel")
    people = [item for item in laureates if not is_organization(item)]
    qids = [laureate_qid(item) for item in people if laureate_qid(item)]
    entities = fetch_entities(qids, cache_dir / "wikidata")
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        laureates,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_laureates(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "nobel_api_count": int(meta.get("count") or len(laureates)),
        "catalog_people": len(people),
        "catalog_organizations": sum(1 for item in laureates if is_organization(item)),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            "Nobel Prize API v2.1 laureates (https://api.nobelprize.org/2.1/)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": "Nobel API YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match",
            "drop": [
                "year_only (Nobel YYYY-00-00 / year-only)",
                "dob_conflict (Nobel day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "organization",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary or Nobel URL",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
        },
        "nobel_api": NOBEL_API_HOME,
        "nobel_meta": {
            "terms": meta.get("terms"),
            "license": meta.get("license"),
            "disclaimer": meta.get("disclaimer"),
        },
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Nobel laureate birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Nobel laureates to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
