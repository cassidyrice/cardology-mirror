"""Birth-card mapping for the celebrity SEO dataset.

Formula (verified):

    solar_value = 55 − (2 × month + day)
    if solar_value ≤ 0: Joker   # Dec 31 only
    deck: 1=A♥ … 13=K♥, 14=A♣ … 26=K♣, 27=A♦ … 39=K♦, 40=A♠ … 52=K♠
    card = deck[solar_value]

D1 (locked): Dec 31 is Joker. This module must not emit K♠ for that date.

Lineage note: ``lib/engine-core/engine.js`` wraps solar 0 to 52 so the
spread grid stays 52-wide (Dec 31 → K♠). Public/SEO birth-card pages use
the Joker boundary instead; this pipeline follows that public rule.
"""

from __future__ import annotations

from datetime import date

RANKS = ("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")
SUITS = ("♥", "♣", "♦", "♠")

# Index 0 unused so deck[solar_value] matches the written formula.
DECK: tuple[str, ...] = ("",) + tuple(f"{rank}{suit}" for suit in SUITS for rank in RANKS)


def solar_value(month: int, day: int) -> int:
    if not 1 <= month <= 12:
        raise ValueError(f"month out of range: {month}")
    if not 1 <= day <= 31:
        raise ValueError(f"day out of range: {day}")
    return 55 - (2 * month + day)


def birth_card(month: int, day: int) -> str:
    value = solar_value(month, day)
    if value <= 0:
        return "Joker"
    if value > 52:
        raise ValueError(f"solar_value {value} is outside the deck for {month}-{day}")
    return DECK[value]


def birth_card_from_iso(iso_date: str) -> str:
    parsed = date.fromisoformat(iso_date)
    return birth_card(parsed.month, parsed.day)
