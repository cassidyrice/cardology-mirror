/** First-party analytics consent. Default is denied until an explicit choice. */

export const CONSENT_STORAGE_KEY = "cb_privacy_v1";
export const CONSENT_EVENT = "cb:privacy-consent";

export type PrivacyConsent = "denied" | "granted";

export function readPrivacyConsent(): PrivacyConsent {
  if (typeof window === "undefined") return "denied";
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted"
      ? "granted"
      : "denied";
  } catch {
    return "denied";
  }
}

export function writePrivacyConsent(value: PrivacyConsent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Ignore storage failures; analytics stays gated.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Must run before any gtag config / event when the tag is present. */
export function buildConsentDefaultSnippet(): string {
  return [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "window.gtag = window.gtag || gtag;",
    "gtag('consent', 'default', {",
    "  ad_storage: 'denied',",
    "  ad_user_data: 'denied',",
    "  ad_personalization: 'denied',",
    "  analytics_storage: 'denied',",
    "  wait_for_update: 500",
    "});",
  ].join("\n");
}
