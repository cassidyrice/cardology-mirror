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

test("shared header renders Compatibility in both primary navigation variants", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));

  expect(markup).toContain('aria-label="Primary"');
  expect(markup).toContain('aria-label="Mobile primary"');
  expect(occurrences(markup, 'href="/birth-card-compatibility-calculator"')).toBe(2);
  expect(occurrences(markup, ">Compatibility</a>")).toBe(2);
});

test("bare footer renders the playing-card reading guide once", () => {
  const markup = renderToStaticMarkup(createElement(SiteFooter, { bare: true }));

  expect(occurrences(markup, 'href="/how-to-read-playing-cards"')).toBe(1);
  expect(occurrences(markup, ">How to Read Playing Cards</a>")).toBe(1);
});

test("header waits until lg to switch between mobile and desktop navigation", () => {
  const primaryStart = headerSource.indexOf('aria-label="Primary"');
  const primaryEnd = headerSource.indexOf("</nav>", primaryStart);
  const primaryNav = headerSource.slice(primaryStart, primaryEnd);
  const detailsStart = headerSource.indexOf("<details");
  const detailsEnd = headerSource.indexOf("</details>", detailsStart);
  const mobileDetails = headerSource.slice(detailsStart, detailsEnd);
  const desktopCta = headerSource.slice(detailsEnd, headerSource.indexOf("</header>", detailsEnd));

  expect(primaryStart).toBeGreaterThan(0);
  expect(primaryEnd).toBeGreaterThan(primaryStart);
  expect(primaryNav).toMatch(/className="[^"]*\blg:flex\b[^"]*"/);
  expect(primaryNav).not.toMatch(/className="[^"]*\bmd:flex\b[^"]*"/);

  expect(detailsStart).toBeGreaterThan(0);
  expect(detailsEnd).toBeGreaterThan(detailsStart);
  expect(mobileDetails).toMatch(/className="[^"]*\blg:hidden\b[^"]*"/);
  expect(mobileDetails).not.toMatch(/className="[^"]*\bmd:hidden\b[^"]*"/);

  expect(desktopCta).toMatch(/className="[^"]*\blg:block\b[^"]*"/);
  expect(desktopCta).not.toMatch(/className="[^"]*\bmd:block\b[^"]*"/);
});
