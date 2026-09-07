import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, HeldHouseChair, HouseChairRow, HouseParty, HouseRoleKind } from "./types";
import { reservedHouseChairSlugReason } from "./urls";

export type HouseChairsProvenance = {
  people_count: number;
  catalog_sitting: number;
  catalog_leadership: number;
  catalog_standing_chairs: number;
  kept: number;
  excluded: number;
  exclusions: HeldHouseChair[];
};

const PARTIES = new Set<HouseParty>(["Democrat", "Republican"]);
const ROLE_KINDS = new Set<HouseRoleKind>(["leadership", "chair"]);

export function loadHouseChairRows(filePath: string): HouseChairRow[] {
  const people: HouseChairRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate house-chairs slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadHouseChairsProvenance(filePath: string): HouseChairsProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_sitting: requiredNumber(raw, "catalog_sitting"),
    catalog_leadership: requiredNumber(raw, "catalog_leadership"),
    catalog_standing_chairs: requiredNumber(raw, "catalog_standing_chairs"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): HouseChairRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: house chair must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedHouseChairSlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match`);
  }
  const party = requiredString(raw, "party", line);
  if (!PARTIES.has(party as HouseParty)) {
    throw new Error(`Line ${line}: party must be Democrat or Republican`);
  }
  const roleKind = requiredString(raw, "role_kind", line);
  if (!ROLE_KINDS.has(roleKind as HouseRoleKind)) {
    throw new Error(`Line ${line}: role_kind must be leadership or chair`);
  }
  if (typeof raw.sort_order !== "number" || !Number.isInteger(raw.sort_order)) {
    throw new Error(`Line ${line}: sort_order must be an integer`);
  }
  if (typeof raw.district !== "number" || !Number.isInteger(raw.district)) {
    throw new Error(`Line ${line}: district must be an integer`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const wikiBirth = requiredString(raw, "wikipedia_infobox_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  const bioguideBirth = requiredString(raw, "bioguide_birth_date", line);
  if (birth !== wikiBirth || birth !== wikidataBirth || birth !== bioguideBirth) {
    throw new Error(`Line ${line}: Wikipedia infobox, Bioguide, and Wikidata birth dates must match`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug,
    office: requiredString(raw, "office", line),
    office_id: requiredString(raw, "office_id", line),
    role_kind: roleKind as HouseRoleKind,
    sort_order: raw.sort_order,
    party: party as HouseParty,
    state: requiredString(raw, "state", line),
    state_slug: requiredString(raw, "state_slug", line),
    postal: requiredString(raw, "postal", line),
    district: raw.district,
    bioguide: requiredString(raw, "bioguide", line),
    committee_thomas_id: optionalNullableString(raw, "committee_thomas_id", line),
    birth_date: birth,
    death_date: optionalNullableString(raw, "death_date", line),
    card: requiredString(raw, "card", line),
    source_text: requiredString(raw, "source_text", line),
    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    bioguide_birth_date: bioguideBirth,
    dob_crosscheck: "match",
    bioguide_url: requiredString(raw, "bioguide_url", line),
    congress_url: requiredString(raw, "congress_url", line),
    history_house_url: requiredString(raw, "history_house_url", line),
    house_gov_url: requiredString(raw, "house_gov_url", line),
  };
}

function normalizeHeld(raw: unknown, index: number): HeldHouseChair {
  if (!isRecord(raw)) {
    throw new Error(`exclusions[${index}] must be an object`);
  }
  return {
    name: optionalString(raw, "name") || "Unknown",
    slug: optionalString(raw, "slug") || `held-${index}`,
    office: optionalString(raw, "office") || "Unknown",
    reason: requiredString(raw, "reason", index),
    wikipedia_infobox_date: optionalNullableString(raw, "wikipedia_infobox_date", index),
    bioguide_birth_date: optionalNullableString(raw, "bioguide_birth_date", index),
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
