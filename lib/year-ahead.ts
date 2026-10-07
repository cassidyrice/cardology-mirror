/** Your Year Ahead ($19): the buyer's current card year, birthday to birthday,
 *  built from the deterministic year engine (lib/year-blueprint.ts) and the
 *  reviewed copy library (lib/year-copy.ts). No model writes it, so it is
 *  ready on the confirmation page the moment payment lands.
 *
 *  Sold through the generic instant-report pipeline (lib/products.ts →
 *  /checkout/year-ahead → Stripe → webhook mints a report token →
 *  /blueprint?token=… renders the year). Client-safe: no engine import here. */

/** Offer slug: checkout route, Stripe metadata offer_slug, analytics offerSlug. */
export const YEAR_AHEAD_SLUG = "year-ahead";
/** Report-token slug. app/blueprint/page.tsx renders the year for it. */
export const YEAR_AHEAD_REPORT_SLUG = "year-ahead";
export const YEAR_AHEAD_PRODUCT_PATH = "/products/year-ahead";
export const YEAR_AHEAD_REVIEW_PATH = `/checkout/${YEAR_AHEAD_SLUG}`;
export const YEAR_AHEAD_PRODUCT_NAME = "Your Year Ahead";
export const YEAR_AHEAD_PRICE = 19;
export const YEAR_AHEAD_PRICE_LABEL = "$19";
/** Cloudflare Pages secret holding the $19 Stripe price id (Card Blueprint account).
 *  Unset = checkout fails closed: the review page says checkout is closed and no
 *  Stripe session is created. */
export const YEAR_AHEAD_PRICE_ENV = "STRIPE_PRICE_YEAR_AHEAD";
/** Build-time kill switch for every Year Ahead CTA (calculator, home reveal,
 *  product page, success-page cross-sell). Same pattern as CARD_APP_ON_SALE. */
export const YEAR_AHEAD_ON_SALE = true;
/** How long the emailed link re-opens the year. */
export const YEAR_AHEAD_LINK_DAYS = 365;
/** Buttondown tag for the free email preview (calculator result + home reveal). */
export const YEAR_AHEAD_PREVIEW_TAG = "year-ahead-preview";
export const YEAR_AHEAD_CTA_LABEL = `Get my year ahead — ${YEAR_AHEAD_PRICE_LABEL}`;
export const YEAR_AHEAD_FULFILLMENT =
  "Your card year, birthday to birthday: the Long Range card, the Pluto card and its Result, and all seven 52-day periods, dated. Opens the moment you pay; the link is emailed and works for 12 months.";

/** "a Queen of Diamonds", "an Eight of Spades", "an Ace of Hearts". */
export function withCardArticle(cardLabel: string): string {
  const label = cardLabel.trim();
  if (!label) return label;
  if (/^the\b/i.test(label)) return label;
  return /^(ace|eight|[aeiou8])/i.test(label) ? `an ${label}` : `a ${label}`;
}

/** "Your year ahead as a Queen of Diamonds" (falls back to the plain name). */
export function yearAheadHeading(cardLabel?: string): string {
  return cardLabel
    ? `Your year ahead as ${withCardArticle(cardLabel)}`
    : YEAR_AHEAD_PRODUCT_NAME;
}

/** Server-only: the configured Stripe price id, or "" (fail closed). */
export function yearAheadPriceId(): string {
  return process.env[YEAR_AHEAD_PRICE_ENV] || "";
}
