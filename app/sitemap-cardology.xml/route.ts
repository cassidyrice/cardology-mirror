// Birthday sitemap (367 /born-on/ URLs). Previously generated on every
// request by the cardology-unlock Worker, which left Cloudflare with no
// cached copy (no cf-cache-status). A cold or busy isolate returned HTTP 500
// while the homepage stayed 200. This route prerenders the same urlset and
// lets the CDN keep it. The Worker route must be removed (see
// ops/cardology-unlock-routes.jsonc) or it keeps shadowing this file.

import { renderCardologySitemapXml } from "@/lib/worker-sitemaps";
import { sitemapXmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

export function GET(): Response {
  return sitemapXmlResponse(renderCardologySitemapXml());
}
