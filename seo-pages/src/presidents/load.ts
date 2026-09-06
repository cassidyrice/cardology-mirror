import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, PresidentRow } from "./types";

export function loadPresidentRows(filePath: string): PresidentRow[] {
  const people: PresidentRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate president slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): PresidentRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: president must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  const crosscheck = raw.dob_crosscheck;
  if (crosscheck !== "match" && crosscheck !== "mismatch" && crosscheck !== "missing") {
    throw new Error(`Line ${line}: dob_crosscheck must be match|mismatch|missing`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    birth_date: requiredString(raw, "birth_date", line),
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    terms: requiredTerms(raw, line),
    wikipedia_month_day: optionalNullableString(raw, "wikipedia_month_day", line),
    dob_crosscheck: crosscheck,
  };
}

function requiredTerms(raw: Record<string, unknown>, line: number): PresidentRow["terms"] {
  const value = raw.terms;
  if (!Array.isArray(value)) {
    throw new Error(`Line ${line}: terms must be an array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: terms[${index}] must be an object`);
    }
    return {
      ordinal: optionalNullableString(item, "ordinal", line),
      start: optionalNullableString(item, "start", line),
      end: optionalNullableString(item, "end", line),
    };
  });
}

function requiredString(raw: Record<string, unknown>, key: string, line: number): string {
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
