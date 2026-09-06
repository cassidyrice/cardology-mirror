import type { CardRef } from "../types";

export const DATE_KINDS = ["fixed"] as const;
export type HolidayDateKind = (typeof DATE_KINDS)[number];

export type HolidayRow = {
  slug: string;
  name: string;
  month: number;
  day: number;
  card: string;
  usc_citation: string;
  usc_url: string;
  opm_calendars_url: string;
  date_kind: HolidayDateKind;
  observed_shift: "ignored";
  /** Wikipedia article for this entity, used for the record section. */
  wikipedia_title?: string;
  source_url?: string;
  /** Wikipedia lead section (CC BY-SA 4.0), via pipeline.wikipedia_intro. */
  source_text_full?: string;
};

export type HolidayPage = HolidayRow & {
  cardRef: CardRef;
};

export const STATUTE_FIXED_HOLIDAYS = [
  { slug: "new-years-day", name: "New Year's Day", month: 1, day: 1 },
  { slug: "juneteenth", name: "Juneteenth National Independence Day", month: 6, day: 19 },
  { slug: "independence-day", name: "Independence Day", month: 7, day: 4 },
  { slug: "veterans-day", name: "Veterans Day", month: 11, day: 11 },
  { slug: "christmas-day", name: "Christmas Day", month: 12, day: 25 },
] as const;

export const FLOATING_HOLIDAY_SLUGS = [
  "martin-luther-king-jr-day",
  "washingtons-birthday",
  "presidents-day",
  "memorial-day",
  "labor-day",
  "columbus-day",
  "thanksgiving-day",
  "inauguration-day",
] as const;

export const USC_CITATION = "5 U.S.C. § 6103(a)";
export const USC_URL = "https://www.law.cornell.edu/uscode/text/5/6103";
export const OPM_CALENDARS_URL =
  "https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/";
