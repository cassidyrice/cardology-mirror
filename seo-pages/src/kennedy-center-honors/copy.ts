import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, KennedyCenterRow } from "./types";
import { honorPhrase } from "./urls";

export type KennedyCenterFaq = {
  question: string;
  answer: string;
};

export type KennedyCenterCopy = {
  hook: string;
  card_meaning: string;
  ledger: string;
  evidence: string[];
  faqs: KennedyCenterFaq[];
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

export function kennedyCenterCopy(person: KennedyCenterRow, meaning: CardMeaning): KennedyCenterCopy {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const display = formatDisplayDate(person.birth_date);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const honors = honorPhrase(person.honors);
  const solar = 55 - (2 * month + day);
  const acts = person.honors.map((item) => `${item.year} ${item.act}`).join("; ");
  const memberNote = person.honors.some((item) => item.role === "member")
    ? `${person.name} is listed as an honored member of a group or collective on at least one Kennedy Center Honors year in this pack.`
    : `${person.name} is listed as a person-scope honoree for each year in this pack.`;

  const hook =
    `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, ` +
    `not a forecast of ${person.name}'s ${honors}.`;

  const cardMeaning =
    `${person.name} was born ${display} (${person.birth_date}). Month ${month} and day ${day} give solar value ${solar}, ` +
    `which is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day). ` +
    `The year ${year} is unused, so ${person.name}'s ${year} birth year does not move the card. ` +
    `The ${meaning.label} does not predict a Kennedy Center Honor and is not a verdict on ${person.name}. ` +
    `Quoted system copy for the ${meaning.label}, not a biography of ${person.name}: ${meaning.core_identity || meaning.sweet_spot}` +
    (meaning.gifts?.length
      ? ` Harvested gifts listed for the ${meaning.label}: ${meaning.gifts.join("; ")}.`
      : "") +
    (meaning.life_direction
      ? ` Harvested life-direction line for the ${meaning.label}: ${meaning.life_direction}`
      : "");

  const honorLines = person.honors
    .map((item) => {
      const role =
        item.role === "member" ? ` as a listed member of ${item.act}` : ` as ${item.act}`;
      return (
        `${person.name} is on the ${item.year} Kennedy Center Honors roster${role} ` +
        `(${item.kennedy_center_url}).`
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
    `${honorLines} ${person.name} (${person.qid}, Wikipedia “${person.wikipedia_title}”) appears here as a person-scope honoree. ` +
    `${memberNote} Honors in this pack for ${person.name}: ${acts}. ` +
    `${titleClause} ` +
    `Birth date ${person.birth_date} is the Wikipedia infobox day for ${person.name}, verified against Wikidata P569 ${person.wikidata_birth_date} (${person.dob_crosscheck}). ` +
    `Kennedy Center artist-bio date status for ${person.name} is ${person.kennedy_center_crosscheck}` +
    (person.kennedy_center_birth_date ? ` (${person.kennedy_center_birth_date})` : "") +
    `. The harvested card symbol for ${dateLabel} is ${person.card}.` +
    deathClause +
    ` Source URL ${person.source_url} is the Wikipedia article used for ${person.name}. ` +
    `This page does not invent a childhood or a private address for ${person.name}. ` +
    `It only names the calendar coordinate for ${dateLabel} and the Honors years already listed for ${person.name}.`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: KennedyCenterFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. ${person.name}'s year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a Kennedy Center Honor?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast awards, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates and Honors credits come from?`,
      answer: dateSourceAnswer(person, honors),
    },
  ];

  return { hook, card_meaning: cardMeaning, ledger, evidence, faqs };
}

function evidenceFromSummary(person: KennedyCenterRow, sentences: string[]): string[] {
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
      `No extra biographical facts were written for ${person.name} beyond that summary and the Kennedy Center Honors record.`,
    );
  }
  return evidence;
}

function dateSourceAnswer(person: KennedyCenterRow, honors: string): string {
  return (
    `Birth date ${person.birth_date} is the day-precision Wikipedia infobox date for ${person.name}, ` +
    `verified against Wikidata P569 (CC0, day precision, Gregorian preferred). ` +
    `The two sources match. Year-only infoboxes and Wikipedia↔Wikidata conflicts are dropped, not guessed. ` +
    `Honoree identity comes from the Wikipedia Kennedy Center Honors roster, which cites Kennedy Center pages. ` +
    `The Honors line is ${honors}. Kennedy Center artist-bio date status is ${person.kennedy_center_crosscheck}. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
