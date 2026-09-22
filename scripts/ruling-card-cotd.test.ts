import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prc = readFileSync(
  join(import.meta.dir, "..", "app", "planetary-ruling-card", "page.tsx"),
  "utf8",
);
const site = readFileSync(join(import.meta.dir, "..", "lib", "site.ts"), "utf8");
const cotd = readFileSync(
  join(import.meta.dir, "..", "app", "card-of-the-day", "page.tsx"),
  "utf8",
);
const bvr = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card-vs-ruling-card", "page.tsx"),
  "utf8",
);

test("planetary ruling card page is complete and registered", () => {
  expect(prc).toContain("Planetary Ruling Card Chart: Find Yours by Birthday");
  expect(prc).toContain("<h1");
  expect(prc).toContain("Planetary Ruling Card Chart</h1>");
  expect(prc).toContain('canonical: "/planetary-ruling-card"');
  expect(prc).toContain('"@type": "FAQPage"');
  expect(prc).toContain("What is a planetary ruling card?");
  expect(prc).toContain("How do I find my planetary ruling card?");
  expect(prc).toContain("Can you have two ruling cards?");
  expect(prc).toContain("<BirthCardCalculator />");
  expect(site).toContain('"/planetary-ruling-card"');
});

test("ruling card page is cross-linked from related pages", () => {
  const whatIs = readFileSync(
    join(import.meta.dir, "..", "app", "what-is-cardology", "page.tsx"),
    "utf8",
  );
  expect(whatIs).toContain('href="/planetary-ruling-card"');
  expect(bvr).toContain('href="/planetary-ruling-card"');
});

test("card of the day owns the Cardology head term", () => {
  expect(cotd).toContain('name: "Cardology Card of the Day"');
  expect(cotd).toMatch(/<h1[^>]*>\s*Cardology Card of the Day\b/);
  expect(cotd).toContain("What is the Cardology card of the day?");
});

test("card of the day share title names the fixed birth-card map", () => {
  const ogTitle = cotd.match(/const ogTitle = "([^"]+)"/)?.[1];
  const ogDescription = cotd.match(/const ogDescription =\n\s+"([^"]+)"/)?.[1];
  expect(ogTitle).toBe("Cardology Card of the Day: Fixed Birth-Card Map");
  expect(ogTitle!.length).toBeLessThanOrEqual(60);
  expect(ogDescription).toBe(
    "Cardology's fixed calendar: every date maps to one birth card — no shuffle, no draw. A mirror, not a forecast. Not tarot.",
  );
  expect(ogDescription!.length).toBeLessThanOrEqual(200);
  expect(cotd.match(/title: ogTitle/g)?.length).toBe(2);
  expect(cotd.match(/description: ogDescription/g)?.length).toBe(2);
  expect(cotd).not.toContain("Free Daily Playing Card Reading");
  expect(cotd).not.toContain("daily playing-card reading");
  expect(cotd).not.toMatch(/\btarot draw\b/i);
  expect(cotd).not.toContain("Deep Dive");
  expect(cotd).not.toContain("Blueprint Report");
  expect(cotd).toContain('href="/birth-card-calculator"');
  expect(cotd).toMatch(/^export function generateMetadata\b/m);
  expect(cotd).toMatch(/^export default function CardOfTheDayPage\b/m);
  expect(cotd).not.toMatch(/^export (?!const (?:runtime|dynamic)\b|function generateMetadata\b|default function CardOfTheDayPage\b)/m);
});
