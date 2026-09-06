import { readFileSync } from "node:fs";

import type { CardMeaning, TonyCategory, TonyRow, TonyWin, TonysProvenance } from "./types";
import { reservedTonySlugReason } from "./urls";

const CATEGORIES = new Set<TonyCategory>([
  "actor_play",
  "actress_play",
  "actor_musical",
  "actress_musical",
]);

export function loadTonyRows(filePath: string): TonyRow[] {
  const people: TonyRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate Tony slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadTonysProvenance(filePath: string): TonysProvenance {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as TonysProvenance;
  } catch {
    return {};
  }
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): TonyRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: tony row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedTonySlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  const crosscheck = raw.dob_crosscheck;
  if (crosscheck !== "match" && crosscheck !== "wikidata_only") {
    throw new Error(`Line ${line}: dob_crosscheck must be match or wikidata_only`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== wikidataBirth) {
    throw new Error(`Line ${line}: birth_date must match Wikidata P569`);
  }
  const wikipediaBirth = optionalNullableString(raw, "wikipedia_birth_date", line);
  if (crosscheck === "match") {
    if (wikipediaBirth !== birth) {
      throw new Error(`Line ${line}: Wikipedia and Wikidata birth dates must match`);
    }
  } else if (wikipediaBirth !== null) {
    throw new Error(`Line ${line}: wikidata_only rows must not invent a Wikipedia day`);
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
    tony_url: requiredString(raw, "tony_url", line),
    wins: requiredWins(raw, line),
    wikipedia_birth_date: wikipediaBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: crosscheck,
  };
}

function requiredWins(raw: Record<string, unknown>, line: number): TonyWin[] {
  const value = raw.wins;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: wins must be a non-empty array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: wins[${index}] must be an object`);
    }
    const category = requiredString(item, "category", line);
    if (!CATEGORIES.has(category as TonyCategory)) {
      throw new Error(`Line ${line}: wins[${index}] category is out of leading-acting scope`);
    }
    return {
      year: requiredString(item, "year", line),
      category: category as TonyCategory,
      category_label: requiredString(item, "category_label", line),
      category_full: requiredString(item, "category_full", line),
      production: optionalString(item, "production", line),
      role: optionalString(item, "role", line),
      wikipedia_list_url: requiredString(item, "wikipedia_list_url", line),
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

function optionalString(raw: Record<string, unknown>, key: string, line: number): string {
  const value = raw[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new Error(`Line ${line}: "${key}" must be a string`);
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
