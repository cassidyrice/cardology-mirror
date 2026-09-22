import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { endOfPageReads } from "../app/birth-card/[slug]/page";
import { allCardSeo, cardBySlug } from "../lib/seo-cards";

const root = join(import.meta.dir, "..");
const meaning = readFileSync(join(root, "app/birth-card/[slug]/page.tsx"), "utf8");
const compat = readFileSync(join(root, "components/seo/CompatibilityCalculator.tsx"), "utf8");

test("birth-card pages close with related reads and one soft reading line", () => {
  const faq = meaning.indexOf('title="Frequently asked questions"');
  const reads = meaning.indexOf("<EndOfPageReads");
  expect(faq).toBeGreaterThan(0);
  expect(reads).toBeGreaterThan(faq);
  expect(meaning.match(/<DeepDiveCta\b/g)).toHaveLength(1);
  expect(meaning).toContain('placement="birth-card-meaning-above-fold"');
  expect(meaning).toContain("A mirror, not a forecast.");
  expect(meaning).not.toContain("Deep Dive");
  expect(meaning).not.toContain("sticky");
  expect(meaning).not.toContain('role="dialog"');
});

test("compatibility continues from the birthday already stored in this tab", () => {
  expect(compat).toContain("readCheckoutBirthdate()");
  expect(compat).not.toMatch(/\?birthdate=/);
  expect(compat).not.toMatch(/\?bd=/);
});

for (const slug of ["8-of-diamonds", "king-of-hearts"] as const) {
  test(`end-of-page reads for ${slug} are real internal links`, () => {
    const card = cardBySlug(slug);
    expect(card).toBeTruthy();
    const siblings = allCardSeo().filter((c) => c.suit === card!.suit && c.slug !== card!.slug);
    const reads = endOfPageReads(card!, siblings);
    expect(reads.length).toBeGreaterThanOrEqual(3);
    expect(reads.length).toBeLessThanOrEqual(6);
    const hrefs = reads.map((read) => read.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.some((href) => href.startsWith("/birth-card/") && href !== `/birth-card/${slug}`)).toBe(true);
    expect(hrefs).toContain("/planetary-ruling-card");
    expect(hrefs).toContain("/what-is-cardology");
    expect(hrefs.some((href) => href.startsWith("/compatibility/"))).toBe(true);
    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
      expect(href).not.toContain(" ");
    }
    const sameSuit = hrefs.filter((href) => href.startsWith("/birth-card/"));
    for (const href of sameSuit) {
      const linked = cardBySlug(href.replace("/birth-card/", ""));
      expect(linked?.suit).toBe(card!.suit);
    }
  });
}
