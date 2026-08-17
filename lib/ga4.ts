/**
 * Shared GA4 helpers for the dual-stack Card Blueprints surface.
 * Measurement IDs are public by design; env override is optional.
 */

import { buildConsentDefaultSnippet } from "@/lib/consent";

export const DEFAULT_GA_MEASUREMENT_ID = "G-25K69MTQ4L";

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

/** Query keys that must never reach GA as page_location params. */
export const GA_BLOCKED_QUERY_KEYS = [
  "token",
  "access",
  "session_id",
  "sessionId",
  "email",
  "name",
  "phone",
  "birthdate",
  "birth_date",
  "bd",
  "dob",
  "date",
  "code",
  "gate",
  "card",
  "turnstile",
] as const;

export const GA_ALLOWED_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "status",
] as const;

export type GaEventParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export function resolveGaMeasurementId(
  value: string | undefined | null = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
): string {
  const candidate = (value ?? "").trim() || DEFAULT_GA_MEASUREMENT_ID;
  return MEASUREMENT_ID_PATTERN.test(candidate)
    ? candidate.toUpperCase()
    : DEFAULT_GA_MEASUREMENT_ID;
}

export function isGaMeasurementId(value: unknown): value is string {
  return typeof value === "string" && MEASUREMENT_ID_PATTERN.test(value.trim());
}

/**
 * Pathname-only policy: never send query strings or hashes to GA.
 * Blocked keys and ISO dates are stripped if a caller still passes a full URL.
 */
export function sanitizeGaPageLocation(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, "https://cardblueprints.com");
    return url.pathname || "/";
  } catch {
    return "/";
  }
}

export function buildGtagBootstrapSnippet(measurementId: string): string {
  const id = resolveGaMeasurementId(measurementId);
  return [
    buildConsentDefaultSnippet(),
    "gtag('js', new Date());",
    // Manual page_view from the SPA router avoids double-counting the first hit.
    `gtag('config', '${id}', { send_page_view: false, anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });`,
  ].join("\n");
}

export function buildGaSnippetHtml(measurementId?: string): string {
  const id = resolveGaMeasurementId(measurementId);
  const loader = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  return [
    `<!-- Google tag (gtag.js) -->`,
    `<script async src="${loader}"></script>`,
    `<script>${buildGtagBootstrapSnippet(id)}`,
    `gtag('event', 'page_view', { page_path: location.pathname, page_location: location.origin + location.pathname });`,
    `</script>`,
  ].join("\n");
}

/** Map first-party funnel names onto recommended GA4 event names when possible. */
export function mapFunnelEventToGa4(
  name: string,
): { eventName: string; params?: GaEventParams } {
  switch (name) {
    case "organic_landing":
      return { eventName: "organic_landing" };
    case "calculator_started":
      return { eventName: "calculator_started" };
    case "calculator_completed":
      return { eventName: "calculator_completed" };
    case "card_meaning_clicked":
      return {
        eventName: "select_content",
        params: { content_type: "birth_card_meaning" },
      };
    case "course_offer_shown":
      return {
        eventName: "view_promotion",
        params: { promotion_name: "free_birth_card_course" },
      };
    case "free_course_signup":
      return {
        eventName: "generate_lead",
        params: { lead_source: "free_course" },
      };
    case "blueprint_clicked":
      return {
        eventName: "select_item",
        params: { item_category: "personal_blueprint" },
      };
    case "card_shared":
      return { eventName: "share", params: { content_type: "birth_card" } };
    case "offer_selected":
      return { eventName: "view_item", params: { item_category: "offer" } };
    case "offer_cta_clicked":
      return {
        eventName: "select_content",
        params: { content_type: "offer_cta" },
      };
    case "checkout_started":
      return { eventName: "begin_checkout" };
    case "purchase_completed":
      return { eventName: "purchase" };
    case "elroy_teaser_shown":
      return { eventName: "elroy_teaser_shown" };
    case "elroy_opened":
      return { eventName: "elroy_opened" };
    case "elroy_birthdate_entered":
      return { eventName: "elroy_birthdate_entered" };
    case "elroy_email_submitted":
      return { eventName: "elroy_email_submitted" };
    case "elroy_micro_reading_viewed":
      return {
        eventName: "generate_lead",
        params: { lead_source: "elroy_micro_reading" },
      };
    case "elroy_blueprint_clicked":
      return { eventName: "elroy_blueprint_clicked" };
    default:
      return { eventName: name };
  }
}

export function sanitizeGaEventParams(params: GaEventParams = {}): GaEventParams {
  const out: GaEventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (
      GA_BLOCKED_QUERY_KEYS.some((blocked) => lower.includes(blocked.toLowerCase()))
    ) {
      continue;
    }
    if (typeof value === "string") {
      if (value.includes("@") || /^[A-Za-z0-9_-]{32,}$/.test(value)) continue;
      if (ISO_DATE.test(value)) continue;
      out[key] = value.slice(0, 100);
    } else {
      out[key] = value;
    }
  }
  return out;
}
