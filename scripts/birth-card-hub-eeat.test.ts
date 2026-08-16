import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card", "page.tsx"),
  "utf8",
);

test("birth-card hub meets direct-answer and E-E-A-T gates", () => {
  expect(page).toContain("data-ai-summary");
  expect(page).toContain("A Cardology birth card is the one playing card");
  expect(page).toContain("Cassidy Rice");
  expect(page).toContain('href="/editorial-policy"');
  expect(page).toContain('href="/methodology"');
  expect(page).toContain('"@type": "Article"');
});

test("birth-card hub has visible FAQ and FAQ schema", () => {
  expect(page).toContain('"@type": "FAQPage"');
  expect(page).toContain("Birth card FAQ");
  expect(page).toContain("What is a birth card?");
  expect(page).toContain("Are Cardology birth cards the same as tarot birth cards?");
  expect(page).toContain("What do the 52 birth cards mean?");
  expect(page).toContain("faqs.map((f)");
});

test("birth-card hub retains CollectionPage and all-card matrix", () => {
  expect(page).toContain('"@type": "CollectionPage"');
  expect(page).toContain('"@type": "ItemList"');
  expect(page).toContain("<DeckMatrix />");
});
