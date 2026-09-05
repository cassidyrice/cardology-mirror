/** Content Engine checkout helpers. Price comes only from env (fail-closed). */

export const CONTENT_CALENDAR_52_SKU = "content-calendar-52";
export const CONTENT_CALENDAR_52_OFFER_SLUG = "content-calendar-52";
export const CONTENT_CALENDAR_52_SESSION_PATH =
  "/checkout/content-calendar-52/session";

export function contentCalendarPriceId(): string {
  return process.env.STRIPE_PRICE_CONTENT_CALENDAR || "";
}

export function contentCalendarSessionMetadata(opts: {
  business: string;
  startDate: string;
  source?: string;
}): Record<string, string> {
  return {
    sku: CONTENT_CALENDAR_52_SKU,
    offer_slug: CONTENT_CALENDAR_52_OFFER_SLUG,
    business: opts.business.slice(0, 240),
    start_date: opts.startDate,
    source: opts.source || "content-engine",
    offer_name: "Content Calendar — 52 days",
    product_kind: "digital_download",
  };
}
