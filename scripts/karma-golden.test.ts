import { expect, test } from "bun:test";

import { cardology } from "../lib/engine-core/engine.js";
import { buildReading } from "../lib/reading";
import { getCardSeo } from "../lib/seo-cards";

// Lifetime karma pair for every Birth Card, as produced by
// getEnvironmentDisplacement(card, 1) — the Life Spread (SPREADS[0]) read
// against spread 1. This table is the contract. If it changes, every card
// page, every Deep Dive, and every paid reading changes with it.
//
// Spot-checked against the published karma-card tables:
//   A♥ → A♦ (first / displacement / challenge) + 3♥ (second / environment / gift)
//   Q♠ → 10♦ + 8♦
//   3♥ → A♥ + Q♣
// Semi-Fixed pairs are mutual in both directions: 2♥↔A♣, 9♥↔7♦.
// Fixed cards (J♥, 8♣, K♠) have no karma cards and are null.
type Pair = { environment: string; displacement: string } | null;

const GOLDEN: Record<string, Pair> = {
  "A♥": { environment: "3♥", displacement: "A♦" },
  "2♥": { environment: "A♣", displacement: "A♣" },
  "3♥": { environment: "Q♣", displacement: "A♥" },
  "4♥": { environment: "10♠", displacement: "4♠" },
  "5♥": { environment: "5♣", displacement: "4♦" },
  "6♥": { environment: "3♦", displacement: "4♣" },
  "7♥": { environment: "A♠", displacement: "8♥" },
  "8♥": { environment: "7♥", displacement: "7♠" },
  "9♥": { environment: "7♦", displacement: "7♦" },
  "10♥": { environment: "5♠", displacement: "J♣" },
  "J♥": null,
  "Q♥": { environment: "9♣", displacement: "10♠" },
  "K♥": { environment: "9♠", displacement: "2♣" },
  "A♣": { environment: "2♥", displacement: "2♥" },
  "2♣": { environment: "K♥", displacement: "A♠" },
  "3♣": { environment: "K♦", displacement: "5♦" },
  "4♣": { environment: "6♥", displacement: "5♣" },
  "5♣": { environment: "4♣", displacement: "5♥" },
  "6♣": { environment: "2♦", displacement: "8♠" },
  "7♣": { environment: "J♠", displacement: "8♦" },
  "8♣": null,
  "9♣": { environment: "6♦", displacement: "Q♥" },
  "10♣": { environment: "4♠", displacement: "J♠" },
  "J♣": { environment: "10♥", displacement: "J♦" },
  "Q♣": { environment: "10♦", displacement: "3♥" },
  "K♣": { environment: "8♠", displacement: "2♠" },
  "A♦": { environment: "A♥", displacement: "2♦" },
  "2♦": { environment: "A♦", displacement: "6♣" },
  "3♦": { environment: "Q♦", displacement: "6♥" },
  "4♦": { environment: "5♥", displacement: "5♠" },
  "5♦": { environment: "3♣", displacement: "9♦" },
  "6♦": { environment: "3♠", displacement: "9♣" },
  "7♦": { environment: "9♥", displacement: "9♥" },
  "8♦": { environment: "7♣", displacement: "Q♠" },
  "9♦": { environment: "5♦", displacement: "Q♦" },
  "10♦": { environment: "Q♠", displacement: "Q♣" },
  "J♦": { environment: "J♣", displacement: "3♠" },
  "Q♦": { environment: "9♦", displacement: "3♦" },
  "K♦": { environment: "7♠", displacement: "3♣" },
  "A♠": { environment: "2♣", displacement: "7♥" },
  "2♠": { environment: "K♣", displacement: "6♠" },
  "3♠": { environment: "J♦", displacement: "6♦" },
  "4♠": { environment: "4♥", displacement: "10♣" },
  "5♠": { environment: "4♦", displacement: "10♥" },
  "6♠": { environment: "2♠", displacement: "9♠" },
  "7♠": { environment: "8♥", displacement: "K♦" },
  "8♠": { environment: "6♣", displacement: "K♣" },
  "9♠": { environment: "6♠", displacement: "K♥" },
  "10♠": { environment: "Q♥", displacement: "4♥" },
  "J♠": { environment: "10♣", displacement: "7♣" },
  "Q♠": { environment: "8♦", displacement: "10♦" },
  "K♠": null,
};

const CARDS = Object.keys(GOLDEN);
const FIXED = ["J♥", "8♣", "K♠"];

test("golden table covers all 52 cards", () => {
  expect(CARDS.length).toBe(52);
  expect(CARDS.filter((c) => GOLDEN[c] === null)).toEqual(FIXED);
});

test("engine reproduces the golden karma pair for every card", () => {
  for (const c of CARDS) {
    expect(cardology.getEnvironmentDisplacement(c, 1)).toEqual(GOLDEN[c]);
  }
});

test("Fixed cards have no karma; Semi-Fixed pairs are mutual", () => {
  for (const f of FIXED) expect(cardology.getEnvironmentDisplacement(f, 1)).toBeNull();
  for (const [a, b] of [
    ["2♥", "A♣"],
    ["9♥", "7♦"],
  ]) {
    expect(GOLDEN[a]).toEqual({ environment: b, displacement: b });
    expect(GOLDEN[b]).toEqual({ environment: a, displacement: a });
  }
});

test("environment and displacement are inverse mappings", () => {
  for (const c of CARDS) {
    const k = GOLDEN[c];
    if (!k) continue;
    expect(GOLDEN[k.environment]?.displacement).toBe(c);
    expect(GOLDEN[k.displacement]?.environment).toBe(c);
  }
});

test("card pages serve the golden pair (or omit karma for Fixed cards)", () => {
  for (const c of CARDS) {
    const seo = getCardSeo(c);
    expect(seo).not.toBeNull();
    const k = GOLDEN[c];
    if (k) expect(seo!.karma).toEqual(k);
    else expect(seo!.karma).toBeUndefined();
  }
});

// A Fixed-card birthday must produce a complete reading with karma === null,
// not a crash. These are the 17 dates a year where bc_lifetime is null.
test("reading pipeline survives a Fixed-card birthday", () => {
  const cases: Array<[string, string]> = [
    ["07/30/1990", "J♥"],
    ["03/28/1990", "8♣"],
    ["01/01/1990", "K♠"],
  ];
  for (const [birthdate, expectedBc] of cases) {
    const r = buildReading(birthdate, "2026-08-28");
    expect(cardology.getBirthCard(...parseMD(birthdate))[0]).toBe(expectedBc);
    expect(r.karma.bc_lifetime).toBeNull();
    expect(r.deep_dive).toBeDefined();
  }
});

test("reading pipeline carries the golden pair for a non-Fixed birthday", () => {
  const r = buildReading("02/14/1990", "2026-08-28");
  const bc = cardology.getBirthCard(2, 14)[0];
  expect(r.karma.bc_lifetime).toEqual(GOLDEN[bc]);
});

function parseMD(mmddyyyy: string): [number, number] {
  const [m, d] = mmddyyyy.split("/").map(Number);
  return [m, d];
}
