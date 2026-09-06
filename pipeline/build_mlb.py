"""Assemble the committed MLB first-game JSONL.

Usage:

    python3 -m pipeline.build_mlb
"""

from __future__ import annotations

from pipeline.mlb import MLB_JSONL, MLB_SNAPSHOT, write_mlb_dataset


def main() -> None:
    rows = write_mlb_dataset()
    print(
        f"Wrote {len(rows)} MLB first-game rows → {MLB_JSONL} "
        f"and snapshot → {MLB_SNAPSHOT}"
    )


if __name__ == "__main__":
    main()
