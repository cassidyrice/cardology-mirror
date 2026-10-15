const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Reviewed-date fallback. Matches `FALLBACK_PAGE_UPDATED` in page-dates.ts. */
export const SITEMAP_DAY_FALLBACK = "2026-07-12";

export function sitemapDate(value: string): Date {
  if (!ISO_DAY.test(value)) {
    throw new RangeError(`Invalid sitemap date: ${value}`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`Invalid sitemap date: ${value}`);
  }

  return parsed;
}

/**
 * YYYY-MM-DD for a sitemap lastmod. A bad value (empty, unpadded, or a
 * calendar rollover such as 2026-02-30) becomes the fallback instead of
 * throwing. One bad blog date must not take down the whole route — that
 * uncaught RangeError is the CAR-20 / CAR-58 500.
 */
export function sitemapDayOrFallback(value: string | undefined | null): string {
  if (typeof value === "string" && value.length > 0) {
    try {
      return sitemapDate(value).toISOString().slice(0, 10);
    } catch {
      // Fall through to the known-good day.
    }
  }
  return SITEMAP_DAY_FALLBACK;
}
