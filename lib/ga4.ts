/**
 * Shared GA4 helpers for the dual-stack Card Blueprints surface.
 * Measurement IDs are public by design; env override is optional.
 */

export const DEFAULT_GA_MEASUREMENT_ID = "G-25K69MTQ4L";

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

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
  "code",
  "gate",
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
 * Strip sensitive query keys from a full URL before sending to GA.
 * Returns pathname + safe query only (no hash).
 */
export function sanitizeGaPageLocation(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, "https://cardblueprints.com");
    for (const key of [...url.searchParams.keys()]) {
      if (
        GA_BLOCKED_QUERY_KEYS.some((blocked) =>
          key.toLowerCase().includes(blocked.toLowerCase()),
        )
      ) {
        url.searchParams.delete(key);
      }
    }
    const search = url.searchParams.toString();
    return search ? `${url.pathname}?${search}` : url.pathname;
  } catch {
    return "/";
  }
}

export function buildGtagBootstrapSnippet(measurementId: string): string {
  const id = resolveGaMeasurementId(measurementId);
  return [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js', new Date());",
    // Manual page_view from the SPA router avoids double-counting the first hit.
    `gtag('config', '${id}', { send_page_view: false, anonymize_ip: true });`,
  ].join("\n");
}

export function buildGaSnippetHtml(measurementId?: string): string {
  const id = resolveGaMeasurementId(measurementId);
  const loader = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  return [
    `<!-- Google tag (gtag.js) -->`,
    `<script async src="${loader}"></script>`,
    `<script>${buildGtagBootstrapSnippet(id)}`,
    `gtag('event', 'page_view', { page_path: location.pathname + location.search });`,
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
    case "card_shared":
      return { eventName: "share", params: { content_type: "birth_card" } };
    case "readings_viewed":
      return { eventName: "view_item", params: { item_category: "reading" } };
    case "offer_selected":
      return { eventName: "view_item", params: { item_category: "offer" } };
    case "checkout_started":
      return { eventName: "begin_checkout" };
    case "purchase_completed":
      return { eventName: "purchase" };
    case "free_course_signup":
      return { eventName: "generate_lead", params: { lead_source: "free_course" } };
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
      // Hard cap + reject values that look like emails/tokens.
      if (value.includes("@") || /^[A-Za-z0-9_-]{32,}$/.test(value)) continue;
      out[key] = value.slice(0, 100);
    } else {
      out[key] = value;
    }
  }
  return out;
}
