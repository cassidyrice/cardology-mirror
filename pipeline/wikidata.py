"""Wikidata REST wbgetentities (batches of 50). No SPARQL."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

from pipeline.http import fetch_json

WBGETENTITIES = "https://www.wikidata.org/w/api.php"
BATCH_SIZE = 50
_TIME_RE = re.compile(r"^([+-]?)(\d{4})-(\d{2})-(\d{2})")


def batch_ids(ids: Iterable[str], size: int = BATCH_SIZE) -> list[list[str]]:
    values = [item for item in ids if item]
    return [values[index : index + size] for index in range(0, len(values), size)]


def _claim_snaks(entity: dict, prop: str) -> list[dict]:
    out: list[dict] = []
    for claim in entity.get("claims", {}).get(prop, []) or []:
        snak = claim.get("mainsnak") or {}
        if snak.get("snaktype") != "value":
            continue
        value = snak.get("datavalue")
        if value:
            out.append(value)
    return out


def _entity_ids(entity: dict, prop: str) -> list[str]:
    ids: list[str] = []
    for value in _claim_snaks(entity, prop):
        raw = value.get("value")
        if isinstance(raw, dict) and raw.get("id"):
            ids.append(str(raw["id"]))
    return ids


def _parse_time(value: dict) -> tuple[str, int] | None:
    time = str(value.get("time") or "")
    match = _TIME_RE.match(time)
    if not match:
        return None
    sign, year, month, day = match.groups()
    if sign == "-":
        return None
    precision = int(value.get("precision") or 0)
    return f"{year}-{month}-{day}", precision


def extract_person(entity: dict) -> dict | None:
    if not entity or entity.get("missing") is not None:
        return None
    times = _claim_snaks(entity, "P569")
    if not times:
        return None
    parsed = _parse_time(times[0].get("value") or {})
    if parsed is None:
        return None
    birth_date, precision = parsed
    if precision < 11:
        return None

    labels = entity.get("labels") or {}
    descriptions = entity.get("descriptions") or {}
    sitelinks = entity.get("sitelinks") or {}
    enwiki = sitelinks.get("enwiki") or {}
    image_values = _claim_snaks(entity, "P18")
    image = None
    if image_values:
        raw = image_values[0].get("value")
        if isinstance(raw, str) and raw:
            image = raw.replace(" ", "_")

    return {
        "qid": entity.get("id"),
        "label": (labels.get("en") or {}).get("value"),
        "description": (descriptions.get("en") or {}).get("value"),
        "birth_date": birth_date,
        "precision": precision,
        "spouse_qids": _entity_ids(entity, "P26"),
        "partner_qids": _entity_ids(entity, "P451"),
        "occupations": _entity_ids(entity, "P106"),
        "image": image,
        "enwiki_title": enwiki.get("title"),
    }


def load_cached_entity(cache_dir: Path, qid: str) -> dict:
    path = cache_dir / f"{qid}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _entities_url(ids: list[str]) -> str:
    joined = "|".join(ids)
    return (
        f"{WBGETENTITIES}?action=wbgetentities&ids={quote(joined, safe='|')}"
        "&props=labels|descriptions|claims|sitelinks&languages=en&format=json"
    )


def _titles_url(titles: list[str]) -> str:
    joined = "|".join(title.replace(" ", "_") for title in titles)
    return (
        f"{WBGETENTITIES}?action=wbgetentities&sites=enwiki"
        f"&titles={quote(joined, safe='_|')}"
        "&props=labels|descriptions|claims|sitelinks&languages=en&format=json"
    )


def _write_entity_cache(cache_dir: Path, entities: dict[str, dict]) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    for qid, entity in entities.items():
        if not qid or qid == "-1" or entity.get("missing") is not None:
            continue
        path = cache_dir / f"{qid}.json"
        path.write_text(json.dumps(entity, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fetch_entities(ids: Iterable[str], cache_dir: Path) -> dict[str, dict]:
    found: dict[str, dict] = {}
    missing: list[str] = []
    for qid in ids:
        path = cache_dir / f"{qid}.json"
        if path.is_file():
            found[qid] = json.loads(path.read_text(encoding="utf-8"))
        else:
            missing.append(qid)
    for batch in batch_ids(missing):
        payload = fetch_json(_entities_url(batch))
        entities = payload.get("entities") or {}
        _write_entity_cache(cache_dir, entities)
        found.update(entities)
    return found


def fetch_titles(titles: Iterable[str], cache_dir: Path) -> dict[str, dict]:
    found: dict[str, dict] = {}
    for batch in batch_ids(titles):
        payload = fetch_json(_titles_url(batch), cache_path=None)
        entities = payload.get("entities") or {}
        _write_entity_cache(cache_dir, entities)
        found.update(entities)
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Resolve enwiki titles via wbgetentities (no SPARQL)."
    )
    parser.add_argument("--titles", type=Path, help="JSONL with a title field (from pageviews).")
    parser.add_argument("--ids", type=Path, help="Text file of Q-ids, one per line.")
    parser.add_argument("--cache", type=Path, default=Path("pipeline/data/cache/wikidata"))
    parser.add_argument("--out", type=Path, default=Path("pipeline/data/cache/wikidata_people.jsonl"))
    args = parser.parse_args(argv)

    if args.titles:
        titles = [
            json.loads(line)["title"]
            for line in args.titles.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        entities = fetch_titles(titles, args.cache)
    elif args.ids:
        ids = [line.strip() for line in args.ids.read_text(encoding="utf-8").splitlines() if line.strip()]
        entities = fetch_entities(ids, args.cache)
    else:
        parser.error("provide --titles or --ids")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    kept = 0
    with args.out.open("w", encoding="utf-8") as handle:
        for entity in entities.values():
            person = extract_person(entity)
            if person is None:
                continue
            handle.write(json.dumps(person, ensure_ascii=False) + "\n")
            kept += 1
    print(f"wrote {kept} people to {args.out} (raw JSON cached in {args.cache})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
