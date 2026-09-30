import { describe, expect, test } from "bun:test";
import { buildCardApp } from "../lib/card-app";
import { eventPeriod, eventsInPeriod, periodProgress } from "../lib/period-experience";

describe("period experience calendar", () => {
  for (const birthday of ["1988-07-14", "1991-02-17", "1992-02-29", "1930-08-22", "1990-01-01"]) {
    test(`${birthday}: full year markers and period boundaries`, () => {
      const data = buildCardApp(birthday, "2026-09-30");
      expect(data.year.periods).toHaveLength(7);
      for (const period of data.year.periods) {
        expect(periodProgress(period, period.start).day).toBe(1);
        expect(periodProgress(period, period.end).day).toBe(period.lengthDays);
        expect(periodProgress(period, "1900-01-01").day).toBe(0);
        expect(periodProgress(period, "2100-01-01").percent).toBe(100);
        for (const marker of eventsInPeriod(data.year.events, period)) {
          expect(marker.date <= period.end && (marker.end ?? marker.date) >= period.start).toBe(true);
        }
      }
      for (const marker of data.year.events) {
        expect(marker.date >= data.year.start).toBe(true);
        expect((marker.end ?? marker.date) <= data.year.end).toBe(true);
        expect(eventPeriod(data, marker)).toBeDefined();
      }
      const shared = data.year.events.filter(e => e.date >= data.today);
      expect(shared).toEqual(data.events.filter(e => e.date <= data.year.end));
      expect(data.year.events.some(e => e.date < data.today)).toBe(true);
    });
  }
  test("birthday rollover selects the new Mercury chapter", () => {
    const before = buildCardApp("1988-07-14", "2026-07-13");
    const after = buildCardApp("1988-07-14", "2026-07-14");
    expect(before.year.current.index).toBe(6);
    expect(after.year.current.index).toBe(0);
    expect(periodProgress(after.year.current, after.today).day).toBe(1);
  });
});
