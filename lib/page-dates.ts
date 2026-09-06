import { MARKETING_PATHS } from "@/lib/site";

/** Fallback when a path has no explicit reviewed date (should not happen for marketing routes). */
export const FALLBACK_PAGE_UPDATED = "2026-07-12";

/**
 * ISO reviewed dates for marketing pages. Single source for visible "Updated"
 * bylines and sitemap lastmod — change here only.
 */
export const PAGE_UPDATED_DATES: Record<(typeof MARKETING_PATHS)[number], string> = {
  "/": "2026-09-01",
  "/about": "2026-08-17",
  "/videos": "2026-07-29",
  "/blog": "2026-07-12", // sitemap uses newest post date; value unused at runtime
  "/birth-card": "2026-08-15",
  "/birth-card-calculator": "2026-09-01",
  "/card-of-the-day": "2026-09-01",
  "/52-day-period-meaning-tool": "2026-07-30",
  "/birth-card-compatibility-calculator": "2026-09-01",
  "/cardology-compatibility": "2026-09-01",
  "/products/birth-card-deep-dive": "2026-09-01",
  "/free-course": "2026-08-07",
  "/what-is-cardology": "2026-09-01",
  "/cardology-for-beginners": "2026-08-07",
  "/cardology-vs-tarot": "2026-08-07",
  "/destiny-cards": "2026-08-15",
  "/cartomancy-vs-tarot": "2026-08-07",
  "/how-to-read-playing-cards": "2026-08-16",
  "/playing-card-spreads": "2026-09-01",
  "/52-card-astrology-explained": "2026-08-16",
  "/birth-card-vs-ruling-card": "2026-08-15",
  "/planetary-ruling-card": "2026-08-15",
  "/methodology": "2026-08-17",
  "/editorial-policy": "2026-08-06",
  "/contact": "2026-08-17",
  "/shadow-karma-guide": "2026-07-02",
  "/karma-cards": "2026-09-01",
  "/explore": "2026-09-04",
  "/content-engine": "2026-09-04",
  "/privacy-policy": "2026-09-01",
  "/refund-policy": "2026-08-06",
  "/terms-of-service": "2026-08-06",
};

/** Shared reviewed date for all 52 birth-card meaning pages (and Joker). */
export const CARD_MEANING_PAGES_UPDATED = "2026-09-06";

export function pageUpdatedForPath(path: string): string {
  return PAGE_UPDATED_DATES[path as keyof typeof PAGE_UPDATED_DATES] ?? FALLBACK_PAGE_UPDATED;
}
