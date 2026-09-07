import { readFileSync } from "node:fs";

import { reservedPersonSlugReason } from "../urls";
import type { CardMeaning, GrammyAward, GrammyBand, GrammyRow, HeldGrammy } from "./types";
import { reservedGrammySlugReason } from "./urls";

export type GrammysProvenance = {
  people_count: number;
  catalog_ceremonies: number;
  catalog_billed_acts: number;
  kept: number;
  excluded: number;
  exclusions: HeldGrammy[];
  bands: GrammyBand[];
  various_artists: Array<{ year: string; album: string; reason: string }>;
};

export function loadGrammyRows(filePath: string): GrammyRow[] {
  const people: GrammyRow[] = [];
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    people.push(normalizeRow(JSON.parse(trimmed), index + 1));
  }
  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate Grammy slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }
  return people;
}

export function loadGrammysProvenance(filePath: string): GrammysProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((item, index) => normalizeHeld(item, index))
    : [];
  const bands = Array.isArray(raw.bands) ? raw.bands.map((item, index) => normalizeBand(item, index)) : [];
  const various = Array.isArray(raw.various_artists)
    ? raw.various_artists.map((item, index) => normalizeVarious(item, index))
    : [];
  return {
    people_count: requiredNumber(raw, "people_count"),
    catalog_ceremonies: requiredNumber(raw, "catalog_ceremonies"),
    catalog_billed_acts: requiredNumber(raw, "catalog_billed_acts"),
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    exclusions,
    bands,
    various_artists: various,
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

function normalizeRow(raw: unknown, line: number): GrammyRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: grammy row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  const reserved = reservedGrammySlugReason(slug) ?? reservedPersonSlugReason(slug);
  if (reserved) {
    throw new Error(`Line ${line}: ${reserved}`);
  }
  if (raw.dob_crosscheck !== "match") {
    throw new Error(`Line ${line}: dob_crosscheck must be match (conflicts are dropped)`);
  }
  const billing = requiredString(raw, "billing", line);
  if (billing !== "primary" && billing !== "band_member") {
    throw new Error(`Line ${line}: billing must be primary or band_member`);
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
    grammy_url: requiredString(raw, "grammy_url", line),
    billing,
    billed_act: requiredString(raw, "billed_act", line),
    awards: requiredAwards(raw, line),
    wikipedia_infobox_date: wikiBirth,
    wikidata_birth_date: wikidataBirth,
    dob_crosscheck: "match",
  };
}

function requiredAwards(raw: Record<string, unknown>, line: number): GrammyAward[] {
  const value = raw.awards;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Line ${line}: awards must be a non-empty array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: awards[${index}] must be an object`);
    }
    if (requiredString(item, "category_id", line) !== "album-of-the-year") {
      throw new Error(`Line ${line}: awards[${index}].category_id must be album-of-the-year`);
    }
    const ceremony = item.ceremony_number;
    if (typeof ceremony !== "number" || !Number.isInteger(ceremony) || ceremony < 1) {
      throw new Error(`Line ${line}: awards[${index}].ceremony_number must be a positive integer`);
    }
    return {
      year: requiredString(item, "year", line),
      ceremony_number: ceremony,
      album: requiredString(item, "album", line),
      grammy_url: requiredString(item, "grammy_url", line),
      billed_act: requiredString(item, "billed_act", line),
      category: requiredString(item, "category", line),
      category_id: "album-of-the-year",
    };
  });
}

function normalizeHeld(raw: unknown, index: number): HeldGrammy {
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

function normalizeBand(raw: unknown, index: number): GrammyBand {
  if (!isRecord(raw)) {
    throw new Error(`bands[${index}] must be an object`);
  }
  const action = optionalString(raw, "action");
  return {
    name: optionalString(raw, "name") || "Unknown",
    wikipedia_title: optionalString(raw, "wikipedia_title") || "Unknown",
    action: action === "omitted" ? "omitted" : "expanded",
    reason: requiredString(raw, "reason", index),
    members_kept: Array.isArray(raw.members_kept)
      ? raw.members_kept.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function normalizeVarious(
  raw: unknown,
  index: number,
): { year: string; album: string; reason: string } {
  if (!isRecord(raw)) {
    throw new Error(`various_artists[${index}] must be an object`);
  }
  return {
    year: requiredString(raw, "year", index),
    album: requiredString(raw, "album", index),
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

function optionalPlainString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
}
