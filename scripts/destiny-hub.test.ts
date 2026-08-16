import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("destiny hub title stays under 60 and leads with Cards of Destiny", () => {
  const source = read("app/destiny-cards/page.tsx");
  const match = source.match(/const TITLE = "([^"]+)"/);
  expect(match?.[1]).toBe("Cards of Destiny: Find Your Birth Card");
  expect(match?.[1].length).toBeLessThanOrEqual(60);
  expect(source).toContain("Cards of Destiny: Find Your Birth Card</h1>");
  expect(source).toContain('id="destiny-chart"');
  expect(source).toContain("$13");
  expect(source).not.toContain("$29");
});

test("destiny hub puts the calculator before the synonym table", () => {
  const source = read("app/destiny-cards/page.tsx");
  const calculator = source.indexOf("<BirthCardCalculator />");
  const names = source.indexOf('id="names"');
  expect(calculator).toBeGreaterThan(0);
  expect(names).toBeGreaterThan(calculator);
});
