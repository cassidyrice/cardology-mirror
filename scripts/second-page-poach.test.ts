import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function expectBodyAnchor(source: string, href: string, anchor: string) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `href="${escapedHref}"[\\s\\S]{0,240}>\\s*${escapedAnchor}\\s*<`,
  );
  expect(source).toMatch(pattern);
}

const CALCULATOR_LINKS: Array<[string, string]> = [
  ["/birth-card", "52 birth card meanings"],
  ["/birth-card-compatibility-calculator", "birth card compatibility calculator"],
  ["/compatibility/", "card compatibility directory"],
  ["/destiny-cards", "Destiny Cards synonym map"],
  // The blog URL 301s to the evergreen guide. Link the canonical page.
  ["/what-is-cardology", "what Cardology is and is not"],
  ["/birth-card/8-of-diamonds", "Eight of Diamonds meaning"],
  ["/birth-card/5-of-spades", "Five of Spades meaning"],
  ["/birth-card/6-of-clubs", "Six of Clubs meaning"],
  ["/birth-card/10-of-spades", "Ten of Spades meaning"],
  ["/birth-card/5-of-hearts", "Five of Hearts meaning"],
  ["/birth-card/king-of-diamonds", "King of Diamonds meaning"],
  ["/birth-card/joker", "Joker birth card"],
  ["/birth-card/2-of-diamonds", "Two of Diamonds meaning"],
  ["/birth-card/ace-of-clubs", "Ace of Clubs meaning"],
  ["/birth-card/4-of-clubs", "Four of Clubs meaning"],
  ["/birth-card/queen-of-hearts", "Queen of Hearts meaning"],
  ["/birth-card/jack-of-clubs", "Jack of Clubs meaning"],
  ["/birth-card/9-of-clubs", "Nine of Clubs meaning"],
];

test("the birth card calculator links every CAR-62 hub and band meaning in open body copy", () => {
  const source = read("app/birth-card-calculator/page.tsx");
  const chart = source.slice(source.indexOf('id="cardology-chart"'));
  expect(chart.indexOf("Card meanings")).toBeGreaterThan(0);

  for (const [href, anchor] of CALCULATOR_LINKS) {
    expectBodyAnchor(chart, href, anchor);
  }
  expect(chart).not.toMatch(/click here/i);
  expect(chart).not.toContain("Blueprint Report");
  expect(chart).not.toContain("Deep Dive");
});

test("the compatibility guide links the calculator, directory hub, and Destiny Cards map", () => {
  const source = read("app/cardology-compatibility/page.tsx");
  expectBodyAnchor(source, "/birth-card-compatibility-calculator", "birth card compatibility calculator");
  expectBodyAnchor(source, "/compatibility/10-of-hearts", "10 of Hearts compatibility");
  expectBodyAnchor(source, "/destiny-cards", "Destiny Cards synonym map");
  expectBodyAnchor(source, "/birth-card", "52 Cardology card meanings");
  expect(source).toContain("COMPATIBILITY_DIRECTORY_PATH");
  expect(source).not.toMatch(/click here/i);
  expect(source).not.toContain("Blueprint Report");
  expect(source).not.toContain("Deep Dive");
});

test("band meaning links are not added from other birth-card pages", () => {
  const reads = read("lib/end-of-page-reads.ts");
  expect(reads).not.toContain("AHEAD_OF_BAND");
  expect(reads).not.toContain("5-of-hearts");
  expect(reads).not.toContain("queen-of-hearts");
});
