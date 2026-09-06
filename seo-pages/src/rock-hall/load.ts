import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldRockHall, RockHallInduction, RockHallRow } from "./types";
import { reservedRockHallSlugReason } from "./urls";

export type RockHallProvenance = {
  people_count: number;
  catalog_acts: number;
  catalog_solo_acts: number;
  catalog_group_acts: number;
  catalog_listed_members: number;
  kept: number;
  kept_solo: number;
  kept_member: number;
  excluded: number;
  exclusions: HeldRockHall[];
};

export function loadRockHallRows(filePath: string): RockHallRow[] {
  const people: RockHallRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate Rock Hall slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadRockHallProvenance(filePath: string): RockHallProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_acts: requiredNumber(raw, "catalog_acts"),
    catalog_solo_acts: requiredNumber(raw, "catalog_solo_acts"),
    catalog_group_acts: requiredNumber(raw, "catalog_group_acts"),
    catalog_listed_members: requiredNumber(raw, "catalog_listed_members"),
    kept: requiredNumber(raw, "kept"),
    kept_solo: requiredNumber(raw, "kept_solo"),
    kept_member: requiredNumber(raw, "kept_member"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): RockHallRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: rock-hall row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedRockHallSlugReason(slug) ?? reservedPersonSlugReason(slug);
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
  const primaryRole = requiredString(raw, "primary_role", line);
  if (primaryRole !== "solo" && primaryRole !== "member") {
    throw new Error(`Line ${line}: primary_role must be solo or member`);
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
    rockhall_url: requiredString(raw, "rockhall_url", line),
    wikipedia_list_url: requiredString(raw, "wikipedia_list_url", line),
    primary_role: primaryRole,
    inductions: requiredInductions(raw, line),
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function requiredInductions(raw: Record<string, unknown>, line: number): RockHallInduction[] {
  const value = raw.inductions;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: inductions must be a non-empty array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: inductions[${index}] must be an object`);
    }
    const role = requiredString(item, "role", line);
    if (role !== "solo" && role !== "member") {
      throw new Error(`Line ${line}: inductions[${index}].role must be solo or member`);
    }
    const categoryId = requiredString(item, "category_id", line);
    if (categoryId !== "performers") {
      throw new Error(`Line ${line}: inductions[${index}].category_id must be performers`);
    }
    return {
      year: requiredString(item, "year", line),
      act: requiredString(item, "act", line),
      act_wikipedia_title: requiredString(item, "act_wikipedia_title", line),
      category: requiredString(item, "category", line),
      category_id: "performers",
      role,
      rockhall_url: requiredString(item, "rockhall_url", line),
    };
  });
}

function normalizeHeld(raw: unknown, index: number): HeldRockHall {
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
