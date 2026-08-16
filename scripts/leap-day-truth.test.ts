import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { publicBirthCardCode } from "../lib/birth-card-truth";

const root = join(import.meta.dir, "..");
const publicTruthFiles = [
  "app/what-is-cardology/page.tsx",
  "app/methodology/page.tsx",
  "app/52-card-astrology-explained/page.tsx",
  "app/birth-card/joker/page.tsx",
  "app/birth-card-calculator/page.tsx",
];

test("leap day maps to 9 of Clubs and Dec 31 stays Joker", () => {
  expect(publicBirthCardCode(2, 29)).toBe("9♣");
  expect(publicBirthCardCode(12, 31)).toBe("Joker");
});

test("authoritative pages do not exclude February 29", () => {
  const source = publicTruthFiles
    .map((path) => readFileSync(join(root, path), "utf8"))
    .join("\n");
  expect(source).not.toMatch(/February 29 (?:is |sits )?(?:not part of|outside) the cycle/i);
  expect(source).not.toMatch(/February 29 is not in the cycle/i);
  expect(source).toContain("February 29 maps normally to the 9 of Clubs");
});
