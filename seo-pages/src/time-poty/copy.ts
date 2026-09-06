import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";
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
  evidence: string[];
  faqs: TimePotyFaq[];
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

export function timePotyCopy(person: TimePotyRow, meaning: CardMeaning): TimePotyCopy {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const display = formatDisplayDate(person.birth_date);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
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

  const evidence = evidenceFromSummary(person, sentences);

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

  return { hook, card_meaning: cardMeaning, ledger, evidence, faqs };
}

function evidenceFromSummary(person: TimePotyRow, sentences: string[]): string[] {
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
      `No extra biographical facts were written for ${person.name} beyond that summary and the TIME Person of the Year record.`,
    );
  }
  return evidence;
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
