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
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-birth-cards.xml`],
  };
}
