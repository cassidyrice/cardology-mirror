import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldPulitzer, PulitzerAward, PulitzerOrgCrosscheck, PulitzerRow } from "./types";
import { reservedPulitzerSlugReason } from "./urls";

export type PulitzerProvenance = {
  people_count: number;
  catalog_winners: number;
  catalog_award_years: number;
  kept: number;
  excluded: number;
  exclusions: HeldPulitzer[];
  not_awarded: Array<{ year: string; reason: string }>;
};

const ORG_CROSSCHECKS = new Set<PulitzerOrgCrosscheck>(["match", "not_published", "unavailable"]);

export function loadPulitzerRows(filePath: string): PulitzerRow[] {
  const people: PulitzerRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate Pulitzer Fiction slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadPulitzerProvenance(filePath: string): PulitzerProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  const notAwarded = Array.isArray(raw.not_awarded)
    ? raw.not_awarded.map((item, index) => normalizeNotAwarded(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_winners: requiredNumber(raw, "catalog_winners"),
    catalog_award_years: requiredNumber(raw, "catalog_award_years"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
    not_awarded: notAwarded,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): PulitzerRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: pulitzer fiction row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedPulitzerSlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const orgCheck = requiredString(raw, "pulitzer_org_crosscheck", line);
  if (!ORG_CROSSCHECKS.has(orgCheck as PulitzerOrgCrosscheck)) {
    throw new Error(`Line ${line}: pulitzer_org_crosscheck must be match, not_published, or unavailable`);
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
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    pulitzer_url: requiredString(raw, "pulitzer_url", line),
    awards: requiredAwards(raw, line),
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
    pulitzer_org_birth_date: optionalNullableString(raw, "pulitzer_org_birth_date", line),
    pulitzer_org_crosscheck: orgCheck as PulitzerOrgCrosscheck,
  };
}

function requiredAwards(raw: Record<string, unknown>, line: number): PulitzerAward[] {
  const value = raw.awards;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: awards must be a non-empty array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: awards[${index}] must be an object`);
    }
    if (requiredString(item, "category_id", line) !== "fiction") {
      throw new Error(`Line ${line}: awards[${index}].category_id must be fiction`);
    }
    return {
      year: requiredString(item, "year", line),
      work: requiredString(item, "work", line),
      category: requiredString(item, "category", line),
      category_id: "fiction",
      pulitzer_url: requiredString(item, "pulitzer_url", line),
      shared: item.shared === true,
    };
  });
}

function normalizeHeld(raw: unknown, index: number): HeldPulitzer {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || `held-${index}`,
    wikipedia_title: optionalString(raw, "wikipedia_title") || "Unknown",
    reason: requiredString(raw, "reason", index),
    wikipedia_infobox_date: optionalNullableString(raw, "wikipedia_infobox_date", index),
    wikidata_birth_date: optionalNullableString(raw, "wikidata_birth_date", index),
  };
}

function normalizeNotAwarded(raw: unknown, index: number): { year: string; reason: string } {
  if (!isRecord(raw)) {
    throw new Error(`not_awarded[${index}] must be an object`);
  }
  return {
    year: requiredString(raw, "year", index),
    reason: requiredString(raw, "reason", index),
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
