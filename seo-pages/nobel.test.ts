import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildNobelPages } from "./src/nobel/build";
import { nobelCheckoutHref, nobelPath, reservedNobelSlugReason } from "./src/nobel/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-nobel-"));
const build = buildNobelPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per kept laureate", () => {
  expect(build.people.length).toBeGreaterThan(900);
  expect(build.files).toContain("nobel/index.html");
  expect(build.files).toContain("nobel/marie-curie/index.html");
  expect(build.files).toContain("nobel/albert-einstein/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("nobel/") && file.endsWith("/index.html"))).toHaveLength(
    build.people.length + 1,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedNobelSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("nobel/index.html");
  expect(html).toContain("Nobel Laureates’ Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("/nobel/marie-curie");
  expect(html).toContain("/nobel/albert-einstein");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("api.nobelprize.org/2.1");
  expect(html).toContain("/checkout/deep-dive?utm_source=nobel&amp;utm_content=hub");
  expect(html).not.toContain("/create-checkout");
});

test("Curie and Einstein pages use /nobel URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const curie = read("nobel/marie-curie/index.html");
  expect(curie).toContain("Marie Curie&#39;s Birth Card: The King of Clubs");
  expect(curie).toContain("1867");
  expect(curie).toContain("1903");
  expect(curie).toContain("1911");
  expect(curie).toContain("Q7186");
  expect(curie).toContain("Wikidata CC0");
  expect(curie).toContain("Wikipedia CC BY-SA 4.0");
  expect(curie).toContain("Nobel Prize API v2.1");
  expect(curie).toContain(nobelCheckoutHref("marie-curie").replace("&", "&amp;"));
  expect(curie).toContain("Get the $47 Blueprint Breakdown");
  expect(curie).not.toContain("/birth-card/marie-curie");
  expect(curie).toContain("/birth-card/");
  expect(curie).not.toContain('action="/create-checkout"');
  expect(curie).toContain('rel="canonical" href="https://cardblueprints.com/nobel/marie-curie"');
  expect(curie).toContain('data-slot="sources"');
  expect(curie).toContain("coordinates, not fortune-telling");

  const einstein = read("nobel/albert-einstein/index.html");
  expect(einstein).toContain("Albert Einstein&#39;s Birth Card: The 9 of Diamonds");
  expect(einstein).toContain("1879");
  expect(einstein).toContain("Q937");
  expect(einstein).toContain(nobelPath("albert-einstein"));
  expect(einstein).toContain(nobelCheckoutHref("albert-einstein").replace("&", "&amp;"));

  const jsonLd = extractJsonLd(curie);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 laureates render the D1 Joker lineage note", () => {
  const hershko = read("nobel/avram-hershko/index.html");
  expect(hershko).toContain("Joker");
  expect(hershko).toContain('data-cass-lock="D1"');
  expect(hershko).toContain("December 31");
});

test("Pierre Curie and Becquerel stay on isolated /nobel paths", () => {
  const pierre = read("nobel/pierre-curie/index.html");
  expect(pierre).toContain("Pierre Curie");
  expect(pierre).toContain("/nobel/pierre-curie");
  expect(pierre).toContain("4 of Diamonds");

  const becquerel = read("nobel/henri-becquerel/index.html");
  expect(becquerel).toContain("Henri Becquerel");
  expect(becquerel).toContain("3 of Clubs");
});

test("path ownership keeps nobel off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    nobel_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.nobel_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/nobel", "/nobel/{slug}"]),
  );
  expect(ownership.nobel_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /nobel and do not claim celeb routes", () => {
  const sitemap = read("sitemap-nobel.xml");
  expect(sitemap).toContain("https://cardblueprints.com/nobel</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/nobel/marie-curie");
  expect(sitemap).toContain("https://cardblueprints.com/nobel/albert-einstein");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /nobel/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-nobel.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
