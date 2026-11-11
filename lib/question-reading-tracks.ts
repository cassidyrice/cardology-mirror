import type { QuestionTrack } from "./question-reading-facts";

export const CARD_BLUEPRINTS_STRIPE_ACCOUNT = "acct_1U1a1dChx1yAVyrs";
export const QUESTION_SLA_SHORT = "Within 48 hours · almost all under 24h";
export const QUESTION_SLA_PROSE = "within 48 hours, with almost all delivered in under 24 hours";

export type DeliveryChannel = "email" | "sms";

export type QuestionOrderStatus =
  | "pending_payment"
  | "generating_angles"
  | "awaiting_approval"
  | "sent"
  | "expired"
  | "failed";

export interface QuestionTrackSpec {
  slug: QuestionTrack;
  title: string;
  shortTitle: string;
  priceDollars: 26 | 39;
  amountCents: 2600 | 3900;
  requiresSecondBirthdate: boolean;
  eyebrow: string;
  tagline: string;
  description: string;
  ctaLabel: string;
}

export const QUESTION_READING_TRACKS: Record<QuestionTrack, QuestionTrackSpec> = {
  "timing-map": {
    slug: "timing-map",
    title: "The 12-Month Timing Map",
    shortTitle: "Timing Question",
    priceDollars: 26,
    amountCents: 2600,
    requiresSecondBirthdate: false,
    eyebrow: "Solo Question · Email or Text",
    tagline: "Your birth date + your real question on timing, work, money, or a move.",
    description:
      "Ask one real question about the year ahead. We pull your 52-day planetary windows, Pluto, Result, and karma cards, Cass personally reviews your spread, and your answer arrives by email or text within 48 hours (almost always under 24 hours).",
    ctaLabel: "Ask a timing question — $26",
  },
  "chemistry-check": {
    slug: "chemistry-check",
    title: "The Chemistry Check",
    shortTitle: "Compatibility Question",
    priceDollars: 39,
    amountCents: 3900,
    requiresSecondBirthdate: true,
    eyebrow: "Two Birthdays · Email or Text",
    tagline: "Two birth dates + the real question between you, answered straight from both spreads.",
    description:
      "Bring both birthdays and what you actually want to know. We map every permanent Life & Ruling Spread seat in both directions plus your overlapping 52-day date windows, Cass approves the read, and it lands in your inbox or texts within 48 hours (almost always under 24 hours).",
    ctaLabel: "Ask a compatibility question — $39",
  },
};

export function isQuestionTrack(value: unknown): value is QuestionTrack {
  return value === "timing-map" || value === "chemistry-check";
}
