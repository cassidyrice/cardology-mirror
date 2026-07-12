import type { MetadataRoute } from "next";
import { APP_PATHS, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Anchor "/reading" with $ so it doesn't prefix-match "/readings"
        // (the public sales page, which must stay indexable).
        disallow: [
          "/api/",
          "/checkout/success",
          ...APP_PATHS.map((p) => (p === "/reading" ? "/reading$" : p)),
        ],
      },
    ],
    // Exactly the sitemaps that exist in production, nothing else:
    // - sitemap.xml is built by this app and is the single listing of every
    //   mirror URL (marketing pages, 52 card pages, blog). The old
    //   sitemap-birth-cards.xml was retired 2026-07-12 — it duplicated the 52
    //   card URLs with a conflicting lastmod.
    // - sitemap-cardology.xml (367 /born-on/ pages) and
    //   sitemap-compatibility.xml (1,431 /compatibility/ pages) are served by
    //   the cardology-unlock Worker in front of Pages — they are NOT in this
    //   repo but are live in production (curl-verified 2026-07-12).
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-cardology.xml`,
      `${SITE_URL}/sitemap-compatibility.xml`,
    ],
  };
}
