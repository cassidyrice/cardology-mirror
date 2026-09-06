"""Assemble cabinet/people.jsonl: Wikipedia infobox DOB + Wikidata P569 verify."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.catalog import (
    SITTING_CABINET,
    SITTING_QIDS,
    WHITEHOUSE_CABINET_URL,
    WIKIPEDIA_CABINET_URL,
    WIKIPEDIA_SECOND_CABINET_URL,
)
from pipeline.cabinet.wiki_infobox import (
    fetch_infobox_birth,
    fetch_whitehouse_html,
    whitehouse_has_name,
)
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "cabinet.schema.json"
DEFAULT_OUT = ROOT / "data" / "cabinet" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "cabinet" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_cabinet(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("cabinet people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def office_phrase(office: str, *, acting: bool) -> str:
    if acting and not office.lower().startswith("acting "):
        return f"Acting {office}"
    return office


def classify_row(
    *,
    catalog: dict[str, object],
    listed: dict[str, Any] | None,
    entity: dict | None,
    on_whitehouse: bool,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(catalog["name"])
    qid = str(catalog["qid"])
    slug = str(catalog["slug"])
    if name.lower() in blocklist or qid.lower() in blocklist or slug.lower() in blocklist:
        return "blocklist", None
    if not on_whitehouse:
        return "missing_from_whitehouse", None
    if listed is None:
        return "missing_wikipedia_infobox", None

    kind = listed.get("kind")
    wiki_iso = listed.get("birth_date")
    if kind == "year_only":
        return "year_only", None
    if kind == "invalid":
        return "invalid_wikipedia_date", None
    if kind != "day" or not wiki_iso:
        return "missing_birth", None

    birth = date.fromisoformat(str(wiki_iso))
    if birth > _minus_years(today, 18):
        return "minor", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    if wikidata_iso != wiki_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "slug": slug,
            "office": catalog["office"],
            "wikipedia_infobox_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    title = listed.get("wikipedia_title") or _enwiki_title(entity, str(catalog["enwiki_title"]))
    if not title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    acting = bool(catalog.get("acting"))
    draft = {
        "qid": qid,
        "name": name,
        "slug": slug,
        "office": str(catalog["office"]),
        "office_id": str(catalog["office_id"]),
        "acting": acting,
        "succession": int(catalog["succession"]),
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": title,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
        "whitehouse_url": WHITEHOUSE_CABINET_URL,
    }
    return None, draft


def assemble_rows(
    infoboxes: dict[str, dict[str, Any]],
    entities: dict[str, dict],
    whitehouse_html: str,
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    catalog: tuple[dict[str, object], ...] = SITTING_CABINET,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for catalog_row in catalog:
        slug = str(catalog_row["slug"])
        listed = infoboxes.get(slug)
        on_whitehouse = whitehouse_has_name(
            whitehouse_html,
            str(catalog_row["name"]),
            str(catalog_row.get("whitehouse_name") or ""),
        )
        reason, draft = classify_row(
            catalog=catalog_row,
            listed=listed,
            entity=entities.get(str(catalog_row["qid"])),
            on_whitehouse=on_whitehouse,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": str(catalog_row["qid"]),
                    "name": str(catalog_row["name"]),
                    "office": str(catalog_row["office"]),
                    "slug": slug,
                    "wikipedia_infobox_date": extra.get("wikipedia_infobox_date")
                    if extra
                    else (None if listed is None else listed.get("birth_date")),
                    "wikidata_birth_date": extra.get("wikidata_birth_date"),
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
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "office": draft["office"],
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
                    "office": draft["office"],
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
                "office": draft["office"],
                "office_id": draft["office_id"],
                "acting": draft["acting"],
                "succession": draft["succession"],
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
                "whitehouse_url": draft["whitehouse_url"],
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        if row["slug"] in used_slugs:
            exclusions.append(
                {
                    "qid": row["qid"],
                    "name": row["name"],
                    "office": row["office"],
                    "slug": row["slug"],
                    "reason": "duplicate_slug",
                }
            )
            continue
        used_slugs.add(row["slug"])
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[int, str]:
    return (int(row.get("succession") or 99), row.get("name") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    whitehouse_html = fetch_whitehouse_html(
        cache_path=cache_dir / "whitehouse" / "cabinet.html"
    )
    infoboxes: dict[str, dict[str, Any]] = {}
    for row in SITTING_CABINET:
        slug = str(row["slug"])
        title = str(row["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        birth, _wikitext = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "cabinet_infobox" / f"{safe}.json",
        )
        infoboxes[slug] = birth

    entities = fetch_entities(SITTING_QIDS, cache_dir / "wikidata")
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        infoboxes,
        entities,
        whitehouse_html,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_cabinet(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_sitting": len(SITTING_CABINET),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            f"White House cabinet roster ({WHITEHOUSE_CABINET_URL})",
            f"Wikipedia Cabinet of the United States ({WIKIPEDIA_CABINET_URL})",
            f"Wikipedia Second cabinet of Donald Trump ({WIKIPEDIA_SECOND_CABINET_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "White House VP+15 roster AND Wikipedia infobox YYYY-MM-DD "
                "AND Wikidata P569 precision=11 AND dates match"
            ),
            "drop": [
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
                "missing from White House cabinet page",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "cabinet_level_officials": False,
        },
        "whitehouse_url": WHITEHOUSE_CABINET_URL,
        "wikipedia_cabinet_url": WIKIPEDIA_CABINET_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest current US Cabinet birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} sitting cabinet officers to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
