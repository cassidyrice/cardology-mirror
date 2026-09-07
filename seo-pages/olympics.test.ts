import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { buildOlympicsPages } from "./src/olympics/build";
import { medalPhrase, olympicsCheckoutHref, olympicsPath, reservedOlympicsSlugReason } from "./src/olympics/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-olympics-"));
const build = buildOlympicsPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

function visibleWords(html: string): string[] {
  return tokenize(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " "),
  );
}

function tokenize(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

function jaccard(left: string[], right: string[]): number {
  const a = new Set(left);
  const b = new Set(right);
  let inter = 0;
  for (const word of a) {
    if (b.has(word)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

test("builds one hub plus one page per kept Summer Olympian", () => {
  expect(build.people.length).toBeGreaterThan(100);
  expect(build.files).toContain("olympics/summer/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("olympics/summer/") && file.endsWith("/index.html")),
  ).toHaveLength(build.people.length + 1);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedOlympicsSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
    expect(person.gold_count).toBeGreaterThanOrEqual(2);
    expect(person.dob_crosscheck).toBe("match");
  }
});

test("hub lists kept people, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("olympics/summer/index.html");
  expect(html).toContain("Summer Olympians’ Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain(olympicsCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
});

test("sample person pages use /olympics/summer URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const bySlug = new Map(build.people.map((person) => [person.slug, person]));
  const phelps = bySlug.get("michael-phelps");
  expect(phelps).toBeTruthy();
  if (!phelps) return;

  const html = read("olympics/summer/michael-phelps/index.html");
  expect(html).toContain("Michael Phelps&#39;s Birth Card: The King of Hearts");
  expect(html).toContain("1985");
  expect(html).toContain("Q39562");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain(olympicsCheckoutHref("michael-phelps").replace("&", "&amp;"));
  expect(html).toContain("Get the $47 Blueprint Breakdown");
  expect(html).not.toContain("/birth-card/michael-phelps");
  expect(html).toContain("/birth-card/");
  expect(html).not.toContain('action="/create-checkout"');
  expect(html).toContain('rel="canonical" href="https://cardblueprints.com/olympics/summer/michael-phelps"');
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain(medalPhrase(phelps));

  const jsonLd = extractJsonLd(html);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));

  const bolt = bySlug.get("usain-bolt");
  if (bolt) {
    const boltHtml = read("olympics/summer/usain-bolt/index.html");
    expect(boltHtml).toContain("Usain Bolt");
    expect(boltHtml).toContain("5 of Clubs");
    expect(boltHtml).toContain(olympicsPath("usain-bolt"));
  }
});

test("December 31 Olympians render the D1 Joker lineage note when present", () => {
  const jokers = build.people.filter((person) => person.card === "Joker" || person.birth_date.endsWith("-12-31"));
  for (const person of jokers) {
    const html = read(`olympics/summer/${person.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain("December 31");
  }
});

test("pages have 250+ unique words and stay under 30% pairwise body overlap", () => {
  for (const person of build.people) {
    const words = visibleWords(read(`olympics/summer/${person.slug}/index.html`));
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(120);
  }
  const sources = build.people.map((person) => person.source_text.trim());
  expect(new Set(sources).size).toBe(sources.length);
  const step = Math.max(1, Math.floor(build.people.length / 12));
  const samples = build.people.filter((_, index) => index % step === 0).slice(0, 12);
  const bags = samples.map((person) => tokenize(person.source_text));
  for (let i = 0; i < bags.length; i += 1) {
    for (let j = i + 1; j < bags.length; j += 1) {
      expect(jaccard(bags[i] ?? [], bags[j] ?? [])).toBeLessThan(0.3);
    }
  }
});

test("path ownership keeps olympics off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    olympics_summer_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.olympics_summer_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/olympics/summer", "/olympics/summer/{slug}"]),
  );
  expect(ownership.olympics_summer_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /olympics/summer and do not claim celeb routes", () => {
  const sitemap = read("sitemap-olympics-summer.xml");
  expect(sitemap).toContain("https://cardblueprints.com/olympics/summer</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/olympics/summer/michael-phelps");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /olympics/summer/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-olympics-summer.xml");
});

test("checkout helper uses utm_source=olympics-summer", () => {
  expect(olympicsCheckoutHref("michael-phelps")).toBe(
    "/checkout/deep-dive?utm_source=olympics-summer&utm_content=michael-phelps",
  );
  expect(olympicsPath("michael-phelps")).toBe("/olympics/summer/michael-phelps");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
