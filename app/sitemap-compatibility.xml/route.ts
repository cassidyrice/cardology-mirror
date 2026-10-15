// Compatibility sitemap (1,431 /compatibility/ URLs). Same failure class as
// /sitemap-cardology.xml: the Worker rebuilt ~179KB of XML on every fetch
// and did not leave an edge cache, so a busy isolate became HTTP 500.
// Prerendered here. The Worker route must be removed or it shadows this file.

import { renderCompatibilitySitemapXml } from "@/lib/worker-sitemaps";
import { sitemapXmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

export function GET(): Response {
  return sitemapXmlResponse(renderCompatibilitySitemapXml());
}
