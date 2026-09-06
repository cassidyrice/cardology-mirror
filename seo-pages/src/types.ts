export const SITE_URL = "https://cardblueprints.com";
export const SITE_NAME = "Card Blueprints";

export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export type Suit = (typeof SUITS)[number];

export const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;
export type MonthSlug = (typeof MONTH_SLUGS)[number];

export type CardKind = "card" | "joker";

export type CardRef =
  | {
      kind: "card";
      rank: string;
      suit: Suit;
      label: string;
      slug: string;
      archetype: string;
    }
  | {
      kind: "joker";
      rank: "joker";
      suit: null;
      label: "Joker";
      slug: "joker";
      archetype: string;
    };

export type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

/**
 * One row of `people_enriched.jsonl` (WP3). Fixture rows must set `example: true`.
 * Unknown extra fields are ignored so enrichment can grow without a rebuild break.
 */
export type EnrichedPerson = {
  example: boolean;
  slug: string;
  name: string;
  birth_date: string;
  card: CardRef;
  hook: string;
  card_meaning: string;
  evidence: readonly string[];
  same_card_slugs: readonly string[];
  same_day_slugs: readonly string[];
  faqs: readonly FaqItem[];
  og_image_slot: string;
  wikidata_qid: string | null;
  wikipedia_title: string | null;
};

export type BirthdayKey = Readonly<{
  month: number;
  day: number;
  slug: string;
  label: string;
}>;

export type Breadcrumb = Readonly<{
  name: string;
  href: string;
}>;
