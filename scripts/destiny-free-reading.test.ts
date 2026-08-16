import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dir, "..", "app", "destiny-cards", "page.tsx"),
  "utf8",
);

test("destiny hub targets the free-reading query cluster", () => {
  expect(page).toContain('id="free-reading"');
  expect(page).toContain("Free destiny card reading");
  expect(page).toContain("Can I get a free destiny card reading?");
  expect(page).toContain("Personal Card Blueprint ($13)");
});
