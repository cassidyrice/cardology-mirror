import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card-compatibility-calculator", "page.tsx"),
  "utf8",
);

test("compatibility calculator aligns title and H1 to the GSC query", () => {
  expect(page).toContain('const TITLE = "Cardology Compatibility Calculator (Playing Cards, Not Tarot)"');
  expect(page).toContain("Cardology Compatibility Calculator\n      </h1>");
  expect(page).toContain("Enter two birthdays. The tool returns each playing-card birth card and");
  expect(page).toContain("<CompatibilityCalculator />");
  const calculator = page.indexOf("<CompatibilityCalculator />");
  const aside = page.indexOf('aria-label="Playing cards, not tarot"');
  expect(calculator).toBeGreaterThan(0);
  expect(aside).toBeGreaterThan(calculator);
});
