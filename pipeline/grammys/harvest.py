"""Assemble grammys/people.jsonl: Wikipedia infobox DOB + Wikidata P569 verify."""

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
from pipeline.cabinet.wiki_infobox import fetch_infobox_birth
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.grammys.wiki_list import (
    AOTY_URL,
    GRAMMY_AWARDS,
    GRAMMY_HOME,
    fetch_winner_rows,
    grammy_category_url,
    parse_infobox_member_titles,
    parse_winners_wikitext,
    resolve_enwiki_title,
    various_artist_years,
)
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_entities, fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "grammy_aoty.schema.json"
DEFAULT_OUT = ROOT / "data" / "grammys" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "grammys" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"

HUMAN = {"Q5"}
GROUP_TYPES = {
    "Q215380",  # musical group
    "Q5741069",  # rock band
    "Q2088357",  # musical ensemble
    "Q9212979",  # musical duo
    "Q253918",  # musical trio
    "Q216337",  # vocal group
    "Q1866801",  # girl group
    "Q6979593",  # boy band
    "Q5888560",  # hip hop group
    "Q321782",  # big band
    "Q13417114",  # string quartet
    "Q2990567",  # musical collective
    "Q13414910",  # jazz ensemble
    "Q105756498",  # vocal duo
    "Q1143136",
    "Q6163838",
}


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_grammys(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("grammys people.jsonl failed schema validation:\n" + "\n".join(errors))


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


def _entity_label(entity: dict, fallback: str) -> str:
    labels = entity.get("labels") or {}
    return str((labels.get("en") or {}).get("value") or "").strip() or fallback


def _p31_ids(entity: dict) -> set[str]:
    ids: set[str] = set()
    for claim in entity.get("claims", {}).get("P31", []) or []:
        if claim.get("rank") == "deprecated":
            continue
        snak = claim.get("mainsnak") or {}
        if snak.get("snaktype") != "value":
            continue
        raw = (snak.get("datavalue") or {}).get("value") or {}
        qid = raw.get("id")
        if qid:
            ids.add(str(qid))
    return ids


def entity_kind(entity: dict | None) -> str:
    if entity is None or entity.get("missing") is not None:
        return "missing"
    types = _p31_ids(entity)
    if types & HUMAN and not (types & GROUP_TYPES):
        return "human"
    if types & GROUP_TYPES:
        return "group"
    if entity.get("claims", {}).get("P569"):
        return "human"
    if entity.get("claims", {}).get("P527"):
        return "group"
    return "other"


def _qualifier_year(claim: dict, prop: str) -> int | None:
    for snak in (claim.get("qualifiers") or {}).get(prop, []) or []:
        if snak.get("snaktype") != "value":
            continue
        raw = (snak.get("datavalue") or {}).get("value") or {}
        if not isinstance(raw, dict):
            continue
        time = str(raw.get("time") or "")
        match = re_year(time)
        if match:
            return int(match)
    return None


def re_year(time: str) -> str | None:
    match = re.search(r"([+-]?)(\d{4})", time)
    if not match or match.group(1) == "-":
        return None
    return match.group(2)


def member_qids(entity: dict, ceremony_years: list[int]) -> list[str]:
    """P527 humans; keep membership overlapping an award year when dated."""
    dated: list[tuple[str, int | None, int | None]] = []
    undated: list[str] = []
    for claim in entity.get("claims", {}).get("P527", []) or []:
        if claim.get("rank") == "deprecated":
            continue
        snak = claim.get("mainsnak") or {}
        if snak.get("snaktype") != "value":
            continue
        raw = (snak.get("datavalue") or {}).get("value") or {}
        qid = raw.get("id")
        if not qid:
            continue
        start = _qualifier_year(claim, "P580")
        end = _qualifier_year(claim, "P582")
        if start or end:
            dated.append((str(qid), start, end))
        else:
            undated.append(str(qid))
    if dated and ceremony_years:
        kept: list[str] = []
        years = ceremony_years
        for qid, start, end in dated:
            if any((start is None or start <= year) and (end is None or end >= year) for year in years):
                kept.append(qid)
        if kept:
            return list(dict.fromkeys(kept + undated))
    return list(dict.fromkeys(undated + [qid for qid, _s, _e in dated]))


def unique_slug(name: str, used: set[str], *, title: str) -> str:
    base = slugify(name) or slugify(title) or "grammy-winner"
    if base not in used:
        return base
    extra = slugify(title) or "winner"
    candidate = extra if extra not in used else f"{base}-aoty"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _normalize_awards(awards: list[dict[str, Any]], *, billed_act: str) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for award in awards:
        year = str(award.get("year") or "").strip()
        album = str(award.get("album") or "").strip()
        grammy_url = str(award.get("grammy_url") or "").strip() or grammy_category_url(year or 0)
        if not year or not album or not grammy_url:
            continue
        cleaned.append(
            {
                "year": year,
                "ceremony_number": int(award["ceremony_number"]),
                "album": album,
                "grammy_url": grammy_url,
                "billed_act": str(award.get("billed_act") or billed_act).strip() or billed_act,
                "category": "Album of the Year",
                "category_id": "album-of-the-year",
            }
        )
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
    billed_act = str(person.get("billed_act") or name)
    if name.lower() in blocklist or title.lower() in blocklist or slugify(name) in blocklist:
        return "blocklist", None
    awards = _normalize_awards(list(person.get("awards") or []), billed_act=billed_act)
    if not awards:
        return "missing_award", None

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

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None
    qid = str(entity.get("id") or "")
    if not qid.startswith("Q") or len(qid) < 2:
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None
    if entity_kind(entity) != "human":
        return "not_a_person", None

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
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "grammy_url": awards[0]["grammy_url"],
        "billing": person.get("billing") or "primary",
        "billed_act": billed_act,
        "awards": awards,
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
            by_title[title.lower()] = entity
            by_title[title.replace(" ", "_").lower()] = entity
    return by_title


def _lookup_entity(by_title: dict[str, dict], title: str) -> dict | None:
    return (
        by_title.get(title)
        or by_title.get(title.replace(" ", "_"))
        or by_title.get(title.lower())
        or by_title.get(title.replace(" ", "_").lower())
    )


def expand_catalog(
    billed: list[dict[str, Any]],
    entities: dict[str, dict],
    member_entities: dict[str, dict],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Humans stay primary billed. Groups expand to dated P527 members."""
    by_title = _entities_by_title(entities)
    people: list[dict[str, Any]] = []
    band_reports: list[dict[str, Any]] = []
    exclusions: list[dict[str, Any]] = []
    seen_keys: set[tuple[str, str]] = set()

    for act in billed:
        title = str(act.get("enwiki_title") or "")
        entity = _lookup_entity(by_title, title)
        kind = entity_kind(entity)
        years = [int(award["year"]) for award in act.get("awards") or [] if str(award.get("year") or "").isdigit()]
        if kind == "human":
            people.append(
                {
                    "name": act["name"],
                    "enwiki_title": title,
                    "billing": "primary",
                    "billed_act": act["name"],
                    "awards": act["awards"],
                }
            )
            continue
        if kind != "group" or entity is None:
            exclusions.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": title,
                    "reason": "not_a_person" if kind == "other" else "missing_wikidata",
                }
            )
            band_reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": title,
                    "action": "omitted",
                    "reason": "not_a_person" if kind == "other" else "missing_wikidata",
                    "members_kept": [],
                    "members_considered": [],
                }
            )
            continue

        qids = member_qids(entity, years)
        wiki_members = list(act.get("wiki_members") or [])
        considered: list[str] = []
        kept_names: list[str] = []
        for qid in qids:
            member = member_entities.get(qid)
            if member is None or entity_kind(member) != "human":
                continue
            member_title = _enwiki_title(member, "")
            member_name = _entity_label(member, member_title or qid)
            considered.append(member_name or qid)
            key = (member_title or qid, "band_member")
            if key in seen_keys:
                continue
            seen_keys.add(key)
            people.append(
                {
                    "name": member_name,
                    "enwiki_title": member_title or member_name,
                    "billing": "band_member",
                    "billed_act": act["name"],
                    "awards": act["awards"],
                    "qid_hint": qid,
                }
            )
            kept_names.append(member_name)
        if not kept_names and wiki_members:
            for member in wiki_members:
                member_title = str(member.get("enwiki_title") or "")
                member_name = str(member.get("name") or member_title)
                if not member_title:
                    continue
                considered.append(member_name)
                key = (member_title, "band_member")
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                people.append(
                    {
                        "name": member_name,
                        "enwiki_title": member_title,
                        "billing": "band_member",
                        "billed_act": act["name"],
                        "awards": act["awards"],
                    }
                )
                kept_names.append(member_name)
        if not kept_names:
            exclusions.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": title,
                    "reason": "band_no_day_precision_members",
                }
            )
            band_reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": title,
                    "action": "omitted",
                    "reason": "band_no_day_precision_members",
                    "members_kept": [],
                    "members_considered": considered,
                }
            )
        else:
            band_reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": title,
                    "action": "expanded",
                    "reason": "band_members_with_public_dobs",
                    "members_kept": kept_names,
                    "members_considered": considered,
                }
            )
    return people, band_reports, exclusions


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
    by_qid = {str(entity.get("id")): entity for entity in entities.values() if entity and entity.get("id")}

    for person in people:
        title = str(person.get("enwiki_title") or "")
        listed = infoboxes.get(title)
        entity = None
        hint = person.get("qid_hint")
        if hint:
            entity = by_qid.get(str(hint)) or entities.get(str(hint))
        if entity is None:
            entity = _lookup_entity(by_title, title)
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
                    "billing": person.get("billing"),
                    "billed_act": person.get("billed_act"),
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
                "grammy_url": draft["grammy_url"],
                "billing": draft["billing"],
                "billed_act": draft["billed_act"],
                "awards": draft["awards"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
            }
        )

    merged: dict[str, dict] = {}
    for row in drafted:
        key = row["qid"]
        if key not in merged:
            merged[key] = row
            continue
        existing = merged[key]
        awards = { (item["year"], item["album"]): item for item in existing["awards"] }
        for award in row["awards"]:
            awards[(award["year"], award["album"])] = award
        existing["awards"] = sorted(awards.values(), key=lambda item: int(item["ceremony_number"]))
        if existing["billing"] != "primary" and row["billing"] == "primary":
            existing["billing"] = "primary"
            existing["billed_act"] = row["billed_act"]

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in merged.values():
        slug = unique_slug(row["name"], used_slugs, title=row["wikipedia_title"])
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, int, str]:
    years = [int(award.get("year") or 9999) for award in row.get("awards") or []]
    first_year = min(years) if years else 9999
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
    billed, wikitext = fetch_winner_rows(cache_dir=cache_dir / "wikipedia" / "grammy_aoty")
    wins = parse_winners_wikitext(wikitext)
    for act in billed:
        title = str(act["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        resolved = resolve_enwiki_title(
            title,
            cache_path=cache_dir / "wikipedia" / "grammy_redirects" / f"{safe}.json",
        )
        act["enwiki_title"] = resolved
    titles = [str(act["enwiki_title"]) for act in billed]
    entities = fetch_titles(titles, cache_dir / "wikidata")
    member_ids: list[str] = []
    by_title = _entities_by_title(entities)
    for act in billed:
        entity = _lookup_entity(by_title, act["enwiki_title"])
        if entity_kind(entity) != "group" or entity is None:
            continue
        years = [int(award["year"]) for award in act.get("awards") or [] if str(award.get("year") or "").isdigit()]
        qids = member_qids(entity, years)
        member_ids.extend(qids)
        if not qids:
            safe = act["enwiki_title"].replace("/", "_").replace(" ", "_")
            _birth, band_wikitext = fetch_infobox_birth(
                act["enwiki_title"],
                cache_path=cache_dir / "wikipedia" / "grammy_bands" / f"{safe}.json",
            )
            act["wiki_members"] = parse_infobox_member_titles(band_wikitext)
    member_entities = fetch_entities(member_ids, cache_dir / "wikidata") if member_ids else {}
    catalog, band_reports, expand_exclusions = expand_catalog(billed, entities, member_entities)

    infoboxes: dict[str, dict[str, Any]] = {}
    extra_titles: list[str] = []
    for person in catalog:
        title = str(person["enwiki_title"])
        if not title:
            continue
        extra_titles.append(title)
        safe = title.replace("/", "_").replace(" ", "_")
        birth, _wikitext = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "grammy_infobox" / f"{safe}.json",
        )
        infoboxes[title] = birth

    person_entities = fetch_titles(extra_titles, cache_dir / "wikidata")
    person_entities.update(member_entities)
    person_entities.update(entities)
    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        catalog,
        infoboxes,
        person_entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
    )
    exclusions = expand_exclusions + exclusions
    kept_by_act: dict[str, list[str]] = {}
    for row in rows:
        if row["billing"] == "band_member":
            kept_by_act.setdefault(row["billed_act"], []).append(row["name"])
    for report in band_reports:
        final_kept = kept_by_act.get(str(report.get("name") or ""), [])
        report["members_kept"] = final_kept
        if report.get("action") == "expanded" and not final_kept:
            report["action"] = "omitted"
            report["reason"] = "band_members_failed_day_precision"
        elif final_kept:
            report["action"] = "expanded"
            report["reason"] = "band_members_with_public_dobs"
    validate_grammys(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_billed_acts": len(billed),
        "catalog_ceremonies": len(wins),
        "catalog_people": len(catalog),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "bands": band_reports,
        "various_artists": various_artist_years(wins),
        "sources": [
            f"Recording Academy / Grammy.com ({GRAMMY_HOME})",
            f"Grammy Awards ceremony index ({GRAMMY_AWARDS})",
            "Grammy.com Album of the Year category pages (https://www.grammy.com/awards/categories/album-of-the-year/{year}/)",
            f"Wikipedia Grammy Award for Album of the Year ({AOTY_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikipedia Album of the Year winner Artist(s) column AND (primary billed "
                "human OR expanded band member) AND Wikipedia infobox YYYY-MM-DD AND "
                "Wikidata P569 precision=11 AND dates match"
            ),
            "drop": [
                "various_artists (no primary billed person)",
                "production team / featured-friend <small> credits",
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "band omitted when no member has a public day-precision DOB",
                "missing Wikipedia summary",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "primary_billed_only": True,
            "band_members": (
                "expand Wikidata P527 humans when day-precision DOBs exist; "
                "if P527 is empty, use the band Wikipedia caption/current-members "
                "wikilinks only (not past-member history); otherwise omit the band"
            ),
        },
        "grammy_home": GRAMMY_HOME,
        "aoty_url": AOTY_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Grammy Album of the Year birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Grammy AOTY people to {args.out} "
        f"(ceremonies {prov['catalog_ceremonies']}; billed {prov['catalog_billed_acts']}; "
        f"excluded {prov['excluded']}: {prov['by_reason']})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
