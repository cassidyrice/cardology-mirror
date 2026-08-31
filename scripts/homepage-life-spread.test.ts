import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { lifeSpread } from "../lib/karma-origin";

const root = join(import.meta.dir, "..");
const art = readFileSync(join(root, "components/home/HomepageLifeSpread.tsx"), "utf8");

test("homepage life spread is spread 1: 3 crown + 7x7, 8♦ middle crown, no planet labels", () => {
  const spread = lifeSpread();
  expect(spread.crown).toEqual(["K♠", "8♦", "10♣"]);
  expect(spread.grid).toHaveLength(7);
  expect(spread.grid.every((row) => row.length === 7)).toBe(true);
  expect(art).toContain("lifeSpread()");
  expect(art).toContain("shareFacePathFromCode");
  expect(art).toContain("home-life-spread-crown");
  expect(art).toContain("home-life-spread-grid");
  expect(art).not.toContain("Mercury");
  expect(art).not.toContain("Venus");
  expect(art).not.toContain("PlayingCard");
  expect(art).toContain("birth card");
  expect(art).not.toContain('alt=""');
});
