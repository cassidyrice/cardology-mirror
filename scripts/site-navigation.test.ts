import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DEEP_DIVE_HEADER_CTA_LABEL, DEEP_DIVE_PRODUCT_PATH } from "../lib/deep-dive";
import { PRIMARY_NAV } from "../lib/site-nav";
import { SiteFooter } from "../components/seo/SiteFooter";
import { SiteHeader } from "../components/seo/SiteHeader";

const headerSource = readFileSync(
  new URL("../components/seo/SiteHeader.tsx", import.meta.url),
  "utf8",
);

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

test("shared header names the calculator, Cardology, the $13 reading, and FAQ", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));

  expect(markup).toContain('aria-label="Primary"');
  expect(markup).toContain('aria-label="Mobile primary"');
  for (const link of PRIMARY_NAV) {
    expect(occurrences(markup, `href="${link.href}"`)).toBe(2);
    expect(occurrences(markup, link.label)).toBeGreaterThanOrEqual(2);
  }
  expect(markup).toContain(DEEP_DIVE_HEADER_CTA_LABEL);
  expect(markup).toContain(`href="${DEEP_DIVE_PRODUCT_PATH}"`);
  expect(markup).not.toContain("Create content");
  expect(markup).not.toContain("/content-engine");
  expect(markup).not.toContain("Learn more");
  expect(markup).not.toContain("Get a Reading");
  expect(markup).not.toContain('href="/karma-reading"');
  expect(markup).not.toContain('href="/explore"');
  expect(markup).not.toContain('href="/checkout/deep-dive"');
  expect(markup).not.toContain('href="/today"');
  expect(markup).not.toContain("Ask — $13");
  expect(markup).not.toContain("Deep Dive");
  expect(markup).not.toContain("Blueprint Report");
  expect(markup).not.toContain("accent-button");
  expect(headerSource).toContain("HeaderDeepDiveCta");
  expect(headerSource).toContain("PRIMARY_NAV");
});

test("bare footer keeps the single disclaimer and legal row", () => {
  const markup = renderToStaticMarkup(createElement(SiteFooter, { bare: true }));

  expect(markup).toContain("Playing cards, not tarot");
  expect(markup).toContain('href="/privacy-policy"');
  expect(occurrences(markup, 'href="/content-engine"')).toBe(0);
  expect(occurrences(markup, 'href="/products/one-question-reading"')).toBe(1);
  expect(occurrences(markup, 'href="/birth-card-calculator"')).toBe(1);
  expect(occurrences(markup, 'href="/faq"')).toBe(1);
  expect(occurrences(markup, 'href="/what-is-cardology"')).toBe(1);
  expect(markup).toContain("Birth Card Calculator");
  expect(markup).toContain("One Question Reading ($13)");
  expect(markup).toContain(">FAQ<");
  expect(markup.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    markup.indexOf('href="/birth-card"'),
  );
  expect(markup.indexOf('href="/birth-card"')).toBeLessThan(
    markup.indexOf('href="/card-of-the-day"'),
  );
  expect(occurrences(markup, 'href="/today"')).toBe(0);
  expect(occurrences(markup, 'href="/products/blueprint-report"')).toBe(0);
  expect(markup).not.toContain("Blueprint Report");
  expect(markup).not.toContain("Deep Dive");
  expect(markup).not.toContain('href="/products/52xseven-blueprint"');
  expect(markup).not.toContain("Content Calendar (experiment)");
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
