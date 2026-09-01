"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

import {
  CONSENT_EVENT,
  readPrivacyConsent,
  type PrivacyConsent,
} from "@/lib/consent";
import {
  POSTHOG_UI_HOST,
  resolvePosthogHost,
  resolvePosthogKey,
  sanitizePosthogPageUrl,
  sanitizePosthogProperties,
} from "@/lib/posthog";

export function PostHogBoundary({
  apiKey,
  host,
}: {
  apiKey: string;
  host: string;
}) {
  const pathname = usePathname();
  const lastPage = useRef("");
  const started = useRef(false);

  useEffect(() => {
    function sync(consent: PrivacyConsent) {
      try {
        if (consent === "granted") {
          startPosthog(apiKey, host);
          started.current = true;
          return;
        }
        if (started.current || posthog.__loaded) {
          posthog.opt_out_capturing();
          posthog.reset();
        }
      } catch {
        // Consent UI must not break if the SDK throws.
      }
    }

    sync(readPrivacyConsent());
    function onChange(event: Event) {
      const detail = (event as CustomEvent<PrivacyConsent>).detail;
      sync(detail === "granted" ? "granted" : readPrivacyConsent());
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, [apiKey, host]);

  useEffect(() => {
    const sendPageView = () => {
      if (readPrivacyConsent() !== "granted") return false;
      if (!posthog.__loaded) return false;
      const page = sanitizePosthogPageUrl(window.location.href);
      if (!page || page === lastPage.current) return false;
      lastPage.current = page;
      posthog.capture("$pageview", { $current_url: page });
      return true;
    };

    if (sendPageView()) return;

    const interval = window.setInterval(() => {
      if (sendPageView()) window.clearInterval(interval);
    }, 50);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 3000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}

export function sendPosthogEvent(
  name: string,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  if (readPrivacyConsent() !== "granted") return;
  if (!posthog.__loaded) return;
  posthog.capture(name, sanitizePosthogProperties(properties));
}

function startPosthog(apiKey: string, host: string) {
  const key = resolvePosthogKey(apiKey);
  const apiHost = resolvePosthogHost(host);
  if (posthog.__loaded) {
    posthog.opt_in_capturing();
    return;
  }
  posthog.init(key, {
    api_host: apiHost,
    ui_host: POSTHOG_UI_HOST,
    defaults: "2025-11-30",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ["click"],
      element_allowlist: ["a", "button"],
    },
    disable_session_recording: true,
    persistence: "localStorage+cookie",
    sanitize_properties: (properties) =>
      sanitizePosthogProperties(properties as Record<string, unknown>),
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "input, textarea, [data-sensitive]",
    },
  });
}
