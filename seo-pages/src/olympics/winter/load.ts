import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../../urls";
import type { CardMeaning, HeldWinterMedalist, WinterMedalistRow } from "./types";
import { reservedWinterSlugReason } from "./urls";

export type WinterProvenance = {
  people_count: number;
  catalog_list: number;
  catalog_rule: string;
  kept: number;
  excluded: number;
  exclusions: HeldWinterMedalist[];
};

export function loadWinterRows(filePath: string): WinterMedalistRow[] {
  const people: WinterMedalistRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate winter olympic slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadWinterProvenance(filePath: string): WinterProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_list: requiredNumber(raw, "catalog_list"),
    catalog_rule: optionalString(raw, "catalog_rule") || "Wikipedia 8+ Winter Olympic medalists",
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): WinterMedalistRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: winter medalist row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedWinterSlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const wikiBirth = requiredString(raw, "wikipedia_infobox_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== wikiBirth || birth !== wikidataBirth) {
    throw new Error(`Line ${line}: Wikipedia infobox and Wikidata birth dates must match`);
  }
  const gold = requiredInt(raw, "gold", line);
  const silver = requiredInt(raw, "silver", line);
  const bronze = requiredInt(raw, "bronze", line);
  const total = requiredInt(raw, "total", line);
  if (gold + silver + bronze !== total) {
    throw new Error(`Line ${line}: medal counts do not sum`);
  }
  if (total < 8) {
    throw new Error(`Line ${line}: catalog requires at least eight Winter Olympic medals`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    nation: requiredString(raw, "nation", line),
    sport: requiredString(raw, "sport", line),
    gold,
    silver,
    bronze,
    total,
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    wikipedia_list_url: requiredString(raw, "wikipedia_list_url", line),
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function normalizeHeld(raw: unknown, index: number): HeldWinterMedalist {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || undefined,
    wikipedia_title: optionalString(raw, "wikipedia_title") || undefined,
    nation: optionalString(raw, "nation") || undefined,
    sport: optionalString(raw, "sport") || undefined,
    reason: requiredString(raw, "reason", index),
    wikipedia_infobox_date: optionalNullableString(raw, "wikipedia_infobox_date", index),
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
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`Line ${line}: "${key}" must be an integer`);
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
