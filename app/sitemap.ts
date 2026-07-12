import type { MetadataRoute } from "next";
import { allBlogPillars, allBlogPosts, blogPillarPath, blogPostPath, type BlogPost } from "@/lib/blog";
import { allCardSlugs } from "@/lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "@/lib/site";
import { normalizeSitemapUrl } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

// Date of the last deploy that materially changed the marketing and card
// pages (2026-07-12: video embeds + internal-link rework on the card pages,
// sitewide chrome changes). Only move this alongside a real content change —
// a lastmod that moves without a diff teaches crawlers to distrust the whole
// sitemap. Blog URLs never use this constant; they carry their own real
// per-post dates below.
const CORE_UPDATED = "2026-07-12";

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function postModified(post: BlogPost): string {
  return post.dateModified || post.datePublished;
}

function latestOf(values: string[]): string {
  return values.reduce((max, value) => (value > max ? value : max), "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allBlogPosts();
  const latestPostDate = latestOf(posts.map(postModified)) || CORE_UPDATED;

  const entries: MetadataRoute.Sitemap = MARKETING_PATHS.map((p) => ({
    url: normalizeSitemapUrl(`${SITE_URL}${p}`),
    // /blog is an index of the posts, so its truthful lastmod is the newest
    // post date (the daily generator moves it); every other marketing page
    // only changes when a deploy actually changes it.
    lastModified: date(p === "/blog" ? latestPostDate : CORE_UPDATED),
    // /card-of-the-day is edge-rendered per request and rotates its card at
    // midnight America/Denver — genuinely daily, like the homepage.
    changeFrequency: p === "/" || p === "/card-of-the-day" ? "daily" : "weekly",
    priority: p === "/" ? 1 : p === "/readings" ? 0.95 : p === "/birth-card" || p === "/birth-card-calculator" ? 0.9 : p === "/blog" || p === "/card-of-the-day" ? 0.85 : 0.8,
  }));

  // The 52 card pages are the site's core SEO asset. This is their ONLY
  // listing: the separate sitemap-birth-cards.xml was retired 2026-07-12
  // because it duplicated these URLs with a conflicting lastmod.
  for (const slug of allCardSlugs()) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}/birth-card/${slug}`),
      lastModified: date(CORE_UPDATED),
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

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
      lastModified: date(latestOf(pillarDates) || latestPostDate),
      changeFrequency: "weekly",
      priority: 0.78,
    });
  }

  // Each post carries its own real datePublished/dateModified (hand-set for
  // the core posts, generator-stamped for daily posts) — never a site-wide
  // constant that fakes freshness.
  for (const post of posts) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}${blogPostPath(post)}`),
      lastModified: date(postModified(post)),
      changeFrequency: "monthly",
      priority: 0.72,
    });
  }

  return entries;
}
