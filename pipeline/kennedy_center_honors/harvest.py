"""Assemble kennedy_center_honors/people.jsonl: Wikipedia infobox DOB + Wikidata P569."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.cabinet.wiki_infobox import fetch_infobox_birth
from pipeline.exclusions import description_blocked, load_blocklist
from pipeline.http import fetch_text
from pipeline.kennedy_center_honors.bios import parse_kc_html, parse_wikipedia_birth_field
from pipeline.kennedy_center_honors.wiki_list import (
    KC_HOME,
    LIST_URL,
    fetch_honoree_people,
    resolve_enwiki_title,
)
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "kennedy_center_honors.schema.json"
DEFAULT_OUT = ROOT / "data" / "kennedy_center_honors" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "kennedy_center_honors" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"

HUMAN_QID = "Q5"
GROUP_TYPES = {
    "Q215380",
    "Q5741069",
    "Q2088357",
    "Q9212979",
    "Q253918",
    "Q216337",
    "Q1866801",
    "Q6979593",
    "Q5888560",
    "Q321782",
    "Q13417114",
    "Q2990567",
    "Q13414910",
    "Q105756498",
    "Q1143136",
    "Q6163838",
    "Q15416",  # television program
    "Q2743",  # musical
    "Q24354",  # theatre
    "Q41253",  # theatre company
    "Q41298",  # organization
}
BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)
_ARTIST_URL_RE = re.compile(
    r"https?://(?:www\.)?kennedy-center\.org/artists/[A-Za-z0-9_./#%-]+",
    re.IGNORECASE,
)


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_kennedy_center_honors(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("kennedy_center_honors people.jsonl failed schema validation:\n" + "\n".join(errors))


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
        raw = (snak.get("datavalue") or {}).get("value") or {}
        qid = str(raw.get("id") or "")
        if qid.startswith("Q"):
            ids.add(qid)
    return ids


def unique_slug(name: str, used: set[str], *, title: str) -> str:
    base = slugify(name) or slugify(title) or "kennedy-center-honoree"
    if base not in used:
        return base
    extra = slugify(title) or "honoree"
    candidate = extra if extra not in used else f"{base}-honors"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _normalize_honors(honors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for item in honors:
        year = str(item.get("year") or "").strip()
        act = str(item.get("act") or "").strip()
        act_title = str(item.get("act_wikipedia_title") or "").strip()
        role = str(item.get("role") or "").strip()
        kc_url = str(item.get("kennedy_center_url") or KC_HOME).strip()
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
                "role": role,
                "kennedy_center_url": kc_url,
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
    kennedy_center: dict[str, Any] | None = None,
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(person.get("name") or "")
    title = str(person.get("enwiki_title") or "")
    if name.lower() in blocklist or title.lower() in blocklist or slugify(name) in blocklist:
        return "blocklist", None
    honors = _normalize_honors(list(person.get("honors") or []))
    if not honors:
        return "missing_honor", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None
    qid = str(entity.get("id") or "")
    if not qid.startswith("Q") or len(qid) < 2:
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None

    types = _instance_ids(entity)
    if HUMAN_QID not in types:
        if person.get("primary_role") == "solo" and "group" in (person.get("act_kinds") or []):
            return "band_no_listed_members", None
        if types & GROUP_TYPES:
            return "institution", None
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

    official = kennedy_center or {}
    official_kind = official.get("kind")
    official_iso = official.get("birth_date")
    if official_kind == "year_only":
        return "kennedy_center_year_only", None
    if official_kind == "day" and official_iso and official_iso != wiki_iso:
        return "kennedy_center_conflict", {
            "qid": qid,
            "name": name,
            "wikipedia_title": title,
            "wikipedia_infobox_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
            "kennedy_center_birth_date": official_iso,
        }
    if official_kind == "day" and official_iso == wiki_iso:
        org_crosscheck = "match"
        org_date = official_iso
    elif official_kind == "unavailable":
        org_crosscheck = "unavailable"
        org_date = None
    else:
        org_crosscheck = "not_published"
        org_date = None

    wiki_desc = _wikidata_description(entity)
    if description_blocked(wiki_desc):
        return "description_keyword", None

    resolved_title = listed.get("wikipedia_title") or _enwiki_title(entity, title)
    if not resolved_title:
        return "missing_enwiki_title", None

    death = parse_day_precision_time(entity, "P570")
    primary_role = "solo" if any(item["role"] == "solo" for item in honors) else "member"
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "kennedy_center_url": honors[0]["kennedy_center_url"],
        "wikipedia_list_url": LIST_URL,
        "primary_role": primary_role,
        "honors": honors,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "kennedy_center_birth_date": org_date,
        "kennedy_center_crosscheck": org_crosscheck,
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


def artist_urls_from_wikitext(wikitext: str) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for match in _ARTIST_URL_RE.finditer(wikitext or ""):
        url = match.group(0).rstrip(").,;\"'")
        if url in seen:
            continue
        seen.add(url)
        urls.append(url)
    return urls


def fetch_kennedy_center_date(
    url: str,
    *,
    cache_path: Path | None = None,
) -> dict[str, Any]:
    """Fetch a Kennedy Center page when possible. Challenge/404 pages are not invented."""
    try:
        html = fetch_text(
            url,
            cache_path=cache_path,
            extra_headers={"User-Agent": BROWSER_UA, "Accept": "text/html"},
        )
    except (HTTPError, OSError, RuntimeError, TimeoutError, ValueError):
        return {"kind": "unavailable", "birth_date": None, "url": url}
    if "Just a moment..." in html and "challenges.cloudflare.com" in html:
        return {"kind": "unavailable", "birth_date": None, "url": url}
    if re.search(r"\b404\b", html[:400], re.IGNORECASE) and "not found" in html.lower():
        return {"kind": "unavailable", "birth_date": None, "url": url}
    kind, iso = parse_kc_html(html)
    return {"kind": kind, "birth_date": iso, "url": url}


def assemble_rows(
    people: list[dict[str, Any]],
    infoboxes: dict[str, dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    kennedy_center_dates: dict[str, dict[str, Any]] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []
    by_title = _entities_by_title(entities)
    official_by_key = kennedy_center_dates or {}

    for person in people:
        title = str(person.get("enwiki_title") or "")
        listed = infoboxes.get(title)
        entity = by_title.get(title) or by_title.get(title.replace(" ", "_"))
        official = official_by_key.get(title) or official_by_key.get(person.get("name") or "")
        reason, draft = classify_row(
            person=person,
            listed=listed,
            entity=entity,
            today=today,
            blocklist=blocked,
            kennedy_center=official,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason in {"dob_conflict", "kennedy_center_conflict"} and draft is not None else {}
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
                    "kennedy_center_birth_date": extra.get("kennedy_center_birth_date"),
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
                "kennedy_center_url": draft["kennedy_center_url"],
                "wikipedia_list_url": draft["wikipedia_list_url"],
                "primary_role": draft["primary_role"],
                "honors": draft["honors"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
                "kennedy_center_birth_date": draft["kennedy_center_birth_date"],
                "kennedy_center_crosscheck": draft["kennedy_center_crosscheck"],
            }
        )

    merged: dict[str, dict] = {}
    for row in drafted:
        key = row["qid"]
        if key not in merged:
            merged[key] = row
            continue
        existing = merged[key]
        honors = {(item["year"], item["act_wikipedia_title"], item["role"]): item for item in existing["honors"]}
        for honor in row["honors"]:
            honors[(honor["year"], honor["act_wikipedia_title"], honor["role"])] = honor
        existing["honors"] = sorted(honors.values(), key=lambda item: (item["year"], item["act"], item["role"]))
        if existing["primary_role"] != "solo" and row["primary_role"] == "solo":
            existing["primary_role"] = "solo"

    used_slugs: set[str] = set()
    rows: list[dict] = []
    for row in merged.values():
        slug = unique_slug(row["name"], used_slugs, title=row["wikipedia_title"])
        used_slugs.add(slug)
        row["slug"] = slug
        rows.append(row)

    rows.sort(key=_sort_key)
    return rows, exclusions


def _sort_key(row: dict) -> tuple[str, str, str]:
    years = [str(item.get("year") or "9999") for item in row.get("honors") or []]
    first_year = min(years) if years else "9999"
    return (row.get("name") or "", first_year, row.get("qid") or "")


def _group_reports(acts: list[dict[str, Any]], rows: list[dict], exclusions: list[dict]) -> list[dict[str, Any]]:
    kept_titles = {row["wikipedia_title"] for row in rows}
    excluded_by_title = {str(item.get("wikipedia_title") or ""): item for item in exclusions}
    reports: list[dict[str, Any]] = []
    for act in acts:
        if act.get("rescinded") or act.get("kind") == "rescinded":
            continue
        if act.get("kind") not in {"group", "institution"} and not act.get("members"):
            continue
        members = list(act.get("members") or [])
        considered = [item["name"] for item in members]
        kept = [item["name"] for item in members if item["enwiki_title"] in kept_titles]
        if act.get("kind") == "institution" and not members:
            reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "action": "dropped",
                    "reason": "institution",
                    "members_kept": [],
                    "members_considered": [],
                }
            )
            continue
        if not members:
            reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "action": "omitted",
                    "reason": "band_no_listed_members",
                    "members_kept": [],
                    "members_considered": [],
                }
            )
            continue
        if kept:
            reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "action": "expanded",
                    "reason": "listed_members_with_public_dobs",
                    "members_kept": kept,
                    "members_considered": considered,
                }
            )
        else:
            reasons = [
                excluded_by_title.get(item["enwiki_title"], {}).get("reason") or "no_day_precision"
                for item in members
            ]
            reports.append(
                {
                    "name": act.get("name"),
                    "wikipedia_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "action": "omitted",
                    "reason": "band_no_day_precision_members",
                    "members_kept": [],
                    "members_considered": considered,
                    "member_reasons": reasons,
                }
            )
    return reports


def harvest(
    *,
    out_path: Path = DEFAULT_OUT,
    provenance_path: Path = DEFAULT_PROVENANCE,
    cache_dir: Path = DEFAULT_CACHE,
    today: date | None = None,
    blocklist_path: Path = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    today = today or date.today()
    people, acts, list_dropped, _wikitext = fetch_honoree_people(
        cache_dir=cache_dir / "wikipedia" / "kennedy_center_honors_list"
    )
    for person in people:
        title = str(person["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        resolved = resolve_enwiki_title(
            title,
            cache_path=cache_dir / "wikipedia" / "kennedy_center_redirects" / f"{safe}.json",
        )
        person["enwiki_title"] = resolved

    infoboxes: dict[str, dict[str, Any]] = {}
    official_dates: dict[str, dict[str, Any]] = {}
    for person in people:
        title = str(person["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        try:
            birth, person_wikitext = fetch_infobox_birth(
                title,
                cache_path=cache_dir / "wikipedia" / "kennedy_center_infobox" / f"{safe}.json",
            )
        except Exception:
            infoboxes[title] = {"kind": "missing", "birth_date": None, "month_day": None}
            continue
        if birth.get("kind") != "day":
            extra = parse_wikipedia_birth_field(person_wikitext)
            if extra.get("kind") == "day":
                birth = {
                    **birth,
                    "kind": "day",
                    "birth_date": extra["birth_date"],
                    "month_day": str(extra["birth_date"])[5:] if extra.get("birth_date") else None,
                }
            elif extra.get("kind") == "year_only" and birth.get("kind") == "missing":
                birth = {**birth, "kind": "year_only", "birth_date": None}
        infoboxes[title] = birth

        artist_urls = artist_urls_from_wikitext(person_wikitext)
        honor_urls = [
            str(item.get("kennedy_center_url") or "")
            for item in person.get("honors") or []
            if "/artists/" in str(item.get("kennedy_center_url") or "")
        ]
        chosen = artist_urls[0] if artist_urls else (honor_urls[0] if honor_urls else "")
        if chosen:
            official_dates[title] = fetch_kennedy_center_date(
                chosen,
                cache_path=cache_dir / "kennedy_center" / f"{safe}.html",
            )
        else:
            official_dates[title] = {"kind": "not_published", "birth_date": None, "url": None}

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
        kennedy_center_dates=official_dates,
    )
    for item in list_dropped:
        exclusions.append(
            {
                "name": item.get("name"),
                "wikipedia_title": item.get("enwiki_title"),
                "reason": item.get("reason") or "institution",
            }
        )
    validate_kennedy_center_honors(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    official_kinds = dict(Counter(item.get("kind") or "missing" for item in official_dates.values()))
    solo_acts = sum(1 for act in acts if act["kind"] == "solo")
    group_acts = sum(1 for act in acts if act["kind"] == "group")
    institution_acts = sum(1 for act in acts if act["kind"] == "institution")
    rescinded_acts = sum(1 for act in acts if act["kind"] == "rescinded")
    listed_members = sum(len(act.get("members") or []) for act in acts)
    kept_solo = sum(1 for row in rows if row["primary_role"] == "solo")
    kept_member = sum(1 for row in rows if row["primary_role"] == "member")
    group_reports = _group_reports(acts, rows, exclusions)
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_acts": len(acts),
        "catalog_solo_acts": solo_acts,
        "catalog_group_acts": group_acts,
        "catalog_institution_acts": institution_acts,
        "catalog_rescinded_acts": rescinded_acts,
        "catalog_listed_members": listed_members,
        "catalog_people": len(people),
        "kept": len(rows),
        "kept_solo": kept_solo,
        "kept_member": kept_member,
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "group_reports": group_reports,
        "kennedy_center_fetches": official_kinds,
        "scope": {
            "note": (
                "Person-scope Kennedy Center Honors recipients from the Wikipedia roster. "
                "Groups and collectives expand only listed members with public day-precision DOBs. "
                "Institutions, rescinded awards, year-only dates, and conflicts are dropped."
            ),
            "through": max((act["year"] for act in acts), default=""),
            "omit": [
                "institutions without listed people (Apollo Theater)",
                "rescinded awards (Bill Cosby)",
                "groups whose listed members lack a public day-precision DOB",
            ],
        },
        "sources": [
            f"Kennedy Center Honors ({KC_HOME})",
            "Kennedy Center artist bios when Wikipedia cites kennedy-center.org/artists/",
            f"Wikipedia Kennedy Center Honors roster ({LIST_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikipedia Honors recipient (solo or listed group/collective member) AND "
                "Wikipedia infobox YYYY-MM-DD AND Wikidata P569 precision=11 AND dates match "
                "AND Wikidata instance-of human"
            ),
            "drop": [
                "institution (venue / show / company without listed people)",
                "rescinded",
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "kennedy_center_conflict (Kennedy Center bio day ≠ Wikipedia/Wikidata day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "not_a_person / band_no_listed_members / band_no_day_precision_members",
                "missing Wikipedia summary",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "person_scope_only": True,
            "expand_band_members": True,
            "expand_only_listed_honored_members": True,
            "kennedy_center_bios": (
                "Artist/honors HTML is fetched when Wikipedia cites a kennedy-center.org/artists/ "
                "URL. A published day that conflicts with Wikipedia/Wikidata is dropped. "
                "Missing, 404, and challenge pages are unavailable/not_published — dates are not invented."
            ),
        },
        "kennedy_center_home": KC_HOME,
        "wikipedia_list_url": LIST_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path, "acts": acts}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Kennedy Center Honors birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Kennedy Center Honors people to {args.out} "
        f"(acts {prov['catalog_acts']}: {prov['catalog_solo_acts']} solo / "
        f"{prov['catalog_group_acts']} groups / {prov['catalog_listed_members']} listed members / "
        f"{prov['catalog_institution_acts']} institutions; "
        f"kept {prov['kept_solo']} solo + {prov['kept_member']} members; "
        f"excluded {prov['excluded']}: {prov['by_reason']})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
