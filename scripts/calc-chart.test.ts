import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("calculator title stays under 60 and names both intents", () => {
  const source = read("app/birth-card-calculator/page.tsx");
  const match = source.match(/const TITLE = "([^"]+)"/);
  expect(match?.[1]).toBe("Birth Card Calculator & Cardology Chart");
  expect(match?.[1].length).toBeLessThanOrEqual(60);
  expect(source).toContain("Birth Card Calculator and Cardology Chart");
  expect(source).toContain('id="cardology-chart"');
});

test("calculator still puts the tool before the not-tarot aside and chart", () => {
  const source = read("app/birth-card-calculator/page.tsx");
  const calculator = source.indexOf("<BirthCardCalculator />");
  const aside = source.indexOf('aria-label="Playing cards, not tarot"');
  const chart = source.indexOf('id="cardology-chart"');
  expect(calculator).toBeGreaterThan(0);
  expect(aside).toBeGreaterThan(calculator);
  expect(chart).toBeGreaterThan(calculator);
});

test("shared birthday chart uses plain Worker anchors", () => {
  const source = read("components/seo/PlayingCardsBirthdayChart.tsx");
  expect(source).toContain("href={`/born-on/${d.slug}`}");
  expect(source).not.toContain("next/link");
  expect(source).not.toContain("<Link");
});

test("52-card explainer reuses the shared chart", () => {
  const source = read("app/52-card-astrology-explained/page.tsx");
  expect(source).toContain("PlayingCardsBirthdayChart");
  expect(source).not.toContain("allBirthdateSeo");
});
