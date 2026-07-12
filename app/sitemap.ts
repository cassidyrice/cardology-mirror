import type { MetadataRoute } from "next";
import { allBlogPaths, BLOG_UPDATED } from "@/lib/blog";
import { allCardSlugs } from "@/lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "@/lib/site";
import { normalizeSitemapUrl } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

const CORE_UPDATED = "2026-07-12";

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = MARKETING_PATHS.map((p) => ({
    url: normalizeSitemapUrl(`${SITE_URL}${p}`),
    lastModified: date(CORE_UPDATED),
    changeFrequency: p === "/" ? "daily" : "weekly",
    priority: p === "/" ? 1 : p === "/readings" ? 0.95 : p === "/birth-card" || p === "/birth-card-calculator" ? 0.9 : p === "/blog" ? 0.85 : 0.8,
  }));

  // The 52 card pages are the site's core SEO asset; list them here with a
  // live lastmod instead of relying only on the static birth-cards sitemap.
  // The 366 birthdate slugs are NOT listed: production 301s
  // /birth-card/[date] to the Worker-served /born-on/[date] pages, which
  // have their own sitemap.
  for (const slug of allCardSlugs()) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}/birth-card/${slug}`),
      lastModified: date(CORE_UPDATED),
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  for (const path of allBlogPaths().filter((p) => p !== "/blog")) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}${path}`),
      lastModified: date(BLOG_UPDATED),
      changeFrequency: path.startsWith("/blog/pillar/") ? "weekly" : "monthly",
      priority: path.startsWith("/blog/pillar/") ? 0.78 : 0.72,
    });
  }

  return entries;
}
