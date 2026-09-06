"""Assemble tonys/people.jsonl: Wikipedia winner lists + Wikidata P569 verify."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.tonys.catalog import (
    CATEGORIES,
    CATEGORY_BY_KEY,
    SCOPE_NOTE,
    TONY_HOME_URL,
    TONY_WINNERS_URL,
    category_full,
)
from pipeline.tonys.dates import classify_wikipedia_birth, fetch_person_lead
from pipeline.tonys.wiki_list import fetch_all_winner_rows
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "tony.schema.json"
DEFAULT_OUT = ROOT / "data" / "tonys" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "tonys" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_tonys(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("tonys people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def _entity_by_title(entities: dict[str, dict], title: str) -> dict | None:
    wanted = title.replace("_", " ")
    for entity in entities.values():
        if entity.get("missing") is not None:
            continue
        sitelinks = entity.get("sitelinks") or {}
        enwiki = str((sitelinks.get("enwiki") or {}).get("title") or "").strip()
        if enwiki.replace("_", " ") == wanted:
            return entity
        label = str(((entity.get("labels") or {}).get("en") or {}).get("value") or "").strip()
        if label.replace("_", " ") == wanted:
            return entity
    return None


def unique_slug(name: str, used: set[str], *, qid: str) -> str:
    base = slugify(name) or f"tony-{qid.lower()}"
    if base not in used:
        return base
    candidate = slugify(f"{name}-{qid}") or f"{base}-{qid.lower()}"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _win_record(win: dict[str, Any]) -> dict[str, str]:
    return {
        "year": str(win["year"]),
        "category": win["category"],
        "category_label": CATEGORY_BY_KEY[win["category"]]["label"],
        "category_full": category_full(win["category"]),
        "production": str(win.get("production") or "").strip(),
        "role": str(win.get("role") or "").strip(),
        "wikipedia_list_url": str(win.get("wikipedia_list_url") or ""),
    }


def classify_person(
    *,
    wins: list[dict[str, Any]],
    entity: dict | None,
    wikipedia_kind: str,
    wikipedia_iso: str | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    if not wins:
        return "missing_win", None
    name = wins[0]["name"]
    title = wins[0]["enwiki_title"]
    if name.lower() in blocklist or title.lower() in blocklist:
        return "blocklist", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None
    qid = str(entity.get("id") or "")
    if not qid.startswith("Q"):
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None

    parsed = parse_day_precision_time(entity, "P569")
    if parsed is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed

    birth = date.fromisoformat(wikidata_iso)
    if birth > _minus_years(today, 18):
        return "minor", None

    if wikipedia_kind == "year_only":
        return "year_only", None
    if wikipedia_kind == "invalid":
        return "invalid_wikipedia_date", None
    if wikipedia_kind == "day":
        if not wikipedia_iso:
            return "invalid_wikipedia_date", None
        if wikipedia_iso != wikidata_iso:
            return "dob_conflict", {
                "qid": qid,
                "name": name,
                "wikipedia_birth_date": wikipedia_iso,
                "wikidata_birth_date": wikidata_iso,
            }
        crosscheck = "match"
        birth_iso = wikipedia_iso
    else:
        # Wikipedia person page had no day-precision template. Keep Wikidata
        # day only — do not invent a Wikipedia day.
        crosscheck = "wikidata_only"
        birth_iso = wikidata_iso
        wikipedia_iso = None

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    resolved_title = _enwiki_title(entity, title)
    if not resolved_title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": birth_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "wikipedia_birth_date": wikipedia_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": crosscheck,
        "wikidata_description": wiki_desc,
        "wins": [_win_record(win) for win in sorted(wins, key=lambda item: (item["year"], item["category"]))],
    }
    return None, draft


def assemble_rows(
    winner_rows: list[dict[str, Any]],
    entities: dict[str, dict],
    leads: dict[str, str],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for win in winner_rows:
        grouped[win["enwiki_title"]].append(win)

    for title, wins in grouped.items():
        entity = _entity_by_title(entities, title)
        kind, wiki_iso = classify_wikipedia_birth(leads.get(title))
        reason, draft = classify_person(
            wins=wins,
            entity=entity,
            wikipedia_kind=kind,
            wikipedia_iso=wiki_iso,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None or draft.get("dob_crosscheck") not in {"match", "wikidata_only"}:
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": extra.get("qid") or (entity or {}).get("id"),
                    "name": wins[0]["name"],
                    "enwiki_title": title,
                    "wins": [f"{win['year']} {win['category']}" for win in wins],
                    "wikipedia_birth_date": extra.get("wikipedia_birth_date") or wiki_iso,
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
                    "enwiki_title": title,
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "enwiki_title": title,
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
                "tony_url": TONY_HOME_URL,
                "wins": draft["wins"],
                "wikipedia_birth_date": draft["wikipedia_birth_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": draft["dob_crosscheck"],
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


def _sort_key(row: dict) -> tuple[str, str, str]:
    years = [win.get("year") or "9999" for win in row.get("wins") or []]
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
    winner_rows = fetch_all_winner_rows(cache_dir=cache_dir / "wikipedia" / "tonys")
    titles = sorted({row["enwiki_title"] for row in winner_rows})
    entities = fetch_titles(titles, cache_dir / "wikidata")
    leads: dict[str, str] = {}
    lead_dir = cache_dir / "wikipedia" / "tonys-leads"
    for title in titles:
        leads[title] = fetch_person_lead(title, cache_dir=lead_dir)
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        winner_rows,
        entities,
        leads,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_tonys(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_wins": len(winner_rows),
        "catalog_people": len({row["enwiki_title"] for row in winner_rows}),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "scope": {
            "categories": [row["official"] for row in CATEGORIES],
            "note": SCOPE_NOTE,
            "through": max((row["year"] for row in winner_rows), default=""),
            "not_awarded": [
                "1985 Best Actor in a Musical",
                "1985 Best Actress in a Musical",
            ],
            "omit": [
                "Featured Actor in a Play",
                "Featured Actress in a Play",
                "Featured Actor in a Musical",
                "Featured Actress in a Musical",
                "direction, design, and special Tony Awards",
            ],
        },
        "sources": [
            f"Tony Awards official site ({TONY_HOME_URL}, winners index {TONY_WINNERS_URL})",
            "Wikipedia Tony Award leading-acting category lists (winners highlighted #B0C4DE)",
            "Wikipedia person-page infobox birth-date templates when present",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikipedia leading-acting winner AND Wikidata P569 precision=11 "
                "AND (no Wikipedia person-page day OR that day matches Wikidata)"
            ),
            "drop": [
                "year_only (Wikipedia person-page year without month/day)",
                "dob_conflict (Wikipedia person-page day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary or Wikidata entity",
                "featured acting and non-leading Tony categories",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
        },
        "tony_home_url": TONY_HOME_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Tony leading-acting birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Tony leading winners to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
