import { formatMonthDay, parseIsoDate } from "../urls";
import { longestSourceProse } from "../source-text";
import type { CardMeaning, OlympicRow } from "./types";
import { medalPhrase } from "./urls";

export type OlympicsFaq = {
  question: string;
  answer: string;
};

export type OlympicsCopy = {
  hook: string;
  card_meaning: string;
  /** Lead-section prose after the opening sentence. Never repeats the hook. */
  source_record: string[];
  evidence: string[];
  medal_note: string;
  faqs: OlympicsFaq[];
};

/** Longest verified text for this person: the full lead section when we have it. */
export function sourceProse(person: OlympicRow): string {
  return longestSourceProse(person);
}

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function olympicsCopy(person: OlympicRow, meaning: CardMeaning): OlympicsCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const prose = sourceProse(person);
  const sentences = splitSourceSentences(prose);
  // Everything after the opening sentence, so the record section never repeats
  // the hook. Capped so a very long lead does not swamp the page.
  const sourceRecord = sentences.slice(1, 9);
  const first = sentences[0] ?? prose.trim();
  const medals = medalPhrase(person);
  const country = person.country ? ` for ${person.country}` : "";
  const years = uniqueYears(person);

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast of ${person.name}'s ${medals}.`;

  const solar = 55 - (2 * month + day);
  const cardMeaning =
    `${person.name} was born ${dateLabel} (${person.birth_date}). Month ${month} and day ${day} give solar value ${solar}, ` +
    `which is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day). The year ${person.birth_date.slice(0, 4)} is unused. ` +
    `The ${meaning.label} does not predict Olympic results and is not a verdict on ${person.name}${country}. ` +
    `Quoted system copy for the ${meaning.label}, not a biography of ${person.name}: ${meaning.core_identity || meaning.sweet_spot}`;

  const medalSentences = person.medals
    .map((medal) => {
      const when = [medal.year, medal.games].filter((part) => part).join(" ");
      const sport = medal.sport ? ` in ${medal.sport}` : "";
      return when
        ? `${when}: gold in ${medal.event}${sport}.`
        : `Gold in ${medal.event}${sport}.`;
    })
    .join(" ");

  const medalNote =
    `Wikidata records ${medals}${country}` +
    (years ? ` across ${years}` : "") +
    `. Only Summer Games gold medals count here. Winter-only careers and single-gold athletes are out of this pack. ` +
    `The medal list is a public award record for ${person.name} (${person.qid}), not a reading of character. ` +
    (medalSentences || `Event-level gold statements were counted for ${person.name} but not labeled.`);

  const evidence = evidenceFromSummary(person, sentences.slice(1 + sourceRecord.length));

  const faqs: OlympicsFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. ${person.name}'s year of birth is not used.`,
    },
    {
      question: `Does a birth card predict Olympic medals?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast races, medals, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates and medals come from?`,
      answer: dateSourceAnswer(person, medals),
    },
  ];

  return { source_record: sourceRecord, hook, card_meaning: cardMeaning, evidence, medal_note: medalNote, faqs };
}

function uniqueYears(person: OlympicRow): string {
  const years = [...new Set(person.medals.map((medal) => medal.year).filter((year) => year.length === 4))];
  years.sort();
  if (years.length === 0) return "";
  if (years.length === 1) return years[0] ?? "";
  if (years.length === 2) return `${years[0]} and ${years[1]}`;
  return `${years[0]}–${years[years.length - 1]}`;
}

/**
 * Remaining lead-section sentences, if the article had more than the record
 * section used. Returns an empty list rather than padding with boilerplate —
 * a short article should produce a shorter page, not a repeated one.
 */
function evidenceFromSummary(_person: OlympicRow, remaining: string[]): string[] {
  return remaining.slice(0, 4);
}

function dateSourceAnswer(person: OlympicRow, medals: string): string {
  return (
    `Birth date ${person.birth_date} is the day-precision Wikipedia infobox date for ${person.name}, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only infoboxes and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Medal count (${medals}) comes from Wikidata P1344 event claims with P166 Olympic gold, limited to Summer Games. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
