import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, test } from "bun:test";

import { buildApplicationSitemapEntries } from "../lib/application-sitemap";
import { allCardSlugs, cardsBySuit } from "../lib/seo-cards";
import { SITE_URL } from "../lib/site";

const ROOT = join(import.meta.dir, "..");
const HUB = readFileSync(join(ROOT, "app/birth-card/page.tsx"), "utf8");
const DECK = readFileSync(join(ROOT, "components/cards/DeckMatrix.tsx"), "utf8");
const CARD_PAGE = readFileSync(join(ROOT, "app/birth-card/[slug]/page.tsx"), "utf8");

const GSC_DISCOVERED_SAMPLES = ["10-of-clubs", "2-of-hearts", "3-of-clubs"] as const;

const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const SHORT_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

const DATE_HREF_RE = new RegExp(
  `/birth-card/(?:${[...MONTH_SLUGS, ...SHORT_MONTHS].join("|")})-\\d{1,2}\\b`,
);

const DATE_TEMPLATE_RE = /\/birth-card\/\$\{date\.slug\}/;

const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".json"]);

function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkSourceFiles(full));
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf("."));
    if (SCAN_EXT.has(ext)) out.push(full);
  }
  return out;
}

describe("birth-card GSC coverage", () => {
  test("the deck data layer is all 52 slugs, including GSC discovered samples", () => {
    const slugs = allCardSlugs();
    expect(slugs).toHaveLength(52);
    expect(new Set(slugs).size).toBe(52);
    for (const slug of GSC_DISCOVERED_SAMPLES) {
      expect(slugs).toContain(slug);
    }
  });

  test("hub suit sections and DeckMatrix walk the same 52 card slugs", () => {
    const hrefs = cardsBySuit().flatMap((group) =>
      group.cards.map((card) => `/birth-card/${card.slug}`),
    );
    expect(hrefs).toHaveLength(52);
    expect(new Set(hrefs).size).toBe(52);
    for (const slug of GSC_DISCOVERED_SAMPLES) {
      expect(hrefs).toContain(`/birth-card/${slug}`);
    }

    expect(HUB).toContain("cardsBySuit()");
    expect(HUB).toContain("href={`/birth-card/${c.slug}`}");
    expect(HUB).toContain("<DeckMatrix />");
    expect(DECK).toContain("cardsBySuit()");
    expect(DECK).toContain("href={`/birth-card/${c.slug}`}");
  });

  test("hub popular list includes the GSC discovered samples", () => {
    for (const slug of GSC_DISCOVERED_SAMPLES) {
      expect(HUB).toContain(`"/birth-card/${slug}"`);
    }
  });

  test("sitemap lists every /birth-card/{card} URL including GSC samples", () => {
    const urls = new Set(buildApplicationSitemapEntries().map((entry) => entry.url));
    const cardUrls = allCardSlugs().map((slug) => `${SITE_URL}/birth-card/${slug}`);
    expect(cardUrls).toHaveLength(52);
    for (const url of cardUrls) {
      expect(urls.has(url), url).toBe(true);
    }
    for (const slug of GSC_DISCOVERED_SAMPLES) {
      expect(urls.has(`${SITE_URL}/birth-card/${slug}`)).toBe(true);
    }
    const sitemapCardPaths = [...urls]
      .map((url) => new URL(url).pathname)
      .filter((path) => /^\/birth-card\/[a-z0-9-]+$/.test(path) && path !== "/birth-card/joker");
    expect(sitemapCardPaths).toHaveLength(52);
  });

  test("mirror sources do not point date pages at /birth-card/{month}-{day}", () => {
    expect(DATE_TEMPLATE_RE.test(CARD_PAGE)).toBe(false);
    expect(CARD_PAGE).toContain("`/born-on/${date.slug}`");
    expect(CARD_PAGE).toContain("${SITE_URL}/born-on/${date.slug}");

    const leftovers: string[] = [];
    for (const file of walkSourceFiles(join(ROOT, "app"))) {
      leftovers.push(...scanFile(file));
    }
    for (const file of walkSourceFiles(join(ROOT, "components"))) {
      leftovers.push(...scanFile(file));
    }
    expect(leftovers).toEqual([]);
  });
});

function scanFile(file: string): string[] {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const hits: string[] = [];
  for (const match of text.matchAll(new RegExp(DATE_HREF_RE, "g"))) {
    hits.push(`${rel}: ${match[0]}`);
  }
  return hits;
}
