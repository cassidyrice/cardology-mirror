import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reservedPersonSlugReason } from "./src/urls";
import { evidenceContained, grammyCopy, splitSourceSentences } from "./src/grammys/copy";
import { buildGrammyPages } from "./src/grammys/build";
import { loadCardMeanings } from "./src/grammys/load";
import { renderGrammyPage } from "./src/grammys/render-person";
import type { GrammyRow } from "./src/grammys/types";
import { grammyCheckoutHref, grammyPath, reservedGrammySlugReason } from "./src/grammys/urls";

const tmp = mkdtempSync(join(tmpdir(), "seo-grammys-"));
const build = buildGrammyPages({ outDir: tmp });
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

test("builds one hub plus one page per kept Album of the Year person", () => {
  expect(build.people).toHaveLength(89);
  expect(build.files).toContain("grammys/aoty/index.html");
  expect(build.files).toContain("grammys/aoty/taylor-swift/index.html");
  expect(build.files).toContain("grammys/aoty/henry-mancini/index.html");
  expect(build.files).toContain("grammys/aoty/stevie-wonder/index.html");
  expect(build.files).toContain("grammys/aoty/adele/index.html");
  expect(build.files).toContain("grammys/aoty/bad-bunny/index.html");
  expect(build.files.some((file) => file.startsWith("birth-card/"))).toBe(false);
  expect(
    build.files.filter((file) => file.startsWith("grammys/aoty/") && file.endsWith("/index.html")),
  ).toHaveLength(90);
});

test("does not emit reserved celeb or card-meaning slugs", () => {
  for (const person of build.people) {
    expect(reservedGrammySlugReason(person.slug)).toBeNull();
    expect(reservedPersonSlugReason(person.slug)).toBeNull();
    expect(person.slug).not.toBe("joker");
  }
});

test("hub lists kept people, bands, held exclusions, sources, coordinate voice, and Deep Dive CTA", () => {
  const html = read("grammys/aoty/index.html");
  expect(html).toContain("Grammy Album of the Year Birth Cards");
  expect(html).toContain("89 people");
  expect(html).toContain("/grammys/aoty/taylor-swift");
  expect(html).toContain("/grammys/aoty/bad-bunny");
  expect(html).toContain("coordinates, not fortune-telling");
  expect(html).toContain("Wikidata CC0");
  expect(html).toContain("Wikipedia CC BY-SA 4.0");
  expect(html).toContain("grammy.com");
  expect(html).toContain(grammyCheckoutHref("hub").replace("&", "&amp;"));
  expect(html).not.toContain("/create-checkout");
  expect(html).not.toContain("stripe");
  expect(html).not.toContain("/birth-card/taylor-swift");
  expect(html).toContain("data-slot=\"held\"");
  expect(html).toContain("data-slot=\"bands\"");
  expect(html).toContain("Fleetwood Mac");
  expect(html).toContain("Daft Punk");
  expect(html).toContain("Saturday Night Fever");
  expect(html).toContain("Dropped, not guessed");
});

test("sample pages use /grammys/aoty URLs, UTM, sources, and verified DOBs", () => {
  const swift = read("grammys/aoty/taylor-swift/index.html");
  expect(swift).toContain("Taylor Swift&#39;s Birth Card: The 5 of Clubs");
  expect(swift).toContain("December 13, 1989");
  expect(swift).toContain("1989");
  expect(swift).toContain("Fearless");
  expect(swift).toContain("Folklore");
  expect(swift).toContain("Midnights");
  expect(swift).toContain(grammyCheckoutHref("taylor-swift").replace("&", "&amp;"));
  expect(swift).toContain("Get the $9 Deep Dive");
  expect(swift).not.toContain("/birth-card/taylor-swift");
  expect(swift).toContain("/birth-card/");
  expect(swift).not.toContain('action="/create-checkout"');
  expect(swift).toContain('rel="canonical" href="https://cardblueprints.com/grammys/aoty/taylor-swift"');
  expect(swift).toContain("Wikidata CC0");
  expect(swift).toContain("Wikipedia CC BY-SA 4.0");
  expect(swift).toContain("grammy.com");
  expect(swift).toContain("coordinates, not fortune-telling");

  const mancini = read("grammys/aoty/henry-mancini/index.html");
  expect(mancini).toContain("April 16, 1924");
  expect(mancini).toContain("The Music from Peter Gunn");

  const wonder = read("grammys/aoty/stevie-wonder/index.html");
  expect(wonder).toContain("May 13, 1950");
  expect(wonder).toContain("Innervisions");

  const adele = read("grammys/aoty/adele/index.html");
  expect(adele).toContain("May 5, 1988");
  expect(adele).toContain("21");

  const bunny = read("grammys/aoty/bad-bunny/index.html");
  expect(bunny).toContain("March 10, 1994");
  expect(bunny).toContain("Debí Tirar Más Fotos");

  const jsonLd = extractJsonLd(swift);
  const types = (jsonLd["@graph"] as Array<Record<string, unknown>>).map((node) => node["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "BreadcrumbList", "FAQPage"]));
});

test("December 31 winners render the D1 Joker lineage note", () => {
  const meaning = meanings.get("Joker");
  expect(meaning).toBeTruthy();
  const person: GrammyRow = {
    qid: "Q0AOTY31",
    name: "Ada Fixture Singer",
    slug: "ada-fixture-singer",
    birth_date: "1955-12-31",
    death_date: null,
    card: "Joker",
    source_text: "Ada Fixture Singer is a synthetic fixture used to prove the December 31 Joker slot.",
    source_url: "https://en.wikipedia.org/wiki/Ada_Fixture_Singer",
    wikipedia_title: "Ada Fixture Singer",
    grammy_url: "https://www.grammy.com/awards/categories/album-of-the-year/1971/",
    billing: "primary",
    billed_act: "Ada Fixture Singer",
    awards: [
      {
        year: "1971",
        ceremony_number: 13,
        album: "Example Album",
        grammy_url: "https://www.grammy.com/awards/categories/album-of-the-year/1971/",
        billed_act: "Ada Fixture Singer",
        category: "Album of the Year",
        category_id: "album-of-the-year",
      },
    ],
    wikipedia_infobox_date: "1955-12-31",
    wikidata_birth_date: "1955-12-31",
    dob_crosscheck: "match",
  };
  const html = renderGrammyPage(person, meaning!, []);
  expect(html).toContain("Joker");
  expect(html).toContain('data-cass-lock="D1"');
  expect(html).toContain("December 31");
});

test("pages have 250+ unique words, source_text containment, and stay under 30% pairwise overlap", () => {
  for (const person of build.people) {
    const html = read(`grammys/aoty/${person.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(120);
    const decoded = html
      .replace(/&quot;/g, String.fromCharCode(34))
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toContain(person.source_text.slice(0, 40));
    const copy = grammyCopy(person, meanings.get(person.card)!);
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
  const bodyBags = samples.map((person) => bodyShingles(read(`grammys/aoty/${person.slug}/index.html`)));
  for (let i = 0; i < bodyBags.length; i += 1) {
    for (let j = i + 1; j < bodyBags.length; j += 1) {
      expect(jaccard([...bodyBags[i]], [...bodyBags[j]])).toBeLessThan(0.3);
    }
  }
});

test("path ownership keeps grammys off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    grammys_aoty_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.grammys_aoty_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/grammys/aoty", "/grammys/aoty/{slug}"]),
  );
  expect(ownership.grammys_aoty_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
    ]),
  );
});

test("sitemap and robots stay on /grammys/aoty and do not claim celeb routes", () => {
  const sitemap = read("sitemap-grammy-aoty.xml");
  expect(sitemap).toContain("https://cardblueprints.com/grammys/aoty</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/grammys/aoty/taylor-swift");
  expect(sitemap).not.toContain("/birth-card/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /grammys/aoty/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-grammy-aoty.xml");
});

test("checkout helper uses utm_source=grammy-aoty", () => {
  expect(grammyCheckoutHref("taylor-swift")).toBe(
    "/checkout/deep-dive?utm_source=grammy-aoty&utm_content=taylor-swift",
  );
  expect(grammyPath("taylor-swift")).toBe("/grammys/aoty/taylor-swift");
});

function extractJsonLd(html: string): Record<string, unknown> {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).toBeTruthy();
  return JSON.parse(match![1]) as Record<string, unknown>;
}
