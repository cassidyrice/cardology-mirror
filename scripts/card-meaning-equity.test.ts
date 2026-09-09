import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "..", "app/birth-card/page.tsx"), "utf8");

test("birth-card hub promotes current Semrush ranking targets above the deck", () => {
  const popular = source.indexOf("Popular card meanings");
  const deck = source.indexOf("<DeckMatrix />");
  expect(popular).toBeGreaterThan(0);
  expect(deck).toBeGreaterThan(popular);
  const popularCardMeanings = source.slice(popular, deck);
  // Inline hub list in app/birth-card/page.tsx (Popular card meanings section).
  const promotedSlugs = [
    "joker",
    "ace-of-hearts",
    "10-of-hearts",
    "10-of-diamonds",
    "queen-of-hearts",
    "queen-of-clubs",
    "7-of-spades",
    "king-of-clubs",
    "ace-of-spades",
    "queen-of-spades",
    "6-of-diamonds",
    "10-of-clubs",
    "2-of-hearts",
    "3-of-clubs",
  ];

  for (const slug of promotedSlugs) {
    expect(popularCardMeanings).toContain(`"/birth-card/${slug}"`);
  }

  expect(
    popularCardMeanings.match(/\["[^"]+",\s*"\/birth-card\/[^"]+"\]/g) ?? [],
  ).toHaveLength(14);
});
