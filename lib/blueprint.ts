// Deterministic Personal Card Blueprint report builder.
// Assembles the paid report from the existing Cardology engine — no LLM,
// no invented claims. Every section traces to engine data (birth card,
// ruling card, three-position meanings, active planetary period).

import { getReading } from "./engine";
import type { Reading } from "./types";

export interface BlueprintReport {
  birthdate: string;
  birthCard: string;
  birthCardTitle: string;
  birthCardSlug: string;
  rulingCard: string;
  rulingCardTitle: string;
  rulingCardSlug: string;
  suitDomain: string;
  coreIdentity: string;
  gifts: string[];
  shadow: string;
  rulingIdentity: string;
  rulingShadow: string;
  currentChapter: {
    planet: string;
    domain: string;
    card: string;
    meaning: string;
    balanced: string;
    under: string;
    over: string;
  };
  reflectionPrompts: string[];
}

const CARD_SLUG: Record<string, string> = {
  A: "ace", J: "jack", Q: "queen", K: "king",
};

const GLYPH_SUIT: Record<string, string> = {
  "♥": "hearts", "♣": "clubs", "♦": "diamonds", "♠": "spades",
};

export function cardSlugFromCode(code: string): string {
  const rank = code.slice(0, -1);
  const glyph = code.slice(-1);
  const rankSlug = CARD_SLUG[rank] ?? rank.toLowerCase();
  return `${rankSlug}-of-${GLYPH_SUIT[glyph] ?? "hearts"}`;
}

function bullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export async function buildBlueprint(birthdate: string): Promise<BlueprintReport> {
  const r: Reading = await getReading(birthdate);
  const a = r.archetype;
  const ap = r.active_period;

  const reflectionPrompts = [
    `Where in the last month did you catch yourself in the "${a.description.title}" over-drive — and what were you actually protecting?`,
    `The ${ap.bc_card} is governing this stretch of your year through ${ap.domain.toLowerCase()}. What would its balanced version ask of you this week?`,
    `Your ruling layer (${a.prc}) shapes how others first experience you. When has that expression worked *against* what your core card (${a.birth_card}) actually wanted?`,
  ];

  return {
    birthdate,
    birthCard: a.birth_card,
    birthCardTitle: a.description.title,
    birthCardSlug: cardSlugFromCode(a.birth_card),
    rulingCard: a.prc,
    rulingCardTitle: a.prc_description.title,
    rulingCardSlug: cardSlugFromCode(a.prc),
    suitDomain: a.suit_domain,
    coreIdentity: a.description.core_identity,
    gifts: bullets(a.description.gifts),
    shadow: a.description.shadow,
    rulingIdentity: a.prc_description.core_identity,
    rulingShadow: a.prc_description.shadow,
    currentChapter: {
      planet: ap.planet,
      domain: ap.domain,
      card: ap.bc_card,
      meaning: ap.interpretation_bc.name,
      balanced: ap.interpretation_bc.sweet_spot,
      under: ap.interpretation_bc.under,
      over: ap.interpretation_bc.over,
    },
    reflectionPrompts,
  };
}
