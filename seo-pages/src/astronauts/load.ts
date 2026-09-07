import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { AstronautRow, CardMeaning, HeldAstronaut } from "./types";
import { reservedAstronautSlugReason } from "./urls";

export type AstronautsProvenance = {
  people_count: number;
  catalog_count: number;
  kept: number;
  excluded: number;
  exclusions: HeldAstronaut[];
};

export function loadAstronautRows(filePath: string): AstronautRow[] {
  const people: AstronautRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate astronaut slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadAstronautsProvenance(filePath: string): AstronautsProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_count: requiredNumber(raw, "catalog_count"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): AstronautRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: astronaut row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedAstronautSlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const nasaBirth = requiredString(raw, "nasa_birth_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== nasaBirth || birth !== wikidataBirth) {
    throw new Error(`Line ${line}: NASA and Wikidata birth dates must match`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    status: requiredString(raw, "status", line),
    group: requiredString(raw, "group", line),
    flights: requiredInt(raw, "flights", line),
    entry_year: requiredString(raw, "entry_year", line),
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    nasa_url: requiredString(raw, "nasa_url", line),
    nasa_birth_date: nasaBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function normalizeHeld(raw: unknown, index: number): HeldAstronaut {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || `held-${index}`,
    status: optionalString(raw, "status") || "Unknown",
    reason: requiredString(raw, "reason", index),
    nasa_birth: optionalNullableString(raw, "nasa_birth", index),
    wikidata_birth_date: optionalNullableString(raw, "wikidata_birth_date", index),
  };
}

function requiredString(raw: Record<string, unknown>, key: string, line: number): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Line ${line}: "${key}" must be a non-empty string`);
  }
  return value.trim();
}

function requiredInt(raw: Record<string, unknown>, key: string, line: number): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Line ${line}: "${key}" must be a non-negative integer`);
  }
  return value;
}

function requiredNumber(raw: Record<string, unknown>, key: string): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`"${key}" must be a number`);
  }
  return value;
}

function optionalString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
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

function optionalPlainString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
}
