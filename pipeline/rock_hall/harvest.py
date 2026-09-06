"""Assemble rock_hall/people.jsonl: Wikipedia infobox DOB + Wikidata P569 verify."""

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
from pipeline.rock_hall.wiki_list import (
    CATEGORY,
    LIST_URL,
    ROCKHALL_HOME,
    ROCKHALL_INDUCTION,
    fetch_inductee_people,
)
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "rock_hall.schema.json"
DEFAULT_OUT = ROOT / "data" / "rock_hall" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "rock_hall" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"

HUMAN_QID = "Q5"


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_rock_hall(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("rock_hall people.jsonl failed schema validation:\n" + "\n".join(errors))


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
        raw = ((snak.get("datavalue") or {}).get("value") or {})
        qid = str(raw.get("id") or "")
        if qid.startswith("Q"):
            ids.add(qid)
    return ids


def unique_slug(name: str, used: set[str], *, title: str) -> str:
    base = slugify(name) or slugify(title) or "rock-hall-inductee"
    if base not in used:
        return base
    extra = slugify(title) or "inductee"
    candidate = extra if extra not in used else f"{base}-rock-hall"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _normalize_inductions(inductions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for item in inductions:
        year = str(item.get("year") or "").strip()
        act = str(item.get("act") or "").strip()
        act_title = str(item.get("act_wikipedia_title") or "").strip()
        role = str(item.get("role") or "").strip()
        rockhall_url = str(item.get("rockhall_url") or ROCKHALL_HOME).strip()
        if not year or not act or not act_title or role not in {"solo", "member"}:
            continue
        key = (year, act_title, role)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(
            {
                "year": year,
                "act": act,
                "act_wikipedia_title": act_title,
                "category": CATEGORY,
                "category_id": "performers",
                "role": role,
                "rockhall_url": rockhall_url,
            }
        )
    cleaned.sort(key=lambda item: (item["year"], item["act"], item["role"]))
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
    inductions = _normalize_inductions(list(person.get("inductions") or []))
    if not inductions:
        return "missing_induction", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None
    qid = str(entity.get("id") or "")
    if not qid.startswith("Q") or len(qid) < 2:
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None

    if HUMAN_QID not in _instance_ids(entity):
        if person.get("primary_role") == "solo" and "group" in (person.get("act_kinds") or []):
            return "band_no_listed_members", None
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
    primary_role = "solo" if any(item["role"] == "solo" for item in inductions) else "member"
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "rockhall_url": inductions[0]["rockhall_url"],
        "wikipedia_list_url": LIST_URL,
        "primary_role": primary_role,
        "inductions": inductions,
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
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
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
                    "primary_role": person.get("primary_role"),
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
                    "primary_role": draft["primary_role"],
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
                    "primary_role": draft["primary_role"],
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
                "rockhall_url": draft["rockhall_url"],
                "wikipedia_list_url": draft["wikipedia_list_url"],
                "primary_role": draft["primary_role"],
                "inductions": draft["inductions"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in drafted:
        slug = unique_slug(row["name"], used_slugs, title=row["wikipedia_title"])
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, str, str]:
    years = [str(item.get("year") or "9999") for item in row.get("inductions") or []]
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
    people, acts, _wikitext = fetch_inductee_people(cache_dir=cache_dir / "wikipedia" / "rock_hall_list")
    infoboxes: dict[str, dict[str, Any]] = {}
    for person in people:
        title = str(person["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        try:
            birth, _wikitext = fetch_infobox_birth(
                title,
                cache_path=cache_dir / "wikipedia" / "rock_hall_infobox" / f"{safe}.json",
            )
        except Exception:
            infoboxes[title] = {"kind": "missing", "birth_date": None, "month_day": None}
            continue
        infoboxes[title] = birth

    titles = [str(person["enwiki_title"]) for person in people]
    entities = fetch_titles(titles, cache_dir / "wikidata")
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        people,
        infoboxes,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    validate_rock_hall(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    solo_acts = sum(1 for act in acts if act["kind"] == "solo")
    group_acts = sum(1 for act in acts if act["kind"] == "group")
    listed_members = sum(len(act.get("members") or []) for act in acts)
    kept_solo = sum(1 for row in rows if row["primary_role"] == "solo")
    kept_member = sum(1 for row in rows if row["primary_role"] == "member")
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_acts": len(acts),
        "catalog_solo_acts": solo_acts,
        "catalog_group_acts": group_acts,
        "catalog_listed_members": listed_members,
        "catalog_people": len(people),
        "kept": len(rows),
        "kept_solo": kept_solo,
        "kept_member": kept_member,
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "scope": {
            "category": CATEGORY,
            "note": (
                "Performers category only. Musical influence, Non-performers "
                "(Ahmet Ertegun Award), Award for Musical Excellence, and Singles omitted."
            ),
            "through": max((act["year"] for act in acts), default=""),
            "omit": [
                "Musical influence / Early influences",
                "Non-performers (Ahmet Ertegun Award)",
                "Award for Musical Excellence",
                "Singles",
            ],
        },
        "sources": [
            f"Rock & Roll Hall of Fame inductees ({ROCKHALL_HOME})",
            f"Rock Hall induction process ({ROCKHALL_INDUCTION})",
            f"Wikipedia List of Rock and Roll Hall of Fame inductees ({LIST_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikipedia Performers inductee (solo or listed inducted member) AND "
                "Wikipedia infobox YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match "
                "AND Wikidata instance-of human"
            ),
            "drop": [
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "not_a_person / band_no_listed_members",
                "missing Wikipedia summary",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "expand_band_members": True,
            "expand_only_listed_inducted_members": True,
        },
        "rockhall_home": ROCKHALL_HOME,
        "wikipedia_list_url": LIST_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path, "acts": acts}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Rock Hall Performers birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Rock Hall people to {args.out} "
        f"(acts {prov['catalog_acts']}: {prov['catalog_solo_acts']} solo / "
        f"{prov['catalog_group_acts']} groups / {prov['catalog_listed_members']} listed members; "
        f"kept {prov['kept_solo']} solo + {prov['kept_member']} members; "
        f"excluded {prov['excluded']}: {prov['by_reason']})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
