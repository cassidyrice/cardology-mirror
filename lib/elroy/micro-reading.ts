import cardology from "@/lib/engine-core/engine.js";
import descriptionsJson from "@/lib/engine-data/card-descriptions.json";
import { parseCard } from "@/lib/cards";
import { classifyElroyBirthdate } from "./input";
import { ELROY_COPY_OVERRIDES } from "./copy-overrides";
import type { ElroyReading } from "./types";

type CardDescription = {
  title: string;
  core_identity: string;
  gifts: string;
  shadow: string;
  life_direction: string;
  algorithm_gateway: string;
};

const descriptions = descriptionsJson as Record<string, CardDescription>;

const DISCLAIMER =
  "Use this as a reflection prompt, not a prediction or a substitute for professional advice.";

function firstSentence(value: string): string {
  const match = value.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? value).trim();
}

function cardLabel(code: string): string {
  const card = parseCard(code);
  if (!card) throw new Error(`Invalid card code: ${code}`);
  return card.label;
}

function reflectionQuestion(lifeDirection: string): string {
  const seed = firstSentence(lifeDirection)
    .replace(/^Your curriculum is learning that\s+/i, "")
    .replace(/[.!]$/, "");
  return `Where could you practice this now: ${seed}?`;
}

export function buildElroyMicroReading(birthdate: string): ElroyReading {
  const birth = classifyElroyBirthdate(birthdate);
  if (birth.kind === "joker") {
    throw new Error("Joker reading is not sourced.");
  }

  const [, month, day] = birthdate.split("-").map(Number);
  const rulingRaw = cardology.getPlanetaryRulingCard(month, day) as
    | string
    | string[];
  const rulingCards = Array.isArray(rulingRaw) ? rulingRaw : [rulingRaw];

  const source = descriptions[birth.birthCard];
  if (!source) {
    throw new Error(`Missing description for ${birth.birthCard}`);
  }

  const rulingTone = rulingCards
    .map((code) => descriptions[code]?.title || cardLabel(code))
    .join(" and ");

  const base: ElroyReading["reading"] = {
    core: firstSentence(source.core_identity),
    tension: `${firstSentence(source.shadow)} Your ruling layer adds this pattern: ${rulingTone}.`,
    reflection: reflectionQuestion(source.life_direction),
    disclaimer: DISCLAIMER,
  };

  return {
    card: {
      birthCard: birth.birthCard,
      birthCardLabel: cardLabel(birth.birthCard),
      rulingCards,
    },
    reading: { ...base, ...ELROY_COPY_OVERRIDES[birth.birthCard] },
  };
}
