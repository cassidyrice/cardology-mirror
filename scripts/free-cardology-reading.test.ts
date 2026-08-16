import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "what-is-cardology", "page.tsx"),
  "utf8",
);

test("what-is-cardology targets the free reading query without a new route", () => {
  expect(page).toContain('id="free-reading"');
  expect(page).toContain("Your free Cardology reading");
  expect(page).toContain("Can I get a free Cardology reading?");
  expect(page).toContain("no email is required");
  expect(page).toContain('href="/birth-card"');
  expect(page).toContain("Personal Card Blueprint ($13)");
});
