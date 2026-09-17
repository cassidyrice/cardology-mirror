import { expect, test } from "bun:test";
import { matchesRulingCardReference } from "../components/seo/PlanetaryRulingCardChart";
import { buildRulingCardReference } from "../lib/ruling-card-reference";

const rows = buildRulingCardReference();

test("card searches match an actual card, never words borrowed across dates or cards", () => {
  for (const [query, code] of [["7 of Clubs", "7♣"], ["Queen of Hearts", "Q♥"]]) {
    const expected = rows.filter((row) => [row.birthCard, ...row.rulingCards].some((card) => card.code === code));
    expect(rows.filter((row) => matchesRulingCardReference(row, query))).toEqual(expected);
  }
  expect(matchesRulingCardReference(rows.find((row) => row.id === "january-27")!, "7 of Clubs")).toBe(false);
  expect(matchesRulingCardReference(rows.find((row) => row.id === "june-5")!, "Queen of Hearts")).toBe(false);
});

test("full dates match one day, with named, abbreviated and numeric input", () => {
  for (const query of ["January 1", "Jan 1", "1/1", "01/01"]) {
    expect(rows.filter((row) => matchesRulingCardReference(row, query)).map((row) => row.id)).toEqual(["january-1"]);
  }
  expect(rows.filter((row) => matchesRulingCardReference(row, "February 30"))).toEqual([]);
});

test("card words and code aliases match all three ruling cards, including Joker", () => {
  const row = rows.find((row) => row.id === "october-23")!;
  for (const query of ["8 diamonds", "K♠", "5 of clubs"]) expect(matchesRulingCardReference(row, query)).toBe(true);
  expect(rows.filter((row) => matchesRulingCardReference(row, "joker")).map((row) => row.id)).toEqual(["december-31"]);
  expect(rows.filter((row) => matchesRulingCardReference(row, "  "))).toHaveLength(366);
});
