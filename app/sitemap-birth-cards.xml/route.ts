import { SITE_URL } from "@/lib/site";
import { allCardSlugs } from "@/lib/seo-cards";
import { sitemapUrlset } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

const BIRTH_CARD_UPDATED = "2026-06-17";

export function GET(): Response {
  const body = sitemapUrlset(
    allCardSlugs().map((slug) => ({
      url: `${SITE_URL}/birth-card/${slug}`,
      lastModified: BIRTH_CARD_UPDATED,
      changeFrequency: "monthly",
      priority: 0.75,
    })),
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
