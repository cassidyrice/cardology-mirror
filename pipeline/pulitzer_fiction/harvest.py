"""Assemble pulitzer_fiction/people.jsonl: Wikipedia infobox DOB + Wikidata P569."""

from __future__ import annotations

import argparse
import json
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
from pipeline.presidents.extract import parse_day_precision_time
from pipeline.pulitzer_fiction.bios import parse_pulitzer_html, parse_wikipedia_birth_field
from pipeline.pulitzer_fiction.wiki_list import (
    FICTION_URL,
    PULITZER_FICTION,
    PULITZER_HOME,
    fetch_winner_rows,
    not_awarded_years,
    resolve_enwiki_title,
)
from pipeline.wikidata import fetch_titles
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "pulitzer_fiction.schema.json"
DEFAULT_OUT = ROOT / "data" / "pulitzer_fiction" / "people.jsonl"
DEFAULT_PROVENANCE = ROOT / "data" / "pulitzer_fiction" / "provenance.json"
DEFAULT_CACHE = ROOT / "data" / "cache"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"

HUMAN_QID = "Q5"
BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_pulitzer_fiction(rows: list[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("pulitzer_fiction people.jsonl failed schema validation:\n" + "\n".join(errors))


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
    base = slugify(name) or slugify(title) or "pulitzer-fiction-winner"
    if base not in used:
        return base
    extra = slugify(title) or "winner"
    candidate = extra if extra not in used else f"{base}-fiction"
    if candidate not in used:
        return candidate
    suffix = 2
    while f"{candidate}-{suffix}" in used:
        suffix += 1
    return f"{candidate}-{suffix}"


def _normalize_awards(awards: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for award in awards:
        year = str(award.get("year") or "").strip()
        work = str(award.get("work") or "").strip()
        pulitzer_url = str(award.get("pulitzer_url") or "").strip()
        if not year or not work or not pulitzer_url:
            continue
        key = (year, work)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(
            {
                "year": year,
                "work": work,
                "category": str(award.get("category") or "Pulitzer Prize for Fiction"),
                "category_id": "fiction",
                "pulitzer_url": pulitzer_url,
                "shared": bool(award.get("shared")),
            }
        )
    cleaned.sort(key=lambda item: (item["year"], item["work"]))
    return cleaned


def classify_row(
    *,
    person: dict[str, Any],
    listed: dict[str, Any] | None,
    entity: dict | None,
    today: date,
    blocklist: set[str],
    pulitzer_org: dict[str, Any] | None = None,
) -> tuple[str | None, dict[str, Any] | None]:
    name = str(person.get("name") or "")
    title = str(person.get("enwiki_title") or "")
    if name.lower() in blocklist or title.lower() in blocklist or slugify(name) in blocklist:
        return "blocklist", None
    awards = _normalize_awards(list(person.get("awards") or []))
    if not awards:
        return "missing_award", None

    if entity is None or entity.get("missing") is not None:
        return "missing_wikidata", None
    qid = str(entity.get("id") or "")
    if not qid.startswith("Q") or len(qid) < 2:
        return "missing_qid", None
    if qid.lower() in blocklist:
        return "blocklist", None
    if HUMAN_QID not in _instance_ids(entity):
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

    official = pulitzer_org or {}
    official_kind = official.get("kind")
    official_iso = official.get("birth_date")
    if official_kind == "year_only":
        return "pulitzer_org_year_only", None
    if official_kind == "day" and official_iso and official_iso != wiki_iso:
        return "pulitzer_org_conflict", {
            "qid": qid,
            "name": name,
            "wikipedia_title": title,
            "wikipedia_infobox_date": wiki_iso,
            "wikidata_birth_date": wikidata_iso,
            "pulitzer_org_birth_date": official_iso,
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
    draft = {
        "qid": qid,
        "name": name,
        "birth_date": wiki_iso,
        "death_date": death[0] if death else None,
        "wikipedia_title": resolved_title,
        "pulitzer_url": awards[0]["pulitzer_url"],
        "awards": awards,
        "wikipedia_infobox_date": wiki_iso,
        "wikidata_birth_date": wikidata_iso,
        "dob_crosscheck": "match",
        "pulitzer_org_birth_date": org_date,
        "pulitzer_org_crosscheck": org_crosscheck,
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


def fetch_pulitzer_org_date(
    url: str,
    *,
    cache_path: Path | None = None,
) -> dict[str, Any]:
    """Fetch a Pulitzer.org page when possible. Cloudflare blocks are not invented."""
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
    kind, iso = parse_pulitzer_html(html)
    return {"kind": kind, "birth_date": iso, "url": url}


def assemble_rows(
    people: list[dict[str, Any]],
    infoboxes: dict[str, dict[str, Any]],
    entities: dict[str, dict],
    *,
    cache_dir: Path,
    today: date | None = None,
    blocklist: set[str] | None = None,
    pulitzer_org_dates: dict[str, dict[str, Any]] | None = None,
) -> tuple[list[dict], list[dict]]:
    today = today or date.today()
    blocked = {item.lower() for item in (blocklist or [])}
    exclusions: list[dict] = []
    drafted: list[dict] = []
    by_title = _entities_by_title(entities)
    official_by_url = pulitzer_org_dates or {}

    for person in people:
        title = str(person.get("enwiki_title") or "")
        listed = infoboxes.get(title)
        entity = by_title.get(title) or by_title.get(title.replace(" ", "_"))
        official = None
        for award in person.get("awards") or []:
            url = str(award.get("pulitzer_url") or "")
            if url and url in official_by_url:
                official = official_by_url[url]
                break
        reason, draft = classify_row(
            person=person,
            listed=listed,
            entity=entity,
            today=today,
            blocklist=blocked,
            pulitzer_org=official,
        )
        if reason or draft is None or draft.get("dob_crosscheck") != "match":
            extra = draft if reason in {"dob_conflict", "pulitzer_org_conflict"} and draft is not None else {}
            exclusions.append(
                {
                    "qid": extra.get("qid") or (entity or {}).get("id"),
                    "name": person.get("name"),
                    "wikipedia_title": title,
                    "wikipedia_infobox_date": extra.get("wikipedia_infobox_date")
                    if extra
                    else (None if listed is None else listed.get("birth_date")),
                    "wikidata_birth_date": extra.get("wikidata_birth_date"),
                    "pulitzer_org_birth_date": extra.get("pulitzer_org_birth_date"),
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
                "pulitzer_url": draft["pulitzer_url"],
                "awards": draft["awards"],
                "wikipedia_infobox_date": draft["wikipedia_infobox_date"],
                "wikidata_birth_date": draft["wikidata_birth_date"],
                "dob_crosscheck": "match",
                "pulitzer_org_birth_date": draft["pulitzer_org_birth_date"],
                "pulitzer_org_crosscheck": draft["pulitzer_org_crosscheck"],
            }
        )

    merged: dict[str, dict] = {}
    for row in drafted:
        key = row["qid"]
        if key not in merged:
            merged[key] = row
            continue
        existing = merged[key]
        awards = {(item["year"], item["work"]): item for item in existing["awards"]}
        for award in row["awards"]:
            awards[(award["year"], award["work"])] = award
        existing["awards"] = sorted(awards.values(), key=lambda item: (item["year"], item["work"]))

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
    billed, wikitext = fetch_winner_rows(cache_dir=cache_dir / "wikipedia" / "pulitzer_fiction")
    held_years = not_awarded_years(wikitext)
    for act in billed:
        title = str(act["enwiki_title"])
        safe = title.replace("/", "_").replace(" ", "_")
        resolved = resolve_enwiki_title(
            title,
            cache_path=cache_dir / "wikipedia" / "pulitzer_redirects" / f"{safe}.json",
        )
        act["enwiki_title"] = resolved

    titles = [str(act["enwiki_title"]) for act in billed]
    entities = fetch_titles(titles, cache_dir / "wikidata")

    infoboxes: dict[str, dict[str, Any]] = {}
    for person in billed:
        title = str(person["enwiki_title"])
        if not title:
            continue
        safe = title.replace("/", "_").replace(" ", "_")
        birth, wikitext = fetch_infobox_birth(
            title,
            cache_path=cache_dir / "wikipedia" / "pulitzer_infobox" / f"{safe}.json",
        )
        if birth.get("kind") != "day":
            extra = parse_wikipedia_birth_field(wikitext)
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

    official_dates: dict[str, dict[str, Any]] = {}
    for person in billed:
        for award in person.get("awards") or []:
            url = str(award.get("pulitzer_url") or "")
            if not url or url in official_dates:
                continue
            safe = url.replace("https://", "").replace("http://", "").replace("/", "_")
            official_dates[url] = fetch_pulitzer_org_date(
                url,
                cache_path=cache_dir / "pulitzer_org" / f"{safe}.html",
            )

    blocklist = load_blocklist(blocklist_path)
    rows, exclusions = assemble_rows(
        billed,
        infoboxes,
        entities,
        cache_dir=cache_dir,
        today=today,
        blocklist=blocklist,
        pulitzer_org_dates=official_dates,
    )
    validate_pulitzer_fiction(rows)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason = dict(Counter(item["reason"] for item in exclusions))
    official_kinds = dict(Counter(item.get("kind") or "missing" for item in official_dates.values()))
    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "people_count": len(rows),
        "catalog_winners": len(billed),
        "catalog_award_years": len({award["year"] for person in billed for award in person.get("awards") or []}),
        "kept": len(rows),
        "excluded": len(exclusions),
        "by_reason": by_reason,
        "exclusions": exclusions,
        "not_awarded": held_years,
        "pulitzer_org_fetches": official_kinds,
        "sources": [
            f"The Pulitzer Prizes Fiction category ({PULITZER_FICTION})",
            f"The Pulitzer Prizes home ({PULITZER_HOME})",
            "Pulitzer.org year pages cited on the Wikipedia Fiction list",
            f"Wikipedia Pulitzer Prize for Fiction ({FICTION_URL})",
            "Wikipedia article infobox birth-date templates (CC BY-SA 4.0)",
            "Wikidata P569 day-precision verify (CC0, Gregorian preferred)",
            "Wikipedia REST page summary (CC BY-SA 4.0)",
        ],
        "birth_card": "pipeline.birthcard (D1: Dec 31 = Joker). Year unused.",
        "rules": {
            "keep": (
                "Wikipedia Pulitzer Prize for Fiction winner row (yellow) AND person-scope "
                "human AND Wikipedia infobox YYYY-MM-DD AND Wikidata P569 precision=11 "
                "AND dates match. Co-winners / joint recipients are kept as separate people."
            ),
            "drop": [
                "not_awarded years",
                "finalists (non-yellow rows)",
                "not_a_person / institutions",
                "year_only (Wikipedia infobox year without month/day)",
                "dob_conflict (Wikipedia infobox day ≠ Wikidata P569 day)",
                "pulitzer_org_conflict (Pulitzer.org bio day ≠ Wikipedia/Wikidata day)",
                "wikidata_precision (P569 missing or < 11)",
                "minor (under 18)",
                "description_keyword (D3: serial killer / murderer / terrorist / dictator)",
                "missing Wikipedia summary",
            ],
            "do_not_invent_dates": True,
            "year_before_1900_applied": False,
            "person_scope_only": True,
            "pulitzer_org": (
                "Winner identity is the Wikipedia list, which cites Pulitzer.org year pages. "
                "Live Pulitzer.org HTML is fetched when Cloudflare allows it. A published "
                "day that conflicts with Wikipedia/Wikidata is dropped, not guessed. "
                "Challenge/403 pages are recorded as unavailable — dates are not invented."
            ),
        },
        "pulitzer_home": PULITZER_HOME,
        "fiction_url": FICTION_URL,
        "copy": "Page copy is local/template from source_text + harvested card meanings. No Vertex batch.",
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return {"rows": rows, "provenance": provenance, "out_path": out_path}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Harvest Pulitzer Prize for Fiction birth-card JSONL (day-precision only)."
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
        f"wrote {prov['kept']} Pulitzer Fiction people to {args.out} "
        f"(catalog {prov['catalog_winners']}; excluded {prov['excluded']}: {prov['by_reason']})",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
