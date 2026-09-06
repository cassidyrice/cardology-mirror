import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, GrammyRow } from "./types";
import { awardPhrase, billingPhrase } from "./urls";

export type GrammyFaq = {
  question: string;
  answer: string;
};

export type GrammyCopy = {
  hook: string;
  card_meaning: string;
  ledger: string;
  evidence: string[];
  faqs: GrammyFaq[];
};

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

export function grammyCopy(person: GrammyRow, meaning: CardMeaning): GrammyCopy {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const display = formatDisplayDate(person.birth_date);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const awards = awardPhrase(person.awards);
  const billing = billingPhrase(person.billing, person.billed_act);
  const solar = 55 - (2 * month + day);
  const albums = person.awards.map((award) => `${award.year} ${award.album}`).join("; ");
  const billedYears = [...new Set(person.awards.map((award) => award.billed_act))].join(", ");

  const hook =
    `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, ` +
    `not a forecast of ${person.name}'s ${awards}.`;

  const cardMeaning =
    `${person.name} was born ${display} (${person.birth_date}). Month ${month} and day ${day} give solar value ${solar}, ` +
    `which is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day). ` +
    `The year ${year} is unused, so ${person.name}'s ${year} birth year does not move the card. ` +
    `The ${meaning.label} does not predict a Grammy Album of the Year and is not a verdict on ${person.name}. ` +
    `Quoted system copy for the ${meaning.label}, not a biography of ${person.name}: ${meaning.core_identity || meaning.sweet_spot}`;

  const awardLines = person.awards
    .map(
      (award) =>
        `${person.name} is on the ${award.year} Album of the Year list for ${award.album}, ` +
        `billed as ${award.billed_act} at ceremony ${award.ceremony_number} (${award.grammy_url}).`,
    )
    .join(" ");
  const ledger =
    `${awardLines} ${person.name} (${person.qid}, Wikipedia “${person.wikipedia_title}”) appears here as ${billing}. ` +
    `The billed act string on those wins is ${billedYears}. Albums in this pack for ${person.name}: ${albums}. ` +
    `Birth date ${person.birth_date} is the Wikipedia infobox day for ${person.name}, verified against Wikidata P569 ${person.wikidata_birth_date} (${person.dob_crosscheck}). ` +
    `This page does not invent a childhood or a private address for ${person.name}. ` +
    `It only names the calendar coordinate for ${dateLabel} and the Album of the Year albums already listed for ${person.name}.`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: GrammyFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. ${person.name}'s year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a Grammy Album of the Year?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast awards, albums, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates and Album of the Year credits come from?`,
      answer: dateSourceAnswer(person, awards, billing),
    },
  ];

  return { hook, card_meaning: cardMeaning, ledger, evidence, faqs };
}

function evidenceFromSummary(person: GrammyRow, sentences: string[]): string[] {
  const fromSummary = sentences.filter((sentence) => evidenceContained(person.source_text, sentence)).slice(0, 3);
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
      `No extra biographical facts were written for ${person.name} beyond that summary and the Album of the Year record.`,
    );
  }
  return evidence;
}

function dateSourceAnswer(person: GrammyRow, awards: string, billing: string): string {
  return (
    `Birth date ${person.birth_date} is the day-precision Wikipedia infobox date for ${person.name}, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only infoboxes and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Winner identity comes from the Wikipedia Album of the Year list, which cites Grammy.com / Recording Academy pages. ` +
    `${person.name} is ${billing}. The Album of the Year line is ${awards}. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
