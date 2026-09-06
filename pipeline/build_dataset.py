"""Assemble people.jsonl from the seed drop or from cached pipeline outputs."""

from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

from jsonschema import Draft202012Validator

from pipeline.birthcard import birth_card_from_iso
from pipeline.exclusions import ExclusionReason, classify_person, load_blocklist
from pipeline.http import fetch_json
from pipeline.pageviews import collect_pageviews
from pipeline.wikidata import extract_person, fetch_titles, load_cached_entity
from pipeline.wikipedia_summary import fetch_summary

ROOT = Path(__file__).resolve().parent
SCHEMA_PATH = ROOT / "schema" / "person.schema.json"
DEFAULT_BLOCKLIST = ROOT / "blocklist.txt"
DEFAULT_SEED_CSV = ROOT / "data" / "seed" / "celebrity_birth_cards.csv"
DEFAULT_SEED_PSV = ROOT / "data" / "seed" / "wikidata_people_raw.psv"
DEFAULT_DROP_CSV = ROOT / "data" / "drop" / "celebrity_birth_cards.csv"
DEFAULT_DROP_PSV = ROOT / "data" / "drop" / "wikidata_people_raw.psv"
SEED_CSV_COLUMNS = ("name", "birth_date", "birth_card", "enwiki_views_8mo", "slug")
COMMONS_FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath/{name}"
COMMONS_API = (
    "https://commons.wikimedia.org/w/api.php?action=query"
    "&titles=File:{name}&prop=imageinfo&iiprop=extmetadata|url&format=json"
)

_LICENSE_CC0 = re.compile(r"\bcc0\b|cc-?zero", re.IGNORECASE)
_LICENSE_CC_BY = re.compile(r"cc[- ]?by", re.IGNORECASE)
_LICENSE_NC = re.compile(r"(^|[-_ ])nc($|[-_ ])", re.IGNORECASE)
_LICENSE_ND = re.compile(r"(^|[-_ ])nd($|[-_ ])", re.IGNORECASE)


def resolve_seed_file(explicit: Path | None, *candidates: Path) -> Path | None:
    """Return the first existing seed/drop file. ``explicit`` wins when it exists."""
    ordered = (([explicit] if explicit is not None else []) + list(candidates))
    for path in ordered:
        if path is not None and path.is_file():
            return path
    return None


def require_seed_csv(explicit: Path | None = None) -> Path:
    if explicit is not None:
        if explicit.is_file():
            return explicit
        raise SystemExit(
            f"seed CSV not found: {explicit} "
            "(expected columns name,birth_date,birth_card,enwiki_views_8mo,slug; "
            "see pipeline/data/seed/README.md)"
        )
    path = resolve_seed_file(None, DEFAULT_SEED_CSV, DEFAULT_DROP_CSV)
    if path is None:
        raise SystemExit(
            "seed CSV not found. Copy the verified drop to "
            "pipeline/data/seed/celebrity_birth_cards.csv "
            "(columns: name,birth_date,birth_card,enwiki_views_8mo,slug). "
            "See pipeline/data/seed/README.md"
        )
    return path


def require_seed_psv(explicit: Path | None = None) -> Path:
    if explicit is not None:
        if explicit.is_file():
            return explicit
        raise SystemExit(
            f"seed PSV not found: {explicit} "
            "(copy wikidata_people_raw.psv into pipeline/data/seed/; "
            "do not invent bios)"
        )
    path = resolve_seed_file(None, DEFAULT_SEED_PSV, DEFAULT_DROP_PSV)
    if path is None:
        raise SystemExit(
            "seed PSV not found. The 5-column celebrity CSV is the index only; "
            "copy wikidata_people_raw.psv into pipeline/data/seed/ "
            "(do not invent bios). See pipeline/data/seed/README.md"
        )
    return path


def validate_seed_csv_columns(fieldnames: list[str] | None) -> None:
    present = {name.strip() for name in (fieldnames or []) if name}
    missing = [column for column in SEED_CSV_COLUMNS if column not in present]
    if missing:
        raise SystemExit(
            "seed CSV is missing required columns: "
            + ", ".join(missing)
            + f" (expected {','.join(SEED_CSV_COLUMNS)})"
        )


def slugify(name: str) -> str:
    decomposed = unicodedata.normalize("NFKD", name)
    ascii_only = "".join(char for char in decomposed if not unicodedata.combining(char))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")
    return slug


def is_allowed_commons_license(text: str | None) -> bool:
    if not text:
        return False
    normalized = text.strip().lower().replace("_", "-")
    normalized = re.sub(r"\s+", "-", normalized)
    if _LICENSE_CC0.search(normalized):
        return True
    if not _LICENSE_CC_BY.search(normalized):
        return False
    if _LICENSE_NC.search(normalized) or _LICENSE_ND.search(normalized):
        return False
    return True


def commons_image_url(filename: str) -> str:
    return COMMONS_FILEPATH.format(name=quote(filename.replace(" ", "_")))


def fetch_commons_license(filename: str, *, cache_dir: Path | None = None) -> str:
    encoded = quote(filename.replace(" ", "_"), safe="_.-")
    url = COMMONS_API.format(name=encoded)
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"{filename.replace('/', '_')}.json"
    payload = fetch_json(url, cache_path=cache_path)
    pages = ((payload.get("query") or {}).get("pages") or {})
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        meta = infos[0].get("extmetadata") or {}
        for key in ("LicenseShortName", "License"):
            value = (meta.get(key) or {}).get("value")
            if value:
                return str(value)
    return ""


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_people(rows: Iterable[dict]) -> None:
    validator = Draft202012Validator(load_schema())
    errors: list[str] = []
    for index, row in enumerate(rows):
        for error in validator.iter_errors(row):
            errors.append(f"row {index} ({row.get('qid')}): {error.message}")
    if errors:
        raise ValueError("people.jsonl failed schema validation:\n" + "\n".join(errors))


def load_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def load_summaries_jsonl(path: Path | None) -> dict[str, dict]:
    """Index Wikipedia REST summaries by qid for the seed rebuild."""
    summaries: dict[str, dict] = {}
    if path is None or not path.is_file():
        return summaries
    for row in load_jsonl(path):
        qid = (row.get("qid") or "").strip()
        if qid:
            summaries[qid] = row
    return summaries


def _split_ids(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in re.split(r"[;,]", value) if part.strip()]


def _index_psv(path: Path) -> dict[str, dict]:
    index: dict[str, dict] = {}
    if not path.is_file():
        return index
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="|")
        for row in reader:
            record = {key: (value.strip() if isinstance(value, str) else value) for key, value in row.items()}
            keys = {
                (record.get("qid") or "").strip(),
                (record.get("slug") or "").strip().lower(),
                slugify(record.get("en_label") or record.get("name") or ""),
                (record.get("en_label") or "").strip().lower(),
            }
            for key in keys:
                if key:
                    index[key] = record
    return index


def _join_seed(csv_row: dict, psv_index: dict[str, dict]) -> dict | None:
    slug = (csv_row.get("slug") or slugify(csv_row.get("name") or "")).lower()
    name = (csv_row.get("name") or "").strip().lower()
    qid = (csv_row.get("qid") or "").strip()
    for key in (qid, slug, name, slugify(csv_row.get("name") or "")):
        if key and key in psv_index:
            return psv_index[key]
    return None


def _iso_from_parts(year: str | None, month: str | None, day: str | None) -> str:
    if not (year and month and day):
        return ""
    try:
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    except ValueError:
        return ""


def _merge_seed_records(*records: dict | None) -> dict | None:
    """Later records win for non-empty values so the 5-column PSV keeps birth parts."""
    merged: dict[str, Any] = {}
    for record in records:
        if not record:
            continue
        for key, value in record.items():
            if value in (None, ""):
                continue
            merged[key] = value
    if not merged:
        return None
    constructed = _iso_from_parts(
        merged.get("birth_year"), merged.get("birth_month"), merged.get("birth_day")
    )
    if constructed:
        merged["p569"] = constructed
        merged.setdefault("p569_precision", "11")
    return merged


def load_wikidata_overlay(path: Path | None) -> dict[str, dict]:
    """Index ``wikidata_people.jsonl`` (from ``pipeline.wikidata``) for seed joins."""
    index: dict[str, dict] = {}
    if path is None or not path.is_file():
        return index
    for row in load_jsonl(path):
        occupations = row.get("occupations") or row.get("p106") or []
        if isinstance(occupations, str):
            occupation_value = occupations
        else:
            occupation_value = ";".join(str(item) for item in occupations if item)
        spouses = row.get("spouse_qids") or row.get("p26") or []
        if isinstance(spouses, str):
            spouse_value = spouses
        else:
            spouse_value = ";".join(str(item) for item in spouses if item)
        record = {
            "qid": (row.get("qid") or "").strip(),
            "en_label": row.get("label") or row.get("en_label") or "",
            "en_description": row.get("description") or row.get("en_description") or "",
            "p569": row.get("birth_date") or row.get("p569") or "",
            "p569_precision": str(row.get("precision") or row.get("p569_precision") or "11"),
            "p26": spouse_value,
            "p106": occupation_value,
            "p18": row.get("image") or row.get("p18") or "",
            "enwiki_title": row.get("enwiki_title") or row.get("lookup_title") or "",
        }
        keys = {
            record["qid"],
            (record["enwiki_title"] or "").replace(" ", "_").lower(),
            (record["enwiki_title"] or "").replace("_", " ").strip().lower(),
            slugify(record["en_label"]),
            (record["en_label"] or "").strip().lower(),
            slugify(row.get("lookup_title") or ""),
            (row.get("lookup_title") or "").strip().lower(),
        }
        for key in keys:
            if key:
                index[key] = record
    return index


def write_wikidata_overlay(
    entities: dict[str, dict],
    lookup_titles: list[str],
    out_path: Path,
) -> list[str]:
    """Write seed-join JSONL from wbgetentities results. Returns unmatched titles."""

    def normalize(title: str) -> str:
        return title.replace("_", " ").strip().lower()

    by_sitelink: dict[str, dict] = {}
    for entity in entities.values():
        if not entity or entity.get("missing") is not None:
            continue
        sitelink = ((entity.get("sitelinks") or {}).get("enwiki") or {}).get("title") or ""
        if sitelink:
            by_sitelink[normalize(sitelink)] = entity

    unmatched: list[str] = []
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for title in lookup_titles:
            entity = by_sitelink.get(normalize(title))
            if entity is None:
                unmatched.append(title)
                continue
            extracted = extract_person(entity)
            labels = entity.get("labels") or {}
            descriptions = entity.get("descriptions") or {}
            sitelinks = entity.get("sitelinks") or {}
            row: dict[str, Any] = {
                "qid": entity.get("id"),
                "lookup_title": title,
                "label": (labels.get("en") or {}).get("value"),
                "description": (descriptions.get("en") or {}).get("value"),
                "enwiki_title": (sitelinks.get("enwiki") or {}).get("title") or title,
            }
            if extracted:
                row.update(
                    {
                        "birth_date": extracted["birth_date"],
                        "precision": extracted["precision"],
                        "spouse_qids": extracted.get("spouse_qids") or [],
                        "occupations": extracted.get("occupations") or [],
                        "image": extracted.get("image"),
                    }
                )
            else:
                precision = None
                times = ((entity.get("claims") or {}).get("P569") or [{}])
                try:
                    precision = times[0]["mainsnak"]["datavalue"]["value"]["precision"]
                except (KeyError, IndexError, TypeError):
                    precision = None
                if precision is not None:
                    row["precision"] = precision
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return unmatched


def titles_from_seed(csv_path: Path, psv_path: Path) -> list[str]:
    """enwiki titles for the seed drop: PSV name/title, else CSV name."""
    titles: list[str] = []
    seen: set[str] = set()
    psv_index = _index_psv(psv_path)
    with csv_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        validate_seed_csv_columns(reader.fieldnames)
        for csv_row in reader:
            joined = _join_seed(csv_row, psv_index) or {}
            title = (
                joined.get("enwiki_title")
                or joined.get("name")
                or csv_row.get("name")
                or ""
            ).strip()
            if title and title not in seen:
                seen.add(title)
                titles.append(title)
    return titles


def _person_record(
    *,
    qid: str,
    name: str,
    slug: str,
    birth_date: str,
    views: int,
    occupations: list[str],
    spouse_qids: list[str],
    image: str | None,
    source_text: str,
    source_url: str,
) -> dict[str, Any]:
    return {
        "qid": qid,
        "name": name,
        "slug": slug,
        "birth_date": birth_date,
        "card": birth_card_from_iso(birth_date),
        "views": int(views),
        "occupations": occupations,
        "spouse_qids": spouse_qids,
        "image": image,
        "source_text": source_text,
        "source_url": source_url,
    }


def _write_outputs(
    people: list[dict],
    excluded: list[dict],
    out_jsonl: Path,
    exclusion_report: Path,
    warnings: list[dict] | None = None,
) -> dict[str, Any]:
    validate_people(people)
    out_jsonl.parent.mkdir(parents=True, exist_ok=True)
    with out_jsonl.open("w", encoding="utf-8") as handle:
        for row in people:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    by_reason: dict[str, int] = {}
    for item in excluded:
        by_reason[item["reason"]] = by_reason.get(item["reason"], 0) + 1
    report = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "kept": len(people),
        "excluded_count": len(excluded),
        "by_reason": by_reason,
        "excluded": excluded,
        "warnings": warnings or [],
    }
    exclusion_report.parent.mkdir(parents=True, exist_ok=True)
    exclusion_report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "kept": len(people),
        "excluded": len(excluded),
        "by_reason": by_reason,
        "warnings": len(warnings or []),
    }


def build_from_seed(
    *,
    csv_path: Path,
    psv_path: Path,
    out_jsonl: Path,
    exclusion_report: Path,
    today: date | None = None,
    blocklist_path: Path | None = None,
    summaries: dict[str, dict] | None = None,
    image_licenses: dict[str, str] | None = None,
    extra_psv_index: dict[str, dict] | None = None,
) -> dict[str, Any]:
    today = today or date.today()
    blocklist = load_blocklist(blocklist_path or DEFAULT_BLOCKLIST)
    psv_index = _index_psv(psv_path)
    extra_psv_index = extra_psv_index or {}
    summaries = summaries or {}
    image_licenses = image_licenses or {}

    people: list[dict] = []
    excluded: list[dict] = []
    warnings: list[dict] = []

    with csv_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        validate_seed_csv_columns(reader.fieldnames)
        for csv_row in reader:
            name = (csv_row.get("name") or "").strip()
            slug = (csv_row.get("slug") or slugify(name)).strip()
            joined = _merge_seed_records(
                _join_seed(csv_row, extra_psv_index),
                _join_seed(csv_row, psv_index),
            )
            if joined is None:
                excluded.append(
                    {
                        "qid": csv_row.get("qid") or "",
                        "name": name,
                        "reason": ExclusionReason.MISSING_QID.value,
                    }
                )
                continue

            qid = (joined.get("qid") or csv_row.get("qid") or "").strip()
            birth_date = (joined.get("p569") or csv_row.get("birth_date") or "").strip()
            precision_raw = joined.get("p569_precision") or "11"
            try:
                precision = int(precision_raw)
            except ValueError:
                precision = 0
            wiki_desc = None
            source_text = ""
            source_url = ""
            if qid in summaries:
                wiki_desc = summaries[qid].get("description")
                source_text = summaries[qid].get("source_text") or ""
                source_url = summaries[qid].get("source_url") or ""
            description = joined.get("en_description") or ""
            candidate = {
                "qid": qid,
                "name": name,
                "slug": slug,
                "birth_date": birth_date,
                "birth_year": int(birth_date[:4]) if birth_date[:4].isdigit() else None,
                "precision": precision,
                "description": description,
                "wikipedia_description": wiki_desc or description,
            }
            reason = classify_person(candidate, today=today, blocklist=blocklist)
            if reason is not None:
                excluded.append({"qid": qid, "name": name, "reason": reason.value})
                continue
            if not qid:
                excluded.append({"qid": "", "name": name, "reason": ExclusionReason.MISSING_QID.value})
                continue

            filename = (joined.get("p18") or "").strip()
            image = None
            if filename:
                license_name = image_licenses.get(filename, "")
                if is_allowed_commons_license(license_name):
                    image = commons_image_url(filename)

            if not source_url:
                title = (joined.get("enwiki_title") or name).replace(" ", "_")
                source_url = f"https://en.wikipedia.org/wiki/{quote(title)}"
            if not source_text:
                source_text = description
            if not source_text or not source_url:
                excluded.append(
                    {"qid": qid, "name": name, "reason": ExclusionReason.MISSING_SOURCE.value}
                )
                continue

            views_raw = csv_row.get("enwiki_views_8mo") or csv_row.get("views") or 0
            person = _person_record(
                qid=qid,
                name=name or joined.get("en_label") or qid,
                slug=slug,
                birth_date=birth_date,
                views=int(views_raw or 0),
                occupations=_split_ids(joined.get("p106")),
                spouse_qids=_split_ids(joined.get("p26")),
                image=image,
                source_text=source_text,
                source_url=source_url,
            )
            seed_card = (csv_row.get("birth_card") or "").strip()
            if seed_card and seed_card != person["card"]:
                warnings.append(
                    {
                        "qid": qid,
                        "name": person["name"],
                        "seed_birth_card": seed_card,
                        "computed_card": person["card"],
                        "reason": "birth_card_mismatch",
                    }
                )
            people.append(person)

    people.sort(key=lambda row: (-row["views"], row["slug"]))
    return _write_outputs(people, excluded, out_jsonl, exclusion_report, warnings=warnings)


def build_from_caches(
    *,
    pageviews_jsonl: Path,
    wikidata_cache: Path,
    summaries_jsonl: Path | None,
    out_jsonl: Path,
    exclusion_report: Path,
    today: date | None = None,
    blocklist_path: Path | None = None,
    commons_cache: Path | None = None,
) -> dict[str, Any]:
    today = today or date.today()
    blocklist = load_blocklist(blocklist_path or DEFAULT_BLOCKLIST)
    views_by_title = {
        row["title"].replace(" ", "_"): int(row.get("views") or 0) for row in load_jsonl(pageviews_jsonl)
    }
    summaries_by_qid: dict[str, dict] = {}
    summaries_by_title: dict[str, dict] = {}
    if summaries_jsonl and summaries_jsonl.is_file():
        for row in load_jsonl(summaries_jsonl):
            if row.get("qid"):
                summaries_by_qid[row["qid"]] = row
            if row.get("title"):
                summaries_by_title[str(row["title"]).replace(" ", "_")] = row

    people: list[dict] = []
    excluded: list[dict] = []
    for path in sorted(wikidata_cache.glob("Q*.json")):
        entity = load_cached_entity(wikidata_cache, path.stem)
        extracted = extract_person(entity)
        if extracted is None:
            precision = None
            times = ((entity.get("claims") or {}).get("P569") or [{}])
            try:
                precision = times[0]["mainsnak"]["datavalue"]["value"]["precision"]
            except (KeyError, IndexError, TypeError):
                precision = None
            reason = (
                ExclusionReason.PRECISION
                if precision is not None and int(precision) < 11
                else ExclusionReason.MISSING_BIRTH
            )
            excluded.append({"qid": entity.get("id") or path.stem, "name": "", "reason": reason.value})
            continue

        title = (extracted.get("enwiki_title") or "").replace(" ", "_")
        summary = summaries_by_qid.get(extracted["qid"]) or summaries_by_title.get(title) or {}
        candidate = {
            "qid": extracted["qid"],
            "name": extracted.get("label") or "",
            "slug": slugify(extracted.get("label") or extracted["qid"]),
            "birth_date": extracted["birth_date"],
            "birth_year": int(extracted["birth_date"][:4]),
            "precision": extracted["precision"],
            "description": extracted.get("description") or "",
            "wikipedia_description": summary.get("description") or extracted.get("description") or "",
        }
        reason = classify_person(candidate, today=today, blocklist=blocklist)
        if reason is not None:
            excluded.append(
                {"qid": extracted["qid"], "name": candidate["name"], "reason": reason.value}
            )
            continue

        image = None
        filename = extracted.get("image")
        if filename:
            license_name = fetch_commons_license(filename, cache_dir=commons_cache)
            if is_allowed_commons_license(license_name):
                image = commons_image_url(filename)

        source_text = (summary.get("source_text") or "").strip()
        source_url = summary.get("source_url") or (
            f"https://en.wikipedia.org/wiki/{quote(title)}" if title else ""
        )
        if not source_text or not source_url:
            excluded.append(
                {
                    "qid": extracted["qid"],
                    "name": candidate["name"],
                    "reason": ExclusionReason.MISSING_SOURCE.value,
                }
            )
            continue

        occupation_labels: list[str] = []
        for occ_qid in extracted.get("occupations") or []:
            occ_path = wikidata_cache / f"{occ_qid}.json"
            if occ_path.is_file():
                occ = json.loads(occ_path.read_text(encoding="utf-8"))
                label = ((occ.get("labels") or {}).get("en") or {}).get("value")
                occupation_labels.append(label or occ_qid)
            else:
                occupation_labels.append(occ_qid)

        people.append(
            _person_record(
                qid=extracted["qid"],
                name=candidate["name"] or extracted["qid"],
                slug=candidate["slug"],
                birth_date=extracted["birth_date"],
                views=views_by_title.get(title, 0),
                occupations=occupation_labels,
                spouse_qids=extracted.get("spouse_qids") or [],
                image=image,
                source_text=source_text,
                source_url=source_url,
            )
        )

    people.sort(key=lambda row: (-row["views"], row["slug"]))
    return _write_outputs(people, excluded, out_jsonl, exclusion_report)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build people.jsonl for celebrity birth-card SEO.")
    parser.add_argument(
        "--from-seed",
        action="store_true",
        help="Rebuild from seed CSV columns name,birth_date,birth_card,enwiki_views_8mo,slug.",
    )
    parser.add_argument("--csv", type=Path, default=None)
    parser.add_argument("--psv", type=Path, default=None)
    parser.add_argument("--pageviews", type=Path, default=Path("pipeline/data/cache/pageviews.jsonl"))
    parser.add_argument("--wikidata-cache", type=Path, default=Path("pipeline/data/cache/wikidata"))
    parser.add_argument("--summaries", type=Path, default=Path("pipeline/data/cache/summaries.jsonl"))
    parser.add_argument(
        "--wikidata-people",
        type=Path,
        default=Path("pipeline/data/cache/wikidata_people.jsonl"),
        help="JSONL from pipeline.wikidata; used to attach Q-ids when the seed PSV is name|birth|views.",
    )
    parser.add_argument("--months", type=int, default=8, help="Used with --fetch to pull N months of tops.")
    parser.add_argument(
        "--fetch",
        action="store_true",
        help="Hit public APIs. With --from-seed: wbgetentities + enwiki REST summaries (no Vertex).",
    )
    parser.add_argument("--out", type=Path, default=Path("pipeline/data/people.jsonl"))
    parser.add_argument("--exclusion-report", type=Path, default=Path("pipeline/data/exclusions.json"))
    parser.add_argument("--blocklist", type=Path, default=DEFAULT_BLOCKLIST)
    args = parser.parse_args(argv)

    if args.from_seed:
        csv_path = require_seed_csv(args.csv)
        psv_path = require_seed_psv(args.psv)
        if args.fetch:
            titles = titles_from_seed(csv_path, psv_path)
            entities = fetch_titles(titles, args.wikidata_cache)
            unmatched = write_wikidata_overlay(entities, titles, args.wikidata_people)
            if unmatched:
                fail_path = args.wikidata_people.with_suffix(".unmatched.json")
                fail_path.write_text(json.dumps(unmatched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"wikidata unmatched {len(unmatched)} titles → {fail_path}")
            overlay_rows = load_jsonl(args.wikidata_people) if args.wikidata_people.is_file() else []
            args.summaries.parent.mkdir(parents=True, exist_ok=True)
            summary_failures: list[dict[str, str]] = []
            with args.summaries.open("w", encoding="utf-8") as handle:
                for row in overlay_rows:
                    title = row.get("enwiki_title") or row.get("lookup_title")
                    if not title:
                        continue
                    try:
                        summary = fetch_summary(title, cache_dir=Path("pipeline/data/cache/summaries"))
                    except Exception as exc:  # noqa: BLE001 — per-title fetch must not abort the drop
                        summary_failures.append(
                            {"qid": row.get("qid") or "", "title": title, "error": str(exc)}
                        )
                        continue
                    summary["qid"] = row.get("qid")
                    handle.write(json.dumps(summary, ensure_ascii=False) + "\n")
            if summary_failures:
                fail_path = args.summaries.with_suffix(".failures.json")
                fail_path.write_text(
                    json.dumps(summary_failures, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                print(f"summary failures {len(summary_failures)} → {fail_path}")
        result = build_from_seed(
            csv_path=csv_path,
            psv_path=psv_path,
            out_jsonl=args.out,
            exclusion_report=args.exclusion_report,
            blocklist_path=args.blocklist,
            summaries=load_summaries_jsonl(args.summaries),
            extra_psv_index=load_wikidata_overlay(args.wikidata_people),
        )
    else:
        if args.fetch:
            cache_pv = Path("pipeline/data/cache/pageviews")
            rows = collect_pageviews(args.months, cache_dir=cache_pv)
            args.pageviews.parent.mkdir(parents=True, exist_ok=True)
            with args.pageviews.open("w", encoding="utf-8") as handle:
                for row in rows:
                    handle.write(json.dumps(row, ensure_ascii=False) + "\n")
            fetch_titles([row["title"] for row in rows], args.wikidata_cache)
            args.summaries.parent.mkdir(parents=True, exist_ok=True)
            with args.summaries.open("w", encoding="utf-8") as handle:
                for path in sorted(args.wikidata_cache.glob("Q*.json")):
                    entity = json.loads(path.read_text(encoding="utf-8"))
                    title = ((entity.get("sitelinks") or {}).get("enwiki") or {}).get("title")
                    if not title:
                        continue
                    summary = fetch_summary(title, cache_dir=Path("pipeline/data/cache/summaries"))
                    summary["qid"] = entity.get("id")
                    handle.write(json.dumps(summary, ensure_ascii=False) + "\n")
        if not args.pageviews.is_file() or not args.wikidata_cache.is_dir():
            raise SystemExit(
                "missing pageviews/wikidata cache; run pageviews → wikidata first "
                "or pass --from-seed (see pipeline/README.md)"
            )
        result = build_from_caches(
            pageviews_jsonl=args.pageviews,
            wikidata_cache=args.wikidata_cache,
            summaries_jsonl=args.summaries if args.summaries.is_file() else None,
            out_jsonl=args.out,
            exclusion_report=args.exclusion_report,
            blocklist_path=args.blocklist,
            commons_cache=Path("pipeline/data/cache/commons"),
        )

    print(f"kept {result['kept']}  excluded {result['excluded']}  → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
