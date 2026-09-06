import { readFileSync } from "node:fs";

import { SUITS, type Suit } from "./types";
import { parseIsoDate } from "./urls";
import { assertFranchiseSlug } from "./franchise-urls";
import type { Franchise, FranchiseCard, FranchiseSource } from "./franchise-types";

const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;

export function loadFranchisesJsonl(filePath: string): Franchise[] {
  const raw = readFileSync(filePath, "utf8");
  const franchises: Franchise[] = [];

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid franchise JSONL on line ${index + 1}`);
    }
    franchises.push(normalizeFranchise(parsed, index + 1));
  }

  const slugs = new Set<string>();
  for (const franchise of franchises) {
    if (slugs.has(franchise.slug)) {
      throw new Error(`Duplicate franchise slug: ${franchise.slug}`);
    }
    slugs.add(franchise.slug);
  }

  if (franchises.length !== 32) {
    throw new Error(`Expected 32 current NFL franchises, got ${franchises.length}`);
  }

  return franchises;
}

function normalizeFranchise(raw: unknown, line: number): Franchise {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: franchise must be an object`);
  }

  const slug = requiredString(raw, "slug", line);
  assertFranchiseSlug(slug);

  const grantDate = requiredString(raw, "grant_date", line);
  parseIsoDate(grantDate);

  const conference = requiredString(raw, "conference", line);
  if (conference !== "AFC" && conference !== "NFC") {
    throw new Error(`Line ${line}: conference must be AFC or NFC`);
  }
  const division = requiredString(raw, "division", line);
  if (!["East", "North", "South", "West"].includes(division)) {
    throw new Error(`Line ${line}: invalid division`);
  }

  const yearCrosscheck = requiredString(raw, "year_crosscheck", line);
  if (
    yearCrosscheck !== "year_mentioned" &&
    yearCrosscheck !== "grant_precedes_first_season" &&
    yearCrosscheck !== "wikipedia_lists_older_year"
  ) {
    throw new Error(`Line ${line}: invalid year_crosscheck`);
  }

  return {
    slug,
    name: requiredString(raw, "name", line),
    conference,
    division,
    grant_date: grantDate,
    grant_date_precision: "day",
    grant_date_status: "verified",
    hof_row_name: requiredString(raw, "hof_row_name", line),
    hof_franchise_date_raw: requiredString(raw, "hof_franchise_date_raw", line),
    hof_years_of_operation: requiredString(raw, "hof_years_of_operation", line),
    hof_league_mark: requiredLeagueMark(raw, line),
    hof_notes: optionalStringArray(raw, "hof_notes", line),
    wikipedia_first_season_label: requiredString(raw, "wikipedia_first_season_label", line),
    wikipedia_years: requiredNumberArray(raw, "wikipedia_years", line),
    year_crosscheck: yearCrosscheck,
    solar_value: requiredNumber(raw, "solar_value", line),
    card: normalizeFranchiseCard(raw.card, line),
    afl_1959_08_14_quintet: raw.afl_1959_08_14_quintet === true,
    same_card_slugs: optionalStringArray(raw, "same_card_slugs", line),
    same_grant_day_slugs: optionalStringArray(raw, "same_grant_day_slugs", line),
    sources: requiredSources(raw, line),
  };
}

function normalizeFranchiseCard(raw: unknown, line: number): FranchiseCard {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: card must be an object`);
  }
  if (raw.kind !== "card") {
    throw new Error(`Line ${line}: franchise card.kind must be "card"`);
  }
  const suit = requiredString(raw, "suit", line);
  if (!isSuit(suit)) {
    throw new Error(`Line ${line}: invalid suit`);
  }
  const slug = requiredString(raw, "slug", line);
  if (!CARD_SLUG_RE.test(slug)) {
    throw new Error(`Line ${line}: invalid card slug`);
  }
  return {
    kind: "card",
    rank: requiredString(raw, "rank", line),
    suit,
    label: requiredString(raw, "label", line),
    slug,
    archetype: requiredString(raw, "archetype", line),
    symbol: requiredString(raw, "symbol", line),
    meaning_page: requiredString(raw, "meaning_page", line),
    core_identity: requiredString(raw, "core_identity", line),
    sweet_spot: requiredString(raw, "sweet_spot", line),
    life_direction: requiredString(raw, "life_direction", line),
  };
}

function requiredLeagueMark(
  raw: Record<string, unknown>,
  line: number,
): "AFL" | "AAFC" | null {
  const value = raw.hof_league_mark;
  if (value === undefined || value === null) return null;
  if (value === "AFL" || value === "AAFC") return value;
  throw new Error(`Line ${line}: hof_league_mark must be AFL, AAFC, or null`);
}

function requiredSources(raw: Record<string, unknown>, line: number): FranchiseSource[] {
  const value = raw.sources;
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error(`Line ${line}: sources must have at least two entries`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: sources[${index}] must be an object`);
    }
    const role = requiredString(item, "role", line);
    if (role !== "primary_grant_date" && role !== "year_crosscheck_only") {
      throw new Error(`Line ${line}: sources[${index}] has an invalid role`);
    }
    return {
      name: requiredString(item, "name", line),
      url: requiredString(item, "url", line),
      role,
      retrieved: requiredString(item, "retrieved", line),
      license: optionalNullableString(item, "license", line) ?? undefined,
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

function requiredNumber(raw: Record<string, unknown>, key: string, line: number): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`Line ${line}: "${key}" must be an integer`);
  }
  return value;
}

function requiredNumberArray(raw: Record<string, unknown>, key: string, line: number): number[] {
  const value = raw[key];
  if (!Array.isArray(value) || value.length < 1 || !value.every((item) => typeof item === "number")) {
    throw new Error(`Line ${line}: "${key}" must be a non-empty number array`);
  }
  return value;
}

function optionalStringArray(raw: Record<string, unknown>, key: string, line: number): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim() !== "")) {
    throw new Error(`Line ${line}: "${key}" must be an array of strings`);
  }
  return value.map((item) => item.trim());
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

function isSuit(value: string): value is Suit {
  return (SUITS as readonly string[]).includes(value);
}
