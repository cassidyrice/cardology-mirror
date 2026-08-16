const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

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
