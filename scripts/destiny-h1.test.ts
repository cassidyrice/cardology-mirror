import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "destiny-cards", "page.tsx"),
  "utf8",
);

test("destiny hub aligns title and H1 to the Cards of Destiny head term", () => {
  expect(page).toContain('const TITLE = "Cards of Destiny: Find Your Birth Card"');
  expect(page).toContain("Cards of Destiny: Find Your Birth Card</h1>");
  expect(page).toContain("Cards of Destiny and Destiny Cards are names");
  expect(page).toContain("<BirthCardCalculator />");
});
