/**
 * PostHog helpers. The project token is public by design (same class as GA).
 * Personal API keys must never land in client code or committed files.
 */

import {
  sanitizeGaEventParams,
  sanitizeGaPageLocation,
  type GaEventParams,
} from "@/lib/ga4";

export const DEFAULT_POSTHOG_KEY =
  "phc_sfewE8AhhqBfV8vCkMtjMRqdvoDvbeG3ygkZCTTBKVZ5";
export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
export const POSTHOG_UI_HOST = "https://us.posthog.com";

const PROJECT_TOKEN_PATTERN = /^phc_[A-Za-z0-9]+$/;
const HOST_PATTERN = /^https:\/\/[a-z0-9.-]+$/i;
const URL_KEYS = new Set([
  "$current_url",
  "$pathname",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
  "$session_entry_url",
]);

export function resolvePosthogKey(
  value: string | undefined | null = process.env.NEXT_PUBLIC_POSTHOG_KEY,
): string {
  const candidate = (value ?? "").trim() || DEFAULT_POSTHOG_KEY;
  return PROJECT_TOKEN_PATTERN.test(candidate)
    ? candidate
    : DEFAULT_POSTHOG_KEY;
}

export function resolvePosthogHost(
  value: string | undefined | null = process.env.NEXT_PUBLIC_POSTHOG_HOST,
): string {
  const candidate = (value ?? "").trim().replace(/\/+$/, "") || DEFAULT_POSTHOG_HOST;
  return HOST_PATTERN.test(candidate) ? candidate : DEFAULT_POSTHOG_HOST;
}

/** Origin + pathname only. Query strings and hashes never leave the browser. */
export function sanitizePosthogPageUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, "https://cardblueprints.com");
    const path = sanitizeGaPageLocation(url.pathname) || "/";
    return `${url.origin}${path}`;
  } catch {
    return "https://cardblueprints.com/";
  }
}

export function sanitizePosthogProperties(
  properties: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  if (!properties) return {};
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    if (URL_KEYS.has(key) && typeof value === "string") {
      next[key] =
        key === "$pathname"
          ? sanitizeGaPageLocation(value)
          : sanitizePosthogPageUrl(value);
      continue;
    }
    if (key === "$referring_domain" && typeof value === "string") {
      try {
        next[key] = new URL(
          value.includes("://") ? value : `https://${value}`,
        ).hostname.toLowerCase();
      } catch {
        // Drop unparseable referrer hosts.
      }
      continue;
    }
    const cleaned = sanitizeGaEventParams({ [key]: value as GaEventParams[string] });
    if (key in cleaned) next[key] = cleaned[key];
  }
  return next;
}
