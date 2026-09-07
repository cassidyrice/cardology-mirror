import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildWinterPages } from "./src/olympics/winter/build";
import {
  reservedWinterSlugReason,
  winterCheckoutHref,
  winterPath,
} from "./src/olympics/winter/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-olympics-winter-"));
const build = buildWinterPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

function visibleWords(html: string): string[] {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

function shingles(words: string[], size = 5): Set<string> {
  const out = new Set<string>();
  for (let index = 0; index + size <= words.length; index += 1) {
    out.add(words.slice(index, index + size).join(" "));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const item of a) {
    if (b.has(item)) inter += 1;
  }
  return inter / (a.size + b.size - inter);
}

test("builds one hub plus one page per kept 8+ Winter Olympic medalist", () => {
  expect(build.people).toHaveLength(30);
  expect(build.files).toContain("olympics/winter/index.html");
  expect(build.files).toContain("olympics/winter/marit-bjorgen/index.html");
  expect(build.files).toContain("olympics/winter/alexander-bolshunov/index.html");
  expect(build.files).toContain("olympics/winter/apolo-anton-ohno/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("olympics/winter/") && file.endsWith("/index.html")),
  ).toHaveLength(build.people.length + 1);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedWinterSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("olympics/winter/index.html");
  expect(html).toContain("Winter Olympic Medalists’ Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("/olympics/winter/marit-bjorgen");
  expect(html).toContain("/olympics/winter/alexander-bolshunov");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("List of multiple Winter Olympic medalists");
  expect(html).toContain(winterCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
});

test("person pages use /olympics/winter URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const bjorgen = read("olympics/winter/marit-bjorgen/index.html");
  expect(bjorgen).toContain("Marit Bjørgen&#39;s Birth Card: The 2 of Diamonds");
  expect(bjorgen).toContain("1980");
  expect(bjorgen).toContain("Q216256");
  expect(bjorgen).toContain("Wikidata CC0");
  expect(bjorgen).toContain("Wikipedia CC BY-SA 4.0");
  expect(bjorgen).toContain(winterCheckoutHref("marit-bjorgen").replace("&", "&amp;"));
  expect(bjorgen).toContain("Get the $47 Blueprint Breakdown");
  expect(bjorgen).not.toContain("/birth-card/marit-bjorgen");
  expect(bjorgen).toContain("/birth-card/");
  expect(bjorgen).not.toContain('action="/create-checkout"');
  expect(bjorgen).toContain('rel="canonical" href="https://cardblueprints.com/olympics/winter/marit-bjorgen"');
  expect(bjorgen).toContain('data-slot="sources"');
  expect(bjorgen).toContain("coordinates, not fortune-telling");

  const ohno = read("olympics/winter/apolo-anton-ohno/index.html");
  expect(ohno).toContain("Apolo Anton Ohno");
  expect(ohno).toContain("1982");
  expect(ohno).toContain(winterPath("apolo-anton-ohno"));

  const jsonLd = extractJsonLd(bjorgen);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 medalist renders the D1 Joker lineage note", () => {
  const bolshunov = read("olympics/winter/alexander-bolshunov/index.html");
  expect(bolshunov).toContain("Joker");
  expect(bolshunov).toContain("December 31");
  expect(bolshunov).toContain('data-cass-lock="D1"');
});

test("pages have 250+ words and stay under 30% 5-gram overlap", () => {
  const pages = build.people.map((person) => ({
    slug: person.slug,
    words: visibleWords(read(`olympics/winter/${person.slug}/index.html`)),
  }));
  for (const page of pages) {
    expect(page.words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(page.words).size).toBeGreaterThanOrEqual(120);
  }
  const grams = pages.map((page) => shingles(page.words));
  let worst = 0;
  for (let i = 0; i < grams.length; i += 1) {
    for (let j = i + 1; j < grams.length; j += 1) {
      worst = Math.max(worst, jaccard(grams[i], grams[j]));
    }
  }
  expect(worst).toBeLessThan(0.3);
});

test("path ownership keeps olympics/winter off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    olympics_winter_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.olympics_winter_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/olympics/winter", "/olympics/winter/{slug}"]),
  );
  expect(ownership.olympics_winter_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /olympics/winter and do not claim celeb routes", () => {
  const sitemap = read("sitemap-olympics-winter.xml");
  expect(sitemap).toContain("https://cardblueprints.com/olympics/winter</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/olympics/winter/marit-bjorgen");
  expect(sitemap).toContain("https://cardblueprints.com/olympics/winter/alexander-bolshunov");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /olympics/winter/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-olympics-winter.xml");
});

test("winter checkout helper uses utm_source=olympics-winter", () => {
  expect(winterCheckoutHref("marit-bjorgen")).toBe(
    "/checkout/deep-dive?utm_source=olympics-winter&utm_content=marit-bjorgen",
  );
  expect(winterPath("marit-bjorgen")).toBe("/olympics/winter/marit-bjorgen");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
