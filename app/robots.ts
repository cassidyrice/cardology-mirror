import type { MetadataRoute } from "next";
import { ROBOTS_SITEMAP_PATHS, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // App and checkout pages publish route-level `noindex` metadata. They
        // must remain crawlable so search engines can read that directive;
        // robots.txt is not an access-control boundary.
        disallow: ["/api/"],
      },
    ],
    // Exactly the sitemaps that exist in production, nothing else:
    // - sitemap.xml lists mirror URLs (marketing pages, 52 card pages, blog).
    //   The old sitemap-birth-cards.xml was retired 2026-07-12 — it duplicated
    //   the 52 card URLs with a conflicting lastmod.
    // - sitemap-cardology.xml (367 /born-on/ pages) and
    //   sitemap-compatibility.xml (1,431 /compatibility/ pages) are prerendered
    //   by this app. Until the cardology-unlock Worker routes for those two
    //   paths are removed, the Worker still answers them in production.
    sitemap: ROBOTS_SITEMAP_PATHS.map((path) => `${SITE_URL}${path}`),
  };
}
