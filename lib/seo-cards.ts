// SEO data layer for the 52 birth-card pages. Combines the app's own card data
// (engine descriptions + three-lens meanings) into stable per-card and per-date
// records. All public-facing copy is generated from deterministic local data.

import { cardology } from "./engine-core/engine.js";
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

const RANK_SLUG: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };

const MONTHS = [
  { name: "January", slug: "january", days: 31 },
  { name: "February", slug: "february", days: 29 },
  { name: "March", slug: "march", days: 31 },
  { name: "April", slug: "april", days: 30 },
  { name: "May", slug: "may", days: 31 },
  { name: "June", slug: "june", days: 30 },
  { name: "July", slug: "july", days: 31 },
  { name: "August", slug: "august", days: 31 },
  { name: "September", slug: "september", days: 30 },
  { name: "October", slug: "october", days: 31 },
  { name: "November", slug: "november", days: 30 },
  { name: "December", slug: "december", days: 31 },
] as const;

function code(rank: string, suit: Suit): string {
  return `${rank}${SUIT_GLYPH[suit]}`;
}

export interface CardSeo {
  code: string;
  slug: string;
  label: string;
  rank: string;
  suit: Suit;
  glyph: string;
  color: string;
  suitDomain: string;
  title: string | null;
  coreIdentity: string | null;
  gifts: string[];
  shadow: string | null;
  lifeDirection: string | null;
  under: string;
  sweetSpot: string;
  over: string;
  karma?: { environment: string | null; displacement: string | null };
}

export interface BirthdateSeo {
  slug: string;
  label: string;
  month: number;
  day: number;
  card: CardSeo;
  rulingCard: CardSeo | null;
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

  const karmaRaw = cardology.getEnvironmentDisplacement(c, 1);

  return {
    code: c,
    slug: slugFor(p.rank, p.suit),
    label: p.label,
    rank: p.rank,
    suit: p.suit,
    glyph: p.glyph,
    color: p.color,
    suitDomain: SUIT_DOMAIN[p.suit],
    title: d?.title ?? lens.name ?? null,
    coreIdentity: d?.core_identity ?? null,
    gifts: toBullets(d?.gifts),
    shadow: d?.shadow ?? null,
    lifeDirection: d?.life_direction ?? null,
    under: lens.under,
    sweetSpot: lens.sweet_spot,
    over: lens.over,
    karma: karmaRaw ? { environment: karmaRaw.environment, displacement: karmaRaw.displacement } : undefined,
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

export function cardsBySuit(): { suit: Suit; domain: string; cards: CardSeo[] }[] {
  return SUITS.map((suit) => ({ suit, domain: SUIT_DOMAIN[suit], cards: allCardSeo().filter((c) => c.suit === suit) }));
}

export function cardMeta(card: CardSeo): { title: string; description: string } {
  const title = card.title
    ? `${card.label} (${card.title}) — Cardology Birth Card`
    : `${card.label} — Cardology Birth Card Meaning`;
  const seed = card.coreIdentity || card.sweetSpot;
  const dates = birthDatesForCard(card).slice(0, 3).map((d) => d.label).join(", ");
  const description = clamp(
    `${card.label} birth card meaning in Cardology: personality, strengths, shadow, relationships, work, and birth dates${dates ? ` including ${dates}` : ""}.`,
    158,
  );
  return { title: clamp(title, 64), description };
}

let _dates: BirthdateSeo[] | null = null;
export function allBirthdateSeo(): BirthdateSeo[] {
  if (_dates) return _dates;
  const out: BirthdateSeo[] = [];
  MONTHS.forEach((m, monthIndex) => {
    for (let day = 1; day <= m.days; day++) {
      const month = monthIndex + 1;
      const [birthCode] = cardology.getBirthCard(month, day) as [string, number];
      const prcRaw = cardology.getPlanetaryRulingCard(month, day) as string | string[] | null;
      const prcCode = Array.isArray(prcRaw) ? prcRaw[0] : prcRaw;
      const card = getCardSeo(birthCode);
      if (!card) continue;
      out.push({
        slug: `${m.slug}-${day}`,
        label: `${m.name} ${day}`,
        month,
        day,
        card,
        rulingCard: prcCode ? getCardSeo(prcCode) : null,
      });
    }
  });
  _dates = out;
  return out;
}

export function allBirthdateSlugs(): string[] {
  return allBirthdateSeo().map((d) => d.slug);
}

export function birthdateBySlug(slug: string): BirthdateSeo | null {
  return allBirthdateSeo().find((d) => d.slug === slug) ?? null;
}

export function birthDatesForCard(card: CardSeo): BirthdateSeo[] {
  return allBirthdateSeo().filter((d) => d.card.slug === card.slug);
}

export function dateMeta(date: BirthdateSeo): { title: string; description: string } {
  return {
    title: clamp(`${date.label} Birth Card: ${date.card.label} Meaning`, 64),
    description: clamp(`${date.label} birth card is ${date.card.label}${date.card.title ? `, ${date.card.title}` : ""}. Read the Cardology meaning, ruling card, personality pattern, strengths, shadow, and growth edge.`, 158),
  };
}

function clamp(s: string, n: number): string {
  s = s.replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, "") + "…";
}

export const SUIT_LIST = SUITS;
export { SUIT_COLOR };
