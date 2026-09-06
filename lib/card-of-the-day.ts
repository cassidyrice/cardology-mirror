import { unstable_cache } from "next/cache";

import { birthdateBySlug, type BirthdateSeo, type CardSeo } from "@/lib/seo-cards";

const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type CalendarDay = { year: number; month: number; day: number };

export type TodaysCardPayload = {
  dateKey: string;
  label: string;
  card: CardSeo | null;
  birthdate: BirthdateSeo | null;
};

/** Today's calendar date in America/Denver (same as /card-of-the-day). */
export function denverToday(): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function slugOf(d: CalendarDay): string {
  return `${MONTH_SLUGS[d.month - 1]}-${d.day}`;
}

export function labelOf(d: CalendarDay): string {
  return `${MONTH_NAMES[d.month - 1]} ${d.day}`;
}

function resolveTodaysCard(dateKey: string): TodaysCardPayload {
  const [y, m, day] = dateKey.split("-").map(Number);
  const d: CalendarDay = { year: y, month: m, day };
  const birthdate = birthdateBySlug(slugOf(d));
  return {
    dateKey,
    label: labelOf(d),
    card: birthdate?.card ?? null,
    birthdate,
  };
}

/**
 * Today's card, cached 24h and keyed on the Denver calendar date.
 * Same source as /card-of-the-day (birthdateBySlug of today's month-day).
 */
export async function getTodaysCardCached(): Promise<TodaysCardPayload> {
  const now = denverToday();
  const dateKey = `${now.year}-${String(now.month).padStart(2, "0")}-${String(now.day).padStart(2, "0")}`;
  return unstable_cache(
    async () => resolveTodaysCard(dateKey),
    ["todays-card", dateKey],
    { revalidate: 86_400 },
  )();
}
