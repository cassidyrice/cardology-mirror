import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "52-card-astrology-explained", "page.tsx"),
  "utf8",
);
const whatIs = readFileSync(
  join(import.meta.dir, "..", "app", "what-is-cardology", "page.tsx"),
  "utf8",
);

test("52-card page carries a dedicated Cardology calendar section", () => {
  expect(page).toContain('id="calendar"');
  expect(page).toContain("The Cardology calendar");
  expect(page).toContain("52 cards for 52 weeks");
  expect(page).toContain("sums to 364");
  expect(page).toContain("What is the Cardology calendar?");
});

test("what-is-cardology links the calendar section with exact anchor", () => {
  expect(whatIs).toContain('/52-card-astrology-explained#calendar');
  expect(whatIs).toContain("Cardology calendar");
});
