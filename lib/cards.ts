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

// Suit colors for the dark in-app screens, where these read at full strength.
export const SUIT_COLOR: Record<Suit, string> = {
  hearts: "#e0654a",
  diamonds: "#d9b26a",
  clubs: "#7fae8f",
  spades: "#7b6cf0",
};

// Suit colors for the warm-paper marketing and editorial pages. The dark
// palette above is unusable on cream — diamonds land at 1.7:1, clubs at 2.2:1
// — so paper uses the two inks a real deck uses: red for hearts and diamonds,
// black for clubs and spades. The glyph carries the suit; the color does not
// have to. Oxblood on paper is 7.1:1, ink 16.7:1.
export const SUIT_COLOR_PAPER: Record<Suit, string> = {
  hearts: "#8e321f",
  diamonds: "#8e321f",
  clubs: "#14110d",
  spades: "#14110d",
};

export function suitColorOnPaper(suit: Suit): string {
  return SUIT_COLOR_PAPER[suit];
}

// Paper-safe color for a card code like "8♦" (falls back to ink).
export function cardColorOnPaper(code: string): string {
  const parsed = parseCard(code);
  return parsed ? SUIT_COLOR_PAPER[parsed.suit] : "#14110d";
}

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
