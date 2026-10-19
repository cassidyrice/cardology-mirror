import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BIRTHDATE_CHART_TAG,
  BUTTONDOWN_EMBED_SUBSCRIBE,
  birthdateChartFilename,
  birthdateChartFromIsoDate,
  birthdateChartTags,
} from "../lib/birthdate-chart";

const root = join(import.meta.dir, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

test("December 31 is the Joker, never a silent King of Spades", () => {
  const chart = birthdateChartFromIsoDate("1990-12-31")!;
  expect(chart.isJoker).toBe(true);
  expect(chart.birth.code).toBe("Joker");
  expect(chart.slug).toBe("joker");
  expect(chart.ruling).toEqual([]);
  expect(chart.karma).toBeNull();
  expect(birthdateChartTags(chart, "calculator-result")).toEqual([BIRTHDATE_CHART_TAG, "calculator-result", "card-joker"]);
});

test("a normal birthday carries birth, ruling, and karma cards", () => {
  const chart = birthdateChartFromIsoDate("1990-06-15")!;
  expect(chart.birth.code).toBe("2♦");
  expect(chart.dateLabel).toBe("June 15");
  expect(chart.ruling.map((c) => c.code)).toEqual(["J♠"]);
  expect(chart.karma?.environment.code).toBe("A♦");
  expect(chart.karma?.displacement.code).toBe("6♣");
  expect(chart.strength.length).toBeGreaterThan(10);
  expect(birthdateChartFilename(chart)).toBe("card-blueprints-birthdate-chart-2-of-diamonds.png");
});

test("fixed cards carry no karma cards", () => {
  const chart = birthdateChartFromIsoDate("1990-01-01")!;
  expect(chart.birth.code).toBe("K♠");
  expect(chart.isFixed).toBe(true);
  expect(chart.karma).toBeNull();
});

test("tags never carry the birthday; invalid dates give no chart", () => {
  const chart = birthdateChartFromIsoDate("1990-06-15")!;
  for (const tag of birthdateChartTags(chart, "home-reveal")) expect(tag).not.toMatch(/\d{4}|06-15|june/i);
  expect(birthdateChartFromIsoDate("1990-02-30")).toBeNull();
});

test("the download component saves the lead to the same Buttondown list without leaving the page", () => {
  const c = read("components/seo/BirthdateChartDownload.tsx");
  expect(BUTTONDOWN_EMBED_SUBSCRIBE).toBe("https://buttondown.com/api/emails/embed-subscribe/cardblueprint");
  expect(c).toContain("e.preventDefault()");
  expect(c).toContain('mode: "no-cors"');
  expect(c).not.toContain('name="birthdate"');
  expect(c).not.toContain("action={");
  expect(c).not.toMatch(/\$\d/);
  expect(read("components/seo/Reveal.tsx")).toContain('<BirthdateChartDownload birthdate={birthdate} source="home-reveal" />');
});
