"""Assemble emmys/people.jsonl: Wikipedia list winners + infobox DOB + Wikidata P569."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.emmys.catalog import CATEGORIES, EMMYS_HOME
from pipeline.emmys.dates import fetch_article_wikitext, parse_wikipedia_birth
from pipeline.emmys.wiki_lists import clean_field, fetch_all_wins
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "emmy.schema.json"
DEFAULT_OUT = ROOT / "data" / "emmys" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "emmys" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_emmys(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("emmys people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def _norm_title(value: str) -> str:
    return " ".join(value.replace("_", " ").split()).casefold()


def index_entities_by_title(entities: dict[str, dict]) -> dict[str, dict]:
    by_title: dict[str, dict] = {}
    for entity in entities.values():
        if not entity or entity.get("missing") is not None:
            continue
        title = _enwiki_title(entity, "")
        if title:
            by_title[_norm_title(title)] = entity
            bare = _strip_disambiguation(title)
            if bare:
                by_title.setdefault(_norm_title(bare), entity)
        label = str(((entity.get("labels") or {}).get("en") or {}).get("value") or "").strip()
        if label:
            by_title.setdefault(_norm_title(label), entity)
    return by_title


def _strip_disambiguation(value: str) -> str:
    return re.sub(r"\s+\([^)]+\)$", "", value).strip()


def resolve_entity(person: dict[str, Any], entities_by_title: dict[str, dict]) -> dict | None:
    title = person.get("wikipedia_title") or ""
    name = person.get("name") or ""
    for key in (title, name, _strip_disambiguation(title), _strip_disambiguation(name)):
        if not key:
            continue
        entity = entities_by_title.get(_norm_title(key))
        if entity is not None:
            return entity
    return None


def unique_slug(name: str, used: set[str], *, qid: str) -> str:
    base = slugify(name) or f"emmy-{qid.lower()}"
    if base not in used:
        return base
    candidate = slugify(f"{name}-{qid}") or f"{base}-{qid.lower()}"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def group_wins(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for win in wins:
        key = _norm_title(win.get("wikipedia_title") or win["name"])
        if key not in grouped:
            grouped[key] = {
                "name": win["name"],
                "wikipedia_title": win.get("wikipedia_title") or win["name"],
                "wins": [],
            }
            order.append(key)
        grouped[key]["wins"].append(win)
        # Prefer a wikilinked title when a later row has one.
        if win.get("wikipedia_title") and "[[" not in win["wikipedia_title"]:
            grouped[key]["wikipedia_title"] = win["wikipedia_title"]
            if win["name"]:
                grouped[key]["name"] = win["name"]
    return [grouped[key] for key in order]


def merge_people_by_qid(
    people: list[dict[str, Any]],
    entities_by_title: dict[str, dict],
) -> list[dict[str, Any]]:
    """Collapse 'Robert Young' vs 'Robert Young (actor)' after sitelink resolve."""
    by_qid: dict[str, dict[str, Any]] = {}
    leftover: list[dict[str, Any]] = []
    for person in people:
        entity = resolve_entity(person, entities_by_title)
        qid = str((entity or {}).get("id") or "")
        if not qid:
            leftover.append(person)
            continue
        if qid not in by_qid:
            merged = dict(person)
            merged["wins"] = list(person["wins"])
            if entity:
                merged["wikipedia_title"] = _enwiki_title(entity, person["wikipedia_title"])
            by_qid[qid] = merged
            continue
        by_qid[qid]["wins"].extend(person["wins"])
    return list(by_qid.values()) + leftover


def classify_person(
    *,
    person: dict[str, Any],
    entity: dict | None,
    wiki_kind: str | None,
    wiki_iso: str | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = person["name"]
    title = person["wikipedia_title"]
    if name.lower() in blocklist or title.lower() in blocklist:
        return "blocklist", None
    if not person.get("wins"):
        return "missing_win", None

    if wiki_kind == "year_only":
        return "year_only", None
    if wiki_kind == "invalid":
        return "invalid_wikipedia_date", None
    if wiki_kind != "day" or not wiki_iso:
        return "missing_wikipedia_date", None

    birth = date.fromisoformat(wiki_iso)
    if birth > _minus_years(today, 18):
        return "minor", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    qid = str(entity.get("id") or "")
    if qid.lower() in blocklist:
        return "blocklist", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    if wikidata_iso != wiki_iso:
        return "dob_conflict", {
            "name": name,
            "wikipedia_title": title,
            "qid": qid,
            "wikipedia_birth_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
        }

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
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "wikipedia_birth_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
        "wins": person["wins"],
    }
    return None, draft


def _win_payload(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for win in wins:
        program = clean_field(win.get("program") or "") or None
        role = clean_field(win.get("role") or "") or None
        # Pre-1966 wins appear on both actor and actress lineage pages.
        category_id = win.get("category_id") or ""
        if str(category_id).endswith("pre_split"):
            key = (win["year"], "pre_split", program or "")
        else:
            key = (win["year"], category_id, program or "")
        if key in seen:
            continue
        seen.add(key)
        payload.append(
            {
                "year": win["year"],
                "category_id": win["category_id"],
                "label": win["label"],
                "category_full": win["category_full"],
                "genre": win.get("genre"),
                "acting": win.get("acting"),
                "program": program,
                "role": role,
                "list_url": win["list_url"],
                "performance_note": win.get("performance_note"),
            }
        )
    payload.sort(key=lambda item: (item["year"], item["category_id"]))
    return payload


def assemble_rows(
    people: list[dict[str, Any]],
    entities_by_title: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for person in people:
        title = person["wikipedia_title"]
        entity = resolve_entity(person, entities_by_title)
        if entity is not None:
            title = _enwiki_title(entity, title)
            person = {**person, "wikipedia_title": title}

        wiki_kind: str | None = None
        wiki_iso: str | None = None
        if title:
            safe = title.replace("/", "_").replace(" ", "_")
            article = fetch_article_wikitext(
                title,
                cache_path=cache_dir / "emmys" / "infobox" / f"{safe}.json",
            )
            wiki_kind, wiki_iso = parse_wikipedia_birth(article)

        reason, draft = classify_person(
            person=person,
            entity=entity,
            wiki_kind=wiki_kind,
            wiki_iso=wiki_iso,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None:
            extra = draft if isinstance(draft, dict) and reason == "dob_conflict" else {}
            exclusions.append(
                {
                    "name": person["name"],
                    "wikipedia_title": title,
                    "qid": (entity or {}).get("id") if entity else None,
                    "wikipedia_birth_date": wiki_iso,
                    "reason": reason or "unclassified",
                    **{key: value for key, value in extra.items() if key not in {"name", "wikipedia_title", "qid"}},
                }
            )
            continue

        resolved_title = draft["wikipedia_title"]
        summary = fetch_summary(resolved_title, cache_dir=cache_dir / "summaries")
        source_text = (summary.get("source_text") or "").strip()
        source_url = summary.get("source_url") or ""
        wiki_short = (summary.get("description") or "").strip()
        if description_blocked(wiki_short) or description_blocked(
            " ".join(part for part in (draft.get("wikidata_description"), wiki_short) if part)
        ):
            exclusions.append(
                {
                    "name": draft["name"],
                    "qid": draft["qid"],
                    "wikipedia_title": resolved_title,
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "name": draft["name"],
                    "qid": draft["qid"],
                    "wikipedia_title": resolved_title,
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
                "wikipedia_title": resolved_title,
                "emmys_url": EMMYS_HOME,
                "wins": _win_payload(draft["wins"]),
                "wikipedia_birth_date": draft["wikipedia_birth_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = unique_slug(row["name"], used_slugs, qid=row["qid"])
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
    wins = fetch_all_wins(cache_dir=cache_dir / "emmys" / "lists")
    people = group_wins(wins)
    titles: list[str] = []
    for person in people:
        for key in (
            person.get("wikipedia_title"),
            person.get("name"),
            _strip_disambiguation(person.get("wikipedia_title") or ""),
        ):
            if key and key not in titles:
                titles.append(key)
    entities = fetch_titles(titles, cache_dir / "wikidata")
    by_title = index_entities_by_title(entities)
    people = merge_people_by_qid(people, by_title)
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        people,
        by_title,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_emmys(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_wins": len(wins),
        "catalog_people": len(people),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "scope": {
            "include": [category["category_full"] for category in CATEGORIES],
            "exclude": [
                "Supporting Actor / Actress",
                "Limited or Anthology Series or Movie as its own category",
                "Guest Actor / Actress as its own category",
                "Daytime Emmys",
                "International Emmys",
                "News / Sports / Creative Arts",
            ],
            "notes": [
                "Pre-1966 Primetime acting categories were not genre-specific; those wins appear on both drama and comedy Wikipedia lineage pages and are kept once as pre_genre_split.",
                "Wikipedia marks some historical Lead-category wins as miniseries/TV film (#) or guest (§). Those wins are kept with a performance_note because they won Lead Actor/Actress that year.",
            ],
        },
        "sources": [
            "Academy of Television Arts & Sciences (https://www.emmys.com/)",
            "Wikipedia Primetime Emmy Lead Actor/Actress drama + comedy winner lists (CC BY-SA 4.0)",
            "Wikipedia person-article infobox / lead birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": "Wikipedia infobox/lead YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match",
            "drop": [
                "year_only (Wikipedia year-only template or missing day)",
                "dob_conflict (Wikipedia day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "missing_wikipedia_date",
                "missing_wikidata",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
        },
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Primetime Emmy Lead Actor/Actress birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Emmy winners to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
