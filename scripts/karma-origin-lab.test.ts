import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const calculator = readFileSync(
  join(root, "components", "seo", "BirthCardCalculator.tsx"),
  "utf8",
);

test("birth-card calculator result is card + Deep Dive, not karma lab or Life Path", () => {
  expect(calculator).toContain("<DeepDiveCta");
  expect(calculator).toContain('placement="birth-card-calculator-result"');
  expect(calculator).toContain("birthdate={date || reveal.birthdate}");
  expect(calculator).not.toContain("LifePathBoardSolo");
  expect(calculator).not.toContain("KarmaOriginLab");
});
