// Ported from the cardology-unlock Worker: byte-identical XML to what it served.
import { renderCompatSitemap } from "@/lib/worker-port/cardology-unlock.mjs";

export const dynamic = "force-static";

export function GET(): Response {
  const body = renderCompatSitemap();
  if (!body.includes("<url>") || !body.includes("</urlset>")) {
    throw new Error("sitemap-compatibility.xml is empty or malformed");
  }
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
