"""Harvest long-form birth-card meanings into pipeline/data/card_meanings.json.

Sources (existing site copy only — nothing invented):

- ``lib/engine-data/card-descriptions.json`` — title, core identity, gifts,
  shadow, life direction
- ``lib/card-meanings.json`` — three-lens under / sweet_spot / over
- ``app/birth-card/joker/page.tsx`` — December 31 / Joker page prose (D1)

Regenerate:

    python3 -m pipeline.harvest_card_meanings
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
OUT_PATH = ROOT / "data" / "card_meanings.json"
LENS_PATH = REPO / "lib" / "card-meanings.json"
DESC_PATH = REPO / "lib" / "engine-data" / "card-descriptions.json"

RANKS = ("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")
SUITS = ("♥", "♣", "♦", "♠")
SUIT_SLUG = {"♥": "hearts", "♣": "clubs", "♦": "diamonds", "♠": "spades"}
RANK_SLUG = {"A": "ace", "J": "jack", "Q": "queen", "K": "king"}
RANK_NAME = {
    "A": "Ace",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "10": "10",
    "J": "Jack",
    "Q": "Queen",
    "K": "King",
}
SUIT_NAME = {"♥": "Hearts", "♣": "Clubs", "♦": "Diamonds", "♠": "Spades"}

# Verbatim harvest from app/birth-card/joker/page.tsx (Cass lock D1).
JOKER_PAGE = {
    "title": "The Joker: The December 31 Birth Card",
    "quick_answer": (
        "December 31 is the only birthday in the year that does not map to one "
        "of the 52 cards. The formula resolves it to zero, and zero is the "
        "Joker — the card outside the deck's ordered sequence."
    ),
    "arithmetic": (
        "Every date runs through the same formula: Solar Value = 55 − "
        "(2 × Month + Day). For December 31 that is 55 − (2 × 12 + 31) = "
        "55 − 55 = 0. The cards occupy values 1 through 52, so zero has "
        "nowhere to land in the standard deck. December 30 gives "
        "55 − (24 + 30) = 1, the Ace of Hearts — the first card in the "
        "sequence. One day later the value steps down again, and there is "
        "nothing below the Ace. That is the edge of the system."
    ),
    "honest_number": (
        "In a common year, 364 dates map to one of the 52 cards and December "
        "31 resolves to the Joker. A leap year adds February 29, which maps "
        "normally to the 9 of Clubs. We state both edge cases plainly — the "
        "system is more useful when the public explanation matches the "
        "calculator."
    ),
    "what_it_means": (
        "It means the standard card structure does not describe you, and we "
        "are not going to pretend otherwise. The 52-card material — birth "
        "card, ruling card, life spread positions, compatibility by "
        "position — is all built on values 1 through 52. None of it resolves "
        "for a value of zero."
    ),
}

EXPECTED_CARD_COUNT = 53  # 52 + Joker


def _slug_for(rank: str, suit: str) -> str:
    return f"{RANK_SLUG.get(rank, rank)}-of-{SUIT_SLUG[suit]}"


def _label_for(rank: str, suit: str) -> str:
    return f"{RANK_NAME[rank]} of {SUIT_NAME[suit]}"


def _bullets(text: str | None) -> list[str]:
    if not text:
        return []
    lines: list[str] = []
    for raw in text.splitlines():
        cleaned = raw.replace("\u2022", "-").strip()
        if cleaned.startswith("-"):
            cleaned = cleaned[1:].strip()
        if cleaned:
            lines.append(cleaned)
    return lines


def _join_paragraphs(*parts: str) -> str:
    return "\n\n".join(part.strip() for part in parts if part and part.strip())


def harvest_deck(lens: dict, descriptions: dict) -> dict[str, dict]:
    missing: list[str] = []
    cards: dict[str, dict] = {}
    for suit in SUITS:
        for rank in RANKS:
            symbol = f"{rank}{suit}"
            three = lens.get(symbol)
            desc = descriptions.get(symbol)
            if not three or not desc:
                missing.append(symbol)
                continue
            gifts = _bullets(desc.get("gifts"))
            meaning = _join_paragraphs(
                desc.get("title") or three.get("name") or _label_for(rank, suit),
                desc.get("core_identity") or "",
                f"Balanced: {three['sweet_spot']}" if three.get("sweet_spot") else "",
                f"Under-expressed: {three['under']}" if three.get("under") else "",
                f"Over-expressed: {three['over']}" if three.get("over") else "",
                f"Shadow: {desc['shadow']}" if desc.get("shadow") else "",
                ("Gifts: " + "; ".join(gifts)) if gifts else "",
                f"Life direction: {desc['life_direction']}" if desc.get("life_direction") else "",
            )
            cards[symbol] = {
                "symbol": symbol,
                "name": three.get("name") or _label_for(rank, suit).upper(),
                "label": _label_for(rank, suit),
                "slug": _slug_for(rank, suit),
                "title": desc.get("title") or three.get("name"),
                "page": f"/birth-card/{_slug_for(rank, suit)}",
                "meaning": meaning,
                "core_identity": desc.get("core_identity") or "",
                "sweet_spot": three.get("sweet_spot") or "",
                "under": three.get("under") or "",
                "over": three.get("over") or "",
                "shadow": desc.get("shadow") or three.get("over") or "",
                "gifts": gifts,
                "life_direction": desc.get("life_direction") or "",
                "sources": [
                    "lib/engine-data/card-descriptions.json",
                    "lib/card-meanings.json",
                    "app/birth-card/[slug]/page.tsx",
                ],
            }
    if missing:
        raise SystemExit(f"missing source copy for cards: {', '.join(missing)}")
    cards["Joker"] = harvest_joker()
    if len(cards) != EXPECTED_CARD_COUNT:
        raise SystemExit(f"expected {EXPECTED_CARD_COUNT} cards, got {len(cards)}")
    return cards


def harvest_joker() -> dict:
    meaning = _join_paragraphs(
        JOKER_PAGE["title"],
        JOKER_PAGE["quick_answer"],
        JOKER_PAGE["arithmetic"],
        JOKER_PAGE["honest_number"],
        JOKER_PAGE["what_it_means"],
    )
    return {
        "symbol": "Joker",
        "name": "JOKER",
        "label": "Joker",
        "slug": "joker",
        "title": JOKER_PAGE["title"],
        "page": "/birth-card/joker",
        "meaning": meaning,
        "core_identity": JOKER_PAGE["quick_answer"],
        "sweet_spot": JOKER_PAGE["honest_number"],
        "under": JOKER_PAGE["what_it_means"],
        "over": JOKER_PAGE["what_it_means"],
        "shadow": JOKER_PAGE["what_it_means"],
        "gifts": [],
        "life_direction": JOKER_PAGE["arithmetic"],
        "sources": ["app/birth-card/joker/page.tsx"],
    }


def load_sources() -> tuple[dict, dict]:
    lens = json.loads(LENS_PATH.read_text(encoding="utf-8"))
    descriptions = json.loads(DESC_PATH.read_text(encoding="utf-8"))
    return lens, descriptions


def write_card_meanings(path: Path = OUT_PATH) -> Path:
    cards = harvest_deck(*load_sources())
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(cards, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return path


def main(argv: list[str] | None = None) -> int:
    del argv
    path = write_card_meanings()
    payload = json.loads(path.read_text(encoding="utf-8"))
    print(f"wrote {len(payload)} cards → {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
