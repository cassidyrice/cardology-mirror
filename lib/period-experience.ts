import type { AppEvent, AppPeriod, CardApp } from "./card-app";

/** Inclusive calendar dates from the engine, never the browser's timezone. */
export function periodProgress(period: AppPeriod, today: string) {
  const elapsed = Math.floor((Date.parse(today) - Date.parse(period.start)) / 86_400_000) + 1;
  const day = Math.max(0, Math.min(period.lengthDays, elapsed));
  return { day, total: period.lengthDays, percent: day / period.lengthDays * 100 };
}

export function eventsInPeriod(events: AppEvent[], period: AppPeriod) {
  return events.filter((event) => event.date <= period.end && (event.end ?? event.date) >= period.start);
}

export function eventPeriod(data: CardApp, event: AppEvent) {
  return data.year.periods.find((period) => event.date <= period.end && (event.end ?? event.date) >= period.start)?.index;
}
