import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildGovernorPages } from "./src/governors/build";
import {
  governorCheckoutHref,
  governorPath,
  officePhrase,
  reservedGovernorSlugReason,
} from "./src/governors/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-governors-"));
const build = buildGovernorPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per verified sitting governor", () => {
  expect(build.people).toHaveLength(49);
  expect(build.files).toContain("governors/index.html");
  expect(build.files).toContain("governors/gavin-newsom/index.html");
  expect(build.files).toContain("governors/jim-pillen/index.html");
  expect(build.files).toContain("governors/mikie-sherrill/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.some((file) => file.includes("kelly-armstrong"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("governors/") && file.endsWith("/index.html"))).toHaveLength(
    50,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedGovernorSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists 49 verified governors, held conflict, sources, and Deep Dive CTA", () => {
  const html = read("governors/index.html");
  expect(html).toContain("Current US Governors’ Birth Cards");
  expect(html).toContain("49 verified sitting governors");
  expect(html).toContain("/governors/gavin-newsom");
  expect(html).toContain("/governors/jim-pillen");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("Ballotpedia");
  expect(html).toContain("nga.org");
  expect(html).toContain("Kelly Armstrong");
  expect(html).toContain("North Dakota");
  expect(html).toContain("conflicts with Wikidata");
  expect(html).toContain(governorCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("/governors/kelly-armstrong");
  expect(html).not.toContain("stripe");
});

test("person pages use /governors URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const newsom = read("governors/gavin-newsom/index.html");
  expect(newsom).toContain("Gavin Newsom&#39;s Birth Card: The Queen of Clubs");
  expect(newsom).toContain("Governor of California");
  expect(newsom).toContain("1967");
  expect(newsom).toContain("Q461391");
  expect(newsom).toContain("Wikidata CC0");
  expect(newsom).toContain("Wikipedia CC BY-SA 4.0");
  expect(newsom).toContain("Ballotpedia");
  expect(newsom).toContain(governorCheckoutHref("gavin-newsom").replace("&", "&amp;"));
  expect(newsom).toContain("Get the $9 Deep Dive");
  expect(newsom).not.toContain("/birth-card/gavin-newsom");
  expect(newsom).toContain("/birth-card/");
  expect(newsom).not.toContain('action="/create-checkout"');
  expect(newsom).toContain('rel="canonical" href="https://cardblueprints.com/governors/gavin-newsom"');
  expect(newsom).toContain('data-slot="sources"');
  expect(newsom).toContain("coordinates, not fortune-telling");

  const pillen = read("governors/jim-pillen/index.html");
  expect(pillen).toContain("Jim Pillen&#39;s Birth Card: The Joker");
  expect(pillen).toContain("December 31, 1955");
  expect(pillen).toContain('data-cass-lock="D1"');
  expect(pillen).toContain(governorPath("jim-pillen"));

  const sherrill = read("governors/mikie-sherrill/index.html");
  expect(sherrill).toContain("8 of Diamonds");
  expect(sherrill).toContain("January 19, 1972");
  expect(sherrill).toContain("Governor of New Jersey");

  const jsonLd = extractJsonLd(newsom);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("office phrase names the state", () => {
  expect(officePhrase("California")).toBe("Governor of California");
  expect(officePhrase("North Dakota")).toBe("Governor of North Dakota");
});

test("path ownership keeps governors off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    governors_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.governors_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/governors", "/governors/{slug}"]),
  );
  expect(ownership.governors_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /governors and do not claim celeb routes", () => {
  const sitemap = read("sitemap-governors.xml");
  expect(sitemap).toContain("https://cardblueprints.com/governors</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/governors/gavin-newsom");
  expect(sitemap).toContain("https://cardblueprints.com/governors/jim-pillen");
  expect(sitemap).not.toContain("/birth-card/");
  expect(sitemap).not.toContain("kelly-armstrong");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /governors/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-governors.xml");
});

test("governor checkout helper uses utm_source=governors", () => {
  expect(governorCheckoutHref("gavin-newsom")).toBe(
    "/checkout/deep-dive?utm_source=governors&utm_content=gavin-newsom",
  );
  expect(governorPath("gavin-newsom")).toBe("/governors/gavin-newsom");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
