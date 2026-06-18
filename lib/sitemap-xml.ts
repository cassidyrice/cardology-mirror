export type XmlSitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

export function normalizeSitemapUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
