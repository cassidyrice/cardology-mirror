// Canonical site constants for SEO (metadata base, sitemap, canonicals).
// Override the domain at build time with NEXT_PUBLIC_SITE_URL if needed.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://cardblueprints.com"
).replace(/\/$/, "");

// App and marketing are served from the same host. APP_URL stays overridable
// via NEXT_PUBLIC_APP_URL but defaults to the main site.
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || SITE_URL
).replace(/\/$/, "");

export const SITE_NAME = "Card Blueprints";
export const CONTACT_EMAIL = "therealcassrice@gmail.com";

export const VIDEO_URL = (
  process.env.NEXT_PUBLIC_VIDEO_URL || "https://www.youtube.com/@cardologypro"
).replace(/\/$/, "");

export const VIDEO_PATH = "/videos";
export const READINGS_PATH = "/readings";

export const SITE_TAGLINE =
  "Personal Cardology readings, plus the free birth card calculator, all 52 card meanings, compatibility tools, and 52-card astrology.";

export const APP_PATHS = [
  "/today",
  "/self",
  "/timing",
  "/bonds",
  "/reading",
  "/story",
  "/journal",
  "/onboarding",
  "/access",
];

export const MARKETING_PATHS = [
  "/",
  "/about",
  "/videos",
  "/readings",
  "/try",
  "/blog",
  "/birth-card",
  "/birth-card-calculator",
  "/card-of-the-day",
  "/52-day-period-meaning-tool",
  "/birth-card-compatibility-calculator",
  "/cardology-compatibility",
  "/what-is-cardology",
  "/cartomancy-vs-tarot",
  "/how-to-read-playing-cards",
  "/playing-card-spreads",
  "/playing-card-spreads/three-card",
  "/playing-card-spreads/love",
  "/playing-card-spreads/yes-or-no",
  "/52-card-astrology-explained",
  "/birth-card-vs-ruling-card",
  "/methodology",
  "/editorial-policy",
  "/contact",
  "/shadow-karma-guide",
  "/privacy-policy",
  "/refund-policy",
  "/terms-of-service",
];

// Build an absolute URL for a path (always returns a clean absolute href).
export function abs(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}
