"""python -m pipeline → usage pointer."""

from __future__ import annotations

USAGE = """Celebrity birth-card SEO pipeline (static pages only).

  python -m pipeline.pageviews --months 8
  python -m pipeline.wikidata --titles pipeline/data/cache/pageviews.jsonl
  python -m pipeline.wikipedia_summary --from-cache pipeline/data/cache/wikidata
  python -m pipeline.build_dataset --from-seed
  python -m pipeline.harvest_card_meanings
  python -m pipeline.celebs

See pipeline/README.md. Vertex batch stub: python -m enrich.make_batch (no spend).
"""


def main() -> int:
    print(USAGE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
