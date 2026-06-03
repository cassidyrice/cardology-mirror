// Card-glyph parsing + display helpers shared across the app.

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

const SUIT_MAP: Record<string, Suit> = {
  "♥": "hearts",
  "♦": "diamonds",
  "♣": "clubs",
  "♠": "spades",
};

export const SUIT_GLYPH: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_DOMAIN: Record<Suit, string> = {
  hearts: "Relationships & emotion",
  diamonds: "Values & resources",
  clubs: "Mind & communication",
  spades: "Work, will & transformation",
};

export const SUIT_COLOR: Record<Suit, string> = {
  hearts: "#e0654a",
  diamonds: "#d9b26a",
  clubs: "#7fae8f",
  spades: "#7b6cf0",
};

export interface ParsedCard {
  rank: string; // "A","2"..."10","J","Q","K"
  suit: Suit;
  glyph: string;
  color: string;
  domain: string;
  label: string; // "8 of Diamonds"
}

const RANK_WORD: Record<string, string> = {
  A: "Ace", J: "Jack", Q: "Queen", K: "King",
};

export function parseCard(code: string): ParsedCard | null {
  if (!code) return null;
  const glyphChar = [...code].find((c) => SUIT_MAP[c]);
  if (!glyphChar) return null;
  const suit = SUIT_MAP[glyphChar];
  const rank = code.replace(glyphChar, "").trim();
  const rankWord = RANK_WORD[rank] ?? rank;
  return {
    rank,
    suit,
    glyph: SUIT_GLYPH[suit],
    color: SUIT_COLOR[suit],
    domain: SUIT_DOMAIN[suit],
    label: `${rankWord} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
  };
}

// Bullet-list strings from the engine (gifts/shadow use "- " lines) -> array.
export function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

// Date helper: today's date as ISO YYYY-MM-DD (local).
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
