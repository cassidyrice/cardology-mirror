import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { evidenceContained, houseChairCopy, splitSourceSentences } from "./src/house-chairs/copy";
import { buildHouseChairPages } from "./src/house-chairs/build";
import { loadCardMeanings } from "./src/house-chairs/load";
import { renderHouseChairPage } from "./src/house-chairs/render-person";
import type { HouseChairRow } from "./src/house-chairs/types";
import {
  houseChairCheckoutHref,
  houseChairPath,
  reservedHouseChairSlugReason,
} from "./src/house-chairs/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-house-chairs-"));
const build = buildHouseChairPages({ outDir: tmp });
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

test("builds one hub plus one page per verified House leader or standing chair", () => {
  expect(build.people).toHaveLength(29);
  expect(build.files).toContain("house-chairs/index.html");
  expect(build.files).toContain("house-chairs/mike-johnson/index.html");
  expect(build.files).toContain("house-chairs/steve-scalise/index.html");
  expect(build.files).toContain("house-chairs/hakeem-jeffries/index.html");
  expect(build.files).toContain("house-chairs/tom-emmer/index.html");
  expect(build.files).toContain("house-chairs/jim-jordan/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("house-chairs/") && file.endsWith("/index.html")),
  ).toHaveLength(30);
  expect(build.files.some((file) => file.includes("bryan-steil"))).toBe(false);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedHouseChairSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("house-chairs/index.html");
  expect(html).toContain("US House Leadership and Standing Committee Chair Birth Cards");
  expect(html).toContain("29 verified people");
  expect(html).toContain("/house-chairs/mike-johnson");
  expect(html).toContain("/house-chairs/jim-jordan");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("house.gov/leadership");
  expect(html).toContain("history.house.gov");
  expect(html).toContain(houseChairCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/mike-johnson");
  expect(html).toContain('data-slot="held"');
  expect(html).toContain("Bryan Steil");
  expect(html).toContain("Dropped, not guessed");
});

test("sample pages use /house-chairs URLs, UTM, sources, and verified DOBs", () => {
  const johnson = read("house-chairs/mike-johnson/index.html");
  expect(johnson).toContain("Mike Johnson&#39;s Birth Card: The 10 of Clubs");
  expect(johnson).toContain("Speaker of the House");
  expect(johnson).toContain("January 30, 1972");
  expect(johnson).toContain(houseChairCheckoutHref("mike-johnson").replace("&", "&amp;"));
  expect(johnson).toContain("Get the $47 Blueprint Breakdown");
  expect(johnson).not.toContain("/birth-card/mike-johnson");
  expect(johnson).toContain("/birth-card/");
  expect(johnson).not.toContain('action="/create-checkout"');
  expect(johnson).toContain('rel="canonical" href="https://cardblueprints.com/house-chairs/mike-johnson"');
  expect(johnson).toContain("Wikidata CC0");
  expect(johnson).toContain("Wikipedia CC BY-SA 4.0");
  expect(johnson).toContain("house.gov/leadership");
  expect(johnson).toContain("coordinates, not fortune-telling");

  const scalise = read("house-chairs/steve-scalise/index.html");
  expect(scalise).toContain("October 6, 1965");
  expect(scalise).toContain("Majority Leader");

  const jeffries = read("house-chairs/hakeem-jeffries/index.html");
  expect(jeffries).toContain("August 4, 1970");
  expect(jeffries).toContain("Democratic Leader");

  const emmer = read("house-chairs/tom-emmer/index.html");
  expect(emmer).toContain("March 3, 1961");
  expect(emmer).toContain("Majority Whip");

  const jordan = read("house-chairs/jim-jordan/index.html");
  expect(jordan).toContain("February 17, 1964");
  expect(jordan).toContain("Judiciary");

  const jsonLd = extractJsonLd(johnson);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 officers render the D1 Joker lineage note", () => {
  const meaning = meanings.get("Joker");
  expect(meaning).toBeTruthy();
  const person: HouseChairRow = {
    qid: "Q0HOU31",
    name: "Ada Fixture Chair",
    slug: "ada-fixture-chair",
    office: "Speaker of the House",
    office_id: "speaker",
    role_kind: "leadership",
    sort_order: 1,
    party: "Republican",
    state: "Louisiana",
    state_slug: "louisiana",
    postal: "LA",
    district: 4,
    bioguide: "A000000",
    committee_thomas_id: null,
    birth_date: "1955-12-31",
    death_date: null,
    card: "Joker",
    source_text: "Ada Fixture Chair is a synthetic fixture used to prove the December 31 Joker slot.",
    source_url: "https://en.wikipedia.org/wiki/Ada_Fixture_Chair",
    wikipedia_title: "Ada Fixture Chair",
    wikipedia_infobox_date: "1955-12-31",
    wikidata_birth_date: "1955-12-31",
    bioguide_birth_date: "1955-12-31",
    dob_crosscheck: "match",
    bioguide_url: "https://bioguide.congress.gov/search/bio/A000000",
    congress_url: "https://www.congress.gov/member/ada-fixture-chair/A000000",
    history_house_url: "https://history.house.gov/People/Detail/?id=A000000",
    house_gov_url: "https://www.house.gov/leadership",
  };
  const fixture = renderHouseChairPage(person, meaning!, []);
  expect(fixture).toContain("Joker");
  expect(fixture).toContain('data-cass-lock="D1"');
  expect(fixture).toContain("December 31");
});

test("pages have 250+ unique words, source_text containment, and stay under 30% pairwise overlap", () => {
  for (const person of build.people) {
    const html = read(`house-chairs/${person.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(250);
    const decoded = html
      .replace(/&quot;/g, String.fromCharCode(34))
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toContain(person.source_text.slice(0, 40));
    const copy = houseChairCopy(person, meanings.get(person.card)!);
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
  const bodyBags = samples.map((person) => bodyShingles(read(`house-chairs/${person.slug}/index.html`)));
  for (let i = 0; i < bodyBags.length; i += 1) {
    for (let j = i + 1; j < bodyBags.length; j += 1) {
      expect(jaccard([...bodyBags[i]], [...bodyBags[j]])).toBeLessThan(0.3);
    }
  }
});

test("path ownership keeps house-chairs off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "house-chairs-path-ownership.json"), "utf8"),
  ) as {
    pages_will_own: string[];
    must_not_own: string[];
  };

  expect(ownership.pages_will_own).toEqual(
    expect.arrayContaining(["/house-chairs", "/house-chairs/{slug}"]),
  );
  expect(ownership.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /house-chairs and do not claim celeb routes", () => {
  const sitemap = read("sitemap-house-chairs.xml");
  expect(sitemap).toContain("https://cardblueprints.com/house-chairs</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/house-chairs/mike-johnson");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /house-chairs/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-house-chairs.xml");
});

test("checkout helper uses utm_source=house-chairs", () => {
  expect(houseChairCheckoutHref("mike-johnson")).toBe(
    "/checkout/deep-dive?utm_source=house-chairs&utm_content=mike-johnson",
  );
  expect(houseChairPath("mike-johnson")).toBe("/house-chairs/mike-johnson");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
