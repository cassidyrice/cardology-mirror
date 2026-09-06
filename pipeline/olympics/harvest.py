"""Assemble olympics/people.jsonl: Wikidata gold medals + Wikipedia P569 verify."""

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
from pipeline.olympics.medals import (
    build_medal_records,
    country_label,
    extract_gold_event_qids,
    person_sport_labels,
)
from pipeline.olympics.sparql import try_sparql_multi_gold_qids
from pipeline.olympics.wiki_list import LIST_TITLES, fetch_list_titles
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities, fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "olympics.schema.json"
DEFAULT_OUT = ROOT / "data" / "olympics" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "olympics" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"
WIKIDATA_ITEM = "https://www.wikidata.org/wiki/"
MIN_SUMMER_GOLDS = 2


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_olympians(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("olympics people.jsonl failed schema validation:\n" + "\n".join(errors))


def _minus_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def _wikidata_description(entity: dict) -> str:
    descriptions = entity.get("descriptions") or {}
    return str((descriptions.get("en") or {}).get("value") or "").strip()


def _enwiki_title(entity: dict) -> str:
    sitelinks = entity.get("sitelinks") or {}
    enwiki = sitelinks.get("enwiki") or {}
    return str(enwiki.get("title") or "").strip()


def _label(entity: dict) -> str:
    labels = entity.get("labels") or {}
    return str((labels.get("en") or {}).get("value") or "").strip()


def unique_slug(name: str, used: set[str], *, qid: str) -> str:
    base = slugify(name) or f"olympian-{qid.lower()}"
    if base not in used:
        return base
    candidate = slugify(f"{name}-{qid}") or f"{base}-{qid.lower()}"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def medal_phrase(row: dict[str, Any]) -> str:
    count = int(row.get("gold_count") or 0)
    sports = [item for item in (row.get("sports") or []) if item]
    sport = ", ".join(sports[:3]) if sports else "Summer Olympic sport"
    noun = "gold medal" if count == 1 else "gold medals"
    return f"{count} Summer Olympic {noun} in {sport}"


def classify_row(
    *,
    entity: dict | None,
    listed: dict[str, Any] | None,
    events: dict[str, dict],
    extras: dict[str, dict],
    today: date,
    blocklist: set[str],
    sparql_gold_count: int | None = None,
) -> tuple[str | None, dict[str, Any] | None]:
    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    qid = str(entity.get("id") or "")
    name = _label(entity) or _enwiki_title(entity)
    title = _enwiki_title(entity)
    if qid.lower() in blocklist or (name and name.lower() in blocklist):
        return "blocklist", None
    if not name:
        return "missing_name", None
    if not title:
        return "missing_enwiki_title", None

    medals = build_medal_records(entity, events)
    gold_count = len(medals)
    if gold_count < MIN_SUMMER_GOLDS:
        if sparql_gold_count and sparql_gold_count >= MIN_SUMMER_GOLDS and extract_gold_event_qids(entity):
            # Event entities missing; SPARQL already required 2+ Summer golds.
            gold_count = int(sparql_gold_count)
        else:
            if gold_count == 0 and not extract_gold_event_qids(entity):
                return "missing_summer_gold", None
            return "insufficient_summer_golds", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    birth = date.fromisoformat(wikidata_iso)
    if birth > _minus_years(today, 18):
        return "minor", None

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
    if wiki_iso != wikidata_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "wikipedia_infobox_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    death = parse_day_precision_time(entity, "P570")
    sports = person_sport_labels(entity, extras)
    if not sports:
        sports = [item["sport"] for item in medals if item.get("sport")]
        sports = list(dict.fromkeys(sports))
    country = country_label(entity, extras)
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": listed.get("wikipedia_title") or title,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "gold_count": gold_count,
        "sports": sports,
        "country": country,
        "medals": medals,
        "wikidata_description": wiki_desc,
    }
    return None, draft


def _needed_extra_ids(entity: dict, event_qids: list[str]) -> list[str]:
    ids: list[str] = []
    seen: set[str] = set()
    for qid in event_qids:
        if qid and qid not in seen:
            seen.add(qid)
            ids.append(qid)
    claims = entity.get("claims") or {}
    for prop in ("P641", "P1532", "P27"):
        for claim in claims.get(prop, []) or []:
            if claim.get("rank") == "deprecated":
                continue
            raw = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value")
            if isinstance(raw, dict) and raw.get("id"):
                qid = str(raw["id"])
                if qid not in seen:
                    seen.add(qid)
                    ids.append(qid)
    return ids


def catalog_qids(
    *,
    cache_dir: Path,
) -> tuple[list[str], dict[str, Any]]:
    qids, sparql_meta = try_sparql_multi_gold_qids()
    if qids:
        return qids, {"source": "sparql", **sparql_meta, "list_titles": []}

    titles, sources = fetch_list_titles(cache_dir=cache_dir / "wikipedia" / "olympics_lists")
    if not titles:
        return [], {
            "source": "none",
            "sparql": sparql_meta,
            "list_titles": list(LIST_TITLES),
            "error": "SPARQL empty and Wikipedia lists returned no titles",
        }
    entities = fetch_titles(titles, cache_dir / "wikidata")
    fallback: list[str] = []
    seen: set[str] = set()
    for entity in entities.values():
        qid = str(entity.get("id") or "")
        if not qid.startswith("Q") or qid in seen or entity.get("missing") is not None:
            continue
        seen.add(qid)
        fallback.append(qid)
    return fallback, {
        "source": "wikipedia_list",
        "sparql": sparql_meta,
        "list_titles": list(LIST_TITLES),
        "list_sources": sources,
        "title_count": len(titles),
        "qid_count": len(fallback),
    }


def assemble_rows(
    entities: dict[str, dict],
    infoboxes: dict[str, dict[str, Any]],
    events: dict[str, dict],
    extras: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    sparql_counts: dict[str, int] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    counts = sparql_counts or {}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for qid, entity in entities.items():
        listed = infoboxes.get(qid)
        reason, draft = classify_row(
            entity=entity,
            listed=listed,
            events=events,
            extras=extras,
            today=today,
            blocklist=blocked,
            sparql_gold_count=counts.get(qid),
        )
        if reason or draft is None:
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": qid,
                    "name": _label(entity) or _enwiki_title(entity) or None,
                    "wikipedia_infobox_date": extra.get("wikipedia_infobox_date")
                    if extra
                    else (None if listed is None else listed.get("birth_date")),
                    "wikidata_birth_date": extra.get("wikidata_birth_date")
                    if extra
                    else None,
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
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
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
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
                "gold_count": draft["gold_count"],
                "sports": draft["sports"],
                "country": draft["country"],
                "medals": draft["medals"],
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = unique_slug(row["name"], used_slugs, qid=row["qid"])
        if slug in used_slugs:
            exclusions.append({"qid": row["qid"], "name": row["name"], "reason": "duplicate_slug"})
            continue
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[int, str, str]:
    return (-int(row.get("gold_count") or 0), row.get("name") or "", row.get("qid") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    qids, catalog_meta = catalog_qids(cache_dir=cache_dir)
    entities = fetch_entities(qids, cache_dir / "wikidata")
    sparql_counts = catalog_meta.get("gold_counts") if isinstance(catalog_meta.get("gold_counts"), dict) else {}

    extra_ids: list[str] = []
    seen_extra: set[str] = set()
    for entity in entities.values():
        event_qids = extract_gold_event_qids(entity)
        for qid in _needed_extra_ids(entity, event_qids):
            if qid not in seen_extra:
                seen_extra.add(qid)
                extra_ids.append(qid)
    extras = fetch_entities(extra_ids, cache_dir / "wikidata")
    events = extras

    infoboxes: dict[str, dict[str, Any]] = {}
    for qid, entity in entities.items():
        title = _enwiki_title(entity)
        if not title:
            continue
        safe = title.replace("/", "_").replace(" ", "_")
        birth, _wikitext = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "olympics_infobox" / f"{safe}.json",
        )
        infoboxes[qid] = birth

    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        entities,
        infoboxes,
        events,
        extras,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
        sparql_counts=sparql_counts,
    )
    validate_olympians(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_count": len(qids),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "catalog": {k: v for k, v in catalog_meta.items() if k != "gold_counts"},
        "sources": [
            "Wikidata P1344 event participation + P166 Olympic gold medal (CC0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
            *[
                f"Wikipedia {title}"
                for title in LIST_TITLES
            ],
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "scope": (
            "Summer Olympic gold medalists with at least two Summer Olympic gold medals "
            "on Wikidata, an English Wikipedia article, and a day-precision Wikipedia "
            "infobox date that matches Wikidata P569. Winter-only, Youth, year-only, "
            "conflicts, minors, and D3 keywords are dropped. Dates are never invented."
        ),
        "rules": {
            "keep": (
                ">=2 Summer Olympic gold medals (P1344/P166) AND Wikipedia infobox "
                "YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match"
            ),
            "drop": [
                "insufficient_summer_golds (< 2 Summer golds)",
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary or infobox",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "min_summer_golds": MIN_SUMMER_GOLDS,
        },
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
        "wikidata_item": WIKIDATA_ITEM,
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Summer Olympic multi-gold birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Summer Olympians to {args.out} "
        f"(catalog {prov['catalog_count']}; excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
