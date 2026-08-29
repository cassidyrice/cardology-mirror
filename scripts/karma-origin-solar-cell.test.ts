import { expect, test } from "bun:test";

import { cardology } from "../lib/engine-core/engine.js";
import {
  equationPreview,
  isFixedKarmaCard,
  lifeSpreadCell,
  lifetimeKarma,
  spiritSolarCell,
} from "../lib/karma-origin";

test("8♦ solar cell is a unique year-0 coordinate; karma matches golden", () => {
  const preview = equationPreview("1991-02-17");
  expect(preview?.card).toBe("8♦");
  expect(preview?.kind).toBe("card");
  const cell = spiritSolarCell("8♦");
  expect(cell).toBeTruthy();
  if (!cell) return;
  expect(cell.card).toBe("8♦");
  const spirit = cardology.SPREADS["0"];
  if (cell.kind === "grid") {
    expect(spirit.grid[cell.row][cell.col]).toBe("8♦");
  } else {
    expect(spirit.crown[cell.index]).toBe("8♦");
  }
  expect(lifetimeKarma("8♦")).toEqual({ environment: "7♣", displacement: "Q♠" });
  const envCell = lifeSpreadCell("7♣");
  expect(envCell).toBeTruthy();
});

test("Joker has no spirit solar cell", () => {
  expect(equationPreview("2000-12-31")?.kind).toBe("joker");
  expect(spiritSolarCell("Joker")).toBeNull();
  expect(lifetimeKarma("Joker")).toBeNull();
});

test("Fixed cards have no lifetime karma pair", () => {
  expect(isFixedKarmaCard("J♥")).toBe(true);
  expect(isFixedKarmaCard("8♣")).toBe(true);
  expect(isFixedKarmaCard("K♠")).toBe(true);
  expect(lifetimeKarma("J♥")).toBeNull();
  expect(lifetimeKarma("8♣")).toBeNull();
  expect(lifetimeKarma("K♠")).toBeNull();
});
