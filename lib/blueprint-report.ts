/** The Blueprint Report ($129): the 22-page professional reading. Every card in it
 *  is computed by lib/engine-core; no model writes any of it. It is served as a
 *  printable web document (scripts/professional-reading/render.ts carries the
 *  @page rules) behind a signed report token, the same delivery the instant
 *  reports already use. Client-safe: no engine import. */

export const BLUEPRINT_REPORT_SLUG = "blueprint-report";
export const BLUEPRINT_REPORT_NAME = "Blueprint Report";
export const BLUEPRINT_REPORT_PRICE = 129;
export const BLUEPRINT_REPORT_PRICE_LABEL = "$129";
export const BLUEPRINT_REPORT_PAGE_COUNT = 22;
export const BLUEPRINT_REPORT_PRODUCT_PATH = "/products/blueprint-report";
/** The generic review page (app/checkout/[offer]) collects the birth date, then Stripe. */
export const BLUEPRINT_REPORT_REVIEW_PATH = "/checkout/blueprint-report";
/** Serves the rendered report for a valid token: /report?token=… */
export const BLUEPRINT_REPORT_VIEW_PATH = "/report";
/** Cloudflare Pages secret holding the live $129 Stripe price id. Fail closed if unset. */
export const BLUEPRINT_REPORT_PRICE_ENV = "STRIPE_PRICE_BLUEPRINT_REPORT";
export const BLUEPRINT_REPORT_CTA_LABEL = `Report only, ${BLUEPRINT_REPORT_PRICE_LABEL}`;
/** Cover name when Stripe returns none. Never an email address. */
export const BLUEPRINT_REPORT_FALLBACK_NAME = "Reader";

/** Featured tier: the same report plus a 45-minute live consultation with Cass.
 *  Mints the same report document (reportSlug blueprint-report); only the
 *  Stripe price and the fulfilment email differ. */
export const CONSULT_SLUG = "blueprint-report-consult";
export const CONSULT_NAME = "Blueprint Report + Consultation";
export const CONSULT_PRICE = 297;
export const CONSULT_PRICE_LABEL = "$297";
export const CONSULT_MINUTES = 45;
export const CONSULT_REVIEW_PATH = `/checkout/${CONSULT_SLUG}`;
export const CONSULT_PRICE_ENV = "STRIPE_PRICE_BLUEPRINT_REPORT_CONSULT";
export const CONSULT_CTA_LABEL = `Report + ${CONSULT_MINUTES} minutes with Cass, ${CONSULT_PRICE_LABEL}`;
/** Cal.com event for the prepaid consultation. Must be a FREE event type: the
 *  buyer already paid on Stripe. Empty until Cass supplies the link; the
 *  webhook then tells him to send it by hand rather than emailing a blank. */
export const CONSULT_BOOKING_URL = "";
