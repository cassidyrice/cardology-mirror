import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildFranchisePages } from "./src/build-franchises";
import { reservedFranchiseSlugReason } from "./src/franchise-urls";

const tmp = mkdtempSync(join(tmpdir(), "franchise-pages-"));
const build = buildFranchisePages({ outDir: tmp });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

const VERIFIED = {
  "dallas-cowboys": "1960-01-28",
  "houston-texans": "1999-10-06",
  "carolina-panthers": "1993-10-26",
  "baltimore-ravens": "1996-02-09",
  "green-bay-packers": "1921-08-27",
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

test("builds hub plus 32 current franchises", () => {
  expect(build.franchises).toHaveLength(32);
  expect(build.files).toContain("franchise/index.html");
  expect(build.files.filter((file) => file.startsWith("franchise/") && file.endsWith("/index.html"))).toHaveLength(
    33,
  );
});

test("rejects reserved franchise slugs", () => {
  expect(reservedFranchiseSlugReason("ace-of-spades")).toContain("52-card");
  expect(reservedFranchiseSlugReason("joker")).toContain("joker");
  expect(reservedFranchiseSlugReason("december-31")).toContain("month-day");
  expect(reservedFranchiseSlugReason("dallas-cowboys")).toBeNull();
});

test("verified HOF grant samples render with citations", () => {
  for (const [slug, iso] of Object.entries(VERIFIED)) {
    const html = read(`franchise/${slug}/index.html`);
    expect(html).toContain(`datetime="${iso}"`);
    expect(html).toContain("profootballhof.com/football-history/national-football-league-franchise-histories");
    expect(html).toContain("data-slot=\"sources\"");
    expect(html).toContain("Wikipedia");
  }
  expect(read("franchise/green-bay-packers/index.html")).toContain("August 27, 1921");
  expect(read("franchise/green-bay-packers/index.html")).toContain("1919");
  expect(read("franchise/dallas-cowboys/index.html")).toContain("Queen of Clubs");
  expect(read("franchise/dallas-cowboys/index.html")).not.toContain("Queen of Club<");
});

test("every team page cites a day-precise grant and the HOF table", () => {
  for (const franchise of build.franchises) {
    const html = read(`franchise/${franchise.slug}/index.html`);
    expect(franchise.grant_date_status).toBe("verified");
    expect(html).toContain(`datetime="${franchise.grant_date}"`);
    expect(html).toContain(franchise.hof_row_name.replace(/&/g, "&amp;"));
    expect(html).toContain("Hall of Fame");
    expect(html).toContain(franchise.card.label);
    expect(html).not.toContain("/birth-card/" + franchise.slug);
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/franchise/${franchise.slug}"`);
  }
});

test("pages have 250+ words with dates and card meaning woven in", () => {
  for (const franchise of build.franchises) {
    const html = read(`franchise/${franchise.slug}/index.html`);
    const words = visibleWords(html);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(new Set(words).size).toBeGreaterThanOrEqual(120);
    expect(html).toContain(franchise.card.archetype);
    expect(html).toContain(franchise.card.sweet_spot);
    expect(html).toContain("coordinates");
  }
});

test("Deep Dive CTA uses nfl UTM and does not add checkout code", () => {
  const cowboys = read("franchise/dallas-cowboys/index.html");
  expect(cowboys).toContain("/checkout/deep-dive?utm_source=nfl&amp;utm_content=dallas-cowboys");
  expect(cowboys).toContain("$47 Blueprint Breakdown Video");
  expect(cowboys).not.toContain("data-checkout-stub");
  expect(cowboys).not.toContain("/create-checkout");

  const hub = read("franchise/index.html");
  expect(hub).toContain("/checkout/deep-dive?utm_source=nfl&amp;utm_content=hub");
});

test("hub lists all 32 by date and by card and calls out the AFL quintet", () => {
  const hub = read("franchise/index.html");
  expect(hub).toContain("AFL 14 August 1959 quintet");
  expect(hub).toContain("Queen of Clubs");
  for (const franchise of build.franchises) {
    expect(hub).toContain(`/franchise/${franchise.slug}`);
    expect(hub).toContain(franchise.name);
    expect(hub).toContain(franchise.grant_date);
  }
  expect(hub).toContain("Dallas Cowboys");
  expect(hub).toContain("Minnesota Vikings");
});

test("AFL quintet pages name their four siblings", () => {
  const html = read("franchise/kansas-city-chiefs/index.html");
  expect(html).toContain("Denver Broncos");
  expect(html).toContain("Los Angeles Chargers");
  expect(html).toContain("New York Jets");
  expect(html).toContain("Tennessee Titans");
  expect(html).toContain("Queen of Clubs");
  expect(html).toContain("1959-08-14");
});

test("JSON-LD uses SportsTeam and FAQ, not Person", () => {
  const html = read("franchise/dallas-cowboys/index.html");
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
        foundingDate: "1960-01-28",
        name: "Dallas Cowboys",
      }),
    ]),
  );
});

test("franchise path ownership stays off person and live card routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "franchise-path-ownership.json"), "utf8"),
  ) as { pages_will_own: string[]; never_own: string[] };
  expect(ownership.pages_will_own).toEqual(
    expect.arrayContaining(["/franchise", "/franchise/{slug}", "/sitemap-franchises.xml"]),
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
