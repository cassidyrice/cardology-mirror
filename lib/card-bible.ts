// The card bible: one merged record per birth card, built from Cass's own
// sources (engine descriptions, three-lens meanings, The Shadow Deck, the
// Surface Truth lines, The Analog Algorithm) by
// ~/cardblueprints-ops/reference/build-card-bible.py. Read-only here; every
// page, bot prompt and video script should draw card copy from this file so
// the voice stays in one place.

import CARD_BIBLE from "./card-bible.json";

export interface CardBibleEntry {
  code: string; // "8♦"
  slug: string; // "8-of-diamonds"
  label: string; // "Eight of Diamonds"
  suit: "hearts" | "clubs" | "diamonds" | "spades";
  rank: string;
  title: string; // engine title, e.g. "The Businessman"
  coreIdentity: string;
  gifts: string[];
  shadow: string;
  lifeDirection: string;
  lens: { balanced: string; under: string; over: string };
  archetype: string; // Shadow Deck, e.g. "The Grinder"
  coreShadow: string;
  worldview: string;
  inTheLight: string;
  lightName: string | null;
  prompts: string[];
  keywords: string[];
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

const BIBLE = CARD_BIBLE as Record<string, CardBibleEntry>;

export const CARD_BIBLE_CODES: readonly string[] = Object.keys(BIBLE);

export function cardBible(code: string): CardBibleEntry | null {
  return BIBLE[code] ?? null;
}

export function cardBibleBySlug(slug: string): CardBibleEntry | null {
  return Object.values(BIBLE).find((e) => e.slug === slug) ?? null;
}
