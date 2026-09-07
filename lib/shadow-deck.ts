// The Shadow Deck — Cass's 52 shadow archetypes, one per birth card.
// Source: his manuscript "The Shadow Deck" (mirrored at
// ~/cardblueprints-ops/reference/the-shadow-deck.md), parsed verbatim by
// scripts/build-shadow-deck.ts into lib/shadow-deck.json. The site shows the
// archetype on the birth card only — no shuffling, no drawing, not tarot.

import SHADOW_DECK from "./shadow-deck.json";

export interface ShadowEntry {
  code: string; // "8♦"
  slug: string; // "8-of-diamonds"
  label: string; // "Eight of Diamonds"
  archetype: string; // "The Grinder"
  coreShadow: string;
  worldview: string; // first person, no surrounding quotes
  inTheLight: string;
  lightName: string | null; // "The Artisan"
  prompts: string[]; // three journaling prompts
  keywords?: string[]; // four shadow keywords from shadow_card_meanings.xlsx
}

const DECK = SHADOW_DECK as Record<string, ShadowEntry>;

/**
 * Cards whose pages show the shadow layer. Rolling out card by card so Cass
 * can read each one in place; empty the list to hide the layer everywhere,
 * or set it to ALL_SHADOW_CARDS to show all 52.
 */
export const SHADOW_LAYER_CARDS: readonly string[] = ["8♦"];

export const ALL_SHADOW_CARDS: readonly string[] = Object.keys(DECK);

export function shadowEntry(code: string): ShadowEntry | null {
  return DECK[code] ?? null;
}

export function shadowLayerEnabled(code: string): boolean {
  return SHADOW_LAYER_CARDS.includes(code) && Boolean(DECK[code]);
}
