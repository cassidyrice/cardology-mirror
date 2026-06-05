// SEO data layer for the 52 birth-card pages. Combines the app's own card data
// (engine descriptions + three-lens meanings) into a stable per-card record and
// provides slug <-> code mapping. All public-facing copy is generated here from
// the app's own data — no external sources.

import { parseCard, SUIT_GLYPH, SUIT_DOMAIN, SUIT_COLOR, type Suit } from "./cards";
import THREE_LENS from "./card-meanings.json";
import CARD_DESCRIPTIONS from "./engine-data/card-descriptions.json";

type ThreeLens = { name: string; under: string; sweet_spot: string; over: string };
type Description = {
  title: string;
  core_identity: string;
  gifts: string;
  shadow: string;
  life_direction: string;
  algorithm_gateway?: string;
};

const LENS = THREE_LENS as Record<string, ThreeLens>;
const DESC = CARD_DESCRIPTIONS as Record<string, Description>;

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const SUITS: Suit[] = ["hearts", "clubs", "diamonds", "spades"];

const RANK_SLUG: Record<string, string> = {
  A: "ace", J: "jack", Q: "queen", K: "king",
};
const RANK_TITLE: Record<string, string> = {
  A: "Ace", J: "Jack", Q: "Queen", K: "King",
};

function code(rank: string, suit: Suit): string {
  return `${rank}${SUIT_GLYPH[suit]}`;
}

export interface CardSeo {
  code: string; // "K♠"
  slug: string; // "king-of-spades"
  label: string; // "King of Spades"
  rank: string; // "K"
  suit: Suit;
  glyph: string;
  color: string;
  suitDomain: string; // "Work, will & transformation"
  // Rich description (39 cards) — optional:
  title: string | null; // "The One-Eyed Master of Acquisition"
  coreIdentity: string | null;
  gifts: string[];
  shadow: string | null;
  lifeDirection: string | null;
  // Three-lens (all 52):
  under: string;
  sweetSpot: string;
  over: string;
}

function toBullets(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function slugFor(rank: string, suit: Suit): string {
  return `${RANK_SLUG[rank] ?? rank}-of-${suit}`;
}

export function getCardSeo(c: string): CardSeo | null {
  const p = parseCard(c);
  if (!p) return null;
  const d = DESC[c];
  const lens = LENS[c];
  if (!lens) return null;
  return {
    code: c,
    slug: slugFor(p.rank, p.suit),
    label: p.label,
    rank: p.rank,
    suit: p.suit,
    glyph: p.glyph,
    color: p.color,
    suitDomain: SUIT_DOMAIN[p.suit],
    title: d?.title ?? null,
    coreIdentity: d?.core_identity ?? null,
    gifts: toBullets(d?.gifts),
    shadow: d?.shadow ?? null,
    lifeDirection: d?.life_direction ?? null,
    under: lens.under,
    sweetSpot: lens.sweet_spot,
    over: lens.over,
  };
}

let _all: CardSeo[] | null = null;
export function allCardSeo(): CardSeo[] {
  if (_all) return _all;
  const out: CardSeo[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const seo = getCardSeo(code(rank, suit));
      if (seo) out.push(seo);
    }
  }
  _all = out;
  return out;
}

export function cardBySlug(slug: string): CardSeo | null {
  return allCardSeo().find((c) => c.slug === slug) ?? null;
}

export function allCardSlugs(): string[] {
  return allCardSeo().map((c) => c.slug);
}

// Cards grouped by suit, for the hub/index page.
export function cardsBySuit(): { suit: Suit; domain: string; cards: CardSeo[] }[] {
  return SUITS.map((suit) => ({
    suit,
    domain: SUIT_DOMAIN[suit],
    cards: allCardSeo().filter((c) => c.suit === suit),
  }));
}

// Per-card SEO title + meta description, generated from the app's own data.
export function cardMeta(card: CardSeo): { title: string; description: string } {
  const title = card.title
    ? `${card.label} (${card.title}) — Cardology Birth Card`
    : `${card.label} — Cardology Birth Card Meaning`;
  const seed = card.coreIdentity || card.sweetSpot;
  const description = clamp(
    `${card.label} birth card meaning in Cardology: ${seed}`,
    158,
  );
  return { title: clamp(title, 64), description };
}

function clamp(s: string, n: number): string {
  s = s.replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, "") + "…";
}

export const SUIT_LIST = SUITS;
export { SUIT_COLOR };
