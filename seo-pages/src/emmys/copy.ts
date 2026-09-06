import { formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, EmmyRow } from "./types";
import { winPhrase } from "./urls";

export type EmmyFaq = {
  question: string;
  answer: string;
};

export type EmmyCopy = {
  hook: string;
  card_meaning: string;
  evidence: string[];
  faqs: EmmyFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function emmyCopy(person: EmmyRow, meaning: CardMeaning): EmmyCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const wins = winPhrase(person.wins);

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast of the ${wins} win.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about an Emmy and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: EmmyFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict an Emmy?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast awards, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person),
    },
  ];

  return { hook, card_meaning: cardMeaning, evidence, faqs };
}

function evidenceFromSummary(person: EmmyRow, sentences: string[]): string[] {
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

function dateSourceAnswer(person: EmmyRow): string {
  return (
    `Birth date ${person.birth_date} is the day-precision date on ${person.name}'s Wikipedia article infobox or lead, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only dates and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Lead Actor/Actress wins come from the Primetime Emmy drama and comedy Wikipedia lists, which compile Television Academy (emmys.com) results. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
