import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { evidenceContained, pulitzerCopy, splitSourceSentences } from "./src/pulitzer-fiction/copy";
import { buildPulitzerPages } from "./src/pulitzer-fiction/build";
import { loadCardMeanings } from "./src/pulitzer-fiction/load";
import { renderPulitzerPage } from "./src/pulitzer-fiction/render-person";
import type { PulitzerRow } from "./src/pulitzer-fiction/types";
import { pulitzerCheckoutHref, pulitzerPath, reservedPulitzerSlugReason } from "./src/pulitzer-fiction/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-pulitzer-fiction-"));
const build = buildPulitzerPages({ outDir: tmp });
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

test("builds one hub plus one page per kept Fiction winner", () => {
  expect(build.people).toHaveLength(90);
  expect(build.files).toContain("pulitzer/fiction/index.html");
  expect(build.files).toContain("pulitzer/fiction/barbara-kingsolver/index.html");
  expect(build.files).toContain("pulitzer/fiction/colson-whitehead/index.html");
  expect(build.files).toContain("pulitzer/fiction/edith-wharton/index.html");
  expect(build.files).toContain("pulitzer/fiction/toni-morrison/index.html");
  expect(build.files).toContain("pulitzer/fiction/junot-diaz/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("pulitzer/fiction/") && file.endsWith("/index.html")),
  ).toHaveLength(91);
  expect(build.files.some((file) => file.includes("hernan-diaz"))).toBe(false);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedPulitzerSlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("pulitzer/fiction/index.html");
  expect(html).toContain("Pulitzer Prize for Fiction Birth Cards");
  expect(html).toContain("90 people");
  expect(html).toContain("/pulitzer/fiction/barbara-kingsolver");
  expect(html).toContain("/pulitzer/fiction/colson-whitehead");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("pulitzer.org");
  expect(html).toContain(pulitzerCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/barbara-kingsolver");
  expect(html).toContain("data-slot=\"held\"");
  expect(html).toContain("Hernan Diaz");
  expect(html).toContain("Andrew Sean Greer");
  expect(html).toContain("2012");
  expect(html).toContain("Dropped, not guessed");
});

test("sample pages use /pulitzer/fiction URLs, UTM, sources, and verified DOBs", () => {
  const kingsolver = read("pulitzer/fiction/barbara-kingsolver/index.html");
  expect(kingsolver).toContain("Barbara Kingsolver&#39;s Birth Card: The King of Diamonds");
  expect(kingsolver).toContain("April 8, 1955");
  expect(kingsolver).toContain("Demon Copperhead");
  expect(kingsolver).toContain("joint recipient");
  expect(kingsolver).toContain(pulitzerCheckoutHref("barbara-kingsolver").replace("&", "&amp;"));
  expect(kingsolver).toContain("Get the $9 Deep Dive");
  expect(kingsolver).not.toContain("/birth-card/barbara-kingsolver");
  expect(kingsolver).toContain("/birth-card/");
  expect(kingsolver).not.toContain('action="/create-checkout"');
  expect(kingsolver).toContain(
    'rel="canonical" href="https://cardblueprints.com/pulitzer/fiction/barbara-kingsolver"',
  );
  expect(kingsolver).toContain("Wikidata CC0");
  expect(kingsolver).toContain("Wikipedia CC BY-SA 4.0");
  expect(kingsolver).toContain("pulitzer.org");
  expect(kingsolver).toContain("coordinates, not fortune-telling");

  const whitehead = read("pulitzer/fiction/colson-whitehead/index.html");
  expect(whitehead).toContain("November 6, 1969");
  expect(whitehead).toContain("The Underground Railroad");
  expect(whitehead).toContain("The Nickel Boys");

  const wharton = read("pulitzer/fiction/edith-wharton/index.html");
  expect(wharton).toContain("January 24, 1862");
  expect(wharton).toContain("The Age of Innocence");

  const morrison = read("pulitzer/fiction/toni-morrison/index.html");
  expect(morrison).toContain("February 18, 1931");
  expect(morrison).toContain("Beloved");

  const jsonLd = extractJsonLd(kingsolver);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 winners render the D1 Joker lineage note", () => {
  const html = read("pulitzer/fiction/junot-diaz/index.html");
  expect(html).toContain("Joker");
  expect(html).toContain('data-cass-lock="D1"');
  expect(html).toContain("December 31");

  const meaning = meanings.get("Joker");
  expect(meaning).toBeTruthy();
  const person: PulitzerRow = {
    qid: "Q0PUL31",
    name: "Ada Fixture Novelist",
    slug: "ada-fixture-novelist",
    birth_date: "1955-12-31",
    death_date: null,
    card: "Joker",
    source_text: "Ada Fixture Novelist is a synthetic fixture used to prove the December 31 Joker slot.",
    source_url: "https://en.wikipedia.org/wiki/Ada_Fixture_Novelist",
    wikipedia_title: "Ada Fixture Novelist",
    pulitzer_url: "https://www.pulitzer.org/prize-winners-by-year/1971",
    awards: [
      {
        year: "1971",
        work: "Example Novel",
        category: "Pulitzer Prize for Fiction",
        category_id: "fiction",
        pulitzer_url: "https://www.pulitzer.org/prize-winners-by-year/1971",
        shared: false,
      },
    ],
    wikipedia_infobox_date: "1955-12-31",
    wikidata_birth_date: "1955-12-31",
    dob_crosscheck: "match",
    pulitzer_org_birth_date: null,
    pulitzer_org_crosscheck: "unavailable",
  };
  const fixture = renderPulitzerPage(person, meaning!, []);
  expect(fixture).toContain("Joker");
  expect(fixture).toContain('data-cass-lock="D1"');
});

test("pages have 250+ unique words, source_text containment, and stay under 30% pairwise overlap", () => {
  for (const person of build.people) {
    const html = read(`pulitzer/fiction/${person.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(250);
    const decoded = html
      .replace(/&quot;/g, String.fromCharCode(34))
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toContain(person.source_text.slice(0, 40));
    const copy = pulitzerCopy(person, meanings.get(person.card)!);
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
  const bodyBags = samples.map((person) => bodyShingles(read(`pulitzer/fiction/${person.slug}/index.html`)));
  for (let i = 0; i < bodyBags.length; i += 1) {
    for (let j = i + 1; j < bodyBags.length; j += 1) {
      expect(jaccard([...bodyBags[i]], [...bodyBags[j]])).toBeLessThan(0.3);
    }
  }
});

test("path ownership keeps pulitzer fiction off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    pulitzer_fiction_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.pulitzer_fiction_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/pulitzer/fiction", "/pulitzer/fiction/{slug}"]),
  );
  expect(ownership.pulitzer_fiction_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /pulitzer/fiction and do not claim celeb routes", () => {
  const sitemap = read("sitemap-pulitzer-fiction.xml");
  expect(sitemap).toContain("https://cardblueprints.com/pulitzer/fiction</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/pulitzer/fiction/barbara-kingsolver");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /pulitzer/fiction/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-pulitzer-fiction.xml");
});

test("checkout helper uses utm_source=pulitzer-fiction", () => {
  expect(pulitzerCheckoutHref("barbara-kingsolver")).toBe(
    "/checkout/deep-dive?utm_source=pulitzer-fiction&utm_content=barbara-kingsolver",
  );
  expect(pulitzerPath("barbara-kingsolver")).toBe("/pulitzer/fiction/barbara-kingsolver");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
