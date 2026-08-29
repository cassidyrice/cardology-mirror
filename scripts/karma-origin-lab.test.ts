import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const calculator = readFileSync(
  join(root, "components", "seo", "BirthCardCalculator.tsx"),
  "utf8",
);
const lab = readFileSync(
  join(root, "components", "seo", "KarmaOriginLab.tsx"),
  "utf8",
);

test("karma lab sits above Deep Dive on the calculator result", () => {
  expect(calculator).toContain("<LifePathBoardSolo");
  expect(calculator).toContain("<KarmaOriginLab");
  expect(calculator.indexOf("<KarmaOriginLab")).toBeLessThan(
    calculator.indexOf("<DeepDiveCta"),
  );
  expect(calculator).toContain('birthdate={date || reveal.birthdate}');
});

test("lab labels spirit vs life path and bans fate copy", () => {
  expect(lab).toContain("Spirit (year 0)");
  expect(lab).toContain("Life path (spread 1)");
  expect(lab).toContain("no Environment or Displacement pair");
  expect(lab).toContain("spread-cell");
  expect(lab).not.toMatch(/\bfate\b/i);
  expect(lab).not.toMatch(/\bdestiny\b/i);
  expect(lab).not.toMatch(/\bfortune\b/i);
  expect(lab).not.toMatch(/\bpredict\b/i);
  expect(lab).not.toMatch(/\bsoulmate\b/i);
  expect(lab).not.toContain("—");
});
