import type { MetadataRoute } from "next";
import { MARKETING_PATHS, SITE_URL } from "@/lib/site";
import { allBirthdateSlugs, allCardSlugs } from "@/lib/seo-cards";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = MARKETING_PATHS.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "/" ? "daily" : "weekly",
    priority: p === "/" ? 1 : p === "/birth-card" || p === "/birth-card-calculator" ? 0.9 : 0.8,
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
