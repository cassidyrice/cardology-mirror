#!/usr/bin/env python3
"""Independent adversarial birth-card table generator.

Implements ONLY the solar_value formula from the Day 0 WP2 brief.
Must not import pipeline, hermes, app, or any in-repo helper modules.
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

RANKS = ("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")
SUITS = ("♥", "♣", "♦", "♠")
# 1-indexed: 1=A♥ … 13=K♥, 14=A♣ … 26=K♣, 27=A♦ … 39=K♦, 40=A♠ … 52=K♠
DECK: list[str | None] = [None] + [f"{rank}{suit}" for suit in SUITS for rank in RANKS]

DAYS_IN_MONTH = {
    1: 31,
    2: 29,  # always include Feb 29
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31,
}

SPOT_CHECKS = {
    (1, 1): "K♠",
    (1, 29): "J♣",
    (9, 5): "6♦",
    (2, 29): "9♣",
    (12, 31): "Joker",
}


def solar_value(month: int, day: int) -> int:
    return 55 - (2 * month + day)


def card_for(month: int, day: int) -> str:
    value = solar_value(month, day)
    if value <= 0:
        return "Joker"
    if value > 52:
        raise ValueError(f"solar_value {value} is outside the 52-card deck")
    card = DECK[value]
    if card is None:
        raise ValueError(f"no card at solar_value {value}")
    return card


def all_calendar_days() -> list[tuple[int, int]]:
    days: list[tuple[int, int]] = []
    for month in range(1, 13):
        for day in range(1, DAYS_IN_MONTH[month] + 1):
            days.append((month, day))
    return days


def mm_dd(month: int, day: int) -> str:
    return f"{month:02d}-{day:02d}"


def generate_rows() -> list[tuple[str, str]]:
    return [(mm_dd(month, day), card_for(month, day)) for month, day in all_calendar_days()]


def assert_spot_checks() -> None:
    for (month, day), expected in SPOT_CHECKS.items():
        actual = card_for(month, day)
        if actual != expected:
            raise AssertionError(
                f"{mm_dd(month, day)}: expected {expected!r}, got {actual!r}"
            )


def write_csv(path: Path, rows: list[tuple[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["mm-dd", "card"])
        writer.writerows(rows)


def main() -> int:
    assert_spot_checks()
    rows = generate_rows()
    if len(rows) != 366:
        raise AssertionError(f"expected 366 calendar rows, got {len(rows)}")
    if rows[-1] != ("12-31", "Joker"):
        raise AssertionError("Cass lock D1: Dec 31 must be Joker (not K♠)")
    output = Path(__file__).resolve().parent / "birthcard_table.csv"
    write_csv(output, rows)
    print(f"Wrote {len(rows)} rows to {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
