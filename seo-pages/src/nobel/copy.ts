import { formatMonthDay, parseIsoDate } from "../urls";
import { longestSourceProse } from "../source-text";
import type { CardMeaning, NobelRow } from "./types";
import { prizePhrase } from "./urls";

export type NobelFaq = {
  question: string;
  answer: string;
};

export type NobelCopy = {
  hook: string;
  card_meaning: string;
  /** Lead-section prose after the opening sentence. Never repeats the hook. */
  record: string[];
  evidence: string[];
  faqs: NobelFaq[];
};

/** Longest verified text for this person: the full lead section when we have it. */
export function sourceProse(person: NobelRow): string {
  return longestSourceProse(person);
}

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function nobelCopy(person: NobelRow, meaning: CardMeaning): NobelCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const prose = sourceProse(person);
  const sentences = splitSourceSentences(prose);
  const first = sentences[0] ?? prose.trim();
  // Everything after the opening sentence, so the record section never repeats
  // the hook. Capped so a very long lead does not swamp the page.
  const record = sentences.slice(1, 9);
  const prizes = prizePhrase(person.prizes);

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast of the ${prizes} prize.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about a Nobel Prize and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const evidence = evidenceFromSummary(person, sentences.slice(1 + record.length));

  const faqs: NobelFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a Nobel Prize?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast prizes, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person),
    },
  ];

  return { hook, card_meaning: cardMeaning, record, evidence, faqs };
}

/**
 * Remaining lead-section sentences, if the article had more than the record
 * section used. Returns an empty list rather than padding with boilerplate —
 * a short article should produce a shorter page, not a repeated one.
 */
function evidenceFromSummary(_person: NobelRow, remaining: string[]): string[] {
  return remaining.slice(0, 4);
}

function dateSourceAnswer(person: NobelRow): string {
  return (
    `Birth date ${person.birth_date} is the Nobel Prize API v2.1 day-precision date, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only Nobel dates and Nobel↔Wikidata conflicts are dropped, not guessed. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
