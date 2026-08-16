import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ARTICLE_URL =
  "https://buttondown.com/cardblueprint/archive/i-published-the-full-366-date-cardology-map/";

const methodology = readFileSync(
  join(import.meta.dir, "..", "app", "methodology", "page.tsx"),
  "utf8",
);
const about = readFileSync(
  join(import.meta.dir, "..", "app", "about", "page.tsx"),
  "utf8",
);

test("methodology links the dataset section to the public authority article", () => {
  expect(methodology).toContain(ARTICLE_URL);
  expect(methodology).toContain("Read the 366-date publication note");
});

test("about links Card Blueprints research to the public authority article", () => {
  expect(about).toContain(ARTICLE_URL);
  expect(about).toContain("Research and data");
});
