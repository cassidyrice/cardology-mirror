#!/usr/bin/env python3
"""Generate lib/compat-pairs.json — per-card links into the Worker-served
/compatibility/ pair library (cardology-unlock).

Source of truth: /Users/clr/cardology-unlock/src/report_data.json (path14 +
karma), i.e. the SAME data the unlock Worker renders its 1,378 pair pages and
52 per-card hubs from. Slug + canonical-pair-order rules replicate
cardology-unlock/src/{seo.js,compat.js} exactly:

  - cardSlug:  ace-of-hearts, 2-of-hearts, 10-of-spades, queen-of-diamonds
  - pair URL:  /compatibility/<a>-and-<b> with a,b in deck order
               (suits ♥♣♦♠, ranks A..K); wrong order 301s, so we emit
               canonical order only.

For each of the 52 cards we pick the highest-relationship-relevance fixed
connections from its life path: Venus, Moon, Mars, Jupiter, Saturn, Mercury,
plus the two karma cards (plus = Lifetime Gift, minus = Lifetime Challenge —
same labels the birth-card pages already use) and the same-card mirror pair.
Deduped by URL, max 9 pairs per card.

Usage: python3 scripts/generate_compat_pairs.py
"""

import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKER_DATA = "/Users/clr/cardology-unlock/src/report_data.json"
OUT = os.path.join(REPO, "lib", "compat-pairs.json")

SUITS = "♥♣♦♠"
RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
ORDER = [r + s for s in SUITS for r in RANKS]
CARD_IDX = {c: i for i, c in enumerate(ORDER)}

RANK_WORDS = {"A": "Ace", "2": "Two", "3": "Three", "4": "Four", "5": "Five",
              "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten",
              "J": "Jack", "Q": "Queen", "K": "King"}
RANK_SLUG = {"A": "ace", "J": "jack", "Q": "queen", "K": "king"}
SUIT_NAMES = {"♥": "Hearts", "♣": "Clubs", "♦": "Diamonds", "♠": "Spades"}

# Relationship-salience order; first occurrence of a URL wins on dedupe.
POSITIONS = ["Venus", "Moon", "Mars", "Jupiter", "Saturn", "Mercury"]
MAX_PAIRS = 9


def rank_of(c):
    return c[:-1]


def suit_of(c):
    return c[-1]


def card_slug(c):
    r = rank_of(c)
    return f"{RANK_SLUG.get(r, r)}-of-{SUIT_NAMES[suit_of(c)].lower()}"


def card_label(c):
    return f"{RANK_WORDS[rank_of(c)]} of {SUIT_NAMES[suit_of(c)]}"


def pair_href(a, b):
    ca, cb = (a, b) if CARD_IDX[a] <= CARD_IDX[b] else (b, a)
    return f"/compatibility/{card_slug(ca)}-and-{card_slug(cb)}"


def main():
    report = json.load(open(WORKER_DATA))
    path14 = report["path14"]
    karma = report["karma"]

    out = {}
    for card in ORDER:
        candidates = []
        p14 = path14.get(card, {})
        for pos in POSITIONS:
            other = p14.get(pos)
            if other and other in CARD_IDX:
                candidates.append((pos, other))
        k = karma.get(card) or {}
        if not k.get("mystical"):
            if k.get("plus") in CARD_IDX:
                candidates.append(("Lifetime Gift", k["plus"]))
            if k.get("minus") in CARD_IDX:
                candidates.append(("Lifetime Challenge", k["minus"]))
        candidates.append(("Mirror", card))  # same-card pair page

        pairs, seen = [], set()
        for pos, other in candidates:
            href = pair_href(card, other)
            if href in seen:
                continue
            seen.add(href)
            pairs.append({"pos": pos, "label": card_label(other), "href": href})
            if len(pairs) >= MAX_PAIRS:
                break

        out[card_slug(card)] = {
            "hub": f"/compatibility/{card_slug(card)}",
            "pairs": pairs,
        }

    with open(OUT, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    counts = [len(v["pairs"]) for v in out.values()]
    print(f"wrote {OUT}: {len(out)} cards, "
          f"{sum(counts)} pair links (min {min(counts)}, max {max(counts)})")


if __name__ == "__main__":
    main()
