import cardology from "./engine-core/engine.js";
import { resolvePublicBirth } from "./birth-card-truth";
import { parseCard, toLines, type Suit } from "./cards";
import { slugFor } from "./seo-cards";
import type { ArchetypeDescription, Interpretation, PlanetName } from "./types";

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
    phrase: "This holds you up. You rarely notice.",
    constitution: "The ground note: what feeds you, steadies you, and quietly keeps you running.",
    relationship: "A person with this card feels nurturing, familiar, intimate, and close. Like home, with the same arguments.",
  },
  {
    position: 1,
    key: "birth",
    title: "Primary Card",
    shortTitle: "Birth",
    phrase: "You shine this light. Everyone sees it.",
    constitution: "The visible core: the main gift, the default pattern, and the main card you are here to play.",
    relationship: "A person with this card is your mirror. It feels like kinship, or like catching yourself in a shop window.",
  },
  {
    position: 2,
    key: "mercury",
    title: "Mercury Influence",
    shortTitle: "Mercury",
    phrase: "You think like this. Loudly.",
    constitution: "The mental channel: speech, thought loops, curiosity, argument style, and the thing your mind keeps reopening.",
    relationship: "A person with this card becomes a confidant, a conversation partner, or a mental mirror. Sometimes the 2am text.",
  },
  {
    position: 3,
    key: "venus",
    title: "Venus Influence",
    shortTitle: "Venus",
    phrase: "You love like this. Obviously.",
    constitution: "The love channel: attraction, beauty, softness, pleasure, affection, and your taste in people.",
    relationship: "A person with this card feels magnetic, romantic, beloved, or hard to stop thinking about.",
  },
  {
    position: 4,
    key: "mars",
    title: "Mars Influence",
    shortTitle: "Mars",
    phrase: "You act like this. Fast.",
    constitution: "The action channel: desire, pursuit, anger, drive, competition, and the way you attack a goal.",
    relationship: "A person with this card sparks passion, heat, confrontation, competition, or physical chemistry. Often in that order.",
  },
  {
    position: 5,
    key: "jupiter",
    title: "Jupiter Influence",
    shortTitle: "Jupiter",
    phrase: "You grow from this.",
    constitution: "The expansion channel: opportunity, generosity, prosperity, confidence, and the place life gets bigger.",
    relationship: "A person with this card expands your world, opens doors, brings luck, or makes you want more of everything.",
  },
  {
    position: 6,
    key: "saturn",
    title: "Saturn Influence",
    shortTitle: "Saturn",
    phrase: "You learn from this. Eventually.",
    constitution: "The lesson channel: discipline, limits, maturity, health, repetition, and the pattern that refuses to be skipped.",
    relationship: "A person with this card teaches, tests, frustrates, stabilizes, or forces you to grow up.",
  },
  {
    position: 7,
    key: "uranus",
    title: "Uranus Influence",
    shortTitle: "Uranus",
    phrase: "This turns the whole thing sideways.",
    constitution: "The pivot channel: freedom, friendship, surprise, genius, disruption, and the strange turn that changes direction.",
    relationship: "A person with this card feels friendly, electric, unpredictable, liberating, or uneven. Rarely boring.",
  },
  {
    position: 8,
    key: "neptune",
    title: "Neptune Influence",
    shortTitle: "Neptune",
    phrase: "You dream through this. Mostly at night.",
    constitution: "The dream channel: fantasy, longing, projection, vision, glamour, spiritual hunger, and the fog around desire.",
    relationship: "A person with this card becomes an ideal, a fantasy, a confusion, or a dream you have to make real. Check the fog.",
  },
  {
    position: 9,
    key: "pluto",
    title: "Pluto Influence",
    shortTitle: "Pluto",
    phrase: "This is the shadow you have to integrate.",
    constitution: "The shadow channel: what you fear, hide, resist, project onto other people, and eventually have to take back.",
    relationship: "A person with this card exposes shadow, obsession, discomfort, deep transformation, or the truth nobody wanted said out loud.",
  },
  {
    position: 10,
    key: "princess",
    title: "The Princess",
    shortTitle: "Princess",
    phrase: "This is the reward. Let yourself have it.",
    constitution: "The reward channel: the gift you want once the earlier cards are handled cleanly.",
    relationship: "A person with this card feels like grace, reward, sweetness, or a gift you are still learning to accept without flinching.",
  },
  {
    position: 11,
    key: "prince",
    title: "The Prince",
    shortTitle: "Prince",
    phrase: "This is the responsibility. Pick it up.",
    constitution: "The responsibility channel: what you have to make on purpose instead of waiting for someone else to carry it.",
    relationship: "A person with this card calls up responsibility, ownership, courage, and the work you cannot outsource.",
  },
  {
    position: 12,
    key: "queen",
    title: "The Queen",
    shortTitle: "Queen",
    phrase: "This is what you learn to embody.",
    constitution: "The embodiment channel: the mature quality you are learning to live as your own nature.",
    relationship: "A person with this card models refinement, emotional maturity, stewardship, or the exact quality you are still practicing.",
  },
  {
    position: 13,
    key: "king",
    title: "The King",
    shortTitle: "King",
    phrase: "This is the commanding power. Earn it.",
    constitution: "The command channel: the far horizon of mastery, authority, creative power, and earned self-command.",
    relationship: "A person with this card feels powerful, distant, aspirational, intimidating, or like your future self calling. Pick up.",
  },
];

const LIFE_PATH_SPREAD_YEAR = "1";
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export function birthCardFromISODate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [, month, day] = date.split("-").map(Number);
  const resolved = resolvePublicBirth(month, day);
  // Joker has no Life Spread position (cardsFrom("Joker") is null). Callers
  // (calculator UI) must branch on the Joker case explicitly rather than
  // receiving a silently wrong K♠ profile.
  if (resolved.kind === "joker") return null;
  return resolved.code !== "Unknown" ? resolved.code : null;
}

// Card-keyed profile: everything in LifePathProfile except the birthdate,
// which a card-keyed caller does not have (no fake empty string).
export type LifePathCardProfile = Omit<LifePathProfile, "birthdate">;

export function buildLifePathProfileForCard(
  birthCard: string,
  label?: string,
): LifePathCardProfile | null {
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
    label: label ?? cardLabel(birthCard),
    birthCard,
    birthCardLabel: cardLabel(birthCard),
    moon,
    pathCards,
    allCards: [moon, ...pathCards],
    suitCounts,
    dominantSuits: dominantSuits(suitCounts),
  };
}

export function buildLifePathProfile(date: string, label: string): LifePathProfile | null {
  const birthCard = birthCardFromISODate(date);
  if (!birthCard) return null;
  const profile = buildLifePathProfileForCard(birthCard, label);
  if (!profile) return null;
  return { ...profile, birthdate: date };
}

// --- Public Life Spread export (indexable surfaces) --------------------------
//
// Doc-sourced positions only (docs/reading-interpretation-reference.md §6 to §7):
// Moon + Mercury→Result (birth card is the page subject / root birthCard field,
// not a positions[] row) + Environment/Displacement karma pair.
// The Princess/Prince/Queen/King extension in LIFE_PATH_ROLES is calculator-only
// pending a doctrine ruling; it must never appear in this export.
// Vocabulary: "Result / Cosmic Reward" (doc), never "Princess".

export type LifeSpreadRole =
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "result";

export type PublicLifeSpreadPosition = {
  role: LifeSpreadRole;
  // Only the seven 52-day period positions carry a planet. Pluto and Result
  // are the lifetime transformation pair (doc §6), not planets or periods.
  planet: PlanetName | null;
  title: string;
  code: string;
  // Engine-owned link target for internal mesh into /birth-card/<slug>.
  // null only if code is unparsable (should not happen for walk cards).
  slug: string | null;
  label: string;
  suit: Suit | null;
  gift: string;
  shadow: string;
  relationship: string;
};

function positionSlug(code: string): string | null {
  const parsed = parseCard(code);
  return parsed ? slugFor(parsed.rank, parsed.suit) : null;
}

export type PublicLifeSpread = {
  birthCard: string;
  birthCardLabel: string;
  // Board text "Moon + birth + Mercury→Result" resolves to THIS shape: the
  // birth card is the page subject on /birth-card/<slug>, so it is exposed at
  // the root rather than as a self-linking row inside positions[].
  birthCardSlug: string | null;
  positions: PublicLifeSpreadPosition[]; // moon first, then Mercury→Result
  // Same derivation the card pages already use via CardSeo.karma, owned here
  // so one page never renders spread data from two different builders.
  karma: { environment: string; displacement: string } | null;
};

const RESULT_TITLE = "Result / Cosmic Reward";

// The seven 52-day period positions, in walk order. Typed as PlanetName so the
// "exactly these seven planets" guarantee is enforced by the compiler, not only
// by the count assert in scripts/validate-public-truth.ts.
const PUBLIC_PLANETS: readonly PlanetName[] = [
  "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune",
];

export function buildPublicLifeSpread(birthCard: string): PublicLifeSpread | null {
  const profile = buildLifePathProfileForCard(birthCard);
  if (!profile) return null;

  // Mercury→Result must equal the engine walk exactly (one-walk invariant,
  // asserted in scripts/validate-public-truth.ts for all 52 cards).
  const line = cardology.cardsFrom(birthCard, 1, 9) as string[] | null;
  if (!line || line.length < 9) return null;

  const positions: PublicLifeSpreadPosition[] = [];

  const moon = profile.moon;
  positions.push({
    role: "moon",
    planet: null,
    title: moon.title,
    code: moon.card,
    slug: positionSlug(moon.card),
    label: moon.label,
    suit: moon.suit,
    gift: moon.gift,
    shadow: moon.shadow,
    // Doc §9 sources Moon as a relationship connection; public copy leads
    // with the relationship line, not the self "constitution" line.
    relationship: moon.relationship,
  });

  // Positions 2 to 9 in LIFE_PATH_ROLES are Mercury→Pluto; their walk cards are
  // line[0..7]. line[8] is Result/Cosmic Reward (doc vocabulary; the
  // LIFE_PATH_ROLES "Princess" copy is quarantined and not used here).
  for (let index = 0; index < 8; index++) {
    const role = LIFE_PATH_ROLES[index + 2];
    const built = buildLifePathCard(role, line[index]);
    positions.push({
      role: role.key as LifeSpreadRole,
      planet: PUBLIC_PLANETS[index] ?? null,
      title: role.title,
      code: built.card,
      slug: positionSlug(built.card),
      label: built.label,
      suit: built.suit,
      gift: built.gift,
      shadow: built.shadow,
      relationship: built.relationship,
    });
  }

  const resultBuilt = buildLifePathCard(
    { ...LIFE_PATH_ROLES[10], title: RESULT_TITLE, shortTitle: "Result" },
    line[8],
  );
  positions.push({
    role: "result",
    planet: null,
    title: RESULT_TITLE,
    code: resultBuilt.card,
    slug: positionSlug(resultBuilt.card),
    label: resultBuilt.label,
    suit: resultBuilt.suit,
    gift: resultBuilt.gift,
    shadow: resultBuilt.shadow,
    // Paraphrase of docs/reading-interpretation-reference.md §6 (Result /
    // Cosmic Reward: the reward available once the Pluto transformation is
    // met). Engine-authored connective prose, not doc verbatim; app copy may
    // override it.
    relationship: `The ${resultBuilt.label} is the reward position: the gift waiting after the Pluto card's transformation is handled honestly. Not skipped. Handled.`,
  });

  const karmaRaw = cardology.getEnvironmentDisplacement(birthCard, 1);

  return {
    birthCard,
    birthCardLabel: profile.birthCardLabel,
    birthCardSlug: positionSlug(birthCard),
    positions,
    karma: karmaRaw
      ? { environment: karmaRaw.environment, displacement: karmaRaw.displacement }
      : null,
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

  return `${profile.label} leans ${suitPhrase || "mixed"} across the Life Path. ${primary.label} is the core note. ${mercury.label} colors the mind, ${venus.label} colors love, and ${mars.label} shows how action heats up. ${saturn.label} names the lesson you keep repeating. ${pluto.label} names the shadow to integrate. ${king.label} is the command line the path grows toward, slowly.`;
}

export function relationshipSentence(ownerLabel: string, otherLabel: string, roleCard: LifePathCard | null): string {
  if (!roleCard) {
    return `${otherLabel}'s birth card does not land inside ${ownerLabel}'s Moon-plus-13 Life Path spectrum. That does not mean there is no connection. It means the first read comes through suits, ruling cards, shared cards, and timing instead of a direct Life Path role. Calm down.`;
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
    shadow: firstLine(description?.shadow) || lens?.under || "Watch where this pattern slips out of proportion. It already has.",
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
