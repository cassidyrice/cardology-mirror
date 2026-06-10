import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// /api/ stays disallowed. App surfaces (/journal, /reading, /onboarding,
// /bonds, /today, /self, /timing, /story) are intentionally NOT disallowed
// here: they carry a noindex meta tag instead, and crawlers must be able to
// fetch a page to see its noindex. Disallow + noindex is contradictory.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
