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
  // live lastmod instead of relying only on the birth-cards sitemap.
  for (const slug of allCardSlugs()) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}/birth-card/${slug}`),
      lastModified: date(CORE_UPDATED),
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  // The 366 birthday routes are built here (generateStaticParams) but NOT
  // listed: the cardology-unlock Worker in front of Pages 301s
  // /birth-card/[month]-[day] to its own /born-on/[month]-[day] pages
  // (curl-verified in production 2026-07-12), and those already have their
  // own Worker-served sitemap-cardology.xml. Re-add them here only if that
  // Worker redirect is removed.

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
