import { allCardSeo, type CardSeo } from "./seo-cards";
import type { PlanetName } from "./types";

export interface PeriodFilter {
  planet: PlanetName;
  index: number;
  dayRange: string;
  domain: string;
  lens: string;
  practice: string;
  challenge: string;
  support: string;
  prompt: string;
}

export interface PeriodMeaning {
  cardCode: string;
  cardLabel: string;
  cardSlug: string;
  cardColor: string;
  cardTitle: string | null;
  suitDomain: string;
  period: PlanetName;
  periodIndex: number;
  dayRange: string;
  periodDomain: string;
  headline: string;
  essence: string;
  periodLens: string;
  shadow: string;
  alignment: string;
  challenge: string;
  support: string;
  reflectionPrompt: string;
}

export interface CardPeriodMeanings {
  card: {
    code: string;
    label: string;
    slug: string;
    color: string;
    title: string | null;
    suitDomain: string;
  };
  meanings: PeriodMeaning[];
}

export const PERIOD_FILTERS: PeriodFilter[] = [
  {
    planet: "Mercury",
    index: 0,
    dayRange: "Days 1–52",
    domain: "mind, communication, perception",
    lens: "thought, language, curiosity, nervous-system speed, and the story your mind keeps repeating",
    practice: "naming the real question before reacting to the first answer",
    challenge: "noise, overthinking, mixed signals, and trying to solve a feeling with more mental motion",
    support: "clear language, honest questions, clean observation, and one conversation at a time",
    prompt: "What needs a clearer word, question, or conversation right now?",
  },
  {
    planet: "Venus",
    index: 1,
    dayRange: "Days 53–104",
    domain: "relationships, values, love",
    lens: "attachment, attraction, money values, pleasure, reciprocity, and what you keep choosing because it feels familiar",
    practice: "checking whether the exchange is mutual instead of merely familiar",
    challenge: "people-pleasing, withholding, bargaining for affection, or confusing comfort with alignment",
    support: "clean desire, shared value, beauty, repair, and direct care without self-erasure",
    prompt: "Where do love, value, and exchange need to become more honest?",
  },
  {
    planet: "Mars",
    index: 2,
    dayRange: "Days 105–156",
    domain: "action, drive, assertion, conflict",
    lens: "desire, anger, initiation, courage, conflict style, and how you move when pressure asks for a choice",
    practice: "taking the next clean action without turning force into domination",
    challenge: "reactivity, avoidance, impatience, and using conflict to avoid vulnerability",
    support: "courage, clean boundaries, decisive movement, and action that serves the larger pattern",
    prompt: "What action would be direct without being destructive?",
  },
  {
    planet: "Jupiter",
    index: 3,
    dayRange: "Days 157–208",
    domain: "expansion, growth, opportunity, abundance",
    lens: "growth, permission, opportunity, generosity, teaching, faith, and the places where more can either bless or bloat the pattern",
    practice: "expanding what is already honest instead of inflating what is ungrounded",
    challenge: "overpromising, excess, false optimism, and mistaking bigger for better",
    support: "generosity, learning, wise scale, opportunity, and confidence with proportion",
    prompt: "What is ready to grow because it is already rooted?",
  },
  {
    planet: "Saturn",
    index: 4,
    dayRange: "Days 209–260",
    domain: "structure, limits, discipline, accountability",
    lens: "boundaries, responsibility, maturity, consequences, repetition, and the place where the pattern asks to become real",
    practice: "choosing the boundary or discipline that protects the future",
    challenge: "fear, rigidity, shame, delay, and making discipline feel like punishment",
    support: "structure, patience, clean limits, responsibility, and mature follow-through",
    prompt: "What limit would make this pattern healthier instead of smaller?",
  },
  {
    planet: "Uranus",
    index: 5,
    dayRange: "Days 261–312",
    domain: "disruption, innovation, independence, sudden change",
    lens: "freedom, interruption, originality, detachment, community, and the part of the pattern that refuses to stay scripted",
    practice: "making one liberating change without burning down what still works",
    challenge: "rebellion for its own sake, emotional distance, chaos, or mistaking disruption for truth",
    support: "fresh perspective, clean independence, innovation, and room for the pattern to update",
    prompt: "What needs to change because the old script is too small?",
  },
  {
    planet: "Neptune",
    index: 6,
    dayRange: "Days 313–364+",
    domain: "dissolution, dreams, sensitivity, surrender",
    lens: "imagination, endings, compassion, fog, longing, spiritual language, and the place where control softens",
    practice: "letting the unnecessary layer dissolve while keeping one grounded anchor",
    challenge: "confusion, fantasy, avoidance, savior patterns, and making vagueness feel holy",
    support: "compassion, imagination, forgiveness, creative surrender, and quiet integration",
    prompt: "What can soften, release, or become less forced now?",
  },
];

const RANK_THEMES: Record<string, string> = {
  A: "initiation and first contact",
  "2": "exchange, mirroring, and partnership",
  "3": "creative expression, choice, and multiplicity",
  "4": "foundation, stability, and containment",
  "5": "change, movement, and adaptation",
  "6": "responsibility, rhythm, and adjustment",
  "7": "inquiry, refinement, and truth-testing",
  "8": "power, mastery, and force management",
  "9": "release, completion, and compassion",
  "10": "capacity, community, and accumulated momentum",
  J: "experimentation, youth, and fresh perspective",
  Q: "stewardship, care, and embodied wisdom",
  K: "authority, leadership, and mature command",
};

function cleanSecondPerson(text: string): string {
  const stripped = text
    .trim()
    .replace(/^You're\s+/i, "")
    .replace(/^You are\s+/i, "")
    .replace(/^You’re\s+/i, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function rankTheme(card: CardSeo): string {
  return RANK_THEMES[card.rank] ?? "a specific card pattern";
}

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function buildPeriodMeaning(card: CardSeo, filter: PeriodFilter): PeriodMeaning {
  const rank = rankTheme(card);
  const suitDomain = card.suitDomain.toLowerCase();
  const title = card.title ? `, ${card.title}` : "";

  return {
    cardCode: card.code,
    cardLabel: card.label,
    cardSlug: card.slug,
    cardColor: card.color,
    cardTitle: card.title,
    suitDomain: card.suitDomain,
    period: filter.planet,
    periodIndex: filter.index,
    dayRange: filter.dayRange,
    periodDomain: filter.domain,
    headline: `${card.label} through the ${filter.planet} filter`,
    essence: `The ${card.label}${title} brings ${rank} into ${suitDomain}. Its balanced lane is: ${cleanSecondPerson(card.sweetSpot)}`,
    periodLens: `${filter.planet} filters that card through ${filter.lens}. Read this as ${articleFor(filter.planet)} ${filter.planet} 52-day mirror: the same card meaning, but applied to ${filter.domain}.`,
    shadow: `Under-expressed: ${cleanSecondPerson(card.under)} Over-expressed: ${cleanSecondPerson(card.over)} In the ${filter.planet} period, the practical shadow usually shows up as ${filter.challenge}.`,
    alignment: `Alignment asks for the card's middle lane: ${cleanSecondPerson(card.sweetSpot)} In this period, make it concrete by ${filter.practice}.`,
    challenge: `Challenge pattern: ${filter.challenge}. Use the card as a signal to notice where ${suitDomain} is being pushed too far, hidden, or made more dramatic than it needs to be.`,
    support: `Support pattern: ${filter.support}. The ${card.label} can help by translating its core gift into a usable practice for this 52-day window.`,
    reflectionPrompt: filter.prompt,
  };
}

export function buildCardPeriodMeanings(card: CardSeo): CardPeriodMeanings {
  return {
    card: {
      code: card.code,
      label: card.label,
      slug: card.slug,
      color: card.color,
      title: card.title,
      suitDomain: card.suitDomain,
    },
    meanings: PERIOD_FILTERS.map((filter) => buildPeriodMeaning(card, filter)),
  };
}

export function allCardPeriodMeanings(): CardPeriodMeanings[] {
  return allCardSeo().map(buildCardPeriodMeanings);
}
