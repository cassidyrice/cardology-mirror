import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { allCardSeo } from "../lib/seo-cards";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card", "[slug]", "page.tsx"),
  "utf8",
);

// GSC 2026-09: "{card} spiritual meaning" (~30/mo per card) and
// "{card} reversed meaning" (~10/mo) had zero coverage on these pages.
test("card pages answer the spiritual and reversed queries", () => {
  expect(page).toContain("What does the ${card.label} mean spiritually?");
  expect(page).toContain("Does the ${card.label} have a reversed meaning?");
  expect(page).toContain("function spiritualReadingText");
  expect(page).toContain("function reversedFaqText");
  // Both answers must come from card data, never invented per card.
  expect(page).toContain("card.lifeDirection || card.coreIdentity || card.sweetSpot");
  expect(page).toContain("lensClause(card.under)");
  expect(page).toContain("lensClause(card.over)");
});

test("every card has the fields those two answers are built from", () => {
  const cards = allCardSeo();
  expect(cards).toHaveLength(52);
  for (const card of cards) {
    expect(card.lifeDirection || card.coreIdentity || card.sweetSpot).toBeTruthy();
    expect(card.under).toBeTruthy();
    expect(card.over).toBeTruthy();
  }
});

// The reversed answer must stay a correction, not a claim that reversals exist.
test("the reversed answer denies reversals instead of inventing them", () => {
  const start = page.indexOf("function reversedFaqText");
  const body = page.slice(start, page.indexOf("\nfunction ", start + 1));
  expect(body).toMatch(/is never reversed/);
  expect(body).toMatch(/expression, not direction/);
});
