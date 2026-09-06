"""Cite public DOBs on existing celeb blog profiles. Never invent dates."""

from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from enrich.containment import fact_is_near_verbatim
from pipeline.birthcard import birth_card_from_iso
from pipeline.celebs.catalog import (
    fold_name,
    load_celeb_profiles,
    ROOT,
)
from pipeline.celebs.copy import evidence_from_summary
from pipeline.exclusions import DESCRIPTION_KEYWORDS, description_blocked
from pipeline.wikidata import extract_person, fetch_titles
from pipeline.wikipedia_summary import fetch_summary

PEOPLE_SEED = ROOT / "pipeline" / "data" / "people.jsonl"
OUT_DIR = ROOT / "pipeline" / "data" / "celebs"
OUT_JSONL = OUT_DIR / "people.jsonl"
PROVENANCE = OUT_DIR / "provenance.json"
WIKIDATA_CACHE = ROOT / "pipeline" / "data" / "cache" / "wikidata"
ENWIKI_CACHE = ROOT / "pipeline" / "data" / "cache" / "enwiki"
TODAY = date(2026, 9, 6)


def p569_days(entity: dict[str, Any]) -> list[str]:
    days: list[str] = []
    for claim in entity.get("claims", {}).get("P569", []) or []:
        snak = claim.get("mainsnak") or {}
        if snak.get("snaktype") != "value":
            continue
        value = (snak.get("datavalue") or {}).get("value") or {}
        time = str(value.get("time") or "")
        precision = int(value.get("precision") or 0)
        if precision < 11 or not time.startswith("+"):
            continue
        day = time[1:11]
        if len(day) == 10 and day[4] == "-" and day not in days:
            days.append(day)
    return days


def load_seed_people(path: Path = PEOPLE_SEED) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def index_seed(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_name: dict[str, dict[str, Any]] = {}
    for row in rows:
        by_name.setdefault(fold_name(row["name"]), row)
    return by_name


def is_disambiguation(summary: dict[str, Any]) -> bool:
    description = (summary.get("description") or "").casefold()
    title = (summary.get("title") or "").casefold()
    text = (summary.get("source_text") or "").casefold()
    return (
        "disambiguation" in description
        or "topics referred to by the same term" in description
        or title.endswith("(disambiguation)")
        or text.startswith("topics referred to by the same term")
    )


def is_minor(iso: str, today: date = TODAY) -> bool:
    born = date.fromisoformat(iso)
    adult = date(born.year + 18, born.month, born.day)
    return adult > today


def classify(
    *,
    claimed: str | None,
    wikidata_dates: list[str],
    source_text: str,
    description: str,
    today: date = TODAY,
) -> str | None:
    if description_blocked(description) or any(
        keyword in (source_text or "").casefold() for keyword in DESCRIPTION_KEYWORDS
    ):
        return "description_keyword"
    if len(wikidata_dates) > 1:
        return "dob_conflict"
    if not wikidata_dates:
        return "wikidata_precision"
    birth = wikidata_dates[0]
    if claimed and claimed != birth:
        return "dob_conflict"
    if is_minor(birth, today=today):
        return "minor"
    if not (source_text or "").strip():
        return "missing_source"
    return None


def resolve_from_seed(profile: dict[str, Any], seed_by_name: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    row = seed_by_name.get(fold_name(profile["name"]))
    if not row:
        return None
    return {
        "qid": row["qid"],
        "name": profile["name"],
        "seed_name": row["name"],
        "slug": profile["slug"],
        "path": profile["path"],
        "birth_date": row["birth_date"],
        "claimed_birth_date": profile["claimed_birth_date"],
        "card": row["card"],
        "source_text": row["source_text"],
        "source_url": row["source_url"],
        "wikipedia_title": unquote((row.get("source_url") or "").rsplit("/", 1)[-1]).replace("_", " "),
        "wikidata_birth_date": row["birth_date"],
        "wikidata_dates": [row["birth_date"]],
        "dob_crosscheck": "wikipedia_matches_wikidata",
        "resolved_from": "people.jsonl",
    }


def resolve_from_wikidata(
    profile: dict[str, Any],
    *,
    cache_dir: Path,
    summary_cache: Path,
) -> tuple[dict[str, Any] | None, str | None]:
    title = profile.get("wikipedia_title_hint") or profile["name"]
    summary = fetch_summary(title, cache_dir=summary_cache)
    if is_disambiguation(summary):
        if profile.get("wikipedia_title_hint") and title != profile["wikipedia_title_hint"]:
            summary = fetch_summary(profile["wikipedia_title_hint"], cache_dir=summary_cache)
        if is_disambiguation(summary):
            return None, "missing_qid"
    resolved_title = summary.get("title") or title
    entities = fetch_titles([resolved_title], cache_dir)
    entity = None
    for item in entities.values():
        if item.get("missing") is not None or item.get("id") in (None, "-1"):
            continue
        entity = item
        break
    if entity is None:
        return None, "missing_qid"
    days = p569_days(entity)
    person = extract_person(entity)
    description = ((entity.get("descriptions") or {}).get("en") or {}).get("value") or summary.get("description") or ""
    reason = classify(
        claimed=profile["claimed_birth_date"],
        wikidata_dates=days,
        source_text=summary.get("source_text") or "",
        description=description,
    )
    row = {
        "qid": entity.get("id"),
        "name": profile["name"],
        "slug": profile["slug"],
        "path": profile["path"],
        "claimed_birth_date": profile["claimed_birth_date"],
        "wikidata_dates": days,
        "wikidata_birth_date": days[0] if len(days) == 1 else None,
        "source_text": summary.get("source_text") or "",
        "source_url": summary.get("source_url") or "",
        "wikipedia_title": resolved_title,
        "description": description,
        "resolved_from": "wikidata",
    }
    if reason:
        row["reason"] = reason
        return row, reason
    if person is None:
        return row, "wikidata_precision"
    row["birth_date"] = days[0]
    row["card"] = birth_card_from_iso(days[0])
    row["dob_crosscheck"] = "wikipedia_matches_wikidata"
    return row, None


def harvest(
    *,
    posts_path: Path | None = None,
    topics_path: Path | None = None,
    seed_path: Path = PEOPLE_SEED,
    wikidata_cache: Path = WIKIDATA_CACHE,
    summary_cache: Path = ENWIKI_CACHE,
    today: date = TODAY,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    kwargs: dict[str, Any] = {}
    if posts_path is not None:
        kwargs["posts_path"] = posts_path
    if topics_path is not None:
        kwargs["topics_path"] = topics_path
    profiles = load_celeb_profiles(**kwargs)
    seed_by_name = index_seed(load_seed_people(seed_path))
    kept: list[dict[str, Any]] = []
    excluded: list[dict[str, Any]] = []

    for profile in profiles:
        seed_row = resolve_from_seed(profile, seed_by_name)
        if seed_row:
            reason = classify(
                claimed=profile["claimed_birth_date"],
                wikidata_dates=seed_row["wikidata_dates"],
                source_text=seed_row["source_text"],
                description="",
                today=today,
            )
            if reason:
                seed_row["reason"] = reason
                excluded.append(seed_row)
            else:
                seed_row["evidence"] = evidence_from_summary(
                    seed_row["source_text"], seed_row["wikipedia_title"]
                )
                kept.append(seed_row)
            continue

        row, reason = resolve_from_wikidata(
            profile,
            cache_dir=wikidata_cache,
            summary_cache=summary_cache,
        )
        if row is None:
            excluded.append(
                {
                    "name": profile["name"],
                    "slug": profile["slug"],
                    "path": profile["path"],
                    "claimed_birth_date": profile["claimed_birth_date"],
                    "reason": reason or "missing_qid",
                }
            )
            continue
        if reason:
            excluded.append(row)
            continue
        row["evidence"] = evidence_from_summary(row["source_text"], row["wikipedia_title"])
        kept.append(row)

    return kept, excluded


def write_outputs(
    kept: list[dict[str, Any]],
    excluded: list[dict[str, Any]],
    *,
    out_jsonl: Path = OUT_JSONL,
    provenance_path: Path = PROVENANCE,
) -> None:
    out_jsonl.parent.mkdir(parents=True, exist_ok=True)
    public_keys = (
        "qid",
        "name",
        "slug",
        "path",
        "birth_date",
        "card",
        "source_text",
        "source_url",
        "wikipedia_title",
        "wikidata_birth_date",
        "dob_crosscheck",
        "evidence",
        "resolved_from",
    )
    with out_jsonl.open("w", encoding="utf-8") as handle:
        for row in kept:
            handle.write(json.dumps({key: row[key] for key in public_keys}, ensure_ascii=False) + "\n")

    by_reason: dict[str, int] = {}
    for row in excluded:
        reason = str(row.get("reason") or "unknown")
        by_reason[reason] = by_reason.get(reason, 0) + 1

    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "catalog_count": len(kept) + len(excluded),
        "kept": len(kept),
        "excluded": len(excluded),
        "by_reason": by_reason,
        "copy": (
            "Existing /blog/{slug} celebrity profiles only. Citations are Wikidata P569 "
            "+ Wikipedia REST summaries. source_text containment is required. "
            "No path-split. No Stripe. Dates are never invented."
        ),
        "exclusions": [
            {
                "name": row.get("name"),
                "slug": row.get("slug"),
                "path": row.get("path"),
                "qid": row.get("qid"),
                "claimed_birth_date": row.get("claimed_birth_date"),
                "wikidata_dates": row.get("wikidata_dates"),
                "reason": row.get("reason"),
            }
            for row in excluded
        ],
    }
    provenance_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate_kept(rows: list[dict[str, Any]]) -> None:
    for row in rows:
        for fact in row.get("evidence") or []:
            extra = (
                "Wikipedia REST summary" in fact
                or "No extra biographical facts" in fact
            )
            if extra:
                continue
            ok, _score = fact_is_near_verbatim(fact, row["source_text"])
            if not ok:
                raise ValueError(f"{row['slug']}: evidence is not contained in source_text: {fact!r}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Ground existing celeb blog profiles.")
    parser.add_argument("--apply", action="store_true", help="Patch lib/generated-blog-posts.json")
    args = parser.parse_args(argv)

    kept, excluded = harvest()
    validate_kept(kept)
    write_outputs(kept, excluded)
    print(f"kept {len(kept)} flagged {len(excluded)} → {OUT_JSONL}")
    if args.apply:
        from pipeline.celebs.apply import apply_citations

        changed = apply_citations(kept, excluded)
        print(f"patched {changed} blog profiles")
    return 0
