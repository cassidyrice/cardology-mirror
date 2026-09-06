import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CabinetRow, CardMeaning, HeldCabinet } from "./types";
import { reservedCabinetSlugReason } from "./urls";

export type CabinetProvenance = {
  people_count: number;
  catalog_sitting: number;
  kept: number;
  excluded: number;
  exclusions: HeldCabinet[];
};

export function loadCabinetRows(filePath: string): CabinetRow[] {
  const people: CabinetRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate cabinet slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadCabinetProvenance(filePath: string): CabinetProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_sitting: requiredNumber(raw, "catalog_sitting"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): CabinetRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: cabinet officer must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedCabinetSlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match`);
  }
  if (typeof raw.acting !== "boolean") {
    throw new Error(`Line ${line}: acting must be a boolean`);
  }
  if (typeof raw.succession !== "number" || !Number.isInteger(raw.succession)) {
    throw new Error(`Line ${line}: succession must be an integer`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    office: requiredString(raw, "office", line),
    office_id: requiredString(raw, "office_id", line),
    acting: raw.acting,
    succession: raw.succession,
    birth_date: requiredString(raw, "birth_date", line),
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    wikipedia_infobox_date: requiredString(raw, "wikipedia_infobox_date", line),
    wikidata_birth_date: requiredString(raw, "wikidata_birth_date", line),
    dob_crosscheck: "match",
    whitehouse_url: requiredString(raw, "whitehouse_url", line),
  };
}

function normalizeHeld(raw: unknown, index: number): HeldCabinet {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || `held-${index}`,
    office: optionalString(raw, "office") || "Unknown",
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
