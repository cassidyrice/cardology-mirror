import { expect, test } from "bun:test";

import { currentPeriodFor } from "../lib/current-period";

test("Feb 17 1991 on 2026-08-30 is Jupiter, 2 of Spades", () => {
  const period = currentPeriodFor("1991-02-17", "2026-08-30");
  expect(period).toEqual({
    planet: "Jupiter",
    card: "2♠",
    cardLabel: "2 of Spades",
  });
});

test("Joker / Dec 31 has no 52-day stretch", () => {
  expect(currentPeriodFor("1990-12-31", "2026-08-30")).toBeNull();
});
