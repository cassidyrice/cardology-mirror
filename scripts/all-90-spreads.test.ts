import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import PlayingCardSpreads from "@/app/playing-card-spreads/page";
import cardology from "../lib/engine-core/engine.js";

type Spread = { grid: string[][]; crown: string[] };
const SPREADS = (cardology as unknown as { SPREADS: Record<string, Spread> }).SPREADS;

const page = readFileSync(
  join(import.meta.dir, "..", "app", "playing-card-spreads", "page.tsx"),
  "utf8",
);

// The 90 boards are published on /playing-card-spreads (2026-09-15). They are
// engine output, never authored, so the guard is on the data and the wiring.
test("the engine holds 90 distinct, complete boards", () => {
  const seen = new Set<string>();
  for (let n = 0; n < 90; n += 1) {
    const spread = SPREADS[String(n)];
    expect(spread, `spread ${n} must exist`).toBeTruthy();
    expect(spread.grid).toHaveLength(7);
    for (const row of spread.grid) expect(row).toHaveLength(7);
    expect(spread.crown).toHaveLength(3);
    const cards = [...spread.grid.flat(), ...spread.crown];
    expect(cards).toHaveLength(52);
    expect(new Set(cards).size, `spread ${n} must be a full deck`).toBe(52);
    seen.add(JSON.stringify(spread));
  }
  expect(seen.size, "all 90 boards must be distinct").toBe(90);
});

test("the page renders all 90 from engine data, not authored copy", () => {
  expect(page).toContain("function AllYearlySpreads");
  expect(page).toContain("Array.from({ length: 90 }");
  expect(page).toContain("ENGINE_SPREADS[String(n)]");
  expect(page).toContain('id="all-90-spreads"');
  // Board 0 and 1 double as the two fixed boards; the labels must say so.
  expect(page).toContain("the Life Spread");
  expect(page).toContain("the Spirit Spread");
});

// One decade is visible until the reader picks an age. All 90 details stay
// in the HTML, and only the worked-example age starts open.
test("the yearly list opens one age without dumping every board", () => {
  expect(page).toContain(".year-boards .year-decade{display:none}");
  expect(page).toContain("#decade-30{display:block}");
  expect(page).toContain('id={`spread-${n}`}');
  expect(page).toContain("open={n === exampleAge}");

  const markup = renderToStaticMarkup(createElement(PlayingCardSpreads));
  const details = Array.from(markup.matchAll(/<details\b([^>]*)>/g), (match) => match[1] ?? "")
    .filter((attrs) => attrs.includes('id="spread-'));
  expect(details).toHaveLength(90);
  for (const age of [0, 1, 35, 89]) {
    expect(markup).toContain(`id="spread-${age}"`);
    expect(markup).toContain(`id="decade-${age < 10 ? 0 : age - (age % 10)}"`);
  }
  const opened = details.filter((attrs) => /(?:^|\s)open(?:\s|=|$)/.test(attrs));
  expect(opened).toHaveLength(1);
  expect(opened[0]).toContain('id="spread-35"');
  expect(markup).toContain('href="#decade-0"');
  expect(markup).toContain('href="#decade-80"');
  expect(markup).toContain(">Open spread</button>");
});

// BoardGrid's per-cell markup built a 1.7MB page at this volume. The compact
// renderer must stay in use for the 90-board list.
test("the 90-board list uses the compact renderer", () => {
  const start = page.indexOf("function AllYearlySpreads");
  const body = page.slice(start, page.indexOf("export default function", start));
  expect(body).toContain("<CompactBoard");
  expect(body).not.toContain("<BoardGrid");
});

// age N stands on board N (year-blueprint.ts: karma spread = age mod 90).
test("the age label matches the engine's spread-for-age rule", () => {
  expect(page).toContain("the board at age {n}");
  for (const age of [0, 1, 35, 89]) {
    expect(SPREADS[String(((age % 90) + 90) % 90)]).toBeTruthy();
  }
});
