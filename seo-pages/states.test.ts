import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { birthCardCode, birthCardFromMonthDay, solarValue } from "./src/birthcard";
import { buildStatePages } from "./src/states/build";
import { TERRITORY_SLUGS } from "./src/states/types";
import { reservedStateSlugReason, statesCheckoutHref } from "./src/states/urls";

const CRS_DATES: Record<string, string> = {
  delaware: "1787-12-07",
  pennsylvania: "1787-12-12",
  "new-jersey": "1787-12-18",
  georgia: "1788-01-02",
  connecticut: "1788-01-09",
  massachusetts: "1788-02-06",
  maryland: "1788-04-28",
  "south-carolina": "1788-05-23",
  "new-hampshire": "1788-06-21",
  virginia: "1788-06-25",
  "new-york": "1788-07-26",
  "north-carolina": "1789-11-21",
  "rhode-island": "1790-05-29",
  vermont: "1791-03-04",
  kentucky: "1792-06-01",
  tennessee: "1796-06-01",
  ohio: "1803-03-01",
  louisiana: "1812-04-30",
  indiana: "1816-12-11",
  mississippi: "1817-12-10",
  illinois: "1818-12-03",
  alabama: "1819-12-14",
  maine: "1820-03-15",
  missouri: "1821-08-10",
  arkansas: "1836-06-15",
  michigan: "1837-01-26",
  florida: "1845-03-03",
  texas: "1845-12-29",
  iowa: "1846-12-28",
  wisconsin: "1848-05-29",
  california: "1850-09-09",
  minnesota: "1858-05-11",
  oregon: "1859-02-14",
  kansas: "1861-01-29",
  "west-virginia": "1863-06-20",
  nevada: "1864-10-31",
  nebraska: "1867-03-01",
  colorado: "1876-08-01",
  "north-dakota": "1889-11-02",
  "south-dakota": "1889-11-02",
  montana: "1889-11-08",
  washington: "1889-11-11",
  idaho: "1890-07-03",
  wyoming: "1890-07-10",
  utah: "1896-01-04",
  oklahoma: "1907-11-16",
  "new-mexico": "1912-01-06",
  arizona: "1912-02-14",
  alaska: "1959-01-03",
  hawaii: "1959-08-21",
};

const PYTHON_CARDS: Record<string, string> = {
  delaware: "J♣",
  pennsylvania: "6♣",
  "new-jersey": "K♥",
  georgia: "Q♠",
  connecticut: "5♠",
  massachusetts: "6♠",
  maryland: "6♣",
  "south-carolina": "9♣",
  "new-hampshire": "9♣",
  virginia: "5♣",
  "new-york": "2♣",
  "north-carolina": "Q♥",
  "rhode-island": "3♣",
  vermont: "6♠",
  kentucky: "3♠",
  tennessee: "3♠",
  ohio: "9♠",
  louisiana: "4♣",
  indiana: "7♣",
  mississippi: "8♣",
  illinois: "2♦",
  alabama: "4♣",
  maine: "8♦",
  missouri: "3♦",
  arkansas: "2♦",
  michigan: "A♦",
  florida: "7♠",
  texas: "2♥",
  iowa: "3♥",
  wisconsin: "3♣",
  california: "2♦",
  minnesota: "8♦",
  oregon: "J♦",
  kansas: "J♣",
  "west-virginia": "10♣",
  nevada: "4♥",
  nebraska: "9♠",
  colorado: "Q♦",
  "north-dakota": "5♦",
  "south-dakota": "5♦",
  montana: "Q♣",
  washington: "9♣",
  idaho: "Q♦",
  wyoming: "5♦",
  utah: "10♠",
  oklahoma: "4♣",
  "new-mexico": "8♠",
  arizona: "J♦",
  alaska: "J♠",
  hawaii: "5♣",
};

const ORIGINAL_13 = [
  "delaware",
  "pennsylvania",
  "new-jersey",
  "georgia",
  "connecticut",
  "massachusetts",
  "maryland",
  "south-carolina",
  "new-hampshire",
  "virginia",
  "new-york",
  "north-carolina",
  "rhode-island",
] as const;

const tmp = mkdtempSync(join(tmpdir(), "seo-states-"));
const build = buildStatePages({ outDir: tmp, wipe: true });

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

test("loads exactly 50 states and excludes DC/territories", () => {
  expect(build.states).toHaveLength(50);
  expect(Object.keys(CRS_DATES)).toHaveLength(50);
  const slugs = build.states.map((state) => state.slug);
  expect(new Set(slugs).size).toBe(50);
  for (const banned of TERRITORY_SLUGS) {
    expect(slugs).not.toContain(banned);
  }
  expect(reservedStateSlugReason("new-york")).toBeNull();
  expect(reservedStateSlugReason("joker")).toContain("joker");
});

test("every state date matches CRS R47747 Table 1 and Wikipedia", () => {
  for (const state of build.states) {
    expect(state.admission_date).toBe(CRS_DATES[state.slug]);
    expect(state.wikidata_p571_iso).toBe(CRS_DATES[state.slug]);
    expect(state.crs_report).toBe("R47747");
    expect(state.crs_table).toBe("Table 1");
    expect(state.wikipedia_list).toContain("admission to the Union");
  }
});

test("original 13 are ratification; later states are admission", () => {
  for (const state of build.states) {
    const original = (ORIGINAL_13 as readonly string[]).includes(state.slug);
    expect(state.original_thirteen).toBe(original);
    expect(state.date_kind).toBe(original ? "ratification" : "admission");
  }
});

test("birth cards match pipeline/birthcard.py for all 50 dates", () => {
  for (const state of build.states) {
    const [year, month, day] = state.admission_date.split("-").map(Number);
    expect(year).toBeGreaterThan(1700);
    expect(birthCardCode(month, day)).toBe(PYTHON_CARDS[state.slug]);
    expect(`${state.card.rank}${suitGlyph(state)}`).toBe(PYTHON_CARDS[state.slug]);
  }
});

test("required shared dates and extra same-day pairs are present", () => {
  expect(dateOf("kentucky")).toBe("1792-06-01");
  expect(dateOf("tennessee")).toBe("1796-06-01");
  expect(dateOf("oregon")).toBe("1859-02-14");
  expect(dateOf("arizona")).toBe("1912-02-14");
  expect(dateOf("north-dakota")).toBe(dateOf("south-dakota"));
  expect(dateOf("rhode-island").slice(5)).toBe("05-29");
  expect(dateOf("wisconsin").slice(5)).toBe("05-29");
  expect(dateOf("ohio").slice(5)).toBe("03-01");
  expect(dateOf("nebraska").slice(5)).toBe("03-01");
});

test("hub and 50 state pages ship with attribution, CTA, and no checkout form", () => {
  const hub = read("states/index.html");
  expect(hub).toContain("US States Admission Birth Cards");
  expect(hub).toContain("Coordinates, not fortune-telling");
  expect(hub).toContain("Constitution ratification");
  expect(hub).toContain("Kentucky");
  expect(hub).toContain("Tennessee");
  expect(hub).toContain("Oregon");
  expect(hub).toContain("Arizona");
  expect(hub).toContain("June 1");
  expect(hub).toContain("February 14");
  expect(hub).toContain('data-flag="ohio-date"');
  expect(hub).toContain("R47747");
  expect(hub).toContain("congress.gov");
  expect(hub).toContain("Wikipedia");
  expect(hub).toContain("/checkout/deep-dive?utm_source=states&amp;utm_content=hub");
  expect(hub).not.toContain("/create-checkout");
  expect(hub).not.toContain('data-checkout-stub');
  expect(hub).toContain('rel="canonical" href="https://cardblueprints.com/states"');

  const types = graphTypes(extractJsonLd(hub));
  expect(types).toEqual(
    expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage", "ItemList"]),
  );

  expect(build.files.filter((file) => file.startsWith("states/") && file.endsWith("/index.html"))).toHaveLength(51);

  for (const state of build.states) {
    const html = read(`states/${state.slug}/index.html`);
    expect(html).toContain(
      `${state.name}&#39;s Admission Birth Card: The ${state.card.label}`,
    );
    expect(html).toContain("Coordinates, not fortune-telling");
    expect(html).toContain(statesCheckoutHref(state.slug).replaceAll("&", "&amp;"));
    expect(html).toContain("utm_source=states");
    expect(html).toContain(`utm_content=${state.slug}`);
    expect(html).toContain("R47747");
    expect(html).toContain("Wikipedia");
    expect(html).not.toContain("/create-checkout");
    expect(html).not.toContain("/birth-card/example-");
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/states/${state.slug}"`);
    expect(graphTypes(extractJsonLd(html))).toEqual(
      expect.arrayContaining(["AdministrativeArea", "BreadcrumbList", "FAQPage"]),
    );
  }

  const delaware = read("states/delaware/index.html");
  expect(delaware).toContain("Constitution ratification");
  expect(delaware).toContain('data-date-kind="ratification"');

  const ohio = read("states/ohio/index.html");
  expect(ohio).toContain('data-flag="ohio-date"');
  expect(ohio).toContain("1953");

  const kentucky = read("states/kentucky/index.html");
  expect(kentucky).toContain("/states/tennessee");
  const oregon = read("states/oregon/index.html");
  expect(oregon).toContain("/states/arizona");
});

test("states URLs do not collide with celeb person or card hubs", () => {
  for (const state of build.states) {
    expect(state.slug).not.toBe("joker");
    expect(state.slug).not.toMatch(/-of-(hearts|diamonds|clubs|spades)$/);
    expect(state.slug).not.toMatch(
      /^(january|february|march|april|may|june|july|august|september|october|november|december)-/,
    );
  }
  const sitemap = read("sitemap-states.xml");
  expect(sitemap).toContain("https://cardblueprints.com/states</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/states/hawaii");
  expect(sitemap).not.toContain("/birth-card/");
});

function dateOf(slug: string): string {
  const state = build.states.find((row) => row.slug === slug);
  expect(state).toBeTruthy();
  return state!.admission_date;
}

function suitGlyph(state: (typeof build.states)[number]): string {
  switch (state.card.kind) {
    case "joker":
      return "";
    case "card": {
      const glyphs: Record<string, string> = {
        hearts: "♥",
        clubs: "♣",
        diamonds: "♦",
        spades: "♠",
      };
      return glyphs[state.card.suit];
    }
    default: {
      const _exhaustive: never = state.card;
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
