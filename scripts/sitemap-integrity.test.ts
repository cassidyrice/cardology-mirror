import { describe, expect, test } from "bun:test";

import sitemap from "../app/sitemap";
import {
  allBlogPillars,
  allBlogPosts,
  blogPillarPath,
  blogPostPath,
  type BlogPost,
} from "../lib/blog";
import { allCardSlugs } from "../lib/seo-cards";
import { MARKETING_PATHS, SITE_URL } from "../lib/site";
import { sitemapDate } from "../lib/sitemap-date";

const CANONICAL_ORIGIN = "https://cardblueprints.com";

const ROUTE_DATES = {
  "/": "2026-08-16",
  "/about": "2026-08-16",
  "/videos": "2026-07-29",
  "/birth-card": "2026-08-16",
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
} as const;

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

  test("uses the reviewed date for every marketing route except the blog index", () => {
    expect(Object.keys(ROUTE_DATES).sort()).toEqual(
      MARKETING_PATHS.filter((path) => path !== "/blog").sort(),
    );

    for (const [path, date] of Object.entries(ROUTE_DATES)) {
      expect(isoDay(entriesByUrl.get(urlFor(path))?.lastModified), path).toBe(date);
    }
  });

  test("uses one shared reviewed date for all 52 card-meaning pages", () => {
    const cardSlugs = allCardSlugs();
    expect(cardSlugs).toHaveLength(52);
    expect(new Set(cardSlugs).size).toBe(52);

    for (const slug of cardSlugs) {
      const entry = entriesByUrl.get(`${SITE_URL}/birth-card/${slug}`);
      expect(isoDay(entry?.lastModified), slug).toBe("2026-08-15");
    }
  });

  test("uses the Joker page's explicit reviewed date", () => {
    expect(isoDay(entriesByUrl.get(`${SITE_URL}/birth-card/joker`)?.lastModified)).toBe(
      "2026-08-15",
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
