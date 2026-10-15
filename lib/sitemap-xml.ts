export type XmlSitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

/** Application sitemap rows: loc + lastmod only (no changefreq/priority hints). */
export type SitemapLoc = {
  url: string;
  lastModified: string;
};

export function normalizeSitemapUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Browser revalidates; the CDN keeps the last good document for an hour and
 * may serve it stale for a day while origin refreshes.
 *
 * Do not use `must-revalidate` here. Combined with `max-age=0` and no
 * `s-maxage`, Cloudflare treats the response as uncacheable
 * (`cf-cache-status: DYNAMIC`), so every Googlebot and Bingbot fetch runs
 * the Pages function. A transient function failure is then an HTTP 500.
 * `public/_headers` already asks for `s-maxage=3600`; the route header wins,
 * so this value has to carry the CDN TTL itself.
 */
export const SITEMAP_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export function sitemapXmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Render a urlset with loc + lastmod only (matches the live application sitemap). */
export function renderSitemapUrlset(entries: SitemapLoc[]): string {
  const urls = entries
    .map(
      (entry) => `<url>
<loc>${escapeXml(normalizeSitemapUrl(entry.url))}</loc>
<lastmod>${escapeXml(entry.lastModified)}</lastmod>
</url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * Worker-shaped urlset: loc + monthly changefreq, no lastmod.
 * Directory locs keep their trailing slash (`/born-on/`, `/compatibility/`).
 * `normalizeSitemapUrl` would strip that slash and disagree with the live maps.
 */
export function renderMonthlySitemap(locs: readonly string[]): string {
  const urls = locs
    .map(
      (loc) =>
        `<url><loc>${escapeXml(loc)}</loc><changefreq>monthly</changefreq></url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function sitemapUrlset(entries: XmlSitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) => `<url>
<loc>${escapeXml(normalizeSitemapUrl(entry.url))}</loc>
<lastmod>${escapeXml(entry.lastModified)}</lastmod>
<changefreq>${entry.changeFrequency}</changefreq>
<priority>${entry.priority.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}</priority>
</url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
