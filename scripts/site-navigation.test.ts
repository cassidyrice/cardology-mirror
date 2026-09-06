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

test("shared header renders Explore link", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));

  expect(markup).toContain('aria-label="Primary"');
  expect(markup).toContain('aria-label="Mobile primary"');
  expect(occurrences(markup, 'href="/explore"')).toBe(2);
  expect(markup).toContain("Explore");
  expect(markup).not.toContain("Create content");
  expect(markup).not.toContain("/content-engine");
  expect(markup).not.toContain("Learn more");
  expect(markup).not.toContain("Get a Reading");
  expect(markup).not.toContain('href="/karma-reading"');
  expect(markup).not.toContain('href="/birth-card-calculator"');
});

test("bare footer keeps the single disclaimer and legal row", () => {
  const markup = renderToStaticMarkup(createElement(SiteFooter, { bare: true }));

  expect(markup).toContain("Playing cards, not tarot");
  expect(markup).toContain('href="/privacy-policy"');
  expect(occurrences(markup, 'href="/content-engine"')).toBe(1);
  expect(occurrences(markup, 'href="/products/birth-card-deep-dive"')).toBe(1);
  expect(markup).toContain("Content Calendar (experiment)");
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
