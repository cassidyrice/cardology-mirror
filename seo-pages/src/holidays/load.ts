import { readFileSync } from "node:fs";

import { birthCardCode, birthCardFromMonthDay } from "../birthcard";
import {
  DATE_KINDS,
  FLOATING_HOLIDAY_SLUGS,
  OPM_CALENDARS_URL,
  STATUTE_FIXED_HOLIDAYS,
  USC_CITATION,
  USC_URL,
  type HolidayDateKind,
  type HolidayPage,
  type HolidayRow,
} from "./types";
import { assertHolidaySlug } from "./urls";

const EXPECTED_COUNT = STATUTE_FIXED_HOLIDAYS.length;

export function loadHolidayRows(filePath: string): HolidayRow[] {
  const raw = readFileSync(filePath, "utf8");
  const rows: HolidayRow[] = [];

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid holidays JSONL on line ${index + 1}`);
    }
    rows.push(normalizeRow(parsed, index + 1));
  }

  if (rows.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} fixed holidays, loaded ${rows.length}`);
  }

  const slugs = new Set<string>();
  for (const [index, row] of rows.entries()) {
    if (slugs.has(row.slug)) {
      throw new Error(`Duplicate holiday slug: ${row.slug}`);
    }
    slugs.add(row.slug);
    if ((FLOATING_HOLIDAY_SLUGS as readonly string[]).includes(row.slug)) {
      throw new Error(`Floating holidays are excluded: ${row.slug}`);
    }
    const expected = STATUTE_FIXED_HOLIDAYS[index];
    if (!expected) {
      throw new Error(`Unexpected holiday row at index ${index}`);
    }
    if (
      row.slug !== expected.slug ||
      row.name !== expected.name ||
      row.month !== expected.month ||
      row.day !== expected.day
    ) {
      throw new Error(
        `Line ${index + 1}: holiday must match 5 U.S.C. § 6103(a) lock (${expected.slug})`,
      );
    }
    if (row.card !== birthCardCode(row.month, row.day)) {
      throw new Error(
        `Line ${index + 1}: card ${row.card} does not match birthcard.ts for ${row.month}-${row.day}`,
      );
    }
  }

  return rows;
}

export function hydrateHolidays(rows: readonly HolidayRow[]): HolidayPage[] {
  return rows.map((row) => ({
    ...row,
    cardRef: birthCardFromMonthDay(row.month, row.day),
  }));
}

export function loadHolidayPages(filePath: string): HolidayPage[] {
  return hydrateHolidays(loadHolidayRows(filePath));
}

function normalizeRow(raw: unknown, line: number): HolidayRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: holiday must be an object`);
  }

  const slug = requiredString(raw, "slug", line);
  assertHolidaySlug(slug);

  const dateKind = requiredString(raw, "date_kind", line);
  if (!isDateKind(dateKind)) {
    throw new Error(`Line ${line}: date_kind must be "fixed"`);
  }

  const month = requiredMonthDay(raw, "month", line, 1, 12);
  const day = requiredMonthDay(raw, "day", line, 1, 31);
  if (month === 12 && day === 31) {
    throw new Error(`Line ${line}: December 31 is not a § 6103(a) fixed holiday`);
  }

  const observed = requiredString(raw, "observed_shift", line);
  if (observed !== "ignored") {
    throw new Error(`Line ${line}: observed_shift must be "ignored"`);
  }

  const citation = requiredString(raw, "usc_citation", line);
  if (citation !== USC_CITATION) {
    throw new Error(`Line ${line}: usc_citation must be ${USC_CITATION}`);
  }
  const uscUrl = requiredString(raw, "usc_url", line);
  if (uscUrl !== USC_URL) {
    throw new Error(`Line ${line}: usc_url must be the Cornell LII § 6103 page`);
  }
  const opmUrl = requiredString(raw, "opm_calendars_url", line);
  if (opmUrl !== OPM_CALENDARS_URL) {
    throw new Error(`Line ${line}: opm_calendars_url must be the OPM holidays page`);
  }

  return {
    slug,
    name: requiredString(raw, "name", line),
    month,
    day,
    card: requiredString(raw, "card", line),
    usc_citation: citation,
    usc_url: uscUrl,
    opm_calendars_url: opmUrl,
    date_kind: dateKind,
    observed_shift: "ignored",
    wikipedia_title: optionalPlainString(raw, "wikipedia_title") || undefined,
    source_url: optionalPlainString(raw, "source_url") || undefined,
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
  };
}

function requiredMonthDay(
  raw: Record<string, unknown>,
  key: string,
  line: number,
  min: number,
  max: number,
): number {
  const value = raw[key];
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new Error(`Line ${line}: ${key} must be an integer ${min}–${max}`);
  }
  return Number(value);
}

function requiredString(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Line ${line}: "${key}" must be a non-empty string`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDateKind(value: string): value is HolidayDateKind {
  return (DATE_KINDS as readonly string[]).includes(value);
}

function optionalPlainString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
}
