"""Rebuild Vertex JSONL for rejected enrich rows only. Does not submit a job."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from enrich.make_batch import (
    DEFAULT_MEANINGS,
    DEFAULT_PEOPLE,
    load_jsonl,
    write_batch,
)

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RETRY = ROOT / "enrich" / "artifacts" / "retry.jsonl"
DEFAULT_OUT = ROOT / "enrich" / "artifacts" / "vertex_retry_batch.jsonl"


def load_retry_qids(path: Path) -> list[str]:
    if not path.is_file():
        raise SystemExit(f"retry.jsonl not found: {path}")
    qids: list[str] = []
    seen: set[str] = set()
    for row in load_jsonl(path):
        qid = str(row.get("qid") or "").strip()
        if not qid or qid in seen:
            continue
        seen.add(qid)
        qids.append(qid)
    return qids


def write_retry_batch(
    *,
    people_path: Path,
    meanings_path: Path,
    retry_path: Path,
    out_path: Path,
) -> dict[str, Any]:
    retry_qids = load_retry_qids(retry_path)
    people = load_jsonl(people_path) if people_path.is_file() else []
    people_qids = {str(row.get("qid") or "") for row in people}
    missing = [qid for qid in retry_qids if qid not in people_qids]
    written = write_batch(
        people_path=people_path,
        meanings_path=meanings_path,
        out_path=out_path,
        include_qids=set(retry_qids),
    )
    return {
        "retry_ids": len(retry_qids),
        "missing_in_people": missing,
        "people": written["people"],
        "requests": written["requests"],
        "out_path": str(out_path),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Write Vertex JSONL for retry.jsonl qids ∩ people.jsonl. Does not submit."
    )
    parser.add_argument("--people", type=Path, default=DEFAULT_PEOPLE)
    parser.add_argument("--meanings", type=Path, default=DEFAULT_MEANINGS)
    parser.add_argument("--retry", type=Path, default=DEFAULT_RETRY)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args(argv)
    result = write_retry_batch(
        people_path=args.people,
        meanings_path=args.meanings,
        retry_path=args.retry,
        out_path=args.out,
    )
    print(
        f"wrote {result['requests']} retry requests "
        f"from {result['retry_ids']} retry ids → {args.out}"
    )
    if result["missing_in_people"]:
        print(f"missing in people.jsonl: {len(result['missing_in_people'])}")
    print("No batch job was submitted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
