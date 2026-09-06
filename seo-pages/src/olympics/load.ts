import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldOlympian, OlympicMedal, OlympicRow } from "./types";
import { reservedOlympicsSlugReason } from "./urls";

export type OlympicsProvenance = {
  people_count: number;
  catalog_count: number;
  kept: number;
  excluded: number;
  by_reason: Record<string, number>;
  exclusions: HeldOlympian[];
};

export function loadOlympicsRows(filePath: string): OlympicRow[] {
  const people: OlympicRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate olympics slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadOlympicsProvenance(filePath: string): OlympicsProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  const byReason = isRecord(raw.by_reason) ? numberMap(raw.by_reason) : {};
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_count: requiredNumber(raw, "catalog_count"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    by_reason: byReason,
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): OlympicRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: olympics row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedOlympicsSlugReason(slug) ?? reservedPersonSlugReason(slug);
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
  if (typeof raw.gold_count !== "number" || !Number.isInteger(raw.gold_count) || raw.gold_count < 2) {
    throw new Error(`Line ${line}: gold_count must be an integer >= 2`);
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
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
    gold_count: raw.gold_count,
    sports: requiredStringArray(raw, "sports", line),
    country: optionalString(raw, "country"),
    medals: requiredMedals(raw, line),
  };
}

function normalizeHeld(raw: unknown, index: number): HeldOlympian {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    qid: optionalString(raw, "qid") || "",
    reason: requiredString(raw, "reason", index),
    wikipedia_infobox_date: optionalNullableString(raw, "wikipedia_infobox_date", index),
    wikidata_birth_date: optionalNullableString(raw, "wikidata_birth_date", index),
  };
}

function requiredMedals(raw: Record<string, unknown>, line: number): OlympicMedal[] {
  const value = raw.medals;
  if (!Array.isArray(value)) {
    throw new Error(`Line ${line}: medals must be an array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: medals[${index}] must be an object`);
    }
    return {
      year: optionalString(item, "year"),
      games: optionalString(item, "games"),
      event: requiredString(item, "event", line),
      sport: optionalString(item, "sport"),
      event_qid: requiredString(item, "event_qid", line),
    };
  });
}

function requiredStringArray(raw: Record<string, unknown>, key: string, line: number): string[] {
  const value = raw[key];
  if (!Array.isArray(value)) {
    throw new Error(`Line ${line}: "${key}" must be an array`);
  }
  return value
    .map((item, index) => {
      if (typeof item !== "string" || item.trim() === "") {
        throw new Error(`Line ${line}: ${key}[${index}] must be a non-empty string`);
      }
      return item.trim();
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

function numberMap(raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
