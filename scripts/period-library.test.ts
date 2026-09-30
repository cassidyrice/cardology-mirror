import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { cardology } from "../lib/engine-core/engine.js";
import { buildCardApp } from "../lib/card-app";
import { appReadingLibrary, PERIOD_ARTIFACTS, YEARLY_ARTIFACTS } from "../lib/period-library";
import { PeriodAppView } from "../components/card-app/PeriodApp";

describe("completed static writing library", () => {
  test("exact card and planet pairs are individually authored", () => {
    expect(PERIOD_ARTIFACTS).toHaveLength(364);
    expect(new Set(PERIOD_ARTIFACTS.map((entry) => entry.id)).size).toBe(364);
    expect(new Set(PERIOD_ARTIFACTS.map((entry) => entry.longReading.join("\n"))).size).toBe(364);
    expect(YEARLY_ARTIFACTS).toHaveLength(260);
    expect(new Set(YEARLY_ARTIFACTS.map((entry) => entry.id)).size).toBe(260);
  });

  test("every birth card receives seven matching readings and only its actual yearly positions", () => {
    const birthdays = new Map<string, string>();
    for (let month = 1; month <= 12; month++) for (let day = 1; day <= 31; day++) {
      const [card] = cardology.getBirthCard(month, day);
      const iso = `1988-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const date = new Date(`${iso}T12:00:00Z`);
      if (date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day || card === "Joker") continue;
      if (!birthdays.has(card)) birthdays.set(card, iso);
    }
    expect(birthdays.size).toBe(52);
    for (const birthdate of birthdays.values()) {
      const app = buildCardApp(birthdate, "2026-09-30");
      const copy = appReadingLibrary(app);
      expect(copy.periods).toHaveLength(7);
      app.year.periods.forEach((period, i) => {
        expect(copy.periods[i].cardCode).toBe(period.birth.card.code);
        expect(copy.periods[i].planet).toBe(period.planet);
      });
      expect(copy.year["Long Range"]?.cardCode).toBe(app.year.birth.longRange.card.code);
      expect(copy.year.Pluto?.cardCode).toBe(app.year.birth.pluto.card.code);
      expect(copy.year.Result?.cardCode).toBe(app.year.birth.result.card.code);
      expect(copy.year.Environment?.cardCode).toBe(app.year.environment?.card.code);
      expect(copy.year.Displacement?.cardCode).toBe(app.year.displacement?.card.code);
      expect(JSON.stringify(copy)).not.toContain(birthdate);
    }
  });

  test("reopening before and after birthday, leap-day and age-cycle boundaries uses fresh assignments", () => {
    for (const [birthdate, targets] of [
      ["1988-07-14", ["2026-07-13", "2026-07-14", "2027-07-14"]],
      ["1992-02-29", ["2027-02-28", "2027-03-01", "2028-02-29"]],
      ["1936-09-30", ["2026-09-29", "2026-09-30", "2026-10-01"]],
    ] as const) {
      for (const date of targets) {
        const app = buildCardApp(birthdate, date);
        const copy = appReadingLibrary(app);
        const current = copy.periods[app.year.current.index];
        expect(current.cardCode).toBe(app.year.current.birth.card.code);
        expect(current.planet).toBe(app.year.current.planet);
        expect(copy).toEqual(appReadingLibrary(buildCardApp(birthdate, date)));
      }
    }
  });

  test("render includes the selected reading, native expandable body and accurate actual dates", () => {
    const data = buildCardApp("1988-07-14", "2026-09-30");
    const readings = appReadingLibrary(data);
    const selected = readings.periods[data.year.current.index];
    const html = renderToStaticMarkup(createElement(PeriodAppView, { data, readings, token: "local-test-token" }));
    expect(html).toContain(selected.title);
    expect(html).toContain("Read the full period");
    expect(html).toContain(data.year.current.startLabel);
    expect(html).toContain(data.year.current.endLabel);
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html).not.toContain("the August report");
    expect(html).not.toContain("the card bible");
  });

  test("complete corpus stays out of the client component and existing access and original app remain", () => {
    const client = readFileSync("components/card-app/PeriodApp.tsx", "utf8");
    expect(client).toContain('import type { AppReadingLibrary');
    expect(client).not.toContain('from "@/lib/period-library"');
    expect(client).not.toContain("content/period-library");
    expect(client).toContain("<CardAppView");
    const route = readFileSync("app/blueprint/page.tsx", "utf8");
    expect(route.indexOf("verifyReportToken")).toBeLessThan(route.indexOf("appReadingLibrary(app)"));
    const products = readFileSync("lib/products.ts", "utf8");
    expect(products).toContain("CARD_APP_ON_SALE = false");
  });
});
