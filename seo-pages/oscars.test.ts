import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildOscarPages } from "./src/oscars/build";
import { oscarCheckoutHref, oscarPath, reservedOscarSlugReason } from "./src/oscars/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-oscars-"));
const build = buildOscarPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per kept Best Actor/Actress winner", () => {
  expect(build.people).toHaveLength(166);
  expect(build.files).toContain("oscars/index.html");
  expect(build.files).toContain("oscars/meryl-streep/index.html");
  expect(build.files).toContain("oscars/tom-hanks/index.html");
  expect(build.files).toContain("oscars/michael-b-jordan/index.html");
  expect(build.files).toContain("oscars/anthony-hopkins/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("oscars/") && file.endsWith("/index.html")),
  ).toHaveLength(167);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedOscarSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("oscars/index.html");
  expect(html).toContain("Academy Award Winners");
  expect(html).toContain("Birth Cards");
  expect(html).toContain("166 people");
  expect(html).toContain("/oscars/meryl-streep");
  expect(html).toContain("/oscars/tom-hanks");
  expect(html).toContain("/oscars/michael-b-jordan");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("oscars.org");
  expect(html).toContain("awardsdatabase.oscars.org");
  expect(html).toContain(oscarCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/meryl-streep");
  expect(html).toContain("data-slot=\"held\"");
  expect(html).toContain("Joan Crawford");
  expect(html).toContain("Norma Shearer");
  expect(html).toContain("Dropped, not guessed");
});

test("person pages use /oscars URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const streep = read("oscars/meryl-streep/index.html");
  expect(streep).toContain("Meryl Streep&#39;s Birth Card: The 8 of Clubs");
  expect(streep).toContain("1983");
  expect(streep).toContain("2012");
  expect(streep).toContain("Sophie&#39;s Choice");
  expect(streep).toContain("The Iron Lady");
  expect(streep).toContain("June 22, 1949");
  expect(streep).toContain("Q873");
  expect(streep).toContain("Wikidata CC0");
  expect(streep).toContain("Wikipedia CC BY-SA 4.0");
  expect(streep).toContain("oscars.org");
  expect(streep).toContain(oscarCheckoutHref("meryl-streep").replace("&", "&amp;"));
  expect(streep).toContain("Get the $9 Deep Dive");
  expect(streep).not.toContain("/birth-card/meryl-streep");
  expect(streep).toContain("/birth-card/");
  expect(streep).not.toContain('action="/create-checkout"');
  expect(streep).toContain('rel="canonical" href="https://cardblueprints.com/oscars/meryl-streep"');
  expect(streep).toContain('data-slot="sources"');
  expect(streep).toContain("coordinates, not fortune-telling");

  const hanks = read("oscars/tom-hanks/index.html");
  expect(hanks).toContain("Tom Hanks&#39;s Birth Card: The 6 of Diamonds");
  expect(hanks).toContain("July 9, 1956");
  expect(hanks).toContain("Philadelphia");
  expect(hanks).toContain("Forrest Gump");
  expect(hanks).toContain(oscarPath("tom-hanks"));
  expect(hanks).toContain(oscarCheckoutHref("tom-hanks").replace("&", "&amp;"));

  const jordan = read("oscars/michael-b-jordan/index.html");
  expect(jordan).toContain("3 of Spades");
  expect(jordan).toContain("Sinners");
  expect(jordan).toContain("2026");

  const jsonLd = extractJsonLd(streep);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 winners render the D1 Joker lineage note", () => {
  const hopkins = read("oscars/anthony-hopkins/index.html");
  expect(hopkins).toContain("Joker");
  expect(hopkins).toContain('data-cass-lock="D1"');
  expect(hopkins).toContain("December 31");

  const kingsley = read("oscars/ben-kingsley/index.html");
  expect(kingsley).toContain("Joker");
  expect(kingsley).toContain('data-cass-lock="D1"');
  expect(kingsley).toContain("December 31");
});

test("path ownership keeps oscars off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    oscars_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.oscars_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/oscars", "/oscars/{slug}"]),
  );
  expect(ownership.oscars_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /oscars and do not claim celeb routes", () => {
  const sitemap = read("sitemap-oscars.xml");
  expect(sitemap).toContain("https://cardblueprints.com/oscars</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/oscars/meryl-streep");
  expect(sitemap).toContain("https://cardblueprints.com/oscars/tom-hanks");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /oscars/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-oscars.xml");
});

test("oscar checkout helper uses utm_source=oscars", () => {
  expect(oscarCheckoutHref("meryl-streep")).toBe(
    "/checkout/deep-dive?utm_source=oscars&utm_content=meryl-streep",
  );
  expect(oscarPath("meryl-streep")).toBe("/oscars/meryl-streep");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
