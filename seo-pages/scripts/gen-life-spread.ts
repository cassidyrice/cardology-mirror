/**
 * Generates pipeline/data/life_spread_cards.json — the Life Spread row of nine
 * for all 52 cards, straight out of the production engine walk.
 *
 * `cardology.cardsFrom(card, 1, 9)` is the same call `buildPublicLifeSpread()`
 * in lib/life-path.ts makes, so the table cannot drift from the paid reading:
 * seo-pages/life-spread-table.test.ts asserts the two agree for all 52 cards.
 *
 * The Joker has no spread position and is deliberately absent.
 *
 * Usage: bun seo-pages/scripts/gen-life-spread.ts [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import cardology from "../../lib/engine-core/engine.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const KARMA_FILE = join(REPO_ROOT, "pipeline", "data", "karma_cards.json");
const OUT_FILE = join(REPO_ROOT, "pipeline", "data", "life_spread_cards.json");

/**
 * Mercury -> Result, in walk order. The Moon sits before Mercury in the reading
 * and is not part of this row; "Result / Cosmic Reward" is the doc vocabulary
 * for the ninth card (never "Princess").
 */
export const LIFE_SPREAD_POSITIONS = [
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "result",
] as const;

export type LifeSpreadPosition = (typeof LIFE_SPREAD_POSITIONS)[number];
export type LifeSpreadTable = Record<string, Record<LifeSpreadPosition, string>>;

export function buildLifeSpreadTable(cards: readonly string[]): LifeSpreadTable {
  const out: LifeSpreadTable = {};
  for (const card of cards) {
    const line = cardology.cardsFrom(card, 1, 9) as string[] | null;
    if (!line || line.length < 9) throw new Error(`engine returned no life spread for ${card}`);
    const row = {} as Record<LifeSpreadPosition, string>;
    LIFE_SPREAD_POSITIONS.forEach((position, index) => {
      row[position] = line[index];
    });
    out[card] = row;
  }
  return out;
}

function main(): number {
  const cards = Object.keys(JSON.parse(readFileSync(KARMA_FILE, "utf8")) as Record<string, unknown>);
  const table = buildLifeSpreadTable(cards);
  const json = `${JSON.stringify(table, null, 1)}\n`;

  if (process.argv.includes("--check")) {
    const current = readFileSync(OUT_FILE, "utf8");
    if (current !== json) {
      console.error("life_spread_cards.json is stale — re-run without --check");
      return 1;
    }
    console.log(`life_spread_cards.json up to date (${cards.length} cards)`);
    return 0;
  }

  writeFileSync(OUT_FILE, json);
  console.log(`wrote ${OUT_FILE} — ${cards.length} cards x ${LIFE_SPREAD_POSITIONS.length} positions`);
  return 0;
}

if (import.meta.main) process.exit(main());
