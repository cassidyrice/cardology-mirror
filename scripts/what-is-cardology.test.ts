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
