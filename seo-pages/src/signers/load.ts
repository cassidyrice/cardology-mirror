import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldSigner, SignerRow, YearOnlySigner } from "./types";

export type SignersProvenance = {
  people_count: number;
  verified_count: number;
  year_only_count: number;
  contested_count: number;
  held: HeldSigner[];
  year_only: YearOnlySigner[];
};

export function loadSignerRows(filePath: string): SignerRow[] {
  const people: SignerRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate signer slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadSignersProvenance(filePath: string): SignersProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const held = Array.isArray(raw.held) ? raw.held.map((item, index) => normalizeHeld(item, index)) : [];
  const yearOnly = Array.isArray(raw.year_only)
    ? raw.year_only.map((item, index) => normalizeYearOnly(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    verified_count: requiredNumber(raw, "verified_count"),
    year_only_count: requiredNumber(raw, "year_only_count"),
    contested_count: requiredNumber(raw, "contested_count"),
    held,
    year_only: yearOnly,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): SignerRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: signer must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  const crosscheck = raw.dob_crosscheck;
  if (
    crosscheck !== "match" &&
    crosscheck !== "mismatch" &&
    crosscheck !== "new_style" &&
    crosscheck !== "missing"
  ) {
    throw new Error(`Line ${line}: dob_crosscheck must be match|mismatch|new_style|missing`);
  }
  const calendar = raw.calendar_note;
  if (calendar !== "new_style" && calendar !== "nara_day") {
    throw new Error(`Line ${line}: calendar_note must be new_style|nara_day`);
  }
  const qa = raw.wikidata_qa;
  if (qa !== "match" && qa !== "mismatch" && qa !== "missing" && qa !== "year_only") {
    throw new Error(`Line ${line}: wikidata_qa must be match|mismatch|missing|year_only`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    colony: requiredString(raw, "colony", line),
    colony_code: requiredString(raw, "colony_code", line),
    birth_date: requiredString(raw, "birth_date", line),
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    bioguide_id: requiredString(raw, "bioguide_id", line),
    nara_birth_raw: requiredString(raw, "nara_birth_raw", line),
    wikipedia_birth: optionalNullableString(raw, "wikipedia_birth", line),
    dob_crosscheck: crosscheck,
    calendar_note: calendar,
    footnote: optionalNullableString(raw, "footnote", line),
    wikidata_date: optionalNullableString(raw, "wikidata_date", line),
    wikidata_precision: optionalNullableNumber(raw, "wikidata_precision", line),
    wikidata_qa: qa,
  };
}

function normalizeHeld(raw: unknown, index: number): HeldSigner {
  if (!isRecord(raw)) {
    throw new Error(`held[${index}] must be an object`);
  }
  return {
    name: requiredString(raw, "name", index),
    slug: requiredString(raw, "slug", index),
    reason: requiredString(raw, "reason", index),
    nara_birth_raw: requiredString(raw, "nara_birth_raw", index),
    wikipedia_birth: optionalNullableString(raw, "wikipedia_birth", index),
    footnote: requiredString(raw, "footnote", index),
  };
}

function normalizeYearOnly(raw: unknown, index: number): YearOnlySigner {
  if (!isRecord(raw)) {
    throw new Error(`year_only[${index}] must be an object`);
  }
  return {
    name: requiredString(raw, "name", index),
    slug: requiredString(raw, "slug", index),
    nara_birth_raw: requiredString(raw, "nara_birth_raw", index),
    footnote: requiredString(raw, "footnote", index),
  };
}

function requiredString(raw: Record<string, unknown>, key: string, line: number): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Line ${line}: "${key}" must be a non-empty string`);
  }
  return value.trim();
}

function requiredNumber(raw: Record<string, unknown>, key: string): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`"${key}" must be a number`);
  }
  return value;
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

function optionalNullableNumber(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): number | null {
  const value = raw[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Line ${line}: "${key}" must be a number or null`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
