import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildScotusPages } from "./src/scotus/build";
import { officePhrase, reservedScotusSlugReason, scotusCheckoutHref, scotusPath } from "./src/scotus/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-scotus-"));
const build = buildScotusPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per sitting justice", () => {
  expect(build.people).toHaveLength(9);
  expect(build.files).toContain("scotus/index.html");
  expect(build.files).toContain("scotus/john-g-roberts-jr/index.html");
  expect(build.files).toContain("scotus/ketanji-brown-jackson/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("scotus/") && file.endsWith("/index.html"))).toHaveLength(
    10,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedScotusSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists 9 sitting justices, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("scotus/index.html");
  expect(html).toContain("Current SCOTUS Justices’ Birth Cards");
  expect(html).toContain("9 sitting justices");
  expect(html).toContain("/scotus/john-g-roberts-jr");
  expect(html).toContain("/scotus/ketanji-brown-jackson");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("supremecourt.gov");
  expect(html).toContain("/checkout/deep-dive?utm_source=scotus&amp;utm_content=hub");
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("Anthony M. Kennedy");
  expect(html).not.toContain("Stephen G. Breyer");
});

test("person pages use /scotus URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const roberts = read("scotus/john-g-roberts-jr/index.html");
  expect(roberts).toContain("John G. Roberts, Jr.&#39;s Birth Card: The King of Clubs");
  expect(roberts).toContain("Chief Justice of the United States");
  expect(roberts).toContain("1955");
  expect(roberts).toContain("Q11153");
  expect(roberts).toContain("Wikidata CC0");
  expect(roberts).toContain("Wikipedia CC BY-SA 4.0");
  expect(roberts).toContain("supremecourt.gov");
  expect(roberts).toContain(scotusCheckoutHref("john-g-roberts-jr").replace("&", "&amp;"));
  expect(roberts).toContain("Get the $47 Blueprint Breakdown");
  expect(roberts).not.toContain("/birth-card/john-g-roberts-jr");
  expect(roberts).toContain("/birth-card/");
  expect(roberts).not.toContain('action="/create-checkout"');
  expect(roberts).toContain('rel="canonical" href="https://cardblueprints.com/scotus/john-g-roberts-jr"');
  expect(roberts).toContain('data-slot="sources"');
  expect(roberts).toContain("coordinates, not fortune-telling");

  const jackson = read("scotus/ketanji-brown-jackson/index.html");
  expect(jackson).toContain("Ketanji Brown Jackson&#39;s Birth Card: The 10 of Clubs");
  expect(jackson).toContain("1970");
  expect(jackson).toContain("Q6395324");
  expect(jackson).toContain(scotusPath("ketanji-brown-jackson"));
  expect(jackson).toContain(scotusCheckoutHref("ketanji-brown-jackson").replace("&", "&amp;"));

  const alito = read("scotus/samuel-a-alito-jr/index.html");
  expect(alito).toContain("7 of Spades");
  expect(alito).toContain("April 1, 1950");

  const jsonLd = extractJsonLd(roberts);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("office phrase stays exhaustive for sitting roles", () => {
  expect(officePhrase("Chief Justice of the United States")).toBe("Chief Justice of the United States");
  expect(officePhrase("Associate Justice")).toBe("Associate Justice of the Supreme Court");
});

test("path ownership keeps scotus off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    scotus_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.scotus_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/scotus", "/scotus/{slug}"]),
  );
  expect(ownership.scotus_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /scotus and do not claim celeb routes", () => {
  const sitemap = read("sitemap-scotus.xml");
  expect(sitemap).toContain("https://cardblueprints.com/scotus</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/scotus/john-g-roberts-jr");
  expect(sitemap).toContain("https://cardblueprints.com/scotus/ketanji-brown-jackson");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /scotus/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-scotus.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
