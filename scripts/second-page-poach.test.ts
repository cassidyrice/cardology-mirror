import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { endOfPageReads } from "../lib/end-of-page-reads";
import { allCardSeo, cardBySlug } from "../lib/seo-cards";

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

test("the birth card calculator links the pos 8–15 hubs in open body copy", () => {
  const source = read("app/birth-card-calculator/page.tsx");
  const chart = source.slice(source.indexOf('id="cardology-chart"'));
  expect(chart.indexOf("Card meanings")).toBeGreaterThan(0);

  const links: Array<[string, string]> = [
    ["/birth-card", "52 birth card meanings"],
    ["/birth-card-compatibility-calculator", "birth card compatibility calculator"],
    ["/compatibility/", "card compatibility directory"],
    ["/destiny-cards", "Destiny Cards synonym map"],
    ["/blog/what-cardology-is-and-is-not", "what Cardology is and is not"],
    ["/birth-card/8-of-diamonds", "Eight of Diamonds meaning"],
    ["/birth-card/5-of-spades", "Five of Spades meaning"],
    ["/birth-card/6-of-clubs", "Six of Clubs meaning"],
    ["/birth-card/10-of-spades", "Ten of Spades meaning"],
  ];

  for (const [href, anchor] of links) {
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
  expect(source).toContain("COMPATIBILITY_DIRECTORY_PATH");
  expect(source).toContain('href="/birth-card"');
  expect(source).not.toMatch(/click here/i);
  expect(source).not.toContain("Blueprint Report");
  expect(source).not.toContain("Deep Dive");
});

test("stronger same-suit meaning pages name a band card in related reads", () => {
  const cases = [
    ["king-of-hearts", "/birth-card/5-of-hearts", "5 of Hearts meaning"],
    ["6-of-diamonds", "/birth-card/8-of-diamonds", "8 of Diamonds meaning"],
    ["8-of-hearts", "/birth-card/queen-of-hearts", "Queen of Hearts meaning"],
  ] as const;

  for (const [slug, href, label] of cases) {
    const card = cardBySlug(slug);
    expect(card).toBeTruthy();
    const siblings = allCardSeo().filter((c) => c.suit === card!.suit && c.slug !== card!.slug);
    const reads = endOfPageReads(card!, siblings);
    const hits = reads.filter((read) => read.href === href);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.label).toBe(label);
    expect(hits[0]?.note).toBe(`same ${card!.suit} suit`);
    expect(reads.length).toBeLessThanOrEqual(6);
    expect(new Set(reads.map((read) => read.href)).size).toBe(reads.length);
  }
});
