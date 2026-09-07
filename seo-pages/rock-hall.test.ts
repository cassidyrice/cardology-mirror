import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { rockHallCopy, sourceProse } from "./src/rock-hall/copy";
import { buildRockHallPages } from "./src/rock-hall/build";
import { rockHallCheckoutHref, rockHallPath, reservedRockHallSlugReason } from "./src/rock-hall/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-rock-hall-"));
const build = buildRockHallPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

function visibleWords(html: string): string[] {
  const body = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const text = body.replace(/<[^>]+>/g, " ");
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
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

test("builds one hub plus one page per kept Rock Hall inductee", () => {
  expect(build.people.length).toBeGreaterThan(0);
  expect(build.files).toContain("rock-hall/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("rock-hall/") && file.endsWith("/index.html")),
  ).toHaveLength(build.people.length + 1);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedRockHallSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("rock-hall/index.html");
  expect(html).toContain("Rock &amp; Roll Hall of Fame Inductees");
  expect(html).toContain("Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("rockhall.com/inductees");
  expect(html).toContain(rockHallCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/chuck-berry");
  expect(html).toContain("data-slot=\"held\"");
  expect(html).toContain("Dropped, not guessed");
});

test("person pages use /rock-hall URLs, UTM, sources, and leave /birth-card person routes alone", () => {
  const sample = build.people.find((person) => person.slug === "chuck-berry") ?? build.people[0];
  expect(sample).toBeTruthy();
  const html = read(`rock-hall/${sample.slug}/index.html`);
  expect(html).toContain("Birth Card:");
  expect(html).toContain(sample.name.includes("'") ? sample.name.replace("'", "&#39;") : sample.name);
  expect(html).toContain(sample.qid);
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("rockhall.com");
  expect(html).toContain(rockHallCheckoutHref(sample.slug).replace("&", "&amp;"));
  expect(html).toContain("Get the $9 Deep Dive");
  expect(html).not.toContain(`/birth-card/${sample.slug}`);
  expect(html).toContain("/birth-card/");
  expect(html).not.toContain('action="/create-checkout"');
  expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/rock-hall/${sample.slug}"`);
  expect(html).toContain('data-slot="sources"');
  expect(html).toContain("coordinates, not fortune-telling");

  const jsonLd = extractJsonLd(html);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("known inductees keep public day-precision dates when present", () => {
  const bySlug = new Map(build.people.map((person) => [person.slug, person]));
  const berry = bySlug.get("chuck-berry");
  if (berry) {
    expect(berry.birth_date).toBe("1926-10-18");
    const html = read("rock-hall/chuck-berry/index.html");
    expect(html).toContain("October 18, 1926");
    expect(html).toContain(rockHallPath("chuck-berry"));
  }
  const elvis = bySlug.get("elvis-presley");
  if (elvis) {
    expect(elvis.birth_date).toBe("1935-01-08");
    expect(read("rock-hall/elvis-presley/index.html")).toContain("January 8, 1935");
  }
});

test("December 31 inductees render the D1 Joker lineage note", () => {
  const jokers = build.people.filter((person) => person.card === "Joker" || person.birth_date.endsWith("-12-31"));
  for (const person of jokers) {
    const html = read(`rock-hall/${person.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain("December 31");
  }
});

test("evidence facts stay inside source_text and pages stay thick enough", () => {
  const meanings = new Map(
    build.people.map((person) => {
      const html = read(`rock-hall/${person.slug}/index.html`);
      return [person.slug, html] as const;
    }),
  );
  for (const person of build.people) {
    const words = visibleWords(meanings.get(person.slug) ?? "");
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(120);
    const copy = rockHallCopy(person, {
      symbol: person.card,
      label: "Example Card",
      slug: "example-card",
      title: "Example",
      core_identity: "Example identity",
      sweet_spot: "Example sweet spot",
    });
    // Evidence is drawn from the full lead section now, not the REST summary.
    const source = sourceProse(person).toLowerCase();
    for (const fact of copy.evidence.slice(0, 3)) {
      const normalized = fact.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
      const sourceLoose = source.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
      const contained =
        source.includes(fact.toLowerCase()) ||
        sourceLoose.includes(normalized) ||
        fact.includes("Wikipedia REST summary") ||
        fact.includes("No extra biographical facts");
      expect(contained).toBe(true);
    }
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

test("path ownership keeps rock-hall off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    rock_hall_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.rock_hall_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/rock-hall", "/rock-hall/{slug}"]),
  );
  expect(ownership.rock_hall_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /rock-hall and do not claim celeb routes", () => {
  const sitemap = read("sitemap-rock-hall.xml");
  expect(sitemap).toContain("https://cardblueprints.com/rock-hall</loc>");
  expect(sitemap).not.toContain("/birth-card/");
  if (build.people[0]) {
    expect(sitemap).toContain(`https://cardblueprints.com/rock-hall/${build.people[0].slug}`);
  }

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /rock-hall/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-rock-hall.xml");
});

test("rock-hall checkout helper uses utm_source=rock-hall", () => {
  expect(rockHallCheckoutHref("chuck-berry")).toBe(
    "/checkout/deep-dive?utm_source=rock-hall&utm_content=chuck-berry",
  );
  expect(rockHallPath("chuck-berry")).toBe("/rock-hall/chuck-berry");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
