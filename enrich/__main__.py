"""python -m enrich → usage pointer. Does not submit a Vertex job."""

from __future__ import annotations

USAGE = """WP3 enrich scaffold (no Vertex spend).

  python3 -m enrich.make_batch \\
    --people pipeline/data/fixtures/people.jsonl \\
    --meanings pipeline/data/card_meanings.json \\
    --out /tmp/vertex_batch.jsonl

  python3 -m enrich.make_retry_batch
  python3 -m enrich.make_hub_batch
  python3 -m enrich.estimate --input enrich/artifacts/vertex_hub_batch.jsonl --target-usd 20

See enrich/README.md and enrich/RETRY_PLAN.md.
"""


def main() -> int:
    print(USAGE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
