"""Assemble astronauts/people.jsonl: NASA bio day DOB + Wikidata P569 verify."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.astronauts.bios import (
    candidate_slugs,
    enrich_with_pdf,
    fetch_nasa_page,
    fetch_people_by_slug,
    match_people_row,
    search_people,
)
from pipeline.astronauts.catalog import (
    ASTRONAUTS_HOME,
    CANDIDATES_URL,
    FACT_BOOK_URL,
    fetch_catalog,
    last_name,
    name_tokens,
    preferred_slug,
)
from pipeline.astronauts.wiki import fetch_category_members, match_wiki_row, search_wikipedia
from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "astronaut.schema.json"
DEFAULT_OUT = ROOT / "data" / "astronauts" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "astronauts" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_astronauts(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("astronauts people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def unique_slug(name: str, used: set[str], *, qid: str) -> str:
    base = slugify(name) or f"astronaut-{qid.lower()}"
    if base not in used:
        return base
    candidate = slugify(f"{name}-{qid}") or f"{base}-{qid.lower()}"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def classify_row(
    *,
    catalog: dict[str, Any],
    nasa: dict[str, Any] | None,
    entity: dict | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(catalog.get("name") or "").strip()
    if not name:
        return "missing_name", None
    if name.lower() in blocklist:
        return "blocklist", None

    if nasa is None:
        return "missing_nasa_bio", None

    kind = nasa.get("nasa_birth_kind")
    nasa_iso = nasa.get("nasa_birth_date")
    if kind == "year_only":
        return "year_only", None
    if kind == "invalid":
        return "invalid_nasa_date", None
    if kind != "day" or not nasa_iso:
        return "missing_birth", None

    birth = date.fromisoformat(str(nasa_iso))
    if birth > _minus_years(today, 18):
        return "minor", None

    qid = str(catalog.get("qid") or "").strip()
    if qid and qid.lower() in blocklist:
        return "blocklist", None
    if not qid:
        return "missing_qid", None
    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    if wikidata_iso != nasa_iso:
        return "dob_conflict", None

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    title = _enwiki_title(entity, str(catalog.get("wikipedia_title") or ""))
    if not title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    nasa_url = str(nasa.get("nasa_url") or ASTRONAUTS_HOME)
    draft = {
        "qid": qid,
        "name": name,
        "preferred_slug": str(catalog.get("slug") or preferred_slug(name)),
        "status": str(catalog.get("status") or "Former"),
        "group": str(catalog.get("group") or ""),
        "flights": int(catalog.get("flights") or 0),
        "entry_year": str(catalog.get("entry_year") or ""),
        "birth_date": nasa_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": title,
        "nasa_url": nasa_url,
        "nasa_birth_date": nasa_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
    }
    return None, draft


def attach_wiki_ids(
    catalog: list[dict[str, Any]],
    category_rows: list[dict[str, str]],
    *,
    cache_dir: Path,
) -> list[dict[str, Any]]:
    attached: list[dict[str, Any]] = []
    used_qids: set[str] = set()
    total = len(catalog)
    for index, row in enumerate(catalog, 1):
        match = match_wiki_row(row, category_rows)
        searched = False
        if match is None or not match.get("qid") or match["qid"] in used_qids:
            extras = search_wikipedia(row["name"], cache_dir=cache_dir / "wiki-search")
            match = match_wiki_row(row, extras)
            searched = True
        updated = dict(row)
        if match and match.get("qid") and match["qid"] not in used_qids:
            updated["qid"] = match["qid"]
            updated["wikipedia_title"] = match.get("title") or ""
            used_qids.add(match["qid"])
        if searched or index == 1 or index == total or index % 50 == 0:
            print(
                f"wiki {index}/{total} {row['slug']} qid={updated.get('qid') or '-'}",
                flush=True,
            )
        attached.append(updated)
    return attached


def assemble_rows(
    catalog: list[dict[str, Any]],
    entities: dict[str, dict],
    nasa_by_slug: dict[str, dict[str, Any]],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for row in catalog:
        nasa = nasa_by_slug.get(row["slug"])
        if nasa is None:
            # Second-chance name match across fetched bios.
            for candidate in nasa_by_slug.values():
                if last_name(row["name"]) == last_name(str(candidate.get("name") or "")):
                    if len(name_tokens(row["name"]) & name_tokens(str(candidate.get("name") or ""))) >= 2:
                        nasa = candidate
                        break
        qid = str(row.get("qid") or "")
        reason, draft = classify_row(
            catalog=row,
            nasa=nasa,
            entity=entities.get(qid) if qid else None,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None:
            exclusions.append(
                {
                    "qid": qid or None,
                    "name": row.get("name"),
                    "slug": row.get("slug"),
                    "status": row.get("status"),
                    "group": row.get("group"),
                    "nasa_birth": (nasa or {}).get("nasa_birth_date") or (nasa or {}).get("nasa_birth_kind"),
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
                    "slug": draft["preferred_slug"],
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "slug": draft["preferred_slug"],
                    "reason": "missing_wikipedia_summary",
                }
            )
            continue

        drafted.append(
            {
                "qid": draft["qid"],
                "name": draft["name"],
                "slug": draft["preferred_slug"],
                "status": draft["status"],
                "group": draft["group"],
                "flights": draft["flights"],
                "entry_year": draft["entry_year"],
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "nasa_url": draft["nasa_url"],
                "nasa_birth_date": draft["nasa_birth_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = row["slug"] or unique_slug(row["name"], used_slugs, qid=row["qid"])
        if slug in used_slugs:
            exclusions.append({"qid": row["qid"], "name": row["name"], "reason": "duplicate_slug"})
            continue
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, str, str]:
    return (row.get("name") or "", row.get("group") or "", row.get("qid") or "")


def _stub_nasa(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": row["name"],
        "slug": row["slug"],
        "nasa_url": row.get("nasa_pdf_url") or ASTRONAUTS_HOME,
        "html": "",
        "nasa_birth_kind": "missing",
        "nasa_birth_date": None,
        "pdf_urls": [row["nasa_pdf_url"]] if row.get("nasa_pdf_url") else [],
    }


def _search_nasa_people(row: dict[str, Any], *, search_dir: Path) -> dict[str, Any] | None:
    hits = search_people(row["name"], cache_dir=search_dir)
    match = match_people_row(row, hits)
    if match is not None:
        return match
    for slug in candidate_slugs(row["name"], row["slug"]):
        slug_hits = fetch_people_by_slug(slug, cache_dir=search_dir)
        match = match_people_row(row, slug_hits)
        if match is not None:
            return match
    return None


def fetch_nasa_bios(
    catalog: list[dict[str, Any]],
    *,
    cache_dir: Path,
) -> dict[str, dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {}
    search_dir = cache_dir / "nasa-search"
    pdf_dir = cache_dir / "nasa-pdf"
    html_dir = cache_dir / "nasa-html"
    total = len(catalog)
    for index, row in enumerate(catalog, 1):
        match = _stub_nasa(row)
        if row.get("nasa_pdf_url"):
            match = enrich_with_pdf(match, cache_dir=pdf_dir)
        if match.get("nasa_birth_kind") != "day" and row.get("nasa_page_url"):
            page = fetch_nasa_page(
                row["nasa_page_url"],
                name=row["name"],
                slug=row["slug"],
                cache_dir=html_dir,
            )
            pdfs = list(dict.fromkeys([*(page.get("pdf_urls") or []), *(match.get("pdf_urls") or [])]))
            page["pdf_urls"] = pdfs
            if page.get("nasa_birth_kind") != "day":
                page = enrich_with_pdf(page, cache_dir=pdf_dir)
            match = page
        if match.get("nasa_birth_kind") != "day":
            people_match = _search_nasa_people(row, search_dir=search_dir)
            if people_match is not None:
                pdfs = list(people_match.get("pdf_urls") or [])
                for extra in match.get("pdf_urls") or []:
                    if extra not in pdfs:
                        pdfs.append(extra)
                people_match = dict(people_match)
                people_match["pdf_urls"] = pdfs
                match = enrich_with_pdf(people_match, cache_dir=pdf_dir)
        print(
            f"nasa {index}/{total} {row['slug']} {match.get('nasa_birth_kind')}",
            flush=True,
        )
        found[row["slug"]] = match
    return found


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    catalog = fetch_catalog(
        fact_book_cache=cache_dir / "astronauts" / "fact-book.html",
        candidates_cache=cache_dir / "astronauts" / "candidates.html",
    )
    print(f"catalog {len(catalog)} (Fact Book + Group 24 candidates)", flush=True)
    category_rows = fetch_category_members(cache_path=cache_dir / "astronauts" / "wiki-category.json")
    print(f"wikipedia category members {len(category_rows)}", flush=True)
    catalog = attach_wiki_ids(catalog, category_rows, cache_dir=cache_dir)
    with_qid = sum(1 for row in catalog if row.get("qid"))
    print(f"catalog with QID {with_qid}/{len(catalog)}", flush=True)
    nasa_by_slug = fetch_nasa_bios(catalog, cache_dir=cache_dir / "astronauts")
    qids = [str(row["qid"]) for row in catalog if row.get("qid")]
    print(f"wikidata entities {len(qids)}", flush=True)
    entities = fetch_entities(qids, cache_dir / "wikidata")
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        catalog,
        entities,
        nasa_by_slug,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_astronauts(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_count": len(catalog),
        "fact_book_url": FACT_BOOK_URL,
        "candidates_url": CANDIDATES_URL,
        "nasa_bios_matched": len(nasa_by_slug),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            f"NASA Astronaut Fact Book list of U.S. astronauts ({FACT_BOOK_URL})",
            f"NASA astronaut candidate class page ({CANDIDATES_URL})",
            f"NASA astronaut biography pages ({ASTRONAUTS_HOME})",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": "NASA bio YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match",
            "drop": [
                "year_only (NASA bio year without month/day)",
                "dob_conflict (NASA bio day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "missing_birth / missing_nasa_bio",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
                "missing QID / Wikidata entity",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
        },
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path, "catalog": catalog}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest NASA astronaut birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} NASA astronauts to {args.out} "
        f"(catalog {prov['catalog_count']}, excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
