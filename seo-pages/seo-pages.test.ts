import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildSeoPages } from "./src/build";
import { reservedPersonSlugReason } from "./src/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-pages-"));
const build = buildSeoPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("builds at most three EXAMPLE fixture people", () => {
  expect(build.people).toHaveLength(3);
  expect(build.people.every((person) => person.example)).toBe(true);
  expect(build.people.every((person) => person.slug.startsWith("example-"))).toBe(true);
});

test("rejects reserved person slugs", () => {
  expect(reservedPersonSlugReason("ace-of-spades")).toContain("52-card");
  expect(reservedPersonSlugReason("joker")).toContain("joker");
  expect(reservedPersonSlugReason("december-31")).toContain("month-day");
  expect(reservedPersonSlugReason("example-north-star")).toBeNull();
});

test("person page includes the required slots, JSON-LD, CTA, and sources", () => {
  const html = read("birth-card/example-north-star/index.html");

  expect(html).toContain("EXAMPLE fixture page");
  expect(html).toContain('data-slot="h1"');
  expect(html).toContain("Example North Star's Birth Card: The 8 of Spades");
  expect(html).toContain('data-slot="date"');
  expect(html).toContain("March 15, 1984");
  expect(html).toContain('data-slot="archetype"');
  expect(html).toContain('data-slot="hook"');
  expect(html).toContain('data-slot="card-meaning"');
  expect(html).toContain("Example North Star");
  expect(html).toContain('data-slot="evidence"');
  expect(html).toContain('data-slot="same-card"');
  expect(html).toContain("/birth-card/example-paper-lantern");
  expect((html.match(/data-slot="same-card"[\s\S]*?<\/section>/) ?? [""])[0].match(/<li>/g)?.length).toBe(6);
  expect(html).toContain('data-slot="same-day"');
  expect(html).toContain("/birthday/march-15");
  expect(html).toContain('data-slot="faq"');
  expect(html).toContain('data-slot="cta"');
  expect(html).toContain(
    "/checkout/personal-card-blueprint?utm_source=celeb&amp;utm_content=example-north-star",
  );
  expect(html).toContain('data-checkout-stub="true"');
  expect(html).toContain('action="/create-checkout"');
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain('rel="canonical" href="https://cardblueprints.com/birth-card/example-north-star"');
  expect(html).toContain('data-slot="og-image"');
  expect(html).toContain("/og/birth-card/example-north-star.png");

  const jsonLd = extractJsonLd(html);
  const types = graphTypes(jsonLd);
  expect(types).toContain("Person");
  expect(types).toContain("BreadcrumbList");
  expect(types).toContain("FAQPage");
  expect(jsonLd["@graph"]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "FAQPage",
        mainEntity: expect.arrayContaining([
          expect.objectContaining({ "@type": "Question" }),
        ]),
      }),
    ]),
  );
  const faq = (jsonLd["@graph"] as Array<Record<string, unknown>>).find(
    (node) => node["@type"] === "FAQPage",
  );
  expect((faq?.mainEntity as unknown[]).length).toBe(3);
});

test("Joker person, hub, and December 31 birthday keep the D1 lineage slot", () => {
  const person = read("birth-card/example-joker-lineage/index.html");
  const hub = read("card/joker/index.html");
  const birthday = read("birthday/december-31/index.html");

  for (const html of [person, hub, birthday]) {
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain('data-slot="joker-lineage"');
    expect(html).toContain("December 31 / Joker lineage");
    expect(html).toContain("EXAMPLE");
  }
});

test("card hub and birthday templates compile with fixture links", () => {
  const hub = read("card/8-of-spades/index.html");
  expect(hub).toContain("The 8 of Spades Birth Card");
  expect(hub).toContain("/birth-card/example-north-star");
  expect(hub).toContain("/birth-card/example-paper-lantern");
  expect(graphTypes(extractJsonLd(hub))).toEqual(
    expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage"]),
  );

  const birthday = read("birthday/march-15/index.html");
  expect(birthday).toContain("Born on March 15");
  expect(birthday).toContain("/birth-card/example-north-star");
});

test("daily stub and sitemap index exist without claiming production /today", () => {
  const today = read("today/index.html");
  expect(today).toContain("EXAMPLE daily stub");
  expect(today).toContain("must not be served on cardblueprints.com /today");

  const index = read("sitemap-celeb.xml");
  expect(index).toContain("<sitemapindex");
  expect(index).toContain("https://cardblueprints.com/sitemap-people.xml");
  expect(index).toContain("https://cardblueprints.com/sitemap-cards.xml");
  expect(index).toContain("https://cardblueprints.com/sitemap-birthdays.xml");

  const robots = read("robots.txt");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-celeb.xml");
  expect(robots).toContain("Do not publish this file as the origin robots.txt");
  expect(robots).toContain("Disallow: /checkout");
});

test("path-ownership lock lists Pages-owned prefixes and payment exclusions", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    pages_will_own: string[];
    never_own: string[];
    pages_may_own_after_worker_cutover: string[];
  };

  expect(ownership.pages_will_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/card/{rank}-of-{suit}",
      "/card/joker",
      "/birthday/{month}-{day}",
    ]),
  );
  expect(ownership.never_own).toEqual(
    expect.arrayContaining(["/checkout", "/checkout/*", "/api/checkout/*"]),
  );
  expect(ownership.pages_may_own_after_worker_cutover).toContain("/today");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}

function graphTypes(jsonLd: Record<string, unknown>): string[] {
  const graph = jsonLd["@graph"];
  expect(Array.isArray(graph)).toBe(true);
  return (graph as Array<Record<string, unknown>>).map((node) => String(node["@type"]));
}
