"""Assemble time_poty/people.jsonl: Wikipedia POTY list + Wikidata P569 + bios.

TIME vault is context only. It is never fetched and never used as a date source.
"""

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
from pipeline.cabinet.wiki_infobox import fetch_infobox_birth
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.pulitzer_fiction.bios import parse_wikipedia_birth_field
from pipeline.time_poty.wiki_list import (
    LIST_URL,
    TIME_HOME,
    TIME_POTY,
    TIME_VAULT,
    fetch_honoree_people,
    resolve_enwiki_title,
)
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "time_poty.schema.json"
DEFAULT_OUT = ROOT / "data" / "time_poty" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "time_poty" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"

HUMAN_QID = "Q5"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_time_poty(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("time_poty people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def _instance_ids(entity: dict) -> set[str]:
    ids: set[str] = set()
    for claim in (entity.get("claims") or {}).get("P31") or []:
        snak = claim.get("mainsnak") or {}
        if snak.get("snaktype") != "value":
            continue
        raw = (snak.get("datavalue") or {}).get("value") or {}
        qid = str(raw.get("id") or "")
        if qid.startswith("Q"):
            ids.add(qid)
    return ids


def unique_slug(name: str, used: set[str], *, title: str) -> str:
    base = slugify(name) or slugify(title) or "time-person-of-the-year"
    if base not in used:
        return base
    extra = slugify(title) or "honoree"
    candidate = extra if extra not in used else f"{base}-poty"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _normalize_honors(honors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for honor in honors:
        year = str(honor.get("year") or "").strip()
        label = str(honor.get("choice_label") or "").strip()
        if not year or not label:
            continue
        key = (year, label)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(
            {
                "year": year,
                "choice_label": label,
                "shared": bool(honor.get("shared")),
                "wikipedia_list_url": str(honor.get("wikipedia_list_url") or LIST_URL),
                "time_context_url": TIME_VAULT,
            }
        )
    cleaned.sort(key=lambda item: (item["year"], item["choice_label"]))
    return cleaned


def classify_row(
    *,
    person: dict[str, Any],
    listed: dict[str, Any] | None,
    entity: dict | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(person.get("name") or "")
    title = str(person.get("enwiki_title") or "")
    if name.lower() in blocklist or title.lower() in blocklist or slugify(name) in blocklist:
        return "blocklist", None
    honors = _normalize_honors(list(person.get("honors") or []))
    if not honors:
        return "missing_honor", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None
    qid = str(entity.get("id") or "")
    if not qid.startswith("Q") or len(qid) < 2:
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None
    if HUMAN_QID not in _instance_ids(entity):
        return "not_a_person", None

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

    resolved_title = listed.get("wikipedia_title") or _enwiki_title(entity, title)
    if not resolved_title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "wikipedia_list_url": LIST_URL,
        "time_context_url": TIME_VAULT,
        "honors": honors,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
    }
    return None, draft


def _entities_by_title(entities: dict[str, dict]) -> dict[str, dict]:
    by_title: dict[str, dict] = {}
    for entity in entities.values():
        if not entity or entity.get("missing") is not None:
            continue
        title = _enwiki_title(entity, "")
        if title:
            by_title[title] = entity
            by_title[title.replace(" ", "_")] = entity
        labels = entity.get("labels") or {}
        label = str((labels.get("en") or {}).get("value") or "").strip()
        if label:
            by_title.setdefault(label, entity)
    return by_title


def assemble_rows(
    people: list[dict[str, Any]],
    infoboxes: dict[str, dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    catalog_concepts: list[dict[str, Any]] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    for concept in catalog_concepts or []:
        exclusions.append(
            {
                "qid": None,
                "name": concept.get("name") or concept.get("choice_label"),
                "wikipedia_title": "",
                "year": concept.get("year"),
                "reason": "concept",
            }
        )
    drafted: list[dict] = []
    by_title = _entities_by_title(entities)

    for person in people:
        title = str(person.get("enwiki_title") or "")
        listed = infoboxes.get(title)
        entity = by_title.get(title) or by_title.get(title.replace(" ", "_"))
        reason, draft = classify_row(
            person=person,
            listed=listed,
            entity=entity,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": extra.get("qid") or (entity or {}).get("id"),
                    "name": person.get("name"),
                    "wikipedia_title": title,
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
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "wikipedia_list_url": draft["wikipedia_list_url"],
                "time_context_url": TIME_VAULT,
                "honors": draft["honors"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    merged: dict[str, dict] = {}
    for row in drafted:
        key = row["qid"]
        if key not in merged:
            merged[key] = row
            continue
        existing = merged[key]
        honors = {(item["year"], item["choice_label"]): item for item in existing["honors"]}
        for honor in row["honors"]:
            honors[(honor["year"], honor["choice_label"])] = honor
        existing["honors"] = sorted(honors.values(), key=lambda item: (item["year"], item["choice_label"]))

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in merged.values():
        slug = unique_slug(row["name"], used_slugs, title=row["wikipedia_title"])
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, int, str]:
    years = [int(honor.get("year") or 9999) for honor in row.get("honors") or []]
    first_year = min(years) if years else 9999
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
    billed, concepts, _wikitext = fetch_honoree_people(cache_dir=cache_dir / "wikipedia" / "time_poty")
    for act in billed:
        title = str(act["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        resolved = resolve_enwiki_title(
            title,
            cache_path=cache_dir / "wikipedia" / "time_poty_redirects" / f"{safe}.json",
        )
        act["enwiki_title"] = resolved

    titles = [str(act["enwiki_title"]) for act in billed]
    entities = fetch_titles(titles, cache_dir / "wikidata")

    infoboxes: dict[str, dict[str, Any]] = {}
    for person in billed:
        title = str(person["enwiki_title"])
        if not title:
            continue
        safe = title.replace("/", "_").replace(" ", "_")
        birth, wikitext = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "time_poty_infobox" / f"{safe}.json",
        )
        if birth.get("kind") != "day":
            extra = parse_wikipedia_birth_field(wikitext)
            if extra.get("kind") == "day":
                birth = {
                    **birth,
                    "kind": "day",
                    "birth_date": extra["birth_date"],
                    "month_day": str(extra["birth_date"])[5:] if extra.get("birth_date") else None,
                }
            elif extra.get("kind") == "year_only" and birth.get("kind") == "missing":
                birth = {**birth, "kind": "year_only", "birth_date": None}
        infoboxes[title] = birth

    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        billed,
        infoboxes,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
        catalog_concepts=concepts,
    )
    validate_time_poty(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_people": len(billed),
        "catalog_concepts": len(concepts),
        "catalog_honor_years": len({honor["year"] for person in billed for honor in person.get("honors") or []}),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            f"Wikipedia Time Person of the Year list ({LIST_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
            f"TIME magazine / vault is context only ({TIME_HOME}, {TIME_POTY}, {TIME_VAULT}) — not a date source",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikipedia Person(s) of the Year Choice-column named human, or a year whose "
                "Notes say “Represented by” named people, or Apollo 8 Lifetime name:year lines, "
                "AND Wikidata instance-of human AND Wikipedia infobox YYYY-MM-DD AND Wikidata "
                "P569 precision=11 AND dates match. Duals/joint years are split per person."
            ),
            "drop": [
                "concept / machine / group-as-concept Choice years (Fighting-Man, Computer, You, etc.)",
                "notes-only spotlight names that are not “Represented by” honorees",
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "not_a_person",
                "missing Wikipedia summary",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "person_scope_only": True,
            "time_vault": (
                "TIME.com / vault is context for the honor, not a date source. "
                "Vault HTML is not fetched. Dates are never invented from it."
            ),
        },
        "time_home": TIME_HOME,
        "time_vault": TIME_VAULT,
        "wikipedia_list_url": LIST_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest TIME Person of the Year birth-card JSONL (people only, day-precision)."
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
        f"wrote {prov['kept']} TIME Person of the Year people to {args.out} "
        f"(catalog {prov['catalog_people']}; concepts {prov['catalog_concepts']}; "
        f"excluded {prov['excluded']}: {prov['by_reason']})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
