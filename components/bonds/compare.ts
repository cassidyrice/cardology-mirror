// Pure, card-faithful comparison logic for the Bonds feature.
// Derives observations strictly from the two birth cards (suit + rank) and
// each person's gifts/shadow text. No invented chemistry — every line is
// traceable to an actual card property.

import { parseCard, SUIT_DOMAIN, toLines, type Suit } from "@/lib/cards";
import type { Reading } from "@/lib/types";

export interface Person {
  name: string;
  reading: Reading;
}

export interface BondObservation {
  kind: "shared" | "complement" | "tension" | "gift-shadow";
  label: string;
  text: string;
}

export interface BondAnalysis {
  observations: BondObservation[];
  questions: string[];
  sharedSuit: boolean;
}

// Numeric weight for a rank, used to reason about "who carries more force"
// in a shared suit — purely from the card, not personality guessing.
const RANK_VALUE: Record<string, number> = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13,
};

// Suits that sit "across" from each other in temperament.
// hearts (connection/feeling) <-> spades (will/transformation)
// diamonds (values/resource) <-> clubs (mind/communication)
const OPPOSITE: Record<Suit, Suit> = {
  hearts: "spades",
  spades: "hearts",
  diamonds: "clubs",
  clubs: "diamonds",
};

const SUIT_NOUN: Record<Suit, string> = {
  hearts: "the heart",
  diamonds: "value and worth",
  clubs: "the mind",
  spades: "will and change",
};

const SUIT_VERB: Record<Suit, string> = {
  hearts: "feel and relate",
  diamonds: "weigh what things are worth",
  clubs: "think and talk it through",
  spades: "push, work, and transform",
};

function firstName(name: string): string {
  return (name || "they").trim().split(/\s+/)[0] || "they";
}

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function compareReadings(a: Person, b: Person): BondAnalysis {
  const cardA = parseCard(a.reading.archetype.birth_card);
  const cardB = parseCard(b.reading.archetype.birth_card);
  const nameA = firstName(a.name);
  const nameB = firstName(b.name);

  const observations: BondObservation[] = [];
  const questions: string[] = [];

  if (!cardA || !cardB) {
    return { observations, questions, sharedSuit: false };
  }

  const titleA = a.reading.archetype.description.title.replace(/^The /, "");
  const titleB = b.reading.archetype.description.title.replace(/^The /, "");
  const giftsA = toLines(a.reading.archetype.description.gifts);
  const giftsB = toLines(b.reading.archetype.description.gifts);

  const sharedSuit = cardA.suit === cardB.suit;
  const opposite = OPPOSITE[cardA.suit] === cardB.suit;

  // 1. Suit relationship — shared language, complementary, or oppositional.
  if (sharedSuit) {
    const stronger =
      RANK_VALUE[cardA.rank] >= RANK_VALUE[cardB.rank] ? nameA : nameB;
    observations.push({
      kind: "shared",
      label: "Shared language",
      text: `You both run in ${cardA.suit} — ${lower(
        SUIT_DOMAIN[cardA.suit],
      )}. ${nameA}'s ${cardA.label} and ${nameB}'s ${cardB.label} reach for the same domain, so you tend to ${SUIT_VERB[cardA.suit]} in the same key. The risk of sameness: you can amplify each other's instincts instead of balancing them. ${stronger} tends to carry the heavier charge here.`,
    });
  } else if (opposite) {
    observations.push({
      kind: "complement",
      label: "Opposite domains",
      text: `${nameA} leads from ${SUIT_NOUN[cardA.suit]} (${cardA.label}) while ${nameB} leads from ${SUIT_NOUN[cardB.suit]} (${cardB.label}). These are facing domains — they can complete each other or talk past each other. Where one reaches for ${lower(SUIT_DOMAIN[cardA.suit])}, the other reaches for ${lower(SUIT_DOMAIN[cardB.suit])}. The work is translation, not agreement.`,
    });
  } else {
    observations.push({
      kind: "complement",
      label: "Adjacent domains",
      text: `${nameA}'s ${cardA.label} works in ${lower(
        SUIT_DOMAIN[cardA.suit],
      )}; ${nameB}'s ${cardB.label} works in ${lower(
        SUIT_DOMAIN[cardB.suit],
      )}. Different but not opposed — you each cover ground the other tends to skip. The pattern is hand-off: what's effortless for one is the other's growth edge.`,
    });
  }

  // 2. Rank dynamic — same family vs. distance.
  const rankGap = Math.abs(RANK_VALUE[cardA.rank] - RANK_VALUE[cardB.rank]);
  if (cardA.rank === cardB.rank) {
    observations.push({
      kind: "shared",
      label: "Matched rank",
      text: `You share the same rank — both ${cardA.rank}s. That's a rare structural echo: you meet life at a similar pitch and pace, which feels like instant recognition. Watch for the blind spot you also share, since neither of you naturally checks it.`,
    });
  } else if (rankGap >= 7) {
    observations.push({
      kind: "complement",
      label: "Different registers",
      text: `${cardA.label} and ${cardB.label} sit far apart in rank. One of you tends to move in a more grounded, building register, the other in a more expansive or commanding one. That distance is useful — it keeps you from collapsing into a single tempo.`,
    });
  }

  // 3 & 4. Where each one's gift meets the other's shadow.
  observations.push({
    kind: "gift-shadow",
    label: `${nameA}'s gift, ${nameB}'s edge`,
    text: `${nameA}, the ${lower(titleA)}, brings: ${
      giftsA[0] ? lower(giftsA[0]) : "a clear strength"
    }. ${nameB}'s shadow is the pull toward ${shadowGist(
      b.reading.archetype.description.shadow,
    )} — so ${nameA}'s steadiness here can either steady ${nameB} or, if it tips into control, press exactly on that bruise.`,
  });

  observations.push({
    kind: "gift-shadow",
    label: `${nameB}'s gift, ${nameA}'s edge`,
    text: `${nameB}, the ${lower(titleB)}, brings: ${
      giftsB[0] ? lower(giftsB[0]) : "a clear strength"
    }. ${nameA}'s shadow leans toward ${shadowGist(
      a.reading.archetype.description.shadow,
    )} — meaning ${nameB} can offer ${nameA} a counterweight, as long as it isn't read as a challenge.`,
  });

  // Reflective questions (the pair sits with these together).
  if (sharedSuit) {
    questions.push(
      `Where does running in the same ${cardA.suit} key make you feel understood — and where does it just double a blind spot?`,
    );
  } else {
    questions.push(
      `When ${nameA} reaches for ${lower(
        SUIT_DOMAIN[cardA.suit],
      )} and ${nameB} reaches for ${lower(
        SUIT_DOMAIN[cardB.suit],
      )}, do you translate for each other — or wait to be understood?`,
    );
  }
  questions.push(
    `Name one moment lately where one of you offered a gift and the other received it as pressure. What card was speaking?`,
  );

  return { observations, questions, sharedSuit };
}

// Compress the engine's long shadow paragraph into a short, faithful gist.
function shadowGist(shadow: string): string {
  const first = (shadow || "").split(/(?<=[.!?])\s/)[0] || shadow;
  return lower(first.replace(/[.!?]+$/, "")).trim() || "an old protection";
}
