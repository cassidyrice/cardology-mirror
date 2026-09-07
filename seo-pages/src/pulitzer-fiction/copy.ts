import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";
import { longestSourceProse } from "../source-text";
import type { CardMeaning, PulitzerRow } from "./types";
import { awardPhrase } from "./urls";

export type PulitzerFaq = {
  question: string;
  answer: string;
};

export type PulitzerCopy = {
  hook: string;
  card_meaning: string;
  ledger: string;
  /** Lead-section prose after the opening sentence. Never repeats the hook. */
  source_record: string[];
  evidence: string[];
  faqs: PulitzerFaq[];
};

/** Longest verified text for this person: the full lead section when we have it. */
export function sourceProse(person: PulitzerRow): string {
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

export function pulitzerCopy(person: PulitzerRow, meaning: CardMeaning): PulitzerCopy {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const display = formatDisplayDate(person.birth_date);
  const prose = sourceProse(person);
  const sentences = splitSourceSentences(prose);
  // Everything after the opening sentence, so the record section never repeats
  // the hook. Capped so a very long lead does not swamp the page.
  const sourceRecord = sentences.slice(1, 9);
  const first = sentences[0] ?? prose.trim();
  const awards = awardPhrase(person.awards);
  const solar = 55 - (2 * month + day);
  const works = person.awards.map((award) => `${award.year} ${award.work}`).join("; ");
  const sharedNote = person.awards.some((award) => award.shared)
    ? `${person.name} is listed as a joint recipient for at least one Fiction year in this pack.`
    : `${person.name} is listed as the sole Fiction recipient for each year in this pack.`;

  const hook =
    `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, ` +
    `not a forecast of ${person.name}'s ${awards}.`;

  const cardMeaning =
    `${person.name} was born ${display} (${person.birth_date}). Month ${month} and day ${day} give solar value ${solar}, ` +
    `which is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day). ` +
    `The year ${year} is unused, so ${person.name}'s ${year} birth year does not move the card. ` +
    `The ${meaning.label} does not predict a Pulitzer Prize for Fiction and is not a verdict on ${person.name}. ` +
    `Quoted system copy for the ${meaning.label}, not a biography of ${person.name}: ${meaning.core_identity || meaning.sweet_spot}` +
    (meaning.gifts?.length
      ? ` Harvested gifts listed for the ${meaning.label}: ${meaning.gifts.join("; ")}.`
      : "") +
    (meaning.life_direction
      ? ` Harvested life-direction line for the ${meaning.label}: ${meaning.life_direction}`
      : "");

  const awardLines = person.awards
    .map((award) => {
      const share = award.shared ? " as a joint recipient" : "";
      return (
        `${person.name} is on the ${award.year} Pulitzer Prize for Fiction list for ${award.work}${share} ` +
        `(${award.pulitzer_url}).`
      );
    })
    .join(" ");
  const deathClause = person.death_date
    ? ` A public death date of ${formatDisplayDate(person.death_date)} (${person.death_date}) is listed on Wikidata P570 for ${person.name}.`
    : ` No day-precision Wikidata P570 death date is stored on this page for ${person.name}.`;
  const titleClause =
    person.wikipedia_title === person.name
      ? `${person.name}'s English Wikipedia title is the same string as the harvested name.`
      : `${person.name}'s English Wikipedia title is “${person.wikipedia_title}”, which is the sitelink used for the REST summary.`;
  const ledger =
    `${awardLines} ${person.name} (${person.qid}, Wikipedia “${person.wikipedia_title}”) appears here as a person-scope Fiction winner. ` +
    `${sharedNote} Works in this pack for ${person.name}: ${works}. ` +
    `${titleClause} ` +
    `Birth date ${person.birth_date} is the Wikipedia infobox day for ${person.name}, verified against Wikidata P569 ${person.wikidata_birth_date} (${person.dob_crosscheck}). ` +
    `Pulitzer.org bio date status for ${person.name} is ${person.pulitzer_org_crosscheck}` +
    (person.pulitzer_org_birth_date ? ` (${person.pulitzer_org_birth_date})` : "") +
    `. The harvested card symbol for ${dateLabel} is ${person.card}.` +
    deathClause +
    ` Source URL ${person.source_url} is the Wikipedia article used for ${person.name}. ` +
    `This page does not invent a childhood or a private address for ${person.name}. ` +
    `It only names the calendar coordinate for ${dateLabel} and the Fiction titles already listed for ${person.name}.`;

  const evidence = evidenceFromSummary(person, sentences.slice(1 + sourceRecord.length));

  const faqs: PulitzerFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. ${person.name}'s year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a Pulitzer Prize for Fiction?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast awards, novels, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates and Fiction credits come from?`,
      answer: dateSourceAnswer(person, awards),
    },
  ];

  return { hook, card_meaning: cardMeaning, ledger, source_record: sourceRecord, evidence, faqs };
}

/**
 * Remaining lead-section sentences, if the article had more than the record
 * section used. Returns an empty list rather than padding with boilerplate —
 * a short article should produce a shorter page, not a repeated one.
 */
function evidenceFromSummary(_person: PulitzerRow, remaining: string[]): string[] {
  return remaining.slice(0, 4);
}

function dateSourceAnswer(person: PulitzerRow, awards: string): string {
  return (
    `Birth date ${person.birth_date} is the day-precision Wikipedia infobox date for ${person.name}, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only infoboxes and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Winner identity comes from the Wikipedia Pulitzer Prize for Fiction list, which cites Pulitzer.org year pages. ` +
    `The Fiction line is ${awards}. Pulitzer.org bio date status is ${person.pulitzer_org_crosscheck}. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
