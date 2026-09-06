import { readFileSync } from "node:fs";

import { birthCardFromMonthDay } from "../birthcard";
import { parseIsoDate } from "../urls";
import {
  DATE_KINDS,
  TERRITORY_SLUGS,
  type DateKind,
  type StateAdmissionRow,
  type StatePage,
} from "./types";
import { assertStateSlug } from "./urls";

const EXPECTED_COUNT = 50;

export function loadStateRows(filePath: string): StateAdmissionRow[] {
  const raw = readFileSync(filePath, "utf8");
  const rows: StateAdmissionRow[] = [];

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid states JSONL on line ${index + 1}`);
    }
    rows.push(normalizeRow(parsed, index + 1));
  }

  if (rows.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} states, loaded ${rows.length}`);
  }

  const slugs = new Set<string>();
  const orders = new Set<number>();
  for (const row of rows) {
    if (slugs.has(row.slug)) {
      throw new Error(`Duplicate state slug: ${row.slug}`);
    }
    if (orders.has(row.admission_order)) {
      throw new Error(`Duplicate admission_order: ${row.admission_order}`);
    }
    slugs.add(row.slug);
    orders.add(row.admission_order);
    if ((TERRITORY_SLUGS as readonly string[]).includes(row.slug)) {
      throw new Error(`DC/territories are excluded: ${row.slug}`);
    }
  }

  return rows.sort((a, b) => a.admission_order - b.admission_order);
}

export function hydrateStates(rows: readonly StateAdmissionRow[]): StatePage[] {
  return rows.map((row) => {
    const { month, day } = parseIsoDate(row.admission_date);
    return {
      ...row,
      month,
      day,
      card: birthCardFromMonthDay(month, day),
    };
  });
}

export function loadStatePages(filePath: string): StatePage[] {
  return hydrateStates(loadStateRows(filePath));
}

function normalizeRow(raw: unknown, line: number): StateAdmissionRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: state must be an object`);
  }

  const slug = requiredString(raw, "slug", line);
  assertStateSlug(slug);
  const dateKind = requiredString(raw, "date_kind", line);
  if (!isDateKind(dateKind)) {
    throw new Error(`Line ${line}: date_kind must be ratification or admission`);
  }

  const originalThirteen = raw.original_thirteen;
  if (typeof originalThirteen !== "boolean") {
    throw new Error(`Line ${line}: original_thirteen must be a boolean`);
  }
  if (originalThirteen !== (dateKind === "ratification")) {
    throw new Error(
      `Line ${line}: original_thirteen must match date_kind (${dateKind})`,
    );
  }

  const admissionDate = requiredString(raw, "admission_date", line);
  parseIsoDate(admissionDate);

  const extras = optionalStringArray(raw, "wikidata_p571_extra", line);
  const p571 = requiredString(raw, "wikidata_p571_iso", line);
  if (p571 !== admissionDate) {
    throw new Error(
      `Line ${line}: wikidata_p571_iso must match admission_date (CRS is canonical)`,
    );
  }

  return {
    slug,
    name: requiredString(raw, "name", line),
    postal: requiredPostal(raw, line),
    admission_order: requiredOrder(raw, line),
    admission_date: admissionDate,
    date_kind: dateKind,
    original_thirteen: originalThirteen,
    wikipedia_list: requiredString(raw, "wikipedia_list", line),
    wikidata_qid: requiredQid(raw, line),
    wikidata_p571_iso: p571,
    wikidata_p571_extra: extras,
    disputed_date: optionalNullableString(raw, "disputed_date", line),
    crs_report: requiredString(raw, "crs_report", line),
    crs_table: requiredString(raw, "crs_table", line),
    crs_pdf: requiredString(raw, "crs_pdf", line),
    crs_html: requiredString(raw, "crs_html", line),
    wikipedia_list_url: requiredString(raw, "wikipedia_list_url", line),
  };
}

function requiredOrder(raw: Record<string, unknown>, line: number): number {
  const value = raw.admission_order;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 50) {
    throw new Error(`Line ${line}: admission_order must be an integer 1–50`);
  }
  return Number(value);
}

function requiredPostal(raw: Record<string, unknown>, line: number): string {
  const value = requiredString(raw, "postal", line);
  if (!/^[A-Z]{2}$/.test(value)) {
    throw new Error(`Line ${line}: postal must be a two-letter USPS code`);
  }
  return value;
}

function requiredQid(raw: Record<string, unknown>, line: number): string {
  const value = requiredString(raw, "wikidata_qid", line);
  if (!/^Q\d+$/.test(value)) {
    throw new Error(`Line ${line}: wikidata_qid must look like Q1393`);
  }
  return value;
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

function optionalStringArray(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Line ${line}: "${key}" must be an array of strings`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Line ${line}: ${key}[${index}] must be a non-empty string`);
    }
    return item.trim();
  });
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

function isDateKind(value: string): value is DateKind {
  return (DATE_KINDS as readonly string[]).includes(value);
}
