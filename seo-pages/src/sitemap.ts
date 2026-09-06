import { SITE_URL } from "./types";
import { abs } from "./urls";

export function renderSitemapIndex(childPaths: readonly string[]): string {
  const body = childPaths
    .map(
      (path) => `  <sitemap>
    <loc>${escapeXml(abs(path))}</loc>
  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function renderUrlset(paths: readonly string[]): string {
  const body = paths
    .map(
      (path) => `  <url>
    <loc>${escapeXml(abs(path))}</loc>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function renderRobotsTxt(): string {
  return `# Isolated celebrity SEO scaffold (WP4).
# Do not publish this file as the origin robots.txt on cardblueprints.com.
# Production robots.txt stays on the Next.js app until a Worker merges
# sitemap pointers. This stub is for the isolated Pages preview only.

User-agent: *
Allow: /birth-card/
Allow: /card/
Allow: /birthday/
Allow: /today

# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-celeb.xml
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
