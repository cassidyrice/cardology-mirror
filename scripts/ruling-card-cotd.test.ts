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
  expect(prc).toContain("Planetary Ruling Card: What It Is & How to Find Yours");
  expect(prc).toContain("<h1");
  expect(prc).toContain("Planetary Ruling Card</h1>");
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
  expect(cotd).toContain("Cardology Card of the Day: Today's Playing Card Meaning");
  expect(cotd).toContain("Cardology Card of the Day</h1>");
  expect(cotd).toContain("What is the Cardology card of the day?");
});
