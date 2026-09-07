/** Blueprint Breakdown Video ($47) — Card Blueprint Stripe, not Cassidy Rice Company.
 *  The $9 Birth Card Deep Dive is now the instant bonus inside this offer; the
 *  internal slug/SKU prefix "deep-dive" stays so analytics, Stripe metadata and
 *  fulfillment keep working. */

import { parseIsoCalendarDate } from "@/lib/worker-seo-routes";

/** Retired $9 price (kept for reference; nothing reads it at runtime). */
export const DEEP_DIVE_LEGACY_PRICE_ID = "price_1U8s5uChx1yAVyrsjbQKfsmD";
export const DEEP_DIVE_PRODUCT_ID = "prod_V9AQZLgrZ4WclM";
/** Cloudflare Pages secret that holds the live $47 Stripe price id. */
export const BLUEPRINT_BREAKDOWN_PRICE_ENV = "STRIPE_PRICE_BLUEPRINT_BREAKDOWN";
export const DEEP_DIVE_SKU = "blueprint-breakdown-47";
export const DEEP_DIVE_OFFER_SLUG = "deep-dive";
export const DEEP_DIVE_SESSION_PATH = "/checkout/deep-dive/session";
export const DEEP_DIVE_PRODUCT_PATH = "/products/blueprint-breakdown-video";
export const DEEP_DIVE_PRICE_LABEL = "$47";
export const DEEP_DIVE_PRODUCT_NAME = "Blueprint Breakdown Video";
export const DEEP_DIVE_CTA_LABEL = "Get the Blueprint Breakdown — $47";
/** Links that land on the calculator form, not Stripe. Keep purchase CTAs on DEEP_DIVE_CTA_LABEL. */
export const DEEP_DIVE_CALCULATOR_ENTRY_LABEL = "Find your card → $47 Blueprint Breakdown";
export const DEEP_DIVE_CALCULATOR_FORM_HREF = "/birth-card-calculator#bd";
/** Turnaround promised for the video + Yearly Timing Map (both are produced per buyer). */
export const DEEP_DIVE_VIDEO_TURNAROUND = "within 2 business days";
export const DEEP_DIVE_SUCCESS_COPY =
  `Payment confirmed. Your 5-minute Blueprint Breakdown Video and Yearly Timing Map arrive by email ${DEEP_DIVE_VIDEO_TURNAROUND}. Your bonus 7-page Deep Dive and the complete System Guide are in this email.`;
export const DEEP_DIVE_JOKER_SUCCESS_COPY =
  `Payment confirmed. Your 5-minute Blueprint Breakdown Video and Yearly Timing Map arrive by email ${DEEP_DIVE_VIDEO_TURNAROUND}. Your complete System Guide is in this email. December 31 is the Joker — there is no card-level Deep Dive PDF for this date.`;
export const DEEP_DIVE_FULFILLMENT =
  `What $47 sends: a 5-minute Blueprint Breakdown Video of your birth card, by email ${DEEP_DIVE_VIDEO_TURNAROUND}. Bonuses: the $9 Birth Card Deep Dive (7-page PDF + the complete System Guide) and your Yearly Timing Map. Instant download links + email backup for the PDFs, plus your seven 13-year period cards on the confirmation page. Broken file or wrong card: we replace or refund.`;
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

/** Ships with the $13 Personal Card Blueprint (moved from the $9 bundle 2026-09-01). */
export const ALL_90_SPREADS_FILE: DeepDiveFile = {
  slug: "all-90-spreads",
  key: "all-90-spreads.pdf",
  fileName: "Card-Blueprints-90-Spreads.pdf",
  label: "The 90 Spreads",
};

// Instant PDF bonuses inside the $47 offer. The 90 Spreads moved to the $13 Personal
// Card Blueprint; its slug stays resolvable below so links from earlier $9 orders keep working.
export const DEEP_DIVE_BONUSES: readonly DeepDiveFile[] = [SYSTEM_GUIDE_FILE];

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
  return process.env[BLUEPRINT_BREAKDOWN_PRICE_ENV] || "";
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
