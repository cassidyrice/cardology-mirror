import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildSenatorPages } from "./src/senators/build";
import {
  officePhrase,
  reservedSenatorSlugReason,
  senatorCheckoutHref,
  senatorPath,
} from "./src/senators/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-senators-"));
const build = buildSenatorPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per verified sitting senator", () => {
  expect(build.people).toHaveLength(99);
  expect(build.files).toContain("senators/index.html");
  expect(build.files).toContain("senators/tommy-tuberville/index.html");
  expect(build.files).toContain("senators/jon-ossoff/index.html");
  expect(build.files).toContain("senators/josh-hawley/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.some((file) => file.includes("katie-boyd-britt"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("senators/") && file.endsWith("/index.html"))).toHaveLength(
    100,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedSenatorSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists 99 verified senators, held conflict, sources, and Deep Dive CTA", () => {
  const html = read("senators/index.html");
  expect(html).toContain("Current US Senators’ Birth Cards");
  expect(html).toContain("99 verified sitting senators");
  expect(html).toContain("/senators/tommy-tuberville");
  expect(html).toContain("/senators/jon-ossoff");
  expect(html).toContain("/senators/josh-hawley");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("Bioguide");
  expect(html).toContain("congress.gov");
  expect(html).toContain("Katie Boyd Britt");
  expect(html).toContain("Alabama");
  expect(html).toContain("conflicts with Wikidata");
  expect(html).toContain(senatorCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("/senators/katie-boyd-britt");
  expect(html).not.toContain("stripe");
});

test("person pages use /senators URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const tuberville = read("senators/tommy-tuberville/index.html");
  expect(tuberville).toContain("Tommy Tuberville&#39;s Birth Card: The 6 of Clubs");
  expect(tuberville).toContain("U.S. senator from Alabama");
  expect(tuberville).toContain("1954");
  expect(tuberville).toContain("Q7819948");
  expect(tuberville).toContain("T000278");
  expect(tuberville).toContain("Wikidata CC0");
  expect(tuberville).toContain("Wikipedia CC BY-SA 4.0");
  expect(tuberville).toContain("Bioguide");
  expect(tuberville).toContain(senatorCheckoutHref("tommy-tuberville").replace("&", "&amp;"));
  expect(tuberville).toContain("Get the $47 Blueprint Breakdown");
  expect(tuberville).not.toContain("/birth-card/tommy-tuberville");
  expect(tuberville).toContain("/birth-card/");
  expect(tuberville).not.toContain('action="/create-checkout"');
  expect(tuberville).toContain('rel="canonical" href="https://cardblueprints.com/senators/tommy-tuberville"');
  expect(tuberville).toContain('data-slot="sources"');
  expect(tuberville).toContain("coordinates, not fortune-telling");

  const hawley = read("senators/josh-hawley/index.html");
  expect(hawley).toContain("Josh Hawley&#39;s Birth Card: The Joker");
  expect(hawley).toContain("December 31, 1979");
  expect(hawley).toContain('data-cass-lock="D1"');
  expect(hawley).toContain(senatorPath("josh-hawley"));

  const ossoff = read("senators/jon-ossoff/index.html");
  expect(ossoff).toContain("9 of Diamonds");
  expect(ossoff).toContain("February 16, 1987");
  expect(ossoff).toContain("U.S. senator from Georgia");

  const jsonLd = extractJsonLd(tuberville);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("office phrase names the state and class", () => {
  expect(officePhrase("Alabama", "2")).toBe("U.S. senator from Alabama (Class 2)");
  expect(officePhrase("Georgia", "3")).toBe("U.S. senator from Georgia (Class 3)");
});

test("path ownership keeps senators off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    senators_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.senators_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/senators", "/senators/{slug}"]),
  );
  expect(ownership.senators_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /senators and do not claim celeb routes", () => {
  const sitemap = read("sitemap-senators.xml");
  expect(sitemap).toContain("https://cardblueprints.com/senators</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/senators/tommy-tuberville");
  expect(sitemap).toContain("https://cardblueprints.com/senators/josh-hawley");
  expect(sitemap).not.toContain("/birth-card/");
  expect(sitemap).not.toContain("katie-boyd-britt");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /senators/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-senators.xml");
});

test("senator checkout helper uses utm_source=senators", () => {
  expect(senatorCheckoutHref("tommy-tuberville")).toBe(
    "/checkout/deep-dive?utm_source=senators&utm_content=tommy-tuberville",
  );
  expect(senatorPath("tommy-tuberville")).toBe("/senators/tommy-tuberville");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
