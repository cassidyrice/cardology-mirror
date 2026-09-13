// The card bible: one merged record per card, built from Cass's own sources
// (engine descriptions, three-lens meanings, The Shadow Deck, the reading
// notes, the Surface Truth lines, The Analog Algorithm) plus the authored
// watch-for lines, by scripts/build-card-bible.ts. Read-only here; every page,
// bot prompt and video script should draw card copy from this file so the
// voice stays in one place.
//
// 53 entries: the 52 birth cards, then "Joker" (December 31, the one birthday
// outside the 52 card map). The Joker has no engine description, no Shadow
// Deck archetype and no pair pages, so the source-derived fields are absent on
// it. Use CARD_BIBLE_CODES for the 52 and CARD_BIBLE_ALL_CODES to include it.

import CARD_BIBLE from "./card-bible.json";

export interface CardBibleFamous {
  name: string;
  born: string; // ISO YYYY-MM-DD, Wikidata P569
  knownFor: string;
  wikipedia: string;
}

export interface CardBiblePair {
  pos: string; // "Venus", "Moon", "Mars"
  name: string; // "Queen of Diamonds"
  href: string; // /compatibility/... (pre-canonicalized)
}

/** Fields every entry carries, the Joker included. */
export interface CardBibleCore {
  code: string; // "8♦", or "Joker"
  name: string; // "8 of Diamonds"
  slug: string; // "8-of-diamonds"
  rank: string; // "8", "K", "Joker"
  suit: "hearts" | "clubs" | "diamonds" | "spades" | "joker";
  title: string | null; // "The Businessman"
  coreIdentity: string;
  sweetSpot: string; // same sentence as lens.balanced
  shadow: string; // the habit
  cost: string; // what the habit charges
  watchFor: string; // one concrete thing to watch for in the next few weeks
  keywords: string[]; // four
  famous: CardBibleFamous[]; // up to five
  pairs: CardBiblePair[]; // top three connections; empty for the Joker
}

/** The 52 birth cards also carry everything the source corpus supplies. */
export interface CardBibleEntry extends CardBibleCore {
  gifts: string[];
  lifeDirection: string;
  lens: { balanced: string; under: string; over: string };
  archetype: string; // Shadow Deck, e.g. "The Grinder"
  coreShadow: string;
  worldview: string;
  inTheLight: string;
  lightName: string | null;
  prompts: string[];
  surfaceTruth: string | null;
  analog: {
    title: string;
    corePattern: string;
    shadowExpression: string;
    evolvedExpression: string;
    relationships: string;
    career: string;
    lifeLesson: string;
    practice: string;
    mantra: string | null;
  };
}

const BIBLE = CARD_BIBLE as unknown as Record<string, CardBibleEntry>;

export const JOKER_CODE = "Joker";

/** The 52 birth cards, deck order. */
export const CARD_BIBLE_CODES: readonly string[] = Object.keys(BIBLE).filter(
  (code) => code !== JOKER_CODE,
);

/** All 53 entries: the 52 birth cards, then the Joker. */
export const CARD_BIBLE_ALL_CODES: readonly string[] = Object.keys(BIBLE);

/** A birth card record. Returns null for the Joker; use jokerBible() for that. */
export function cardBible(code: string): CardBibleEntry | null {
  if (code === JOKER_CODE) return null;
  return BIBLE[code] ?? null;
}

export function cardBibleBySlug(slug: string): CardBibleEntry | null {
  return CARD_BIBLE_CODES.map((code) => BIBLE[code]).find((e) => e.slug === slug) ?? null;
}

/** The Joker record: December 31 only, no engine or Shadow Deck fields. */
export function jokerBible(): CardBibleCore {
  return BIBLE[JOKER_CODE] as CardBibleCore;
}

/** Any entry, the Joker included. */
export function cardBibleAny(code: string): CardBibleCore | null {
  return (BIBLE[code] as CardBibleCore | undefined) ?? null;
}
