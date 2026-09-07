import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";
import { longestSourceProse } from "../source-text";
import type { CardMeaning, TimePotyRow } from "./types";
import { honorPhrase } from "./urls";

export type TimePotyFaq = {
  question: string;
  answer: string;
};

export type TimePotyCopy = {
  hook: string;
  card_meaning: string;
  ledger: string;
  /** Lead-section prose after the opening sentence. Never repeats the hook. */
  source_record: string[];
  evidence: string[];
  faqs: TimePotyFaq[];
};

/** Longest verified text for this person: the full lead section when we have it. */
export function sourceProse(person: TimePotyRow): string {
  return longestSourceProse(person);
}

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function evidenceContained(sourceText: string, fact: string): boolean {
  return sourceText.includes(fact);
}

export function timePotyCopy(person: TimePotyRow, meaning: CardMeaning): TimePotyCopy {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const display = formatDisplayDate(person.birth_date);
  const prose = sourceProse(person);
  const sentences = splitSourceSentences(prose);
  // Everything after the opening sentence, so the record section never repeats
  // the hook. Capped so a very long lead does not swamp the page.
  const sourceRecord = sentences.slice(1, 9);
  const first = sentences[0] ?? prose.trim();
  const honors = honorPhrase(person.honors);
  const solar = 55 - (2 * month + day);
  const years = person.honors.map((honor) => honor.year).join(", ");
  const labels = person.honors.map((honor) => `${honor.year} ${honor.choice_label}`).join("; ");
  const sharedNote = person.honors.some((honor) => honor.shared)
    ? `${person.name} shares at least one TIME Person of the Year year in this pack with another named human.`
    : `${person.name} is listed as the sole named human for each TIME Person of the Year year in this pack.`;

  const second = sentences[1] ?? "";
  const hook =
    `${first}` +
    (second && second !== first ? ` ${second}` : "") +
    ` ${person.name} was born ${display}. The birth-card coordinate for ${dateLabel} is the ${meaning.label} — ` +
    `a calendar position, not a forecast of ${person.name}'s ${honors}.`;

  const cardMeaning =
    `${person.name} was born ${display} (${person.birth_date}). Month ${month} and day ${day} give solar value ${solar}, ` +
    `which is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day). ` +
    `The year ${year} is unused, so ${person.name}'s ${year} birth year does not move the card. ` +
    `The ${meaning.label} does not predict a TIME Person of the Year selection and is not a verdict on ${person.name}. ` +
    `Quoted system copy for the ${meaning.label}, not a biography of ${person.name}: ${meaning.core_identity || meaning.sweet_spot}` +
    (meaning.gifts?.length
      ? ` Harvested gifts listed for the ${meaning.label}: ${meaning.gifts.join("; ")}.`
      : "") +
    (meaning.life_direction
      ? ` Harvested life-direction line for the ${meaning.label}: ${meaning.life_direction}`
      : "");

  const honorLines = person.honors
    .map((honor) => {
      const share = honor.shared
        ? `${person.name} is one of the named humans listed for that year`
        : `${person.name} is the sole named human listed for that year`;
      return `${person.name}'s ${honor.year} Wikipedia list row uses the choice label “${honor.choice_label}” (${share}).`;
    })
    .join(" ");
  const deathClause = person.death_date
    ? ` Wikidata P570 lists ${formatDisplayDate(person.death_date)} (${person.death_date}) as a public death date for ${person.name}.`
    : ` This page stores no day-precision Wikidata P570 death date for ${person.name}.`;
  const titleClause =
    person.wikipedia_title === person.name
      ? `The harvested English Wikipedia title for ${person.name} matches the list name.`
      : `The harvested English Wikipedia title for ${person.name} is “${person.wikipedia_title}”.`;
  const ledger =
    `${honorLines} ${sharedNote} ${titleClause} ` +
    `${person.name} is Wikidata ${person.qid}. Honor years kept for ${person.name}: ${years}. Choice labels kept: ${labels}. ` +
    `${person.name}'s Wikipedia infobox day is ${person.birth_date}; Wikidata P569 is ${person.wikidata_birth_date} (${person.dob_crosscheck}). ` +
    `TIME vault (${person.time_context_url}) is context for ${person.name}'s honor and is not a date source. ` +
    `${dateLabel} maps to ${person.card} for ${person.name}.` +
    deathClause +
    ` The Wikipedia REST summary used for ${person.name} is ${person.source_url}. ` +
    `No childhood, private address, or invented birthday is added for ${person.name}.`;

  const evidence = evidenceFromSummary(person, sentences.slice(1 + sourceRecord.length));

  const faqs: TimePotyFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. ${person.name}'s year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a TIME Person of the Year?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast magazine covers, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates and TIME Person of the Year credits come from?`,
      answer: dateSourceAnswer(person, honors),
    },
  ];

  return { hook, card_meaning: cardMeaning, ledger, source_record: sourceRecord, evidence, faqs };
}

/**
 * Remaining lead-section sentences, if the article had more than the record
 * section used. Returns an empty list rather than padding with boilerplate —
 * a short article should produce a shorter page, not a repeated one.
 */
function evidenceFromSummary(_person: TimePotyRow, remaining: string[]): string[] {
  return remaining.slice(0, 4);
}

function dateSourceAnswer(person: TimePotyRow, honors: string): string {
  return (
    `Birth date ${person.birth_date} is the day-precision Wikipedia infobox date for ${person.name}, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only infoboxes and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Honoree identity comes from the Wikipedia TIME Person of the Year list. Duals are split per named human. ` +
    `Abstractions, machines, and groups-as-concepts are omitted. The honor line is ${honors}. ` +
    `TIME vault is context only and is not used as a date source. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
