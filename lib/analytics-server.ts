import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

import {
  sanitizeAnalyticsId,
  sanitizeAnalyticsLabel,
  sanitizeAnalyticsPath,
  sanitizeCurrency,
  sanitizeEventId,
  sanitizeHostname,
  sanitizeOfferSlug,
  sanitizeTrafficChannel,
  sanitizeValueCents,
  type FunnelContext,
  type FunnelEventName,
} from "@/lib/analytics";

type AnalyticsDataPoint = {
  indexes?: string[];
  blobs?: string[];
  doubles?: number[];
};

type AnalyticsEngineDataset = {
  writeDataPoint(data: AnalyticsDataPoint): void;
};

type AnalyticsCloudflareEnv = {
  FUNNEL_ANALYTICS?: AnalyticsEngineDataset;
  CF_PAGES_BRANCH?: string;
  CF_PAGES_COMMIT_SHA?: string;
};

type FunnelEvent = FunnelContext & {
  name: FunnelEventName;
  source: "browser" | "server";
};

// Fixed Analytics Engine column map. Keep this order in sync with
// docs/analytics.md so queries keep their meaning.
export function recordFunnelEvent(event: FunnelEvent): boolean {
  try {
    const context = getOptionalRequestContext();
    const env = context?.env as AnalyticsCloudflareEnv | undefined;
    const dataset = env?.FUNNEL_ANALYTICS;
    if (!dataset) return false;

    const trafficChannel = sanitizeTrafficChannel(event.trafficChannel);
    dataset.writeDataPoint({
      // Channel is the useful aggregate sampling key. The anonymous session
      // remains a dimension so events can be attributed without making every
      // row's sampling index unique.
      indexes: [trafficChannel],
      blobs: [
        event.name,
        sanitizeAnalyticsId(event.sessionId),
        sanitizeEventId(event.eventId),
        sanitizeAnalyticsPath(event.path),
        sanitizeAnalyticsPath(event.landingPath),
        sanitizeHostname(event.referrerHost),
        trafficChannel,
        sanitizeAnalyticsLabel(event.utmSource),
        sanitizeAnalyticsLabel(event.utmMedium),
        sanitizeAnalyticsLabel(event.utmCampaign),
        sanitizeOfferSlug(event.offerSlug),
        sanitizeAnalyticsLabel(event.placement),
        sanitizeAnalyticsLabel(event.outcome),
        sanitizeCurrency(event.currency),
        event.source,
        sanitizeAnalyticsLabel(env.CF_PAGES_BRANCH ?? "unknown"),
        sanitizeAnalyticsLabel(env.CF_PAGES_COMMIT_SHA, 64),
      ],
      doubles: [sanitizeValueCents(event.valueCents), 1],
    });
    return true;
  } catch {
    // Analytics must never break a page, checkout, or signed Stripe webhook.
    // getOptionalRequestContext throws in the Node development runtime, where
    // Analytics Engine bindings are unavailable by design.
    return false;
  }
}
