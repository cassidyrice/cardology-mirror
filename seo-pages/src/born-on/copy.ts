import { solarValue } from "../birthcard";
import { formatMonthDay, parseIsoDate } from "../urls";
import type { BornOnDayPage, BornOnPerson, CardMeaning } from "./types";

export type BornOnFaq = {
  question: string;
  answer: string;
};

export type BornOnDayCopy = {
  hook: string;
  mapping: string;
  card_meaning: string;
  notables_intro: string;
  empty_note: string | null;
  faqs: BornOnFaq[];
};

const SENTENCE_RE = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

export function splitSourceSentences(sourceText: string): string[] {
  return sourceText
    .split(SENTENCE_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function firstSentence(sourceText: string): string {
  return splitSourceSentences(sourceText)[0] ?? sourceText.trim();
}

export function bornOnDayCopy(day: BornOnDayPage, meaning: CardMeaning): BornOnDayCopy {
  const solar = solarValue(day.month, day.day);
  const dateLabel = formatMonthDay(day.month, day.day);
  const names = day.people.map((person) => person.name);
  const nameList = oxfordList(names);

  const hook =
    day.people.length === 0
      ? `${dateLabel} maps to the ${meaning.label} on the Card Blueprints calendar. This grounding catalog has no verified notable with a day-precision public date of birth on ${dateLabel}. The page stays. No birthday was invented to fill it.`
      : `${dateLabel} is the ${meaning.label} coordinate. Public, day-precision Wikidata P569 dates place ${nameList} on this day. Those names are citations, not a forecast.`;

  const mapping =
    `Solar value = 55 − (2 × ${day.month} + ${day.day}) = ${solar}. ` +
    (solar <= 0
      ? `Zero sits outside the 1–52 deck, so ${dateLabel} is the Joker. The year is unused.`
      : `That value is the ${meaning.label}. The year of birth is unused. February 29 is computed directly, not remapped to February 28.`);

  const cardMeaning =
    `${dateLabel}'s coordinate is the ${meaning.label} (${meaning.title}). ` +
    `Card Blueprints treats that as a month-and-day position, not a reading of anyone born that day. ` +
    `The card's own language, quoted as system copy rather than biography: ${meaning.sweet_spot || meaning.core_identity}`;

  const notablesIntro =
    day.people.length === 0
      ? `No verified notable from the Wikidata day-precision catalog is listed for ${dateLabel}. Empty days are left empty.`
      : `${day.people.length} ${day.people.length === 1 ? "person" : "people"} in this catalog have a public day-precision date of birth on ${dateLabel}. Each block cites Wikidata (CC0) and Wikipedia (CC BY-SA 4.0). Bios are not invented.`;

  const faqs: BornOnFaq[] = [
    {
      question: `What birth card is ${dateLabel}?`,
      answer: `The ${meaning.label}. ${dateLabel} maps through the public formula 55 − (2 × month + day). December 31 is the Joker. The year is unused.`,
    },
    {
      question: `Who is listed as born on ${dateLabel}?`,
      answer:
        day.people.length === 0
          ? `Nobody in this verified catalog. Year-only dates, Wikidata precision below 11, conflicts, minors, and D3 sensitive descriptions are dropped. A missing name is not filled in from memory.`
          : `${nameList}. Each date is Wikidata P569 at day precision. Wikipedia summaries are attribution only.`,
    },
    {
      question: "Is this fortune-telling?",
      answer:
        "No. A birth card is a calendar coordinate for a month and day. Listing a public birthday does not predict character, career, or fate. The $9 Deep Dive is a written report for a birthday you enter.",
    },
  ];

  return {
    hook,
    mapping,
    card_meaning: cardMeaning,
    notables_intro: notablesIntro,
    empty_note:
      day.people.length === 0
        ? `This ${dateLabel} page is still the live /born-on path. It is grounded with the card coordinate and sources, not with invented famous people.`
        : null,
    faqs,
  };
}

export function notableLead(person: BornOnPerson): string {
  const { year, month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatMonthDay(month, day);
  return `${firstSentence(person.source_text)} Public date of birth: ${dateLabel}, ${year} (Wikidata ${person.qid}, day precision).`;
}

function oxfordList(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
