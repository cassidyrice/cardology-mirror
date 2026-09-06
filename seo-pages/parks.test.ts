import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { birthCardCode, birthCardFromMonthDay, solarValue } from "./src/birthcard";
import { buildParkPages } from "./src/parks/build";
import { ALASKA_ANILCA_SLUGS } from "./src/parks/types";
import { reservedParkSlugReason, parksCheckoutHref } from "./src/parks/urls";

const WIKIPEDIA_NP_DATES: Record<string, string> = {
  acadia: "1919-02-26",
  "american-samoa": "1988-10-31",
  arches: "1971-11-12",
  badlands: "1978-11-10",
  "big-bend": "1944-06-12",
  biscayne: "1980-06-28",
  "black-canyon-of-the-gunnison": "1999-10-21",
  "bryce-canyon": "1928-02-25",
  canyonlands: "1964-09-12",
  "capitol-reef": "1971-12-18",
  "carlsbad-caverns": "1930-05-14",
  "channel-islands": "1980-03-05",
  congaree: "2003-11-10",
  "crater-lake": "1902-05-22",
  "cuyahoga-valley": "2000-10-11",
  "death-valley": "1994-10-31",
  denali: "1917-02-26",
  "dry-tortugas": "1992-10-26",
  everglades: "1934-05-30",
  "gates-of-the-arctic": "1980-12-02",
  "gateway-arch": "2018-02-22",
  glacier: "1910-05-11",
  "glacier-bay": "1980-12-02",
  "grand-canyon": "1919-02-26",
  "grand-teton": "1929-02-26",
  "great-basin": "1986-10-27",
  "great-sand-dunes": "2004-09-24",
  "great-smoky-mountains": "1934-06-15",
  "guadalupe-mountains": "1972-09-30",
  haleakala: "1961-07-01",
  "hawaii-volcanoes": "1916-08-01",
  "hot-springs": "1921-03-04",
  "indiana-dunes": "2019-02-15",
  "isle-royale": "1940-04-03",
  "joshua-tree": "1994-10-31",
  katmai: "1980-12-02",
  "kenai-fjords": "1980-12-02",
  "kings-canyon": "1940-03-04",
  "kobuk-valley": "1980-12-02",
  "lake-clark": "1980-12-02",
  "lassen-volcanic": "1916-08-09",
  "mammoth-cave": "1941-07-01",
  "mesa-verde": "1906-06-29",
  "mount-rainier": "1899-03-02",
  "new-river-gorge": "2020-12-27",
  "north-cascades": "1968-10-02",
  olympic: "1938-06-29",
  "petrified-forest": "1962-12-09",
  pinnacles: "2013-01-10",
  redwood: "1968-10-02",
  "rocky-mountain": "1915-01-26",
  saguaro: "1994-10-14",
  sequoia: "1890-09-25",
  shenandoah: "1935-12-26",
  "theodore-roosevelt": "1978-11-10",
  "virgin-islands": "1956-08-02",
  voyageurs: "1975-04-08",
  "white-sands": "2019-12-20",
  "wind-cave": "1903-01-09",
  "wrangell-st-elias": "1980-12-02",
  yellowstone: "1872-03-01",
  yosemite: "1890-10-01",
  zion: "1919-11-19",
};

const PYTHON_CARDS: Record<string, string> = Object.fromEntries(
  Object.entries(WIKIPEDIA_NP_DATES).map(([slug, iso]) => {
    const [, month, day] = iso.split("-").map(Number);
    return [slug, birthCardCode(month, day)];
  }),
);

const FIRST_MONUMENT_NOT_MAPPED = {
  "death-valley": "1933-02-11",
  "joshua-tree": "1936-08-10",
  arches: "1929-04-12",
  pinnacles: "1908-01-16",
  "white-sands": "1933-01-18",
  "indiana-dunes": "1966-11-05",
  "gateway-arch": "1935-12-21",
  haleakala: "1916-08-01",
  "kings-canyon": "1890-10-01",
  "hot-springs": "1832-04-20",
} as const;

const tmp = mkdtempSync(join(tmpdir(), "seo-parks-"));
const build = buildParkPages({ outDir: tmp, wipe: true });

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function read(relativePath: string): string {
  return readFileSync(join(tmp, relativePath), "utf8");
}

test("D1 Joker rule matches pipeline/birthcard.py", () => {
  expect(solarValue(12, 31)).toBeLessThanOrEqual(0);
  expect(birthCardCode(12, 31)).toBe("Joker");
  expect(birthCardCode(1, 1)).toBe("K♠");
  expect(birthCardFromMonthDay(12, 31).kind).toBe("joker");
});

test("loads exactly 63 parks and no reserved slugs", () => {
  expect(build.parks).toHaveLength(63);
  expect(Object.keys(WIKIPEDIA_NP_DATES)).toHaveLength(63);
  const slugs = build.parks.map((park) => park.slug);
  expect(new Set(slugs).size).toBe(63);
  expect(slugs.sort()).toEqual(Object.keys(WIKIPEDIA_NP_DATES).sort());
  expect(reservedParkSlugReason("yellowstone")).toBeNull();
  expect(reservedParkSlugReason("joker")).toContain("joker");
  expect(reservedParkSlugReason("ace-of-spades")).toContain("52-card");
  expect(reservedParkSlugReason("december-2")).toContain("month-day");
});

test("every park date matches Wikipedia Date established as park", () => {
  for (const park of build.parks) {
    expect(park.established_date).toBe(WIKIPEDIA_NP_DATES[park.slug]);
    expect(park.date_kind).toBe("national_park");
    expect(park.wikipedia_list_column).toBe("Date established as park");
    expect(park.wikipedia_list).toContain("national parks");
    expect(park.wikipedia_list_url).toContain("List_of_national_parks_of_the_United_States");
    expect(park.nps_anniversaries_url).toContain("park-anniversaries");
  }
});

test("birth cards match pipeline/birthcard.py for all 63 dates", () => {
  for (const park of build.parks) {
    const [year, month, day] = park.established_date.split("-").map(Number);
    expect(year).toBeGreaterThan(1800);
    expect(birthCardCode(month, day)).toBe(PYTHON_CARDS[park.slug]);
    expect(`${park.card.rank}${suitGlyph(park)}`).toBe(PYTHON_CARDS[park.slug]);
    expect(park.card.kind === "joker" ? "Joker" : `${park.card.rank}${suitGlyph(park)}`).not.toBe(
      month === 12 && day === 31 ? "K♠" : undefined,
    );
    if (month === 12 && day === 31) {
      expect(park.card.kind).toBe("joker");
    }
  }
});

test("December 2 Alaska ANILCA cluster is seven parks and excludes Denali", () => {
  expect(ALASKA_ANILCA_SLUGS).toHaveLength(7);
  for (const slug of ALASKA_ANILCA_SLUGS) {
    expect(dateOf(slug)).toBe("1980-12-02");
  }
  expect(dateOf("denali")).toBe("1917-02-26");
  expect(dateOf("acadia")).toBe("1919-02-26");
  expect(dateOf("grand-canyon")).toBe("1919-02-26");
  expect(dateOf("death-valley")).toBe(dateOf("joshua-tree"));
  expect(dateOf("north-cascades")).toBe(dateOf("redwood"));
  expect(dateOf("badlands")).toBe(dateOf("theodore-roosevelt"));
});

test("first-monument and first-unit dates are cited, not mapped", () => {
  for (const [slug, priorDay] of Object.entries(FIRST_MONUMENT_NOT_MAPPED)) {
    const park = build.parks.find((row) => row.slug === slug);
    expect(park).toBeTruthy();
    expect(park!.established_date).not.toBe(priorDay);
    expect(park!.prior_designation).toBeTruthy();
    expect(park!.prior_designation!.date).toBe(priorDay.includes("-") ? priorDay : priorDay);
    const html = read(`parks/${slug}/index.html`);
    expect(html).toContain("not mapped");
    expect(html).toContain(park!.prior_designation!.label);
    expect(html).toContain(`datetime="${park!.established_date}"`);
  }
});

test("hub and 63 park pages ship with attribution, CTA, and no checkout form", () => {
  const hub = read("parks/index.html");
  expect(hub).toContain("US National Park Birth Cards");
  expect(hub).toContain("Coordinates, not fortune-telling");
  expect(hub).toContain("Date established as park");
  expect(hub).toContain("December 2, 1980");
  expect(hub).toContain("Alaska");
  expect(hub).toContain("Gates of the Arctic");
  expect(hub).toContain("Wrangell–St. Elias");
  expect(hub).toContain("Denali");
  expect(hub).toContain("Wikipedia");
  expect(hub).toContain("Park Anniversaries");
  expect(hub).toContain("/checkout/deep-dive?utm_source=parks&amp;utm_content=hub");
  expect(hub).not.toContain("/create-checkout");
  expect(hub).not.toContain("data-checkout-stub");
  expect(hub).toContain('rel="canonical" href="https://cardblueprints.com/parks"');
  expect(hub).toContain('data-cluster="alaska-anilca-1980-12-02"');

  const types = graphTypes(extractJsonLd(hub));
  expect(types).toEqual(
    expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage", "ItemList"]),
  );

  expect(build.files.filter((file) => file.startsWith("parks/") && file.endsWith("/index.html"))).toHaveLength(
    64,
  );

  for (const park of build.parks) {
    const html = read(`parks/${park.slug}/index.html`);
    expect(html).toContain(`${park.name}&#39;s National Park Birth Card: The ${park.card.label}`);
    expect(html).toContain("Coordinates, not fortune-telling");
    expect(html).toContain(parksCheckoutHref(park.slug).replaceAll("&", "&amp;"));
    expect(html).toContain("utm_source=parks");
    expect(html).toContain(`utm_content=${park.slug}`);
    expect(html).toContain("Wikipedia");
    expect(html).toContain("Park Anniversaries");
    expect(html).toContain("nps.gov");
    expect(html).toContain(`datetime="${park.established_date}"`);
    expect(html).not.toContain("/create-checkout");
    expect(html).not.toContain("/birth-card/example-");
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/parks/${park.slug}"`);
    expect(graphTypes(extractJsonLd(html))).toEqual(
      expect.arrayContaining(["Park", "BreadcrumbList", "FAQPage"]),
    );
  }

  const yellowstone = read("parks/yellowstone/index.html");
  expect(yellowstone).toContain("March 1, 1872");
  expect(yellowstone).toContain("Date established as National Park");

  const deathValley = read("parks/death-valley/index.html");
  expect(deathValley).toContain("October 31, 1994");
  expect(deathValley).toContain("Death Valley National Monument");
  expect(deathValley).not.toContain("datetime=\"1933-02-11\"");

  const katmai = read("parks/katmai/index.html");
  expect(katmai).toContain("/parks/glacier-bay");
  expect(katmai).toContain("December 2 Alaska");
  expect(katmai).not.toContain("/parks/denali");
});

test("parks URLs do not collide with celeb person or card hubs", () => {
  for (const park of build.parks) {
    expect(park.slug).not.toBe("joker");
    expect(park.slug).not.toMatch(/-of-(hearts|diamonds|clubs|spades)$/);
    expect(park.slug).not.toMatch(
      /^(january|february|march|april|may|june|july|august|september|october|november|december)-/,
    );
  }
  const sitemap = read("sitemap-parks.xml");
  expect(sitemap).toContain("https://cardblueprints.com/parks</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/parks/yellowstone");
  expect(sitemap).not.toContain("/birth-card/");
});

test("park path ownership stays off person, live card, and checkout routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "parks-path-ownership.json"), "utf8"),
  ) as { pages_will_own: string[]; never_own: string[] };
  expect(ownership.pages_will_own).toEqual(
    expect.arrayContaining(["/parks", "/parks/{slug}", "/sitemap-parks.xml"]),
  );
  expect(ownership.never_own).toEqual(
    expect.arrayContaining(["/checkout", "/checkout/*", "/birth-card/{slug}"]),
  );
});

function dateOf(slug: string): string {
  const park = build.parks.find((row) => row.slug === slug);
  expect(park).toBeTruthy();
  return park!.established_date;
}

function suitGlyph(park: (typeof build.parks)[number]): string {
  switch (park.card.kind) {
    case "joker":
      return "";
    case "card": {
      const glyphs: Record<string, string> = {
        hearts: "♥",
        clubs: "♣",
        diamonds: "♦",
        spades: "♠",
      };
      return glyphs[park.card.suit];
    }
    default: {
      const _exhaustive: never = park.card;
      throw new Error(`Unhandled card: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

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
