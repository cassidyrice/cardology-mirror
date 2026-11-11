import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BornOnPageView } from "../components/seo/BornOnPageView";
import { bornOnMetadata, bornOnPage, bornOnSlugs } from "../lib/born-on";

const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// Same URL set the cardology-unlock Worker served (renderSitemap in src/born-on.js).
const WORKER_SLUGS = MONTHS.flatMap((m, i) => Array.from({ length: DAYS[i] }, (_, d) => `${m}-${d + 1}`));

test("URL parity with the Worker: 366 day pages plus the index", () => {
  expect(bornOnSlugs().sort()).toEqual([...WORKER_SLUGS].sort());
  expect(bornOnPage("")?.canonical).toBe("https://cardblueprints.com/born-on/");
  for (const slug of WORKER_SLUGS) {
    expect(bornOnPage(slug)?.canonical).toBe(`https://cardblueprints.com/born-on/${slug}`);
  }
  expect(bornOnPage("february-30")).toBeNull();
});

test("sample born-on pages keep Worker metadata and render inside the shared header with Readings", () => {
  for (const [slug, title] of [
    ["march-14", "March 14 Birthday Meaning: Personality & Birth Card"],
    ["december-31", "December 31 Birthday Meaning: Personality & Birth Card"],
    ["", "Cardology Birthday Chart: All 366 Birthdays"],
  ] as const) {
    const page = bornOnPage(slug)!;
    expect(page.title).toBe(title);
    const meta = bornOnMetadata(page);
    expect(meta.title).toEqual({ absolute: title });
    expect(meta.alternates?.canonical).toBe(page.canonical);
    const html = renderToStaticMarkup(createElement(BornOnPageView, { page }));
    expect(html).toContain("data-readings-menu");
    expect(html).toContain('href="/#readings"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain(page.body.slice(0, 200));
  }
});

test("all 367 birthday pages offer the $99 Card Blueprint Reading inline with zero Stan Store", () => {
  for (const slug of ["", ...bornOnSlugs()]) {
    const body = bornOnPage(slug)!.body;
    expect(body).toContain("The Card Blueprint Reading · $99");
    expect(body).toContain("Suggested Questions");
    expect(body).toContain("limit 3 questions per order");
    expect(body).toContain("within 48 hours");
    expect(body).toContain("under 24 hours");
    expect(body).not.toMatch(/Family Snapshot|Collector Pack|free-course/);
    expect(body).not.toMatch(/\$(24|26|39|97|137|179)\b|you \+ 3 family|inbox within 7 days/);
    expect(body).not.toContain("stan.store");
  }
});
