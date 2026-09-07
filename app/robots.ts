import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Sitemap file stems for the isolated birth-card directory hubs, first the ten
 * in the site footer and then the thirteen directory packs. These are file
 * names, not URL prefixes: /olympics/summer publishes sitemap-olympics-summer,
 * /grammys/aoty publishes the singular sitemap-grammy-aoty, and /pulitzer/fiction
 * publishes sitemap-pulitzer-fiction, so the stem cannot be derived from the
 * prefix. Keep in sync with `HUBS` in
 * cardblueprints-workers/path-split/worker.js — a hub listed here but not
 * routed there advertises a sitemap that 404s.
 */
const HUB_SITEMAPS = [
  "senators",
  "governors",
  "cabinet",
  "scotus",
  "signers",
  "nobel",
  "mlb",
  "parks",
  "states",
  "holidays",
  "olympics-summer",
  "olympics-winter",
  "tonys",
  "oscars",
  "emmys",
  "grammy-aoty",
  "nfl-hof",
  "rock-hall",
  "pulitzer-fiction",
  "house-chairs",
  "kennedy-center-honors",
  "time-person-of-the-year",
  "astronauts",
] as const;

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
    // - sitemap.xml is built by this app and is the single listing of every
    //   mirror URL (marketing pages, 52 card pages, blog). The old
    //   sitemap-birth-cards.xml was retired 2026-07-12 — it duplicated the 52
    //   card URLs with a conflicting lastmod.
    // - sitemap-cardology.xml (367 /born-on/ pages) and
    //   sitemap-compatibility.xml (1,431 /compatibility/ pages) are served by
    //   the cardology-unlock Worker in front of Pages — they are NOT in this
    //   repo but are live in production (curl-verified 2026-07-12).
    // - The twenty-three sitemap-{stem}.xml files below belong to the isolated
    //   birth-card directory hubs and packs. Each is built in seo-pages/ and
    //   served from its own Cloudflare Pages project through the
    //   cardblueprints-path-split Worker, which routes both the hub prefix and
    //   the exact sitemap path.
    //   They are NOT in this app's sitemap.xml. Add a line here only after
    //   `curl -sI https://cardblueprints.com/sitemap-{hub}.xml` returns 200.
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-cardology.xml`,
      `${SITE_URL}/sitemap-compatibility.xml`,
      ...HUB_SITEMAPS.map((stem) => `${SITE_URL}/sitemap-${stem}.xml`),
    ],
  };
}
