import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildCabinetPages } from "./src/cabinet/build";
import {
  cabinetCheckoutHref,
  cabinetPath,
  officePhrase,
  reservedCabinetSlugReason,
} from "./src/cabinet/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-cabinet-"));
const build = buildCabinetPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per verified sitting Cabinet officer", () => {
  expect(build.people).toHaveLength(16);
  expect(build.files).toContain("cabinet/index.html");
  expect(build.files).toContain("cabinet/jd-vance/index.html");
  expect(build.files).toContain("cabinet/marco-rubio/index.html");
  expect(build.files).toContain("cabinet/keith-sonderling/index.html");
  expect(build.files).toContain("cabinet/markwayne-mullin/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("cabinet/") && file.endsWith("/index.html")),
  ).toHaveLength(17);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedCabinetSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists 16 verified officers, sources, and Deep Dive CTA", () => {
  const html = read("cabinet/index.html");
  expect(html).toContain("Current US Cabinet Birth Cards");
  expect(html).toContain("16 verified sitting officers");
  expect(html).toContain("VP + 15 secretaries");
  expect(html).toContain("/cabinet/jd-vance");
  expect(html).toContain("/cabinet/keith-sonderling");
  expect(html).toContain("Acting Secretary of Labor");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("whitehouse.gov/administration/the-cabinet");
  expect(html).toContain(cabinetCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/jd-vance");
});

test("person pages use /cabinet URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const vance = read("cabinet/jd-vance/index.html");
  expect(vance).toContain("JD Vance&#39;s Birth Card: The Jack of Diamonds");
  expect(vance).toContain("Vice President");
  expect(vance).toContain("August 2, 1984");
  expect(vance).toContain("Q28935729");
  expect(vance).toContain("Wikidata CC0");
  expect(vance).toContain("Wikipedia CC BY-SA 4.0");
  expect(vance).toContain("whitehouse.gov/administration/the-cabinet");
  expect(vance).toContain(cabinetCheckoutHref("jd-vance").replace("&", "&amp;"));
  expect(vance).toContain("Get the $9 Deep Dive");
  expect(vance).not.toContain("/birth-card/jd-vance");
  expect(vance).toContain("/birth-card/");
  expect(vance).not.toContain('action="/create-checkout"');
  expect(vance).toContain('rel="canonical" href="https://cardblueprints.com/cabinet/jd-vance"');
  expect(vance).toContain('data-slot="sources"');
  expect(vance).toContain("coordinates, not fortune-telling");

  const rubio = read("cabinet/marco-rubio/index.html");
  expect(rubio).toContain("4 of Clubs");
  expect(rubio).toContain("May 28, 1971");
  expect(rubio).toContain("Secretary of State");

  const labor = read("cabinet/keith-sonderling/index.html");
  expect(labor).toContain("Acting Secretary of Labor");
  expect(labor).toContain("8 of Hearts");
  expect(labor).toContain("November 25, 1982");
  expect(labor).toContain(cabinetPath("keith-sonderling"));

  const jsonLd = extractJsonLd(vance);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("office phrase names acting seats", () => {
  expect(officePhrase("Vice President", false)).toBe("Vice President");
  expect(officePhrase("Secretary of Labor", true)).toBe("Acting Secretary of Labor");
});

test("path ownership keeps cabinet off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    cabinet_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.cabinet_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/cabinet", "/cabinet/{slug}"]),
  );
  expect(ownership.cabinet_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /cabinet and do not claim celeb routes", () => {
  const sitemap = read("sitemap-cabinet.xml");
  expect(sitemap).toContain("https://cardblueprints.com/cabinet</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/cabinet/jd-vance");
  expect(sitemap).toContain("https://cardblueprints.com/cabinet/keith-sonderling");
  expect(sitemap).not.toContain("/birth-card/");
  expect(sitemap).not.toContain("/presidents/");
  expect(sitemap).not.toContain("/governors/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /cabinet/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-cabinet.xml");
});

test("cabinet checkout helper uses utm_source=cabinet", () => {
  expect(cabinetCheckoutHref("jd-vance")).toBe(
    "/checkout/deep-dive?utm_source=cabinet&utm_content=jd-vance",
  );
  expect(cabinetPath("jd-vance")).toBe("/cabinet/jd-vance");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
