import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * CAR-65: first-paragraph intent + one question heading per hub.
 * Phrases come from existing page intent (FAQ, H1, slug), not from a GSC query export.
 */
const root = join(import.meta.dir, "..");

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const HUBS = [
  {
    path: "/birth-card-calculator",
    file: "app/birth-card-calculator/page.tsx",
    answer: "Your birthday maps to one playing card in a standard 52-card deck.",
    question: "What is a birth card in Cardology?",
    before: "<BirthCardCalculator />",
  },
  {
    path: "/birth-card",
    file: "app/birth-card/page.tsx",
    answer: "A Cardology birth card is the one playing card your birthday maps to",
    question: "How do I find my birth card?",
    before: "<DeckMatrix />",
  },
  {
    path: "/what-is-cardology",
    file: "app/what-is-cardology/page.tsx",
    answer: "Cardology maps your birthday to one card in a standard 52-card playing",
    question: "What is Cardology?",
    before: "<BirthCardCalculator />",
  },
  {
    path: "/cardology-compatibility",
    file: "app/cardology-compatibility/page.tsx",
    answer: "Cardology compatibility compares two birthday-locked playing cards",
    question: "What is Cardology compatibility?",
    before: "<CompatibilityCalculator />",
  },
  {
    path: "/",
    file: "app/page.tsx",
    answer: "Your birthday maps to one playing card in a 52-card deck.",
    question: "How do I find my birth card?",
    before: "<LandingCalculator />",
  },
] as const;

test("AI Overview hubs answer the page intent early and under a question heading", () => {
  for (const hub of HUBS) {
    const source = read(hub.file);
    const answerAt = source.indexOf(hub.answer);
    const toolAt = source.indexOf(hub.before);
    expect(answerAt, hub.path).toBeGreaterThan(-1);
    expect(toolAt, hub.path).toBeGreaterThan(answerAt);
    expect(source, hub.path).toMatch(
      new RegExp(`<h2\\b[^>]*>\\s*${hub.question.replace(/[?]/g, "\\?")}\\s*</h2>`),
    );
    expect(source, hub.path).toMatch(/not a forecast|not a prediction/);
    expect(source, hub.path).not.toContain("Deep Dive");
    expect(source, hub.path).not.toContain("Blueprint Report");
  }
});
