import { solarValue } from "../../birthcard";
import { formatMonthDay, parseIsoDate } from "../../urls";
import { longestSourceProse } from "../../source-text";
import type { CardMeaning, WinterMedalistRow } from "./types";
import { medalPhrase } from "./urls";

export type WinterFaq = {
  question: string;
  answer: string;
};

export type WinterCopy = {
  hook: string;
  record: string;
  coordinate: string;
  card_meaning: string;
  /** Lead-section prose after the opening sentence. Never repeats the hook. */
  source_record: string[];
  evidence: string[];
  faqs: WinterFaq[];
};

/** Longest verified text for this person: the full lead section when we have it. */
export function sourceProse(person: WinterMedalistRow): string {
  return longestSourceProse(person);
}

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;
const FORMULA = "solar_value = 55 − (2 × month + day)";

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function winterCopy(person: WinterMedalistRow, meaning: CardMeaning): WinterCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const prose = sourceProse(person);
  const sentences = splitSourceSentences(prose);
  // Everything after the opening sentence, so the record section never repeats
  // the hook. Capped so a very long lead does not swamp the page.
  const sourceRecord = sentences.slice(1, 9);
  const medals = medalPhrase(person);
  const solar = solarValue(month, day);

  const lead = `${person.name}: ${sentences[0] ?? prose.trim()}`;
  const hook = [
    lead,
    `${person.name} (${person.qid}, slug ${person.slug}) is on Wikipedia’s 8+ Winter Olympic medalists table for ${person.sport} under ${person.nation}, with a published row of ${medals}.`,
    `None of those ${person.total} medals set ${person.name}’s card. ${dateLabel} / ${person.birth_date} does: the ${meaning.label} (${person.card}).`,
  ].join(" ");

  const record = [
    `${person.name}’s list row is ${person.gold} gold / ${person.silver} silver / ${person.bronze} bronze in ${person.sport}.`,
    `That ${person.total}-medal line is why ${person.slug} is in the catalog and why a one-event specialist with fewer than eight Winter medals has no page here.`,
    `${person.nation} is the nation cell on that row. It is not a second birthday and it is not fed into the solar formula.`,
    `Only ${dateLabel} is mapped. The year ${person.birth_date.slice(0, 4)} printed on ${person.wikipedia_title} is unused for ${person.name}.`,
  ].join(" ");

  const coordinate = [
    `For ${person.slug}, ${FORMULA} is evaluated with month ${month} and day ${day}.`,
    `55 − (2 × ${month} + ${day}) = ${solar} for ${person.name}.`,
    solar <= 0
      ? `${person.name} lands on the Joker boundary because ${dateLabel} is December 31. pipeline.birthcard (D1) emits Joker here, not King of Spades.`
      : `${person.name}’s slot ${solar} is the ${meaning.label} (${person.card}), not a ${person.sport} forecast.`,
    `A reader looking up ${person.qid} should treat this as a calendar pin for ${dateLabel}, not a verdict on ${person.nation} or ${person.sport}.`,
    `${person.slug} is the only path segment for this athlete; ${person.wikipedia_title} is the article title; ${person.card} is the computed coordinate.`,
  ].join(" ");

  const cardMeaning =
    `${person.name} maps to ${meaning.label} / ${meaning.title} on ${dateLabel}. ` +
    `Quoted only as the published ${meaning.slug} coordinate line, not as a ${person.sport} reading of ${person.name}: ${meaning.sweet_spot}`;

  const evidence = evidenceFromSummary(person, sentences.slice(1 + sourceRecord.length));

  const faqs: WinterFaq[] = [
    {
      question: `What is ${person.name}’s birth card?`,
      answer: `${person.name}’s card is the ${meaning.label}. ${dateLabel} (${person.birth_date}) maps through the public formula; ${person.qid} does not change the month-day math.`,
    },
    {
      question: `Does ${person.name}’s birth card predict Winter Olympic medals?`,
      answer: `No. ${medals} is a list fact about ${person.sport}. The ${meaning.label} only names ${dateLabel} for ${person.slug}.`,
    },
    {
      question: `Where do ${person.name}’s dates come from?`,
      answer: dateSourceAnswer(person),
    },
    {
      question: `Why is ${person.name} in this set and not every Winter Olympic medalist?`,
      answer: `${person.wikipedia_title} is on the Wikipedia 8+ table with ${person.total} medals. ${person.name} stays because that table lists the athlete and both the infobox and Wikidata P569 (${person.qid}) publish ${person.birth_date}.`,
    },
  ];

  return { hook, record, coordinate, card_meaning: cardMeaning, source_record: sourceRecord, evidence, faqs };
}

/**
 * Remaining lead-section sentences, if the article had more than the record
 * section used. Returns an empty list rather than padding with boilerplate —
 * a short article should produce a shorter page, not a repeated one.
 */
function evidenceFromSummary(_person: WinterMedalistRow, remaining: string[]): string[] {
  return remaining.slice(0, 4);
}

function dateSourceAnswer(person: WinterMedalistRow): string {
  return (
    `${person.name}’s birth date ${person.birth_date} is the day-precision Wikipedia infobox date on ${person.wikipedia_title}, ` +
    `verified against Wikidata P569 ${person.wikidata_birth_date} (${person.qid}, CC0, day precision, Gregorian preferred). ` +
    `Those two ${person.slug} sources match (${person.dob_crosscheck}). A year-only infobox or a ${person.qid} conflict would have dropped ${person.name}, not invented a day. ` +
    `The 8+ list catalogued ${person.name}; it did not supply ${person.birth_date}. ` +
    `Hooks for ${person.slug} come from the Wikipedia REST summary at ${person.source_url} (CC BY-SA 4.0).`
  );
}
