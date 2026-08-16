import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "methodology", "page.tsx"),
  "utf8",
);

test("methodology exposes the 366-date CSV as a direct download", () => {
  expect(page).toContain("Download the 366-date Cardology map");
  expect(page).toContain('href="/data/cardology-birthday-map.csv"');
  expect(page).toContain('download="cardology-birthday-map.csv"');
  expect(page).toContain("366 rows");
});

test("methodology defines citation and claims boundaries for the dataset", () => {
  expect(page).toContain("How to cite this dataset");
  expect(page).toContain("Card Blueprints. Cardology Birthday Map");
  expect(page).toContain("deterministic date-to-card mappings");
  expect(page).toContain("interpretive meanings are Cardology pattern language");
  expect(page).toContain("February 29 maps to the 9 of Clubs");
  expect(page).toContain("December 31 is preserved as the Joker boundary");
});
