import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldHof, HofRow } from "./types";
import { reservedHofSlugReason } from "./urls";

export type HofProvenance = {
  people_count: number;
  catalog_count: number;
  kept: number;
  excluded: number;
  exclusions: HeldHof[];
};

export function loadHofRows(filePath: string): HofRow[] {
  const people: HofRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate nfl-hof slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadHofProvenance(filePath: string): HofProvenance {
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

function normalizeRow(raw: unknown, line: number): HofRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: nfl-hof row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedHofSlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== wikidataBirth) {
    throw new Error(`Line ${line}: Wikidata birth date must match birth_date`);
  }
  const wikiBirth = optionalNullableString(raw, "wikipedia_birth_date", line);
  const hofBirth = optionalNullableString(raw, "hof_birth_date", line);
  if (wikiBirth && wikiBirth !== birth) {
    throw new Error(`Line ${line}: Wikipedia birth date must match or be omitted`);
  }
  if (hofBirth && hofBirth !== birth) {
    throw new Error(`Line ${line}: HOF.com birth date must match or be omitted`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    hof_id: requiredString(raw, "hof_id", line),
    hof_url: requiredString(raw, "hof_url", line),
    induction_year: optionalNullableString(raw, "induction_year", line),
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    wikipedia_birth_date: wikiBirth,
    hof_birth_date: hofBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function normalizeHeld(raw: unknown, index: number): HeldHof {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || optionalString(raw, "hof_id") || `held-${index}`,
    hof_id: optionalString(raw, "hof_id") || "",
    reason: requiredString(raw, "reason", index),
    wikipedia_birth_date: optionalNullableString(raw, "wikipedia_birth_date", index),
    hof_birth_date: optionalNullableString(raw, "hof_birth_date", index),
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
