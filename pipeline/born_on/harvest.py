"""Assemble born-on day + notable people JSONL from the verified celebrity catalog.

This is an authority upgrade for live /born-on/{month-day} pages — not a new
niche and not a parallel /birthday path. Dates are never invented. People are
kept only when the celebrity pipeline already stored a day-precision public
DOB (Wikidata P569 precision 11). Year-only rows, conflicts, minors, and D3
description keywords stay dropped.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card, birth_card_from_iso
from pipeline.born_on.calendar import calendar_days, day_label, day_slug
from pipeline.exclusions import classify_person

ROOT = Path(__file__).resolve().parents[1]
PERSON_SCHEMA_PATH = ROOT / "schema" / "born_on_person.schema.json"
DAY_SCHEMA_PATH = ROOT / "schema" / "born_on_day.schema.json"
DEFAULT_SOURCE = ROOT / "data" / "people.jsonl"
DEFAULT_EXCLUSIONS = ROOT / "data" / "exclusions.json"
DEFAULT_PEOPLE_OUT = ROOT / "data" / "born-on" / "people.jsonl"
DEFAULT_DAYS_OUT = ROOT / "data" / "born-on" / "days.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "born-on" / "provenance.json"

TODAY = date(2026, 9, 6)


def load_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue
        rows.append(json.loads(trimmed))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )


def wikipedia_title_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.netloc not in {"en.wikipedia.org", "www.en.wikipedia.org"}:
        return None
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2 or parts[0] != "wiki":
        return None
    title = unquote(parts[1]).replace("_", " ").strip()
    return title or None


def load_schema(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_people(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema(PERSON_SCHEMA_PATH))
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"person {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("born-on people.jsonl failed schema validation:\n" + "\n".join(errors))


def validate_days(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema(DAY_SCHEMA_PATH))
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"day {index} ({row.get('slug')}): {error.message}")
    if errors:
        raise ValueError("born-on days.jsonl failed schema validation:\n" + "\n".join(errors))


def classify_source_row(row: dict, *, today: date) -> str | None:
    reason = classify_person(row, today=today)
    if reason is not None:
        return reason.value
    birth = str(row.get("birth_date") or "")
    if len(birth) != 10 or birth[4] != "-" or birth[7] != "-":
        return "missing_birth"
    try:
        parsed = date.fromisoformat(birth)
    except ValueError:
        return "missing_birth"
    if parsed.month == 0 or parsed.day == 0:
        return "year_only"
    if birth_card_from_iso(birth) != row.get("card"):
        return "card_mismatch"
    if not wikipedia_title_from_url(str(row.get("source_url") or "")):
        return "missing_source"
    return None


def assemble_person(row: dict) -> dict:
    birth = str(row["birth_date"])
    parsed = date.fromisoformat(birth)
    title = wikipedia_title_from_url(str(row["source_url"]))
    if not title:
        raise ValueError(f"missing Wikipedia title for {row.get('qid')}")
    return {
        "qid": str(row["qid"]),
        "name": str(row["name"]),
        "slug": str(row["slug"]),
        "birth_date": birth,
        "wikidata_birth_date": birth,
        "card": birth_card(parsed.month, parsed.day),
        "views": int(row.get("views") or 0),
        "source_text": str(row["source_text"]).strip(),
        "source_url": str(row["source_url"]),
        "wikipedia_title": title,
        "month": parsed.month,
        "day": parsed.day,
    }


def harvest(
    *,
    source_path: Path = DEFAULT_SOURCE,
    exclusions_path: Path = DEFAULT_EXCLUSIONS,
    today: date = TODAY,
) -> tuple[list[dict], list[dict], dict]:
    catalog = load_jsonl(source_path)
    catalog_exclusions = json.loads(exclusions_path.read_text(encoding="utf-8")) if exclusions_path.is_file() else {}

    kept: list[dict] = []
    harvest_exclusions: list[dict] = []
    seen_qids: set[str] = set()
    for raw in catalog:
        qid = str(raw.get("qid") or "")
        reason = classify_source_row(raw, today=today)
        if reason:
            harvest_exclusions.append(
                {
                    "qid": qid or None,
                    "name": raw.get("name"),
                    "reason": reason,
                    "birth_date": raw.get("birth_date"),
                }
            )
            continue
        person = assemble_person(raw)
        if person["qid"] in seen_qids:
            harvest_exclusions.append(
                {
                    "qid": person["qid"],
                    "name": person["name"],
                    "reason": "duplicate_qid",
                    "birth_date": person["birth_date"],
                }
            )
            continue
        if person["birth_date"] != person["wikidata_birth_date"]:
            harvest_exclusions.append(
                {
                    "qid": person["qid"],
                    "name": person["name"],
                    "reason": "dob_conflict",
                    "birth_date": person["birth_date"],
                }
            )
            continue
        seen_qids.add(person["qid"])
        kept.append(person)

    kept.sort(key=lambda row: (-int(row["views"]), row["name"].lower(), row["qid"]))

    by_day: dict[tuple[int, int], list[dict]] = {}
    for person in kept:
        by_day.setdefault((person["month"], person["day"]), []).append(person)

    days: list[dict] = []
    empty_slugs: list[str] = []
    for month, day in calendar_days():
        members = by_day.get((month, day), [])
        slug = day_slug(month, day)
        if not members:
            empty_slugs.append(slug)
        days.append(
            {
                "slug": slug,
                "month": month,
                "day": day,
                "label": day_label(month, day),
                "card": birth_card(month, day),
                "people_count": len(members),
                "qids": [person["qid"] for person in members],
            }
        )

    validate_people(kept)
    validate_days(days)
    if len(days) != 366:
        raise RuntimeError(f"expected 366 day rows, got {len(days)}")

    harvest_by_reason = Counter(item["reason"] for item in harvest_exclusions)
    provenance = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "path": "/born-on/{month}-{day}",
        "niche": "existing-born-on-grounding",
        "catalog_source": "pipeline/data/people.jsonl",
        "catalog_people": len(catalog),
        "kept": len(kept),
        "excluded": int(catalog_exclusions.get("excluded_count") or 0),
        "harvest_dropped": len(harvest_exclusions),
        "days": len(days),
        "days_with_people": sum(1 for row in days if row["people_count"] > 0),
        "days_empty": len(empty_slugs),
        "empty_slugs": empty_slugs,
        "catalog_by_reason": catalog_exclusions.get("by_reason") or {},
        "harvest_by_reason": dict(harvest_by_reason),
        "catalog_exclusions": catalog_exclusions.get("excluded") or [],
        "harvest_exclusions": harvest_exclusions,
        "keep": (
            "Celebrity people.jsonl row with YYYY-MM-DD public DOB AND Wikidata P569 "
            "day precision already applied upstream AND birthcard.py match AND "
            "not minor AND not D3 description_keyword AND not year_before_1900"
        ),
        "drop": [
            "year_only / missing_birth",
            "wikidata_precision (P569 missing or < 11)",
            "dob_conflict (catalog day ≠ Wikidata P569 day)",
            "minor",
            "description_keyword (D3)",
            "year_before_1900",
            "missing_qid / missing_source / card_mismatch / duplicate_qid",
        ],
        "sources": [
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred) via pipeline/data/people.jsonl",
            "Wikipedia REST summaries (CC BY-SA 4.0) as source_text only — never a date source",
            "pipeline.birthcard (December 31 = Joker; year unused)",
        ],
        "notes": [
            "Not a new niche. Pages stay on live /born-on/{month-day}.",
            "Empty days keep a page and do not invent notables.",
            "No person URLs. Notables are blocks on the existing day page.",
            "Path-split is not activated. Do not deploy this dist onto Pages.",
        ],
    }
    return kept, days, provenance


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Group verified notables onto /born-on day pages.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--exclusions", type=Path, default=DEFAULT_EXCLUSIONS)
    parser.add_argument("--people-out", type=Path, default=DEFAULT_PEOPLE_OUT)
    parser.add_argument("--days-out", type=Path, default=DEFAULT_DAYS_OUT)
    parser.add_argument("--provenance", type=Path, default=DEFAULT_PROVENANCE)
    args = parser.parse_args(argv)

    people, days, provenance = harvest(source_path=args.source, exclusions_path=args.exclusions)
    write_jsonl(args.people_out, people)
    write_jsonl(args.days_out, days)
    args.provenance.parent.mkdir(parents=True, exist_ok=True)
    args.provenance.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"kept {len(people)} notables across {provenance['days_with_people']}/366 days "
        f"({provenance['days_empty']} empty) → {args.days_out}"
    )
    return 0
