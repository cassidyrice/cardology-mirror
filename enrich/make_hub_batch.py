"""Build Vertex JSONL from hub people packs. Does not submit a job or invent bios."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from enrich.estimate import estimate_batch
from enrich.make_batch import (
    DEFAULT_MEANINGS,
    load_jsonl,
    write_batch,
)
from enrich.make_retry_batch import load_retry_qids

ROOT = Path(__file__).resolve().parent.parent
DAY_PRECISION = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _repo_rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path)

# People hubs with Wikipedia source_text. Date-only hubs are never included.
HUB_PEOPLE_PACKS: dict[str, Path] = {
    "presidents": ROOT / "pipeline" / "data" / "presidents" / "people.jsonl",
    "governors": ROOT / "pipeline" / "data" / "governors" / "people.jsonl",
    "scotus": ROOT / "pipeline" / "data" / "scotus" / "people.jsonl",
    "nobel": ROOT / "pipeline" / "data" / "nobel" / "people.jsonl",
    "signers": ROOT / "pipeline" / "data" / "signers" / "people.jsonl",
}

# Inventory only — not Vertex people enrich.
DATE_ONLY_HUBS: dict[str, Path] = {
    "holidays": ROOT / "seo-pages" / "data" / "holidays.jsonl",
    "parks": ROOT / "seo-pages" / "data" / "parks.jsonl",
    "mlb": ROOT / "pipeline" / "data" / "mlb.jsonl",
    "nfl_franchises": ROOT / "pipeline" / "data" / "franchises.jsonl",
    "states": ROOT / "seo-pages" / "data" / "states.jsonl",
}

# People pack merged after the approved 1079 inventory. Counted, not submitted.
OPTIONAL_PEOPLE_PACKS: dict[str, Path] = {
    "cabinet": ROOT / "pipeline" / "data" / "cabinet" / "people.jsonl",
}

DEFAULT_ENRICHED = ROOT / "pipeline" / "data" / "people_enriched.jsonl"
DEFAULT_RETRY = ROOT / "enrich" / "artifacts" / "retry.jsonl"
DEFAULT_PEOPLE_OUT = ROOT / "enrich" / "artifacts" / "hub_people.jsonl"
DEFAULT_BATCH_OUT = ROOT / "enrich" / "artifacts" / "vertex_hub_batch.jsonl"
DEFAULT_INVENTORY = ROOT / "enrich" / "artifacts" / "hub_inventory.json"
DEFAULT_ESTIMATE = ROOT / "enrich" / "artifacts" / "hub_pack_estimate.json"
ALREADY_SUBMITTED_JOB = "5794641920097517568"
THIS_JOB_USD_BAND = 20.0


def is_day_precision(birth_date: str) -> bool:
    return bool(DAY_PRECISION.match((birth_date or "").strip()))


def row_is_ready(row: dict[str, Any]) -> bool:
    qid = str(row.get("qid") or "").strip()
    source_text = (row.get("source_text") or "").strip()
    card = str(row.get("card") or "").strip()
    return bool(qid and card and source_text and is_day_precision(str(row.get("birth_date") or "")))


def load_qid_set(path: Path, *, field: str = "qid") -> set[str]:
    if not path.is_file():
        return set()
    return {
        str(row.get(field) or "").strip()
        for row in load_jsonl(path)
        if str(row.get(field) or "").strip()
    }


def count_jsonl(path: Path) -> int:
    if not path.is_file():
        return 0
    return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())


def collect_hub_people(
    *,
    pack_paths: dict[str, Path],
    exclude_qids: set[str],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    by_pack_total: dict[str, int] = {}
    by_pack_ready: dict[str, int] = {}
    by_pack_new: dict[str, int] = {}
    skipped_no_source = 0
    skipped_not_day = 0
    skipped_excluded = 0
    seen: dict[str, str] = {}
    people: list[dict[str, Any]] = []
    for pack, path in pack_paths.items():
        rows = load_jsonl(path) if path.is_file() else []
        by_pack_total[pack] = len(rows)
        ready = 0
        new = 0
        for row in rows:
            if not is_day_precision(str(row.get("birth_date") or "")):
                skipped_not_day += 1
                continue
            if not (row.get("source_text") or "").strip() or not row.get("card") or not row.get("qid"):
                skipped_no_source += 1
                continue
            if not row_is_ready(row):
                skipped_no_source += 1
                continue
            ready += 1
            qid = str(row["qid"]).strip()
            if qid in exclude_qids:
                skipped_excluded += 1
                continue
            if qid in seen:
                continue
            seen[qid] = pack
            people.append(row)
            new += 1
        by_pack_ready[pack] = ready
        by_pack_new[pack] = new
    stats = {
        "by_pack_total": by_pack_total,
        "by_pack_ready": by_pack_ready,
        "by_pack_new": by_pack_new,
        "union_new": len(people),
        "skipped_not_day": skipped_not_day,
        "skipped_no_source_or_card": skipped_no_source,
        "skipped_excluded": skipped_excluded,
        "cross_pack_qid_owners": seen,
    }
    return people, stats


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def write_hub_batch(
    *,
    meanings_path: Path,
    enriched_path: Path,
    retry_path: Path,
    people_out: Path,
    batch_out: Path,
    inventory_out: Path,
    estimate_out: Path,
    pack_paths: dict[str, Path] | None = None,
    extra_exclude_qids: set[str] | None = None,
    target_usd_band: float = THIS_JOB_USD_BAND,
) -> dict[str, Any]:
    packs = pack_paths if pack_paths is not None else HUB_PEOPLE_PACKS
    enriched = load_qid_set(enriched_path)
    already_submitted = set(load_retry_qids(retry_path)) if retry_path.is_file() else set()
    exclude = set(enriched) | set(already_submitted) | set(extra_exclude_qids or ())
    people, pack_stats = collect_hub_people(pack_paths=packs, exclude_qids=exclude)
    write_jsonl(people_out, people)
    written = write_batch(
        people_path=people_out,
        meanings_path=meanings_path,
        out_path=batch_out,
    )
    estimate = estimate_batch(
        batch_out,
        target_usd_band=target_usd_band,
    )
    estimate["label"] = "hub people packs — #70 contract (near-verbatim, meta≤145, temp 0, thinking LOW)"
    estimate["notes"] = (
        "Same #70 pricing method (near-verbatim, meta≤145, temp 0, thinking LOW; "
        "HIGH upper uses 2500 thought tokens/row). "
        "This job band is $20 (HIGH-upper held at ~$17.02 for 1079). "
        "Does not include the 1040 already in people_enriched or the 18 on job "
        f"{ALREADY_SUBMITTED_JOB}."
    )
    estimate["by_pack_new_ready"] = pack_stats["by_pack_new"]
    estimate_out.parent.mkdir(parents=True, exist_ok=True)
    estimate_out.write_text(json.dumps(estimate, indent=2) + "\n", encoding="utf-8")

    cabinet_people, cabinet_stats = collect_hub_people(
        pack_paths=OPTIONAL_PEOPLE_PACKS,
        exclude_qids=exclude | {str(row.get("qid") or "") for row in people},
    )
    inventory = {
        "people_enriched": len(enriched),
        "already_submitted_job": ALREADY_SUBMITTED_JOB,
        "already_submitted_qids": len(already_submitted),
        "submit_qids": written["requests"],
        "union_new": pack_stats["union_new"],
        "by_pack_total": pack_stats["by_pack_total"],
        "by_pack_ready": pack_stats["by_pack_ready"],
        "by_pack_new": pack_stats["by_pack_new"],
        "excluded_from_submit": {
            "already_enriched": len(enriched),
            "already_submitted_remainder_18": len(already_submitted),
            "date_only_hubs": {
                name: count_jsonl(path) for name, path in DATE_ONLY_HUBS.items()
            },
            "cabinet_new_held": cabinet_stats["by_pack_new"].get("cabinet", 0),
            "cabinet_reason": (
                "Cabinet is a people pack with source_text, but it was not in the "
                "approved 1079 HIGH-upper ~$17.02 inventory. Not submitted this job."
            ),
        },
        "included_packs": list(packs),
        "skipped_not_day": pack_stats["skipped_not_day"],
        "skipped_no_source_or_card": pack_stats["skipped_no_source_or_card"],
        "people_out": _repo_rel(people_out),
        "batch_out": _repo_rel(batch_out),
        "within_target": estimate["within_target"],
        "usd_batch_with_thinking_upper": estimate["usd_batch_with_thinking_upper"],
        "target_usd_band": target_usd_band,
        "cabinet_new_not_submitted": [str(row["qid"]) for row in cabinet_people],
    }
    inventory_out.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    return {
        "requests": written["requests"],
        "people": len(people),
        "estimate": estimate,
        "inventory": inventory,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Write Vertex JSONL from hub people packs. Does not submit."
    )
    parser.add_argument("--meanings", type=Path, default=DEFAULT_MEANINGS)
    parser.add_argument("--enriched", type=Path, default=DEFAULT_ENRICHED)
    parser.add_argument("--retry", type=Path, default=DEFAULT_RETRY)
    parser.add_argument("--people-out", type=Path, default=DEFAULT_PEOPLE_OUT)
    parser.add_argument("--out", type=Path, default=DEFAULT_BATCH_OUT)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--estimate", type=Path, default=DEFAULT_ESTIMATE)
    parser.add_argument("--target-usd", type=float, default=THIS_JOB_USD_BAND)
    args = parser.parse_args(argv)
    result = write_hub_batch(
        meanings_path=args.meanings,
        enriched_path=args.enriched,
        retry_path=args.retry,
        people_out=args.people_out,
        batch_out=args.out,
        inventory_out=args.inventory,
        estimate_out=args.estimate,
        target_usd_band=args.target_usd,
    )
    est = result["estimate"]
    print(
        f"wrote {result['requests']} hub people Vertex requests → {args.out}"
    )
    print(
        f"HIGH-upper ${est['usd_batch_with_thinking_upper']:.2f} / "
        f"LOW ${est['usd_batch_thinking_low']:.2f} / "
        f"band ${est['target_usd_band']:.2f} "
        f"within_target={est['within_target']}"
    )
    print("No batch job was submitted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
