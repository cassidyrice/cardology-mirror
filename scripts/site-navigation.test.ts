import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DEEP_DIVE_HEADER_CTA_LABEL, DEEP_DIVE_PRODUCT_PATH, ONE_QUESTION_TURNAROUND } from "../lib/deep-dive";
import { MONEY_PATHS, PRIMARY_NAV } from "../lib/site-nav";
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

const MONEY_PATH_ORDER = [
  ["calculator", "/birth-card-calculator", "Birth Card Calculator"],
  ["cardology", "/what-is-cardology", "What is Cardology"],
  ["reading", "/products/one-question-reading", "One Question Reading ($13)"],
  ["faq", "/faq", "FAQ"],
] as const;

function sliceNav(markup: string, label: string): string {
  const start = markup.indexOf(`aria-label="${label}"`);
  const end = markup.indexOf("</nav>", start);
  if (start < 0 || end < 0) {
    throw new Error(`missing nav ${label}`);
  }
  return markup.slice(start, end);
}

function anchorTags(html: string): string[] {
  return html.match(/<a\b[^>]*>/g) ?? [];
}

test("desktop and mobile nav are the same flat money paths, calculator before the paid reading", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));
  const desktop = sliceNav(markup, "Primary");
  const mobile = sliceNav(markup, "Mobile primary");

  expect(PRIMARY_NAV.map((link) => link.href)).toEqual(
    MONEY_PATHS.map((link) => link.href),
  );
  expect(MONEY_PATHS.map((link) => link.id)).toEqual([
    "calculator",
    "cardology",
    "reading",
    "faq",
  ]);
  expect(desktop).not.toContain("<details");
  expect(desktop).not.toContain("<ul");

  for (const nav of [desktop, mobile]) {
    const tags = anchorTags(nav);
    expect(tags).toHaveLength(MONEY_PATH_ORDER.length);
    MONEY_PATH_ORDER.forEach(([id, href, label], index) => {
      const tag = tags[index] ?? "";
      expect(tag).toContain(`data-money-path="${id}"`);
      expect(tag).toContain(`href="${href}"`);
      expect(nav).toContain(`>${label}<`);
    });
    expect(nav.indexOf('href="/birth-card-calculator"')).toBeLessThan(
      nav.indexOf('href="/products/one-question-reading"'),
    );
    expect(nav).not.toContain('href="/explore"');
    expect(nav).not.toContain('href="/today"');
    expect(nav).not.toContain('href="/products/blueprint-report"');
    expect(nav).not.toContain("Blueprint Report");
    expect(nav).not.toContain("Deep Dive");
  }

  expect(desktop).toContain("money-path-offer");
  expect(mobile).toContain("money-path-offer");
});

test("footer core row leads with the same money paths and leaves the directory second", () => {
  const markup = renderToStaticMarkup(createElement(SiteFooter));
  const core = sliceNav(markup, "Core");
  const more = sliceNav(markup, "More");
  const tags = anchorTags(core);

  expect(tags).toHaveLength(MONEY_PATH_ORDER.length);
  MONEY_PATH_ORDER.forEach(([id, href, label], index) => {
    const tag = tags[index] ?? "";
    expect(tag).toContain(`data-money-path="${id}"`);
    expect(tag).toContain(`href="${href}"`);
    expect(core).toContain(`>${label}<`);
  });
  expect(core).toContain(">Free<");
  expect(core).toContain(`>${ONE_QUESTION_TURNAROUND}<`);
  expect(core).toContain("money-path-offer");
  expect(core.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    core.indexOf('href="/products/one-question-reading"'),
  );

  for (const href of MONEY_PATH_ORDER.map(([, href]) => href)) {
    expect(more).not.toContain(`href="${href}"`);
  }
  expect(markup.indexOf('aria-label="Core"')).toBeLessThan(
    markup.indexOf('aria-label="More"'),
  );
  expect(markup.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    markup.indexOf('href="/explore"'),
  );
  expect(markup).toContain("mirror, not a forecast");
  expect(markup).not.toContain("Blueprint Report");
  expect(markup).not.toContain("Deep Dive");
  expect(markup).not.toContain('href="/products/blueprint-report"');
  expect(markup).not.toContain("2 business days");
});

test("money-path pages sit one crumb under home", () => {
  for (const file of [
    "app/birth-card-calculator/page.tsx",
    "app/products/one-question-reading/page.tsx",
    "app/what-is-cardology/page.tsx",
    "app/faq/page.tsx",
  ]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const crumb = source.match(/crumb=\{(\[[\s\S]*?\])\s*\}/);
    expect(crumb?.[1]).toBeTruthy();
    const hrefs = crumb?.[1].match(/href:/g) ?? [];
    expect(hrefs.length).toBeLessThanOrEqual(2);
  }
});
