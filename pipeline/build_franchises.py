"""Assemble the committed NFL franchise JSONL from the HOF alias map.

Usage:

    python3 -m pipeline.build_franchises
"""

from __future__ import annotations

from pipeline.franchises import FRANCHISES_JSONL, HOF_SNAPSHOT, write_franchise_dataset


def main() -> None:
    rows = write_franchise_dataset()
    print(
        f"Wrote {len(rows)} franchise rows → {FRANCHISES_JSONL} "
        f"and snapshot → {HOF_SNAPSHOT}"
    )


if __name__ == "__main__":
    main()
