import { readFileSync } from "node:fs";

import { SUITS, type Suit } from "../types";
import { parseIsoDate } from "../urls";
import { assertMlbSlug } from "./urls";
import type { MlbCard, MlbClub, MlbSource } from "./types";

const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;

export function loadMlbJsonl(filePath: string): MlbClub[] {
  const raw = readFileSync(filePath, "utf8");
  const clubs: MlbClub[] = [];

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid MLB JSONL on line ${index + 1}`);
    }
    clubs.push(normalizeClub(parsed, index + 1));
  }

  const slugs = new Set<string>();
  for (const club of clubs) {
    if (slugs.has(club.slug)) {
      throw new Error(`Duplicate MLB slug: ${club.slug}`);
    }
    slugs.add(club.slug);
  }

  if (clubs.length !== 30) {
    throw new Error(`Expected 30 current MLB clubs, got ${clubs.length}`);
  }

  return clubs;
}

function normalizeClub(raw: unknown, line: number): MlbClub {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: MLB club must be an object`);
  }

  const slug = requiredString(raw, "slug", line);
  assertMlbSlug(slug);

  const firstGame = requiredString(raw, "first_game", line);
  parseIsoDate(firstGame);

  const league = requiredString(raw, "league", line);
  if (league !== "AL" && league !== "NL") {
    throw new Error(`Line ${line}: league must be AL or NL`);
  }
  const division = requiredString(raw, "division", line);
  if (!["East", "Central", "West"].includes(division)) {
    throw new Error(`Line ${line}: invalid division`);
  }

  const yearCrosscheck = requiredString(raw, "year_crosscheck", line);
  if (
    yearCrosscheck !== "year_mentioned" &&
    yearCrosscheck !== "first_game_precedes_wikipedia_join" &&
    yearCrosscheck !== "wikipedia_lists_older_year"
  ) {
    throw new Error(`Line ${line}: invalid year_crosscheck`);
  }

  return {
    slug,
    name: requiredString(raw, "name", line),
    league,
    division,
    first_game: firstGame,
    first_game_precision: "day",
    first_game_status: "verified",
    first_season_name: requiredString(raw, "first_season_name", line),
    first_game_line: requiredString(raw, "first_game_line", line),
    bbref_code: requiredString(raw, "bbref_code", line),
    bbref_first_season_code: requiredString(raw, "bbref_first_season_code", line),
    bbref_first_season_url: requiredString(raw, "bbref_first_season_url", line),
    bbref_franchise_url: requiredString(raw, "bbref_franchise_url", line),
    retrosheet_url: requiredString(raw, "retrosheet_url", line),
    notes: optionalStringArray(raw, "notes", line),
    wikipedia_first_season_label: requiredString(raw, "wikipedia_first_season_label", line),
    wikipedia_years: requiredNumberArray(raw, "wikipedia_years", line),
    year_crosscheck: yearCrosscheck,
    solar_value: requiredNumber(raw, "solar_value", line),
    card: normalizeMlbCard(raw.card, line),
    expansion_1969_04_08_quartet: raw.expansion_1969_04_08_quartet === true,
    aa_1882_05_02_trio: raw.aa_1882_05_02_trio === true,
    same_card_slugs: optionalStringArray(raw, "same_card_slugs", line),
    same_first_game_day_slugs: optionalStringArray(raw, "same_first_game_day_slugs", line),
    sources: requiredSources(raw, line),
  };
}

function normalizeMlbCard(raw: unknown, line: number): MlbCard {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: card must be an object`);
  }
  if (raw.kind !== "card") {
    throw new Error(`Line ${line}: MLB card.kind must be "card"`);
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

function requiredSources(raw: Record<string, unknown>, line: number): MlbSource[] {
  const value = raw.sources;
  if (!Array.isArray(value) || value.length < 3) {
    throw new Error(`Line ${line}: sources must have at least three entries`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: sources[${index}] must be an object`);
    }
    const role = requiredString(item, "role", line);
    if (
      role !== "primary_first_game" &&
      role !== "game_log_corroboration" &&
      role !== "year_crosscheck_only"
    ) {
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
