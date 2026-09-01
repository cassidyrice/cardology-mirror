// Shared vocabulary for the beginner cartomancy cluster:
// /how-to-read-playing-cards, /playing-card-spreads, and its three spokes.
//
// The suit and rank language below is copied VERBATIM from the card pages'
// own helpers (app/birth-card/[slug]/page.tsx — the same copies
// app/card-of-the-day/page.tsx carries) so the spread pages never drift from
// what the full card pages say. No card meaning is authored here: every
// worked example on the spread pages pulls its text from lib/seo-cards at
// build time.

import type { Suit } from "./cards";

// Rank arc, Ace → King (verbatim from rankTheme in
// app/birth-card/[slug]/page.tsx).
export function rankTheme(rank: string): string {
  const themes: Record<string, string> = {
    A: "initiation and pure impulse",
    "2": "partnership and exchange",
    "3": "creativity and choice",
    "4": "foundation and structure",
    "5": "freedom and change",
    "6": "responsibility and recalibration",
    "7": "faith, refinement, and inner testing",
    "8": "power, influence, and mastery",
    "9": "completion and release",
    "10": "public expression and full-cycle manifestation",
    J: "youthful mastery, experimentation, and cleverness",
    Q: "inner authority, nurturance, and magnetic intelligence",
    K: "leadership, command, and mature stewardship",
  };
  return themes[rank] ?? "card expression";
}

// Plain-language expansion of each suit's canonical domain (verbatim from
// suitDomainPlain in app/birth-card/[slug]/page.tsx, keyed by suit).
export function suitDomainPlain(suit: Suit): string {
  switch (suit) {
    case "hearts": return "relationship, emotional truth, belonging, and the courage to stay open";
    case "clubs": return "ideas, language, learning, communication, and the stories that shape perception";
    case "diamonds": return "money, values, resources, self-worth, and the choices that create stability";
    case "spades": return "work, discipline, health, responsibility, transformation, and spiritual maturity";
  }
}

// How each suit tends to show up in relationships (verbatim from
// relationshipTheme in app/birth-card/[slug]/page.tsx, keyed by suit).
export function relationshipTheme(suit: Suit): string {
  switch (suit) {
    case "hearts": return "emotional presence, affection, trust, and the need to feel genuinely connected";
    case "clubs": return "conversation, shared ideas, mental stimulation, and the stories each person believes";
    case "diamonds": return "values, generosity, security, desire, and the way love is supported in real life";
    case "spades": return "commitment, endurance, repair, boundaries, and the willingness to grow through pressure";
  }
}

export function suitWord(suit: Suit): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

// The spread cluster's shared directory — the hub's spread cards and each
// spoke's sibling links render from this one list so names and framing
// never fork between pages.
export const SPREADS_HUB_PATH = "/playing-card-spreads";

export type SpreadInfo = {
  slug: string;
  path: string;
  name: string;
  positions: string;
  oneLine: string;
  bestFor: string;
};

export const SPREADS: SpreadInfo[] = [
  {
    slug: "life-spread",
    path: "/playing-card-spreads#life-spread",
    name: "The Life Spread",
    positions: "7 rows × 7 seats + the crown — the deck in calendar order",
    oneLine:
      "The board at rest: all 52 cards in their fixed calendar seats. Every card owns exactly one seat, and yours never moves.",
    bestFor: "Seeing where your birth card lives before anything starts moving.",
  },
  {
    slug: "spirit-spread",
    path: "/playing-card-spreads#spirit-spread",
    name: "The Spirit Spread",
    positions: "The deck's second fixed arrangement — same 52 seats, different tenants",
    oneLine:
      "The deck's other fixed board. Between the two boards cards trade seats — those trades are where stretch, steady, and the lifetime karma pair come from.",
    bestFor: "Understanding your card's seven lenses and its karma pair.",
  },
  {
    slug: "90-yearly-spreads",
    path: "/playing-card-spreads#yearly-spreads",
    name: "The 90 Yearly Spreads",
    positions: "One numbered board per year of life — your spread number is your age",
    oneLine:
      "Every birthday the board re-deals to the next numbered arrangement. Your card lands in a new seat, and the year's seven 52-day cards are read from its new row.",
    bestFor: "Timing: the seven 52-day cards and the year's signal cards.",
  },
];
