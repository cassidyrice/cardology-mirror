import { readFileSync } from "node:fs";

import { birthCardFromMonthDay } from "../birthcard";
import type {
  BornOnDayPage,
  BornOnDayRow,
  BornOnExclusion,
  BornOnPerson,
  BornOnProvenance,
  CardMeaning,
} from "./types";
import { isBornOnDaySlug } from "./urls";

export function loadBornOnPeople(filePath: string): BornOnPerson[] {
  const people: BornOnPerson[] = [];
  const qids = new Set<string>();
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const person = normalizePerson(JSON.parse(trimmed), index + 1);
    if (qids.has(person.qid)) {
      throw new Error(`Duplicate born-on QID: ${person.qid}`);
    }
    qids.add(person.qid);
    people.push(person);
  }
  return people;
}

export function loadBornOnDays(filePath: string): BornOnDayRow[] {
  const days: BornOnDayRow[] = [];
  const slugs = new Set<string>();
  for (const [index, line] of readFileSync(filePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const day = normalizeDay(JSON.parse(trimmed), index + 1);
    if (slugs.has(day.slug)) {
      throw new Error(`Duplicate born-on day slug: ${day.slug}`);
    }
    slugs.add(day.slug);
    days.push(day);
  }
  if (days.length !== 366) {
    throw new Error(`Expected 366 born-on days, got ${days.length}`);
  }
  return days;
}

export function loadBornOnProvenance(filePath: string): BornOnProvenance {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const empty = Array.isArray(raw.empty_slugs)
    ? raw.empty_slugs.map((item, index) => {
        if (typeof item !== "string" || !isBornOnDaySlug(item)) {
          throw new Error(`empty_slugs[${index}] must be a month-day slug`);
        }
        return item;
      })
    : [];
  return {
    kept: requiredNumber(raw, "kept"),
    excluded: requiredNumber(raw, "excluded"),
    harvest_dropped: requiredNumber(raw, "harvest_dropped"),
    days: requiredNumber(raw, "days"),
    days_with_people: requiredNumber(raw, "days_with_people"),
    days_empty: requiredNumber(raw, "days_empty"),
    empty_slugs: empty,
    catalog_by_reason: isRecord(raw.catalog_by_reason)
      ? Object.fromEntries(
          Object.entries(raw.catalog_by_reason).map(([key, value]) => {
            if (typeof value !== "number") {
              throw new Error(`catalog_by_reason.${key} must be a number`);
            }
            return [key, value];
          }),
        )
      : {},
    catalog_exclusions: Array.isArray(raw.catalog_exclusions)
      ? raw.catalog_exclusions.map((item, index) => normalizeExclusion(item, index))
      : [],
  };
}

export function loadCardMeanings(filePath: string): Map<string, CardMeaning> {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, CardMeaning>;
  return new Map(Object.entries(raw));
}

export function attachPeople(
  days: readonly BornOnDayRow[],
  people: readonly BornOnPerson[],
): BornOnDayPage[] {
  const byQid = new Map(people.map((person) => [person.qid, person]));
  return days.map((day) => {
    const members = day.qids.map((qid) => {
      const person = byQid.get(qid);
      if (!person) {
        throw new Error(`Day ${day.slug} references missing QID ${qid}`);
      }
      if (person.month !== day.month || person.day !== day.day) {
        throw new Error(`QID ${qid} is not on ${day.slug}`);
      }
      return person;
    });
    if (members.length !== day.people_count) {
      throw new Error(`Day ${day.slug} people_count ${day.people_count} != ${members.length}`);
    }
    return {
      ...day,
      cardRef: birthCardFromMonthDay(day.month, day.day),
      people: members,
    };
  });
}

function normalizePerson(raw: unknown, line: number): BornOnPerson {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: person row must be an object`);
  }
  const birth = requiredString(raw, "birth_date", line);
  const wikidataBirth = requiredString(raw, "wikidata_birth_date", line);
  if (birth !== wikidataBirth) {
    throw new Error(`Line ${line}: birth_date must match wikidata_birth_date (conflicts are dropped)`);
  }
  return {
    qid: requiredString(raw, "qid", line),
    name: requiredString(raw, "name", line),
    slug: requiredString(raw, "slug", line),
    birth_date: birth,
    wikidata_birth_date: wikidataBirth,
    card: requiredString(raw, "card", line),
    views: requiredNumber(raw, "views"),
    source_text: requiredString(raw, "source_text", line),
    source_url: requiredString(raw, "source_url", line),
    wikipedia_title: requiredString(raw, "wikipedia_title", line),
    month: requiredNumber(raw, "month"),
    day: requiredNumber(raw, "day"),
  };
}

function normalizeDay(raw: unknown, line: number): BornOnDayRow {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: day row must be an object`);
  }
  const slug = requiredString(raw, "slug", line);
  if (!isBornOnDaySlug(slug)) {
    throw new Error(`Line ${line}: slug must be {month}-{day}`);
  }
  const qids = Array.isArray(raw.qids)
    ? raw.qids.map((item, index) => {
        if (typeof item !== "string" || !/^Q[0-9A-Z]+$/.test(item)) {
          throw new Error(`Line ${line}: qids[${index}] must be a QID`);
        }
        return item;
      })
    : [];
  return {
    slug,
    month: requiredNumber(raw, "month"),
    day: requiredNumber(raw, "day"),
    label: requiredString(raw, "label", line),
    card: requiredString(raw, "card", line),
    people_count: requiredNumber(raw, "people_count"),
    qids,
  };
}

function normalizeExclusion(raw: unknown, index: number): BornOnExclusion {
  if (!isRecord(raw)) {
    throw new Error(`catalog_exclusions[${index}] must be an object`);
  }
  return {
    qid: optionalNullableString(raw, "qid"),
    name: optionalString(raw, "name") || "Unknown",
    reason: requiredString(raw, "reason", index),
    birth_date: optionalNullableString(raw, "birth_date"),
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

function optionalNullableString(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
