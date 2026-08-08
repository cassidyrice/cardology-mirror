export const CLIENT_FUNNEL_EVENTS = [
  "organic_landing",
  "calculator_started",
  "calculator_completed",
  "card_shared",
  "readings_viewed",
  "offer_selected",
  "elroy_teaser_shown",
  "elroy_opened",
  "elroy_birthdate_entered",
  "elroy_email_submitted",
  "elroy_micro_reading_viewed",
  "elroy_blueprint_clicked",
] as const;

export const SERVER_FUNNEL_EVENTS = [
  "checkout_started",
  "purchase_completed",
] as const;

export const FUNNEL_EVENTS = [
  ...CLIENT_FUNNEL_EVENTS,
  ...SERVER_FUNNEL_EVENTS,
] as const;

export type ClientFunnelEventName = (typeof CLIENT_FUNNEL_EVENTS)[number];
export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];
export type TrafficChannel =
  | "organic"
  | "campaign"
  | "referral"
  | "direct"
  | "unknown";

export type FunnelContext = {
  sessionId?: string;
  eventId?: string;
  path?: string;
  landingPath?: string;
  referrerHost?: string;
  trafficChannel?: TrafficChannel;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  offerSlug?: string;
  placement?: string;
  outcome?: string;
  currency?: string;
  valueCents?: number;
};

const CLIENT_EVENT_NAMES = new Set<string>(CLIENT_FUNNEL_EVENTS);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OFFER_SLUGS = new Set([
  "personal-card-blueprint",
  // Historical purchases can still emit completion events for retired offers.
  "quick-question",
  "complete-reading",
  "season-pass-90",
]);
const TRAFFIC_CHANNELS = new Set<TrafficChannel>([
  "organic",
  "campaign",
  "referral",
  "direct",
  "unknown",
]);

export function isClientFunnelEventName(
  value: unknown,
): value is ClientFunnelEventName {
  return typeof value === "string" && CLIENT_EVENT_NAMES.has(value);
}

export function sanitizeAnalyticsId(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return UUID_PATTERN.test(normalized) ? normalized.toLowerCase() : "";
}

export function sanitizeEventId(value: unknown): string {
  return sanitizeText(value, 120, /^[a-zA-Z0-9:_-]+$/);
}

export function sanitizeAnalyticsPath(value: unknown): string {
  if (typeof value !== "string") return "";
  const path = value.split(/[?#]/, 1)[0].trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return sanitizeText(path, 180, /^[\w\-./]+$/);
}

export function sanitizeHostname(value: unknown): string {
  return sanitizeText(value, 120, /^[a-zA-Z0-9.-]+$/).toLowerCase();
}

export function sanitizeTrafficChannel(value: unknown): TrafficChannel {
  return typeof value === "string" &&
    TRAFFIC_CHANNELS.has(value as TrafficChannel)
    ? (value as TrafficChannel)
    : "unknown";
}

export function sanitizeOfferSlug(value: unknown): string {
  return typeof value === "string" && OFFER_SLUGS.has(value)
    ? value
    : "";
}

export function sanitizeAnalyticsLabel(
  value: unknown,
  maxLength = 80,
): string {
  return sanitizeText(value, maxLength, /^[\w .:/-]+$/);
}

export function sanitizeCurrency(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "";
}

export function sanitizeValueCents(value: unknown): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10_000_000
    ? Math.round(value)
    : 0;
}

export function inferTrafficChannel({
  referrerHost,
  currentHost,
  utmSource,
  utmMedium,
}: {
  referrerHost: string;
  currentHost: string;
  utmSource: string;
  utmMedium: string;
}): TrafficChannel {
  // Explicit campaign tagging wins over an inferred search referrer. Without
  // this ordering, paid search (for example utm_medium=cpc from Google) would
  // be mislabeled as organic.
  if (utmSource || utmMedium) {
    return utmMedium.toLowerCase() === "organic" ? "organic" : "campaign";
  }
  if (isSearchEngine(referrerHost)) return "organic";
  if (!referrerHost || referrerHost === currentHost) return "direct";
  return "referral";
}

export function funnelContextFromFormData(form: FormData): FunnelContext {
  return {
    sessionId: sanitizeAnalyticsId(form.get("analytics_session_id")),
    landingPath: sanitizeAnalyticsPath(form.get("analytics_landing_path")),
    referrerHost: sanitizeHostname(form.get("analytics_referrer_host")),
    trafficChannel: sanitizeTrafficChannel(
      form.get("analytics_traffic_channel"),
    ),
    utmSource: sanitizeAnalyticsLabel(form.get("analytics_utm_source")),
    utmMedium: sanitizeAnalyticsLabel(form.get("analytics_utm_medium")),
    utmCampaign: sanitizeAnalyticsLabel(form.get("analytics_utm_campaign")),
  };
}

export function analyticsMetadata(context: FunnelContext): Record<string, string> {
  const entries = {
    analytics_session_id: sanitizeAnalyticsId(context.sessionId),
    analytics_landing_path: sanitizeAnalyticsPath(context.landingPath),
    analytics_referrer_host: sanitizeHostname(context.referrerHost),
    analytics_traffic_channel: sanitizeTrafficChannel(context.trafficChannel),
    analytics_utm_source: sanitizeAnalyticsLabel(context.utmSource),
    analytics_utm_medium: sanitizeAnalyticsLabel(context.utmMedium),
    analytics_utm_campaign: sanitizeAnalyticsLabel(context.utmCampaign),
  };

  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value && value !== "unknown"),
  );
}

export function funnelContextFromMetadata(
  metadata: Record<string, string> | null | undefined,
): FunnelContext {
  return {
    sessionId: sanitizeAnalyticsId(metadata?.analytics_session_id),
    landingPath: sanitizeAnalyticsPath(metadata?.analytics_landing_path),
    referrerHost: sanitizeHostname(metadata?.analytics_referrer_host),
    trafficChannel: sanitizeTrafficChannel(
      metadata?.analytics_traffic_channel,
    ),
    utmSource: sanitizeAnalyticsLabel(metadata?.analytics_utm_source),
    utmMedium: sanitizeAnalyticsLabel(metadata?.analytics_utm_medium),
    utmCampaign: sanitizeAnalyticsLabel(metadata?.analytics_utm_campaign),
  };
}

function isSearchEngine(host: string): boolean {
  return [
    "google.",
    "bing.com",
    "search.yahoo.",
    "duckduckgo.com",
    "ecosia.org",
    "brave.com",
    "perplexity.ai",
    "kagi.com",
  ].some((needle) => host.includes(needle));
}

function sanitizeText(
  value: unknown,
  maxLength: number,
  pattern: RegExp,
): string {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!normalized || !pattern.test(normalized)) return "";
  return normalized.slice(0, maxLength);
}
