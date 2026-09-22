import { describe, expect, test } from "bun:test";

import {
  buildApplicationSitemapEntries,
  renderApplicationSitemapXml,
} from "../lib/application-sitemap";
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
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function postModified(post: BlogPost): string {
  return post.dateModified || post.datePublished;
}

function newest(values: string[]): string {
  return values.reduce((latest, value) => (value > latest ? value : latest), "");
}

function urlFor(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map((match) =>
    match[1]
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"),
  );
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
  test("generator does not throw", () => {
    expect(() => buildApplicationSitemapEntries()).not.toThrow();
    expect(() => renderApplicationSitemapXml()).not.toThrow();
  });

  const entries = buildApplicationSitemapEntries();
  const entriesByUrl = new Map(entries.map((entry) => [entry.url, entry]));

  test("uses unique URLs on the canonical origin and includes every marketing route", () => {
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);

    for (const entry of entries) {
      expect(new URL(entry.url).origin).toBe(CANONICAL_ORIGIN);
      expect(entry.lastModified).toMatch(ISO_DAY);
    }

    for (const path of MARKETING_PATHS) {
      expect(entriesByUrl.has(urlFor(path))).toBe(true);
    }

    expect(entriesByUrl.get(SITE_URL)?.url).toBe(SITE_URL);
    expect(entriesByUrl.has(`${SITE_URL}/`)).toBe(false);
  });

  test("omits the optional Blueprint Report so the sitemap keeps the $13 reading primary", () => {
    expect(MARKETING_PATHS).not.toContain("/products/blueprint-report");
    expect(entriesByUrl.has(`${SITE_URL}/products/blueprint-report`)).toBe(false);
    expect(entriesByUrl.has(`${SITE_URL}/products/one-question-reading`)).toBe(true);
  });

  test("excludes Worker-owned birthday and compatibility namespaces", () => {
    for (const entry of entries) {
      const pathname = new URL(entry.url).pathname;
      expect(pathname === "/born-on" || pathname.startsWith("/born-on/")).toBe(false);
      expect(pathname === "/compatibility" || pathname.startsWith("/compatibility/")).toBe(false);
    }
  });

  test("renders well-formed urlset XML without changefreq or priority hints", () => {
    const xml = renderApplicationSitemapXml();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<priority>");
    expect((xml.match(/<url>/g) || []).length).toBe(entries.length);
    expect((xml.match(/<\/url>/g) || []).length).toBe(entries.length);

    const locs = sitemapLocations(xml);
    expect(locs).toHaveLength(entries.length);
    expect(new Set(locs).size).toBe(entries.length);
    expect(locs).toContain(SITE_URL);
    expect(locs).toContain(`${SITE_URL}/what-is-cardology`);
    expect(locs).toContain(`${SITE_URL}/birth-card/ace-of-hearts`);
  });

  test("lastmod matches each page Updated constant for every marketing route except the blog index", () => {
    const datedPaths = MARKETING_PATHS.filter((path) => path !== "/blog");
    expect(Object.keys(PAGE_UPDATED_DATES).filter((path) => path !== "/blog").sort()).toEqual(
      [...datedPaths].sort(),
    );

    for (const path of datedPaths) {
      expect(entriesByUrl.get(urlFor(path))?.lastModified, path).toBe(PAGE_UPDATED_DATES[path]);
    }
  });

  test("uses one shared reviewed date for all 52 card-meaning pages", () => {
    const cardSlugs = allCardSlugs();
    expect(cardSlugs).toHaveLength(52);
    expect(new Set(cardSlugs).size).toBe(52);

    for (const slug of cardSlugs) {
      const entry = entriesByUrl.get(`${SITE_URL}/birth-card/${slug}`);
      expect(entry?.lastModified, slug).toBe(CARD_MEANING_PAGES_UPDATED);
    }

    for (const slug of ["10-of-clubs", "2-of-hearts", "3-of-clubs"] as const) {
      expect(entriesByUrl.has(`${SITE_URL}/birth-card/${slug}`), slug).toBe(true);
    }
  });

  test("uses the Joker page's explicit reviewed date", () => {
    expect(entriesByUrl.get(`${SITE_URL}/birth-card/joker`)?.lastModified).toBe(
      CARD_MEANING_PAGES_UPDATED,
    );
  });

  test("uses the newest post date for the blog index", () => {
    const posts = allBlogPosts();
    const newestPostDate = newest(posts.map(postModified));

    expect(entriesByUrl.get(`${SITE_URL}/blog`)?.lastModified).toBe(newestPostDate);
  });

  test("retains content-derived dates for blog pillars and posts", () => {
    const posts = allBlogPosts();
    const newestPostDate = newest(posts.map(postModified));

    for (const pillar of allBlogPillars()) {
      const pillarDate =
        newest(posts.filter((post) => post.pillar === pillar.slug).map(postModified)) ||
        newestPostDate;
      expect(
        entriesByUrl.get(`${SITE_URL}${blogPillarPath(pillar)}`)?.lastModified,
        pillar.slug,
      ).toBe(pillarDate);
    }

    for (const post of posts) {
      expect(
        entriesByUrl.get(`${SITE_URL}${blogPostPath(post)}`)?.lastModified,
        post.slug,
      ).toBe(postModified(post));
    }
  });
});
