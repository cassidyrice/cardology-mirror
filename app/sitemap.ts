import type { MetadataRoute } from "next";
import { allBlogPillars, allBlogPosts, blogPillarPath, blogPostPath, type BlogPost } from "@/lib/blog";
import { allCardSlugs } from "@/lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "@/lib/site";
import { sitemapDate } from "@/lib/sitemap-date";
import { normalizeSitemapUrl } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

const FALLBACK_UPDATED = "2026-07-12";
const CARD_MEANINGS_UPDATED = "2026-08-15";

const ROUTE_UPDATED: Record<string, string> = {
  "/": "2026-08-16",
  "/about": "2026-08-16",
  "/videos": "2026-07-29",
  "/birth-card": "2026-08-16",
  "/birth-card/joker": "2026-08-15",
  "/birth-card-calculator": "2026-08-16",
  "/card-of-the-day": "2026-08-15",
  "/52-day-period-meaning-tool": "2026-07-30",
  "/birth-card-compatibility-calculator": "2026-08-16",
  "/cardology-compatibility": "2026-08-16",
  "/products/personal-card-blueprint": "2026-08-12",
  "/products/analog-algorithm": "2026-08-08",
  "/products/complete-card-blueprint": "2026-08-16",
  "/free-course": "2026-08-07",
  "/what-is-cardology": "2026-08-16",
  "/cardology-for-beginners": "2026-08-12",
  "/cardology-vs-tarot": "2026-08-12",
  "/destiny-cards": "2026-08-15",
  "/cartomancy-vs-tarot": "2026-08-07",
  "/how-to-read-playing-cards": "2026-08-16",
  "/playing-card-spreads": "2026-08-16",
  "/playing-card-spreads/three-card": "2026-08-16",
  "/playing-card-spreads/love": "2026-08-16",
  "/playing-card-spreads/yes-or-no": "2026-08-16",
  "/52-card-astrology-explained": "2026-08-16",
  "/birth-card-vs-ruling-card": "2026-08-15",
  "/planetary-ruling-card": "2026-08-15",
  "/methodology": "2026-08-16",
  "/editorial-policy": "2026-08-06",
  "/contact": "2026-08-12",
  "/shadow-karma-guide": "2026-07-02",
  "/privacy-policy": "2026-08-12",
  "/refund-policy": "2026-08-12",
  "/terms-of-service": "2026-08-12",
};

function updatedForPath(path: string): string {
  return ROUTE_UPDATED[path] ?? FALLBACK_UPDATED;
}

function postModified(post: BlogPost): string {
  return post.dateModified || post.datePublished;
}

function latestOf(values: string[]): string {
  return values.reduce((max, value) => (value > max ? value : max), "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allBlogPosts();
  const latestPostDate = latestOf(posts.map(postModified)) || FALLBACK_UPDATED;

  const entries: MetadataRoute.Sitemap = MARKETING_PATHS.map((p) => ({
    url: normalizeSitemapUrl(`${SITE_URL}${p}`),
    // /blog is an index of the posts, so its truthful lastmod is the newest
    // post date (the daily generator moves it); every other marketing page
    // only changes when a deploy actually changes it.
    lastModified: sitemapDate(p === "/blog" ? latestPostDate : updatedForPath(p)),
  }));

  // The 52 card pages are the site's core SEO asset. This is their ONLY
  // listing: the separate sitemap-birth-cards.xml was retired 2026-07-12
  // because it duplicated these URLs with a conflicting lastmod.
  for (const slug of allCardSlugs()) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}/birth-card/${slug}`),
      lastModified: sitemapDate(CARD_MEANINGS_UPDATED),
    });
  }

  // The Joker is not one of the 52 (Dec 31 resolves to solar value 0), so it is
  // absent from allCardSlugs() — but it is a real public page and the only
  // answer we have for "december 31 birth card".
  entries.push({
    url: normalizeSitemapUrl(`${SITE_URL}/birth-card/joker`),
    lastModified: sitemapDate(updatedForPath("/birth-card/joker")),
  });

  // The 366 birthday routes are deliberately NOT listed (and no longer
  // prerendered): the cardology-unlock Worker in front of Pages 301s
  // /birth-card/[month]-[day] to its own /born-on/[month]-[day] pages
  // (curl-verified in production 2026-07-12), and those already have their
  // own Worker-served sitemap-cardology.xml. Re-add them here only if that
  // Worker redirect is removed.

  // Pillar hubs are indexes of their posts: a hub truthfully changes when its
  // newest post does.
  for (const pillar of allBlogPillars()) {
    const pillarDates = posts.filter((post) => post.pillar === pillar.slug).map(postModified);
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}${blogPillarPath(pillar)}`),
      lastModified: sitemapDate(latestOf(pillarDates) || latestPostDate),
    });
  }

  // Each post carries its own real datePublished/dateModified (hand-set for
  // the core posts, generator-stamped for daily posts) — never a site-wide
  // constant that fakes freshness.
  for (const post of posts) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}${blogPostPath(post)}`),
      lastModified: sitemapDate(postModified(post)),
    });
  }

  return entries;
}
