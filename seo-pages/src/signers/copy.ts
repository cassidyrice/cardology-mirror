import { formatMonthDay, parseIsoDate } from "../urls";
import type { CardMeaning, SignerRow } from "./types";

export type SignerFaq = {
  question: string;
  answer: string;
};

export type SignerCopy = {
  hook: string;
  card_meaning: string;
  evidence: string[];
  faqs: SignerFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function signerCopy(person: SignerRow, meaning: CardMeaning): SignerCopy {
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  const sentences = splitSourceSentences(person.source_text);
  const first = sentences[0] ?? person.source_text.trim();

  const hook = `${first} The birth-card coordinate for ${dateLabel} is the ${meaning.label} — a calendar position, not a forecast.`;

  const cardMeaning =
    `${person.name}'s birthday maps to the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a 365-day coordinate: solar value = 55 − (2 × month + day), and the year is unused. ` +
    `It is not a prediction about the Declaration and not a verdict on ${person.name}. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const evidence = evidenceFromSummary(person, sentences);

  const faqs: SignerFaq[] = [
    {
      question: `What is ${person.name}'s birth card?`,
      answer: `The ${meaning.label}. ${dateLabel} maps to that card through the public Card Blueprints formula. The year of birth is not used.`,
    },
    {
      question: `Does a birth card predict a signer or a revolution?`,
      answer: `No. These pages are coordinates, not fortune-telling. A birth card names a calendar day in a 52-card year. It does not forecast character, politics, or fate.`,
    },
    {
      question: `Where do ${person.name}'s dates come from?`,
      answer: dateSourceAnswer(person),
    },
  ];

  return { hook, card_meaning: cardMeaning, evidence, faqs };
}

function evidenceFromSummary(person: SignerRow, sentences: string[]): string[] {
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

function dateSourceAnswer(person: SignerRow): string {
  const wiki = person.wikipedia_birth
    ? ` Wikipedia's infobox records ${person.wikipedia_birth}.`
    : "";
  return (
    `Birth date ${person.birth_date} is the NARA Signers Factsheet day` +
    (person.calendar_note === "new_style" ? ", preferring New Style where Old Style is marked." : ".") +
    wiki +
    ` ${crosscheckSentence(person.dob_crosscheck)}` +
    " Bioguide is a corroborating congressional biography. Wikidata P569 is a precision=11 QA check only — it is not the public date." +
    (person.footnote ? ` Note: ${person.footnote}` : "")
  );
}

function crosscheckSentence(status: SignerRow["dob_crosscheck"]): string {
  switch (status) {
    case "match":
      return "The month and day match Wikipedia.";
    case "new_style":
      return "Wikipedia records the Old Style day; this page publishes the New Style calendar day.";
    case "mismatch":
      return "Wikipedia lists a different day; this page keeps the NARA day and footnotes the difference.";
    case "missing":
      return "Wikipedia did not yield a month/day for this person.";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
