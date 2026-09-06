import { readFileSync } from "node:fs";

import { birthCardFromMonthDay } from "../birthcard";
import { parseIsoDate } from "../urls";
import {
  PRIOR_KINDS,
  type ParkPage,
  type ParkRow,
  type PriorDesignation,
  type PriorKind,
} from "./types";
import { assertParkSlug } from "./urls";

const EXPECTED_COUNT = 63;

export function loadParkRows(filePath: string): ParkRow[] {
  const raw = readFileSync(filePath, "utf8");
  const rows: ParkRow[] = [];

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid parks JSONL on line ${index + 1}`);
    }
    rows.push(normalizeRow(parsed, index + 1));
  }

  if (rows.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} parks, loaded ${rows.length}`);
  }

  const slugs = new Set<string>();
  const orders = new Set<number>();
  for (const row of rows) {
    if (slugs.has(row.slug)) {
      throw new Error(`Duplicate park slug: ${row.slug}`);
    }
    if (orders.has(row.established_order)) {
      throw new Error(`Duplicate established_order: ${row.established_order}`);
    }
    slugs.add(row.slug);
    orders.add(row.established_order);
  }

  return rows.sort((a, b) => a.established_order - b.established_order);
}

export function hydrateParks(rows: readonly ParkRow[]): ParkPage[] {
  return rows.map((row) => {
    const { month, day } = parseIsoDate(row.established_date);
    return {
      ...row,
      month,
      day,
      card: birthCardFromMonthDay(month, day),
    };
  });
}

export function loadParkPages(filePath: string): ParkPage[] {
  return hydrateParks(loadParkRows(filePath));
}

function normalizeRow(raw: unknown, line: number): ParkRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: park must be an object`);
  }

  const slug = requiredString(raw, "slug", line);
  assertParkSlug(slug);

  const dateKind = requiredString(raw, "date_kind", line);
  if (dateKind !== "national_park") {
    throw new Error(`Line ${line}: date_kind must be national_park`);
  }

  const establishedDate = requiredString(raw, "established_date", line);
  parseIsoDate(establishedDate);

  return {
    slug,
    name: requiredString(raw, "name", line),
    official_name: requiredString(raw, "official_name", line),
    established_order: requiredOrder(raw, line),
    established_date: establishedDate,
    date_kind: "national_park",
    locations: requiredStringArray(raw, "locations", line),
    wikipedia_list: requiredString(raw, "wikipedia_list", line),
    wikipedia_list_url: requiredString(raw, "wikipedia_list_url", line),
    wikipedia_list_column: requiredString(raw, "wikipedia_list_column", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    wikipedia_retrieved: requiredString(raw, "wikipedia_retrieved", line),
    nps_anniversaries_url: requiredString(raw, "nps_anniversaries_url", line),
    nps_anniversaries_retrieved: requiredString(raw, "nps_anniversaries_retrieved", line),
    prior_designation: optionalPrior(raw, line),
    date_note: optionalNullableString(raw, "date_note", line),
    source_url: optionalPlainString(raw, "source_url") || undefined,
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
  };
}

function requiredOrder(raw: Record<string, unknown>, line: number): number {
  const value = raw.established_order;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 63) {
    throw new Error(`Line ${line}: established_order must be an integer 1–63`);
  }
  return Number(value);
}

function requiredStringArray(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): string[] {
  const value = raw[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: "${key}" must be a non-empty array of strings`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Line ${line}: ${key}[${index}] must be a non-empty string`);
    }
    return item.trim();
  });
}

function optionalPrior(raw: Record<string, unknown>, line: number): PriorDesignation | null {
  const value = raw.prior_designation;
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) {
    throw new Error(`Line ${line}: prior_designation must be an object or null`);
  }
  const kind = requiredString(value, "kind", line);
  if (!isPriorKind(kind)) {
    throw new Error(`Line ${line}: prior_designation.kind is not recognized`);
  }
  const date = requiredString(value, "date", line);
  const precision = requiredString(value, "date_precision", line);
  if (precision !== "day" && precision !== "year") {
    throw new Error(`Line ${line}: prior_designation.date_precision must be day or year`);
  }
  if (precision === "day") {
    parseIsoDate(date);
  } else if (!/^\d{4}$/.test(date)) {
    throw new Error(`Line ${line}: year-precision prior date must be YYYY`);
  }
  const source = requiredString(value, "source", line);
  if (source !== "nps_park_anniversaries") {
    throw new Error(`Line ${line}: prior_designation.source must be nps_park_anniversaries`);
  }
  return {
    kind,
    date,
    date_precision: precision,
    label: requiredString(value, "label", line),
    source,
    source_url: requiredString(value, "source_url", line),
  };
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

function optionalNullableString(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): string | null {
  const value = raw[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Line ${line}: "${key}" must be a string or null`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPriorKind(value: string): value is PriorKind {
  return (PRIOR_KINDS as readonly string[]).includes(value);
}

function optionalPlainString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
}
