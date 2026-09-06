"""python -m enrich → usage pointer."""

from __future__ import annotations

USAGE = """WP3 Vertex / Gemini enrich.

  python3 -m enrich.make_batch \\
    --people pipeline/data/people.jsonl \\
    --meanings pipeline/data/card_meanings.json \\
    --out enrich/artifacts/vertex_batch.jsonl

  python3 -m enrich.estimate --input enrich/artifacts/vertex_batch.jsonl
  python3 -m enrich.submit_batch --input enrich/artifacts/vertex_batch.jsonl
  python3 -m enrich.submit_batch --poll
  python3 -m enrich.parse_results

See enrich/README.md. Submit refuses to invent GCP credentials.
"""


def main() -> int:
    print(USAGE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
