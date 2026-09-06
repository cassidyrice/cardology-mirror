import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { containedEvidence } from "./src/nfl-hof/copy";
import { buildHofPages } from "./src/nfl-hof/build";
import { hofCheckoutHref, hofPath, reservedHofSlugReason } from "./src/nfl-hof/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-nfl-hof-"));
const build = buildHofPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

function visibleWords(html: string): string[] {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

function shingles(words: string[], size = 5): Set<string> {
  const out = new Set<string>();
  for (let index = 0; index + size <= words.length; index += 1) {
    out.add(words.slice(index, index + size).join(" "));
  }
  return out;
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) return 0;
  let inter = 0;
  for (const gram of left) {
    if (right.has(gram)) inter += 1;
  }
  const union = left.size + right.size - inter;
  return union === 0 ? 0 : inter / union;
}

test("builds one hub plus one page per kept inductee", () => {
  expect(build.people.length).toBeGreaterThan(200);
  expect(build.files).toContain("nfl-hof/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(build.files.filter((file) => file.startsWith("nfl-hof/") && file.endsWith("/index.html"))).toHaveLength(
    build.people.length + 1,
  );
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedHofSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("nfl-hof/index.html");
  expect(html).toContain("NFL Hall of Fame Inductee Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("profootballhof.com");
  expect(html).toContain(hofCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
});

test("sample pages use /nfl-hof URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const samples = [
    { slug: "terry-bradshaw", year: "1948", card: "9 of Diamonds" },
    { slug: "franco-harris", year: "1950", card: "3 of Spades" },
    { slug: "pete-rozelle", year: "1926", card: "9 of Spades" },
    { slug: "morten-andersen", year: "1960", card: "7 of Clubs" },
    { slug: "george-blanda", year: "1927", card: "7 of Clubs" },
  ];
  for (const sample of samples) {
    const person = build.people.find((row) => row.slug === sample.slug);
    expect(person).toBeTruthy();
    const html = read(`nfl-hof/${sample.slug}/index.html`);
    expect(html).toContain(`${person!.name}&#39;s Birth Card:`);
    expect(html).toContain(sample.year);
    expect(html).toContain(sample.card);
    expect(html).toContain(person!.qid);
    expect(html).toContain("Wikidata CC0");
    expect(html).toContain("Wikipedia CC BY-SA 4.0");
    expect(html).toContain("profootballhof.com");
    expect(html).toContain(hofCheckoutHref(sample.slug).replace("&", "&amp;"));
    expect(html).toContain("Get the $9 Deep Dive");
    expect(html).not.toContain(`/birth-card/${sample.slug}`);
    expect(html).toContain("/birth-card/");
    expect(html).not.toContain('action="/create-checkout"');
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/nfl-hof/${sample.slug}"`);
    expect(html).toContain('data-slot="sources"');
    expect(html).toContain("coordinates, not fortune-telling");
    expect(html).toContain(hofPath(sample.slug));
  }

  const bradshaw = read("nfl-hof/terry-bradshaw/index.html");
  const jsonLd = extractJsonLd(bradshaw);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("every evidence fact is contained in source_text", () => {
  for (const person of build.people) {
    const evidence = containedEvidence(person.source_text);
    expect(evidence.length).toBeGreaterThan(0);
    for (const fact of evidence) {
      expect(person.source_text.includes(fact)).toBe(true);
    }
    const html = read(`nfl-hof/${person.slug}/index.html`);
    expect(html).toContain('data-slot="evidence"');
    expect(html).toContain('data-slot="source-text"');
  }
});

test("pages have 250+ unique words and unique source_text under 30% overlap", () => {
  for (const person of build.people) {
    const words = visibleWords(read(`nfl-hof/${person.slug}/index.html`));
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(250);
  }
  const sources = build.people.map((person) => person.source_text.trim());
  expect(new Set(sources).size).toBe(sources.length);
  const grams = build.people.map((person) => shingles(tokenize(person.source_text)));
  for (let i = 0; i < grams.length; i += 1) {
    for (let j = i + 1; j < grams.length; j += 1) {
      expect(jaccard(grams[i] ?? new Set(), grams[j] ?? new Set())).toBeLessThan(0.3);
    }
  }
});

test("December 31 inductees render the D1 Joker lineage note", () => {
  const jokers = build.people.filter((person) => person.card === "Joker" || person.birth_date.endsWith("-12-31"));
  for (const person of jokers) {
    const html = read(`nfl-hof/${person.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain("December 31");
  }
});

test("path ownership keeps nfl-hof off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    nfl_hof_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.nfl_hof_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/nfl-hof", "/nfl-hof/{slug}"]),
  );
  expect(ownership.nfl_hof_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /nfl-hof and do not claim celeb routes", () => {
  const sitemap = read("sitemap-nfl-hof.xml");
  expect(sitemap).toContain("https://cardblueprints.com/nfl-hof</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/nfl-hof/terry-bradshaw");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /nfl-hof/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-nfl-hof.xml");
});

test("checkout helper uses utm_source=nfl-hof", () => {
  expect(hofCheckoutHref("terry-bradshaw")).toBe(
    "/checkout/deep-dive?utm_source=nfl-hof&utm_content=terry-bradshaw",
  );
  expect(hofPath("terry-bradshaw")).toBe("/nfl-hof/terry-bradshaw");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
