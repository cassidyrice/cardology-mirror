import { formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, PresidentRow } from "./types";

export type PresidentFaq = {
  question: string;
  answer: string;
};

export type PresidentCopy = {
  hook: string;
  card_meaning: string;
  evidence: string[];
  faqs: PresidentFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function presidentCopy(person: PresidentRow, meaning: CardMeaning): PresidentCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about the presidency and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: PresidentFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a presidency?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast elections, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person),
    },
  ];

  return { hook, card_meaning: cardMeaning, evidence, faqs };
}

function evidenceFromSummary(person: PresidentRow, sentences: string[]): string[] {
  const fromSummary = sentences.slice(0, 3);
  if (fromSummary.length >= 3) {
    return fromSummary;
  }
  const evidence = [...fromSummary];
  if (evidence.length === 0) {
    evidence.push(person.source_text.trim());
  }
  if (evidence.length < 2) {
    evidence.push(
      `Wikipedia REST summary (${person.wikipedia_title}) is the only biographical prose used here.`,
    );
  }
  if (evidence.length < 3) {
    evidence.push(
      "No extra biographical facts were written for this page beyond that summary.",
    );
  }
  return evidence;
}

function dateSourceAnswer(person: PresidentRow): string {
  const wiki = person.wikipedia_month_day
    ? ` Wikipedia's home-state list records the month/day as ${person.wikipedia_month_day.replace("-", "/")}.`
    : "";
  const check = crosscheckSentence(person.dob_crosscheck);
  return (
    `Birth date ${person.birth_date} is Wikidata P569 (CC0, day precision, Gregorian preferred).` +
    wiki +
    check +
    " Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0)."
  );
}

function crosscheckSentence(status: PresidentRow["dob_crosscheck"]): string {
  switch (status) {
    case "match":
      return " The month and day match.";
    case "mismatch":
      return " The month/day values differ; this page keeps the Wikidata Gregorian day-precision P569 value and flags the mismatch.";
    case "missing":
      return " The Wikipedia list did not yield a month/day for this person.";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
