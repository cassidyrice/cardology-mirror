import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { evidenceContained, kennedyCenterCopy, splitSourceSentences } from "./src/kennedy-center-honors/copy";
import { buildKennedyCenterPages } from "./src/kennedy-center-honors/build";
import { loadCardMeanings } from "./src/kennedy-center-honors/load";
import { renderKennedyCenterPage } from "./src/kennedy-center-honors/render-person";
import type { KennedyCenterRow } from "./src/kennedy-center-honors/types";
import {
  kennedyCenterCheckoutHref,
  kennedyCenterPath,
  reservedKennedyCenterSlugReason,
} from "./src/kennedy-center-honors/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-kennedy-center-honors-"));
const build = buildKennedyCenterPages({ outDir: tmp });
const meanings = loadCardMeanings(join(import.meta.dir, "..", "pipeline", "data", "card_meanings.json"));

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
    .replace(/&quot;/g, String.fromCharCode(34))
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

function bodyShingles(html: string): Set<string> {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const words = tokenize(
    main
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/data-slot="cta"[\s\S]*?<\/section>/gi, " ")
      .replace(/data-slot="faq"[\s\S]*?<\/section>/gi, " ")
      .replace(/data-slot="card-meaning"[\s\S]*?<\/section>/gi, " ")
      .replace(/data-slot="coordinate-note"[\s\S]*?<\/p>/gi, " ")
      .replace(/data-slot="sources"[\s\S]*?<\/p>/gi, " ")
      .replace(/data-slot="same-card"[\s\S]*?<\/section>/gi, " "),
  );
  const out = new Set<string>();
  for (let index = 0; index + 5 <= words.length; index += 1) {
    out.add(words.slice(index, index + 5).join(" "));
  }
  return out;
}

test("builds one hub plus one page per kept Kennedy Center honoree", () => {
  expect(build.people.length).toBeGreaterThan(0);
  expect(build.files).toContain("kennedy-center-honors/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("kennedy-center-honors/") && file.endsWith("/index.html")),
  ).toHaveLength(build.people.length + 1);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedKennedyCenterSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("kennedy-center-honors/index.html");
  expect(html).toContain("Kennedy Center Honors Recipients");
  expect(html).toContain("Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("kennedy-center.org/whats-on/honors");
  expect(html).toContain(kennedyCenterCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/neil-diamond");
  expect(html).toContain("data-slot=\"held\"");
  expect(html).toContain("Dropped, not guessed");
});

test("sample pages use /kennedy-center-honors URLs, UTM, sources, and verified DOBs", () => {
  const samples: Record<string, { date: string; monthDay: string }> = {
    "neil-diamond": { date: "1941-01-24", monthDay: "January 24, 1941" },
    "tony-bennett": { date: "1926-08-03", monthDay: "August 3, 1926" },
    "paul-mccartney": { date: "1942-06-18", monthDay: "June 18, 1942" },
    "stevie-wonder": { date: "1950-05-13", monthDay: "May 13, 1950" },
    sting: { date: "1951-10-02", monthDay: "October 2, 1951" },
  };
  const bySlug = new Map(build.people.map((person) => [person.slug, person]));
  for (const [slug, expected] of Object.entries(samples)) {
    const person = bySlug.get(slug);
    expect(person).toBeTruthy();
    expect(person!.birth_date).toBe(expected.date);
    const html = read(`kennedy-center-honors/${slug}/index.html`);
    expect(html).toContain("Birth Card:");
    expect(html).toContain(expected.monthDay);
    expect(html).toContain(person!.qid);
    expect(html).toContain("Wikidata CC0");
    expect(html).toContain("Wikipedia CC BY-SA 4.0");
    expect(html).toContain("kennedy-center.org");
    expect(html).toContain(kennedyCenterCheckoutHref(slug).replace("&", "&amp;"));
    expect(html).toContain("Get the $9 Deep Dive");
    expect(html).not.toContain(`/birth-card/${slug}`);
    expect(html).toContain("/birth-card/");
    expect(html).not.toContain('action="/create-checkout"');
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/kennedy-center-honors/${slug}"`);
    expect(html).toContain('data-slot="sources"');
    expect(html).toContain("coordinates, not fortune-telling");
  }

  const jsonLd = extractJsonLd(read("kennedy-center-honors/neil-diamond/index.html"));
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 honorees render the D1 Joker lineage note", () => {
  const jokers = build.people.filter((person) => person.card === "Joker" || person.birth_date.endsWith("-12-31"));
  for (const person of jokers) {
    const html = read(`kennedy-center-honors/${person.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
    expect(html).toContain("December 31");
  }

  const meaning = meanings.get("Joker");
  expect(meaning).toBeTruthy();
  const person: KennedyCenterRow = {
    qid: "Q0KCH31",
    name: "Ada Fixture Honoree",
    slug: "ada-fixture-honoree",
    birth_date: "1955-12-31",
    death_date: null,
    card: "Joker",
    source_text: "Ada Fixture Honoree is a synthetic fixture used to prove the December 31 Joker slot.",
    source_url: "https://en.wikipedia.org/wiki/Ada_Fixture_Honoree",
    wikipedia_title: "Ada Fixture Honoree",
    kennedy_center_url: "https://www.kennedy-center.org/whats-on/honors/",
    wikipedia_list_url: "https://en.wikipedia.org/wiki/Kennedy_Center_Honors",
    primary_role: "solo",
    honors: [
      {
        year: "2011",
        act: "Ada Fixture Honoree",
        act_wikipedia_title: "Ada Fixture Honoree",
        role: "solo",
        kennedy_center_url: "https://www.kennedy-center.org/whats-on/honors/",
      },
    ],
    wikipedia_infobox_date: "1955-12-31",
    wikidata_birth_date: "1955-12-31",
    dob_crosscheck: "match",
    kennedy_center_birth_date: null,
    kennedy_center_crosscheck: "unavailable",
  };
  const fixture = renderKennedyCenterPage(person, meaning!, []);
  expect(fixture).toContain("Joker");
  expect(fixture).toContain('data-cass-lock="D1"');
});

test("pages have 250+ unique words, source_text containment, and stay under 30% pairwise overlap", () => {
  for (const person of build.people) {
    const html = read(`kennedy-center-honors/${person.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(250);
    const decoded = html
      .replace(/&quot;/g, String.fromCharCode(34))
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toContain(person.source_text.slice(0, 40));
    const copy = kennedyCenterCopy(person, meanings.get(person.card)!);
    for (const fact of copy.evidence.slice(0, splitSourceSentences(person.source_text).length)) {
      if (splitSourceSentences(person.source_text).includes(fact)) {
        expect(evidenceContained(person.source_text, fact)).toBe(true);
      }
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
  const bodyBags = samples.map((person) => bodyShingles(read(`kennedy-center-honors/${person.slug}/index.html`)));
  for (let i = 0; i < bodyBags.length; i += 1) {
    for (let j = i + 1; j < bodyBags.length; j += 1) {
      expect(jaccard([...bodyBags[i]], [...bodyBags[j]])).toBeLessThan(0.3);
    }
  }
});

test("path ownership keeps kennedy-center-honors off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    kennedy_center_honors_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.kennedy_center_honors_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/kennedy-center-honors", "/kennedy-center-honors/{slug}"]),
  );
  expect(ownership.kennedy_center_honors_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /kennedy-center-honors and do not claim celeb routes", () => {
  const sitemap = read("sitemap-kennedy-center-honors.xml");
  expect(sitemap).toContain("https://cardblueprints.com/kennedy-center-honors</loc>");
  expect(sitemap).not.toContain("/birth-card/");
  if (build.people[0]) {
    expect(sitemap).toContain(`https://cardblueprints.com/kennedy-center-honors/${build.people[0].slug}`);
  }

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /kennedy-center-honors/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-kennedy-center-honors.xml");
});

test("checkout helper uses utm_source=kennedy-center-honors", () => {
  expect(kennedyCenterCheckoutHref("neil-diamond")).toBe(
    "/checkout/deep-dive?utm_source=kennedy-center-honors&utm_content=neil-diamond",
  );
  expect(kennedyCenterPath("neil-diamond")).toBe("/kennedy-center-honors/neil-diamond");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
