// Canonical site constants for SEO (metadata base, sitemap, canonicals).
// Override the domain at build time with NEXT_PUBLIC_SITE_URL if needed.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://cardologypro.com"
).replace(/\/$/, "");

// App and marketing are served from the same host. APP_URL stays overridable
// via NEXT_PUBLIC_APP_URL but defaults to the main site.
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || SITE_URL
).replace(/\/$/, "");

export const SITE_NAME = "Cardology Pro";

export const SITE_TAGLINE =
  "Birth card calculator, meanings, compatibility, and 52-card astrology.";

export const APP_PATHS = [
  "/today",
  "/self",
  "/timing",
  "/bonds",
  "/reading",
  "/story",
  "/journal",
  "/onboarding",
];

export const MARKETING_PATHS = [
  "/",
  "/birth-card",
  "/birth-card-calculator",
  "/52-day-period-meaning-tool",
  "/birth-card-compatibility-calculator",
  "/cardology-compatibility",
  "/what-is-cardology",
  "/52-card-astrology-explained",
  "/birth-card-vs-ruling-card",
  "/cardology-agent-instructions",
];

// Build an absolute URL for a path (always returns a clean absolute href).
export function abs(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}
