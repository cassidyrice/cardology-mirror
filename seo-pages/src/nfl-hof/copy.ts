import { formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, HofRow } from "./types";
import { inducteePhrase } from "./urls";

export type HofFaq = {
  question: string;
  answer: string;
};

export type HofCopy = {
  hook: string;
  card_meaning: string;
  evidence: string[];
  faqs: HofFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function containedEvidence(sourceText: string): string[] {
  const sentences = splitSourceSentences(sourceText);
  const evidence = sentences.filter((sentence) => sourceText.includes(sentence)).slice(0, 3);
  if (evidence.length > 0) {
    return evidence;
  }
  const trimmed = sourceText.trim();
  return trimmed ? [trimmed] : [];
}

export function hofCopy(person: HofRow, meaning: CardMeaning): HofCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const record = inducteePhrase(person);

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast of a Hall of Fame vote.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about induction and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}` +
    (meaning.life_direction ? ` Life-direction language from the harvested meaning, not a biography: ${meaning.life_direction}` : "") +
    (meaning.under ? ` Under-expressed language from the same harvest: ${meaning.under}` : "");

  const evidence = containedEvidence(person.source_text);

  const faqs: HofFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a Hall of Fame induction?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast honors, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person, record),
    },
  ];

  return { hook, card_meaning: cardMeaning, evidence, faqs };
}

function dateSourceAnswer(person: HofRow, record: string): string {
  const wikiBit = person.wikipedia_birth_date
    ? ` Wikipedia's day-precision infobox or lead (${person.wikipedia_birth_date}) matches.`
    : " Wikipedia year-only or missing days were not used to invent a date.";
  const hofBit = person.hof_birth_date
    ? ` The Pro Football Hall of Fame bio day (${person.hof_birth_date}) matches.`
    : " A Hall of Fame bio day was used only when the site published one.";
  return (
    `Birth date ${person.birth_date} is Wikidata P569 at day precision (CC0, Gregorian preferred) for ${person.name}, ` +
    `${record}. The Pro Football Hall of Fame ID is Wikidata P6930 (${person.hof_id}).` +
    wikiBit +
    hofBit +
    ` Year-only dates and source conflicts are dropped, not guessed. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
