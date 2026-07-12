import assert from "node:assert/strict";

import { compareReadings } from "../components/bonds/compare";
import { publicBirthCardCode } from "../lib/birth-card-truth";
import { allBirthdateSeo, allCardSeo, birthDatesForCard, cardBySlug } from "../lib/seo-cards";

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let checked = 0;
for (let month = 1; month <= 12; month += 1) {
  for (let day = 1; day <= DAYS[month - 1]; day += 1) {
    const card = publicBirthCardCode(month, day);
    assert.ok(card && card !== "Unknown", `${month}/${day} has no public card`);
    checked += 1;
  }
}
assert.equal(checked, 366);
assert.equal(publicBirthCardCode(12, 31), "Joker");
assert.equal(publicBirthCardCode(1, 1), "K♠");

// The Worker owns the one Joker birthday page. The 52 standard card pages in
// this app must therefore reverse-map the other 365 dates exactly once.
const dates = allBirthdateSeo();
assert.equal(dates.length, 365);
assert.equal(new Set(dates.map((date) => `${date.month}/${date.day}`)).size, 365);

const kingOfSpades = cardBySlug("king-of-spades");
assert.ok(kingOfSpades);
assert.deepEqual(
  birthDatesForCard(kingOfSpades).map((date) => date.label),
  ["January 1"],
);

const description = {
  title: "The Test Card",
  core_identity: "Test identity.",
  gifts: "- Shared gift",
  shadow: "Shared shadow.",
  life_direction: "Shared direction.",
  algorithm_gateway: "Shared practice.",
};

for (const card of allCardSeo()) {
  const reading = {
    archetype: {
      birth_card: card.code,
      description,
    },
  };
  const result = compareReadings(
    { name: "Alice", reading } as never,
    { name: "Bob", reading } as never,
  );
  const copy = result.observations.map((item) => item.text).join(" ");
  assert.doesNotMatch(copy, /Alice tends to carry the heavier charge/i, card.code);
  assert.match(copy, /pressure is shared/i, card.code);
}

console.log("PASS: 366 birthdays, reverse card dates, and 52 same-card comparisons");
