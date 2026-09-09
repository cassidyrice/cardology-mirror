import { describe, expect, test } from "bun:test";

import sitemap from "../app/sitemap";
import {
  allBlogPillars,
  allBlogPosts,
  blogPillarPath,
  blogPostPath,
  type BlogPost,
} from "../lib/blog";
import {
  CARD_MEANING_PAGES_UPDATED,
  PAGE_UPDATED_DATES,
} from "../lib/page-dates";
import { allCardSlugs } from "../lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "../lib/site";
import { sitemapDate } from "../lib/sitemap-date";

const CANONICAL_ORIGIN = "https://cardblueprints.com";

function postModified(post: BlogPost): string {
  return post.dateModified || post.datePublished;
}

function newest(values: string[]): string {
  return values.reduce((latest, value) => (value > latest ? value : latest), "");
}

function urlFor(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function isoDay(value: string | Date | undefined): string {
  expect(value).toBeInstanceOf(Date);
  return (value as Date).toISOString().slice(0, 10);
}

describe("sitemapDate", () => {
  test("accepts an exact leap-day date", () => {
    expect(sitemapDate("2024-02-29").toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });

  test("rejects non-padded dates", () => {
    expect(() => sitemapDate("2026-8-16")).toThrow();
  });

  test("rejects calendar rollovers", () => {
    expect(() => sitemapDate("2026-02-30")).toThrow();
  });
});

describe("application sitemap integrity", () => {
  const entries = sitemap();
  const entriesByUrl = new Map(entries.map((entry) => [entry.url, entry]));

  test("uses unique URLs on the canonical origin and includes every marketing route", () => {
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);

    for (const entry of entries) {
      expect(new URL(entry.url).origin).toBe(CANONICAL_ORIGIN);
    }

    for (const path of MARKETING_PATHS) {
      expect(entriesByUrl.has(urlFor(path))).toBe(true);
    }

    expect(entriesByUrl.get(SITE_URL)?.url).toBe(SITE_URL);
    expect(entriesByUrl.has(`${SITE_URL}/`)).toBe(false);
  });

  test("excludes Worker-owned birthday and compatibility directories", () => {
    for (const entry of entries) {
      const pathname = new URL(entry.url).pathname;
      expect(pathname === "/born-on" || pathname.startsWith("/born-on/")).toBe(false);
      expect(pathname === "/compatibility" || pathname.startsWith("/compatibility/")).toBe(false);
    }
  });

  test("omits change-frequency and priority hints", () => {
    for (const entry of entries) {
      expect(entry.changeFrequency).toBeUndefined();
      expect(entry.priority).toBeUndefined();
    }
  });

  test("lastmod matches each page Updated constant for every marketing route except the blog index", () => {
    const datedPaths = MARKETING_PATHS.filter((path) => path !== "/blog");
    expect(Object.keys(PAGE_UPDATED_DATES).filter((path) => path !== "/blog").sort()).toEqual(
      [...datedPaths].sort(),
    );

    for (const path of datedPaths) {
      expect(isoDay(entriesByUrl.get(urlFor(path))?.lastModified), path).toBe(
        PAGE_UPDATED_DATES[path],
      );
    }
  });

  test("uses one shared reviewed date for all 52 card-meaning pages", () => {
    const cardSlugs = allCardSlugs();
    expect(cardSlugs).toHaveLength(52);
    expect(new Set(cardSlugs).size).toBe(52);

    for (const slug of cardSlugs) {
      const entry = entriesByUrl.get(`${SITE_URL}/birth-card/${slug}`);
      expect(isoDay(entry?.lastModified), slug).toBe(CARD_MEANING_PAGES_UPDATED);
    }

    for (const slug of ["10-of-clubs", "2-of-hearts", "3-of-clubs"] as const) {
      expect(entriesByUrl.has(`${SITE_URL}/birth-card/${slug}`), slug).toBe(true);
    }
  });

  test("uses the Joker page's explicit reviewed date", () => {
    expect(isoDay(entriesByUrl.get(`${SITE_URL}/birth-card/joker`)?.lastModified)).toBe(
      CARD_MEANING_PAGES_UPDATED,
    );
  });

  test("uses the newest post date for the blog index", () => {
    const posts = allBlogPosts();
    const newestPostDate = newest(posts.map(postModified));

    expect(isoDay(entriesByUrl.get(`${SITE_URL}/blog`)?.lastModified)).toBe(newestPostDate);
  });

  test("retains content-derived dates for blog pillars and posts", () => {
    const posts = allBlogPosts();
    const newestPostDate = newest(posts.map(postModified));

    for (const pillar of allBlogPillars()) {
      const pillarDate =
        newest(posts.filter((post) => post.pillar === pillar.slug).map(postModified)) ||
        newestPostDate;
      expect(
        isoDay(entriesByUrl.get(`${SITE_URL}${blogPillarPath(pillar)}`)?.lastModified),
        pillar.slug,
      ).toBe(pillarDate);
    }

    for (const post of posts) {
      expect(
        isoDay(entriesByUrl.get(`${SITE_URL}${blogPostPath(post)}`)?.lastModified),
        post.slug,
      ).toBe(postModified(post));
    }
  });
});
