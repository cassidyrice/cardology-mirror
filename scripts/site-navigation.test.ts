import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteFooter } from "../components/seo/SiteFooter";
import { SiteHeader } from "../components/seo/SiteHeader";

const headerSource = readFileSync(
  new URL("../components/seo/SiteHeader.tsx", import.meta.url),
  "utf8",
);

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

test("shared header renders the six nav links in both primary navigation variants", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));

  expect(markup).toContain('aria-label="Primary"');
  expect(markup).toContain('aria-label="Mobile primary"');
  expect(occurrences(markup, 'href="/birth-card-compatibility-calculator"')).toBe(2);
  expect(occurrences(markup, ">Compatibility</a>")).toBe(2);
  expect(occurrences(markup, 'href="/card-of-the-day"')).toBe(2);
  expect(occurrences(markup, 'href="/blog"')).toBe(2);
  expect(occurrences(markup, 'href="/karma-reading"')).toBe(0);
  expect(markup).not.toContain("Get a Reading");
  expect(markup).toContain("Find Your Card");
  expect(markup).toContain("Today&#x27;s Card");
});

test("bare footer keeps the single disclaimer and legal row", () => {
  const markup = renderToStaticMarkup(createElement(SiteFooter, { bare: true }));

  expect(markup).toContain("Playing cards, not tarot");
  expect(markup).toContain('href="/privacy-policy"');
  expect(occurrences(markup, 'href="/karma-reading"')).toBe(1);
  expect(occurrences(markup, 'href="/products/birth-card-deep-dive"')).toBe(1);
});

test("header waits until lg to switch between mobile and desktop navigation", () => {
  const primaryStart = headerSource.indexOf('aria-label="Primary"');
  const primaryEnd = headerSource.indexOf("</nav>", primaryStart);
  const primaryNav = headerSource.slice(primaryStart, primaryEnd);
  const detailsStart = headerSource.indexOf("<details");
  const detailsEnd = headerSource.indexOf("</details>", detailsStart);
  const mobileDetails = headerSource.slice(detailsStart, detailsEnd);

  expect(primaryStart).toBeGreaterThan(0);
  expect(primaryEnd).toBeGreaterThan(primaryStart);
  expect(primaryNav).toMatch(/className="[^"]*\blg:flex\b[^"]*"/);
  expect(primaryNav).not.toMatch(/className="[^"]*\bmd:flex\b[^"]*"/);

  expect(detailsStart).toBeGreaterThan(0);
  expect(detailsEnd).toBeGreaterThan(detailsStart);
  expect(mobileDetails).toMatch(/className="[^"]*\blg:hidden\b[^"]*"/);
  expect(mobileDetails).not.toMatch(/className="[^"]*\bmd:hidden\b[^"]*"/);
});
