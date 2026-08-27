/** Birth Card Deep Dive — Card Blueprint Stripe, not Cassidy Rice Company. */

export const DEEP_DIVE_PRICE_ID = "price_1U8s5uChx1yAVyrsjbQKfsmD";
export const DEEP_DIVE_PRODUCT_ID = "prod_V9AQZLgrZ4WclM";
export const DEEP_DIVE_SKU = "deep-dive-9";
export const DEEP_DIVE_OFFER_SLUG = "deep-dive";
export const DEEP_DIVE_SESSION_PATH = "/checkout/deep-dive/session";
export const DEEP_DIVE_PRICE_LABEL = "$9";
export const DEEP_DIVE_CTA_LABEL = "Get Deep Dive $9";
export const DEEP_DIVE_SUCCESS_COPY =
  "Payment confirmed. Your System Guide and 90 Spreads are in this email. The 7-page Deep Dive follows in a few minutes.";
export const DEEP_DIVE_FULFILLMENT =
  "What $9 sends: 7-page Deep Dive (personalized, by email shortly) + System Guide + 90 Spreads (download links now).";

export const DEEP_DIVE_BONUSES = [
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
] as const;

/** Card Blueprint live publishable key (public). Runtime env can override. */
export const CARD_BLUEPRINT_PUBLISHABLE_KEY =
  "pk_live_51U1a1dChx1yAVyrsPVOCRyrXoymP7o50pqwov9rKto6X9oFC8QGzAmQF71w16GBBCfftaoUoQU9YmLtDlWh0wCAY00q4yanosN";

export const DEEP_DIVE_SOURCES = [
  "birth-card-calculator",
  "birth-card-calculator-result",
  "home-hero",
  "home-hero-result",
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
  };
}

export function stripePublishableKey(): string {
  return (
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    CARD_BLUEPRINT_PUBLISHABLE_KEY
  );
}

export function deepDivePriceId(): string {
  return process.env.STRIPE_PRICE_DEEP_DIVE || DEEP_DIVE_PRICE_ID;
}

export function deepDiveBonusBySlug(slug: string) {
  return DEEP_DIVE_BONUSES.find((b) => b.slug === slug);
}
