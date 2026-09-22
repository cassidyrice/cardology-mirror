// Application sitemap. Statically generated at build time (same pattern as
// app/feed.xml/route.ts). We own the XML serialization here — string YYYY-MM-DD
// lastmod values — so a bad Date never reaches Next's MetadataRoute resolver
// (which calls Date.toISOString() and turns Invalid Date into an uncaught 500).

import { renderApplicationSitemapXml } from "@/lib/application-sitemap";

export const dynamic = "force-static";

export function GET(): Response {
  // Force evaluation before Response construction so a generation throw fails
  // the build / request loudly instead of producing a half-written body.
  const body = renderApplicationSitemapXml();
  if (!body.includes("<url>") || !body.includes("</urlset>")) {
    throw new Error("application sitemap XML is empty or malformed");
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
