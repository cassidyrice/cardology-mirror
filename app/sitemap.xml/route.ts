// Application sitemap. Statically generated at build time (same pattern as
// app/feed.xml/route.ts). The XML string is built once per isolate from
// YYYY-MM-DD lastmod values. A bad date falls back instead of throwing, so
// it cannot become the uncaught Invalid Date → HTTP 500 from CAR-20 / CAR-58.
//
// Cache-Control includes s-maxage. `max-age=0, must-revalidate` made
// Cloudflare skip the cache (`cf-cache-status: DYNAMIC`) and run this
// function for every crawler. A transient failure was then a 500.

import { renderApplicationSitemapXml } from "@/lib/application-sitemap";
import { sitemapXmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

export function GET(): Response {
  return sitemapXmlResponse(renderApplicationSitemapXml());
}
