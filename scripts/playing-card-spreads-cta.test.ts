import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import PlayingCardSpreads from "@/app/playing-card-spreads/page";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "playing-card-spreads", "page.tsx"),
  "utf8",
);

const HOME_SAMPLE = "The 8 of Diamonds in you wants proof before it moves";
const HOME_LEAD = "Ask the one thing";

test("spreads close with a free calculator and a soft $13 line", () => {
  const faq = page.indexOf('id="faq"');
  const close = page.indexOf('aria-label="Continue from the spreads"');
  expect(faq).toBeGreaterThan(0);
  expect(close).toBeGreaterThan(faq);
  expect(page.match(/aria-label="Continue from the spreads"/g)).toHaveLength(1);

  const zone = page.slice(close);
  expect(zone).toContain('href="/birth-card-calculator"');
  expect(zone).toContain("Find your birth card — free");
  expect(zone).toContain("accent-button");
  expect(zone).toContain("DEEP_DIVE_PRODUCT_PATH");
  expect(zone).toContain("DEEP_DIVE_PRICE_LABEL");
  expect(zone).toContain("optional");
  expect(zone).not.toContain("<DeepDiveCta");
  expect(zone.match(/accent-button/g)).toHaveLength(1);

  expect(page).not.toContain("Deep Dive");
  expect(page).not.toContain("Blueprint");
  expect(page).not.toMatch(/\bfortune\b/i);
  expect(page).not.toContain(HOME_SAMPLE);
  expect(page).not.toContain("Eights are power");
  expect(page).not.toContain(HOME_LEAD);
  expect(page).not.toMatch(/^export (?!const metadata\b|default function PlayingCardSpreads\b)/m);
  expect(page).toContain("DECADE_STARTS");
  expect(page).toContain("function AllYearlySpreads");
});

test("the closing row renders after the FAQ, calculator first", () => {
  const markup = renderToStaticMarkup(createElement(PlayingCardSpreads));
  const faq = markup.indexOf('id="faq"');
  const close = markup.indexOf('aria-label="Continue from the spreads"');
  const articleEnd = markup.indexOf("</article>", close);
  expect(faq).toBeGreaterThan(0);
  expect(close).toBeGreaterThan(faq);
  expect(articleEnd).toBeGreaterThan(close);

  const zone = markup.slice(close, articleEnd);
  const calculator = zone.indexOf('href="/birth-card-calculator"');
  const reading = zone.indexOf('href="/products/one-question-reading"');
  expect(calculator).toBeGreaterThan(-1);
  expect(reading).toBeGreaterThan(calculator);
  expect(zone).toContain("Find your birth card — free");
  expect(zone).toContain("One question ($13), optional");
  expect(zone).toContain("The boards above stay fixed.");
  expect(zone).not.toMatch(/Deep Dive|Blueprint/);
  expect(zone).not.toMatch(/\bfortune\b/i);
  expect(zone).not.toContain(HOME_SAMPLE);
});
