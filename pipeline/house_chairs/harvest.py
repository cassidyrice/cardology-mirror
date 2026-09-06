"""Assemble house_chairs/people.jsonl: house.gov + Bioguide + infobox + P569."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.wiki_infobox import fetch_infobox_birth
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.house_chairs.catalog import (
    CHAIR_ROWS,
    COMMITTEE_MEMBERSHIP_URL,
    HISTORY_HOUSE_BIOGUIDE_URL,
    HOUSE_CHAIRS,
    HOUSE_COMMITTEES_URL,
    HOUSE_LEADERSHIP_URL,
    LEADERSHIP_ROWS,
    LEGISLATORS_URL,
    OUT_OF_SCOPE_COMMITTEES,
    POSTAL_TO_STATE,
    SITTING_QIDS,
    STANDING_COMMITTEES,
)
from pipeline.house_chairs.legislators import (
    fetch_committee_membership,
    fetch_house_gov_html,
    fetch_house_legislators,
    history_house_url,
    house_gov_has_name,
    match_legislator_row,
    standing_chairs,
)
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "house_chair.schema.json"
DEFAULT_OUT = ROOT / "data" / "house_chairs" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "house_chairs" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_house_chairs(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("house_chairs people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def _state_name(postal: str) -> str:
    return POSTAL_TO_STATE.get(postal, postal)


def _state_slug(state: str) -> str:
    return re_slug(state)


def re_slug(value: str) -> str:
    out = []
    for char in value.casefold():
        if char.isalnum():
            out.append(char)
        elif out and out[-1] != "-":
            out.append("-")
    return "".join(out).strip("-")


def classify_row(
    *,
    catalog: dict[str, object],
    listed: dict[str, Any] | None,
    bioguide: dict[str, Any] | None,
    entity: dict | None,
    on_house_gov: bool,
    is_standing_chair: bool,
    today: date,
    blocklist: set[str],
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(catalog["name"])
    qid = str(catalog["qid"])
    slug = str(catalog["slug"])
    role_kind = str(catalog["role_kind"])
    if name.lower() in blocklist or qid.lower() in blocklist or slug.lower() in blocklist:
        return "blocklist", None
    if role_kind == "leadership" and not on_house_gov:
        return "missing_from_house_gov", None
    if role_kind == "chair" and not is_standing_chair:
        return "missing_standing_chair", None
    if listed is None:
        return "missing_wikipedia_infobox", None
    if bioguide is None:
        return "missing_bioguide", None

    wiki_kind = listed.get("kind")
    wiki_iso = listed.get("birth_date")
    if wiki_kind == "year_only":
        return "year_only", None
    if wiki_kind == "invalid":
        return "invalid_wikipedia_date", None
    if wiki_kind != "day" or not wiki_iso:
        return "missing_birth", None

    bio_kind = bioguide.get("birth_kind")
    bio_iso = bioguide.get("birth_date")
    if bio_kind == "year_only":
        return "year_only", None
    if bio_kind != "day" or not bio_iso:
        return "missing_bioguide_birth", None

    if wiki_iso != bio_iso:
        wikidata_preview = None
        if entity is not None and entity.get("missing") is None:
            parsed_preview = parse_day_precision_time(entity, "P569")
            if parsed_preview is not None:
                wikidata_preview = parsed_preview[0]
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "slug": slug,
            "office": catalog["office"],
            "wikipedia_infobox_date": wiki_iso,
            "bioguide_birth_date": bio_iso,
            "wikidata_birth_date": wikidata_preview,
        }

    birth = date.fromisoformat(str(wiki_iso))
    if birth > _minus_years(today, 18):
        return "minor", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None

    parsed_wd = parse_day_precision_time(entity, "P569")
    if parsed_wd is None:
        return "wikidata_precision", None
    wikidata_iso, _precision = parsed_wd
    if wikidata_iso != wiki_iso:
        return "dob_conflict", {
            "qid": qid,
            "name": name,
            "slug": slug,
            "office": catalog["office"],
            "wikipedia_infobox_date": wiki_iso,
            "bioguide_birth_date": bio_iso,
            "wikidata_birth_date": wikidata_iso,
        }

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    title = listed.get("wikipedia_title") or _enwiki_title(entity, str(catalog["enwiki_title"]))
    if not title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    postal = str(catalog["postal"])
    state = _state_name(postal)
    draft = {
        "qid": qid,
        "name": name,
        "slug": slug,
        "office": str(catalog["office"]),
        "office_id": str(catalog["office_id"]),
        "role_kind": role_kind,
        "sort_order": int(catalog["sort_order"]),
        "party": str(catalog["party"]),
        "state": state,
        "state_slug": _state_slug(state),
        "postal": postal,
        "district": int(catalog["district"]),
        "bioguide": str(catalog["bioguide"]),
        "committee_thomas_id": catalog.get("committee_thomas_id"),
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": title,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "bioguide_birth_date": bio_iso,
        "dob_crosscheck": "match",
        "bioguide_url": bioguide.get("bioguide_url"),
        "congress_url": bioguide.get("congress_url"),
        "history_house_url": history_house_url(str(catalog["bioguide"])),
        "house_gov_url": HOUSE_LEADERSHIP_URL if role_kind == "leadership" else HOUSE_COMMITTEES_URL,
        "wikidata_description": wiki_desc,
    }
    return None, draft


def assemble_rows(
    infoboxes: dict[str, dict[str, Any]],
    bio_rows: list[dict[str, Any]],
    entities: dict[str, dict],
    house_gov_html: str,
    chairs: dict[str, dict[str, Any]],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    catalog: tuple[dict[str, object], ...] = HOUSE_CHAIRS,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []

    for catalog_row in catalog:
        slug = str(catalog_row["slug"])
        listed = infoboxes.get(slug)
        bioguide = match_legislator_row(catalog_row, bio_rows)
        thomas_id = catalog_row.get("committee_thomas_id")
        chair_row = chairs.get(str(thomas_id)) if thomas_id else None
        is_standing_chair = bool(
            chair_row and chair_row.get("bioguide") == catalog_row.get("bioguide")
        )
        on_house_gov = house_gov_has_name(
            house_gov_html,
            str(catalog_row["name"]),
            str(catalog_row.get("house_gov_name") or ""),
        )
        reason, draft = classify_row(
            catalog=catalog_row,
            listed=listed,
            bioguide=bioguide,
            entity=entities.get(str(catalog_row["qid"])),
            on_house_gov=on_house_gov,
            is_standing_chair=is_standing_chair,
            today=today,
            blocklist=blocked,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason == "dob_conflict" and draft is not None else {}
            exclusions.append(
                {
                    "qid": str(catalog_row["qid"]),
                    "name": str(catalog_row["name"]),
                    "office": str(catalog_row["office"]),
                    "slug": slug,
                    "bioguide": str(catalog_row["bioguide"]),
                    "wikipedia_infobox_date": extra.get("wikipedia_infobox_date")
                    if extra
                    else (None if listed is None else listed.get("birth_date")),
                    "bioguide_birth_date": extra.get("bioguide_birth_date")
                    if extra
                    else (None if bioguide is None else bioguide.get("birth_date")),
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
                    "office": draft["office"],
                    "slug": draft["slug"],
                    "bioguide": draft["bioguide"],
                    "reason": "description_keyword",
                }
            )
            continue
        if not source_text or not source_url:
            exclusions.append(
                {
                    "qid": draft["qid"],
                    "name": draft["name"],
                    "office": draft["office"],
                    "slug": draft["slug"],
                    "bioguide": draft["bioguide"],
                    "reason": "missing_wikipedia_summary",
                }
            )
            continue

        drafted.append(
            {
                "qid": draft["qid"],
                "name": draft["name"],
                "slug": draft["slug"],
                "office": draft["office"],
                "office_id": draft["office_id"],
                "role_kind": draft["role_kind"],
                "sort_order": draft["sort_order"],
                "party": draft["party"],
                "state": draft["state"],
                "state_slug": draft["state_slug"],
                "postal": draft["postal"],
                "district": draft["district"],
                "bioguide": draft["bioguide"],
                "committee_thomas_id": draft["committee_thomas_id"],
                "birth_date": draft["birth_date"],
                "death_date": draft["death_date"],
                "card": birth_card_from_iso(draft["birth_date"]),
                "source_text": source_text,
                "source_url": source_url,
                "wikipedia_title": draft["wikipedia_title"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "bioguide_birth_date": draft["bioguide_birth_date"],
                "dob_crosscheck": "match",
                "bioguide_url": draft["bioguide_url"],
                "congress_url": draft["congress_url"],
                "history_house_url": draft["history_house_url"],
                "house_gov_url": draft["house_gov_url"],
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        if row["slug"] in used_slugs:
            exclusions.append(
                {
                    "qid": row["qid"],
                    "name": row["name"],
                    "office": row["office"],
                    "slug": row["slug"],
                    "bioguide": row["bioguide"],
                    "reason": "duplicate_slug",
                }
            )
            continue
        used_slugs.add(row["slug"])
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[int, str]:
    return (int(row.get("sort_order") or 99), row.get("name") or "")


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    house_gov_html = fetch_house_gov_html(
        cache_path=cache_dir / "house_gov" / "leadership.html"
    )
    membership = fetch_committee_membership(
        cache_path=cache_dir / "congress" / "committee-membership-current.json"
    )
    chairs = standing_chairs(membership)
    bio_rows = fetch_house_legislators(
        cache_path=cache_dir / "congress" / "legislators-current.json",
        as_of=today.isoformat(),
    )
    infoboxes: dict[str, dict[str, Any]] = {}
    for row in HOUSE_CHAIRS:
        slug = str(row["slug"])
        title = str(row["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        birth, _wikitext = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "house_chairs_infobox" / f"{safe}.json",
        )
        infoboxes[slug] = birth

    entities = fetch_entities(SITTING_QIDS, cache_dir / "wikidata")
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        infoboxes,
        bio_rows,
        entities,
        house_gov_html,
        chairs,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_house_chairs(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_sitting": len(HOUSE_CHAIRS),
        "catalog_leadership": len(LEADERSHIP_ROWS),
        "catalog_standing_chairs": len(CHAIR_ROWS),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "out_of_scope": {
            "select_committees": OUT_OF_SCOPE_COMMITTEES,
            "campaign_committees": [
                "National Republican Congressional Committee chair",
                "Democratic Congressional Campaign Committee chair",
            ],
            "not_on_house_gov_leadership": [
                "Republican Conference Vice Chair (not listed on house.gov/leadership)"
            ],
        },
        "sources": [
            f"U.S. House leadership roster ({HOUSE_LEADERSHIP_URL})",
            f"U.S. House committees index ({HOUSE_COMMITTEES_URL})",
            f"unitedstates/congress-legislators current members ({LEGISLATORS_URL})",
            f"unitedstates/congress-legislators committee membership ({COMMITTEE_MEMBERSHIP_URL})",
            f"House History Bioguide search ({HISTORY_HOUSE_BIOGUIDE_URL})",
            "Bioguide / congress.gov compiled birthdays (day-precision only)",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "house.gov/leadership (for leadership) OR standing-committee chair "
                "in congress-legislators AND Bioguide/congress-legislators YYYY-MM-DD "
                "AND Wikipedia infobox YYYY-MM-DD AND Wikidata P569 precision=11 "
                "AND all three dates match"
            ),
            "drop": [
                "year_only (Wikipedia infobox or Bioguide year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Bioguide day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
                "missing from house.gov/leadership (leadership rows)",
                "not the standing-committee chair in congress-legislators",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "select_committees": False,
            "campaign_committees": False,
        },
        "house_gov_url": HOUSE_LEADERSHIP_URL,
        "legislators_url": LEGISLATORS_URL,
        "committee_membership_url": COMMITTEE_MEMBERSHIP_URL,
        "standing_committees": STANDING_COMMITTEES,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest US House leadership + standing chairs birth-card JSONL."
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
        f"wrote {prov['kept']} House leadership/chairs to {args.out} "
        f"(excluded {prov['excluded']}: {prov['by_reason']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
