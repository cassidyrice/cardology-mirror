/** 52xSeven Blueprint ($19) — Card Blueprint Stripe, not Cassidy Rice Company.
 *  The internal slug/SKU prefix "deep-dive" stays so analytics, Stripe metadata,
 *  the checkout route and fulfillment keep working across product swaps
 *  ($9 Deep Dive → $47 Blueprint Breakdown Video → $19 52xSeven Blueprint). */

import { parseIsoCalendarDate } from "@/lib/worker-seo-routes";

/** Retired price ids (kept for reference; nothing reads them at runtime). */
export const DEEP_DIVE_LEGACY_PRICE_ID = "price_1U8s5uChx1yAVyrsjbQKfsmD";
export const BLUEPRINT_BREAKDOWN_LEGACY_PRICE_ID = "price_1UD0HnChx1yAVyrsIMHLp2E3";
export const DEEP_DIVE_PRODUCT_ID = "prod_VDx5l3a4DkEcgT";
/** Cloudflare Pages secret that holds the live $19 Stripe price id. */
export const FIFTY_TWO_BY_SEVEN_PRICE_ENV = "STRIPE_PRICE_52XSEVEN_BLUEPRINT";
export const DEEP_DIVE_SKU = "52xseven-blueprint-19";
export const DEEP_DIVE_OFFER_SLUG = "deep-dive";
export const DEEP_DIVE_SESSION_PATH = "/checkout/deep-dive/session";
export const DEEP_DIVE_PRODUCT_PATH = "/products/52xseven-blueprint";
export const DEEP_DIVE_PRICE_LABEL = "$19";
export const DEEP_DIVE_PRODUCT_NAME = "52xSeven Blueprint";
/** Report-token slug for the year app at /blueprint?token=… */
export const FIFTY_TWO_BY_SEVEN_REPORT_SLUG = "52xseven-blueprint";
/** How long the sign-in link works. */
export const FIFTY_TWO_BY_SEVEN_ACCESS_DAYS = 365;
export const DEEP_DIVE_CTA_LABEL = "Unlock my full year — $19";
/** Links that land on the calculator form, not Stripe. Keep purchase CTAs on DEEP_DIVE_CTA_LABEL. */
export const DEEP_DIVE_CALCULATOR_ENTRY_LABEL = "Find your card → $19 52xSeven Blueprint";
export const DEEP_DIVE_CALCULATOR_FORM_HREF = "/birth-card-calculator#bd";
export const DEEP_DIVE_SUCCESS_COPY =
  "Payment confirmed. Your 52xSeven Blueprint is unlocked: your birth card, the 52-day chapter you are in right now, all seven chapters of your year, and the story arc on one map. Your sign-in link is in this email and works for 12 months.";
export const DEEP_DIVE_JOKER_SUCCESS_COPY =
  "Payment confirmed. December 31 is the Joker — it sits outside the 52-card calendar, so there is no seven-chapter year to draw for this date. Reply to this email and we will refund you in full or, if the birth date was mistyped, unlock the right year.";
export const DEEP_DIVE_FULFILLMENT =
  "What $19 unlocks: your whole Cardology year in one phone-friendly app — your birth card with the light and shadow read, the 52-day chapter you are in right now (dated, with how far through it you are), all seven chapters, and the yearly story arc on one map. Instant after payment, on the confirmation page and by emailed sign-in link. 12 months of access, no renewal. Wrong date: we fix it or refund.";
export const CALCULATOR_PRIVACY_MICROCOPY =
  "Calculated on this page. Your birthday is never stored.";

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

export const SYSTEM_GUIDE_FILE: DeepDiveFile = {
  slug: "system-guide",
  key: "system-guide.pdf",
  fileName: "Card-Blueprints-System-Guide.pdf",
  label: "The Complete System Guide",
};

/** Shipped with the retired $13 Personal Card Blueprint; slug stays resolvable for old links. */
export const ALL_90_SPREADS_FILE: DeepDiveFile = {
  slug: "all-90-spreads",
  key: "all-90-spreads.pdf",
  fileName: "Card-Blueprints-90-Spreads.pdf",
  label: "The 90 Spreads",
};

// PDF bonuses of the retired $9 / $47 offers. The $19 52xSeven Blueprint ships no
// PDFs; these slugs stay resolvable so links from earlier orders keep working.
export const DEEP_DIVE_BONUSES: readonly DeepDiveFile[] = [SYSTEM_GUIDE_FILE];

/** Card Blueprint live publishable key (public). Runtime env can override. */
export const CARD_BLUEPRINT_PUBLISHABLE_KEY =
  "pk_live_51U1a1dChx1yAVyrsPVOCRyrXoymP7o50pqwov9rKto6X9oFC8QGzAmQF71w16GBBCfftaoUoQU9YmLtDlWh0wCAY00q4yanosN";

export const DEEP_DIVE_SOURCES = [
  "birth-card-calculator",
  "product-page",
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
    offer_name: DEEP_DIVE_PRODUCT_NAME,
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
  return process.env[FIFTY_TWO_BY_SEVEN_PRICE_ENV] || "";
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
    [SYSTEM_GUIDE_FILE, ALL_90_SPREADS_FILE].find((b) => b.slug === slug) ??
    deepDiveCardFile(slug) ??
    undefined
  );
}
