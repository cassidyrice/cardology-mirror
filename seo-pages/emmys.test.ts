import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildEmmyPages } from "./src/emmys/build";
import { emmyCheckoutHref, emmyPath, reservedEmmySlugReason } from "./src/emmys/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-emmys-"));
const build = buildEmmyPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per kept Emmy winner", () => {
  expect(build.people.length).toBeGreaterThan(80);
  expect(build.files).toContain("emmys/index.html");
  expect(build.files).toContain("emmys/bryan-cranston/index.html");
  expect(build.files).toContain("emmys/zendaya/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("emmys/") && file.endsWith("/index.html"))).toHaveLength(
    build.people.length + 1,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedEmmySlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, scope, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("emmys/index.html");
  expect(html).toContain("Primetime Emmy Lead Actor / Actress Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("/emmys/bryan-cranston");
  expect(html).toContain("/emmys/zendaya");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("emmys.com");
  expect(html).toContain("Daytime");
  expect(html).toContain(emmyCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
});

test("Cranston and Zendaya pages use /emmys URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const cranston = read("emmys/bryan-cranston/index.html");
  expect(cranston).toContain("Bryan Cranston&#39;s Birth Card: The 3 of Spades");
  expect(cranston).toContain("1956");
  expect(cranston).toContain("2008");
  expect(cranston).toContain("Breaking Bad");
  expect(cranston).toContain("Q23547");
  expect(cranston).toContain("Wikidata CC0");
  expect(cranston).toContain("Wikipedia CC BY-SA 4.0");
  expect(cranston).toContain("emmys.com");
  expect(cranston).toContain(emmyCheckoutHref("bryan-cranston").replace("&", "&amp;"));
  expect(cranston).toContain("Get the $47 Blueprint Breakdown");
  expect(cranston).not.toContain("/birth-card/bryan-cranston");
  expect(cranston).toContain("/birth-card/");
  expect(cranston).not.toContain('action="/create-checkout"');
  expect(cranston).toContain('rel="canonical" href="https://cardblueprints.com/emmys/bryan-cranston"');
  expect(cranston).toContain('data-slot="sources"');
  expect(cranston).toContain("coordinates, not fortune-telling");

  const zendaya = read("emmys/zendaya/index.html");
  expect(zendaya).toContain("Zendaya&#39;s Birth Card: The 10 of Diamonds");
  expect(zendaya).toContain("1996");
  expect(zendaya).toContain(emmyPath("zendaya"));
  expect(zendaya).toContain(emmyCheckoutHref("zendaya").replace("&", "&amp;"));

  const jsonLd = extractJsonLd(cranston);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 winners render the D1 Joker lineage note when present", () => {
  const jokers = build.people.filter((person) => person.card === "Joker" || person.birth_date.endsWith("-12-31"));
  for (const person of jokers) {
    const html = read(`emmys/${person.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain("December 31");
  }
});

test("path ownership keeps emmys off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    emmys_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.emmys_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/emmys", "/emmys/{slug}"]),
  );
  expect(ownership.emmys_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /emmys and do not claim celeb routes", () => {
  const sitemap = read("sitemap-emmys.xml");
  expect(sitemap).toContain("https://cardblueprints.com/emmys</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/emmys/bryan-cranston");
  expect(sitemap).toContain("https://cardblueprints.com/emmys/zendaya");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /emmys/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-emmys.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
