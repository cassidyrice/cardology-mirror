import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildReading } from "../lib/reading";
import {
  buildTimingMapModel,
  TIMING_MAP_SLUG,
  TimingMapJokerError,
} from "../lib/timing-map/model";
import {
  renderTimingMapJokerSvg,
  renderTimingMapSvg,
} from "../lib/timing-map/render";
import { PLANET_ORDER } from "../lib/types";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const TODAY = new Date(2026, 8, 7); // 2026-09-07 local

test("model: seven periods tile the year and match the engine's 52-day cards", () => {
  const m = buildTimingMapModel("1990-01-15", TODAY);
  const r = buildReading("1990-01-15", "2026-09-07");
  expect(m.periods).toHaveLength(7);
  expect(m.periods.map((p) => p.planet)).toEqual(PLANET_ORDER);
  for (const p of m.periods) {
    expect(p.card).toBe(r.birth_card_spread.periods[p.planet]);
  }
  expect(m.periods[0].startDay).toBe(0);
  expect(m.periods[6].endDay).toBe(m.yearDays);
  expect(m.periods.reduce((s, p) => s + p.days, 0)).toBe(m.yearDays);
  expect(m.yearDays === 365 || m.yearDays === 366).toBe(true);
  expect(m.cycleStartISO).toBe("2026-01-15");
  expect(m.cycleEndISO).toBe("2027-01-14");
  expect(m.periods[0].startISO).toBe("2026-01-15");
  expect(m.periods[6].lastISO).toBe("2027-01-14");
  expect(m.birthCard).toBe(r.archetype.birth_card);
  expect(m.activePlanet).toBe(r.active_period.planet);
  expect(m.periods.filter((p) => p.active)).toHaveLength(1);
  expect(m.todayDay).toBeGreaterThanOrEqual(0);
  expect(m.todayDay).toBeLessThan(m.yearDays);
  expect(m.satellites.map((s) => s.key)).toEqual([
    "long-range",
    "pluto",
    "result",
    "environment",
    "displacement",
  ]);
  expect(m.satellites[1].card).toBe(r.birth_card_spread.pluto);
  expect(m.satellites[2].card).toBe(r.birth_card_spread.result);
  expect(m.satellites[0].card).toBe(r.long_range.bc.card);
});

test("model: a birthday later this year opens last year's cycle", () => {
  const m = buildTimingMapModel("1988-11-20", TODAY);
  expect(m.cycleStartISO).toBe("2025-11-20");
  expect(m.cycleEndISO).toBe("2026-11-19");
});

test("model: the three Fixed cards get empty environment/displacement slots", () => {
  // Find one Fixed-card birthday (J♥, 8♣, K♠) by scanning the year.
  let found: string | null = null;
  for (let month = 1; month <= 12 && !found; month++) {
    for (let day = 1; day <= 28 && !found; day++) {
      const iso = `1990-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const r = buildReading(iso, "2026-09-07");
      if (r.karma.bc_lifetime === null) found = iso;
    }
  }
  expect(found).not.toBeNull();
  const m = buildTimingMapModel(found!, TODAY);
  expect(m.fixedCard).toBe(true);
  expect(m.satellites[3].card).toBeNull();
  expect(m.satellites[4].card).toBeNull();
  const svg = renderTimingMapSvg(m);
  expect(svg).toContain("Fixed card · no environment");
  expect(svg).toContain('stroke-dasharray="4 3"'); // empty card slot
});

test("model: Dec 31 (Joker) throws a typed error and has a Joker sheet", () => {
  expect(() => buildTimingMapModel("1990-12-31", TODAY)).toThrow(TimingMapJokerError);
  const svg = renderTimingMapJokerSvg("1990-12-31");
  expect(svg).toContain("December 31 is the Joker.");
  expect(svg).not.toContain("NOW ·");
});

test("render: standalone brand-themed SVG with all seven sectors, hub, bus and title block", () => {
  const m = buildTimingMapModel("1990-01-15", TODAY);
  const svg = renderTimingMapSvg(m);
  expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('viewBox="0 0 1600 1131"');
  for (const planet of PLANET_ORDER) expect(svg).toContain(planet.toUpperCase());
  expect(svg).toContain("Yearly Timing Map");
  expect(svg).toContain("BIRTH CARD");
  expect(svg).toContain("FIXED FOR THE YEAR");
  expect(svg).toContain("NOW · SEP 7");
  expect(svg).toContain("READING THE SHEET");
  expect(svg).toContain("CARDBLUEPRINTS.COM");
  expect(svg).toContain("#f6f1e8"); // paper
  expect(svg).toContain("#8e321f"); // oxblood
  expect(svg).toContain("#b8893d"); // gold
  // Standalone: no external images, scripts or stylesheets.
  expect(svg).not.toContain("<image");
  expect(svg).not.toContain("<script");
  expect(svg).not.toContain("href=");
  // Every period card is drawn.
  for (const p of m.periods) expect(svg).toContain(`>${p.card.slice(-1)}</text>`);
  // The NOW tick sits inside the active sector's arc.
  const deg = (m.todayDay + 0.5) * (360 / m.yearDays);
  const active = m.periods.find((p) => p.active)!;
  expect(deg).toBeGreaterThanOrEqual(active.startDay * (360 / m.yearDays));
  expect(deg).toBeLessThan(active.endDay * (360 / m.yearDays));
  expect(svg).not.toContain("undefined");
  expect(svg).not.toContain("NaN");
  // Well-formed XML (browsers refuse to render an SVG with a parse error).
  const lint = Bun.spawnSync(["xmllint", "--noout", "-"], { stdin: Buffer.from(svg) });
  if (lint.exitCode !== 127) {
    expect(lint.exitCode).toBe(0);
    expect(new TextDecoder().decode(lint.stderr)).toBe("");
  }
  const jokerLint = Bun.spawnSync(["xmllint", "--noout", "-"], { stdin: Buffer.from(renderTimingMapJokerSvg("1990-12-31")) });
  if (jokerLint.exitCode !== 127) expect(jokerLint.exitCode).toBe(0);
});

test("fulfillment: the map is a report-token route wired into webhook and success page", () => {
  expect(TIMING_MAP_SLUG).toBe("yearly-timing-map");
  const route = read("app/api/timing-map/route.ts");
  expect(route).toContain("verifyReportToken");
  expect(route).toContain('runtime = "edge"');
  expect(route).toContain("image/svg+xml");
  expect(route).toContain("no-store");
  const webhook = read("app/api/checkout/webhook/route.ts");
  expect(webhook).toContain("mintReportToken");
  expect(webhook).toContain("TIMING_MAP_SLUG");
  const success = read("app/checkout/success/page.tsx");
  expect(success).toContain("TIMING_MAP_SLUG");
  expect(success).toContain("/api/timing-map?token=");
});
