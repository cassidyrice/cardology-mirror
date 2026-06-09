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

// Build an absolute URL for a path (always returns a clean absolute href).
export function abs(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}
