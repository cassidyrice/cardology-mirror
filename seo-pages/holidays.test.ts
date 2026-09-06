import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { birthCardCode, birthCardFromMonthDay, solarValue } from "./src/birthcard";
import { buildHolidayPages } from "./src/holidays/build";
import { FLOATING_HOLIDAY_SLUGS, STATUTE_FIXED_HOLIDAYS } from "./src/holidays/types";
import { holidayPath, holidaysCheckoutHref, reservedHolidaySlugReason } from "./src/holidays/urls";

const STATUTE_CARDS: Record<string, string> = {
  "new-years-day": "K♠",
  juneteenth: "J♣",
  "independence-day": "J♦",
  "veterans-day": "9♣",
  "christmas-day": "6♥",
};

const tmp = mkdtempSync(join(tmpdir(), "seo-holidays-"));
const build = buildHolidayPages({ outDir: tmp });

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

test("builds hub plus exactly 5 statutory holiday pages (5/5 coverage)", () => {
  expect(build.holidays).toHaveLength(5);
  expect(STATUTE_FIXED_HOLIDAYS).toHaveLength(5);
  expect(build.files).toContain("holidays/index.html");
  expect(build.files.filter((file) => file.startsWith("holidays/") && file.endsWith("/index.html"))).toHaveLength(6);

  const slugs = build.holidays.map((holiday) => holiday.slug);
  expect(slugs).toEqual(STATUTE_FIXED_HOLIDAYS.map((row) => row.slug));
  for (const banned of FLOATING_HOLIDAY_SLUGS) {
    expect(slugs).not.toContain(banned);
    expect(build.files).not.toContain(`holidays/${banned}/index.html`);
  }
});

test("every holiday date and card matches 5 U.S.C. § 6103(a) and birthcard.ts", () => {
  for (const holiday of build.holidays) {
    const lock = STATUTE_FIXED_HOLIDAYS.find((row) => row.slug === holiday.slug);
    expect(lock).toBeTruthy();
    expect(holiday.month).toBe(lock!.month);
    expect(holiday.day).toBe(lock!.day);
    expect(holiday.name).toBe(lock!.name);
    expect(holiday.usc_citation).toBe("5 U.S.C. § 6103(a)");
    expect(holiday.usc_url).toBe("https://www.law.cornell.edu/uscode/text/5/6103");
    expect(holiday.observed_shift).toBe("ignored");
    expect(birthCardCode(holiday.month, holiday.day)).toBe(STATUTE_CARDS[holiday.slug]);
    expect(holiday.card).toBe(STATUTE_CARDS[holiday.slug]);
    expect(`${holiday.cardRef.rank}${suitGlyph(holiday)}`).toBe(STATUTE_CARDS[holiday.slug]);
    expect(holiday.month === 12 && holiday.day === 31).toBe(false);
    expect(holiday.cardRef.kind).not.toBe("joker");
  }
});

test("hub and 5 holiday pages ship with attribution, CTA, and no checkout form", () => {
  const hub = read("holidays/index.html");
  expect(hub).toContain("US Federal Holiday Birth Cards");
  expect(hub).toContain("Coordinates, not fortune-telling");
  expect(hub).toContain("5 U.S.C.");
  expect(hub).toContain("6103(a)");
  expect(hub).toContain("Cornell LII");
  expect(hub).toContain("opm.gov");
  expect(hub).toContain("Floating holidays are not mapped");
  expect(hub).toContain("Memorial Day");
  expect(hub).toContain("Thanksgiving");
  expect(hub).toContain("observed Friday, July 3");
  expect(hub).toContain("/checkout/deep-dive?utm_source=holidays&amp;utm_content=hub");
  expect(hub).not.toContain("/create-checkout");
  expect(hub).not.toContain("data-checkout-stub");
  expect(hub).not.toContain("stripe");
  expect(hub).toContain('rel="canonical" href="https://cardblueprints.com/holidays"');

  for (const lock of STATUTE_FIXED_HOLIDAYS) {
    expect(hub).toContain(holidayPath(lock.slug));
    expect(hub).toContain(lock.name.replace("'", "&#39;"));
  }

  const types = graphTypes(extractJsonLd(hub));
  expect(types).toEqual(
    expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage", "ItemList"]),
  );

  for (const holiday of build.holidays) {
    const html = read(`holidays/${holiday.slug}/index.html`);
    expect(html).toContain(`Birth Card: The ${holiday.cardRef.label}`);
    expect(html).toContain(holiday.name.replaceAll("'", "&#39;"));
    expect(html).toContain("Coordinates, not fortune-telling");
    expect(html).toContain(holidaysCheckoutHref(holiday.slug).replaceAll("&", "&amp;"));
    expect(html).toContain("utm_source=holidays");
    expect(html).toContain(`utm_content=${holiday.slug}`);
    expect(html).toContain("6103(a)");
    expect(html).toContain("Cornell LII");
    expect(html).toContain("opm.gov");
    expect(html).not.toContain("/create-checkout");
    expect(html).not.toContain("/birth-card/" + holiday.slug);
    expect(html).toContain(`/birth-card/${holiday.cardRef.slug}`);
    expect(html).toContain(`rel="canonical" href="https://cardblueprints.com/holidays/${holiday.slug}"`);
    expect(graphTypes(extractJsonLd(html))).toEqual(
      expect.arrayContaining(["CollectionPage", "BreadcrumbList", "FAQPage"]),
    );
  }
});

test("holiday URLs do not collide with celeb person or card hubs", () => {
  expect(reservedHolidaySlugReason("new-years-day")).toBeNull();
  expect(reservedHolidaySlugReason("joker")).toContain("joker");
  expect(reservedHolidaySlugReason("ace-of-spades")).toContain("52-card");
  expect(reservedHolidaySlugReason("july-4")).toContain("month-day");
  expect(reservedHolidaySlugReason("december-25")).toContain("month-day");

  for (const holiday of build.holidays) {
    expect(holiday.slug).not.toBe("joker");
    expect(holiday.slug).not.toMatch(/-of-(hearts|diamonds|clubs|spades)$/);
    expect(holiday.slug).not.toMatch(
      /^(january|february|march|april|may|june|july|august|september|october|november|december)-/,
    );
  }

  const sitemap = read("sitemap-holidays.xml");
  expect(sitemap).toContain("https://cardblueprints.com/holidays</loc>");
  expect(sitemap).toContain("https://cardblueprints.com/holidays/independence-day");
  expect(sitemap).not.toContain("/birth-card/");
  expect(sitemap).not.toContain("/presidents/");
  expect(sitemap).not.toContain("/states/");

  const robots = read("robots.txt");
  expect(robots).toContain("Allow: /holidays/");
  expect(robots).toContain("Disallow: /birth-card/");
  expect(robots).toContain("Disallow: /checkout");
  expect(robots).toContain("Sitemap: https://cardblueprints.com/sitemap-holidays.xml");
});

test("path ownership keeps holidays off celeb and card-meaning routes", () => {
  const ownership = JSON.parse(
    readFileSync(join(import.meta.dir, "path-ownership.json"), "utf8"),
  ) as {
    holidays_isolated: { pages_will_own: string[]; must_not_own: string[] };
  };

  expect(ownership.holidays_isolated.pages_will_own).toEqual(
    expect.arrayContaining(["/holidays", "/holidays/{slug}", "/sitemap-holidays.xml"]),
  );
  expect(ownership.holidays_isolated.must_not_own).toEqual(
    expect.arrayContaining([
      "/birth-card/{person-slug}",
      "/birth-card/{rank}-of-{suit}",
      "/birth-card/joker",
      "/checkout",
    ]),
  );
});

function suitGlyph(holiday: (typeof build.holidays)[number]): string {
  switch (holiday.cardRef.kind) {
    case "joker":
      return "";
    case "card": {
      const glyphs: Record<string, string> = {
        hearts: "♥",
        clubs: "♣",
        diamonds: "♦",
        spades: "♠",
      };
      return glyphs[holiday.cardRef.suit];
    }
    default: {
      const _exhaustive: never = holiday.cardRef;
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
