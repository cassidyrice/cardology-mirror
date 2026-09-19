/** One Question Reading ($13) — Card Blueprint Stripe, not Cassidy Rice Company.
 *  The internal slug/SKU prefix "deep-dive" stays so analytics, Stripe metadata,
 *  the checkout route and fulfillment keep working across product swaps
 *  ($9 Deep Dive → $13 Blueprint Breakdown Video → $19 52xSeven Blueprint → $13 One Question Reading).
 *
 *  Fulfillment is immediate: the reading is written the moment the payment lands and
 *  reaches the buyer on the success page and by email within about a minute
 *  (ONE_QUESTION_TURNAROUND). The webhook still carries the birthday and the question,
 *  so a wrong date or a reworded question can be rewritten on reply.
 *  Past buyers of the retired SKUs keep the year app; see FIFTY_TWO_BY_SEVEN_* below. */

import { parseIsoCalendarDate } from "@/lib/worker-seo-routes";

/** Retired price ids (kept for reference; nothing reads them at runtime). */
export const DEEP_DIVE_LEGACY_PRICE_ID = "price_1U8s5uChx1yAVyrsjbQKfsmD";
export const FIFTY_TWO_BY_SEVEN_LEGACY_PRICE_ID = "price_1UDVBZChx1yAVyrsFy87P2Co";
/** Stripe product that carries the live $13 price (renamed "One Question Reading"). */
export const ONE_QUESTION_PRODUCT_ID = "prod_V9AQZLgrZ4WclM";
export const ONE_QUESTION_PRICE_ID = "price_1UD0HnChx1yAVyrsIMHLp2E3";
/** Cloudflare Pages secret that holds the live $13 Stripe price id. The secret name is
 *  historical (it was created for the $13 Blueprint Breakdown Video and holds the same
 *  price object); it is reused so no new Pages secret is needed. */
export const ONE_QUESTION_PRICE_ENV = "STRIPE_PRICE_BLUEPRINT_BREAKDOWN";
export const DEEP_DIVE_SKU = "one-question-47";
export const ONE_QUESTION_SKU = DEEP_DIVE_SKU;
/** Retired SKUs whose sessions still fulfill (year app / PDFs) for past buyers. */
export const FIFTY_TWO_BY_SEVEN_SKU = "52xseven-blueprint-19";
export const LEGACY_DEEP_DIVE_SKUS = [
  FIFTY_TWO_BY_SEVEN_SKU,
  "blueprint-breakdown-47",
  "deep-dive-9",
] as const;
export const DEEP_DIVE_OFFER_SLUG = "deep-dive";
export const DEEP_DIVE_SESSION_PATH = "/checkout/deep-dive/session";
/** The review page where the buyer types the question before Stripe. */
export const DEEP_DIVE_REVIEW_PATH = "/checkout/deep-dive";
export const DEEP_DIVE_PRODUCT_PATH = "/products/one-question-reading";
export const DEEP_DIVE_PRICE_LABEL = "$13";
export const DEEP_DIVE_PRODUCT_NAME = "One Question Reading";
export const ONE_QUESTION_TURNAROUND = "about a minute";
/** Question length: Stripe metadata values cap at 500 characters. */
export const QUESTION_MIN_CHARS = 5;
export const QUESTION_MAX_CHARS = 400;
/** Report-token slug for the retired year app at /blueprint?token=… (past buyers). */
export const FIFTY_TWO_BY_SEVEN_REPORT_SLUG = "52xseven-blueprint";
/** How long a legacy sign-in link works. */
export const FIFTY_TWO_BY_SEVEN_ACCESS_DAYS = 365;
export const DEEP_DIVE_CTA_LABEL = "Ask your question — $13";
/** Links that land on the calculator form, not Stripe. Keep purchase CTAs on DEEP_DIVE_CTA_LABEL. */
export const DEEP_DIVE_CALCULATOR_ENTRY_LABEL = "Find your card → ask one question, $13";
export const DEEP_DIVE_CALCULATOR_FORM_HREF = "/birth-card-calculator#bd";
export const DEEP_DIVE_SUCCESS_COPY =
  "Payment confirmed. Your question is in. The reading is written from your birth card, this year's cards, and the card you owe. It is written the moment you pay: on your screen and in your inbox within about a minute. Wrong date or a reworded question: reply and we rewrite it.";
export const DEEP_DIVE_JOKER_SUCCESS_COPY =
  "Payment confirmed. Your question is in. December 31 is the Joker, the one birthday outside the 52-card map, so the reading says so up front and reads the year from the Joker's position. It is written the moment you pay: on your screen and in your inbox within about a minute. Wrong date or a reworded question: reply and we rewrite it.";
export const DEEP_DIVE_FULFILLMENT =
  "What $13 gets you: one written reading on one question. Built from your birth card, this year's Long Range and Pluto cards, and the card you owe. About 600 words, plus three things to keep an eye out for. It is written the moment you pay: on your screen and in your inbox within about a minute. Wrong date or a reworded question: reply and we rewrite it.";
export const CALCULATOR_PRIVACY_MICROCOPY =
  "Calculated on this page. Your birthday is never stored.";
export const QUESTION_FIELD_LABEL = "The one question";
export const QUESTION_FIELD_HINT =
  "One question, in real words. \"Should I take the job in Denver?\" reads better than \"career.\"";

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

// PDF bonuses of the retired $9 / $13 offers. The One Question Reading ships no
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
  "home-landing",
  "birth-card-meaning",
  "site-header",
  "checkout-review",
] as const;

export type DeepDiveSource = (typeof DEEP_DIVE_SOURCES)[number];

export function sanitizeDeepDiveSource(value: unknown): DeepDiveSource {
  return typeof value === "string" &&
    (DEEP_DIVE_SOURCES as readonly string[]).includes(value)
    ? (value as DeepDiveSource)
    : "birth-card-calculator";
}

/** Trim, collapse whitespace, cap at the Stripe metadata limit. Empty when too short. */
export function sanitizeQuestion(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/\s+/g, " ").trim().slice(0, QUESTION_MAX_CHARS);
  return cleaned.length >= QUESTION_MIN_CHARS ? cleaned : "";
}

export function deepDiveSessionMetadata(input: {
  birthday: string;
  question: string;
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
    question: input.question,
    source,
    ...(input.cardLabel ? { card_label: input.cardLabel } : {}),
    ...(input.cardSlug ? { card_slug: input.cardSlug } : {}),
  };
}

/** True for a paid session of the live product (not a retired year-app SKU). */
export function isOneQuestionSession(
  session: { metadata?: Record<string, string> | null } | null | undefined,
): boolean {
  return session?.metadata?.sku === ONE_QUESTION_SKU;
}

/** True for sessions that must still fulfill with the retired year app. */
export function isLegacyYearAppSession(
  session: { metadata?: Record<string, string> | null } | null | undefined,
): boolean {
  const sku = session?.metadata?.sku ?? "";
  if (sku === ONE_QUESTION_SKU) return false;
  return (
    (LEGACY_DEEP_DIVE_SKUS as readonly string[]).includes(sku) ||
    (!sku && session?.metadata?.offer_slug === DEEP_DIVE_OFFER_SLUG)
  );
}

/** The question a buyer typed on the review page, from session metadata. */
export function questionFromCheckoutSession(
  session: { metadata?: Record<string, string> | null } | null | undefined,
): string {
  return sanitizeQuestion(session?.metadata?.question);
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
  return process.env[ONE_QUESTION_PRICE_ENV] || "";
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

/** "2026-02-17" -> "2/17/1991" for the paste-ready `reading` command in the intake email. */
export function birthdayForCommand(birthday: string): string {
  const parsed = parseIsoCalendarDate(birthday);
  if (!parsed) return birthday;
  return `${parsed.month}/${parsed.day}/${parsed.year}`;
}

export function deepDiveBonusBySlug(slug: string): DeepDiveFile | undefined {
  return (
    [SYSTEM_GUIDE_FILE, ALL_90_SPREADS_FILE].find((b) => b.slug === slug) ??
    deepDiveCardFile(slug) ??
    undefined
  );
}
