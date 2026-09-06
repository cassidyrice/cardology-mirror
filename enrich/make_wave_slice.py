"""Build a hub-sized Vertex slice from wave people still missing enrich.

Does not submit a job, invent bios, or start the next slice.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from enrich.estimate import estimate_batch
from enrich.make_batch import DEFAULT_MEANINGS, load_jsonl, write_batch

ROOT = Path(__file__).resolve().parent.parent
DAY_PRECISION = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Wave SEO people packs. Governors are already hub-enriched (0 missing).
# Largest-hole order is computed live; this dict is inventory only.
WAVE_PEOPLE_PACKS: dict[str, Path] = {
    "senators": ROOT / "pipeline" / "data" / "senators" / "people.jsonl",
    "cabinet": ROOT / "pipeline" / "data" / "cabinet" / "people.jsonl",
    "olympics_summer": ROOT / "pipeline" / "data" / "olympics" / "people.jsonl",
    "olympics_winter": ROOT / "pipeline" / "data" / "olympics" / "winter" / "people.jsonl",
    "astronauts": ROOT / "pipeline" / "data" / "astronauts" / "people.jsonl",
    "oscars": ROOT / "pipeline" / "data" / "oscars" / "people.jsonl",
    "emmys": ROOT / "pipeline" / "data" / "emmys" / "people.jsonl",
    "tonys": ROOT / "pipeline" / "data" / "tonys" / "people.jsonl",
    "nfl_hof": ROOT / "pipeline" / "data" / "nfl_hof" / "people.jsonl",
    "grammys_aoty": ROOT / "pipeline" / "data" / "grammys" / "people.jsonl",
    "rock_hall": ROOT / "pipeline" / "data" / "rock_hall" / "people.jsonl",
    "pulitzer_fiction": ROOT / "pipeline" / "data" / "pulitzer_fiction" / "people.jsonl",
    "house_chairs": ROOT / "pipeline" / "data" / "house_chairs" / "people.jsonl",
    "kennedy_center_honors": ROOT / "pipeline" / "data" / "kennedy_center_honors" / "people.jsonl",
    "time_poty": ROOT / "pipeline" / "data" / "time_poty" / "people.jsonl",
}

# Slice-1 TPU CANCELLED empties — drop for now, do not resubmit.
SLICE2_DROP_QIDS: frozenset[str] = frozenset({"Q3133396", "Q228808"})

DEFAULT_ENRICHED = ROOT / "pipeline" / "data" / "people_enriched.jsonl"
DEFAULT_PEOPLE_OUT = ROOT / "enrich" / "artifacts" / "wave_slice2_people.jsonl"
DEFAULT_BATCH_OUT = ROOT / "enrich" / "artifacts" / "vertex_wave_slice2_batch.jsonl"
DEFAULT_INVENTORY = ROOT / "enrich" / "artifacts" / "wave_slice2_inventory.json"
DEFAULT_ESTIMATE = ROOT / "enrich" / "artifacts" / "wave_slice2_estimate.json"
DEFAULT_QIDS = ROOT / "enrich" / "artifacts" / "wave_slice2_qids.jsonl"
SLICE_LIMIT = 1079
THIS_JOB_USD_BAND = 20.0
SLICE_KIND = "wave_slice2"


def _repo_rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path)


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


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def inventory_missing(
    *,
    pack_paths: dict[str, Path],
    enriched: set[str],
    exclude: set[str] | None = None,
) -> dict[str, Any]:
    skip = set(exclude or ())
    by_pack: dict[str, dict[str, Any]] = {}
    unique_ready: dict[str, dict[str, Any]] = {}
    unique_missing: dict[str, dict[str, Any]] = {}
    dropped_no_source = 0
    dropped_excluded = 0
    for pack, path in pack_paths.items():
        rows = load_jsonl(path) if path.is_file() else []
        ready_rows: list[dict[str, Any]] = []
        missing_rows: list[dict[str, Any]] = []
        already = 0
        not_ready = 0
        excluded_here = 0
        for row in rows:
            if not row_is_ready(row):
                not_ready += 1
                if not (row.get("source_text") or "").strip():
                    dropped_no_source += 1
                continue
            qid = str(row["qid"]).strip()
            ready_rows.append(row)
            unique_ready.setdefault(qid, {"row": row, "packs": []})
            unique_ready[qid]["packs"].append(pack)
            if qid in enriched:
                already += 1
                continue
            if qid in skip:
                excluded_here += 1
                dropped_excluded += 1
                continue
            missing_rows.append(row)
            unique_missing.setdefault(qid, {"row": row, "packs": []})
            unique_missing[qid]["packs"].append(pack)
        by_pack[pack] = {
            "path": _repo_rel(path) if path.is_file() else None,
            "kept_pages": len(rows),
            "ready": len(ready_rows),
            "already_enriched": already,
            "missing": len(missing_rows),
            "excluded": excluded_here,
            "not_ready": not_ready,
        }
    return {
        "by_pack": by_pack,
        "unique_ready": unique_ready,
        "unique_missing": unique_missing,
        "dropped_no_source": dropped_no_source,
        "dropped_excluded": dropped_excluded,
        "exclude_qids": sorted(skip),
    }


def select_slice(
    *,
    pack_paths: dict[str, Path],
    enriched: set[str],
    limit: int,
    exclude: set[str] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    skip = set(exclude or ())
    counted = inventory_missing(pack_paths=pack_paths, enriched=enriched, exclude=skip)
    by_pack = counted["by_pack"]
    hole_order = sorted(
        by_pack.keys(),
        key=lambda name: (-int(by_pack[name]["missing"]), name),
    )
    selected: list[dict[str, Any]] = []
    seen: set[str] = set()
    by_pack_taken: dict[str, int] = {name: 0 for name in hole_order}
    first_owner: dict[str, str] = {}
    for pack in hole_order:
        path = pack_paths[pack]
        if not path.is_file():
            continue
        for row in load_jsonl(path):
            if len(selected) >= limit:
                break
            if not row_is_ready(row):
                continue
            qid = str(row["qid"]).strip()
            if qid in enriched or qid in skip or qid in seen:
                continue
            seen.add(qid)
            first_owner[qid] = pack
            by_pack_taken[pack] += 1
            selected.append(row)
        if len(selected) >= limit:
            break
    stats = {
        "hole_order": hole_order,
        "by_pack": by_pack,
        "by_pack_taken": by_pack_taken,
        "first_owner": first_owner,
        "unique_people_ready": len(counted["unique_ready"]),
        "unique_missing": len(counted["unique_missing"]),
        "dropped_no_source": counted["dropped_no_source"],
        "dropped_excluded": counted["dropped_excluded"],
        "exclude_qids": counted["exclude_qids"],
        "slice_limit": limit,
        "slice_rows": len(selected),
        "held_for_later_slices": max(0, len(counted["unique_missing"]) - len(selected)),
    }
    return selected, stats


def write_wave_slice(
    *,
    meanings_path: Path,
    enriched_path: Path,
    people_out: Path,
    batch_out: Path,
    inventory_out: Path,
    estimate_out: Path,
    qids_out: Path,
    pack_paths: dict[str, Path] | None = None,
    limit: int = SLICE_LIMIT,
    target_usd_band: float = THIS_JOB_USD_BAND,
    exclude: set[str] | None = None,
    kind: str = SLICE_KIND,
) -> dict[str, Any]:
    packs = pack_paths if pack_paths is not None else WAVE_PEOPLE_PACKS
    enriched = load_qid_set(enriched_path)
    skip = set(SLICE2_DROP_QIDS if exclude is None else exclude)
    people, stats = select_slice(
        pack_paths=packs,
        enriched=enriched,
        limit=limit,
        exclude=skip,
    )
    write_jsonl(people_out, people)
    write_jsonl(
        qids_out,
        [
            {
                "qid": str(row.get("qid") or ""),
                "name": row.get("name"),
                "card": row.get("card"),
                "pack": stats["first_owner"].get(str(row.get("qid") or "")),
            }
            for row in people
        ],
    )
    written = write_batch(
        people_path=people_out,
        meanings_path=meanings_path,
        out_path=batch_out,
    )
    estimate = estimate_batch(
        batch_out,
        target_usd_band=target_usd_band,
    )
    estimate["label"] = (
        f"{kind} — #70 / hub contract (near-verbatim, source_text "
        "containment, meta≤145, temp 0, thinking LOW)"
    )
    estimate["notes"] = (
        "Same #70 pricing method (near-verbatim, meta≤145, temp 0, thinking LOW; "
        "HIGH upper uses 2500 thought tokens/row). This job band is $20. "
        f"Slice {written['requests']} of {stats['unique_missing']} missing wave "
        "people after #102. Do not submit slice 3 unless asked."
    )
    estimate["by_pack_taken"] = stats["by_pack_taken"]
    estimate_out.parent.mkdir(parents=True, exist_ok=True)
    estimate_out.write_text(json.dumps(estimate, indent=2) + "\n", encoding="utf-8")

    high = float(estimate["usd_batch_with_thinking_upper"])
    stop = high > target_usd_band
    inventory = {
        "kind": kind,
        "job_submitted": False,
        "people_enriched": len(enriched),
        "unique_wave_ready": stats["unique_people_ready"],
        "unique_missing": stats["unique_missing"],
        "slice_limit": limit,
        "slice_rows": written["requests"],
        "held_for_later_slices": stats["held_for_later_slices"],
        "hole_order": stats["hole_order"],
        "by_pack": stats["by_pack"],
        "by_pack_taken": stats["by_pack_taken"],
        "dropped_no_source": stats["dropped_no_source"],
        "dropped_tpu_empties": stats["exclude_qids"],
        "dropped_excluded": stats["dropped_excluded"],
        "people_out": _repo_rel(people_out),
        "batch_out": _repo_rel(batch_out),
        "qids_out": _repo_rel(qids_out),
        "target_usd_band": target_usd_band,
        "usd_batch_thinking_low": estimate["usd_batch_thinking_low"],
        "usd_batch_with_thinking_upper": estimate["usd_batch_with_thinking_upper"],
        "within_target": estimate["within_target"],
        "stop_do_not_submit": stop,
        "stop_reason": (
            f"HIGH-upper ${high:.2f} exceeds this-job band ${target_usd_band:.2f}"
            if stop
            else None
        ),
        "contract": {
            "evidence": "near-verbatim source_text containment",
            "meta_description": "≤145 (hard 155)",
            "temperature": 0.0,
            "thinkingLevel": "LOW",
        },
        "do_not": [
            "submit remaining missing rows this job",
            "merge results",
            "deploy",
            "invent bios",
            "start slice 3 without asking",
            "resubmit slice-1 TPU empties",
        ],
    }
    inventory_out.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    return {
        "requests": written["requests"],
        "people": len(people),
        "estimate": estimate,
        "inventory": inventory,
        "stop": stop,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Write hub-sized wave Vertex JSONL. Does not submit."
    )
    parser.add_argument("--meanings", type=Path, default=DEFAULT_MEANINGS)
    parser.add_argument("--enriched", type=Path, default=DEFAULT_ENRICHED)
    parser.add_argument("--people-out", type=Path, default=DEFAULT_PEOPLE_OUT)
    parser.add_argument("--out", type=Path, default=DEFAULT_BATCH_OUT)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--estimate", type=Path, default=DEFAULT_ESTIMATE)
    parser.add_argument("--qids", type=Path, default=DEFAULT_QIDS)
    parser.add_argument("--limit", type=int, default=SLICE_LIMIT)
    parser.add_argument("--target-usd", type=float, default=THIS_JOB_USD_BAND)
    args = parser.parse_args(argv)
    result = write_wave_slice(
        meanings_path=args.meanings,
        enriched_path=args.enriched,
        people_out=args.people_out,
        batch_out=args.out,
        inventory_out=args.inventory,
        estimate_out=args.estimate,
        qids_out=args.qids,
        limit=args.limit,
        target_usd_band=args.target_usd,
    )
    est = result["estimate"]
    print(f"wrote {result['requests']} wave-slice-2 Vertex requests → {args.out}")
    print(
        f"HIGH-upper ${est['usd_batch_with_thinking_upper']:.2f} / "
        f"LOW ${est['usd_batch_thinking_low']:.2f} / "
        f"band ${est['target_usd_band']:.2f} "
        f"within_target={est['within_target']}"
    )
    if result["stop"]:
        print(
            f"STOP — HIGH-upper ${est['usd_batch_with_thinking_upper']:.2f} "
            f"> ${args.target_usd:.2f}. No submit."
        )
        return 2
    print("No batch job was submitted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
