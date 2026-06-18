import cardology from "./engine-core/engine.js";
import { parseCard, toLines, type Suit } from "./cards";
import type { ArchetypeDescription, Interpretation } from "./types";

import CARD_DESCRIPTIONS from "./engine-data/card-descriptions.json";
import THREE_LENS from "./card-meanings.json";

const CARD_DESCRIPTIONS_MAP = CARD_DESCRIPTIONS as Record<string, ArchetypeDescription>;
const THREE_LENS_MAP = THREE_LENS as Record<string, Interpretation>;

export type LifePathPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type LifePathRole = {
  position: LifePathPosition;
  key: string;
  title: string;
  shortTitle: string;
  phrase: string;
  constitution: string;
  relationship: string;
};

export type LifePathCard = LifePathRole & {
  card: string;
  label: string;
  suit: Suit | null;
  domain: string;
  titleText: string;
  gift: string;
  shadow: string;
  sweetSpot: string;
};

export type LifePathProfile = {
  birthdate: string;
  label: string;
  birthCard: string;
  birthCardLabel: string;
  moon: LifePathCard;
  pathCards: LifePathCard[];
  allCards: LifePathCard[];
  suitCounts: Record<Suit, number>;
  dominantSuits: Suit[];
};

export type LifePathSharedCard = {
  card: string;
  label: string;
  aRoles: LifePathCard[];
  bRoles: LifePathCard[];
};

export type LifePathComparison = {
  aSeesB: LifePathCard | null;
  bSeesA: LifePathCard | null;
  sharedCards: LifePathSharedCard[];
};

export const LIFE_PATH_ROLES: LifePathRole[] = [
  {
    position: 0,
    key: "moon",
    title: "Moon Influence",
    shortTitle: "Moon",
    phrase: "This supports the life.",
    constitution: "The ground note: what nourishes, steadies, and quietly energizes the person.",
    relationship: "A person with this card can feel nurturing, familiar, intimate, and emotionally close.",
  },
  {
    position: 1,
    key: "birth",
    title: "Primary Energy",
    shortTitle: "Birth",
    phrase: "You shine this light.",
    constitution: "The visible core: the primary gift, default pattern, and main card a person is here to play.",
    relationship: "A person with this card mirrors the self. The connection can feel like kinship or like an uncomfortable reflection.",
  },
  {
    position: 2,
    key: "mercury",
    title: "Mercury Influence",
    shortTitle: "Mercury",
    phrase: "You think like this.",
    constitution: "The mental channel: speech, thought loops, curiosity, argument style, and what the mind keeps returning to.",
    relationship: "A person with this card can become a confidant, conversation partner, or mental mirror.",
  },
  {
    position: 3,
    key: "venus",
    title: "Venus Influence",
    shortTitle: "Venus",
    phrase: "You love like this.",
    constitution: "The love channel: attraction, beauty, softness, pleasure, affection, and relational taste.",
    relationship: "A person with this card can feel magnetic, romantic, beloved, or emotionally desirable.",
  },
  {
    position: 4,
    key: "mars",
    title: "Mars Influence",
    shortTitle: "Mars",
    phrase: "You act like this.",
    constitution: "The action channel: desire, pursuit, anger, drive, competition, and the way goals are attacked.",
    relationship: "A person with this card can spark passion, heat, confrontation, competition, or physical chemistry.",
  },
  {
    position: 5,
    key: "jupiter",
    title: "Jupiter Influence",
    shortTitle: "Jupiter",
    phrase: "You grow from this.",
    constitution: "The expansion channel: opportunity, generosity, prosperity, confidence, and the place life gets bigger.",
    relationship: "A person with this card can expand the world, open doors, bring luck, or inflate appetite.",
  },
  {
    position: 6,
    key: "saturn",
    title: "Saturn Influence",
    shortTitle: "Saturn",
    phrase: "You learn from this.",
    constitution: "The lesson channel: discipline, limits, maturity, health, repetition, and the pattern that will not be skipped.",
    relationship: "A person with this card can teach, test, frustrate, stabilize, or force maturity.",
  },
  {
    position: 7,
    key: "uranus",
    title: "Uranus Influence",
    shortTitle: "Uranus",
    phrase: "This pivots the life.",
    constitution: "The pivot channel: freedom, friendship, surprise, genius, disruption, and the strange turn that changes direction.",
    relationship: "A person with this card can feel friendly, electric, unpredictable, liberating, or uneven.",
  },
  {
    position: 8,
    key: "neptune",
    title: "Neptune Influence",
    shortTitle: "Neptune",
    phrase: "You dream through this.",
    constitution: "The dream channel: fantasy, longing, projection, vision, glamour, spiritual hunger, and the fog around desire.",
    relationship: "A person with this card can become an ideal, a fantasy, a confusion, or a dream that must be made real.",
  },
  {
    position: 9,
    key: "pluto",
    title: "Pluto Influence",
    shortTitle: "Pluto",
    phrase: "This is the shadow to integrate.",
    constitution: "The shadow channel: what the person fears, hides, resists, projects, and eventually has to reclaim.",
    relationship: "A person with this card can expose shadow, obsession, discomfort, deep transformation, or the truth nobody wanted named.",
  },
  {
    position: 10,
    key: "princess",
    title: "The Princess",
    shortTitle: "Princess",
    phrase: "This is the reward to receive.",
    constitution: "The reward channel: the gift a person longs to receive once the earlier cards are handled cleanly.",
    relationship: "A person with this card can feel like grace, reward, sweetness, or the gift the person is learning to accept.",
  },
  {
    position: 11,
    key: "prince",
    title: "The Prince",
    shortTitle: "Prince",
    phrase: "This is the responsibility to take.",
    constitution: "The responsibility channel: what a person must generate on purpose instead of waiting for someone else to carry it.",
    relationship: "A person with this card can call forward responsibility, ownership, courage, and the work that cannot be outsourced.",
  },
  {
    position: 12,
    key: "queen",
    title: "The Queen",
    shortTitle: "Queen",
    phrase: "This is what you learn to embody.",
    constitution: "The embodiment channel: the mature quality a person is learning to live as their own nature.",
    relationship: "A person with this card can model refinement, emotional maturity, stewardship, or the quality being learned.",
  },
  {
    position: 13,
    key: "king",
    title: "The King",
    shortTitle: "King",
    phrase: "This is the commanding power.",
    constitution: "The command channel: the far horizon of mastery, authority, creative power, and earned self-command.",
    relationship: "A person with this card can feel powerful, distant, aspirational, intimidating, or like the future self calling.",
  },
];

const LIFE_PATH_SPREAD_YEAR = "1";
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export function birthCardFromISODate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [, month, day] = date.split("-").map(Number);
  const [birthCard] = cardology.getBirthCard(month, day) as [string, number];
  return birthCard && birthCard !== "Unknown" ? birthCard : null;
}

export function buildLifePathProfile(date: string, label: string): LifePathProfile | null {
  const birthCard = birthCardFromISODate(date);
  if (!birthCard) return null;

  const order = orderedLifeSpread();
  const birthIndex = order.indexOf(birthCard);
  if (birthIndex < 0) return null;

  const moonCode = order[(birthIndex - 1 + order.length) % order.length];
  const pathCodes = [
    birthCard,
    ...Array.from({ length: 12 }, (_, index) => order[(birthIndex + index + 1) % order.length]),
  ];

  const moon = buildLifePathCard(LIFE_PATH_ROLES[0], moonCode);
  const pathCards = pathCodes.map((code, index) => buildLifePathCard(LIFE_PATH_ROLES[index + 1], code));
  const suitCounts = countSuits(pathCards);

  return {
    birthdate: date,
    label,
    birthCard,
    birthCardLabel: cardLabel(birthCard),
    moon,
    pathCards,
    allCards: [moon, ...pathCards],
    suitCounts,
    dominantSuits: dominantSuits(suitCounts),
  };
}

export function compareLifePathProfiles(a: LifePathProfile, b: LifePathProfile): LifePathComparison {
  const aSeesB = findRoleByCard(a, b.birthCard);
  const bSeesA = findRoleByCard(b, a.birthCard);
  const bByCard = new Map<string, LifePathCard[]>();
  for (const card of b.allCards) {
    const existing = bByCard.get(card.card) ?? [];
    existing.push(card);
    bByCard.set(card.card, existing);
  }

  const sharedCards: LifePathSharedCard[] = [];
  const seen = new Set<string>();
  for (const card of a.allCards) {
    if (seen.has(card.card)) continue;
    const matches = bByCard.get(card.card);
    if (!matches) continue;
    seen.add(card.card);
    sharedCards.push({
      card: card.card,
      label: card.label,
      aRoles: a.allCards.filter((item) => item.card === card.card),
      bRoles: matches,
    });
  }

  return { aSeesB, bSeesA, sharedCards };
}

export function constitutionSummary(profile: LifePathProfile): string {
  const primary = role(profile, 1);
  const mercury = role(profile, 2);
  const venus = role(profile, 3);
  const mars = role(profile, 4);
  const saturn = role(profile, 6);
  const pluto = role(profile, 9);
  const king = role(profile, 13);
  const suitPhrase = profile.dominantSuits.map((suit) => suitNoun(suit)).join(" and ");

  return `${profile.label} leans ${suitPhrase || "mixed"} across the Life Path. ${primary.label} is the core note; ${mercury.label} colors the mind, ${venus.label} colors love, and ${mars.label} shows how action heats up. ${saturn.label} names the lesson, ${pluto.label} names the shadow to integrate, and ${king.label} is the command line the path grows toward.`;
}

export function relationshipSentence(ownerLabel: string, otherLabel: string, roleCard: LifePathCard | null): string {
  if (!roleCard) {
    return `${otherLabel}'s birth card does not land inside ${ownerLabel}'s Moon-plus-13 Life Path spectrum. That does not mean there is no connection; it means the first read should come through suits, ruling cards, shared cards, and timing rather than a direct Life Path role.`;
  }
  return `${otherLabel}'s birth card lands in ${ownerLabel}'s ${roleCard.shortTitle} position: ${roleCard.relationship}`;
}

export function role(profile: LifePathProfile, position: LifePathPosition): LifePathCard {
  if (position === 0) return profile.moon;
  const found = profile.pathCards.find((card) => card.position === position);
  if (!found) throw new Error(`Missing Life Path position ${position}`);
  return found;
}

function orderedLifeSpread(): string[] {
  const spread = cardology.SPREADS[LIFE_PATH_SPREAD_YEAR];
  const order: string[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 6; col >= 0; col--) {
      order.push(spread.grid[row][col]);
    }
  }
  for (let i = spread.crown.length - 1; i >= 0; i--) {
    order.push(spread.crown[i]);
  }
  return order;
}

function buildLifePathCard(role: LifePathRole, code: string): LifePathCard {
  const parsed = parseCard(code);
  const description = CARD_DESCRIPTIONS_MAP[code];
  const lens = THREE_LENS_MAP[code];
  return {
    ...role,
    card: code,
    label: cardLabel(code),
    suit: parsed?.suit ?? null,
    domain: parsed?.domain ?? "Card pattern",
    titleText: description?.title ?? lens?.name ?? cardLabel(code),
    gift: firstLine(description?.gifts) || lens?.sweet_spot || role.constitution,
    shadow: firstLine(description?.shadow) || lens?.under || "Watch where this pattern slips out of proportion.",
    sweetSpot: lens?.sweet_spot ?? firstLine(description?.gifts) ?? role.constitution,
  };
}

function findRoleByCard(profile: LifePathProfile, card: string): LifePathCard | null {
  return profile.allCards.find((item) => item.card === card) ?? null;
}

function countSuits(cards: LifePathCard[]): Record<Suit, number> {
  const counts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  for (const card of cards) {
    if (card.suit) counts[card.suit] += 1;
  }
  return counts;
}

function dominantSuits(counts: Record<Suit, number>): Suit[] {
  const max = Math.max(...SUITS.map((suit) => counts[suit]));
  return SUITS.filter((suit) => counts[suit] === max && max > 0);
}

function firstLine(text?: string): string {
  if (!text) return "";
  return toLines(text)[0] ?? "";
}

function cardLabel(code: string): string {
  return parseCard(code)?.label ?? code;
}

function suitNoun(suit: Suit): string {
  switch (suit) {
    case "hearts":
      return "relationship and emotional intelligence";
    case "diamonds":
      return "value, money, taste, and resource intelligence";
    case "clubs":
      return "mind, language, learning, and interpretation";
    case "spades":
      return "work, body, discipline, and transformation";
  }
}
