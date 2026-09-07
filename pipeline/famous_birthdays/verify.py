"""Verify editorial Famous people rows against Wikidata P569.

Keep only people whose listed YYYY-MM-DD matches a day-precision Wikidata
P569 claim (Gregorian preferred). Drop year-only dates, conflicts, minors,
and D3 description keywords. Dates are never invented. Birth cards come
from the listed card key and must match pipeline.birthcard (D1).
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from pipeline.birthcard import birth_card_from_iso
from pipeline.exclusions import description_blocked
from pipeline.http import fetch_json
from pipeline.wikidata_dates import parse_day_precision_time
from pipeline.wikidata import _titles_url, _write_entity_cache, batch_ids

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TABLE = ROOT / "lib" / "famous-birthdays.json"
DEFAULT_PROVENANCE = ROOT / "pipeline" / "data" / "famous-birthdays" / "provenance.json"
DEFAULT_CACHE = ROOT / "pipeline" / "data" / "cache" / "wikidata"

DAY_ISO = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
QID_RE = re.compile(r"^Q\d+$")


def wikipedia_title(url: str) -> str:
    path = urlparse(url).path
    if "/wiki/" not in path:
        return ""
    title = path.split("/wiki/", 1)[1]
    return unquote(title).replace("_", " ").strip()


def listed_day(iso: str) -> str | None:
    match = DAY_ISO.fullmatch(iso or "")
    if not match:
        return None
    _year, month, day = match.groups()
    if month == "00" or day == "00":
        return None
    try:
        date.fromisoformat(iso)
    except ValueError:
        return None
    return iso


def _minus_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def fetch_entities_for_titles(
    titles: list[str],
    cache_dir: Path,
) -> dict[str, dict[str, Any]]:
    """Map a requested enwiki title to its entity, following redirects."""
    by_title: dict[str, dict[str, Any]] = {}
    for batch in batch_ids(titles):
        payload = fetch_json(_titles_url(batch))
        entities = payload.get("entities") or {}
        _write_entity_cache(cache_dir, entities)

        sitelink_to_entity: dict[str, dict[str, Any]] = {}
        for entity in entities.values():
            if not entity or entity.get("missing") is not None:
                continue
            sitelink = ((entity.get("sitelinks") or {}).get("enwiki") or {}).get("title")
            if sitelink:
                sitelink_to_entity[sitelink] = entity
                sitelink_to_entity[sitelink.replace("_", " ")] = entity

        aliases: dict[str, str] = {}
        for item in payload.get("normalized") or []:
            aliases[str(item["from"]).replace("_", " ")] = str(item["to"]).replace("_", " ")
        for item in payload.get("redirects") or []:
            aliases[str(item["from"]).replace("_", " ")] = str(item["to"]).replace("_", " ")

        def resolve(title: str) -> str:
            seen: set[str] = set()
            current = title.replace("_", " ")
            while current in aliases and current not in seen:
                seen.add(current)
                current = aliases[current]
            return current

        for requested in batch:
            resolved = resolve(requested)
            entity = sitelink_to_entity.get(resolved) or sitelink_to_entity.get(requested)
            if entity:
                by_title[requested.replace("_", " ")] = entity
                by_title[resolved] = entity
    return by_title


def classify_row(
    row: dict[str, Any],
    card: str,
    entity: dict[str, Any] | None,
    *,
    today: date | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Return (kept_row, exclusion) — one of the two is always None."""
    today = today or date.today()
    name = str(row.get("name") or "").strip()
    wikipedia = str(row.get("wikipedia") or "").strip()
    known_for = str(row.get("known_for") or "").strip()
    listed = listed_day(str(row.get("born") or ""))

    if listed is None:
        return None, {
            "name": name,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": row.get("born"),
            "reason": "year_only",
        }

    if entity is None or entity.get("missing") is not None:
        return None, {
            "name": name,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "reason": "missing_qid",
        }

    qid = str(entity.get("id") or "")
    if not QID_RE.fullmatch(qid):
        return None, {
            "name": name,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "reason": "missing_qid",
        }

    parsed = parse_day_precision_time(entity, "P569")
    if parsed is None:
        return None, {
            "name": name,
            "qid": qid,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "reason": "wikidata_precision",
        }

    wikidata_birth, _precision = parsed
    if wikidata_birth != listed:
        return None, {
            "name": name,
            "qid": qid,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "wikidata_birth_date": wikidata_birth,
            "reason": "dob_conflict",
        }

    try:
        computed = birth_card_from_iso(wikidata_birth)
    except ValueError:
        computed = None
    if computed != card:
        return None, {
            "name": name,
            "qid": qid,
            "card": card,
            "computed_card": computed,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "wikidata_birth_date": wikidata_birth,
            "reason": "card_mismatch",
        }

    born = date.fromisoformat(wikidata_birth)
    if born > _minus_years(today, 18):
        return None, {
            "name": name,
            "qid": qid,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "wikidata_birth_date": wikidata_birth,
            "reason": "minor",
        }

    descriptions = entity.get("descriptions") or {}
    description = ((descriptions.get("en") or {}).get("value")) or ""
    blob = " ".join(part for part in (description, known_for) if part)
    if description_blocked(blob):
        return None, {
            "name": name,
            "qid": qid,
            "card": card,
            "wikipedia": wikipedia,
            "listed_born": listed,
            "reason": "description_keyword",
        }

    sitelinks = entity.get("sitelinks") or {}
    enwiki = (sitelinks.get("enwiki") or {}).get("title") or wikipedia_title(wikipedia)
    wiki_url = (
        wikipedia
        if wikipedia.startswith("https://en.wikipedia.org/wiki/")
        else f"https://en.wikipedia.org/wiki/{str(enwiki).replace(' ', '_')}"
    )

    kept = {
        "name": name,
        "qid": qid,
        "born": wikidata_birth,
        "known_for": known_for,
        "wikipedia": wiki_url,
    }
    return kept, None


def verify_table(
    table: dict[str, list[dict[str, Any]]],
    entities_by_title: dict[str, dict[str, Any]],
    *,
    today: date | None = None,
) -> tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
    kept: dict[str, list[dict[str, Any]]] = {}
    exclusions: list[dict[str, Any]] = []
    for card, rows in table.items():
        card_kept: list[dict[str, Any]] = []
        for row in rows:
            title = wikipedia_title(str(row.get("wikipedia") or ""))
            entity = entities_by_title.get(title)
            person, exclusion = classify_row(row, card, entity, today=today)
            if person is None:
                if exclusion:
                    exclusions.append(exclusion)
                continue
            card_kept.append(person)
        card_kept.sort(key=lambda item: (item["born"], item["name"]))
        kept[card] = card_kept
    return kept, exclusions


def load_table(path: Path) -> dict[str, list[dict[str, Any]]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"{path} must be a card-keyed object")
    return raw


def write_table(path: Path, table: dict[str, list[dict[str, Any]]]) -> None:
    path.write_text(
        json.dumps(table, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )


def write_provenance(
    path: Path,
    *,
    catalog: int,
    table: dict[str, list[dict[str, Any]]],
    exclusions: list[dict[str, Any]],
) -> None:
    by_reason: dict[str, int] = {}
    for row in exclusions:
        reason = str(row.get("reason") or "unknown")
        by_reason[reason] = by_reason.get(reason, 0) + 1
    kept = sum(len(rows) for rows in table.values())
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "catalog": catalog,
        "kept": kept,
        "excluded": len(exclusions),
        "cards": len(table),
        "cards_with_people": sum(1 for rows in table.values() if rows),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "sources": [
            "Editorial Famous people list on /birth-card/{rank}-of-{suit} (lib/famous-birthdays.json)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "English Wikipedia sitelink (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused. Card is the page path.",
        "rules": {
            "keep": (
                "Listed YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match "
                "AND date maps to the page card"
            ),
            "drop": [
                "year_only (listed born missing month/day)",
                "dob_conflict (listed day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "missing_qid (Wikipedia title did not resolve)",
                "card_mismatch (verified day maps to a different card)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_cut": False,
        },
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verify Famous people blocks against Wikidata P569 (day-precision only)."
    )
    parser.add_argument("--table", type=Path, default=DEFAULT_TABLE)
    parser.add_argument("--provenance", type=Path, default=DEFAULT_PROVENANCE)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--today", default=None, help="ISO date for the minor cutoff (tests).")
    args = parser.parse_args(argv)

    table = load_table(args.table)
    titles: list[str] = []
    seen: set[str] = set()
    catalog = 0
    for rows in table.values():
        for row in rows:
            catalog += 1
            title = wikipedia_title(str(row.get("wikipedia") or ""))
            if title and title not in seen:
                seen.add(title)
                titles.append(title)

    entities_by_title = fetch_entities_for_titles(titles, args.cache)
    today = date.fromisoformat(args.today) if args.today else date.today()
    kept, exclusions = verify_table(table, entities_by_title, today=today)
    write_table(args.table, kept)
    write_provenance(args.provenance, catalog=catalog, table=kept, exclusions=exclusions)
    print(
        f"kept {sum(len(rows) for rows in kept.values())}/{catalog} "
        f"people across {sum(1 for rows in kept.values() if rows)}/{len(kept)} cards; "
        f"dropped {len(exclusions)} → {args.table}"
    )
    return 0
