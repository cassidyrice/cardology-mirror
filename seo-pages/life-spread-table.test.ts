import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildPublicLifeSpread } from "../lib/life-path";
import {
  LIFE_SPREAD_POSITIONS,
  type LifeSpreadTable,
} from "./scripts/gen-life-spread";

const REPO_ROOT = join(import.meta.dir, "..");
const table = JSON.parse(
  readFileSync(join(REPO_ROOT, "pipeline", "data", "life_spread_cards.json"), "utf8"),
) as LifeSpreadTable;
const karma = JSON.parse(
  readFileSync(join(REPO_ROOT, "pipeline", "data", "karma_cards.json"), "utf8"),
) as Record<string, unknown>;

test("covers all 52 cards and no Joker", () => {
  expect(Object.keys(table)).toEqual(Object.keys(karma));
  expect(Object.keys(table).length).toBe(52);
  expect(table.Joker).toBeUndefined();
});

test("every card's row equals the engine walk in lib/life-path.ts", () => {
  for (const card of Object.keys(table)) {
    const spread = buildPublicLifeSpread(card);
    expect(spread).not.toBeNull();
    // positions[0] is the Moon, which is not part of the Life Spread row.
    const walk = spread!.positions.filter((p) => p.role !== "moon");
    expect(walk.map((p) => p.role)).toEqual([...LIFE_SPREAD_POSITIONS]);
    for (const position of walk) {
      expect(`${card} ${position.role} ${table[card][position.role as never]}`).toBe(
        `${card} ${position.role} ${position.code}`,
      );
    }
  }
});

test("the row is nine distinct positions of real card symbols", () => {
  for (const [card, row] of Object.entries(table)) {
    expect(Object.keys(row)).toEqual([...LIFE_SPREAD_POSITIONS]);
    for (const symbol of Object.values(row)) {
      expect(karma[symbol], `${card} -> ${symbol}`).toBeDefined();
    }
  }
});
