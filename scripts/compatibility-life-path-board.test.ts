import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  LIFE_PATH_ROLES,
  buildLifePathProfile,
  compareLifePathProfiles,
} from "../lib/life-path";

const root = join(import.meta.dir, "..");
const source = readFileSync(
  join(root, "components", "seo", "CompatibilityCalculator.tsx"),
  "utf8",
);

test("Life Path board has 14 seats from the engine, not a hardcoded 13", () => {
  expect(LIFE_PATH_ROLES).toHaveLength(14);
  expect(source).toContain("active.allCards");
  expect(source).not.toMatch(/13-seat|13 seats/);
});

test("hit seat on A's board matches compareLifePathProfiles.aSeesB", () => {
  const a = buildLifePathProfile("1991-02-17", "First person");
  const b = buildLifePathProfile("1990-08-15", "Second person");
  expect(a).toBeTruthy();
  expect(b).toBeTruthy();
  if (!a || !b) return;
  const comparison = compareLifePathProfiles(a, b);
  const hit = a.allCards.find((seat) => seat.card === b.birthCard) ?? null;
  expect(hit?.position).toBe(comparison.aSeesB?.position);
  expect(a.allCards).toHaveLength(14);
});

test("compatibility result sells Deep Dive $9, not Blueprint $13", () => {
  expect(source).toContain("DeepDiveCta");
  expect(source).toContain('placement="compatibility-calculator-result"');
  expect(source).toContain('source="birth-card-compatibility-calculator"');
  expect(source).not.toContain("Get My Blueprint");
  expect(source).not.toContain("personal-card-blueprint");
  expect(source).not.toContain("instantReportBySlug");
  expect(source).not.toContain("personalCheckoutHref");
});
