import type { MetadataRoute } from "next";
import { allBlogPillars, allBlogPosts, blogPillarPath, blogPostPath, type BlogPost } from "@/lib/blog";
import {
  CARD_MEANING_PAGES_UPDATED,
  pageUpdatedForPath,
} from "@/lib/page-dates";
import { allCardSlugs } from "@/lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "@/lib/site";
import { sitemapDate } from "@/lib/sitemap-date";
import { normalizeSitemapUrl } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

function postModified(post: BlogPost): string {
  return post.dateModified || post.datePublished;
}

function latestOf(values: string[]): string {
  return values.reduce((max, value) => (value > max ? value : max), "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allBlogPosts();
  const latestPostDate = latestOf(posts.map(postModified)) || pageUpdatedForPath("/blog");

  const entries: MetadataRoute.Sitemap = MARKETING_PATHS.map((p) => ({
    url: normalizeSitemapUrl(`${SITE_URL}${p}`),
    // /blog is an index of the posts, so its truthful lastmod is the newest
    // post date (the daily generator moves it); every other marketing page
    // only changes when a deploy actually changes it.
    lastModified: sitemapDate(p === "/blog" ? latestPostDate : pageUpdatedForPath(p)),
  }));

  // The 52 card pages are the site's core SEO asset. This is their ONLY
  // listing: the separate sitemap-birth-cards.xml was retired 2026-07-12
  // because it duplicated these URLs with a conflicting lastmod.
  for (const slug of allCardSlugs()) {
    entries.push({
      url: normalizeSitemapUrl(`${SITE_URL}/birth-card/${slug}`),
      lastModified: sitemapDate(CARD_MEANING_PAGES_UPDATED),
    });
  }

  // The Joker is not one of the 52 (Dec 31 resolves to solar value 0), so it is
  // absent from allCardSlugs() — but it is a real public page and the only
  // answer we have for "december 31 birth card".
  entries.push({
    url: normalizeSitemapUrl(`${SITE_URL}/birth-card/joker`),
    lastModified: sitemapDate(CARD_MEANING_PAGES_UPDATED),
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
