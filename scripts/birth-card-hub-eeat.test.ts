import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card", "page.tsx"),
  "utf8",
);

const APPROVED_TITLE = "52 Cardology Card Meanings | All Birth Cards";
const APPROVED_META =
  "Browse all 52 Cardology birth card meanings — suit, rank, shadow, exact birth dates. Playing cards, not tarot. Find yours free, then open the card.";

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
  expect(page).toContain("What is the 52xSeven Blueprint?");
  expect(page).toContain("faqs.map((f)");
});

test("birth-card hub retains CollectionPage and all-card matrix", () => {
  expect(page).toContain('"@type": "CollectionPage"');
  expect(page).toContain('"@type": "ItemList"');
  expect(page).toContain("<DeckMatrix />");
});

test("birth-card hub title and meta match approved GSC copy exactly", () => {
  expect(page).toContain(`const TITLE = "${APPROVED_TITLE}"`);
  expect(page).toContain(`"${APPROVED_META}"`);
  expect(page).not.toContain("Cardology Card Meanings: All 52 Birth Cards Explained (Not Tarot)");
  expect(page).not.toContain(
    "Browse all 52 Cardology birth cards by suit, with meanings, strengths, shadow patterns",
  );
});

test("birth-card hub sells the $19 52xSeven Blueprint without gutting free value", () => {
  expect(page).toContain("<OfferCta");
  expect(page).toContain("DEEP_DIVE_PRODUCT_NAME");
  expect(page).toContain("DEEP_DIVE_PRICE_LABEL");
  expect(page).toContain("DEEP_DIVE_CALCULATOR_FORM_HREF");
  expect(page).toContain("Find your birth card free");
  expect(page).toContain("<FreeCourseCta");
  expect(page).toContain("52xSeven Blueprint ($19)");
  expect(page).toContain("one payment, no renewal");
  expect(page).not.toContain("$9");
  expect(page).not.toContain("$13");
  expect(page).not.toContain("personal-card-blueprint");
  expect(page).not.toContain("Deep Dive");
  expect(page).not.toContain("buy.stripe.com");
});
