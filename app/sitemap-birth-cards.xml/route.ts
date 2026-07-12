// Dedicated birth-card sitemap: the 52 card-meaning pages under
// /birth-card/. Statically generated at build time from the same data source
// the pages themselves use (lib/seo-cards), replacing the hand-maintained
// public/sitemap-birth-cards.xml that had gone stale. The URL is kept alive
// because robots.txt and public/llms*.txt advertise it.
//
// The 366 birthday routes are deliberately NOT listed: the cardology-unlock
// Worker in front of Pages 301s /birth-card/[month]-[day] to its
// /born-on/[month]-[day] pages (curl-verified in production 2026-07-12),
// which have their own Worker-served sitemap-cardology.xml. Re-add them only
// if that redirect is removed.

import { allCardSlugs } from "@/lib/seo-cards";
import { SITE_URL } from "@/lib/site";
import { sitemapUrlset, type XmlSitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

const SEO_UPDATED = "2026-07-12";

export function GET(): Response {
  const entries: XmlSitemapEntry[] = [
    ...allCardSlugs().map((slug) => ({
      url: `${SITE_URL}/birth-card/${slug}`,
      lastModified: SEO_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];

  return new Response(sitemapUrlset(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
