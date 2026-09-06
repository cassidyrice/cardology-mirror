"""Assemble winter medalist people.jsonl: Wikipedia infobox + Wikidata P569."""

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
from pipeline.olympics.winter.wiki_list import (
    WIKIPEDIA_LIST_URL,
    fetch_infobox_birth,
    fetch_winter_medalist_list,
)
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT / "schema" / "winter_medalist.schema.json"
DEFAULT_OUT = ROOT / "data" / "olympics" / "winter" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "olympics" / "winter" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_medalists(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
        gold = int(row.get("gold") or 0)
        silver = int(row.get("silver") or 0)
        bronze = int(row.get("bronze") or 0)
        total = int(row.get("total") or 0)
        if gold + silver + bronze != total:
            errors.append(f"row {index} ({row.get('qid')}): medal counts do not sum")
    if errors:
        raise ValueError("winter medalist people.jsonl failed schema validation:\n" + "\n".join(errors))


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


_SLUG_TRANSLATE = str.maketrans(
    {
        "ø": "o",
        "Ø": "o",
        "æ": "ae",
        "Æ": "ae",
        "å": "a",
        "Å": "a",
        "ö": "o",
        "Ö": "o",
        "ä": "a",
        "Ä": "a",
        "ü": "u",
        "Ü": "u",
        "ß": "ss",
        "é": "e",
        "è": "e",
        "ê": "e",
        "ó": "o",
        "á": "a",
        "í": "i",
        "ú": "u",
        "ý": "y",
    }
)


def winter_slugify(name: str) -> str:
    return slugify(name.translate(_SLUG_TRANSLATE))


def unique_slug(name: str, used: set[str], *, title: str) -> str:
    base = winter_slugify(name) or winter_slugify(title) or "winter-medalist"
    if base not in used:
        return base
    extra = winter_slugify(title)
    candidate = extra if extra and extra not in used else f"{base}-winter"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def index_entities_by_title(entities: dict[str, dict]) -> dict[str, dict]:
    by_title: dict[str, dict] = {}
    for entity in entities.values():
        if not entity or entity.get("missing") is not None:
            continue
        title = _enwiki_title(entity, "")
        if not title:
            continue
        by_title[title] = entity
        by_title[title.replace("_", " ")] = entity
    return by_title


def classify_row(
    *,
    listed: dict[str, Any],
    infobox: dict[str, Any] | None,
    entity: dict | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(listed.get("name") or "").strip()
    title = str(listed.get("wikipedia_title") or "").strip()
    if not name:
        return "missing_name", None
    if name.lower() in blocklist or title.lower() in blocklist:
        return "blocklist", None
    if not listed.get("sport"):
        return "missing_sport", None
    if not listed.get("nation"):
        return "missing_nation", None

    if infobox is None:
        return "missing_wikipedia_infobox", None
    kind = infobox.get("kind")
    wiki_iso = infobox.get("birth_date")
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
    qid = str(entity.get("id") or "").strip()
    if not qid or not qid.startswith("Q"):
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    if wikidata_iso != wiki_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "wikipedia_title": title,
            "wikipedia_infobox_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    resolved_title = infobox.get("wikipedia_title") or _enwiki_title(entity, title)
    if not resolved_title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    draft = {
        "qid": qid,
        "name": name,
        "nation": listed["nation"],
        "sport": listed["sport"],
        "gold": int(listed["gold"]),
        "silver": int(listed["silver"]),
        "bronze": int(listed["bronze"]),
        "total": int(listed["total"]),
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
    }
    return None, draft


def assemble_rows(
    list_rows: list[dict[str, Any]],
    infoboxes: dict[str, dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    by_title = index_entities_by_title(entities)
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for listed in list_rows:
        title = listed["wikipedia_title"]
        infobox = infoboxes.get(title)
        resolved = str((infobox or {}).get("wikipedia_title") or title).strip()
        entity = (
            by_title.get(resolved)
            or by_title.get(resolved.replace("_", " "))
            or by_title.get(title)
            or by_title.get(title.replace("_", " "))
        )
        reason, draft = classify_row(
            listed=listed,
            infobox=infobox,
            entity=entity,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": extra.get("qid") or (entity.get("id") if entity else None),
                    "name": listed.get("name"),
                    "wikipedia_title": title,
                    "nation": listed.get("nation"),
                    "sport": listed.get("sport"),
                    "wikipedia_infobox_date": extra.get("wikipedia_infobox_date")
                    if extra
                    else (None if infobox is None else infobox.get("birth_date")),
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
                    "wikipedia_title": draft["wikipedia_title"],
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "wikipedia_title": draft["wikipedia_title"],
                    "reason": "missing_wikipedia_summary",
                }
            )
            continue

        drafted.append(
            {
                "qid": draft["qid"],
                "name": draft["name"],
                "slug": "",
                "nation": draft["nation"],
                "sport": draft["sport"],
                "gold": draft["gold"],
                "silver": draft["silver"],
                "bronze": draft["bronze"],
                "total": draft["total"],
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "wikipedia_list_url": WIKIPEDIA_LIST_URL,
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = unique_slug(row["name"], used_slugs, title=row["wikipedia_title"])
        if slug in used_slugs:
            exclusions.append(
                {
                    "qid": row["qid"],
                    "name": row["name"],
                    "wikipedia_title": row["wikipedia_title"],
                    "reason": "duplicate_slug",
                }
            )
            continue
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[int, str, str]:
    return (-int(row.get("total") or 0), row.get("name") or "", row.get("qid") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    list_rows, _wikitext = fetch_winter_medalist_list(
        cache_path=cache_dir / "wikipedia" / "winter_olympic_medalists.json"
    )
    titles = [row["wikipedia_title"] for row in list_rows]
    infoboxes: dict[str, dict[str, Any]] = {}
    for title in titles:
        safe = title.replace("/", "_").replace(" ", "_")
        birth, _page = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "winter_infobox" / f"{safe}.json",
        )
        infoboxes[title] = birth
    resolve_titles = []
    for title in titles:
        resolved = str((infoboxes.get(title) or {}).get("wikipedia_title") or title).strip()
        resolve_titles.append(resolved)
        if resolved != title:
            resolve_titles.append(title)
    entities = fetch_titles(resolve_titles, cache_dir / "wikidata")

    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        list_rows,
        infoboxes,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_medalists(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_list": len(list_rows),
        "catalog_rule": "Wikipedia List of multiple Winter Olympic medalists — primary table, at least eight medals",
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            f"Wikipedia list of multiple Winter Olympic medalists ({WIKIPEDIA_LIST_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "On the Wikipedia 8+ Winter Olympic medalists table AND Wikipedia infobox "
                "YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match"
            ),
            "drop": [
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary or infobox",
                "second-table / one-event medalists not on the 8+ list",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
        },
        "wikipedia_list_url": WIKIPEDIA_LIST_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Winter Olympic multiple-medalist birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Winter Olympic medalists to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
