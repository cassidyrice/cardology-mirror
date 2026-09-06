import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, HouseChairRow } from "./types";
import { officePhrase, ordinal, partyLabel, roleKindLabel } from "./urls";

export type HouseChairFaq = {
  question: string;
  answer: string;
};

export type HouseChairCopy = {
  hook: string;
  card_meaning: string;
  ledger: string;
  evidence: string[];
  faqs: HouseChairFaq[];
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

export function houseChairCopy(person: HouseChairRow, meaning: CardMeaning): HouseChairCopy {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const display = formatDisplayDate(person.birth_date);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();
  const office = officePhrase(person);
  const solar = 55 - (2 * month + day);
  const seat = `${person.state} ${ordinal(person.district)}`;
  const party = partyLabel(person.party);
  const role = roleKindLabel(person.role_kind);

  const hook =
    `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, ` +
    `not a forecast of ${person.name}'s work as ${office}.`;

  const cardMeaning =
    `${person.name} was born ${display} (${person.birth_date}). Month ${month} and day ${day} give solar value ${solar}, ` +
    `which is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day). ` +
    `The year ${year} is unused, so ${person.name}'s ${year} birth year does not move the card. ` +
    `The ${meaning.label} does not predict a House office and is not a verdict on ${person.name}. ` +
    `Quoted system copy for the ${meaning.label}, not a biography of ${person.name}: ${meaning.core_identity || meaning.sweet_spot}` +
    (meaning.gifts?.length
      ? ` Harvested gifts listed for the ${meaning.label}: ${meaning.gifts.join("; ")}.`
      : "") +
    (meaning.life_direction
      ? ` Harvested life-direction line for the ${meaning.label}: ${meaning.life_direction}`
      : "");

  const deathClause = person.death_date
    ? ` A public death date of ${formatDisplayDate(person.death_date)} (${person.death_date}) is listed on Wikidata P570 for ${person.name}.`
    : ` No day-precision Wikidata P570 death date is stored on this page for ${person.name}.`;
  const titleClause =
    person.wikipedia_title === person.name
      ? `${person.name}'s English Wikipedia title is the same string as the harvested name.`
      : `${person.name}'s English Wikipedia title is “${person.wikipedia_title}”, which is the sitelink used for the REST summary.`;
  const committeeClause =
    person.role_kind === "chair" && person.committee_thomas_id
      ? ` Standing-chair identity for ${person.name} is congress-legislators committee ${person.committee_thomas_id}.`
      : ` Leadership identity for ${person.name} is the house.gov/leadership roster, not a standing-committee chair line.`;
  const ledger =
    `${person.name} (${person.qid}, Bioguide ${person.bioguide}) is in this pack as ${office}. ` +
    `${person.name} is a ${party} member from the ${seat} district of ${person.state} (${person.postal}-${person.district}). ` +
    `The harvested role kind is ${role}. ${titleClause}` +
    committeeClause +
    ` Birth date ${person.birth_date} is the Wikipedia infobox day for ${person.name}, ` +
    `matching Bioguide / congress-legislators ${person.bioguide_birth_date} ` +
    `and Wikidata P569 ${person.wikidata_birth_date} (${person.dob_crosscheck}). ` +
    `The harvested card symbol for ${dateLabel} is ${person.card}.` +
    deathClause +
    ` Source URL ${person.source_url} is the Wikipedia article used for ${person.name}. ` +
    `House History Bioguide for ${person.name} is ${person.history_house_url}. ` +
    `Congress.gov member page for ${person.name} is ${person.congress_url}. ` +
    `This page does not invent a childhood or a private address for ${person.name}. ` +
    `It only names the calendar coordinate for ${dateLabel} and the public House office already listed for ${person.name}.`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: HouseChairFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. ${person.name}'s year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a House leadership post or committee chair?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast elections, gavel assignments, character, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates and House office come from?`,
      answer: dateSourceAnswer(person, office),
    },
  ];

  return { hook, card_meaning: cardMeaning, ledger, evidence, faqs };
}

function evidenceFromSummary(person: HouseChairRow, sentences: string[]): string[] {
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
      `No extra biographical facts were written for ${person.name} beyond that summary and the public House office record.`,
    );
  }
  return evidence;
}

function dateSourceAnswer(person: HouseChairRow, office: string): string {
  return (
    `Birth date ${person.birth_date} is the day-precision Wikipedia infobox date for ${person.name}, ` +
    `matching Bioguide / congress.gov compiled birthday ${person.bioguide_birth_date} ` +
    `and Wikidata P569 ${person.wikidata_birth_date} (CC0, day precision, Gregorian preferred). ` +
    `The three sources match. Year-only dates and conflicts are dropped, not guessed. ` +
    `Sitting identity for ${office} comes from house.gov/leadership and congress-legislators standing-chair rows. ` +
    `Select and campaign committees are out of scope. ` +
    `Page hooks and evidence come from the Wikipedia REST summary (CC BY-SA 4.0).`
  );
}
