/**
 * Public/SEO birth-card formula. Mirrors pipeline/birthcard.py (D1 Joker rule).
 *
 *   solar_value = 55 − (2 × month + day)
 *   if solar_value ≤ 0: Joker   # Dec 31 only
 *   deck: 1=A♥ … 13=K♥, 14=A♣ … 26=K♣, 27=A♦ … 39=K♦, 40=A♠ … 52=K♠
 *
 * Year is unused. Isolated copy — seo-pages must not import from app/ or lib/.
 */

import { SUITS, type CardRef, type Suit } from "./types";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const SUIT_GLYPHS = ["♥", "♣", "♦", "♠"] as const;
const GLYPH_TO_SUIT = {
  "♥": "hearts",
  "♣": "clubs",
  "♦": "diamonds",
  "♠": "spades",
} as const satisfies Record<(typeof SUIT_GLYPHS)[number], Suit>;

const RANK_SLUG: Record<(typeof RANKS)[number], string> = {
  A: "ace",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  J: "jack",
  Q: "queen",
  K: "king",
};

const RANK_WORD: Record<(typeof RANKS)[number], string> = {
  A: "Ace",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  J: "Jack",
  Q: "Queen",
  K: "King",
};

const COORDINATE_ARCHETYPE =
  "Calendar coordinate only — month and day map to this card. Year is unused. Not a fortune-telling reading.";

export function solarValue(month: number, day: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`month out of range: ${month}`);
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error(`day out of range: ${day}`);
  }
  return 55 - (2 * month + day);
}

export function birthCardCode(month: number, day: number): string {
  const value = solarValue(month, day);
  if (value <= 0) return "Joker";
  if (value > 52) {
    throw new Error(`solar_value ${value} is outside the deck for ${month}-${day}`);
  }
  const index = value - 1;
  const suit = SUIT_GLYPHS[Math.floor(index / 13)];
  const rank = RANKS[index % 13];
  return `${rank}${suit}`;
}

export function cardRefFromCode(code: string): CardRef {
  if (code === "Joker") {
    return {
      kind: "joker",
      rank: "joker",
      suit: null,
      label: "Joker",
      slug: "joker",
      archetype: COORDINATE_ARCHETYPE,
    };
  }

  const glyph = [...code].find((char): char is (typeof SUIT_GLYPHS)[number] =>
    SUIT_GLYPHS.includes(char as (typeof SUIT_GLYPHS)[number]),
  );
  if (!glyph) {
    throw new Error(`Unrecognized birth-card code: ${code}`);
  }
  const rank = code.replace(glyph, "") as (typeof RANKS)[number];
  if (!RANKS.includes(rank)) {
    throw new Error(`Unrecognized birth-card rank in ${code}`);
  }
  const suit = GLYPH_TO_SUIT[glyph];
  if (!isSuit(suit)) {
    throw new Error(`Unrecognized birth-card suit in ${code}`);
  }
  const rankWord = RANK_WORD[rank];
  const suitWord = suit.charAt(0).toUpperCase() + suit.slice(1);
  return {
    kind: "card",
    rank,
    suit,
    label: `${rankWord} of ${suitWord}`,
    slug: `${RANK_SLUG[rank]}-of-${suit}`,
    archetype: COORDINATE_ARCHETYPE,
  };
}

export function birthCardFromMonthDay(month: number, day: number): CardRef {
  return cardRefFromCode(birthCardCode(month, day));
}

function isSuit(value: string): value is Suit {
  return (SUITS as readonly string[]).includes(value);
}
