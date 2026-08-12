"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  FUNNEL_COOKIE_NAME,
  inferTrafficChannel,
  type ClientFunnelEventName,
  type FunnelContext,
  type TrafficChannel,
} from "@/lib/analytics";
import { mapFunnelEventToGa4 } from "@/lib/ga4";
import { sendGaEvent } from "@/components/analytics/GoogleAnalytics";

const ENDPOINT = "/api/analytics";
const SESSION_ID_KEY = "cardblueprints.analytics.session";
const ATTRIBUTION_KEY = "cardblueprints.analytics.attribution";
/** First-party cookie mirror of sessionStorage attribution for checkout POST fallback. */
export const FUNNEL_COOKIE = FUNNEL_COOKIE_NAME;
const ONCE_KEY_PREFIX = "cardblueprints.analytics.once.";
// Active public offers: checkout review + product-page intent.
const OFFER_PATH =
  /^\/(checkout|products)\/(personal-card-blueprint|analog-algorithm)\/?$/;

type Attribution = {
  sessionId: string;
  landingPath: string;
  referrerHost: string;
  trafficChannel: TrafficChannel;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

export function AnalyticsCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const attribution = getAttribution();

    if (
      attribution.trafficChannel === "organic" &&
      markOnce("organic_landing")
    ) {
      sendEvent("organic_landing");
    }


    const offerMatch = pathname.match(OFFER_PATH);
    if (offerMatch && markOnce(`offer_selected.${offerMatch[2]}`)) {
      sendEvent("offer_selected", { offerSlug: offerMatch[2] });
    }
  }, [pathname]);

  useEffect(() => {
    function attachCheckoutAttribution(event: SubmitEvent) {
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) return;
      if (!target.matches("form[data-analytics-checkout]")) return;

      const fields = getCheckoutAnalyticsFields();
      for (const [name, value] of Object.entries(fields)) {
        setHiddenField(target, name, value);
      }
    }

    document.addEventListener("submit", attachCheckoutAttribution, true);
    return () => {
      document.removeEventListener("submit", attachCheckoutAttribution, true);
    };
  }, []);

  return null;
}

/** Hidden-field payload for checkout session POST (also mirrored to a cookie). */
export function getCheckoutAnalyticsFields(): Record<string, string> {
  const attribution = getAttribution();
  return {
    analytics_session_id: attribution.sessionId,
    analytics_landing_path: attribution.landingPath,
    analytics_referrer_host: attribution.referrerHost,
    analytics_traffic_channel: attribution.trafficChannel,
    analytics_utm_source: attribution.utmSource,
    analytics_utm_medium: attribution.utmMedium,
    analytics_utm_campaign: attribution.utmCampaign,
  };
}

export function trackClientFunnelEvent(
  name: ClientFunnelEventName,
  context: FunnelContext = {},
) {
  sendEvent(name, context);
}

export function trackClientFunnelEventOnce(
  name: ClientFunnelEventName,
  context: FunnelContext = {},
) {
  // Keyed on name + placement, not name alone. Two CTAs for the same event on
  // one page are distinct measurements; keying on the name let the first one
  // fired silently suppress every other placement for the rest of the tab.
  const onceKey = context.placement ? `${name}:${context.placement}` : name;
  if (markOnce(onceKey)) sendEvent(name, context);
}

function sendEvent(name: ClientFunnelEventName, context: FunnelContext = {}) {
  if (typeof window === "undefined") return;
  const attribution = getAttribution();
  const payload = JSON.stringify({
    eventName: name,
    eventId: createId(),
    sessionId: attribution.sessionId,
    path: window.location.pathname,
    landingPath: attribution.landingPath,
    referrerHost: attribution.referrerHost,
    trafficChannel: attribution.trafficChannel,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    offerSlug: context.offerSlug ?? "",
    placement: context.placement ?? "",
    outcome: context.outcome ?? "",
  });

  const gaEvent = mapFunnelEventToGa4(name);
  sendGaEvent(gaEvent.eventName, {
    ...gaEvent.params,
    offer_slug: context.offerSlug,
    placement: context.placement,
    traffic_channel: attribution.trafficChannel,
  });

  if (
    navigator.sendBeacon &&
    navigator.sendBeacon(
      ENDPOINT,
      new Blob([payload], { type: "application/json" }),
    )
  ) {
    return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}

function getAttribution(): Attribution {
  const fallback: Attribution = {
    sessionId: createId(),
    landingPath:
      typeof window === "undefined" ? "/" : window.location.pathname,
    referrerHost: "",
    trafficChannel: "unknown",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  };
  if (typeof window === "undefined") return fallback;

  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      const attribution = JSON.parse(stored) as Attribution;
      persistFunnelCookie(attribution);
      return attribution;
    }

    const params = new URLSearchParams(window.location.search);
    const referrerHost = referrerHostname(document.referrer);
    const utmSource = cleanLabel(params.get("utm_source"));
    const utmMedium = cleanLabel(params.get("utm_medium"));
    const utmCampaign = cleanLabel(params.get("utm_campaign"));
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY) ?? createId();
    const attribution: Attribution = {
      sessionId,
      landingPath: window.location.pathname,
      referrerHost,
      trafficChannel: inferTrafficChannel({
        referrerHost,
        currentHost: window.location.hostname,
        utmSource,
        utmMedium,
      }),
      utmSource,
      utmMedium,
      utmCampaign,
    };
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    persistFunnelCookie(attribution);
    return attribution;
  } catch {
    return fallback;
  }
}

function persistFunnelCookie(attribution: Attribution) {
  if (typeof document === "undefined") return;
  try {
    const payload = encodeURIComponent(
      JSON.stringify({
        sessionId: attribution.sessionId,
        landingPath: attribution.landingPath,
        referrerHost: attribution.referrerHost,
        trafficChannel: attribution.trafficChannel,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
      }),
    );
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${FUNNEL_COOKIE}=${payload}; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
  } catch {
    // Cookie write is best-effort; form fields remain the primary path.
  }
}

function referrerHostname(value: string): string {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase().slice(0, 120);
  } catch {
    return "";
  }
}

function markOnce(name: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `${ONCE_KEY_PREFIX}${name}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

function setHiddenField(form: HTMLFormElement, name: string, value: string) {
  const existing = form.elements.namedItem(name);
  let input: HTMLInputElement;
  if (existing instanceof HTMLInputElement) {
    input = existing;
  } else {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}

function cleanLabel(value: string | null): string {
  return (value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 80);
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (
      Number(character) ^
      (Math.floor(Math.random() * 256) & (15 >> (Number(character) / 4)))
    ).toString(16),
  );
}
