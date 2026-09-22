import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dir, "..", "app", "what-is-cardology", "page.tsx"),
  "utf8",
);

test("what-is-cardology carries the 52-card meanings index", () => {
  expect(source).toContain('id="card-meanings"');
  expect(source).toContain("Cardology card meanings: all 52 cards");
  expect(source).toContain("<DeckMatrix />");
  expect(source).toContain('import { DeckMatrix } from "@/components/cards/DeckMatrix";');
  expect(source).toContain('{ id: "card-meanings", label: "Card meanings" }');
});

test("accuracy and card-meanings FAQs exist", () => {
  expect(source).toContain("Is Cardology accurate?");
  expect(source).toContain("What are Cardology card meanings?");
});

test("what-is-cardology uses the minute One Question Reading SLA", () => {
  expect(source).toContain("ONE_QUESTION_TURNAROUND");
  expect(source).not.toContain("2 business days");
});

test("what-is-cardology jump nav covers the major sections without moving the calculator", () => {
  const calculator = source.indexOf("<BirthCardCalculator />");
  const toc = source.indexOf('aria-label="On this page"');
  expect(calculator).toBeGreaterThan(0);
  expect(toc).toBeGreaterThan(calculator);
  for (const item of [
    '{ id: "what-it-is", label: "What it is" }',
    '{ id: "how-it-works", label: "How it works" }',
    '{ id: "benefits", label: "Benefits" }',
    '{ id: "suits", label: "Suits" }',
    '{ id: "card-meanings", label: "Card meanings" }',
    '{ id: "layers", label: "Birth vs ruling" }',
    '{ id: "history", label: "History" }',
    '{ id: "faq", label: "FAQ" }',
  ]) {
    expect(source).toContain(item);
  }
  expect(source).toContain('id="what-it-is"');
  expect(source).toContain('id="history"');
  expect(source).toContain('id="lineage"');
  expect(source).toContain('id="faq"');
});

test("what-is-cardology has quiet continue rows at three section ends", () => {
  const rows = source.match(/<QuietContinue \/>/g) ?? [];
  expect(rows).toHaveLength(3);
  expect(source).toContain('href="/birth-card-calculator#bd"');
  expect(source).toContain("Find your card");
  expect(source).toContain('href="/birth-card"');
  expect(source).toContain("Browse 52 meanings");
  expect(source.indexOf("Find your card")).toBeLessThan(source.indexOf("One question ($13), optional"));
  expect(source).toContain('id="faq"');
  const faq = source.indexOf('id="faq"');
  const continues = [...source.matchAll(/<QuietContinue \/>/g)].map((m) => m.index ?? -1);
  expect(continues.filter((index) => index < faq)).toHaveLength(3);
});
