import { readFileSync } from "node:fs";

import type { CardMeaning, ScotusRole, ScotusRow } from "./types";
import { reservedScotusSlugReason } from "./urls";

const ROLES = new Set<ScotusRole>(["Chief Justice of the United States", "Associate Justice"]);

export function loadScotusRows(filePath: string): ScotusRow[] {
  const people: ScotusRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate SCOTUS slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): ScotusRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: scotus row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedScotusSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const scotusBirth = requiredString(raw, "scotus_birth_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== scotusBirth || birth !== wikidataBirth) {
    throw new Error(`Line ${line}: SCOTUS.gov and Wikidata birth dates must match`);
  }
  const role = requiredString(raw, "role", line);
  if (!isRole(role)) {
    throw new Error(`Line ${line}: role must be Chief Justice of the United States or Associate Justice`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    role,
    seniority: requiredInt(raw, "seniority", line),
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    scotus_url: requiredString(raw, "scotus_url", line),
    scotus_birth_date: scotusBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function isRole(value: string): value is ScotusRole {
  return ROLES.has(value as ScotusRole);
}

function requiredInt(raw: Record<string, unknown>, key: string, line: number): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`Line ${line}: "${key}" must be a positive integer`);
  }
  return value;
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
