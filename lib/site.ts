// Canonical site constants for SEO (metadata base, sitemap, canonicals).
// Override the domain at build time with NEXT_PUBLIC_SITE_URL if needed.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://cardologypro.com"
).replace(/\/$/, "");

export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://app.cardologypro.com"
).replace(/\/$/, "");

export const SITE_NAME = "Cardology Pro";

export const SITE_TAGLINE =
  "Your Cardology birth card as a mirror, not a forecast.";

export const APP_PATHS = [
  "/today",
  "/self",
  "/timing",
  "/bonds",
  "/journal",
  "/onboarding",
];

export const MARKETING_PATHS = [
  "/",
  "/birth-card",
  "/birth-card-calculator",
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
