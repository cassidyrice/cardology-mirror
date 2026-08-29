/** Birth Card Deep Dive — Card Blueprint Stripe, not Cassidy Rice Company. */

import { parseIsoCalendarDate } from "@/lib/worker-seo-routes";

export const DEEP_DIVE_PRICE_ID = "price_1U8s5uChx1yAVyrsjbQKfsmD";
export const DEEP_DIVE_PRODUCT_ID = "prod_V9AQZLgrZ4WclM";
export const DEEP_DIVE_SKU = "deep-dive-9";
export const DEEP_DIVE_OFFER_SLUG = "deep-dive";
export const DEEP_DIVE_SESSION_PATH = "/checkout/deep-dive/session";
export const DEEP_DIVE_PRICE_LABEL = "$9";
export const DEEP_DIVE_CTA_LABEL = "Get Deep Dive $9";
export const DEEP_DIVE_SUCCESS_COPY =
  "Payment confirmed. Your 7-page Deep Dive, System Guide, and 90 Spreads are in this email.";
export const DEEP_DIVE_JOKER_SUCCESS_COPY =
  "Payment confirmed. Your System Guide and 90 Spreads are in this email. December 31 is the Joker — there is no card-level Deep Dive PDF for this date.";
export const DEEP_DIVE_FULFILLMENT =
  "What $9 sends: 7-page Deep Dive PDF for your birth card + System Guide + 90 Spreads (download links now). Joker / Dec 31: Guide + Spreads only — no card PDF.";

export const DEEP_DIVE_CARD_PDF_PREFIX = "deep-dive";

const CARD_SEO_SLUG =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;

const RANK_LABEL: Record<string, string> = {
  ace: "Ace",
  jack: "Jack",
  queen: "Queen",
  king: "King",
};

export type DeepDiveFile = {
  slug: string;
  key: string;
  fileName: string;
  label: string;
};

export const DEEP_DIVE_BONUSES: readonly DeepDiveFile[] = [
  {
    slug: "system-guide",
    key: "system-guide.pdf",
    fileName: "System-Guide.pdf",
    label: "System Guide",
  },
  {
    slug: "all-90-spreads",
    key: "all-90-spreads.pdf",
    fileName: "The-90-Spreads.pdf",
    label: "90 Spreads",
  },
];

/** Card Blueprint live publishable key (public). Runtime env can override. */
export const CARD_BLUEPRINT_PUBLISHABLE_KEY =
  "pk_live_51U1a1dChx1yAVyrsPVOCRyrXoymP7o50pqwov9rKto6X9oFC8QGzAmQF71w16GBBCfftaoUoQU9YmLtDlWh0wCAY00q4yanosN";

export const DEEP_DIVE_SOURCES = [
  "birth-card-calculator",
  "birth-card-calculator-result",
  "home-hero",
  "home-hero-result",
  "birth-card-meaning",
  "site-header",
] as const;

export type DeepDiveSource = (typeof DEEP_DIVE_SOURCES)[number];

export function sanitizeDeepDiveSource(value: unknown): DeepDiveSource {
  return typeof value === "string" &&
    (DEEP_DIVE_SOURCES as readonly string[]).includes(value)
    ? (value as DeepDiveSource)
    : "birth-card-calculator";
}

export function deepDiveSessionMetadata(input: {
  birthday: string;
  source?: unknown;
  cardLabel?: string;
  cardSlug?: string;
}): Record<string, string> {
  const source = sanitizeDeepDiveSource(input.source);
  return {
    sku: DEEP_DIVE_SKU,
    offer_slug: DEEP_DIVE_OFFER_SLUG,
    offer_name: "Birth Card Deep Dive",
    product_kind: "digital_download",
    birthday: input.birthday,
    birthdate: input.birthday,
    source,
    ...(input.cardLabel ? { card_label: input.cardLabel } : {}),
    ...(input.cardSlug ? { card_slug: input.cardSlug } : {}),
  };
}

// Fail closed: no hardcoded fallbacks. A missing env must surface as a 503,
// never a silent charge against whichever account the hardcoded IDs point at.
export function stripePublishableKey(): string {
  return (
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    ""
  );
}

export function deepDivePriceId(): string {
  return process.env.STRIPE_PRICE_DEEP_DIVE || "";
}

export function deepDiveCardPdfKey(seoSlug: string): string {
  return `${DEEP_DIVE_CARD_PDF_PREFIX}/${seoSlug}.pdf`;
}

function labelFromCardSeoSlug(slug: string): string | null {
  const match = CARD_SEO_SLUG.exec(slug);
  if (!match) return null;
  const rank = RANK_LABEL[match[1]] ?? match[1];
  const suit = match[2][0].toUpperCase() + match[2].slice(1);
  return `${rank} of ${suit}`;
}

export function deepDiveCardFile(seoSlug: string): DeepDiveFile | null {
  const label = labelFromCardSeoSlug(seoSlug);
  if (!label) return null;
  return {
    slug: seoSlug,
    key: deepDiveCardPdfKey(seoSlug),
    fileName: `${label.replaceAll(" ", "-")}-Deep-Dive.pdf`,
    label: `${label} Deep Dive`,
  };
}

/** Public truth: only December 31 is the Joker. No engine import (client-safe). */
export function isJokerBirthdate(birthday: string | undefined | null): boolean {
  if (!birthday) return false;
  const parsed = parseIsoCalendarDate(birthday);
  return Boolean(parsed && parsed.month === 12 && parsed.day === 31);
}

export function deepDiveSuccessCopy(birthday?: string | null): string {
  return isJokerBirthdate(birthday)
    ? DEEP_DIVE_JOKER_SUCCESS_COPY
    : DEEP_DIVE_SUCCESS_COPY;
}

export function deepDiveBonusBySlug(slug: string): DeepDiveFile | undefined {
  return (
    DEEP_DIVE_BONUSES.find((b) => b.slug === slug) ??
    deepDiveCardFile(slug) ??
    undefined
  );
}
