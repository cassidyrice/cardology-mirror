import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allBirthdateSlugs, allCardSlugs } from "@/lib/seo-cards";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "/",
    "/birth-card",
    "/birth-card-calculator",
    "/52-day-period-meaning-tool",
    "/cardology-compatibility",
    "/birth-card-compatibility-calculator",
    "/what-is-cardology",
    "/52-card-astrology-explained",
    "/birth-card-vs-ruling-card",
    "/cardology-agent-instructions",
    "/today",
    "/self",
    "/timing",
    "/bonds",
    "/reading",
    "/story",
    "/journal",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "/" ? "daily" : "weekly",
    priority: p === "/" ? 1 : 0.8,
  }));

  for (const slug of allCardSlugs()) {
    entries.push({
      url: `${SITE_URL}/birth-card/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    });
  }

  for (const slug of allBirthdateSlugs()) {
    entries.push({
      url: `${SITE_URL}/birth-card/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    });
  }

  return entries;
}
