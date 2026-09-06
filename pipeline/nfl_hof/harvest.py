"""Assemble nfl_hof/people.jsonl: Wikidata P6930 + P569, HOF/Wikipedia verify."""

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
from pipeline.emmys.dates import fetch_article_wikitext, parse_wikipedia_birth
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.nfl_hof.catalog import (
    HOF_HOME,
    WIKIPEDIA_LIST_URL,
    extract_hof_id,
    fetch_catalog,
    hof_url,
)
from pipeline.nfl_hof.hof import fetch_hof_bio
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "nfl_hof.schema.json"
DEFAULT_OUT = ROOT / "data" / "nfl_hof" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "nfl_hof" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"
HOF_AWARD = "Q724080"
MIN_SOURCE_WORDS = 20


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_nfl_hof(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("nfl_hof people.jsonl failed schema validation:\n" + "\n".join(errors))


def _minus_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def _wikidata_description(entity: dict) -> str:
    descriptions = entity.get("descriptions") or {}
    return str((descriptions.get("en") or {}).get("value") or "").strip()


def _enwiki_title(entity: dict, fallback: str = "") -> str:
    sitelinks = entity.get("sitelinks") or {}
    enwiki = sitelinks.get("enwiki") or {}
    title = str(enwiki.get("title") or "").strip()
    return title or fallback


def _en_label(entity: dict, fallback: str = "") -> str:
    labels = entity.get("labels") or {}
    label = str((labels.get("en") or {}).get("value") or "").strip()
    return label or fallback


def unique_slug(name: str, used: set[str], *, qid: str, hof_id: str) -> str:
    base = slugify(name) or slugify(hof_id) or f"hof-{qid.lower()}"
    if base not in used:
        return base
    candidate = slugify(hof_id) or slugify(f"{name}-{qid}") or f"{base}-{qid.lower()}"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _claim_year(claim: dict) -> str | None:
    for snak in (claim.get("qualifiers") or {}).get("P585", []) or []:
        if snak.get("snaktype") != "value":
            continue
        raw = (snak.get("datavalue") or {}).get("value")
        if not isinstance(raw, dict):
            continue
        time = str(raw.get("time") or "")
        match = re.match(r"^[+-]?(\d{4})-", time)
        if match:
            return match.group(1)
    return None


def induction_year(entity: dict) -> str | None:
    years: list[str] = []
    for claim in (entity.get("claims") or {}).get("P166", []) or []:
        if claim.get("rank") == "deprecated":
            continue
        snak = claim.get("mainsnak") or {}
        raw = (snak.get("datavalue") or {}).get("value")
        qid = raw.get("id") if isinstance(raw, dict) else None
        if qid != HOF_AWARD:
            continue
        year = _claim_year(claim)
        if year:
            years.append(year)
    if not years:
        return None
    return min(years)


def _p569_days(entity: dict) -> set[str]:
    days: set[str] = set()
    for claim in (entity.get("claims") or {}).get("P569", []) or []:
        if claim.get("rank") == "deprecated":
            continue
        parsed = parse_day_precision_time({"claims": {"P569": [claim]}}, "P569")
        if parsed is not None:
            days.add(parsed[0])
    return days


def classify_row(
    *,
    catalog: dict[str, Any],
    entity: dict | None,
    wiki_kind: str | None,
    wiki_iso: str | None,
    hof: dict[str, Any] | None,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(catalog.get("name") or "").strip()
    hof_id = str(catalog.get("hof_id") or "").strip()
    if not name:
        return "missing_name", None
    if name.lower() in blocklist or hof_id.lower() in blocklist:
        return "blocklist", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    qid = str(entity.get("id") or catalog.get("qid") or "")
    if not qid.startswith("Q"):
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None

    resolved_hof = extract_hof_id(entity) or hof_id
    if not resolved_hof:
        return "missing_hof_id", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        times = (entity.get("claims") or {}).get("P569") or []
        if times:
            return "year_only", None
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    days = _p569_days(entity)
    if len(days) > 1:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "wikidata_birth_date": wikidata_iso,
            "wikidata_birth_dates": sorted(days),
        }

    birth = date.fromisoformat(wikidata_iso)
    if birth > _minus_years(today, 18):
        return "minor", None

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    title = _enwiki_title(entity, str(catalog.get("wikipedia_title") or name))
    if not title:
        return "missing_enwiki_title", None

    if wiki_kind == "day" and wiki_iso and wiki_iso != wikidata_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "wikipedia_title": title,
            "wikipedia_birth_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    hof_kind = (hof or {}).get("hof_birth_kind")
    hof_iso = (hof or {}).get("hof_birth_date")
    if hof_kind == "day" and hof_iso and hof_iso != wikidata_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "hof_birth_date": hof_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    death = parse_day_precision_time(entity, "P570")
    draft = {
        "qid": qid,
        "name": _en_label(entity, name) or name,
        "hof_id": resolved_hof,
        "hof_url": str((hof or {}).get("hof_url") or hof_url(resolved_hof)),
        "induction_year": induction_year(entity),
        "birth_date": wikidata_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": title,
        "wikipedia_birth_date": wiki_iso if wiki_kind == "day" else None,
        "hof_birth_date": hof_iso if hof_kind == "day" else None,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "wikidata_description": wiki_desc,
    }
    return None, draft


def assemble_rows(
    catalog: list[dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    fetch_verify: bool = True,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []
    total = len(catalog)

    for index, row in enumerate(catalog, 1):
        qid = str(row.get("qid") or "")
        entity = entities.get(qid)
        title = _enwiki_title(entity or {}, str(row.get("wikipedia_title") or row.get("name") or ""))
        wiki_kind: str | None = None
        wiki_iso: str | None = None
        if fetch_verify and title:
            safe = title.replace("/", "_").replace(" ", "_")
            try:
                article = fetch_article_wikitext(
                    title,
                    cache_path=cache_dir / "nfl_hof" / "infobox" / f"{safe}.json",
                )
                wiki_kind, wiki_iso = parse_wikipedia_birth(article)
            except Exception:  # noqa: BLE001 — missing wiki page is not a date
                wiki_kind, wiki_iso = None, None

        hof = None
        hof_id = str(row.get("hof_id") or "")
        if fetch_verify and hof_id:
            hof = fetch_hof_bio(
                hof_id,
                cache_dir=cache_dir / "nfl_hof" / "hof",
                name=str(row.get("name") or ""),
            )
        if fetch_verify and (index == 1 or index == total or index % 25 == 0):
            print(
                f"verify {index}/{total} {qid} wiki={wiki_kind or '-'} hof={(hof or {}).get('hof_birth_kind') or '-'}",
                flush=True,
            )

        reason, draft = classify_row(
            catalog=row,
            entity=entity,
            wiki_kind=wiki_kind,
            wiki_iso=wiki_iso,
            hof=hof,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None:
            extra = draft if isinstance(draft, dict) and reason == "dob_conflict" else {}
            exclusions.append(
                {
                    "qid": qid or None,
                    "name": row.get("name"),
                    "hof_id": hof_id or None,
                    "wikipedia_title": title or None,
                    "wikipedia_birth_date": wiki_iso,
                    "hof_birth_date": (hof or {}).get("hof_birth_date"),
                    "wikidata_birth_date": extra.get("wikidata_birth_date"),
                    "reason": reason or "unclassified",
                }
            )
            continue

        try:
            summary = fetch_summary(draft["wikipedia_title"], cache_dir=cache_dir / "summaries")
        except Exception:  # noqa: BLE001 — drop rather than invent a bio
            summary = {}
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
                    "hof_id": draft["hof_id"],
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
                    "hof_id": draft["hof_id"],
                    "wikipedia_title": draft["wikipedia_title"],
                    "reason": "missing_wikipedia_summary",
                }
            )
            continue
        words = [part for part in re.split(r"[^A-Za-z0-9]+", source_text) if part]
        if len(words) < MIN_SOURCE_WORDS:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "hof_id": draft["hof_id"],
                    "wikipedia_title": draft["wikipedia_title"],
                    "reason": "thin_source",
                }
            )
            continue

        drafted.append(
            {
                "qid": draft["qid"],
                "name": draft["name"],
                "slug": "",
                "hof_id": draft["hof_id"],
                "hof_url": draft["hof_url"],
                "induction_year": draft["induction_year"],
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "wikipedia_birth_date": draft["wikipedia_birth_date"],
                "hof_birth_date": draft["hof_birth_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = unique_slug(row["name"], used_slugs, qid=row["qid"], hof_id=row["hof_id"])
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows, dupe_exclusions = drop_source_ngram_dupes(rows)
    exclusions.extend(dupe_exclusions)
    rows.sort(key=_sort_key)
    return rows, exclusions


def _word_tokens(text: str) -> list[str]:
    return [part.lower() for part in re.split(r"[^A-Za-z0-9]+", text) if part]


def _shingles(words: list[str], size: int = 5) -> set[str]:
    return {" ".join(words[index : index + size]) for index in range(max(0, len(words) - size + 1))}


def _jaccard(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 0.0
    union = left | right
    return len(left & right) / len(union) if union else 0.0


def drop_source_ngram_dupes(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """Keep the longer Wikipedia extract when 5-gram overlap is 30% or more."""
    scored = sorted(rows, key=lambda row: (-len(row.get("source_text") or ""), row.get("name") or ""))
    kept: list[dict] = []
    grams: list[set[str]] = []
    exclusions: list[dict] = []
    for row in scored:
        current = _shingles(_word_tokens(row.get("source_text") or ""))
        overlap = any(_jaccard(current, previous) >= 0.3 for previous in grams)
        if overlap:
            exclusions.append(
                {
                    "qid": row.get("qid"),
                    "name": row.get("name"),
                    "hof_id": row.get("hof_id"),
                    "wikipedia_title": row.get("wikipedia_title"),
                    "reason": "source_dupe",
                }
            )
            continue
        kept.append(row)
        grams.append(current)
    return kept, exclusions


def _sort_key(row: dict) -> tuple[str, str, str]:
    return (row.get("name") or "", row.get("induction_year") or "9999", row.get("qid") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    catalog, catalog_meta, entities = fetch_catalog(
        cache_dir=cache_dir / "nfl_hof" / "catalog",
        wikidata_cache=cache_dir / "wikidata",
    )
    print(f"catalog {len(catalog)} with P6930", flush=True)
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        catalog,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_nfl_hof(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_count": len(catalog),
        "catalog": catalog_meta,
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            f"Wikidata P6930 Pro Football Hall of Fame ID ({HOF_HOME})",
            "Wikidata P569 day-precision dates (CC0, Gregorian preferred)",
            f"Pro Football Hall of Fame bios ({HOF_HOME}) — verify where a day is published",
            f"Wikipedia list of inductees ({WIKIPEDIA_LIST_URL}) — fallback catalog only",
            "Wikipedia article infobox / lead birth-date templates (CC BY-SA 4.0)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikidata P6930 AND Wikidata P569 precision=11 AND no Wikipedia/HOF day conflict"
            ),
            "drop": [
                "year_only (Wikidata or Wikipedia year without month/day)",
                "dob_conflict (Wikipedia or HOF.com day ≠ Wikidata P569 day, or multiple P569 days)",
                "wikidata_precision (P569 missing or < 11)",
                "missing_hof_id / missing_wikidata / missing_enwiki_title",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
                "thin_source (Wikipedia extract too short to support a unique page)",
                "source_dupe (Wikipedia extract 5-gram overlap ≥ 30% with a longer kept extract)",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "hof_verify": "optional when HOF.com publishes a day; conflicts drop the row",
        },
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path, "catalog": catalog}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest NFL Hall of Fame inductee birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} NFL HOF inductees to {args.out} "
        f"(catalog {prov['catalog_count']}, excluded {prov['excluded']}: {prov['by_reason']})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
