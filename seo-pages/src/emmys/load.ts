import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, EmmyProvenance, EmmyRow, EmmyWin } from "./types";
import { reservedEmmySlugReason } from "./urls";

export function loadEmmyRows(filePath: string): EmmyRow[] {
  const people: EmmyRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate Emmy slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadEmmyProvenance(filePath: string): EmmyProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_wins: requiredNumber(raw, "catalog_wins"),
    catalog_people: requiredNumber(raw, "catalog_people"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    by_reason: isRecord(raw.by_reason)
      ? Object.fromEntries(
          Object.entries(raw.by_reason).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
        )
      : {},
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): EmmyRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: emmy row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedEmmySlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const wikiBirth = requiredString(raw, "wikipedia_birth_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== wikiBirth || birth !== wikidataBirth) {
    throw new Error(`Line ${line}: Wikipedia and Wikidata birth dates must match`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    emmys_url: requiredString(raw, "emmys_url", line),
    wins: requiredWins(raw, line),
    wikipedia_birth_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function requiredWins(raw: Record<string, unknown>, line: number): EmmyWin[] {
  const value = raw.wins;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: wins must be a non-empty array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: wins[${index}] must be an object`);
    }
    const acting = requiredString(item, "acting", line);
    if (acting !== "actor" && acting !== "actress") {
      throw new Error(`Line ${line}: wins[${index}].acting must be actor or actress`);
    }
    return {
      year: requiredString(item, "year", line),
      category_id: requiredString(item, "category_id", line),
      label: requiredString(item, "label", line),
      category_full: requiredString(item, "category_full", line),
      genre: requiredString(item, "genre", line),
      acting,
      program: optionalNullableString(item, "program", line),
      role: optionalNullableString(item, "role", line),
      list_url: requiredString(item, "list_url", line),
      performance_note: optionalNullableString(item, "performance_note", line),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
