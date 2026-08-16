import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "..", "app/birth-card/page.tsx"), "utf8");

test("birth-card hub promotes current Semrush ranking targets above the deck", () => {
  const popular = source.indexOf("Popular card meanings");
  const deck = source.indexOf("<DeckMatrix />");
  expect(popular).toBeGreaterThan(0);
  expect(deck).toBeGreaterThan(popular);
  expect(source).toContain('["Ace of Hearts meaning", "/birth-card/ace-of-hearts"]');
  expect(source).toContain('["10 of Hearts meaning", "/birth-card/10-of-hearts"]');
  expect(source).toContain('["10 of Diamonds meaning", "/birth-card/10-of-diamonds"]');
});
