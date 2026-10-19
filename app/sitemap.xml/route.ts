// Application sitemap, prerendered at build time like app/feed.xml/route.ts.
// Invalid source dates fall back, and the response permits shared-cache reuse.

import { renderApplicationSitemapXml } from "@/lib/application-sitemap";
import { sitemapXmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

export function GET(): Response {
  return sitemapXmlResponse(renderApplicationSitemapXml());
}
