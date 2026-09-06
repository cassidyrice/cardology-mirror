import { formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, TonyRow } from "./types";
import { winPhrase } from "./urls";

export type TonyFaq = {
  question: string;
  answer: string;
};

export type TonyCopy = {
  hook: string;
  card_meaning: string;
  evidence: string[];
  faqs: TonyFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function tonyCopy(person: TonyRow, meaning: CardMeaning): TonyCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const wins = winPhrase(person.wins);

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast of the ${wins} win.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about a Tony Award and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: TonyFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a Tony Award?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast awards, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person),
    },
  ];

  return { hook, card_meaning: cardMeaning, evidence, faqs };
}

function evidenceFromSummary(person: TonyRow, sentences: string[]): string[] {
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

function dateSourceAnswer(person: TonyRow): string {
  if (person.dob_crosscheck === "match") {
    return (
      `Birth date ${person.birth_date} is the day-precision date on ${person.name}'s Wikipedia person page, ` +
      `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
      `The two sources match. Year-only Wikipedia dates and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
      `Tony Award wins come from the Wikipedia leading-acting lists, which record the Tony Awards. ` +
      `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
    );
  }
  return (
    `Birth date ${person.birth_date} is Wikidata P569 at day precision (CC0, Gregorian preferred). ` +
    `The Wikipedia person page had no day-precision birth template, so no Wikipedia day was invented. ` +
    `Year-only Wikipedia dates and Wikipedia↔Wikidata conflicts are dropped. ` +
    `Tony Award wins come from the Wikipedia leading-acting lists, which record the Tony Awards. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
