/** Reading Day schedule — simple constants until Cal.com is wired. */

export const READING_DAY_DATE = "2026-09-05";
export const READING_DAY_SLOTS_LEFT = 8;

/** Human label for the next Reading Day (America/Denver calendar). */
export const READING_DAY_LABEL = "Sat Sept 5";

function denverTodayIso(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** True when today's Denver date is after READING_DAY_DATE. */
export function isReadingDayPast(): boolean {
  return denverTodayIso() > READING_DAY_DATE;
}
