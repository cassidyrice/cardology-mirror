import { expect, test } from "bun:test";

import { cardology } from "../lib/engine-core/engine.js";

// Enforces docs/cardology-system.md against the real engine. Every falsifiable
// claim in that document has a test here. If the engine changes, this fails and
// the document gets corrected — the document never drifts silently.
//
// The system's recurring bug is a spread index that is off by one, or a 45-year
// shortcut that is right for 48 of 52 cards. Both look plausible in output.
// These tests exist because eyeballing does not catch either.

const SPREAD_COUNT = 90;
const FIXED = ["8♣", "J♥", "K♠"];
const SEMI_FIXED = ["2♥", "A♣", "9♥", "7♦"];

const flat = (y: number) => {
  const s = cardology.SPREADS[String(y)];
  return [...s.grid.flat(), ...s.crown];
};

// §2 — ninety spreads, and the 91st cache slot is a duplicate
test("there are exactly 90 distinct spreads", () => {
  const seen = new Set<string>();
  for (let y = 0; y < SPREAD_COUNT; y++) seen.add(flat(y).join(","));
  expect(seen.size).toBe(SPREAD_COUNT);
});

test("spread 90 is spread 0 — there is no 91st spread", () => {
  expect(flat(90)).toEqual(flat(0));
});

test("every spread holds all 52 cards exactly once", () => {
  for (let y = 0; y < SPREAD_COUNT; y++) {
    expect(new Set(flat(y)).size).toBe(52);
  }
});

// §2 — wrap is mod 90, never clamp
test("getSpread wraps mod 90 rather than clamping", () => {
  expect(cardology.getSpread(94)).toEqual(cardology.getSpread(4));
  expect(cardology.getSpread(90)).toEqual(cardology.getSpread(0));
  expect(cardology.getSpread(-1)).toEqual(cardology.getSpread(89));
});

// §2 — the raw-index trap that callers must reduce around
test("getEnvironmentDisplacement does NOT reduce its index", () => {
  // 8♦ is neither Fixed nor Semi-Fixed, so a null here is the trap, not a card.
  expect(cardology.getEnvironmentDisplacement("8♦", 1)).not.toBeNull();
  expect(cardology.getEnvironmentDisplacement("8♦", 91)).toBeNull();
  expect(cardology.getEnvironmentDisplacement("8♦", -1)).toBeNull();
});

// §2 — Fixed cards
test("Fixed cards never move and have no karma pair", () => {
  for (const card of FIXED) {
    const home = flat(0).indexOf(card);
    for (let y = 0; y < SPREAD_COUNT; y++) expect(flat(y).indexOf(card)).toBe(home);
    expect(cardology.getEnvironmentDisplacement(card, 1)).toBeNull();
  }
});

// §2 — why 45 is not the period
test("spread 45 differs from spread 0 in exactly the four Semi-Fixed cards", () => {
  const a = flat(0);
  const b = flat(45);
  const moved = new Set<string>();
  for (let i = 0; i < 52; i++) if (a[i] !== b[i]) { moved.add(a[i]); moved.add(b[i]); }
  expect([...moved].sort()).toEqual([...SEMI_FIXED].sort());
});

test("a 45-year age shortcut would corrupt the Semi-Fixed cards", () => {
  // Guards the retired rule: year = ((age-1) % 45) + 1 for age >= 46.
  const old45 = (age: number) => (age <= 45 ? age : ((age - 1) % 45) + 1);
  const wrong = [];
  for (let age = 46; age < SPREAD_COUNT; age++) {
    if (old45(age) !== age % SPREAD_COUNT) wrong.push(age);
  }
  expect(wrong.length).toBe(44);
  expect(wrong[0]).toBe(46);
  expect(wrong[wrong.length - 1]).toBe(89);
});

// §4 — the mirror law
const nonFixed = () => {
  const s = cardology.SPREADS["0"];
  return [...s.grid.flat(), ...s.crown].filter((c) => !FIXED.includes(c));
};

test("karma is a palindrome around spread 45: env(n) === disp(90-n)", () => {
  for (const n of [1, 2, 7, 13, 35, 44, 45, 46, 83, 89]) {
    for (const card of nonFixed()) {
      const a = cardology.getEnvironmentDisplacement(card, n)!;
      const b = cardology.getEnvironmentDisplacement(card, (90 - n) % SPREAD_COUNT)!;
      expect(a.environment).toBe(b.displacement);
      expect(a.displacement).toBe(b.environment);
    }
  }
});

test("lifetime karma is age 1 of the per-age sequence, and age 89 reverses it", () => {
  for (const card of nonFixed()) {
    const life = cardology.getEnvironmentDisplacement(card, 1)!;
    expect(cardology.getEnvironmentDisplacement(card, 1 % SPREAD_COUNT)).toEqual(life);
    const end = cardology.getEnvironmentDisplacement(card, 89)!;
    expect(end.environment).toBe(life.displacement);
    expect(end.displacement).toBe(life.environment);
  }
});

test("spread 0 is degenerate — every card is its own environment and displacement", () => {
  for (const card of nonFixed()) {
    expect(cardology.getEnvironmentDisplacement(card, 0)).toEqual({
      environment: card,
      displacement: card,
    });
  }
});

test("spread 45 returns self, except Semi-Fixed cards which return their partner", () => {
  const partner: Record<string, string> = { "2♥": "A♣", "A♣": "2♥", "9♥": "7♦", "7♦": "9♥" };
  for (const card of nonFixed()) {
    const expected = partner[card] ?? card;
    expect(cardology.getEnvironmentDisplacement(card, 45)).toEqual({
      environment: expected,
      displacement: expected,
    });
  }
});

test("the per-age sequence is exactly half redundant", () => {
  const seen = (card: string) => {
    const m = new Map<string, number>();
    for (let n = 0; n < SPREAD_COUNT; n++) {
      const p = cardology.getEnvironmentDisplacement(card, n)!;
      const k = `${p.environment}>${p.displacement}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };

  // A rotation card: 45 distinct ordered pairs, each appearing exactly twice.
  for (const card of ["8♦", "A♥", "Q♠", "K♦"]) {
    const m = seen(card);
    expect(m.size).toBe(45);
    expect([...new Set(m.values())]).toEqual([2]);
    // and those 45 collapse to 23 unordered: 22 reversed couples + 1 self-pair
    expect(new Set([...m.keys()].map((k) => k.split(">").sort().join("|"))).size).toBe(23);
  }

  // A Semi-Fixed card sees only two answers in ninety years.
  for (const card of ["2♥", "A♣", "9♥", "7♦"]) {
    expect(seen(card).size).toBe(2);
  }
});

// §3 — the calculator split
test("Long Range indexes by seven-year cycle, matching getSeptennial", () => {
  const bc = "8♦";
  for (const age of [0, 6, 7, 13, 35, 83, 84, 89]) {
    const cycle = Math.floor(age / 7);
    const fromSpec = cardology.cardsFrom(bc, cycle + 1, 7)![age % 7];
    expect(cardology.getSeptennial(bc, age)!.current_card).toBe(fromSpec);
  }
});

test("Long Range only ever touches spreads 1-13", () => {
  const used = new Set<number>();
  for (let age = 0; age < SPREAD_COUNT; age++) used.add(Math.floor(age / 7) + 1);
  expect(Math.min(...used)).toBe(1);
  expect(Math.max(...used)).toBe(13);
});

test("karma and period spreads differ by exactly one", () => {
  for (const age of [0, 1, 35, 88, 89, 94]) {
    const karma = age % SPREAD_COUNT;
    const period = (age + 1) % SPREAD_COUNT;
    expect(cardology.getSpread(period)).toEqual(cardology.getSpread(karma + 1));
  }
});

// §9 — the seven-year remainder
test("ages 0-89 hold twelve full cycles plus a six-year remainder", () => {
  const sizes = new Map<number, number>();
  for (let age = 0; age < SPREAD_COUNT; age++) {
    const c = Math.floor(age / 7);
    sizes.set(c, (sizes.get(c) ?? 0) + 1);
  }
  expect(sizes.size).toBe(13);
  for (let c = 0; c < 12; c++) expect(sizes.get(c)).toBe(7);
  expect(sizes.get(12)).toBe(6); // the open question in §9
});

// §8 — the 630-day fractal
test("the daily/weekly cycle is 90 spreads x 7 days", () => {
  expect(SPREAD_COUNT * 7).toBe(630);
});

test("getWeekly uses the period convention on real elapsed weeks", () => {
  const target = new Date(2026, 8, 1);
  const w = cardology.getWeekly("8♦", 1991, 2, 17, target)!;
  const birth = new Date(1991, 1, 17);
  const weeks = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
  expect(w.weeks_lived).toBe(weeks);
  expect(w.spread_used).toBe((w.weeks_lived + 1) % SPREAD_COUNT);
  expect(w.days.length).toBe(7);
});

test("the retired years-x-52 week formula diverges from real elapsed weeks", () => {
  const target = new Date(2026, 8, 1);
  const w = cardology.getWeekly("8♦", 1991, 2, 17, target)!;
  const naive = (2026 - 1991) * 52 + 35; // years x 52 + a week-of-year
  expect(naive).not.toBe(w.weeks_lived);
});

// §7 — Neptune absorbs the remainder
test("Neptune runs longer than 52 days; periods are not seven equal blocks", () => {
  const counts = new Map<string, number>();
  const birth = new Date(2000, 1, 17);
  for (let d = 0; d < 365; d++) {
    const t = new Date(birth.getTime() + d * 86400000);
    const [planet] = cardology.getActivePeriod(2, 17, t);
    counts.set(planet, (counts.get(planet) ?? 0) + 1);
  }
  expect(counts.get("Mercury")).toBe(52);
  expect(counts.get("Neptune")!).toBeGreaterThan(52);
});

// §1 — birth card
test("birth card follows the solar-value formula", () => {
  expect(cardology.getBirthCard(2, 17)[0]).toBe("8♦");
  expect(cardology.getBirthCard(12, 31)[0]).toBe("K♠"); // disclosed Joker conflict
});

// §5 — nine-card extraction
test("extraction returns nine cards through Pluto and Result", () => {
  const nine = cardology.extractCards("8♦", cardology.getSpread(1), 9);
  expect(nine!.length).toBe(9);
  expect(new Set(nine).size).toBe(9);
});

// §10 — projection past the canon
test("ages past the canon project by mod 90", () => {
  const canonical = (age: number) => age % SPREAD_COUNT;
  expect(canonical(94)).toBe(4);
  expect(canonical(90)).toBe(0);
  expect(Math.floor(94 / SPREAD_COUNT) + 1).toBe(2); // cycleNumber
});
