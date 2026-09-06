import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { evidenceContained, splitSourceSentences, timePotyCopy } from "./src/time-poty/copy";
import { buildTimePotyPages } from "./src/time-poty/build";
import { loadCardMeanings } from "./src/time-poty/load";
import { renderTimePotyPage } from "./src/time-poty/render-person";
import type { TimePotyRow } from "./src/time-poty/types";
import { timePotyCheckoutHref, timePotyPath, reservedTimePotySlugReason } from "./src/time-poty/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-time-poty-"));
const build = buildTimePotyPages({ outDir: tmp });
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

test("builds one hub plus one page per kept TIME Person of the Year", () => {
  expect(build.people.length).toBeGreaterThan(0);
  expect(build.files).toContain("time-person-of-the-year/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("time-person-of-the-year/") && file.endsWith("/index.html")),
  ).toHaveLength(build.people.length + 1);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedTimePotySlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("time-person-of-the-year/index.html");
  expect(html).toContain("TIME Person of the Year Birth Cards");
  expect(html).toContain(`${build.people.length} people`);
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("time.com/vault");
  expect(html).toContain("context only");
  expect(html).toContain(timePotyCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/charles-lindbergh");
  expect(html).toContain("data-slot=\"held\"");
  expect(html).toContain("Dropped, not guessed");
});

test("sample pages use /time-person-of-the-year URLs, UTM, sources, and verified DOBs", () => {
  const samples: Array<[string, string, string]> = [
    ["charles-lindbergh", "February 4, 1902", "Charles Lindbergh"],
    ["jeff-bezos", "January 12, 1964", "Jeff Bezos"],
    ["barack-obama", "August 4, 1961", "Barack Obama"],
    ["angela-merkel", "July 17, 1954", "Angela Merkel"],
    ["taylor-swift", "December 13, 1989", "Taylor Swift"],
  ];
  for (const [slug, dateLabel, name] of samples) {
    const person = build.people.find((row) => row.slug === slug);
    expect(person).toBeTruthy();
    const html = read(`time-person-of-the-year/${slug}/index.html`);
    expect(html).toContain("Birth Card:");
    expect(html).toContain(dateLabel);
    expect(html).toContain(timePotyCheckoutHref(slug).replace("&", "&amp;"));
    expect(html).toContain("Get the $9 Deep Dive");
    expect(html).not.toContain(`/birth-card/${slug}`);
    expect(html).toContain("/birth-card/");
    expect(html).not.toContain('action="/create-checkout"');
    expect(html).toContain(
      `rel="canonical" href="https://cardblueprints.com/time-person-of-the-year/${slug}"`,
    );
    expect(html).toContain("Wikidata CC0");
    expect(html).toContain("Wikipedia CC BY-SA 4.0");
    expect(html).toContain("time.com/vault");
    expect(html).toContain("coordinates, not fortune-telling");
    expect(html).toContain(name === "Charles Lindbergh" ? "Charles Lindbergh" : name);
  }

  const jsonLd = extractJsonLd(read("time-person-of-the-year/jeff-bezos/index.html"));
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 honorees render the D1 Joker lineage note", () => {
  const meaning = meanings.get("Joker");
  expect(meaning).toBeTruthy();
  const person: TimePotyRow = {
    qid: "Q0POTY31",
    name: "Ada Fixture Honoree",
    slug: "ada-fixture-honoree",
    birth_date: "1955-12-31",
    death_date: null,
    card: "Joker",
    source_text: "Ada Fixture Honoree is a synthetic fixture used to prove the December 31 Joker slot.",
    source_url: "https://en.wikipedia.org/wiki/Ada_Fixture_Honoree",
    wikipedia_title: "Ada Fixture Honoree",
    wikipedia_list_url: "https://en.wikipedia.org/wiki/Time_Person_of_the_Year",
    time_context_url: "https://time.com/vault/",
    honors: [
      {
        year: "1999",
        choice_label: "Ada Fixture Honoree",
        shared: false,
        wikipedia_list_url: "https://en.wikipedia.org/wiki/Time_Person_of_the_Year",
        time_context_url: "https://time.com/vault/",
      },
    ],
    wikipedia_infobox_date: "1955-12-31",
    wikidata_birth_date: "1955-12-31",
    dob_crosscheck: "match",
  };
  const fixture = renderTimePotyPage(person, meaning!, []);
  expect(fixture).toContain("Joker");
  expect(fixture).toContain('data-cass-lock="D1"');
  expect(fixture).toContain("December 31");

  for (const row of build.people.filter((item) => item.card === "Joker" || item.birth_date.endsWith("-12-31"))) {
    const html = read(`time-person-of-the-year/${row.slug}/index.html`);
    expect(html).toContain("Joker");
    expect(html).toContain('data-cass-lock="D1"');
  }
});

test("pages have 250+ unique words, source_text containment, and stay under 30% pairwise overlap", () => {
  for (const person of build.people) {
    const html = read(`time-person-of-the-year/${person.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(250);
    const decoded = html
      .replace(/&quot;/g, String.fromCharCode(34))
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toContain(person.source_text.slice(0, 40));
    const copy = timePotyCopy(person, meanings.get(person.card)!);
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
  const bodyBags = samples.map((person) => bodyShingles(read(`time-person-of-the-year/${person.slug}/index.html`)));
  for (let i = 0; i < bodyBags.length; i += 1) {
    for (let j = i + 1; j < bodyBags.length; j += 1) {
      expect(jaccard([...bodyBags[i]], [...bodyBags[j]])).toBeLessThan(0.3);
    }
  }
});

test("path ownership keeps time-person-of-the-year off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    time_poty_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.time_poty_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/time-person-of-the-year", "/time-person-of-the-year/{slug}"]),
  );
  expect(ownership.time_poty_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /time-person-of-the-year and do not claim celeb routes", () => {
  const sitemap = read("sitemap-time-person-of-the-year.xml");
  expect(sitemap).toContain("https://cardblueprints.com/time-person-of-the-year</loc>");
  expect(sitemap).not.toContain("/birth-card/");
  if (build.people[0]) {
    expect(sitemap).toContain(`https://cardblueprints.com/time-person-of-the-year/${build.people[0].slug}`);
  }

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /time-person-of-the-year/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-time-person-of-the-year.xml");
});

test("checkout helper uses utm_source=time-poty", () => {
  expect(timePotyCheckoutHref("charles-lindbergh")).toBe(
    "/checkout/deep-dive?utm_source=time-poty&utm_content=charles-lindbergh",
  );
  expect(timePotyPath("charles-lindbergh")).toBe("/time-person-of-the-year/charles-lindbergh");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
