import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildMlbPages } from "./src/mlb/build";
import { reservedMlbSlugReason } from "./src/mlb/urls";

const tmp = mkdtempSync(join(tmpdir(), "mlb-pages-"));
const build = buildMlbPages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

const VERIFIED = {
  "atlanta-braves": "1876-04-22",
  "chicago-cubs": "1876-04-25",
  "new-york-yankees": "1903-04-22",
  "washington-nationals": "1969-04-08",
  "arizona-diamondbacks": "1998-03-31",
} as const;

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

function visibleWords(html: string): string[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

test("builds hub plus 30 current MLB clubs", () => {
  expect(build.clubs).toHaveLength(30);
  expect(build.files).toContain("mlb/index.html");
  expect(build.files.filter((file) => file.startsWith("mlb/") && file.endsWith("/index.html"))).toHaveLength(
    31,
  );
});

test("rejects reserved MLB slugs", () => {
  expect(reservedMlbSlugReason("ace-of-spades")).toContain("52-card");
  expect(reservedMlbSlugReason("joker")).toContain("joker");
  expect(reservedMlbSlugReason("december-31")).toContain("month-day");
  expect(reservedMlbSlugReason("atlanta-braves")).toBeNull();
});

test("verified first-game samples render with citations", () => {
  for (const [slug, iso] of Object.entries(VERIFIED)) {
    const html = read(`mlb/${slug}/index.html`);
    expect(html).toContain(`datetime="${iso}"`);
    expect(html).toContain("baseball-reference.com/teams/");
    expect(html).toContain("retrosheet.org");
    expect(html).toContain('data-slot="sources"');
    expect(html).toContain("Wikipedia");
  }
  expect(read("mlb/atlanta-braves/index.html")).toContain("April 22, 1876");
  expect(read("mlb/atlanta-braves/index.html")).toContain("1871");
  expect(read("mlb/new-york-yankees/index.html")).toContain("Queen of Clubs");
  expect(read("mlb/new-york-yankees/index.html")).not.toContain("Queen of Club<");
});

test("every club page cites a day-precise first game and BBRef", () => {
  for (const club of build.clubs) {
    const html = read(`mlb/${club.slug}/index.html`);
    expect(club.first_game_status).toBe("verified");
    expect(html).toContain(`datetime="${club.first_game}"`);
    expect(html).toContain(club.first_season_name.replace(/&/g, "&amp;"));
    expect(html).toContain("Baseball-Reference");
    expect(html).toContain(club.card.label);
    expect(html).not.toContain("/birth-card/" + club.slug);
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/mlb/${club.slug}"`);
    expect(html).toContain("player date of birth does not set it");
  }
});

test("pages have 250+ words with dates and card meaning woven in", () => {
  for (const club of build.clubs) {
    const html = read(`mlb/${club.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(120);
    expect(html).toContain(club.card.archetype);
    expect(html).toContain(club.card.sweet_spot);
    expect(html).toContain("coordinates");
  }
});

test("Deep Dive CTA uses mlb UTM and does not add checkout code", () => {
  const braves = read("mlb/atlanta-braves/index.html");
  expect(braves).toContain("/checkout/deep-dive?utm_source=mlb&amp;utm_content=atlanta-braves");
  expect(braves).toContain("$47 Blueprint Breakdown Video");
  expect(braves).not.toContain("data-checkout-stub");
  expect(braves).not.toContain("/create-checkout");

  const hub = read("mlb/index.html");
  expect(hub).toContain("/checkout/deep-dive?utm_source=mlb&amp;utm_content=hub");
});

test("hub lists all 30 by date and by card and calls out the 1969 quartet", () => {
  const hub = read("mlb/index.html");
  expect(hub).toContain("1969 April 8 expansion quartet");
  expect(hub).toContain("King of Diamonds");
  for (const club of build.clubs) {
    expect(hub).toContain(`/mlb/${club.slug}`);
    expect(hub).toContain(club.name);
    expect(hub).toContain(club.first_game);
  }
  expect(hub).toContain("Kansas City Royals");
  expect(hub).toContain("Washington Nationals");
});

test("1969 quartet pages name their three siblings", () => {
  const html = read("mlb/kansas-city-royals/index.html");
  expect(html).toContain("Milwaukee Brewers");
  expect(html).toContain("San Diego Padres");
  expect(html).toContain("Washington Nationals");
  expect(html).toContain("King of Diamonds");
  expect(html).toContain("1969-04-08");
});

test("JSON-LD uses SportsTeam and FAQ, not Person", () => {
  const html = read("mlb/atlanta-braves/index.html");
  const jsonLd = extractJsonLd(html);
  const types = graphTypes(jsonLd);
  expect(types).toContain("SportsTeam");
  expect(types).toContain("BreadcrumbList");
  expect(types).toContain("FAQPage");
  expect(types).not.toContain("Person");
  expect(jsonLd["@graph"]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "SportsTeam",
        foundingDate: "1876-04-22",
        name: "Atlanta Braves",
        sport: "Baseball",
      }),
    ]),
  );
});

test("MLB path ownership stays off person and live card routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "mlb-path-ownership.json"), "utf8"),
  ) as { pages_will_own: string[]; never_own: string[] };
  expect(ownership.pages_will_own).toEqual(
    expect.arrayContaining(["/mlb", "/mlb/{slug}", "/sitemap-mlb.xml"]),
  );
  expect(ownership.never_own).toEqual(
    expect.arrayContaining(["/birth-card/{slug}", "/birth-card/{rank}-of-{suit}", "/checkout"]),
  );
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
