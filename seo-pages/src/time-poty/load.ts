import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldTimePoty, TimePotyHonor, TimePotyRow } from "./types";
import { reservedTimePotySlugReason } from "./urls";

export type TimePotyProvenance = {
  people_count: number;
  catalog_people: number;
  catalog_concepts: number;
  catalog_honor_years: number;
  kept: number;
  excluded: number;
  exclusions: HeldTimePoty[];
};

export function loadTimePotyRows(filePath: string): TimePotyRow[] {
  const people: TimePotyRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate TIME Person of the Year slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadTimePotyProvenance(filePath: string): TimePotyProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_people: requiredNumber(raw, "catalog_people"),
    catalog_concepts: requiredNumber(raw, "catalog_concepts"),
    catalog_honor_years: requiredNumber(raw, "catalog_honor_years"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): TimePotyRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: time-poty row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedTimePotySlugReason(slug) ?? reservedPersonSlugReason(slug);
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
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    wikipedia_list_url: requiredString(raw, "wikipedia_list_url", line),
    time_context_url: requiredString(raw, "time_context_url", line),
    honors: requiredHonors(raw, line),
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function requiredHonors(raw: Record<string, unknown>, line: number): TimePotyHonor[] {
  const value = raw.honors;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: honors must be a non-empty array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: honors[${index}] must be an object`);
    }
    return {
      year: requiredString(item, "year", line),
      choice_label: requiredString(item, "choice_label", line),
      shared: item.shared === true,
      wikipedia_list_url: requiredString(item, "wikipedia_list_url", line),
      time_context_url: requiredString(item, "time_context_url", line),
    };
  });
}

function normalizeHeld(raw: unknown, index: number): HeldTimePoty {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || `held-${index}`,
    wikipedia_title: optionalString(raw, "wikipedia_title") || "Unknown",
    reason: requiredString(raw, "reason", index),
    year: optionalNullableString(raw, "year", index),
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
