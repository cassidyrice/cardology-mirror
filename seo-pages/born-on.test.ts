import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { birthCardCode, birthCardFromMonthDay, solarValue } from "./src/birthcard";
import { buildBornOnPages } from "./src/born-on/build";
import { bornOnCheckoutHref, bornOnDayPath, isBornOnDaySlug } from "./src/born-on/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-born-on-"));
const build = buildBornOnPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

function visibleWords(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, String.fromCharCode(34))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

test("D1 Joker rule matches pipeline/birthcard.py", () => {
  expect(solarValue(12, 31)).toBeLessThanOrEqual(0);
  expect(birthCardCode(12, 31)).toBe("Joker");
  expect(birthCardCode(1, 15)).toBe("Q♦");
  expect(birthCardCode(2, 29)).toBe("9♣");
  expect(birthCardFromMonthDay(12, 31).kind).toBe("joker");
});

test("builds hub plus exactly 366 day pages on the live /born-on path", () => {
  expect(build.days).toHaveLength(366);
  expect(build.files).toContain("born-on/index.html");
  expect(build.files).toContain("born-on/january-15/index.html");
  expect(build.files).toContain("born-on/february-29/index.html");
  expect(build.files).toContain("born-on/december-31/index.html");
  expect(build.files.some((file) => file.startsWith("birthday/"))).toBe(false);
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("born-on/") && file.endsWith("/index.html")),
  ).toHaveLength(367);

  const slugs = build.days.map((day) => day.slug);
  expect(new Set(slugs).size).toBe(366);
  expect(slugs.every((slug) => isBornOnDaySlug(slug))).toBe(true);
});

test("every day card matches birthcard.ts and people stay on that month-day", () => {
  for (const day of build.days) {
    expect(birthCardCode(day.month, day.day)).toBe(day.card);
    expect(day.cardRef.label.length).toBeGreaterThan(0);
    expect(day.people_count).toBe(day.people.length);
    for (const person of day.people) {
      expect(person.month).toBe(day.month);
      expect(person.day).toBe(day.day);
      expect(person.birth_date).toBe(person.wikidata_birth_date);
      expect(person.card).toBe(day.card);
      expect(person.source_url).toContain("wikipedia.org/wiki/");
      expect(person.qid.startsWith("Q")).toBe(true);
    }
  }
});

test("hub lists 366 days, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("born-on/index.html");
  expect(html).toContain("Born-On Birth Cards");
  expect(html).toContain("366");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata P569");
  expect(html).toContain("Wikipedia");
  expect(html).toContain("CC BY-SA 4.0");
  expect(html).toContain(bornOnCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).toContain("/born-on/january-15");
  expect(html).toContain("/born-on/february-29");
  expect(html).toContain("/born-on/december-31");
  expect(html).toContain("january-2");
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birthday/");
  expect(html).toContain('rel="canonical" href="https://cardblueprints.com/born-on"');

  const types = graphTypes(extractJsonLd(html));
  expect(types).toEqual(expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage", "ItemList"]));
});

test("January 15 cites verified notables and leaves /birth-card person routes alone", () => {
  const jan15 = build.days.find((day) => day.slug === "january-15");
  expect(jan15).toBeTruthy();
  if (!jan15) return;
  expect(jan15.card).toBe("Q♦");
  const names = jan15.people.map((person) => person.name);
  expect(names).toContain("Martin Luther King Jr.");
  expect(names).toContain("Giorgia Meloni");
  expect(names).toContain("Ben Shapiro");

  const html = read("born-on/january-15/index.html");
  expect(html).toContain("January 15 Birth Card: Queen of Diamonds");
  expect(html).toContain("Martin Luther King Jr.");
  expect(html).toContain("Q8027");
  expect(html).toContain("Wikidata");
  expect(html).toContain("Wikipedia");
  expect(html).toContain("CC BY-SA 4.0");
  expect(html).toContain(bornOnCheckoutHref("january-15").replace("&", "&amp;"));
  expect(html).toContain("Get the $47 Blueprint Breakdown");
  expect(html).not.toContain("/birth-card/martin-luther-king");
  expect(html).toContain("/birth-card/queen-of-diamonds");
  expect(html).not.toContain('action="/create-checkout"');
  expect(html).toContain('rel="canonical" href="https://cardblueprints.com/born-on/january-15"');
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("coordinates, not fortune-telling");
  expect(graphTypes(extractJsonLd(html))).toEqual(
    expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage"]),
  );
});

test("December 31 renders the D1 Joker lineage note", () => {
  const html = read("born-on/december-31/index.html");
  expect(html).toContain("Joker");
  expect(html).toContain('data-cass-lock="D1"');
  expect(html).toContain("December 31");
  expect(html).toContain("Anthony Hopkins");
  expect(html).toContain(bornOnDayPath("december-31"));
});

test("empty days stay empty and do not invent notables", () => {
  const empty = build.days.filter((day) => day.people_count === 0);
  expect(empty.length).toBe(26);
  const january2 = empty.find((day) => day.slug === "january-2");
  expect(january2).toBeTruthy();
  const html = read("born-on/january-2/index.html");
  expect(html).toContain("no verified notable");
  expect(html).toContain("No famous-people block is invented");
  expect(html).toContain("January 2 Birth Card:");
  expect(html).not.toContain("Martin Luther King");
  expect(html).toContain(bornOnCheckoutHref("january-2").replace("&", "&amp;"));
});

test("pages have 250+ words and stay on /born-on", () => {
  for (const day of build.days) {
    const html = read(`born-on/${day.slug}/index.html`);
    expect(visibleWords(html).length).toBeGreaterThanOrEqual(250);
    expect(html).toContain(`utm_source=born-on`);
    expect(html).toContain(`utm_content=${day.slug}`);
    expect(html).toContain("/checkout/deep-dive");
    expect(html).not.toContain("/birthday/");
    expect(html).not.toContain("/create-checkout");
  }
});

test("path ownership keeps this pack on /born-on and off celeb/card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    born_on_isolated: { pages_will_own: string[]; must_not_own: string[]; note: string };
  };

  expect(ownership.born_on_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/born-on", "/born-on/{month}-{day}", "/sitemap-born-on.xml"]),
  );
  expect(ownership.born_on_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birthday/{month}-{day}",
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
      "/checkout",
    ]),
  );
  expect(ownership.born_on_isolated.note).toContain("not activated");

  const sitemap = read("sitemap-born-on.xml");
  expect(sitemap).toContain("https://cardblueprints.com/born-on</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/born-on/january-15");
  expect(sitemap).not.toContain("/birthday/");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /born-on/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-born-on.xml");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1] ?? "") as Record<string, unknown>;
}

function graphTypes(jsonLd: Record<string, unknown>): string[] {
  const graph = jsonLd["@graph"];
  expect(Array.isArray(graph)).toBe(true);
  return (graph as Array<Record<string, unknown>>).map((node) => String(node["@type"]));
}
