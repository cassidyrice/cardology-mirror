import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildTonyPages } from "./src/tonys/build";
import { tonyCheckoutHref, tonyPath, reservedTonySlugReason } from "./src/tonys/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-tonys-"));
const build = buildTonyPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds one hub plus one page per kept leading Tony winner", () => {
  expect(build.people.length).toBeGreaterThan(150);
  expect(build.files).toContain("tonys/index.html");
  expect(build.files).toContain("tonys/jose-ferrer/index.html");
  expect(build.files).toContain("tonys/angela-lansbury/index.html");
  expect(build.files).toContain("tonys/bebe-neuwirth/index.html");
  expect(build.files).toContain("tonys/john-lithgow/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("tonys/") && file.endsWith("/index.html"))).toHaveLength(
    build.people.length + 1,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedTonySlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("tonys/index.html");
  expect(html).toContain("Tony Awards Leading Actors");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("/tonys/jose-ferrer");
  expect(html).toContain("/tonys/angela-lansbury");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Leading Actor");
  expect(html).toContain("Featured");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia");
  expect(html).toContain("tonyawards.com");
  expect(html).toContain("/checkout/deep-dive?utm_source=tonys&amp;utm_content=hub");
  expect(html).not.toContain("/create-checkout");
});

test("Ferrer and Lansbury pages use /tonys URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const ferrer = read("tonys/jose-ferrer/index.html");
  expect(ferrer).toContain("José Ferrer");
  expect(ferrer).toContain("Birth Card");
  expect(ferrer).toContain("1912");
  expect(ferrer).toContain("Cyrano de Bergerac");
  expect(ferrer).toContain("Wikidata CC0");
  expect(ferrer).toContain("Wikipedia CC BY-SA 4.0");
  expect(ferrer).toContain("tonyawards.com");
  expect(ferrer).toContain(tonyCheckoutHref("jose-ferrer").replace("&", "&amp;"));
  expect(ferrer).toContain("Get the $9 Deep Dive");
  expect(ferrer).not.toContain("/birth-card/jose-ferrer");
  expect(ferrer).toContain("/birth-card/");
  expect(ferrer).not.toContain('action="/create-checkout"');
  expect(ferrer).toContain('rel="canonical" href="https://cardblueprints.com/tonys/jose-ferrer"');
  expect(ferrer).toContain('data-slot="sources"');
  expect(ferrer).toContain("coordinates, not fortune-telling");

  const lansbury = read("tonys/angela-lansbury/index.html");
  expect(lansbury).toContain("Angela Lansbury");
  expect(lansbury).toContain(tonyPath("angela-lansbury"));
  expect(lansbury).toContain(tonyCheckoutHref("angela-lansbury").replace("&", "&amp;"));
  expect(lansbury).toContain("Mame");

  const lithgow = read("tonys/john-lithgow/index.html");
  expect(lithgow).toContain("John Lithgow");
  expect(lithgow).toContain("2026");
  expect(lithgow).toContain("Giant");

  const jsonLd = extractJsonLd(ferrer);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 winners render the D1 Joker lineage note", () => {
  const neuwirth = read("tonys/bebe-neuwirth/index.html");
  expect(neuwirth).toContain("Bebe Neuwirth");
  expect(neuwirth).toContain("Joker");
  expect(neuwirth).toContain('data-cass-lock="D1"');
  expect(neuwirth).toContain("December 31");
});

test("path ownership keeps tonys off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    tonys_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.tonys_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/tonys", "/tonys/{slug}"]),
  );
  expect(ownership.tonys_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /tonys and do not claim celeb routes", () => {
  const sitemap = read("sitemap-tonys.xml");
  expect(sitemap).toContain("https://cardblueprints.com/tonys</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/tonys/jose-ferrer");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /tonys/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-tonys.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
