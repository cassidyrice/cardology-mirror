import { readFileSync } from "node:fs";

import { SUITS, type CardRef, type EnrichedPerson, type FaqItem, type Suit } from "./types";
import { assertPersonSlug, parseIsoDate } from "./urls";

const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;

export function loadPeopleJsonl(filePath: string): EnrichedPerson[] {
  const raw = readFileSync(filePath, "utf8");
  const people: EnrichedPerson[] = [];

  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid JSONL on line ${index + 1}`);
    }
    people.push(normalizePerson(parsed, index + 1));
  }

  const slugs = new Set<string>();
  for (const person of people) {
    if (slugs.has(person.slug)) {
      throw new Error(`Duplicate person slug: ${person.slug}`);
    }
    slugs.add(person.slug);
  }

  return people;
}

function normalizePerson(raw: unknown, line: number): EnrichedPerson {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: person must be an object`);
  }

  const slug = requiredString(raw, "slug", line);
  assertPersonSlug(slug);

  const name = requiredString(raw, "name", line);
  const birthDate = requiredString(raw, "birth_date", line);
  parseIsoDate(birthDate);

  const hook = requiredString(raw, "hook", line);
  const cardMeaning = requiredString(raw, "card_meaning", line);
  const evidence = requiredStringArray(raw, "evidence", line, 3);
  const faqs = requiredFaqs(raw, line, 3);
  const sameCard = optionalStringArray(raw, "same_card_slugs", line);
  const sameDay = optionalStringArray(raw, "same_day_slugs", line);
  const ogImageSlot = requiredString(raw, "og_image_slot", line);

  if (raw.example !== true) {
    throw new Error(
      `Line ${line}: WP4 fixtures and unknown rows must set "example": true until WP3 enrichment lands`,
    );
  }

  return {
    example: true,
    slug,
    name,
    birth_date: birthDate,
    card: normalizeCard(raw.card, line),
    hook,
    card_meaning: cardMeaning,
    evidence,
    same_card_slugs: sameCard,
    same_day_slugs: sameDay,
    faqs,
    og_image_slot: ogImageSlot,
    wikidata_qid: optionalNullableString(raw, "wikidata_qid", line),
    wikipedia_title: optionalNullableString(raw, "wikipedia_title", line),
  };
}

function normalizeCard(raw: unknown, line: number): CardRef {
  if (!isRecord(raw)) {
    throw new Error(`Line ${line}: card must be an object`);
  }

  const kind = raw.kind;
  const archetype = requiredString(raw, "archetype", line);

  if (kind === "joker") {
    return {
      kind: "joker",
      rank: "joker",
      suit: null,
      label: "Joker",
      slug: "joker",
      archetype,
    };
  }

  if (kind === "card") {
    const rank = requiredString(raw, "rank", line);
    const suit = requiredString(raw, "suit", line);
    if (!isSuit(suit)) {
      throw new Error(`Line ${line}: invalid suit "${suit}"`);
    }
    const label = requiredString(raw, "label", line);
    const slug = requiredString(raw, "slug", line);
    if (!CARD_SLUG_RE.test(slug)) {
      throw new Error(`Line ${line}: invalid card slug "${slug}"`);
    }
    return { kind: "card", rank, suit, label, slug, archetype };
  }

  throw new Error(`Line ${line}: card.kind must be "card" or "joker"`);
}

function requiredFaqs(raw: Record<string, unknown>, line: number, min: number): FaqItem[] {
  const value = raw.faqs;
  if (!Array.isArray(value) || value.length < min) {
    throw new Error(`Line ${line}: faqs must be an array of at least ${min}`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Line ${line}: faqs[${index}] must be an object`);
    }
    return {
      question: requiredString(item, "question", line),
      answer: requiredString(item, "answer", line),
    };
  });
}

function requiredString(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Line ${line}: "${key}" must be a non-empty string`);
  }
  return value.trim();
}

function requiredStringArray(
  raw: Record<string, unknown>,
  key: string,
  line: number,
  min: number,
): string[] {
  const value = raw[key];
  if (!Array.isArray(value) || value.length < min) {
    throw new Error(`Line ${line}: "${key}" must be an array of at least ${min} strings`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Line ${line}: ${key}[${index}] must be a non-empty string`);
    }
    return item.trim();
  });
}

function optionalStringArray(
  raw: Record<string, unknown>,
  key: string,
  line: number,
): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Line ${line}: "${key}" must be an array of strings`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Line ${line}: ${key}[${index}] must be a non-empty string`);
    }
    return item.trim();
  });
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
