import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const calculator = readFileSync(
  join(root, "components", "seo", "BirthCardCalculator.tsx"),
  "utf8",
);

test("birth-card calculator result is the card, then the $13 reading, not karma lab or Life Path", () => {
  expect(calculator).not.toContain("<ReportCheckoutButton");
  expect(calculator).not.toContain("CONSULT_SLUG");
  expect(calculator).not.toContain("Blueprint Report");
  expect(calculator).toContain("DEEP_DIVE_PRODUCT_NAME");
  expect(calculator).toContain("ONE_QUESTION_TURNAROUND");
  expect(calculator).toContain('placement: "birth-card-calculator-result"');
  expect(calculator).toContain("birthdate={date || reveal.birthdate}");
  expect(calculator).not.toContain("LifePathBoardSolo");
  expect(calculator).not.toContain("KarmaOriginLab");
});
