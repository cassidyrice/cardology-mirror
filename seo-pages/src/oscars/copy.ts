import { formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, OscarRow } from "./types";
import { awardPhrase } from "./urls";

export type OscarFaq = {
  question: string;
  answer: string;
};

export type OscarCopy = {
  hook: string;
  card_meaning: string;
  evidence: string[];
  faqs: OscarFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function oscarCopy(person: OscarRow, meaning: CardMeaning): OscarCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const awards = awardPhrase(person.awards);

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast of the ${awards} win.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about an Academy Award and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: OscarFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict an Oscar?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast awards, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person),
    },
  ];

  return { hook, card_meaning: cardMeaning, evidence, faqs };
}

function evidenceFromSummary(person: OscarRow, sentences: string[]): string[] {
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
    evidence.push("No extra biographical facts were written for this page beyond that summary.");
  }
  return evidence;
}

function dateSourceAnswer(person: OscarRow): string {
  return (
    `Birth date ${person.birth_date} is the day-precision date on ${person.name}'s Wikipedia infobox, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Winner identity comes from the Wikipedia Best Actor / Best Actress lists, ` +
    `which cite Oscars.org ceremony pages. Year-only dates and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
