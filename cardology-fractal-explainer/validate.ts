import assert from "node:assert/strict";
import cardology from "../lib/engine-core/engine.js";
import { resolvePublicBirth } from "../lib/birth-card-truth";
import { buildLifePathProfileForCard, buildPublicLifeSpread } from "../lib/life-path";

const original = cardology.getSpread(0);
const flatten = (spread: { grid: string[][]; crown: string[] }) => [...spread.grid.flat(), ...spread.crown];

assert.equal(cardology.P.length, 52, "permutation must contain 52 positions");
let flat = flatten(original);
for (let i = 0; i < 90; i++) flat = cardology.P.map((sourceIndex) => flat[sourceIndex]);
assert.deepEqual(flat, flatten(original), "P^90 must return the original spread");

const sample = cardology.getBirthCard(4, 7);
assert.equal(sample[1], 40, "April 7 should resolve to solar value 40");
assert.equal(sample[0], "A♠", "April 7 should resolve to A♠");
assert.deepEqual(resolvePublicBirth(12, 31), { kind: "joker", code: "Joker", solarValue: 0 });

const weekly = cardology.getWeekly("A♠", 1990, 4, 7, new Date("2026-08-05T12:00:00Z"));
assert.equal(weekly.days.length, 7, "weekly sequence must contain seven cards");

const septennial = cardology.getSeptennial("A♠", 35);
assert.equal(septennial.years.length, 7, "septennial sequence must contain seven years");

const lifeProfile = buildLifePathProfileForCard("A♠");
assert.ok(lifeProfile, "A♠ should have a life-path profile");
assert.equal(lifeProfile.pathCards.length, 13, "life-path profile must contain thirteen card positions");
const publicSpread = buildPublicLifeSpread("A♠");
assert.ok(publicSpread, "A♠ should have a public life spread");
assert.equal(publicSpread.positions.length, 10, "public spread should contain Moon plus Mercury through Result");

console.log(JSON.stringify({
  ok: true,
  permutationLength: cardology.P.length,
  permutationOrder: 90,
  birthCard: sample[0],
  joker: resolvePublicBirth(12, 31),
  weeklyCards: weekly.days.map((day) => day.card),
  septennialCards: septennial.years.map((year) => year.card),
  lifePathCards: lifeProfile.pathCards.length,
  publicLifeSpreadPositions: publicSpread.positions.length,
  note: "The repo exposes a 13-card Life Path and seven planetary positions; it does not expose a 13-year calculation.",
}, null, 2));
