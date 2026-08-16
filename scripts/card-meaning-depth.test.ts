import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card", "[slug]", "page.tsx"),
  "utf8",
);

test("drawn-card money and advice sections render on all card pages", () => {
  expect(source).toContain('<h3 className="mt-4 font-serif text-base text-bone">In money and work</h3>');
  expect(source).toContain('<h3 className="mt-4 font-serif text-base text-bone">As advice</h3>');
  expect(source).toContain("function moneyReadingText(card: CardSeo): string");
  expect(source).toContain("function adviceReadingText(card: CardSeo): string");
});

test("FAQ mirrors the money section and disambiguates tarot", () => {
  expect(source).toContain("mean for money and career?`, a: moneyReadingText(card)");
  expect(source).toContain("a tarot card?`, a: tarotFaqText(card)");
  expect(source).toContain('hearts: "Cups"');
  expect(source).toContain('clubs: "Wands"');
  expect(source).toContain('diamonds: "Pentacles"');
  expect(source).toContain('spades: "Swords"');
});

test("every suit has distinct money and advice themes", () => {
  for (const fn of ["moneyTheme", "adviceTheme"]) {
    expect(source).toContain(`function ${fn}(card: CardSeo): string`);
    const body = source.split(`function ${fn}`)[1].split("\n}\n")[0];
    for (const suit of ["hearts", "clubs", "diamonds", "spades"]) {
      expect(body).toContain(`case "${suit}"`);
    }
  }
});
